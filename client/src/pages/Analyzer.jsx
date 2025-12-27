import { useState, useMemo } from 'react';
import { Card, Title, Text, Button, Select, SelectItem, ProgressBar, Flex, Grid } from '@tremor/react';
import { Play, FolderOpen } from 'lucide-react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { useDisk } from '../context/DiskContext';
import clsx from 'clsx';

// Vibrant, professional palette
const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#0ea5e9', '#10b981'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 z-50">
                <p className="font-bold text-sm mb-1">{payload[0].payload.name}</p>
                <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Size:</span>
                    <span className="font-mono text-emerald-400">{formatBytes(payload[0].value)}</span>
                </div>
            </div>
        );
    }
    return null;
};

const CustomizedContent = (props) => {
    const { root, depth, x, y, width, height, index, name, value } = props;

    // Skip rendering very tiny blocks
    if (width < 8 || height < 8) return null;

    return (
        <g>
            {/* Base Color Rect */}
            <rect
                x={x + 1}
                y={y + 1}
                width={width - 2}
                height={height - 2}
                rx={4}
                ry={4}
                fill={depth < 2 ? COLORS[index % COLORS.length] : '#334155'}
                fillOpacity={1}
                style={{
                    filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.2))",
                    transition: "all 0.2s ease"
                }}
            />
            {/* Glossy Overlay (Top Shine) */}
            <rect
                x={x + 1}
                y={y + 1}
                width={width - 2}
                height={(height - 2) / 2}
                rx={4}
                ry={4}
                fill="url(#shineGradient)" // Needs defs, but we can simulate with rgba
                fillOpacity={0} // Fallback
                style={{ fill: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)" }}
            />
            {/* Simulation of gradient using SVG fill since CSS gradient on fill doesn't work directly in all browsers for rect */}
            <rect
                x={x + 1}
                y={y + 1}
                width={width - 2}
                height={height - 2}
                rx={4}
                ry={4}
                fill="white"
                fillOpacity={0.05}
                pointerEvents="none"
            />

            {depth === 1 && width > 50 && height > 35 ? (
                <>
                    <text
                        x={x + width / 2}
                        y={y + height / 2 - 5}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={Math.min(13, width / 7)}
                        fontWeight="700"
                        style={{
                            textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                            fontFamily: 'system-ui, sans-serif',
                            letterSpacing: '0.5px'
                        }}
                        pointerEvents="none"
                    >
                        {name.length > 14 ? name.substring(0, 11) + '..' : name}
                    </text>
                    <text
                        x={x + width / 2}
                        y={y + height / 2 + 12}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.9)"
                        fontSize={Math.min(10, width / 9)}
                        pointerEvents="none"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                    >
                        {formatBytes(value)}
                    </text>
                </>
            ) : null}
        </g>
    );
};

export default function Analyzer() {
    const { disks, startScan, activeScan, scanResults } = useDisk();
    const [selectedPath, setSelectedPath] = useState('');

    useMemo(() => {
        if (disks.length > 0 && !selectedPath) {
            setSelectedPath(disks[0].mount);
        }
    }, [disks, selectedPath]);

    const handleScan = () => {
        if (selectedPath) {
            startScan(selectedPath);
        }
    };

    const isScanning = activeScan === selectedPath;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Disk Space Analyzer</h2>
                    <p className="text-slate-500 mt-1">Identify large folders and reclaim space</p>
                </div>
            </div>

            <Card className="bg-white ring-1 ring-slate-200 shadow-sm">
                <Flex className="gap-4 justify-start">
                    <div className="w-64">
                        <Select value={selectedPath} onValueChange={setSelectedPath} disabled={isScanning}>
                            {disks.map(disk => (
                                <SelectItem key={disk.mount} value={disk.mount}>
                                    {disk.mount} ({formatBytes(disk.available)} free)
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                    <Button
                        icon={Play}
                        loading={isScanning}
                        onClick={handleScan}
                        disabled={!selectedPath || isScanning}
                        color="blue"
                    >
                        {isScanning ? 'Scanning...' : 'Start Scan'}
                    </Button>
                </Flex>

                {isScanning && (
                    <div className="mt-6">
                        <Flex className="mb-2">
                            <Text className="font-medium">Scanning {activeScan}...</Text>
                            <Text className="text-slate-400 text-xs">This may take a minute</Text>
                        </Flex>
                        <ProgressBar value={45} className="animate-pulse" color="blue" />
                    </div>
                )}
            </Card>

            {/* Visualization Area */}
            {scanResults ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                    <Card className="lg:col-span-2 flex flex-col min-h-[500px] bg-white ring-1 ring-slate-200 shadow-sm p-6">
                        <div className="mb-4">
                            <Title>Storage Treemap</Title>
                            <Text>Interactive map of {scanResults.path}. Largest items shown first.</Text>
                        </div>
                        <div className="flex-1 mt-2 min-h-0 bg-slate-50 rounded-xl border border-slate-100 p-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <Treemap
                                    data={scanResults.children}
                                    dataKey="value"
                                    ratio={4 / 3}
                                    stroke="#fff"
                                    fill="#8884d8"
                                    content={<CustomizedContent />}
                                    animationDuration={400}
                                >
                                    <Tooltip content={<CustomTooltip />} />
                                </Treemap>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="flex flex-col gap-4 overflow-y-auto max-h-[600px] bg-white ring-1 ring-slate-200 shadow-sm">
                        <div className="sticky top-0 bg-white pb-2 border-b border-slate-100 z-10">
                            <Title>Top Items</Title>
                            <Text className="text-xs text-slate-400">Largest folders in root</Text>
                        </div>
                        <div className="space-y-3">
                            {scanResults.children.slice(0, 15).map((child, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 transition-colors rounded-lg border border-slate-100 group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-colors",
                                            child.type === 'directory' ? "bg-blue-100 text-blue-600 group-hover:bg-blue-200" : "bg-slate-200"
                                        )}>
                                            <FolderOpen size={18} />
                                        </div>
                                        <div className="truncate min-w-0">
                                            <div className="font-semibold text-slate-900 truncate text-sm" title={child.name}>{child.name}</div>
                                            <Text className="text-[10px] text-slate-500">{child.children ? `${child.children.length} items` : 'File'}</Text>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <div className="font-mono font-bold text-slate-700 text-sm">
                                            {formatBytes(child.value)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            ) : (
                !isScanning && (
                    <div className="flex-1 border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl flex items-center justify-center text-slate-400 hover:border-blue-400 hover:bg-blue-50/10 transition-all cursor-pointer" onClick={() => document.querySelector('button')?.click()}>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <FolderOpen size={40} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-600">No Scan Results</h3>
                            <p className="text-slate-500">Select a drive above to visualize storage usage</p>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
