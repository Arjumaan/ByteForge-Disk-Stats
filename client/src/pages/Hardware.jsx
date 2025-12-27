import React, { useEffect, useState } from 'react';
import { Card, Title, Text, Grid, Badge, Flex, Metric, List, ListItem, Tooltip } from '@tremor/react';
import { Cpu, Database, HardDrive, Monitor, Wifi, AlertTriangle, CheckCircle, Server, AlertCircle } from 'lucide-react';
import { useStats } from '../context/StatsContext';

export default function Hardware() {
    const { latest } = useStats(); // Live stats (CPU Load, RAM Usage)
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const backend = import.meta.env.VITE_BACKEND_URL || "/api";

    useEffect(() => {
        fetch(`${backend}/health/hardware`)
            .then(res => res.json())
            .then(data => {
                setInfo(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Hardware fetch error", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 animate-pulse">Scanning Hardware Components...</div>;
    if (!info) return <div className="p-10 text-red-500">Failed to load hardware information.</div>;

    const { system, cpu, memory, disks, graphics, network } = info;
    const liveCpu = latest?.cpu || 0;
    const liveRam = latest?.ram || 0;
    const cpuTemp = cpu.temp || 0;

    // Health Checks
    const cpuStatus = cpuTemp > 90 ? 'critical' : (cpuTemp > 80 || liveCpu > 90 ? 'warning' : 'healthy');
    const ramStatus = liveRam > 90 ? 'warning' : 'healthy';
    const diskFailures = disks.filter(d => d.status && d.status.toLowerCase() !== 'ok');

    const StatusBadge = ({ status, text }) => {
        let color = "emerald";
        let Icon = CheckCircle;
        if (status === 'warning') { color = "amber"; Icon = AlertTriangle; }
        if (status === 'critical') { color = "red"; Icon = AlertCircle; }
        return (
            <Badge color={color} icon={Icon}>
                {text || status.toUpperCase()}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div>
                <Title className="text-2xl font-bold">Hardware Health</Title>
                <Text>Detailed status of system components</Text>
            </div>

            <Grid numItems={1} numItemsLg={2} className="gap-6">

                {/* CPU Card */}
                <Card decoration="top" decorationColor={cpuStatus === 'critical' ? 'red' : (cpuStatus === 'warning' ? 'amber' : 'blue')}>
                    <Flex className="mb-4">
                        <Flex justifyContent="start" className="gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                                <Cpu size={32} />
                            </div>
                            <div>
                                <Title>Processor (CPU)</Title>
                                <Text>{cpu.manufacturer} {cpu.brand}</Text>
                            </div>
                        </Flex>
                        <StatusBadge status={cpuStatus} text={cpuStatus === 'healthy' ? 'Health Good' : 'High Load/Temp'} />
                    </Flex>

                    <Grid numItems={2} className="gap-4 mt-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Text>Core Count</Text>
                            <Metric>{cpu.cores} <span className="text-sm font-normal text-slate-500">Physical</span></Metric>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Text>Speed</Text>
                            <Metric>{cpu.speed} <span className="text-sm font-normal text-slate-500">GHz</span></Metric>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Text>Temperature</Text>
                            {cpuTemp > 0 ? (
                                <Metric className={cpuTemp > 80 ? "text-red-500" : ""}>{cpuTemp}°C</Metric>
                            ) : (
                                <div className="flex flex-col">
                                    <Metric className="text-slate-400">N/A</Metric>
                                    <Text className="text-xs text-amber-600 mt-1">Requires Admin</Text>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Text>Current Load</Text>
                            <Metric className={liveCpu > 90 ? "text-red-500" : ""}>{liveCpu}%</Metric>
                        </div>
                    </Grid>
                </Card>

                {/* Memory Card */}
                <Card decoration="top" decorationColor={ramStatus === 'warning' ? 'amber' : 'violet'}>
                    <Flex className="mb-4">
                        <Flex justifyContent="start" className="gap-4">
                            <div className="p-3 bg-violet-100 rounded-lg text-violet-600">
                                <Server size={32} />
                            </div>
                            <div>
                                <Title>Memory (RAM)</Title>
                                <Text>{(memory[0]?.type || "DDR")}</Text>
                            </div>
                        </Flex>
                        <StatusBadge status={ramStatus} text={ramStatus === 'healthy' ? 'Optimal' : 'High Usage'} />
                    </Flex>

                    <Grid numItems={2} className="gap-4 mt-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Text>Total System Memory</Text>
                            <Metric>{(memory.reduce((a, b) => a + b.size, 0) / 1024 / 1024 / 1024).toFixed(1)} GB</Metric>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Text>Active Usage</Text>
                            <Metric className={liveRam > 90 ? "text-amber-500" : ""}>{liveRam}%</Metric>
                        </div>
                    </Grid>

                    <Title className="mt-6 mb-2">Modules</Title>
                    <List>
                        {memory.map((m, i) => (
                            <ListItem key={i}>
                                <span>Slot {i + 1} ({m.formFactor || "DIMM"})</span>
                                <span>{(m.size / 1024 / 1024 / 1024).toFixed(1)} GB @ {m.clockSpeed}MHz</span>
                            </ListItem>
                        ))}
                    </List>
                </Card>

                {/* System Info */}
                <Card decoration="top" decorationColor="slate">
                    <Flex className="mb-4">
                        <Flex justifyContent="start" className="gap-4">
                            <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                                <Monitor size={32} />
                            </div>
                            <div>
                                <Title>System Information</Title>
                                <Text>{system.manufacturer} {system.model}</Text>
                            </div>
                        </Flex>
                        <Badge color="slate">Device</Badge>
                    </Flex>
                    <List className="mt-4">
                        <ListItem>
                            <span>Serial Number</span>
                            <span>{system.serial === 'System Serial Number' ? 'OEM / Default' : system.serial}</span>
                        </ListItem>
                        <ListItem>
                            <span>BIOS Version</span>
                            <span>{system.version}</span>
                        </ListItem>
                        <ListItem>
                            <span>SKU</span>
                            <span>{system.sku || "N/A"}</span>
                        </ListItem>
                    </List>
                </Card>

                {/* GPU Info */}
                {graphics && graphics.length > 0 && (
                    <Card decoration="top" decorationColor="emerald">
                        <Flex className="mb-4">
                            <Flex justifyContent="start" className="gap-4">
                                <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                                    <Monitor size={32} />
                                </div>
                                <div>
                                    <Title>Graphics (GPU)</Title>
                                    <Text>{graphics[0].model}</Text>
                                </div>
                            </Flex>
                            <Badge color="emerald" icon={CheckCircle}>Active</Badge>
                        </Flex>
                        <List className="mt-4">
                            {graphics.map((g, i) => (
                                <ListItem key={i}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{g.model}</span>
                                        <span className="text-xs text-gray-500">{g.vendor}</span>
                                    </div>
                                    <span>{g.vram ? `${g.vram / 1024} GB VRAM` : (g.vramDynamic ? "Dynamic VRAM" : "Integrated")}</span>
                                </ListItem>
                            ))}
                        </List>
                    </Card>
                )}

                {/* Disks */}
                <Card className="col-span-1 lg:col-span-2" decoration="top" decorationColor={diskFailures.length > 0 ? "red" : "indigo"}>
                    <Flex className="mb-4">
                        <Flex justifyContent="start" className="gap-4">
                            <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                                <HardDrive size={32} />
                            </div>
                            <div>
                                <Title>Storage Devices</Title>
                                <Text>{disks.length} Physical Drive(s) Detected</Text>
                            </div>
                        </Flex>
                        {diskFailures.length > 0 ? (
                            <Badge color="red" icon={AlertCircle}>Hardware Failure Detected</Badge>
                        ) : (
                            <Badge color="indigo" icon={CheckCircle}>All Drives Healthy</Badge>
                        )}
                    </Flex>

                    <Grid numItems={1} numItemsMd={2} className="gap-4">
                        {disks.map((d, i) => (
                            <div key={i} className="border p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <Flex>
                                    <div className="flex flex-col">
                                        <Text className="font-bold text-slate-700 dark:text-slate-200">{d.name}</Text>
                                        <Text className="text-xs">{d.vendor} {d.type}</Text>
                                    </div>
                                    <Badge size="xs" color={d.status === 'OK' ? "emerald" : "red"}>{d.status}</Badge>
                                </Flex>
                                <div className="mt-3 flex justify-between text-sm">
                                    <span className="text-slate-500">Capacity</span>
                                    <span className="font-mono">{(d.size / 1024 / 1024 / 1024).toFixed(0)} GB</span>
                                </div>
                                <div className="mt-1 flex justify-between text-sm">
                                    <span className="text-slate-500">Interface</span>
                                    <span className="font-mono">{d.interfaceType}</span>
                                </div>
                                <div className="mt-1 flex justify-between text-sm">
                                    <span className="text-slate-500">Serial</span>
                                    <span className="font-mono text-xs">{d.serialNum || "N/A"}</span>
                                </div>
                            </div>
                        ))}
                    </Grid>
                </Card>

            </Grid>
        </div>
    );
}
