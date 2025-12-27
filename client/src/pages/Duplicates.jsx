import { Card, Title, Text, Badge, ProgressBar } from '@tremor/react';
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
    const [duplicates, setDuplicates] = useState(null);
    const [error, setError] = useState('');
    const [currentDrive, setCurrentDrive] = useState('');

    const startScan = async () => {
        setScanning(true);
        setStatus("Initializing full disk scan...");
        setError('');
        setDuplicates(null);

        try {
            let allDuplicates = [];

            // Scan C: Drive
            setCurrentDrive('C:');
            setStatus("Scanning C: drive for files >= 1MB (this will take several minutes)...");
            const cData = await api.findDuplicates("C:\\\\");
            allDuplicates = [...cData];

            // Scan D: Drive if it exists
            try {
                setCurrentDrive('D:');
                setStatus("Scanning D: drive for files >= 1MB...");
                const dData = await api.findDuplicates("D:\\\\");
                allDuplicates = [...allDuplicates, ...dData];
            } catch (e) {
                console.log("D: drive not accessible or doesn't exist");
            }

            setDuplicates(allDuplicates);
            setStatus("");
            setCurrentDrive('');

            if (allDuplicates.length === 0) {
                setStatus("Scan complete! No duplicates found on C: and D: drives.");
            } else {
                const totalWasted = allDuplicates.reduce((sum, group) =>
                    sum + (group.size * (group.files.length - 1)), 0
                );
                setStatus(`Found ${allDuplicates.length} duplicate groups wasting ${formatBytes(totalWasted)}`);
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

    const deleteAllDuplicates = async () => {
        if (!duplicates || duplicates.length === 0) return;

        const totalFiles = duplicates.reduce((sum, group) => sum + (group.files.length - 1), 0);
        const totalSpace = duplicates.reduce((sum, group) => sum + (group.size * (group.files.length - 1)), 0);

        if (window.confirm(
            `⚠️ DELETE ALL DUPLICATES?\n\n` +
            `This will delete ${totalFiles} duplicate files and free up ${formatBytes(totalSpace)}.\n\n` +
            `The first copy of each file will be kept.\n\n` +
            `This action CANNOT be undone!\n\nAre you absolutely sure?`
        )) {
            if (window.confirm(`🚨 FINAL WARNING!\n\nYou are about to permanently delete ${totalFiles} files!\n\nClick OK to proceed.`)) {
                try {
                    // Collect all duplicate files (skip first in each group)
                    const filesToDelete = [];
                    duplicates.forEach(group => {
                        group.files.slice(1).forEach(file => filesToDelete.push(file));
                    });

                    // TODO: Implement bulk delete endpoint
                    alert(`Would delete ${filesToDelete.length} files. Backend implementation needed.`);
                    console.log("Files to delete:", filesToDelete);
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
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Complete scan of C: and D: drives for files ≥ 1MB</p>
                </div>
                <div className="flex gap-3">
                    {duplicates && duplicates.length > 0 && (
                        <button
                            onClick={deleteAllDuplicates}
                            className="px-6 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                        >
                            <Trash2 size={20} />
                            Delete All Duplicates
                        </button>
                    )}
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
                        {scanning ? 'Scanning...' : 'Scan Both Drives'}
                    </button>
                </div>
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
            {!duplicates && !scanning && !error && (
                <Card className="text-center py-16 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-violet-100 dark:bg-violet-900/40 rounded-full">
                            <Copy size={48} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <Title className="text-2xl mb-2">Complete Duplicate File Scanner</Title>
                            <Text className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                Scans BOTH C: and D: drives completely for all files ≥ 1MB.
                                This is a thorough scan that may take 10-30 minutes depending on disk size.
                            </Text>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-2xl">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <HardDrive className="text-violet-500 mb-2" size={24} />
                                <Text className="font-medium">Complete Scan</Text>
                                <Text className="text-xs text-slate-500 mt-1">Scans C: and D: drives entirely</Text>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <ScanLine className="text-violet-500 mb-2" size={24} />
                                <Text className="font-medium">Files ≥ 1MB</Text>
                                <Text className="text-xs text-slate-500 mt-1">Finds all large duplicate files</Text>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <Trash2 className="text-violet-500 mb-2" size={24} />
                                <Text className="font-medium">Bulk Delete</Text>
                                <Text className="text-xs text-slate-500 mt-1">Delete all duplicates at once</Text>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* No Duplicates Found */}
            {duplicates && duplicates.length === 0 && (
                <Card className="text-center py-12 bg-emerald-50 dark:bg-emerald-900/20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
                            <Copy size={32} className="text-emerald-600" />
                        </div>
                        <Title className="text-emerald-700 dark:text-emerald-300">No Duplicates Found!</Title>
                        <Text className="text-slate-600 dark:text-slate-400">Your drives are clean and optimized.</Text>
                    </div>
                </Card>
            )}

            {/* Duplicate Groups */}
            {duplicates && duplicates.length > 0 && (
                <div className="space-y-4">
                    {duplicates.map((group, idx) => (
                        <Card key={idx} decoration="left" decorationColor="red">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge color="red" size="sm">Duplicate Group #{idx + 1}</Badge>
                                        <Badge color="slate" size="sm">{group.files.length} copies</Badge>
                                    </div>
                                    <Text className="font-mono text-xs text-slate-400">Hash: {group.hash.substring(0, 16)}...</Text>
                                </div>
                                <div className="text-right">
                                    <Text className="text-lg font-bold text-slate-700 dark:text-slate-200">{formatBytes(group.size)}</Text>
                                    <Text className="text-xs text-slate-500">per file</Text>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {group.files.map((file, fIdx) => (
                                    <div
                                        key={fIdx}
                                        className={`flex justify-between items-center p-3 rounded-lg transition-all ${fIdx === 0
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                                : 'bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {fIdx === 0 && (
                                                <Badge color="emerald" size="xs">Keep</Badge>
                                            )}
                                            <span className="font-mono text-sm text-slate-600 dark:text-slate-300 truncate">
                                                {file}
                                            </span>
                                        </div>
                                        {fIdx > 0 && (
                                            <button
                                                onClick={() => deleteDuplicate(file)}
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <Text className="text-sm text-slate-600 dark:text-slate-400">
                                    Wasted space in this group:
                                </Text>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-orange-500" />
                                    <Text className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                        {formatBytes(group.size * (group.files.length - 1))}
                                    </Text>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
