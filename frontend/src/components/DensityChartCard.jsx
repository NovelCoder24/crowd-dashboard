import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  Zap,
  Info,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isWarning = data.status && data.status !== 'NORMAL';

    return (
      <div className="bg-zinc-900/95 backdrop-blur-md text-white border border-zinc-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1.5 font-mono">
        <div className="flex items-center justify-between gap-4 text-zinc-400 border-b border-zinc-800 pb-1">
          <span>Time:</span>
          <span className="text-zinc-200 font-bold">{label}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-300">People Count:</span>
          <span className="text-emerald-400 font-bold text-sm">
            {data.count}
          </span>
        </div>
        {data.global_density !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-300">Global Density:</span>
            <span className="text-blue-400 font-bold">
              {Number(data.global_density).toFixed(2)} ppl/m²
            </span>
          </div>
        )}
        {data.hotspot_density !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-300">Hotspot Peak:</span>
            <span className="text-amber-400 font-bold">
              {Number(data.hotspot_density).toFixed(2)} ppl/m²
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-800">
          <span className="text-zinc-400">Risk Assessment:</span>
          <span
            className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
              isWarning ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {data.status || 'NORMAL'}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export default function DensityChartCard({
  history = [],
  isAlert = false,
  activeZone = 'CAM_ZONE_ALPHA',
  zoneConfig = {},
  liveCount = 0,
}) {
  const [metricView, setMetricView] = useState('count'); // 'count' | 'density'

  // Safety thresholds
  const warningThresh = zoneConfig.warning_threshold || 3;
  const criticalThresh = zoneConfig.critical_threshold || 5;

  // Prepare display data
  const chartData =
    history.length > 0
      ? history
      : [
          { time: '00:00:00', count: 0, global_density: 0, hotspot_density: 0 },
        ];

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-sm bg-white ${
        isAlert
          ? 'border-rose-300 shadow-[0_4px_24px_rgba(244,63,94,0.12)]'
          : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl transition-colors ${
              isAlert ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                Crowd Density & Temporal Surge
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Real-time people count and threshold crossing tracking
            </p>
          </div>
        </div>

        {/* Metric Switcher & Threshold Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-zinc-100 rounded-lg border border-zinc-200">
            <button
              onClick={() => setMetricView('count')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                metricView === 'count'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Count
            </button>
            <button
              onClick={() => setMetricView('density')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                metricView === 'density'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Density (ppl/m²)
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] font-mono text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Warn: {warningThresh}</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 ml-1" />
            <span>Crit: {criticalThresh}</span>
          </div>
        </div>
      </div>

      {/* Area Chart Container */}
      <div className="h-[280px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="densityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isAlert ? '#f43f5e' : '#10b981'}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={isAlert ? '#f43f5e' : '#10b981'}
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
              fontFamily="monospace"
            />

            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={metricView === 'density'}
              fontFamily="monospace"
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Threshold Reference Lines */}
            {metricView === 'count' ? (
              <ReferenceLine
                y={criticalThresh}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{
                  value: 'Hazard Threshold',
                  fill: '#f43f5e',
                  fontSize: 10,
                  position: 'top',
                }}
              />
            ) : (
              <ReferenceLine
                y={warningThresh}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: 'Density Caution',
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'top',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey={metricView === 'count' ? 'count' : 'global_density'}
              stroke={isAlert ? '#f43f5e' : '#10b981'}
              strokeWidth={2.5}
              fill="url(#densityGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Info */}
      <div className="mt-2 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Real-time Window: Last {chartData.length} Telemetry Events</span>
        </div>
        <div className="font-mono text-xs">
          Current: <span className="font-bold text-zinc-900">{liveCount}</span> persons
        </div>
      </div>
    </div>
  );
}
