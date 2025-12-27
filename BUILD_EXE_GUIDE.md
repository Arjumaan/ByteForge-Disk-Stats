# Building ByteForge Stats Board as .EXE

This guide will help you create a standalone Windows executable (.exe) that others can use without installing Node.js or any dependencies.

## 📋 Prerequisites

Before building, ensure you have:
- ✅ Node.js installed (for building only, end users won't need it)
- ✅ All dependencies installed
- ✅ Client app built

---

## 🚀 Quick Build (Recommended)

### Step 1: Install Dependencies

```bash
# Install root dependencies (electron & electron-builder)
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### Step 2: Build the Frontend

```bash
cd client
npm run build
cd ..
```

### Step 3: Create the .EXE

```bash
# This will create both installer and portable .exe
npm run dist:win
```

**Output Location:** `dist-electron/`

You'll get:
- ✅ **ByteForge Stats Board Setup 1.0.0.exe** - Full installer (recommended)
- ✅ **ByteForge-Portable-1.0.0.exe** - Portable version (no installation needed)

---

## 📦 What Gets Packaged

The .exe includes:
- ✅ Complete React frontend (built)
- ✅ Node.js backend server
- ✅ All dependencies
- ✅ Electron runtime
- ✅ System tray icon
- ✅ Auto-start server

**Total Size:** ~150-200 MB (includes everything needed to run)

---

## 🎯 Distribution Options

### Option 1: Installer (.exe)
**File:** `ByteForge Stats Board Setup 1.0.0.exe`
- Users run the installer
- Installs to Program Files
- Creates desktop shortcut
- Adds to Start Menu
- Can be uninstalled normally

### Option 2: Portable (.exe)
**File:** `ByteForge-Portable-1.0.0.exe`
- Single executable file
- No installation required
- Can run from USB drive
- Perfect for testing

---

## 🔧 Build Options

### Build Installer Only
```bash
npm run dist:win
```

### Build Portable Only
```bash
electron-builder --win portable
```

### Test Without Building
```bash
# Run in Electron (for testing)
npm run electron
```

---

## 🖼️ Custom Icon (Optional)

To add a custom icon:

1. Create a 256x256 PNG icon
2. Convert to .ico format (use online converter)
3. Save as `build/icon.ico`
4. Rebuild: `npm run dist:win`

---

## 📝 Build Configuration

The build settings are in `package.json` under `"build"`:

```json
{
  "build": {
    "appId": "com.byteforge.statsboard",
    "productName": "ByteForge Stats Board",
    "win": {
      "target": ["nsis", "portable"],
      "requestedExecutionLevel": "requireAdministrator"
    }
  }
}
```

**Key Settings:**
- `requestedExecutionLevel: "requireAdministrator"` - Requests admin rights (needed for CPU temperature, etc.)
- `oneClick: false` - Users can choose install location
- `createDesktopShortcut: true` - Creates desktop icon

---

## 🚨 Important Notes

### Administrator Privileges
The app requests admin rights because some features need it:
- CPU temperature monitoring
- Disk cleanup operations
- Registry access
- Process management

Users will see a UAC prompt when launching.

### Antivirus False Positives
Some antivirus software may flag the .exe as suspicious because:
- It's unsigned (code signing certificate costs money)
- It requests admin privileges
- It monitors system resources

**Solution:** 
- Add exception in antivirus
- Or purchase a code signing certificate (~$100/year)

---

## 📤 Sharing Your .EXE

### For End Users:

**Installer Version:**
1. Share `ByteForge Stats Board Setup 1.0.0.exe`
2. Users run it and follow the installer
3. App appears in Start Menu

**Portable Version:**
1. Share `ByteForge-Portable-1.0.0.exe`
2. Users can run it directly
3. No installation needed

### File Size:
- Installer: ~150 MB
- Portable: ~150 MB
- Compressed (ZIP): ~50-60 MB

**Tip:** Compress with 7-Zip or WinRAR before sharing to reduce download size.

---

## 🔄 Updating the App

To release a new version:

1. Update version in `package.json`:
   ```json
   "version": "1.1.0"
   ```

2. Rebuild:
   ```bash
   npm run dist:win
   ```

3. New files will have updated version number:
   - `ByteForge Stats Board Setup 1.1.0.exe`

---

## 🐛 Troubleshooting

### "electron-builder not found"
```bash
npm install electron-builder --save-dev
```

### Build fails with "Cannot find module"
```bash
# Reinstall all dependencies
rm -rf node_modules
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### .exe doesn't start
- Check if antivirus blocked it
- Run as Administrator
- Check Windows Event Viewer for errors

### App window is blank
- Make sure you ran `npm run build` in client folder first
- Check `client/dist` folder exists

---

## ✅ Final Checklist

Before distributing:
- [ ] Test the .exe on a clean Windows machine
- [ ] Verify all features work
- [ ] Check admin privileges prompt appears
- [ ] Test both installer and portable versions
- [ ] Create a README for end users
- [ ] Compress the .exe for easier sharing

---

## 📧 Support

If users encounter issues:
1. Check Windows version (Windows 10/11 required)
2. Ensure they have admin rights
3. Disable antivirus temporarily
4. Check firewall isn't blocking port 3001

---

**Your app is now ready to be shared as a standalone .exe! 🎉**
