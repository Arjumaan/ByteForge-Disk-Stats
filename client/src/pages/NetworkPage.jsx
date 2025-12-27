import React, { useEffect, useState, useMemo } from 'react';
import { Card, Title, Text, Metric, Grid, Badge, Flex, AreaChart, List, ListItem, Button } from '@tremor/react';
import { Wifi, Router, Shield, Globe, Activity, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useStats } from '../context/StatsContext';

const valueFormatter = (number) => `${parseFloat(number).toFixed(2)} KB/s`;

export default function NetworkPage() {
    const { diskNetwork } = useStats(); // Live updates every 5s
    const [details, setDetails] = useState(null);
    const [history, setHistory] = useState([]);

    const backend = import.meta.env.VITE_BACKEND_URL || "/api";

    // 1. Fetch detailed info on mount
    useEffect(() => {
        axios.get(`${backend}/network/details`)
            .then(res => setDetails(res.data))
            .catch(err => console.error("Network details fetch error:", err));
    }, [backend]);

    // 2. Accumulate history from live socket data
    useEffect(() => {
        if (diskNetwork?.network) {
            const timestamp = new Date().toLocaleTimeString();
            let totalTx = 0; // Total across all interfaces or primary?
            let totalRx = 0;

            // Simplify: Sum all active interfaces or pick primary if we knew it
            // 'diskNetwork.network' is array of { iface, tx_sec, rx_sec } form monitor service
            if (Array.isArray(diskNetwork.network)) {
                diskNetwork.network.forEach(n => {
                    totalTx += (n.tx_sec || 0) / 1024; // KB/s
                    totalRx += (n.rx_sec || 0) / 1024;
                });
            }

            setHistory(prev => {
                const newData = [...prev, { time: timestamp, "Upload": totalTx, "Download": totalRx }];
                if (newData.length > 20) newData.shift(); // Keep last 20 points
                return newData;
            });
        }
    }, [diskNetwork]);

    // Helper to find the "main" interface
    const activeInterface = useMemo(() => {
        if (!details?.interfaces) return null;
        // detailed interface from API (ip, mac, etc.)
        // details.wifi might clarify if it's wifi
        return details.interfaces[0] || {};
    }, [details]);

    // Live Stats
    const liveStats = useMemo(() => {
        let stats = { tx: 0, rx: 0 };
        if (diskNetwork?.network) {
            diskNetwork.network.forEach(n => {
                stats.tx += (n.tx_sec || 0) / 1024; // KB/s
                stats.rx += (n.rx_sec || 0) / 1024;
            });
        }
        return stats;
    }, [diskNetwork]);

    // Speed Test State
    const [speedTest, setSpeedTest] = useState({ loading: false, data: null, error: null });

    const runSpeedTest = async () => {
        setSpeedTest({ loading: true, data: null, error: null });
        try {
            const res = await axios.post(`${backend}/network/speedtest`);
            setSpeedTest({ loading: false, data: res.data, error: null });
        } catch (err) {
            setSpeedTest({ loading: false, data: null, error: err.response?.data?.error || err.message });
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div>
                <Title className="text-2xl font-bold">Network Dashboard</Title>
                <Text>Detailed connection information & real-time traffic</Text>
            </div>

            {/* Top Cards: Active Connection */}
            <Grid numItems={1} numItemsMd={2} className="gap-6">
                <Card decoration="top" decorationColor="blue">
                    <Flex justifyContent="start" alignItems="center" className="gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                            {details?.wifi ? <Wifi size={32} className="text-blue-600" /> : <Router size={32} className="text-blue-600" />}
                        </div>
                        <div>
                            <Text>Current Connection</Text>
                            <Metric>{details?.wifi?.ssid || activeInterface?.iface || "Ethernet"}</Metric>
                            <Flex className="gap-2 mt-1 justify-start">
                                <Badge size="xs" color="emerald">Connected</Badge>
                                {details?.wifi && <Badge size="xs" color="slate">{details.wifi.security}</Badge>}
                                <Badge size="xs" color="blue">{activeInterface?.type || "Wired"}</Badge>
                            </Flex>
                        </div>
                    </Flex>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded dark:border-gray-700">
                            <Text className="text-xs uppercase">IP Address (v4)</Text>
                            <div className="font-mono text-lg font-semibold dark:text-gray-200">{activeInterface?.ip4 || "Loading..."}</div>
                            <Text className="text-xs text-gray-500">{activeInterface?.ip6 || ""}</Text>
                        </div>
                        <div className="p-3 border rounded dark:border-gray-700">
                            <Text className="text-xs uppercase">MAC Address</Text>
                            <div className="font-mono text-lg font-semibold dark:text-gray-200">{activeInterface?.mac || "Loading..."}</div>
                        </div>
                    </div>
                </Card>

                <Card decoration="top" decorationColor="violet">
                    <Flex justifyContent="start" alignItems="center" className="gap-4 mb-4">
                        <Activity size={24} className="text-violet-600" />
                        <Title>Bandwidth Usage (Live)</Title>
                    </Flex>

                    <Flex className="gap-6">
                        <div className="flex-1 text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                            <Flex justifyContent="center" className="gap-2 mb-1">
                                <ArrowDown size={18} className="text-emerald-500" />
                                <Text>Download</Text>
                            </Flex>
                            <Metric className="text-emerald-600">{liveStats.rx.toFixed(1)} KB/s</Metric>
                        </div>
                        <div className="flex-1 text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                            <Flex justifyContent="center" className="gap-2 mb-1">
                                <ArrowUp size={18} className="text-blue-500" />
                                <Text>Upload</Text>
                            </Flex>
                            <Metric className="text-blue-600">{liveStats.tx.toFixed(1)} KB/s</Metric>
                        </div>
                    </Flex>

                    {/* Simple Bandwidth Bar - The requested "Graph Bar" */}
                    <div className="mt-6">
                        <Text className="text-xs mb-1">Total Bandwidth Activity</Text>
                        {/* Visual bar just showing relative scale (logarithmic visual trick or just caps) */}
                        <div className="h-4 w-full bg-gray-200 rounded overflow-hidden flex">
                            <div style={{ width: `${Math.min(liveStats.rx / 100, 100)}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
                            <div style={{ width: `${Math.min(liveStats.tx / 100, 100)}%` }} className="h-full bg-blue-500 transition-all duration-500" />
                        </div>
                    </div>
                </Card>
            </Grid>

            {/* Internet Speed Test Section */}
            <Card decoration="top" decorationColor="emerald">
                <Flex justifyContent="start" alignItems="center" className="gap-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                        <Activity size={24} className="text-emerald-600" />
                    </div>
                    <div>
                        <Title>Internet Connection Speed</Title>
                        <Text>Measure your actual internet download speed</Text>
                    </div>
                    <div className="ml-auto">
                        <Button
                            size="md"
                            variant="primary"
                            color="emerald"
                            disabled={speedTest.loading}
                            onClick={runSpeedTest}
                        >
                            {speedTest.loading ? "Testing..." : "Run Speed Test"}
                        </Button>
                    </div>
                </Flex>

                <div className="mt-6 flex flex-col md:flex-row gap-8 items-center justify-center py-4 bg-gray-50 dark:bg-gray-800 rounded-xl relative overflow-hidden">
                    {speedTest.loading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10 backdrop-blur-sm">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                                <Text className="font-semibold text-emerald-700">Downloading test file...</Text>
                            </div>
                        </div>
                    )}

                    <div className="text-center min-w-[150px]">
                        <Text>Download Speed</Text>
                        <div className="text-4xl font-bold text-slate-800 dark:text-white mt-1">
                            {speedTest.data ? speedTest.data.downloadSpeed : "0.00"}
                            <span className="text-lg text-slate-500 font-normal ml-1">Mbps</span>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-16 bg-gray-200 dark:bg-gray-700" />

                    <div className="text-center min-w-[150px]">
                        <Text>Duration</Text>
                        <div className="text-2xl font-semibold text-slate-600 dark:text-slate-300 mt-1">
                            {speedTest.data ? speedTest.data.duration.toFixed(1) : "0.0"}
                            <span className="text-sm text-slate-500 font-normal ml-1">s</span>
                        </div>
                    </div>

                    {speedTest.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600 font-medium">
                            Error: {speedTest.error}
                        </div>
                    )}
                </div>
            </Card>

            {/* Network Graph */}
            <Card>
                <Title>Network Traffic History (Session)</Title>
                <AreaChart
                    className="h-72 mt-4"
                    data={history}
                    index="time"
                    categories={["Download", "Upload"]}
                    colors={["emerald", "blue"]}
                    valueFormatter={valueFormatter}
                    showAnimation={true}
                />
            </Card>

            {/* Technical Details Grid */}
            <Grid numItems={1} numItemsMd={3} className="gap-6">
                {/* Gateway & DNS */}
                <Card>
                    <Flex justifyContent="start" className="gap-3 mb-2">
                        <Globe size={20} className="text-gray-500" />
                        <Title>Gateway & DNS</Title>
                    </Flex>
                    <List>
                        <ListItem>
                            <span>Default Gateway</span>
                            <span className="font-mono">{details?.gateway || "Unknown"}</span>
                        </ListItem>
                        <ListItem>
                            <span>DNS Suffix</span>
                            <span className="font-mono">{activeInterface?.dnsSuffix || "-"}</span>
                        </ListItem>
                        <ListItem>
                            <span>Mask</span>
                            <span className="font-mono">{activeInterface?.netmask || "-"}</span>
                        </ListItem>
                    </List>
                </Card>

                {/* Signal / Connection Details */}
                <Card>
                    <Flex justifyContent="start" className="gap-3 mb-2">
                        <div className="bg-orange-100 p-1 rounded">
                            <Shield size={20} className="text-orange-600" />
                        </div>
                        <Title>Security & Signal</Title>
                    </Flex>
                    {details?.wifi ? (
                        <List>
                            <ListItem>
                                <span>SSID</span>
                                <span>{details.wifi.ssid}</span>
                            </ListItem>
                            <ListItem>
                                <span>Protocol</span>
                                <span>{details.wifi.protocol || "802.11"}</span>
                            </ListItem>
                            <ListItem>
                                <span>Security</span>
                                <span>{details.wifi.security}</span>
                            </ListItem>
                            <ListItem>
                                <span>Signal Quality</span>
                                <span>{details.wifi.signalLevel}%</span>
                            </ListItem>
                            <ListItem>
                                <span>Channel</span>
                                <span>{details.wifi.channel} ({details.wifi.frequency} MHz)</span>
                            </ListItem>
                        </List>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            <Text>Wired Connection</Text>
                            <Text className="text-xs mt-2">Physical security applies</Text>
                        </div>
                    )}
                </Card>

                {/* Interface Capabilities */}
                <Card>
                    <Title>Interface Properties</Title>
                    <List className="mt-2">
                        <ListItem>
                            <span>Speed</span>
                            <span>{activeInterface?.speed ? `${activeInterface.speed} Mbit/s` : "Unknown"}</span>
                        </ListItem>
                        <ListItem>
                            <span>MTU</span>
                            <span>{activeInterface?.mtu || "1500"}</span>
                        </ListItem>
                        <ListItem>
                            <span>Duplex</span>
                            <span>{activeInterface?.duplex || "Auto"}</span>
                        </ListItem>
                        <ListItem>
                            <span>DHCP</span>
                            <span>{activeInterface?.dhcp ? "Enabled" : "Static"}</span>
                        </ListItem>
                    </List>
                </Card>
            </Grid>
        </div>
    );
}
