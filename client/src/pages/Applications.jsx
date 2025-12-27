import { useState, useEffect } from 'react';
import { Card, Text, Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, TextInput, TabGroup, TabList, Tab, Badge } from '@tremor/react';
import { Trash2, Search, Package, RefreshCw, Info, Monitor, HardDrive, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

const PropertiesModal = ({ app, onClose }) => {
    if (!app) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">×</button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                        <Package size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">{app.name}</h3>
                        <p className="text-sm text-gray-500">{app.publisher}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-500">Version</div>
                        <div className="font-medium dark:text-gray-200 text-right">{app.version}</div>

                        <div className="text-gray-500">Install Date</div>
                        <div className="font-medium dark:text-gray-200 text-right">{app.installDate || 'Unknown'}</div>

                        <div className="text-gray-500">Size</div>
                        <div className="font-medium dark:text-gray-200 text-right">{app.size ? (app.size / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown'}</div>

                        <div className="text-gray-500">Type</div>
                        <div className="font-medium dark:text-gray-200 text-right">
                            {app.isSystem ? <Badge color="amber">System</Badge> : <Badge color="blue">User</Badge>}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Install Location</div>
                        <div className="text-xs font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded break-all">
                            {app.location || 'Not available'}
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Uninstall String</div>
                        <div className="text-xs font-mono text-gray-500 truncate" title={app.uninstallString}>
                            {app.uninstallString || 'N/A'}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default function Applications() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [uninstalling, setUninstalling] = useState(null);
    const [selectedTab, setSelectedTab] = useState(0); // 0: All, 1: User, 2: System, 3: Unused
    const [selectedApp, setSelectedApp] = useState(null);

    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        setLoading(true);
        try {
            const data = await api.getApps();
            setApps(Array.isArray(data.apps) ? data.apps : []);
        } catch (e) {
            console.error(e);
            setApps([]);
        } finally {
            setLoading(false);
        }
    };

    const handlUninstall = async (app) => {
        if (!confirm(`Are you sure you want to uninstall ${app.name}? This will launch the uninstaller.`)) return;

        setUninstalling(app.name);
        try {
            await api.uninstallApp(app.uninstallString);
            // Don't alert blocking, just notify
        } catch (e) {
            alert('Failed to launch uninstaller: ' + e.message);
        } finally {
            setUninstalling(null);
        }
    };

    const getFilteredApps = () => {
        let filtered = apps;

        // Tab filtering
        if (selectedTab === 1) { // User (Installed)
            filtered = apps.filter(a => !a.isSystem);
        } else if (selectedTab === 2) { // System/Default
            filtered = apps.filter(a => a.isSystem);
        } else if (selectedTab === 3) { // Unused (Simulated logic or placeholder)
            // Just show nothing or random for now as we lack usage data? 
            // Better to show empty state with message
            return [];
        }

        // Search filtering
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(app =>
                app.name?.toLowerCase().includes(q) ||
                app.publisher?.toLowerCase().includes(q)
            );
        }
        return filtered;
    };

    const displayApps = getFilteredApps();

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative min-h-screen pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Application Manager</h2>
                    <p className="text-slate-500 mt-1">Manage installed software and reclaim space</p>
                </div>
                <Button icon={RefreshCw} variant="secondary" onClick={loadApps} loading={loading}>
                    Refresh List
                </Button>
            </div>

            <Card className="bg-white ring-1 ring-slate-200 p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4 items-center">
                    <TabGroup index={selectedTab} onIndexChange={setSelectedTab} className="w-full md:w-auto">
                        <TabList variant="solid">
                            <Tab icon={Package}>All Apps</Tab>
                            <Tab icon={HardDrive}>Installed Applications</Tab>
                            <Tab icon={Monitor}>System & Default</Tab>
                            <Tab icon={AlertCircle}>Unused Applications</Tab>
                        </TabList>
                    </TabGroup>
                    <div className="w-full md:max-w-xs">
                        <TextInput icon={Search} placeholder="Search applications..." value={search} onValueChange={setSearch} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHead>
                            <TableRow className="border-b border-slate-200 bg-slate-50">
                                <TableHeaderCell className="text-slate-900 font-semibold pl-6">Name</TableHeaderCell>
                                <TableHeaderCell className="text-slate-900 font-semibold">Publisher</TableHeaderCell>
                                <TableHeaderCell className="text-slate-900 font-semibold">Install Date</TableHeaderCell>
                                <TableHeaderCell className="text-slate-900 font-semibold">Size</TableHeaderCell>
                                <TableHeaderCell className="text-slate-900 font-semibold text-right pr-6">Actions</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                            Loading applications...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : selectedTab === 3 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                                        <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                        <p>Usage data not available in this version.</p>
                                        <p className="text-xs mt-1">Enable "App Tracking" in settings to populate this list.</p>
                                    </TableCell>
                                </TableRow>
                            ) : displayApps.length > 0 ? (
                                displayApps.map((app, idx) => (
                                    <TableRow key={idx} className="hover:bg-blue-50/50 border-b border-slate-100 last:border-0 transition-colors group">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 p-2 rounded text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors w-10 h-10 flex items-center justify-center shrink-0">
                                                    {app.displayIcon ? (
                                                        <>
                                                            <img
                                                                src={`/api/apps/icon?path=${encodeURIComponent(app.displayIcon)}`}
                                                                alt=""
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'block'; }}
                                                                loading="lazy"
                                                            />
                                                            <Package size={20} className="hidden" />
                                                        </>
                                                    ) : (
                                                        <Package size={20} />
                                                    )}
                                                </div>
                                                <div className="max-w-[250px] truncate">
                                                    <Text className="font-semibold text-slate-900 truncate" title={app.name}>{app.name}</Text>
                                                    <Text className="text-[11px] text-slate-400">v{app.version}</Text>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Text className="text-slate-600 truncate max-w-[150px]" title={app.publisher}>{app.publisher}</Text>
                                        </TableCell>
                                        <TableCell>
                                            <Text className="text-slate-600 text-sm">{app.installDate || '-'}</Text>
                                        </TableCell>
                                        <TableCell>
                                            <Text className="font-mono text-xs text-slate-500">
                                                {app.size ? (app.size / (1024 * 1024)).toFixed(1) + ' MB' : '-'}
                                            </Text>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="xs" variant="secondary" icon={Info} onClick={() => setSelectedApp(app)}>
                                                    Prop
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="secondary"
                                                    color="red"
                                                    icon={Trash2}
                                                    loading={uninstalling === app.name}
                                                    onClick={() => handlUninstall(app)}
                                                    disabled={app.isSystem}
                                                    title={app.isSystem ? "System apps cannot be uninstalled" : "Uninstall"}
                                                >
                                                    Bin
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Package className="w-12 h-12 text-slate-300 mb-2" />
                                            <p>No applications found in this category.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Properties Modal */}
            {selectedApp && (
                <PropertiesModal app={selectedApp} onClose={() => setSelectedApp(null)} />
            )}
        </div>
    );
}
