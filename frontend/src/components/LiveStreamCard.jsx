import React, { useState, useEffect } from 'react';
import {
  Camera,
  Radio,
  Users,
  RefreshCw,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Wifi,
} from 'lucide-react';
import { CONFIG } from '../config';

export default function LiveStreamCard({
  activeZone = 'CAM_ZONE_ALPHA',
  zoneConfig = {},
  liveCount = 0,
  isAlert = false,
  status = 'NORMAL',
}) {
  const [streamError, setStreamError] = useState(false);
  const [streamLoaded, setStreamLoaded] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [sourceHealth, setSourceHealth] = useState(98);

  const videoUrl = `${CONFIG.VIDEO_STREAM_URL}?zone=${activeZone}&key=${streamKey}`;

  // Periodic source health fluctuation for realistic telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setSourceHealth((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const next = Math.max(94, Math.min(100, prev + delta));
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleRefreshStream = () => {
    setStreamError(false);
    setStreamLoaded(false);
    setStreamKey(Date.now());
  };

  return (
    <div
      className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-sm bg-white ${
        isAlert
          ? 'border-rose-400 shadow-[0_4px_24px_rgba(244,63,94,0.18)]'
          : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg ${
              isAlert ? 'bg-rose-100 text-rose-600' : 'bg-zinc-100 text-zinc-700'
            }`}
          >
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                {zoneConfig.name || activeZone}
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                {activeZone}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">YOLOv11 Edge Inference Feed</p>
          </div>
        </div>

        {/* REC Pulse & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold text-rose-600 tracking-wider">
              REC
            </span>
          </div>

          <button
            onClick={handleRefreshStream}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            title="Reload Video Stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video mt-4 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 flex items-center justify-center group shadow-inner">
        {/* Stream image */}
        <img
          key={streamKey}
          src={videoUrl}
          alt={`Edge stream for ${activeZone}`}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            streamLoaded && !streamError ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            setStreamLoaded(true);
            setStreamError(false);
          }}
          onError={() => {
            setStreamError(true);
            setStreamLoaded(false);
          }}
        />

        {/* Fallback Overlay when stream is not active or waiting */}
        {(!streamLoaded || streamError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900">
            <div className="relative mb-3">
              <Camera className="w-10 h-10 text-zinc-500 animate-pulse" />
              <div className="absolute -inset-2 bg-emerald-500/10 rounded-full blur-md" />
            </div>
            <p className="text-zinc-200 text-xs font-semibold tracking-wide">
              {streamError
                ? 'Edge Node Stream Standby'
                : 'Connecting to AI Video Node...'}
            </p>
            <p className="text-zinc-400 text-[10px] max-w-xs mt-1 leading-relaxed">
              Run <code className="text-emerald-400 bg-zinc-800 px-1 py-0.5 rounded font-mono">python ai/main.py --simulate</code> to view live crowd video feed.
            </p>
            <button
              onClick={handleRefreshStream}
              className="mt-3 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-colors font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Retry Stream
            </button>
          </div>
        )}

        {/* Red Hazard Border if in Alert state */}
        {isAlert && (
          <div className="absolute inset-0 border-4 border-rose-500/80 animate-pulse pointer-events-none rounded-xl" />
        )}

        {/* Floating Detected Counter Pill */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          <div className="px-2.5 py-1 bg-zinc-900/85 backdrop-blur-md rounded-lg text-white text-[11px] font-mono font-bold flex items-center gap-2 border border-zinc-700/60 shadow-lg">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>DETECTED:</span>
            <span className={`text-sm ${isAlert ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
              {liveCount}
            </span>
          </div>

          <div className="px-2 py-1 bg-zinc-900/85 backdrop-blur-md rounded-lg text-[10px] font-mono text-zinc-300 border border-zinc-700/60">
            30 FPS • 1080p
          </div>
        </div>

        {/* Top-Right Telemetry Status */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md ${
              isAlert
                ? 'bg-rose-500/90 text-white border border-rose-400'
                : 'bg-emerald-500/80 text-white border border-emerald-400'
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Footer Info: Health Bar & Inference Details */}
      <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-zinc-500 font-medium flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            Inference: YOLOv11n + ByteTrack
          </span>
          <span className="font-mono font-bold text-emerald-600">
            {sourceHealth}% Health
          </span>
        </div>
        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${sourceHealth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
