import React, { useState, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import {
    Users,
    AlertTriangle,
    Map as MapIcon,
    TrendingUp,
    Activity,
    Shield,
    Bell,
    Settings,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    LayoutDashboard,
    Layers,
    UserCheck,
    Camera,
    Zap,
    Play,
    Pause
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// --- CONFIG ---
const CONFIG = {
    CAMERA_ID: "CAM_ZONE_ALPHA",
    BACKEND_URL: "http://localhost:3000",
    PUSHER_KEY: "98e19deafff5fb2017e8",
    PUSHER_CLUSTER: "ap2"
};

// --- Components ---
const StatCard = ({ title, value, change, icon: Icon, trend, isAlert }) => (
    <div className={cn(
        "dashboard-card p-5 flex flex-col gap-3 transition-all duration-500 bg-white rounded-xl border border-zinc-200 shadow-sm",
        isAlert ? "border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] bg-rose-50" : ""
    )}>
        <div className="flex justify-between items-start">
            <div className={cn("p-2 rounded-lg", isAlert ? "bg-rose-500/20" : "bg-zinc-100")}>
                <Icon className={cn("w-5 h-5", isAlert ? "text-rose-500" : "text-emerald-600")} />
            </div>
            <div className={cn(
                "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {change}
            </div>
        </div>
        <div>
            <p className="text-zinc-500 text-sm font-medium">{title}</p>
            <h3 className={cn("text-2xl font-bold mt-1", isAlert ? "text-rose-600" : "text-zinc-900")}>{value}</h3>
        </div>
    </div>
);

export default function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen] = useState(true);

    // Real Data State
    const [liveCount, setLiveCount] = useState(0);
    const [isAlert, setIsAlert] = useState(false);
    const [history, setHistory] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("Connecting...");

    // --- Real-time Connection via Pusher ---
    useEffect(() => {
        // 1. Fetch initial history from Backend
        fetch(`${CONFIG.BACKEND_URL}/api/history/${CONFIG.CAMERA_ID}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    const formattedHistory = data.map(item => ({
                        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        count: item.count
                    }));
                    setHistory(formattedHistory.slice(-20)); // Keep UI history short

                    const latest = data[data.length - 1];
                    setLiveCount(latest.count);
                    setIsAlert(latest.status !== "NORMAL");
                }
            })
            .catch(err => console.error("Could not fetch history:", err));

        // 2. Connect to Pusher
        const pusher = new Pusher(CONFIG.PUSHER_KEY, {
            cluster: CONFIG.PUSHER_CLUSTER,
        });

        pusher.connection.bind('connected', () => setConnectionStatus("System Live"));
        pusher.connection.bind('disconnected', () => setConnectionStatus("System Offline"));

        const channel = pusher.subscribe('crowd-channel');

        channel.bind('density-update', function (newData) {
            if (newData.camera_id === CONFIG.CAMERA_ID) {
                setLiveCount(newData.count);
                setIsAlert(newData.status !== "NORMAL");

                const time = new Date(newData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                setHistory(prev => [...prev, { time, count: newData.count }].slice(-20));
            }
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8">
                        {/* Hero Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title={`Live Counter (${CONFIG.CAMERA_ID})`} value={liveCount} change={isAlert ? "High" : "Normal"} icon={Users} trend={isAlert ? "up" : "down"} isAlert={isAlert} />
                            <StatCard title="Avg. Dwell Time" value="12m" change="-2.1%" icon={Clock} trend="down" />
                            <StatCard title="Active Alerts" value={isAlert ? "1" : "0"} change={isAlert ? "+1" : "0"} icon={AlertTriangle} trend={isAlert ? "up" : "down"} isAlert={isAlert} />
                            <StatCard title="Staff On Duty" value="24" change="0%" icon={Shield} trend="up" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className={cn("lg:col-span-2 dashboard-card p-6 flex flex-col gap-6 transition-all duration-500 bg-white rounded-xl border border-zinc-200 shadow-sm", isAlert ? "border-rose-500/30 bg-rose-50" : "")}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", isAlert ? "bg-rose-500/20" : "bg-emerald-500/20")}>
                                            <TrendingUp className={cn("w-4 h-4", isAlert ? "text-rose-500" : "text-emerald-500")} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">Live Density Stream</h3>
                                            <p className="text-zinc-500 text-sm">Real-time data from YOLOv11 Source</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded border border-zinc-200">
                                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Live Socket</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={history.length > 0 ? history : [{ time: '00:00', count: 0 }]}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={isAlert ? "#f43f5e" : "#10b981"} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={isAlert ? "#f43f5e" : "#10b981"} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                                            <XAxis dataKey="time" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                                            <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px' }} itemStyle={{ color: isAlert ? '#f43f5e' : '#10b981' }} />
                                            <Area type="monotone" dataKey="count" stroke={isAlert ? "#f43f5e" : "#10b981"} fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className={cn("dashboard-card p-6 flex flex-col gap-4 transition-all duration-500 bg-white rounded-xl border border-zinc-200 shadow-sm", isAlert ? "border-rose-50 shadow-[0_0_30px_rgba(244,63,94,0.2)]" : "")}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-zinc-500" />
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Live Feed: {CONFIG.CAMERA_ID}</h3>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-rose-500 uppercase">REC</span>
                                    </div>
                                </div>
                                <div className="relative aspect-video bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 flex items-center justify-center">
                                    <img
                                        src="http://localhost:5000/video_feed"
                                        alt="Live YOLOv11 Feed"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="absolute inset-0 hidden flex-col items-center justify-center bg-zinc-900/10 backdrop-blur-sm">
                                        <Camera className="w-12 h-12 text-zinc-400 mb-2" />
                                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Waiting for Edge Node Stream...</span>
                                    </div>
                                    {isAlert && <div className="absolute inset-0 border-4 border-rose-500 animate-pulse pointer-events-none" />}
                                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/60 backdrop-blur rounded text-[10px] font-mono flex items-center gap-2 text-zinc-900 border border-zinc-200">
                                        <Users className="w-3 h-3 text-emerald-600" />
                                        <span className="font-bold">DETECTED: {liveCount}</span>
                                    </div>
                                </div>
                                <div className="mt-auto space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase"><span>Source Health</span><span className="text-emerald-600">98%</span></div>
                                    <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden"><div className="w-[98%] h-full bg-emerald-500" /></div>
                                    <p className="text-[10px] text-zinc-400 leading-relaxed italic">* YOLOv11 Inference running on Edge Node.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'map':
                return (
                    <div className="space-y-8 h-full flex flex-col">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Live Density Map</h2>
                                <p className="text-zinc-500">Spatial distribution of crowd across all monitored zones.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-lg">
                                    <Layers className="w-4 h-4 text-zinc-500" />
                                    <span className="text-xs font-medium">Heatmap Layer</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-lg">
                                    <UserCheck className="w-4 h-4 text-zinc-500" />
                                    <span className="text-xs font-medium">Staff Markers</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 dashboard-card relative overflow-hidden bg-zinc-50 rounded-xl border border-zinc-200">
                            <div className="absolute inset-0 grid grid-cols-12 md:grid-cols-24 grid-rows-8 md:grid-rows-16 opacity-10">
                                {Array.from({ length: 384 }).map((_, i) => (
                                    <div key={i} className="border-[0.5px] border-zinc-300" />
                                ))}
                            </div>
                            {/* Heatmap Blobs based on live data if in alert zone */}
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 5, repeat: Infinity }} className={cn("absolute top-1/4 left-1/4 w-64 h-64 blur-[100px] rounded-full", isAlert ? "bg-rose-500/40" : "bg-emerald-500/20")} />

                            {/* Zone Markers */}
                            <div className="absolute top-[20%] left-[30%] group cursor-pointer">
                                <div className={cn("w-4 h-4 rounded-full border-4 border-white", isAlert ? "bg-rose-500 shadow-[0_0_10px_#ef4444] animate-pulse" : "bg-emerald-500 shadow-[0_0_10px_#10b981]")} />
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-zinc-200 px-2 py-1 rounded shadow-sm text-[10px] whitespace-nowrap opacity-100 transition-opacity text-zinc-900 font-bold">
                                    {CONFIG.CAMERA_ID} ({liveCount}) {isAlert && "- ALERT"}
                                </div>
                            </div>
                            <div className="absolute top-[50%] left-[50%] group cursor-pointer">
                                <div className="w-4 h-4 bg-amber-500 rounded-full border-4 border-white shadow-[0_0_10px_#f59e0b]" />
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-zinc-200 px-2 py-1 rounded shadow-sm text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity text-zinc-900 font-bold">
                                    Food Court (Offline)
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'analytics':
                return (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Historical Analytics</h2>
                                <p className="text-zinc-500">Long-term trends and peak hour analysis.</p>
                            </div>
                            <select className="bg-white border border-zinc-200 rounded-lg px-4 py-2 text-sm text-zinc-900 shadow-sm">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>Custom Range</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="dashboard-card p-6 space-y-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
                                <h3 className="font-bold text-zinc-900">Peak Occupancy by Day</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={[
                                            { day: 'Mon', count: 120 },
                                            { day: 'Tue', count: 140 },
                                            { day: 'Wed', count: 110 },
                                            { day: 'Thu', count: 180 },
                                            { day: 'Fri', count: 240 },
                                            { day: 'Sat', count: 320 },
                                            { day: 'Sun', count: 280 },
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                                            <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} />
                                            <YAxis stroke="#a1a1aa" fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px' }} />
                                            <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="dashboard-card p-6 space-y-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
                                <h3 className="font-bold text-zinc-900">Average Dwell Time per Zone</h3>
                                <div className="space-y-4">
                                    {[
                                        { zone: CONFIG.CAMERA_ID, time: '12m', color: 'bg-emerald-500' },
                                        { zone: 'Food Court', time: '32m', color: 'bg-amber-500' },
                                        { zone: 'Exhibition A', time: '82m', color: 'bg-blue-500' },
                                        { zone: 'South Gate', time: '12m', color: 'bg-rose-500' },
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">{item.zone}</span>
                                                <span className="font-bold text-zinc-900">{item.time}</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                                                <div className={cn("h-full", item.color)} style={{ width: `${Math.random() * 60 + 40}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'zones':
                return (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Zone Management</h2>
                                <p className="text-zinc-500">Configure thresholds and monitor individual zone health.</p>
                            </div>
                            <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">Add New Zone</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { name: CONFIG.CAMERA_ID, count: liveCount, cap: "Dyn", status: isAlert ? 'Critical' : 'Optimal' }
                            ].map((zone, i) => (
                                <div key={i} className="dashboard-card p-6 space-y-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-zinc-900">{zone.name}</h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                            zone.status === 'Optimal' ? "bg-emerald-500/10 text-emerald-600" :
                                                zone.status === 'High' ? "bg-amber-500/10 text-amber-600" :
                                                    "bg-rose-500/10 text-rose-600"
                                        )}>{zone.status}</span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-zinc-900">{zone.count}</span>
                                        <span className="text-zinc-500 text-sm mb-1">/ Live Data</span>
                                    </div>
                                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                        <div className={cn(
                                            "h-full w-full",
                                            zone.status === 'Optimal' ? "bg-emerald-500" :
                                                zone.status === 'High' ? "bg-amber-500" :
                                                    "bg-rose-500"
                                        )} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'staff':
            default:
                return (
                    <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
                        <Shield className="w-16 h-16 mb-4 opacity-50" />
                        <p>Staff view available in premium tier.</p>
                    </div>
                );
        }
    };

    return (
        <div className={cn(
            "flex h-screen bg-[#f9fafb] text-zinc-900 overflow-hidden transition-all duration-700 font-sans",
            isAlert ? "ring-inset ring-4 ring-rose-500/20" : ""
        )}>
            {/* Sidebar */}
            <aside className={cn(
                "border-r border-zinc-200 bg-white transition-all duration-300 flex flex-col z-20 shadow-sm relative",
                isSidebarOpen ? "w-64" : "w-20"
            )}>
                <div className="p-6 flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-500 shrink-0",
                        isAlert ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    )}>
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    {isSidebarOpen && <span className="font-extrabold text-xl tracking-tight text-zinc-900 truncate">Drishti<span className="font-light text-zinc-500">Flow</span></span>}
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'map', icon: MapIcon, label: 'Live Map' },
                        { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
                        { id: 'zones', icon: Layers, label: 'Zones' },
                        { id: 'staff', icon: Shield, label: 'Staff' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium",
                                activeTab === item.id
                                    ? (isAlert ? "bg-rose-500/10 text-rose-700 shadow-sm" : "bg-emerald-500/10 text-emerald-700 shadow-sm")
                                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                            )}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {isSidebarOpen && <span className="text-sm">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-200 space-y-4">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-zinc-900 rounded-xl transition-colors font-medium">
                        <Settings className="w-5 h-5 shrink-0" />
                        {isSidebarOpen && <span className="text-sm">Settings</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-[#f9fafb]">
                {/* Header */}
                <header className={cn(
                    "h-16 border-b border-zinc-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md z-10 transition-colors duration-500 shadow-sm",
                    isAlert ? "border-rose-500/30 bg-rose-50" : ""
                )}>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search zones, staff, or alerts..."
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200 shadow-inner">
                            <div className={cn("w-2 h-2 rounded-full", connectionStatus === "System Live" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {connectionStatus}
                            </span>
                        </div>
                        <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors relative">
                            <Bell className="w-5 h-5" />
                            {isAlert && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-bounce" />}
                        </button>
                        <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center overflow-hidden text-emerald-700 font-bold text-xs ring-2 ring-white">
                            AD
                        </div>
                    </div>
                </header>

                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
                    {/* Alert Banner */}
                    <AnimatePresence>
                        {isAlert && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, scale: 0.95 }}
                                animate={{ height: 'auto', opacity: 1, scale: 1 }}
                                exit={{ height: 0, opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="bg-rose-500 text-white shadow-lg shadow-rose-500/20 px-6 py-4 rounded-xl flex items-center justify-between overflow-hidden"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                                        <AlertTriangle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold tracking-tight text-lg leading-tight uppercase">CROWD CRUSH HAZARD DETECTED</h3>
                                        <p className="text-rose-100 text-xs font-medium mt-0.5">ZONE: {CONFIG.CAMERA_ID} is exceeding safety thresholds.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono font-bold bg-black/20 px-3 py-1.5 rounded-lg border border-black/10">PEAK: {liveCount}</span>
                                    <button className="text-xs font-bold bg-white text-rose-600 px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors shadow-sm">DISPATCH STAFF</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
