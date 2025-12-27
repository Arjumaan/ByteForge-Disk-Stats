const API_ROOT = '/api';

async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || response.statusText);
    }
    return response.json();
}

export const api = {
    getOverview: async () => {
        const response = await fetch(`${API_ROOT}/disk/overview`);
        return handleResponse(response);
    },

    startScan: async (path) => {
        const response = await fetch(`${API_ROOT}/disk/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        return handleResponse(response);
    },

    scanJunk: async () => {
        const response = await fetch(`${API_ROOT}/cleanup/scan`);
        return handleResponse(response);
    },

    cleanJunk: async (items) => {
        const response = await fetch(`${API_ROOT}/cleanup/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
        return handleResponse(response);
    },

    getApps: async () => {
        const response = await fetch(`${API_ROOT}/apps/list`);
        return handleResponse(response);
    },

    uninstallApp: async (uninstallString) => {
        const response = await fetch(`${API_ROOT}/apps/uninstall`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uninstallString })
        });
        return handleResponse(response);
    },

    monitor: {
        getStats: async () => {
            const response = await fetch(`${API_ROOT}/monitor/stats`);
            return handleResponse(response);
        },
        start: async () => {
            const response = await fetch(`${API_ROOT}/monitor/start`, { method: 'POST' });
            return handleResponse(response);
        },
        stop: async () => {
            const response = await fetch(`${API_ROOT}/monitor/stop`, { method: 'POST' });
            return handleResponse(response);
        }
    },

    getHistory: async () => {
        const response = await fetch(`${API_ROOT}/history`);
        return handleResponse(response);
    },

    findDuplicates: async (path) => {
        const response = await fetch(`${API_ROOT}/duplicates/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        return handleResponse(response);
    }
};
