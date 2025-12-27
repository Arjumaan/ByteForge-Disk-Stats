import { useState } from 'react';
import { Card, Title, Text, Button, Badge, Flex, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { Trash2, Search, Check } from 'lucide-react';
import { api } from '../lib/api';

const formatBytes = (bytes) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function Cleanup() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [cleaned, setCleaned] = useState(false);

    const scanJunk = async () => {
        setLoading(true);
        setCleaned(false);
        try {
            const data = await api.scanJunk();
            setItems(data.items);
            setSelectedIds(new Set(data.items.map(i => i.id)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const executeCleanup = async () => {
        if (selectedIds.size === 0) return;

        setLoading(true);
        try {
            const toClean = items.filter(i => selectedIds.has(i.id));
            await api.cleanJunk(toClean);
            setCleaned(true);
            setItems([]);
            setSelectedIds(new Set());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const totalSize = items.reduce((acc, item) => selectedIds.has(item.id) ? acc + item.size : acc, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Smart Disk Cleanup</h2>
                    <p className="text-slate-500 mt-1">Safely remove temporary files and cache</p>
                </div>
            </div>

            <Card className="bg-white ring-1 ring-slate-200">
                <Flex className="gap-4 justify-start mb-6">
                    <Button size="lg" icon={Search} loading={loading} onClick={scanJunk}>
                        {items.length > 0 ? 'Rescan System' : 'Scan for Junk'}
                    </Button>

                    {items.length > 0 && (
                        <button
                            onClick={executeCleanup}
                            disabled={selectedIds.size === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-tremor-default px-5 py-2.5 text-sm font-semibold shadow-sm transition-all bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            {loading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Trash2 size={18} />
                            )}
                            <span>Clean {formatBytes(totalSize)}</span>
                        </button>
                    )}
                </Flex>

                {cleaned && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2">
                        <div className="bg-emerald-100 p-1 rounded-full"><Check size={16} /></div>
                        Cleanup successful! Space reclaimed.
                    </div>
                )}

                {items.length > 0 ? (
                    <Table className="mt-4">
                        <TableHead>
                            <TableRow className="border-b border-slate-200">
                                <TableHeaderCell className="text-slate-900 font-semibold">Select</TableHeaderCell>
                                <TableHeaderCell className="text-slate-900 font-semibold">Category</TableHeaderCell>
                                <TableHeaderCell className="text-slate-900 font-semibold">Path</TableHeaderCell>
                                <TableHeaderCell className="text-slate-900 font-semibold">Size</TableHeaderCell>
                                <TableHeaderCell className="text-slate-900 font-semibold">Safety</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50">
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(item.id)}
                                            onChange={() => toggleSelection(item.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Text className="font-medium text-slate-900">{item.category}</Text>
                                        <Text className="text-xs text-slate-500">{item.description}</Text>
                                    </TableCell>
                                    <TableCell>
                                        <Text className="font-mono text-xs text-slate-500 truncate max-w-md" title={item.path}>
                                            {item.path}
                                        </Text>
                                    </TableCell>
                                    <TableCell>
                                        <Text className="font-bold text-slate-700">{formatBytes(item.size)}</Text>
                                    </TableCell>
                                    <TableCell>
                                        <Badge size="xs" color="emerald">Safe to Delete</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    !loading && !cleaned && (
                        <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <Trash2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No junk items found yet. Start a scan.</p>
                        </div>
                    )
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white ring-1 ring-slate-200">
                    <Text className="font-medium text-slate-900">System Temp</Text>
                    <Text className="text-xs mt-1 text-slate-500">Deletes contents of %TEMP%. Safe for most running apps.</Text>
                </Card>
                <Card className="bg-white ring-1 ring-slate-200">
                    <Text className="font-medium text-slate-900">Browser Cache</Text>
                    <Text className="text-xs mt-1 text-slate-500">Clears Chrome/Edge cache files. May sign you out of some sites.</Text>
                </Card>
                <Card className="bg-white ring-1 ring-slate-200">
                    <Text className="font-medium text-slate-900">Rollback</Text>
                    <Text className="text-xs mt-1 text-slate-500">Files are securely erased. Backup important data first.</Text>
                </Card>
            </div>
        </div>
    );
}
