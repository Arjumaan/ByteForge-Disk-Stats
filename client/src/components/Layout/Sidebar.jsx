import { Home, HardDrive, Trash2, Settings, PieChart, Activity, FileText, Database, List, Cpu, Globe, Zap, ScrollText, Monitor, AppWindow } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Space Analyzer', icon: PieChart, path: '/analyzer' },
    { name: 'Cleanup', icon: Trash2, path: '/cleanup' },
    { name: 'Apps Manager', icon: HardDrive, path: '/apps' },
    { name: 'Registry', icon: Database, path: '/registry' },
    { name: 'Task Manager', icon: Cpu, path: '/processes' },
    { name: 'Process Tree', icon: Activity, path: '/process-tree' },
    { name: 'Hardware Health', icon: Monitor, path: '/hardware' },
    { name: 'Software Health', icon: AppWindow, path: '/software' },
    { name: 'Network', icon: Globe, path: '/network' },
    { name: 'Power', icon: Zap, path: '/power' },
    { name: 'Event Viewer', icon: List, path: '/events' },
    { name: 'Live Logs', icon: ScrollText, path: '/logs-live' },
    { name: 'Reports', icon: FileText, path: '/reports' },
    { name: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar() {
    const location = useLocation();

    return (
        <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col shadow-sm">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="ByteForge Logo" className="w-16 h-16 object-contain drop-shadow-sm" />
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">ByteForge</h1>
                        <p className="text-[11px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Stats Board</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">Storage Status</p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">75% Safe</p>
                </div>
            </div>
        </div>
    );
}
