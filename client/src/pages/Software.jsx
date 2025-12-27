import React, { useEffect, useState } from 'react';
import { Card, Title, Text, Grid, Badge, Flex, List, ListItem, Metric } from '@tremor/react';
import { Command, Shield, Lock, Terminal, Box, Activity, AppWindow } from 'lucide-react';

export default function Software() {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const backend = import.meta.env.VITE_BACKEND_URL || "/api";

    useEffect(() => {
        fetch(`${backend}/health/software`)
            .then(res => res.json())
            .then(data => {
                setInfo(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 animate-pulse">Scanning Software Environment...</div>;
    if (!info) return <div className="p-10 text-red-500">Failed to load software info.</div>;

    const { os, security, env, status } = info;

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            <div>
                <Title className="text-2xl font-bold">Software Health</Title>
                <Text>Operating System, Security, and Run-time Environment</Text>
            </div>

            <Grid numItems={1} numItemsLg={2} className="gap-6">

                {/* OS Card */}
                <Card decoration="top" decorationColor="blue">
                    <Flex justifyContent="start" className="gap-4 mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                            <Command size={32} />
                        </div>
                        <div>
                            <Title>Operating System</Title>
                            <Text>{os.distro} {os.release}</Text>
                        </div>
                    </Flex>
                    <List>
                        <ListItem>
                            <span>Codename</span>
                            <span>{os.codename || "N/A"}</span>
                        </ListItem>
                        <ListItem>
                            <span>Architecture</span>
                            <span>{os.arch}</span>
                        </ListItem>
                        <ListItem>
                            <span>Kernel</span>
                            <span>{os.kernel}</span>
                        </ListItem>
                        <ListItem>
                            <span>Hostname</span>
                            <span>{os.hostname}</span>
                        </ListItem>
                        <ListItem>
                            <span>Build</span>
                            <span>{os.build}</span>
                        </ListItem>
                        <ListItem>
                            <span>UEFI</span>
                            <span>{os.uefi ? "Yes" : "Legacy/No"}</span>
                        </ListItem>
                    </List>
                </Card>

                {/* Security Card - Note: si.osInfo() gives limited security info, 
                    typically need admin rights or specific queries for AV/Firewall status.
                    SI doesn't provide AV status out of box easily cross-platform. 
                    We display UUID/Serial as proxy for Identity.
                 */}
                <Card decoration="top" decorationColor="emerald">
                    <Flex justifyContent="start" className="gap-4 mb-4">
                        <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                            <Shield size={32} />
                        </div>
                        <div>
                            <Title>System Identity & Security</Title>
                            <Text>Unique Identifiers</Text>
                        </div>
                    </Flex>
                    <List>
                        <ListItem>
                            <span>System UUID</span>
                            <span className="font-mono text-xs">{security.uuid}</span>
                        </ListItem>
                        <ListItem>
                            <span>Hardware Serial</span>
                            <span className="font-mono text-xs">{security.serial}</span>
                        </ListItem>
                        <ListItem>
                            <span>Secure Boot</span>
                            <Badge size="xs" color="slate">Unknown (Requires Admin)</Badge>
                        </ListItem>
                    </List>
                </Card>

                {/* Environment Card */}
                <Card decoration="top" decorationColor="amber">
                    <Flex justifyContent="start" className="gap-4 mb-4">
                        <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                            <Terminal size={32} />
                        </div>
                        <div>
                            <Title>Environment</Title>
                            <Text>Shell & Runtimes</Text>
                        </div>
                    </Flex>
                    <List>
                        <ListItem><span>Default Shell</span><span>{env.shell}</span></ListItem>
                        <ListItem><span>Node.js</span><span>{env.versions.node || "N/A"}</span></ListItem>
                        <ListItem><span>NPM</span><span>{env.versions.npm || "N/A"}</span></ListItem>
                        <ListItem><span>Python</span><span>{env.versions.python || "N/A"}</span></ListItem>
                        <ListItem><span>Java</span><span>{env.versions.java || "N/A"}</span></ListItem>
                        <ListItem><span>GCC</span><span>{env.versions.gcc || "N/A"}</span></ListItem>
                    </List>
                </Card>

                {/* Runtime Status */}
                <Card decoration="top" decorationColor="violet">
                    <Flex justifyContent="start" className="gap-4 mb-4">
                        <div className="p-3 bg-violet-100 rounded-lg text-violet-600">
                            <Activity size={32} />
                        </div>
                        <div>
                            <Title>Runtime Status</Title>
                            <Text>Current Process Statistics</Text>
                        </div>
                    </Flex>

                    <Grid numItems={2} className="gap-4 mt-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                            <Text>Total Processes</Text>
                            <Metric>{status.processes}</Metric>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                            <Text>Running</Text>
                            <Metric className="text-emerald-500">{status.running}</Metric>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                            <Text>Sleeping</Text>
                            <Metric className="text-blue-500">{status.sleeping}</Metric>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                            <Text>Blocked</Text>
                            <Metric className="text-red-500">{status.blocked}</Metric>
                        </div>
                    </Grid>
                </Card>

            </Grid>
        </div>
    );
}
