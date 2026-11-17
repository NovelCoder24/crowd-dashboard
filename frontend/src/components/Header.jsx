import React, { useState, useEffect } from 'react';
import {
  Clock,
  Volume2,
  VolumeX,
  Bell,
  AlertTriangle,
  Radio,
  Search,
  Wifi,
  ChevronDown,
} from 'lucide-react';

export default function Header({
  connectionStatus,
  transportMode,
  soundEnabled,
  setSoundEnabled,
  isAlert,
  activeAlertsCount = 0,
  activeZone,
  setActiveZone,
  zonesConfig = {},
  onOpenIncidentModal,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const isLive = connectionStatus.includes('Live') || connectionStatus.includes('Active');

  return (
    <header
      className={`h-16 border-b transition-colors duration-500 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-md z-30 sticky top-0 shadow-sm ${
        isAlert
          ? 'border-rose-300 bg-rose-50/70'
          : 'border-zinc-200 bg-white/95'
      }`}
    >
      {/* Left: Zone Selector & Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <div className="relative">
          <select
            value={activeZone}
            onChange={(e) => setActiveZone(e.target.value)}
            className="appearance-none bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 text-zinc-900 font-semibold text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all"
            aria-label="Active Monitored Zone"
          >
            {Object.entries(zonesConfig).map(([id, info]) => (
              <option key={id} value={id}>
                {info.name || id} ({info.code || id})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative hidden md:block w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search zones, sensors, response units..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-1 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 placeholder:text-zinc-400 transition-all font-medium"
          />
        </div>
      </div>

      {/* Right Controls: Real-time Clock, Sound Toggle, Status Pill, Alert Badge */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Real-time Clock */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-zinc-100/80 border border-zinc-200 rounded-lg text-zinc-700 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-bold tracking-wider">{formattedTime}</span>
          <span className="text-[10px] text-zinc-400 font-sans uppercase">UTC+5:30</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Mute alarm chime' : 'Enable audio alarm chime'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            soundEnabled
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 shadow-sm'
              : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'
          }`}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="hidden md:inline text-[11px]">Audio Alert ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline text-[11px]">Audio Muted</span>
            </>
          )}
        </button>

        {/* Status Pill with Transport Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-inner ${
            isLive
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-zinc-100 border-zinc-200 text-zinc-500'
          }`}
          title={`Transport: ${transportMode}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isLive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
            }`}
          />
          <span className="uppercase tracking-wider font-mono text-[10px]">
            {connectionStatus}
          </span>
          <span className="hidden lg:inline text-[9px] text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded font-mono">
            {transportMode.split(' ')[0]}
          </span>
        </div>

        {/* Alert Badge / Incident Trigger */}
        <button
          onClick={onOpenIncidentModal}
          className={`relative p-2 rounded-lg border transition-all ${
            isAlert
              ? 'bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-500/30 animate-pulse'
              : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
          }`}
          title={isAlert ? 'Active hazard alert! Click to dispatch staff' : 'Incident response console'}
        >
          {isAlert ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center border-2 border-white">
              {activeAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
