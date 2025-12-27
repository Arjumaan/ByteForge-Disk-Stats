import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';

const DiskContext = createContext();

export function DiskProvider({ children }) {
    const [disks, setDisks] = useState([]);
    const [activeScan, setActiveScan] = useState(null);
    const [scanResults, setScanResults] = useState(null);
    const [systemStats, setSystemStats] = useState(null);
    const { isConnected, subscribe } = useWebSocket();

    // Load initial disk overview
    useEffect(() => {
        loadDisks();
    }, []);

    // Listen for scan updates
    useEffect(() => {
        if (!isConnected) return;

        const unsubProgress = subscribe('scan:progress', (data) => {
            console.log('Scan progress:', data);
            // Could update a progress bar here
        });

        const unsubComplete = subscribe('scan:complete', (data) => {
            console.log('Scan complete:', data);
            setScanResults(data);
            setActiveScan(null);
        });

        const unsubError = subscribe('scan:error', (err) => {
            console.error('Scan error:', err);
            setActiveScan(null);
        });

        const unsubStats = subscribe('system:stats', (data) => {
            setSystemStats(data);
        });

        return () => {
            unsubProgress && unsubProgress();
            unsubComplete && unsubComplete();
            unsubError && unsubError();
            unsubStats && unsubStats();
        };
    }, [isConnected, subscribe]);

    const loadDisks = async () => {
        try {
            const data = await api.getOverview();
            setDisks(data.disks || []);
        } catch (err) {
            console.error("Failed to load disks", err);
        }
    };

    const startScan = async (path) => {
        try {
            setActiveScan(path);
            await api.startScan(path);
        } catch (err) {
            console.error("Failed to start scan", err);
            setActiveScan(null);
        }
    };

    return (
        <DiskContext.Provider value={{ disks, scanResults, activeScan, startScan, isConnected, loadDisks, systemStats }}>
            {children}
        </DiskContext.Provider>
    );
}

export const useDisk = () => useContext(DiskContext);
