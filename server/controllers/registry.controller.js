const { exec } = require("child_process");
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * GET /registry
 * Reads real Windows registry values via PowerShell
 */
async function readRegistry(req, res) {
  try {
    if (process.platform !== "win32") {
      // Mock data for non-windows dev
      return res.json([
        { name: "ProductName", value: "Non-Windows Env" },
        { name: "Status", value: "Emulated" }
      ]);
    }

    const psCmd = `
      $ErrorActionPreference = 'SilentlyContinue'
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      $k = Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion'
      
      $out = [ordered]@{
          ProductName = $k.ProductName
          DisplayVersion = if ($k.DisplayVersion) { $k.DisplayVersion } else { $k.ReleaseId }
          CurrentBuild = $k.CurrentBuild
          CurrentBuildNumber = $k.CurrentBuildNumber
          EditionID = $k.EditionID
          InstallationType = $k.InstallationType
          RegisteredOwner = $k.RegisteredOwner
      }
      
      $out | ConvertTo-Json
    `;

    // Safe execution using Base64
    const encoded = Buffer.from(psCmd, 'utf16le').toString('base64');

    const { stdout } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, {
      maxBuffer: 5 * 1024 * 1024
    });

    if (!stdout || !stdout.trim()) {
      return res.json([]);
    }

    const parsed = JSON.parse(stdout);

    // Convert to [{name, value}] format expected by frontend
    const result = Object.keys(parsed).map((k) => ({
      name: k,
      value: parsed[k] || "N/A",
    }));

    res.json(result);

  } catch (err) {
    console.error("readRegistry error:", err);
    res.status(500).json({ error: "Failed to read registry" });
  }
}

module.exports = {
  readRegistry,
};
