import { Card, Title, Text, Badge, ProgressBar, Accordion, AccordionHeader, AccordionBody } from '@tremor/react';
import { Copy, Trash2, AlertTriangle, ScanLine, FolderSearch, HardDrive } from 'lucide-react';
import { api } from '../lib/api';
import { useState } from 'react';

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function Duplicates() {
    const [scanning, setScanning] = useState(false);
    const [status, setStatus] = useState('');
    const [duplicatesByDrive, setDuplicatesByDrive] = useState({}); // { 'C:': [...], 'D:': [...] }
    const [error, setError] = useState('');
    const [currentDrive, setCurrentDrive] = useState('');

    const startScan = async () => {
        setScanning(true);
        setStatus("Detecting available drives...");
        setError('');
        setDuplicatesByDrive({});

        try {
            // Scan all available drives (A-Z)
            const drives = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            const results = {};

            for (const drive of drives) {
                const drivePath = `${drive}:\\\\`;
                setCurrentDrive(`${drive}:`);
                setStatus(`Scanning ${drive}: drive for files >= 1MB...`);

                try {
                    const data = await api.findDuplicates(drivePath);
                    if (data && data.length > 0) {
                        results[`${drive}:`] = data;
                    }
                } catch (e) {
                    // Drive doesn't exist or not accessible, skip it
                    console.log(`${drive}: drive not accessible or doesn't exist`);
                }
            }

            setDuplicatesByDrive(results);
            setStatus("");
            setCurrentDrive('');

            const totalDrives = Object.keys(results).length;
            if (totalDrives === 0) {
                setStatus("Scan complete! No duplicates found on any drive.");
            } else {
                const totalDuplicates = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
                const totalWasted = Object.values(results).reduce((sum, driveData) =>
                    sum + driveData.reduce((s, group) => s + (group.size * (group.files.length - 1)), 0), 0
                );
                setStatus(`Found duplicates on ${totalDrives} drive(s) - ${totalDuplicates} groups wasting ${formatBytes(totalWasted)}`);
            }
        } catch (e) {
            console.error(e);
            setError("Scan failed: " + e.message);
            setStatus("");
        } finally {
            setScanning(false);
            setCurrentDrive('');
        }
    };

    const deleteDuplicate = async (filePath) => {
        if (window.confirm(`Delete this file?\n\n${filePath}\n\nThis action cannot be undone!`)) {
            try {
                // TODO: Implement delete endpoint
                alert("Delete functionality will be implemented in the backend");
            } catch (e) {
                alert("Failed to delete: " + e.message);
            }
        }
    };

    const deleteAllDuplicatesForDrive = async (drive) => {
        const driveData = duplicatesByDrive[drive];
        if (!driveData || driveData.length === 0) return;

        const totalFiles = driveData.reduce((sum, group) => sum + (group.files.length - 1), 0);
        const totalSpace = driveData.reduce((sum, group) => sum + (group.size * (group.files.length - 1)), 0);

        if (window.confirm(
            `⚠️ DELETE ALL DUPLICATES ON ${drive}?\n\n` +
            `This will delete ${totalFiles} duplicate files and free up ${formatBytes(totalSpace)}.\n\n` +
            `The first copy of each file will be kept.\n\n` +
            `This action CANNOT be undone!\n\nAre you absolutely sure?`
        )) {
            if (window.confirm(`🚨 FINAL WARNING!\n\nYou are about to permanently delete ${totalFiles} files from ${drive}!\n\nClick OK to proceed.`)) {
                try {
                    const filesToDelete = [];
                    driveData.forEach(group => {
                        group.files.slice(1).forEach(file => filesToDelete.push(file));
                    });

                    // TODO: Implement bulk delete endpoint
                    alert(`Would delete ${filesToDelete.length} files from ${drive}. Backend implementation needed.`);
                    console.log(`Files to delete from ${drive}:`, filesToDelete);
                } catch (e) {
                    alert("Failed to delete duplicates: " + e.message);
                }
            }
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Duplicate Finder</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Complete scan of all available drives for files ≥ 1MB</p>
                </div>
                <button
                    onClick={startScan}
                    disabled={scanning}
                    className={`
                        px-6 py-3 rounded-lg font-semibold text-white
                        flex items-center gap-2 transition-all
                        ${scanning
                            ? 'bg-violet-400 cursor-not-allowed'
                            : 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800'
                        }
                        shadow-md hover:shadow-lg
                    `}
                >
                    <ScanLine size={20} className={scanning ? 'animate-spin' : ''} />
                    {scanning ? 'Scanning...' : 'Scan All Drives'}
                </button>
            </div>

            {/* Status Messages */}
            {status && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3">
                        <FolderSearch className="text-blue-600" size={24} />
                        <div className="flex-1">
                            <Text className="text-blue-700 dark:text-blue-300 font-medium">{status}</Text>
                            {currentDrive && (
                                <Text className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                                    Currently scanning: {currentDrive}
                                </Text>
                            )}
                        </div>
                    </div>
                    {scanning && <ProgressBar className="mt-3" color="blue" />}
                </Card>
            )}

            {error && (
                <Card className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-600" size={24} />
                        <Text className="text-red-700 dark:text-red-300 font-medium">{error}</Text>
                    </div>
                </Card>
            )}

            {/* Initial State */}
            {Object.keys(duplicatesByDrive).length === 0 && !scanning && !error && (
                <Card className="text-center py-16 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-violet-100 dark:bg-violet-900/40 rounded-full">
                            <Copy size={48} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <Title className="text-2xl mb-2">Complete Duplicate File Scanner</Title>
                            <Text className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                Scans ALL available drives (C:, D:, E:, etc.) for files ≥ 1MB.
                                Results are organized by drive for easy management.
                            </Text>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-2xl">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <HardDrive className="text-violet-500 mb-2" size={24} />
                                <Text className="font-medium">All Drives</Text>
                                <Text className="text-xs text-slate-500 mt-1">Auto-detects all available drives</Text>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <ScanLine className="text-violet-500 mb-2" size={24} />
                                <Text className="font-medium">Organized Results</Text>
                                <Text className="text-xs text-slate-500 mt-1">Duplicates grouped by drive</Text>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <Trash2 className="text-violet-500 mb-2" size={24} />
                                <Text className="font-medium">Per-Drive Delete</Text>
                                <Text className="text-xs text-slate-500 mt-1">Delete duplicates drive by drive</Text>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* No Duplicates Found */}
            {Object.keys(duplicatesByDrive).length === 0 && !scanning && status && (
                <Card className="text-center py-12 bg-emerald-50 dark:bg-emerald-900/20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
                            <Copy size={32} className="text-emerald-600" />
                        </div>
                        <Title className="text-emerald-700 dark:text-emerald-300">No Duplicates Found!</Title>
                        <Text className="text-slate-600 dark:text-slate-400">All your drives are clean and optimized.</Text>
                    </div>
                </Card>
            )}

            {/* Duplicates by Drive */}
            {Object.keys(duplicatesByDrive).length > 0 && (
                <div className="space-y-6">
                    {Object.entries(duplicatesByDrive).map(([drive, duplicates]) => {
                        const totalWasted = duplicates.reduce((sum, group) => sum + (group.size * (group.files.length - 1)), 0);
                        const totalFiles = duplicates.reduce((sum, group) => sum + (group.files.length - 1), 0);

                        return (
                            <Card key={drive} decoration="top" decorationColor="violet" className="overflow-hidden">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                                            <HardDrive className="text-violet-600 dark:text-violet-400" size={28} />
                                        </div>
                                        <div>
                                            <Title className="text-xl">Drive {drive}</Title>
                                            <div className="flex gap-2 mt-1">
                                                <Badge color="red" size="sm">{duplicates.length} duplicate groups</Badge>
                                                <Badge color="orange" size="sm">{totalFiles} files to delete</Badge>
                                                <Badge color="slate" size="sm">{formatBytes(totalWasted)} wasted</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteAllDuplicatesForDrive(drive)}
                                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-md"
                                    >
                                        <Trash2 size={18} />
                                        Delete All on {drive}
                                    </button>
                                </div>

                                <Accordion className="mt-4">
                                    <AccordionHeader>
                                        <Text className="font-medium">Show {duplicates.length} duplicate groups</Text>
                                    </AccordionHeader>
                                    <AccordionBody>
                                        <div className="space-y-4 mt-4">
                                            {duplicates.map((group, idx) => (
                                                <Card key={idx} decoration="left" decorationColor="red" className="bg-slate-50 dark:bg-slate-800/50">
                                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge color="red" size="xs">Group #{idx + 1}</Badge>
                                                                <Badge color="slate" size="xs">{group.files.length} copies</Badge>
                                                            </div>
                                                            <Text className="font-mono text-xs text-slate-400">Hash: {group.hash.substring(0, 16)}...</Text>
                                                        </div>
                                                        <div className="text-right">
                                                            <Text className="text-base font-bold text-slate-700 dark:text-slate-200">{formatBytes(group.size)}</Text>
                                                            <Text className="text-xs text-slate-500">per file</Text>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {group.files.map((file, fIdx) => (
                                                            <div
                                                                key={fIdx}
                                                                className={`flex justify-between items-center p-2.5 rounded-lg transition-all ${fIdx === 0
                                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                                                        : 'bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    {fIdx === 0 && (
                                                                        <Badge color="emerald" size="xs">Keep</Badge>
                                                                    )}
                                                                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate">
                                                                        {file}
                                                                    </span>
                                                                </div>
                                                                {fIdx > 0 && (
                                                                    <button
                                                                        onClick={() => deleteDuplicate(file)}
                                                                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded flex items-center gap-1 transition-colors"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                        <Text className="text-xs text-slate-600 dark:text-slate-400">
                                                            Wasted space in this group:
                                                        </Text>
                                                        <div className="flex items-center gap-1.5">
                                                            <AlertTriangle size={14} className="text-orange-500" />
                                                            <Text className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                                                {formatBytes(group.size * (group.files.length - 1))}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </AccordionBody>
                                </Accordion>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
