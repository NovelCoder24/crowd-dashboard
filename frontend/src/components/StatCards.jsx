import React from 'react';
import {
  Users,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  Sparkles,
} from 'lucide-react';

function StatCard({
  title,
  value,
  subvalue,
  change,
  trend = 'neutral',
  icon: Icon,
  isAlert = false,
  badgeText,
  accentColor = 'emerald',
}) {
  return (
    <div
      className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-sm relative overflow-hidden ${
        isAlert
          ? 'bg-rose-50/90 border-rose-400 shadow-[0_4px_20px_rgba(244,63,94,0.18)]'
          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md'
      }`}
    >
      {/* Background ambient flare */}
      {isAlert && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-400/20 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Top Header Row */}
      <div className="flex items-start justify-between z-10">
        <div
          className={`p-2.5 rounded-xl transition-colors ${
            isAlert
              ? 'bg-rose-500/20 text-rose-600'
              : accentColor === 'emerald'
              ? 'bg-emerald-50 text-emerald-600'
              : accentColor === 'amber'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-blue-50 text-blue-600'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-1.5">
          {badgeText && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isAlert
                  ? 'bg-rose-100 border-rose-300 text-rose-700'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-600'
              }`}
            >
              {badgeText}
            </span>
          )}

          {change && (
            <div
              className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend === 'up'
                  ? isAlert
                    ? 'bg-rose-200/70 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                  : trend === 'down'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
              {trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {change}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Number / Metric */}
      <div className="mt-4 z-10">
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
          {title}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3
            className={`text-3xl font-extrabold tracking-tight ${
              isAlert ? 'text-rose-600 font-mono' : 'text-zinc-900 font-mono'
            }`}
          >
            {value}
          </h3>
          {subvalue && (
            <span className="text-xs text-zinc-500 font-medium">{subvalue}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StatCards({
  liveCount = 0,
  isAlert = false,
  status = 'NORMAL',
  activeZone = 'CAM_ZONE_ALPHA',
  zoneConfig = {},
  hazardCount = 0,
  dispatchedStaffCount = 0,
}) {
  const capacity = zoneConfig.capacity || 250;
  const loadPercentage = Math.min(100, Math.round((liveCount / capacity) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* 1. Live Count */}
      <StatCard
        title={`Live Count (${zoneConfig.code || activeZone})`}
        value={liveCount}
        subvalue={`/ ${capacity} max cap`}
        change={isAlert ? 'Critical' : `${loadPercentage}% load`}
        trend={isAlert ? 'up' : liveCount > 10 ? 'up' : 'down'}
        icon={Users}
        isAlert={isAlert}
        badgeText={status}
        accentColor="emerald"
      />

      {/* 2. Dwell Time */}
      <StatCard
        title="Avg. Dwell Time"
        value="11.4m"
        subvalue="target < 15m"
        change="-3.2%"
        trend="down"
        icon={Clock}
        badgeText="Optimal"
        accentColor="blue"
      />

      {/* 3. Active Hazards */}
      <StatCard
        title="Active Hazards"
        value={hazardCount}
        subvalue={hazardCount > 0 ? 'Action Required' : 'All Clear'}
        change={hazardCount > 0 ? `+${hazardCount}` : 'Zero'}
        trend={hazardCount > 0 ? 'up' : 'down'}
        icon={AlertTriangle}
        isAlert={hazardCount > 0}
        badgeText={hazardCount > 0 ? 'CRUSH ALERT' : 'Safe Zones'}
        accentColor="amber"
      />

      {/* 4. Staff on Duty */}
      <StatCard
        title="Staff on Duty"
        value="24"
        subvalue={`${dispatchedStaffCount} dispatched`}
        change={dispatchedStaffCount > 0 ? `${dispatchedStaffCount} active` : 'Ready'}
        trend="neutral"
        icon={ShieldCheck}
        badgeText="8 Teams"
        accentColor="emerald"
      />
    </div>
  );
}
