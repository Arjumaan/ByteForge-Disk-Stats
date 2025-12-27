import { useState, useEffect } from 'react';
import { Card, Title, Text, Button, Switch, List, ListItem, TextInput, Divider, Select, SelectItem } from '@tremor/react';
import { Save, ShieldAlert, FolderX, Trash2, RefreshCw, Bell, Moon, Zap, Database, Activity } from 'lucide-react';

export default function Settings() {

    const [scanDepth, setScanDepth] = useState(5);
    const [excludePaths, setExcludePaths] = useState('Windows,Program Files,System Volume Information');
    const [safetyLock, setSafetyLock] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState('5');
    const [cleanupMode, setCleanupMode] = useState('safe');
    const [showHiddenFiles, setShowHiddenFiles] = useState(false);
    const [compactView, setCompactView] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('byteforge_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            setScanDepth(parsed.scanDepth || 5);
            setExcludePaths(parsed.excludePaths || 'Windows,Program Files,System Volume Information');
            setSafetyLock(parsed.safetyLock ?? true);
            setDarkMode(parsed.darkMode || false);
            setNotifications(parsed.notifications ?? true);
            setAutoRefresh(parsed.autoRefresh ?? true);
            setRefreshInterval(parsed.refreshInterval || '5');
            setCleanupMode(parsed.cleanupMode || 'safe');
            setShowHiddenFiles(parsed.showHiddenFiles || false);
            setCompactView(parsed.compactView || false);

            // Apply theme immediately on load
            if (parsed.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, []);

    const handleSave = () => {
        const settings = {
            scanDepth,
            excludePaths,
            safetyLock,
            notifications,
            darkMode,
            autoRefresh,
            refreshInterval,
            cleanupMode,
            showHiddenFiles,
            compactView
        };
        localStorage.setItem('byteforge_settings', JSON.stringify(settings));

        // Apply Theme
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        alert('✅ Settings saved successfully!');
    };

    const handleFactoryReset = () => {
        if (window.confirm('⚠️ This will delete ALL settings, history, and cached data. Are you sure?')) {
            if (window.confirm('🚨 FINAL WARNING: This action cannot be undone!')) {
                localStorage.clear();
                alert('✅ Factory reset complete. Reloading...');
                window.location.reload();
            }
        }
    };

    const handleClearCache = () => {
        if (window.confirm('Clear all cached data? This will not affect your settings.')) {
            // Clear specific cache items but keep settings
            const settings = localStorage.getItem('byteforge_settings');
            localStorage.clear();
            if (settings) localStorage.setItem('byteforge_settings', settings);
            alert('✅ Cache cleared successfully!');
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Configuration</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Customize scanner behavior, appearance, and safety rules</p>
                </div>
                <Button icon={Save} onClick={handleSave} color="blue">Save Changes</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Scanner Rules */}
                <Card decoration="top" decorationColor="blue">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="text-blue-500" />
                        <Title>Scanner Rules</Title>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <Text className="mb-2 font-medium">Max Scan Depth</Text>
                            <TextInput
                                type="number"
                                value={scanDepth}
                                onValueChange={setScanDepth}
                                placeholder="Default: 5"
                                min="1"
                                max="10"
                            />
                            <Text className="text-xs text-slate-500 mt-1">
                                Controls folder nesting level (1-10). Higher = slower but more thorough.
                            </Text>
                        </div>

                        <div>
                            <Text className="mb-2 font-medium">Excluded Keywords (Comma separated)</Text>
                            <TextInput
                                icon={FolderX}
                                value={excludePaths}
                                onValueChange={setExcludePaths}
                            />
                            <Text className="text-xs text-slate-500 mt-1">
                                Folders containing these names will be skipped during scans.
                            </Text>
                        </div>

                        <div>
                            <Text className="mb-2 font-medium">Cleanup Mode</Text>
                            <Select value={cleanupMode} onValueChange={setCleanupMode}>
                                <SelectItem value="safe">Safe (Recommended)</SelectItem>
                                <SelectItem value="aggressive">Aggressive</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </Select>
                            <Text className="text-xs text-slate-500 mt-1">
                                Safe mode only removes temp files. Aggressive includes cache and logs.
                            </Text>
                        </div>
                    </div>
                </Card>

                {/* Safety & Notifications */}
                <Card decoration="top" decorationColor="emerald">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="text-emerald-500" />
                        <Title>Safety & Notifications</Title>
                    </div>
                    <List>
                        <ListItem>
                            <div className="flex items-center gap-2">
                                <ShieldAlert size={18} className="text-slate-400" />
                                <span>Cleanup Safety Lock</span>
                            </div>
                            <Switch checked={safetyLock} onChange={setSafetyLock} />
                        </ListItem>
                        <ListItem>
                            <div className="flex items-center gap-2">
                                <Bell size={18} className="text-slate-400" />
                                <span>Desktop Notifications</span>
                            </div>
                            <Switch checked={notifications} onChange={setNotifications} />
                        </ListItem>
                        <ListItem>
                            <div className="flex items-center gap-2">
                                <FolderX size={18} className="text-slate-400" />
                                <span>Show Hidden Files</span>
                            </div>
                            <Switch checked={showHiddenFiles} onChange={setShowHiddenFiles} />
                        </ListItem>
                    </List>
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm rounded border border-emerald-200 dark:border-emerald-800">
                        <strong>Safety Lock:</strong> Prevents deletion of files modified in the last 24 hours to avoid accidental data loss.
                    </div>
                </Card>

                {/* Appearance & Performance */}
                <Card decoration="top" decorationColor="violet">
                    <div className="flex items-center gap-2 mb-4">
                        <Moon className="text-violet-500" />
                        <Title>Appearance & Performance</Title>
                    </div>
                    <List>
                        <ListItem>
                            <div className="flex items-center gap-2">
                                <Moon size={18} className="text-slate-400" />
                                <span>Dark Mode</span>
                            </div>
                            <Switch checked={darkMode} onChange={setDarkMode} />
                        </ListItem>
                        <ListItem>
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-slate-400" />
                                <span>Compact View</span>
                            </div>
                            <Switch checked={compactView} onChange={setCompactView} />
                        </ListItem>
                        <ListItem>
                            <div className="flex items-center gap-2">
                                <RefreshCw size={18} className="text-slate-400" />
                                <span>Auto-Refresh Stats</span>
                            </div>
                            <Switch checked={autoRefresh} onChange={setAutoRefresh} />
                        </ListItem>
                    </List>

                    {autoRefresh && (
                        <div className="mt-4">
                            <Text className="mb-2 font-medium">Refresh Interval (seconds)</Text>
                            <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                                <SelectItem value="1">1 second (Real-time)</SelectItem>
                                <SelectItem value="3">3 seconds</SelectItem>
                                <SelectItem value="5">5 seconds (Default)</SelectItem>
                                <SelectItem value="10">10 seconds</SelectItem>
                                <SelectItem value="30">30 seconds (Battery Saver)</SelectItem>
                            </Select>
                        </div>
                    )}
                </Card>

                {/* Data Management */}
                <Card decoration="top" decorationColor="amber">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="text-amber-500" />
                        <Title>Data Management</Title>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div>
                                <Text className="font-medium">Clear Cache</Text>
                                <Text className="text-xs text-slate-500">Remove temporary data</Text>
                            </div>
                            <Button
                                size="xs"
                                variant="secondary"
                                icon={Trash2}
                                onClick={handleClearCache}
                            >
                                Clear
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div>
                                <Text className="font-medium">Export Settings</Text>
                                <Text className="text-xs text-slate-500">Backup configuration</Text>
                            </div>
                            <Button
                                size="xs"
                                variant="secondary"
                                onClick={() => {
                                    const settings = localStorage.getItem('byteforge_settings');
                                    const blob = new Blob([settings], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'byteforge-settings.json';
                                    a.click();
                                }}
                            >
                                Export
                            </Button>
                        </div>
                    </div>
                </Card>

            </div>

            {/* Danger Zone */}
            <Card className="border-l-4 border-red-500">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="text-red-500" />
                    <Title className="text-red-700 dark:text-red-400">Danger Zone</Title>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <Text className="font-bold text-slate-900 dark:text-slate-100">Factory Reset</Text>
                        <Text className="text-slate-600 dark:text-slate-400">Clear all history, logs, and settings. This cannot be undone.</Text>
                    </div>
                    <Button
                        variant="secondary"
                        color="red"
                        icon={RefreshCw}
                        onClick={handleFactoryReset}
                    >
                        Factory Reset
                    </Button>
                </div>
            </Card>
        </div>
    );
}
