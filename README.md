# ByteForge Stats Board

A comprehensive Windows system monitoring and optimization tool built with React and Node.js. Monitor hardware health, manage applications, clean junk files, and optimize your system performance - all from a beautiful, modern dashboard.

![ByteForge Stats Board](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## 🚀 Features

### 📊 **System Monitoring**
- **Real-time Dashboard**: Live CPU, RAM, disk usage, and network statistics
- **Hardware Health**: Detailed CPU, memory, GPU, and storage information with health alerts
- **Software Health**: OS details, environment info, and process statistics
- **Power Management**: Battery status, charging info, and power consumption tracking
- **Network Monitor**: Active connections, bandwidth usage, and internet speed test

### 🧹 **System Optimization**
- **Disk Space Analyzer**: Visual breakdown of disk usage with interactive charts
- **Junk File Cleaner**: Scan and remove temporary files, cache, and system junk
- **Duplicate Finder**: Complete C: and D: drive scan for duplicate files ≥1MB
- **Application Manager**: View, manage, and uninstall installed applications
- **Registry Viewer**: Browse Windows registry entries safely

### 💻 **Process Management**
- **Task Manager**: View and kill processes with categorization (User/System/High Impact)
- **Process Tree**: Hierarchical view of running processes
- **Live Event Logs**: Real-time Windows event monitoring

### 📈 **Reporting & Analytics**
- **System Reports**: Generate comprehensive PDF and JSON reports
- **Storage Growth Trends**: Track disk usage over time
- **Historical Data**: View system performance history

### ⚙️ **Advanced Settings**
- **Dark Mode**: Full dark theme support
- **Auto-Refresh**: Configurable refresh intervals (1s - 30s)
- **Cleanup Modes**: Safe, Aggressive, or Custom cleanup strategies
- **Safety Lock**: Prevent accidental deletion of recent files
- **Export/Import**: Backup and restore settings

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Tremor UI Components
- Recharts for data visualization
- Lucide React Icons
- Tailwind CSS
- Socket.IO Client

**Backend:**
- Node.js & Express
- Socket.IO for real-time updates
- systeminformation library
- Worker Threads for intensive tasks
- PowerShell integration for Windows APIs

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- Windows 10/11
- Administrator privileges (recommended for full features)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/byteforge-stats-board.git
cd byteforge-stats-board
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Build the client**
```bash
npm run build
```

5. **Start the server**
```bash
cd ../server
node server.js
```

6. **Access the application**
Open your browser and navigate to:
```
http://localhost:3001
```

## 🚀 Quick Start

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd server
node server.js
```

**Terminal 2 - Start Frontend Dev Server:**
```bash
cd client
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Production Mode

```bash
# Build frontend
cd client
npm run build

# Start server (serves built frontend)
cd ../server
node server.js
```

Application available at `http://localhost:3001`

## 📖 Usage Guide

### Dashboard
- View real-time system statistics
- Quick access to utilities via "Quick Utilities" panel
- Monitor storage status across all drives

### Duplicate Finder
1. Navigate to "Duplicate Finder" from sidebar
2. Click "Scan Both Drives" (scans C: and D:)
3. Wait for scan to complete (10-30 minutes for thorough scan)
4. Review duplicate groups
5. Click "Delete All Duplicates" or delete individually

### Hardware Health
- View detailed hardware specifications
- Monitor CPU temperature (requires admin privileges)
- Check battery health and power status
- Get alerts for high temperatures or failing components

### System Reports
- Generate comprehensive PDF reports
- Download full JSON system snapshots
- Includes hardware, software, network, and storage data

## ⚙️ Configuration

### Settings Page
- **Scanner Rules**: Adjust scan depth and excluded folders
- **Safety & Notifications**: Configure cleanup safety lock
- **Appearance**: Toggle dark mode and compact view
- **Performance**: Set auto-refresh intervals
- **Data Management**: Clear cache, export settings

### Environment Variables
Create a `.env` file in the server directory:
```env
PORT=3001
NODE_ENV=production
```

## 🔒 Security & Safety

- **Safety Lock**: Prevents deletion of files modified in last 24 hours
- **Confirmation Dialogs**: Double confirmation for destructive actions
- **System Folder Protection**: Critical Windows folders are excluded from scans
- **Read-Only Registry**: Registry viewer is read-only by default

## 🐛 Troubleshooting

### CPU Temperature Shows "N/A"
- Run the application as Administrator
- Some laptops don't expose temperature sensors via WMI

### Duplicate Scan Takes Too Long
- This is normal for large drives
- Scan time: ~1-2 minutes per 100GB
- You can cancel and restart anytime

### Port 3001 Already in Use
Change the port in `server/app.js`:
```javascript
const PORT = process.env.PORT || 3002;
```

## 📝 Copyright & Usage

**© 2025 All Rights Reserved**

This software is proprietary and confidential. Unauthorized copying, distribution, modification, or use of this software, via any medium, is strictly prohibited without explicit written permission from the owner.

## 🐛 Troubleshooting

- [systeminformation](https://github.com/sebhildebrandt/systeminformation) - System information library
- [Tremor](https://www.tremor.so/) - React UI components
- [Lucide Icons](https://lucide.dev/) - Beautiful icon set
- [Recharts](https://recharts.org/) - Charting library

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**⚠️ Disclaimer:** This tool modifies system files and processes. Always backup important data before using cleanup features. Use at your own risk.
