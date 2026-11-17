import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Shield,
  Users,
  Send,
  CheckCircle2,
  Clock,
  Radio,
  MapPin,
} from 'lucide-react';

export default function IncidentModal({
  isOpen,
  onClose,
  initialZone = 'CAM_ZONE_ALPHA',
  zonesConfig = {},
  liveCount = 0,
  onDispatch,
}) {
  const [targetZone, setTargetZone] = useState(initialZone);
  const [responder, setResponder] = useState('Rapid Response Alpha');
  const [priority, setPriority] = useState('CRITICAL');
  const [units, setUnits] = useState(3);
  const [note, setNote] = useState('Operator initiating immediate crowd diversion towards West Corridor.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onDispatch({
        camera_id: targetZone,
        responder,
        priority,
        units: Number(units),
        note,
        type: 'STAMPEDE_PREVENTION',
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Emergency Incident Dispatch Console
              </h3>
              <p className="text-xs text-rose-100 font-medium">
                Rapid response deployment & crowd diversion protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        {submitted ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-zinc-900">
              Response Units Dispatched!
            </h4>
            <p className="text-xs text-zinc-500 max-w-xs">
              {responder} ({units} personnel) has been deployed to{' '}
              {zonesConfig[targetZone]?.name || targetZone}. Telemetry broadcast sent to team radios.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Target Zone */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Target Zone / Sector
              </label>
              <div className="relative">
                <select
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  {Object.entries(zonesConfig).map(([id, info]) => (
                    <option key={id} value={id}>
                      {info.name} ({id}) - Cap: {info.capacity || 250}
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Responder Unit & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Assigned Team
                </label>
                <select
                  value={responder}
                  onChange={(e) => setResponder(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Rapid Response Alpha">Rapid Response Alpha</option>
                  <option value="Crowd Dispersal Unit 2">Crowd Dispersal Unit 2</option>
                  <option value="Perimeter Security Lead">Perimeter Security Lead</option>
                  <option value="Medical First-Response">Medical First-Response</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Egress)</option>
                  <option value="HIGH">HIGH (Bottleneck Warning)</option>
                  <option value="MEDIUM">MEDIUM (Precautionary)</option>
                </select>
              </div>
            </div>

            {/* Personnel Count */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Staff Deployment Size: <span className="font-mono text-rose-600 font-bold">{units} Personnel</span>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            {/* Operational Directive / Note */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Dispatch Directive Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-sans"
                placeholder="Enter tactical instructions for marshals..."
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 flex items-center gap-2 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Transmitting...' : 'Confirm Dispatch'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
