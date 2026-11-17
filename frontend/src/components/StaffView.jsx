import React from 'react';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Clock,
  CheckCircle,
  Plus,
  Send,
  Radio,
  MapPin,
  Check,
} from 'lucide-react';

export default function StaffView({
  incidents = [],
  onResolveIncident,
  onOpenDispatchModal,
  zonesConfig = {},
}) {
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED');

  const staffRoster = [
    { id: 'R1', team: 'Rapid Response Alpha', lead: 'Officer D. Sharma', members: 5, zone: 'CAM_ZONE_ALPHA', status: 'Active Patrol', channel: 'Ch 01' },
    { id: 'R2', team: 'Crowd Dispersal Unit 2', lead: 'Marshal K. Roy', members: 4, zone: 'CAM_ZONE_BETA', status: 'Stationed', channel: 'Ch 02' },
    { id: 'R3', team: 'Gate 4 Egress Team', lead: 'Officer A. Patel', members: 4, zone: 'CAM_ZONE_GAMMA', status: 'Monitoring', channel: 'Ch 04' },
    { id: 'R4', team: 'Emergency Medical Corps', lead: 'Dr. V. Rao', members: 3, zone: 'Medical Triage A', status: 'Standby', channel: 'Ch 09' },
    { id: 'R5', team: 'Command Supervisors', lead: 'Commander N. Iyer', members: 4, zone: 'Control Room', status: 'Command', channel: 'Ch 00' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
              Incident Response & Personnel Command
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold">
              Command Ready
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Real-time marshal deployments, dispatched rapid intervention units, and resolution logs.
          </p>
        </div>

        <button
          onClick={() => onOpenDispatchModal()}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch Response Unit</span>
        </button>
      </div>

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-semibold uppercase">Total Marshals</p>
            <h3 className="text-2xl font-extrabold text-zinc-900 font-mono mt-0.5">24</h3>
            <span className="text-[10px] text-emerald-600 font-semibold">100% Shift Coverage</span>
          </div>
          <div className="p-2.5 bg-zinc-100 rounded-xl text-zinc-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-semibold uppercase">Active Deployments</p>
            <h3 className="text-2xl font-extrabold font-mono mt-0.5 text-zinc-900">
              {activeIncidents.length}
            </h3>
            <span className="text-[10px] text-rose-600 font-semibold">
              {activeIncidents.length > 0 ? 'Intervention Active' : 'Normal Standby'}
            </span>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-semibold uppercase">Avg Response Time</p>
            <h3 className="text-2xl font-extrabold text-zinc-900 font-mono mt-0.5">2.4m</h3>
            <span className="text-[10px] text-blue-600 font-semibold">-40s vs standard</span>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-semibold uppercase">Resolved Incidents</p>
            <h3 className="text-2xl font-extrabold text-zinc-900 font-mono mt-0.5">
              {resolvedIncidents.length}
            </h3>
            <span className="text-[10px] text-emerald-600 font-semibold">Logged to Audit Trail</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Incident Dispatch Log */}
      <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Active Incident Dispatches ({activeIncidents.length})
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Live Sync</span>
        </div>

        {activeIncidents.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-zinc-500 text-xs space-y-1">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto opacity-70 mb-2" />
            <p className="font-bold text-zinc-800">No Active Bottleneck Hazards</p>
            <p className="text-zinc-400">All venue corridors operating under safe safety limits.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id || inc.timestamp}
                className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-600 text-white">
                      {inc.priority || 'CRITICAL'}
                    </span>
                    <span className="font-bold text-xs text-zinc-900">
                      {zonesConfig[inc.camera_id || inc.zone]?.name || inc.zone_name || inc.camera_id || inc.zone}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {inc.id || 'INC-LIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600">
                    <span className="font-semibold text-zinc-800">{inc.responder}</span> ({inc.units || 2} personnel)
                    — {inc.note || 'Dispatched for crowd management'}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Dispatched at {new Date(inc.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                <button
                  onClick={() => onResolveIncident(inc.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all self-end sm:self-center"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff Personnel Roster */}
      <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-zinc-600" />
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              On-Duty Security & Operations Teams
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">24 Personnel Checked-in</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffRoster.map((unit) => (
            <div
              key={unit.id}
              className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">{unit.team}</h4>
                  <p className="text-[11px] text-zinc-500">Lead: {unit.lead}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {unit.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-200/60 font-mono">
                <span className="flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-zinc-400" />
                  {unit.zone}
                </span>
                <span className="text-zinc-600 font-semibold">{unit.members} Marshals</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
