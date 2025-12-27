import React from 'react';
import { Card, Title, Text, Metric, Grid, Badge, Flex, List, ListItem } from '@tremor/react';
import { Battery, Zap, Plug, Clock, Activity, Cpu, Heart } from 'lucide-react';
import { useStats } from '../context/StatsContext';

export default function Power() {
    const { latest } = useStats();

    // Safety handling for non-ready states
    if (!latest) return <div className="p-10 animate-fadeIn">Initializing System Stats...</div>;

    const { battery, uptime, cpu } = latest || {};

    // Default battery object
    const bat = battery || { hasBattery: false };
    const hasBattery = !!bat.hasBattery;

    // Calculate Health if Cycle Count is missing
    const health = bat.maxCapacity && bat.designedCapacity
        ? Math.round((bat.maxCapacity / bat.designedCapacity) * 100)
        : null;

    // Time Remaining Logic
    let timeLabel = "Status";
    let timeValue = "";

    if (bat.acConnected) {
        if (bat.isCharging) {
            if (bat.percent >= 99) {
                timeValue = "Fully Charged";
            } else if (bat.timeRemaining && bat.timeRemaining > 0) {
                const h = Math.floor(bat.timeRemaining / 60);
                const m = bat.timeRemaining % 60;
                timeValue = `${h}h ${m}m to full`;
            } else {
                timeValue = "Charging...";
            }
        } else {
            timeValue = "Plugged In";
        }
    } else {
        // Discharging
        timeLabel = "Time Remaining";
        if (bat.timeRemaining && bat.timeRemaining > 0) {
            const h = Math.floor(bat.timeRemaining / 60);
            const m = bat.timeRemaining % 60;
            timeValue = `${h}h ${m}m`;
        } else {
            timeValue = "Calculating...";
        }
    }

    // Format Uptime
    const formatUptime = (seconds) => {
        if (!seconds) return "0h 0m";
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        let s = `${h}h ${m}m`;
        if (d > 0) s = `${d}d ` + s;
        return s;
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div>
                <Title className="text-2xl font-bold">Power Management</Title>
                <Text>Real-time power supply and battery health monitoring</Text>
            </div>

            {hasBattery ? (
                // --- Laptop / Battery Mode ---
                <Grid numItems={1} numItemsMd={2} className="gap-6">
                    {/* Battery Status Card */}
                    <Card decoration="top" decorationColor={bat.isCharging ? "amber" : (bat.percent > 20 ? "emerald" : "red")}>
                        <Flex justifyContent="start" alignItems="center" className="gap-4 mb-6">
                            <div className={`p-3 rounded-full ${bat.isCharging ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {bat.isCharging ? <Zap size={32} /> : <Battery size={32} />}
                            </div>
                            <div>
                                <Title>Battery Status</Title>
                                <Text>{bat.isCharging ? "Charging" : "Discharging"}</Text>
                            </div>
                            <div className="ml-auto">
                                <Badge size="md" color={bat.acConnected ? "blue" : "slate"}>
                                    {bat.acConnected ? "AC Connected" : "On Battery"}
                                </Badge>
                            </div>
                        </Flex>

                        <div className="flex flex-col items-center justify-center py-8">
                            {/* Visual Battery Circle */}
                            <div className="relative w-32 h-32 rounded-full border-8 border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-inner">
                                <div className="text-center z-10">
                                    <Metric className="text-3xl">{bat.percent || 0}%</Metric>
                                    <Text className="text-xs">Capacity</Text>
                                </div>
                                {/* CSS Conic Gradient for Progress */}
                                <div className="absolute inset-0 rounded-full" style={{
                                    background: `conic-gradient(${bat.isCharging ? '#f59e0b' : '#10b981'} ${bat.percent * 3.6}deg, transparent 0deg)`,
                                    maskImage: 'radial-gradient(transparent 55%, black 56%)',
                                    WebkitMaskImage: 'radial-gradient(transparent 55%, black 56%)'
                                }}></div>
                            </div>
                        </div>

                        <Grid numItems={2} className="gap-4 mt-8">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-center">
                                <Flex justifyContent="center" className="gap-2 mb-1">
                                    <Clock size={16} className="text-gray-500" />
                                    <Text>{timeLabel}</Text>
                                </Flex>
                                <Metric className="text-xl">
                                    {timeValue}
                                </Metric>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-center">
                                <Flex justifyContent="center" className="gap-2 mb-1">
                                    {bat.cycleCount ? <Activity size={16} className="text-gray-500" /> : <Heart size={16} className="text-red-500" />}
                                    <Text>{bat.cycleCount ? "Cycle Count" : "Battery Health"}</Text>
                                </Flex>
                                <Metric className="text-xl">
                                    {bat.cycleCount || (health ? `${health}%` : "N/A")}
                                </Metric>
                            </div>
                        </Grid>
                    </Card>

                    {/* Detailed Specs */}
                    <Card>
                        <Title>Hardware Information</Title>
                        <List className="mt-4">
                            <ListItem>
                                <span>Manufacturer</span>
                                <span>{bat.manufacturer || "Unknown"}</span>
                            </ListItem>
                            <ListItem>
                                <span>Model</span>
                                <span>{bat.model || "Unknown"}</span>
                            </ListItem>
                            <ListItem>
                                <span>Serial</span>
                                <span>{bat.serial || "-"}</span>
                            </ListItem>
                            <ListItem>
                                <span>Voltage</span>
                                <span>{bat.voltage ? `${bat.voltage}V` : "Unknown"}</span>
                            </ListItem>
                            <ListItem>
                                <span>Design Capacity</span>
                                <span>{bat.designedCapacity ? `${bat.designedCapacity} mWh` : "-"}</span>
                            </ListItem>
                            <ListItem>
                                <span>Max Capacity</span>
                                <span>{bat.maxCapacity ? `${bat.maxCapacity} mWh` : "-"}</span>
                            </ListItem>
                        </List>

                        <div className="mt-6 pt-6 border-t dark:border-gray-700">
                            <Title>System Power Time</Title>
                            <div className="mt-2 flex items-center gap-3">
                                <Clock className="text-blue-500" />
                                <div className="text-2xl font-mono text-slate-700 dark:text-slate-200">
                                    {formatUptime(uptime)}
                                </div>
                            </div>
                            <Text className="text-xs mt-1">Total time system has been running</Text>
                        </div>
                    </Card>
                </Grid>
            ) : (
                // --- Desktop / AC Mode ---
                <Grid numItems={1} numItemsMd={2} className="gap-6">
                    <Card decoration="top" decorationColor="blue">
                        <Flex justifyContent="start" alignItems="center" className="gap-4">
                            <Plug size={32} className="text-blue-500" />
                            <div>
                                <Title>Power Source</Title>
                                <Text>AC Power (Plugged In)</Text>
                            </div>
                            <div className="ml-auto">
                                <Badge color="blue">Connected</Badge>
                            </div>
                        </Flex>
                        <div className="mt-6">
                            <Text>System is running on direct power.</Text>
                        </div>
                    </Card>

                    <Card decoration="top" decorationColor="violet">
                        <Title>System Uptime</Title>
                        <Metric className="mt-4">{formatUptime(uptime)}</Metric>
                    </Card>
                </Grid>
            )}
        </div>
    );
}
