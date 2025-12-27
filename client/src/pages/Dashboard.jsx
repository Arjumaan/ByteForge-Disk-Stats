import { Card, Title, Text, Metric, Flex, ProgressBar, Grid, DonutChart, Badge, Button, AreaChart } from '@tremor/react';
import { HardDrive, RefreshCw, Folder, Cpu, Activity, Zap, Trash2, Search, TrendingUp, Copy, Sparkles } from 'lucide-react';
import { useDisk } from '../context/DiskContext';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

import UptimeBanner from '../components/UptimeBanner';
import Gauges from '../components/Gauges';
import SystemCharts from '../components/SystemCharts';
import DiskNetwork from '../components/DiskNetwork';

const valueFormatter = (number) => `${(number / 1024 / 1024 / 1024).toFixed(2)} GB`;

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function Dashboard() {
    const { disks, isConnected, loadDisks, scanResults, systemStats } = useDisk();
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Load historical data with defensive check
        api.getHistory().then(data => {
            if (!Array.isArray(data)) return;
            // Transform for chart
            const chartData = data
                .filter(snap => snap && snap.timestamp && Array.isArray(snap.disks))
                .map(snap => {
                    const point = { time: new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                    snap.disks.forEach(d => {
                        if (d && d.mount) {
                            point[d.mount] = parseFloat((d.used / 1024 / 1024 / 1024).toFixed(1));
                        }
                    });
                    return point;
                });
            setHistory(chartData);
        }).catch(err => console.error("History fetch error:", err));
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDisks();
        setTimeout(() => setRefreshing(false), 500);
    };

    // Process data for charts
    const chartData = useMemo(() => {
        if (!scanResults) return [
            { name: 'System', size: 40 },
            { name: 'Apps', size: 30 },
            { name: 'Docs', size: 20 },
        ];

        return Object.entries(scanResults.categories || {}).map(([name, size]) => ({
            name,
            size: size / 1024 / 1024 / 1024 // GB
        })).filter(d => d.size > 0.1);
    }, [scanResults]);

    const topDirs = useMemo(() => {
        if (!scanResults) return [];
        return scanResults.children.slice(0, 5);
    }, [scanResults]);

    if (!disks.length) return <div className="p-10 text-center text-slate-500">Loading system telemetry...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Overview</h2>
                    <Flex className="justify-start gap-2 mt-1">
                        <Text>Real-time metrics</Text>
                        {isConnected ?
                            <Badge size="xs" color="emerald">Live</Badge> :
                            <Badge size="xs" color="orange">Connecting...</Badge>
                        }
                    </Flex>
                </div>
                <Button icon={RefreshCw} variant="secondary" loading={refreshing} onClick={handleRefresh}>
                    Refresh
                </Button>
            </div>

            {/* --- Merged Dashboard Components --- */}

            {/* 1. Uptime */}
            <UptimeBanner />

            {/* 2. Gauges & Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                    <Card className="h-full flex flex-col justify-center">
                        <Title>Live Resource Usage</Title>
                        <Gauges />
                    </Card>
                </div>
                <div>
                    <SystemCharts />
                </div>
            </div>

            {/* 3. Disk & Network Stats (Merged) */}
            <DiskNetwork />

            {/* 4. Core System Vitals (Tremor Style) - Keeping as summary */}
            <Grid numItems={1} numItemsMd={3} className="gap-6">
                <Card className="bg-white ring-1 ring-slate-200">
                    <Flex alignItems="start">
                        <div>
                            <Text>CPU Load</Text>
                            <Metric>{systemStats?.cpu?.load || 0}%</Metric>
                        </div>
                        <Cpu className="text-blue-500" />
                    </Flex>
                    <ProgressBar value={parseFloat(systemStats?.cpu?.load || 0)} color="blue" className="mt-4" />
                </Card>

                <Card className="bg-white ring-1 ring-slate-200">
                    <Flex alignItems="start">
                        <div>
                            <Text>Memory Usage</Text>
                            <Metric>{systemStats ? formatBytes(systemStats.memory.active) : '-'}</Metric>
                            <Text className="text-xs text-slate-400 mt-1">of {systemStats ? formatBytes(systemStats.memory.total) : '-'}</Text>
                        </div>
                        <Activity className="text-purple-500" />
                    </Flex>
                    <ProgressBar
                        value={systemStats ? (systemStats.memory.active / systemStats.memory.total) * 100 : 0}
                        color="blue"
                        className="mt-4"
                    />
                </Card>

                <Card className="bg-white ring-1 ring-slate-200 flex flex-col justify-between">
                    <Flex alignItems="start">
                        <div>
                            <Text>Disk I/O</Text>
                            <div className="flex gap-4 mt-1">
                                <div>
                                    <Text className="text-xs uppercase font-bold text-slate-400">Read</Text>
                                    <Text className="font-mono">{systemStats ? Math.round(systemStats.io.rIO || 0) : 0} IOPS</Text>
                                </div>
                                <div>
                                    <Text className="text-xs uppercase font-bold text-slate-400">Write</Text>
                                    <Text className="font-mono">{systemStats ? Math.round(systemStats.io.wIO || 0) : 0} IOPS</Text>
                                </div>
                            </div>
                        </div>
                        <Zap className="text-yellow-500" />
                    </Flex>
                </Card>
            </Grid>

            {/* 5. Disk Usage Cards */}
            <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
                {disks.map((disk, idx) => (
                    <Card key={idx} decoration="top" decorationColor={disk.usePercent > 90 ? "red" : "blue"} className="bg-white ring-1 ring-slate-200">
                        <Flex alignItems="start">
                            <div className="truncate">
                                <Text>Drive {disk.mount}</Text>
                                <Metric className="truncate">{formatBytes(disk.size)}</Metric>
                            </div>
                            <HardDrive className={`h-8 w-8 ${disk.usePercent > 90 ? 'text-red-500' : 'text-blue-500'} opacity-80`} />
                        </Flex>

                        <div className="mt-4">
                            <Flex>
                                <Text className="truncate">{disk.type}</Text>
                                <Text>{disk.usePercent.toFixed(1)}%</Text>
                            </Flex>
                            <ProgressBar value={disk.usePercent} color={disk.usePercent > 90 ? "red" : "blue"} className="mt-2" />
                        </div>

                        <Flex className="mt-4 pt-4 border-t border-slate-100">
                            <div>
                                <Text className="text-xs uppercase tracking-wider text-slate-400">Used Space</Text>
                                <Text className="font-semibold text-slate-700">{formatBytes(disk.used)}</Text>
                            </div>
                            <div className="text-right">
                                <Text className="text-xs uppercase tracking-wider text-slate-400">Free Space</Text>
                                <Text className="font-semibold text-emerald-600">{formatBytes(disk.available)}</Text>
                            </div>
                        </Flex>
                    </Card>
                ))}
            </Grid>

            {/* 6. Historical Trend (Total Storage) */}
            {history.length > 0 && (
                <Card className="bg-white ring-1 ring-slate-200">
                    <Title>Storage Growth Trend (Current Session)</Title>
                    <AreaChart
                        className="h-72 mt-4"
                        data={history}
                        index="time"
                        categories={disks.map(d => d.mount)}
                        colors={["blue", "cyan", "indigo", "violet"]}
                        valueFormatter={(number) => `${number} GB`}
                        showAnimation={true}
                    />
                </Card>
            )}

            {/* 7. Analytics & Quick Actions */}
            <Grid numItems={1} numItemsLg={3} className="gap-6">
                <Card className="col-span-2 bg-white ring-1 ring-slate-200 min-h-[300px]">
                    <Title>Quick Analytics</Title>
                    <div className="flex gap-6 mt-6 h-full items-center">
                        <DonutChart
                            data={chartData}
                            category="size"
                            index="name"
                            valueFormatter={(number) => `${number.toFixed(2)} GB`}
                            colors={["blue", "cyan", "indigo", "violet"]}
                            className="h-40 w-40"
                        />

                        <div className="flex-1 space-y-3">
                            <Title className="text-sm">Largest Folders {scanResults && `in ${scanResults.path}`}</Title>
                            {topDirs.length > 0 ? (
                                topDirs.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                                        <span className="truncate max-w-[200px] font-medium">{item.name}</span>
                                        <Badge size="xs">{formatBytes(item.value)}</Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-slate-400 italic py-4">
                                    No scan data available. Start a scan to analyze.
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Quick Utilities Panel */}
                <Card className="bg-white ring-1 ring-slate-200">
                    <Title>Quick Utilities</Title>
                    <Text className="mb-4">Common actions</Text>
                    <div className="space-y-3">
                        <Button
                            className="w-full justify-start"
                            variant="secondary"
                            icon={Search}
                            onClick={() => navigate('/analyzer')}
                        >
                            Disk Analyzer
                        </Button>
                        <Button
                            className="w-full justify-start"
                            variant="secondary"
                            icon={Trash2}
                            color="red"
                            onClick={() => navigate('/cleanup')}
                        >
                            Junk Cleanup
                        </Button>
                        <Button
                            className="w-full justify-start"
                            variant="secondary"
                            icon={Copy}
                            color="purple"
                            onClick={() => navigate('/duplicates')}
                        >
                            Duplicate Finder
                        </Button>
                        <Button
                            className="w-full justify-start"
                            variant="secondary"
                            icon={Sparkles}
                            color="indigo"
                            onClick={() => navigate('/assistant')}
                        >
                            Smart Assistant
                        </Button>
                        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 mt-4">
                            <div className="flex items-center gap-2">
                                <Activity size={16} />
                                <span className="font-bold">System Status</span>
                            </div>
                            <div className="mt-1 text-[10px] opacity-80">
                                {systemStats ? `Monitoring Active (${systemStats.cpu?.load || 0}% CPU)` : 'Initializing...'}
                            </div>
                        </div>
                    </div>
                </Card>
            </Grid>
        </div>
    );
}
