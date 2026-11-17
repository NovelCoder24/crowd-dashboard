import React from 'react';
import {
  Layers,
  Users,
  AlertTriangle,
  Eye,
  Shield,
  Send,
  Activity,
  Maximize2,
  CheckCircle,
} from 'lucide-react';

export default function ZonesView({
  zonesConfig = {},
  zonesData = {},
  activeZone = 'CAM_ZONE_ALPHA',
  setActiveZone,
  onOpenIncidentModal,
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
              Venue Sector & Zone Telemetry
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
              {Object.keys(zonesConfig).length} Monitored Sectors
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Real-time occupancy density metrics, capacity utilization, and rapid zone switching.
          </p>
        </div>
      </div>

      {/* Grid of Zone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(zonesConfig).map(([id, info]) => {
          const telemetry = zonesData[id] || {
            count: 0,
            global_density: 0,
            hotspot_density: 0,
            status: 'NORMAL',
          };
          const isAlert = telemetry.status && telemetry.status !== 'NORMAL';
          const isSelected = activeZone === id;
          const capacity = info.capacity || 250;
          const percentage = Math.min(100, Math.round(((telemetry.count || 0) / capacity) * 100));

          return (
            <div
              key={id}
              className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-sm bg-white relative overflow-hidden ${
                isAlert
                  ? 'border-rose-400 bg-rose-50/70 shadow-[0_4px_24px_rgba(244,63,94,0.18)]'
                  : isSelected
                  ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                  : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
              }`}
            >
              {/* Top Row: Zone Name & Status Badge */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-zinc-900 tracking-tight">
                      {info.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold border border-zinc-200">
                      {info.code || id}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                    {info.description || `${info.area_sqm || 25} m² arterial corridor`}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    isAlert
                      ? 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse'
                      : percentage > 75
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  }`}
                >
                  {telemetry.status || 'NORMAL'}
                </span>
              </div>

              {/* Middle Metric: Occupancy Counter & Gauge */}
              <div className="my-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-extrabold font-mono tracking-tight ${
                        isAlert ? 'text-rose-600' : 'text-zinc-900'
                      }`}
                    >
                      {telemetry.count || 0}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      / {capacity} cap
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-zinc-600">
                    {percentage}% load
                  </span>
                </div>

                {/* Density Bar */}
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isAlert
                        ? 'bg-rose-500'
                        : percentage > 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Submetrics: Hotspot density & Area */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-zinc-500">
                  <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="block text-[9px] uppercase text-zinc-400 font-sans">
                      Hotspot Density
                    </span>
                    <span className="font-bold text-zinc-800">
                      {Number(telemetry.hotspot_density || 0).toFixed(2)} ppl/m²
                    </span>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="block text-[9px] uppercase text-zinc-400 font-sans">
                      Threshold
                    </span>
                    <span className="font-bold text-zinc-800">
                      Crit &gt; {info.critical_threshold || 5}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
                <button
                  onClick={() => setActiveZone(id)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Focused' : 'Focus Feed'}</span>
                </button>

                {isAlert ? (
                  <button
                    onClick={() => onOpenIncidentModal(id)}
                    className="py-1.5 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center gap-1 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenIncidentModal(id)}
                    className="py-1.5 px-2.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                    title="Precautionary Dispatch"
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
