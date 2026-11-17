import React, { useState } from 'react';
import {
  Map as MapIcon,
  Layers,
  UserCheck,
  Shield,
  Eye,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Sparkles,
} from 'lucide-react';

export default function LiveMap({
  zonesConfig = {},
  zonesData = {},
  activeZone = 'CAM_ZONE_ALPHA',
  setActiveZone,
  onOpenIncidentModal,
}) {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showStaff, setShowStaff] = useState(true);
  const [selectedMapZone, setSelectedMapZone] = useState(null);

  // Staff positions on venue map
  const staffUnits = [
    { id: 'S1', name: 'Alpha Response 1', x: '32%', y: '42%', status: 'Patrolling' },
    { id: 'S2', name: 'Beta Sector Lead', x: '58%', y: '33%', status: 'Stationary' },
    { id: 'S3', name: 'Gate 4 Egress Team', x: '53%', y: '63%', status: 'Monitoring' },
    { id: 'S4', name: 'Medical / Quick-Aid', x: '45%', y: '48%', status: 'Standby' },
  ];

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
              Spatial Venue Map & Sensor Grid
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
              Multi-Zone Grid
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Real-time localized crowd density, bottleneck alerts, and response unit tracking.
          </p>
        </div>

        {/* Toggle Layers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              showHeatmap
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Heatmap Overlay</span>
          </button>

          <button
            onClick={() => setShowStaff(!showStaff)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              showStaff
                ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-sm'
                : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Staff Markers</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="flex-1 min-h-[500px] relative rounded-2xl overflow-hidden bg-slate-900 border border-zinc-800 shadow-xl flex items-center justify-center select-none">
        {/* Subtle Blueprint Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #0f172a 1px)',
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px',
          }}
        />

        {/* Architectural Venue Blueprint SVG Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Concourse Perimeter */}
          <rect
            x="15%"
            y="15%"
            width="70%"
            height="70%"
            rx="20"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          {/* Zone Dividers */}
          <path
            d="M 45% 15% L 45% 85% M 15% 55% L 85% 55%"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Entrance / Exit Corridors */}
          <rect x="10%" y="30%" width="5%" height="20%" fill="none" stroke="#10b981" strokeWidth="2" />
          <text x="7%" y="41%" fill="#10b981" fontSize="10" fontFamily="monospace" transform="rotate(-90 7 41)">
            MAIN WEST ENTRY
          </text>

          <rect x="85%" y="30%" width="5%" height="20%" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <text x="92%" y="42%" fill="#38bdf8" fontSize="10" fontFamily="monospace" transform="rotate(90 92 42)">
            EAST CONCOURSE
          </text>

          <rect x="42%" y="85%" width="16%" height="5%" fill="none" stroke="#f43f5e" strokeWidth="2" />
          <text x="44%" y="94%" fill="#f43f5e" fontSize="10" fontFamily="monospace">
            GATE 4 EGRESS PLAZA
          </text>
        </svg>

        {/* Heatmap Glow Layers */}
        {showHeatmap &&
          Object.entries(zonesConfig).map(([id, info]) => {
            const data = zonesData[id] || { count: 0, status: 'NORMAL' };
            const isAlert = data.status && data.status !== 'NORMAL';
            const count = data.count || 0;
            const coords = info.coords || { x: '50%', y: '50%' };

            return (
              <div
                key={`heat-${id}`}
                className={`absolute w-72 h-72 rounded-full blur-[80px] pointer-events-none transition-all duration-700 -translate-x-1/2 -translate-y-1/2 ${
                  isAlert
                    ? 'bg-rose-500/40 scale-125 animate-pulse'
                    : count > 15
                    ? 'bg-amber-500/25 scale-110'
                    : 'bg-emerald-500/15 scale-90'
                }`}
                style={{ left: coords.x, top: coords.y }}
              />
            );
          })}

        {/* Camera Zone Markers */}
        {Object.entries(zonesConfig).map(([id, info]) => {
          const data = zonesData[id] || { count: 0, status: 'NORMAL' };
          const isAlert = data.status && data.status !== 'NORMAL';
          const isFocused = activeZone === id;
          const coords = info.coords || { x: '50%', y: '50%' };
          const count = data.count || 0;

          return (
            <div
              key={id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
              style={{ left: coords.x, top: coords.y }}
              onClick={() => {
                setActiveZone(id);
                setSelectedMapZone(id);
              }}
            >
              {/* Radar pulse ripple for alert zone */}
              {isAlert && (
                <div className="absolute -inset-4 rounded-full border-2 border-rose-500 animate-ping opacity-75 pointer-events-none" />
              )}
              {isFocused && !isAlert && (
                <div className="absolute -inset-3 rounded-full border-2 border-emerald-400 animate-ping opacity-50 pointer-events-none" />
              )}

              {/* Marker Core */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-bold text-xs transition-all shadow-lg transform group-hover:scale-110 border-2 ${
                  isAlert
                    ? 'bg-rose-600 text-white border-white shadow-rose-500/50 animate-bounce'
                    : isFocused
                    ? 'bg-emerald-500 text-white border-white shadow-emerald-500/40 ring-4 ring-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-200 border-zinc-600 hover:border-emerald-400'
                }`}
              >
                {count}
              </div>

              {/* Label Pill */}
              <div
                className={`mt-2 -translate-x-1/4 px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold whitespace-nowrap shadow-md border backdrop-blur-md transition-all flex items-center gap-1.5 ${
                  isAlert
                    ? 'bg-rose-950/90 text-rose-200 border-rose-600'
                    : isFocused
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-600'
                    : 'bg-zinc-900/90 text-zinc-300 border-zinc-700 group-hover:border-zinc-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAlert ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                <span>{info.name || id}</span>
                {isAlert && (
                  <span className="text-[9px] font-extrabold text-rose-400 uppercase tracking-wider">
                    CRUSH ALERT
                  </span>
                )}
              </div>

              {/* Hover / Active Popover Card */}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 hidden group-hover:block z-30 w-56 p-3.5 rounded-xl bg-zinc-900/95 backdrop-blur-md border border-zinc-700 text-white shadow-2xl space-y-2 pointer-events-auto">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-bold text-xs tracking-tight text-zinc-100">
                    {info.name}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">{id}</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Current Count:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {count} / {info.capacity || 250}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Floor Area:</span>
                    <span className="font-mono text-zinc-200">
                      {info.area_sqm || 25} m²
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Current Status:</span>
                    <span
                      className={`font-mono font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${
                        isAlert
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {data.status || 'NORMAL'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveZone(id);
                    }}
                    className="w-full py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 rounded text-white flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3 h-3" /> Focus Feed
                  </button>
                  {isAlert && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenIncidentModal(id);
                      }}
                      className="w-full py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 rounded text-white flex items-center justify-center gap-1 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" /> Dispatch
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Staff Units Overlay */}
        {showStaff &&
          staffUnits.map((staff) => (
            <div
              key={staff.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500 text-blue-200 text-[10px] font-mono shadow-md backdrop-blur-sm transition-all hover:scale-105"
              style={{ left: staff.x, top: staff.y }}
            >
              <Shield className="w-3 h-3 text-blue-400" />
              <span>{staff.name}</span>
            </div>
          ))}

        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-[10px] text-zinc-400 font-mono shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Normal (&lt;3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Caution (3-4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Hazard (&gt;5)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
