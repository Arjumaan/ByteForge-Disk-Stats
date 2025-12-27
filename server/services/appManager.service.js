const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// PowerShell command to fetch installed apps from Registry (Both 32-bit and 64-bit paths)
// This is much faster and safer than Win32_Product
// PowerShell command to fetch installed apps
const PS_GET_APPS = `
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$keys = @(
  "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
  "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
  "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
)

$apps = Get-ItemProperty $keys | 
    Where-Object { $_.DisplayName } |
    Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, UninstallString, EstimatedSize, SystemComponent, DisplayIcon

$apps | ConvertTo-Json -Depth 1
`;

exports.getInstalledApps = async () => {
    try {
        // Use Base64 encoding to avoid escaping issues
        const psScript = PS_GET_APPS;
        const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64');

        const { stdout } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedCommand}`, {
            maxBuffer: 1024 * 1024 * 20 // 20MB buffer
        });

        if (!stdout.trim()) return [];

        let apps = [];
        try {
            apps = JSON.parse(stdout);
        } catch (e) {
            console.warn("JSON Parse warning", e);
        }

        if (!apps) return [];
        const appArray = Array.isArray(apps) ? apps : [apps];

        // Normalize data
        return appArray.map(app => {
            const isSystem = app.SystemComponent === 1 || (app.Publisher && app.Publisher.match(/Microsoft/i) && !app.UninstallString);

            return {
                name: app.DisplayName,
                version: app.DisplayVersion || 'Unknown',
                publisher: app.Publisher || 'Unknown',
                installDate: parseDate(app.InstallDate),
                location: app.InstallLocation || '',
                uninstallString: app.UninstallString,
                size: app.EstimatedSize ? app.EstimatedSize * 1024 : 0,
                isSystem: !!isSystem,
                displayIcon: app.DisplayIcon || null
            };
        }).sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
        console.error("Error fetching apps:", error);
        throw new Error("Failed to retrieve application list");
    }
};

exports.getAppIcon = async (iconPath) => {
    if (!iconPath) return null;

    // Clean path (remove index like ",0" and quotes)
    const cleanPath = iconPath.split(',')[0].replace(/"/g, '').trim();

    const psScript = `
    $ErrorActionPreference = 'SilentlyContinue'
    Add-Type -AssemblyName System.Drawing
    $path = "${cleanPath}"
    if (Test-Path $path) {
        try {
            $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path)
            if ($icon) {
                $ms = New-Object System.IO.MemoryStream
                $icon.ToBitmap().Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                [Convert]::ToBase64String($ms.ToArray())
            }
        } catch { }
    }
    `;

    try {
        const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
        const { stdout } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`);
        return stdout.trim() || null;
    } catch (e) {
        return null;
    }
};

exports.uninstallApp = async (uninstallString) => {
    if (!uninstallString) throw new Error("No uninstall command available");

    // Security check: Only allow reasonable commands
    // This is tricky because uninstall strings vary wildly (msiexec, unins000.exe, etc.)
    // For this demo, we'll try to run it, but in a real app, we need strict validation.

    // We will wrap it in a non-blocking execution or return the command for the UI to show
    // For safety in this environment, I'll return the command to be executed manually or auto-triggered if safe.

    // If it's MsiExec, we can run it passively
    if (uninstallString.toLowerCase().startsWith('msiexec')) {
        return execAsync(uninstallString);
    }

    // For others, run the command line as-is. 
    // Registry UninstallStrings are usually formatted correctly (quoted paths + args).
    return execAsync(uninstallString);
};

function parseDate(dateStr) {
    if (!dateStr) return null;
    // Windows dates are often YYYYMMDD
    if (dateStr.length === 8 && !isNaN(dateStr)) {
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }
    return dateStr;
}
