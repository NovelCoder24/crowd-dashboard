import { useState, useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';
import { CONFIG, ZONES } from '../config';
import { playAlertChime } from '../utils/audio';

export function useCrowdData() {
  const [activeZone, setActiveZone] = useState(CONFIG.DEFAULT_CAMERA_ID);
  const [zonesConfig, setZonesConfig] = useState(ZONES);

  // Real-time telemetry per zone
  const [zonesData, setZonesData] = useState(() => {
    const initial = {};
    Object.keys(ZONES).forEach((id) => {
      initial[id] = {
        cameraId: id,
        count: 0,
        global_density: 0,
        hotspot_density: 0,
        status: 'NORMAL',
        history: [],
        lastUpdate: null,
      };
    });
    return initial;
  });

  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [transportMode, setTransportMode] = useState('Initializing');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // References for transport tracking
  const sseRef = useRef(null);
  const pusherRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Sound chime trigger on alert
  const triggerAlarmIfNeeded = useCallback((status) => {
    if (status && status !== 'NORMAL' && soundEnabledRef.current) {
      playAlertChime();
    }
  }, []);

  // Update telemetry helper
  const handleTelemetryUpdate = useCallback((payload, source) => {
    if (!payload || !payload.camera_id) return;
    const { camera_id, count, global_density, hotspot_density, status, timestamp } = payload;

    const formattedTime = timestamp
      ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setZonesData((prev) => {
      const currentZone = prev[camera_id] || {
        cameraId: camera_id,
        count: 0,
        global_density: 0,
        hotspot_density: 0,
        status: 'NORMAL',
        history: [],
      };

      const newHistory = [
        ...currentZone.history,
        {
          time: formattedTime,
          count: count ?? 0,
          global_density: global_density ?? 0,
          hotspot_density: hotspot_density ?? 0,
          status: status || 'NORMAL',
        },
      ].slice(-30);

      return {
        ...prev,
        [camera_id]: {
          cameraId: camera_id,
          count: count ?? 0,
          global_density: global_density ?? 0,
          hotspot_density: hotspot_density ?? 0,
          status: status || 'NORMAL',
          history: newHistory,
          lastUpdate: timestamp || new Date().toISOString(),
        },
      };
    });

    if (status && status !== 'NORMAL') {
      triggerAlarmIfNeeded(status);
    }
  }, [triggerAlarmIfNeeded]);

  // Fetch Zones Config from backend (/api/zones or /api/config)
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        let res = await fetch(`${CONFIG.BACKEND_URL}/api/zones`);
        if (!res.ok) {
          res = await fetch(`${CONFIG.BACKEND_URL}/api/config`);
        }
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && Object.keys(data).length > 0) {
            setZonesConfig((prev) => {
              const merged = { ...prev };
              Object.entries(data).forEach(([key, val]) => {
                merged[key] = {
                  ...(prev[key] || {}),
                  ...val,
                  id: key,
                  name: val.name || prev[key]?.name || key,
                  capacity: val.capacity || prev[key]?.capacity || 250,
                  coords: val.coordinates
                    ? { x: `${val.coordinates.x}%`, y: `${val.coordinates.y}%` }
                    : prev[key]?.coords || { x: '50%', y: '50%' },
                };
              });
              return merged;
            });
          }
        }
      } catch (err) {
        console.debug('Using default zones config:', err.message);
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Initial History for Active Zone
  useEffect(() => {
    let isMounted = true;
    setIsLoadingHistory(true);
    fetch(`${CONFIG.BACKEND_URL}/api/history/${activeZone}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!isMounted) return;
        setIsLoadingHistory(false);
        if (Array.isArray(data) && data.length > 0) {
          const formattedHistory = data.map((item) => ({
            time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            count: item.count,
            global_density: item.global_density || 0,
            hotspot_density: item.hotspot_density || 0,
            status: item.status || 'NORMAL',
          }));

          const latest = data[data.length - 1];

          setZonesData((prev) => ({
            ...prev,
            [activeZone]: {
              ...(prev[activeZone] || {}),
              cameraId: activeZone,
              count: latest.count ?? 0,
              global_density: latest.global_density ?? 0,
              hotspot_density: latest.hotspot_density ?? 0,
              status: latest.status || 'NORMAL',
              history: formattedHistory.slice(-30),
              lastUpdate: latest.timestamp,
            },
          }));
        }
      })
      .catch((err) => {
        if (isMounted) setIsLoadingHistory(false);
        console.debug('Initial history fetch bypassed:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [activeZone]);

  // Fetch Incidents
  const fetchIncidents = useCallback(() => {
    fetch(`${CONFIG.BACKEND_URL}/api/incidents`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setIncidents(data);
        }
      })
      .catch((err) => {
        console.debug('Incidents fetch:', err.message);
      });
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  // --- Dual Transport: Pusher + SSE Setup ---
  useEffect(() => {
    let pusherActive = false;
    let sseActive = false;

    const updateCombinedStatus = () => {
      if (pusherActive && sseActive) {
        setConnectionStatus('Dual Sync Active');
        setTransportMode('Dual (Pusher + SSE)');
      } else if (pusherActive) {
        setConnectionStatus('Pusher Live');
        setTransportMode('Pusher WebSocket');
      } else if (sseActive) {
        setConnectionStatus('SSE Stream Live');
        setTransportMode('Server-Sent Events');
      } else {
        setConnectionStatus('Connecting...');
        setTransportMode('Offline / Retrying');
      }
    };

    // 1. Setup Server-Sent Events (SSE)
    try {
      const sseUrl = `${CONFIG.BACKEND_URL}/api/stream`;
      const sse = new EventSource(sseUrl);
      sseRef.current = sse;

      sse.onopen = () => {
        sseActive = true;
        updateCombinedStatus();
      };

      // Listen for named event 'density-update'
      sse.addEventListener('density-update', (event) => {
        try {
          const data = JSON.parse(event.data);
          handleTelemetryUpdate(data, 'SSE');
        } catch (e) {
          console.debug('SSE parse err:', e);
        }
      });

      // Listen for dispatched incidents
      sse.addEventListener('incident-dispatched', (event) => {
        try {
          const inc = JSON.parse(event.data);
          setIncidents((prev) => [inc, ...prev.filter((i) => i.id !== inc.id)]);
        } catch (e) {
          console.debug('SSE incident parse err:', e);
        }
      });

      // Listen for resolved incidents
      sse.addEventListener('incident-resolved', (event) => {
        try {
          const inc = JSON.parse(event.data);
          setIncidents((prev) =>
            prev.map((i) => (i.id === inc.id ? { ...i, status: 'RESOLVED', ...inc } : i))
          );
        } catch (e) {
          console.debug('SSE incident-resolved parse err:', e);
        }
      });

      // Fallback message listener
      sse.onmessage = (event) => {
        try {
          if (event.data && event.data.startsWith('{')) {
            const data = JSON.parse(event.data);
            handleTelemetryUpdate(data, 'SSE');
          }
        } catch (e) {
          // heartbeat comments or ping
        }
      };

      sse.onerror = () => {
        sseActive = false;
        updateCombinedStatus();
      };
    } catch (e) {
      console.debug('SSE initialization error:', e);
    }

    // 2. Setup Pusher (Cloud Transport)
    let pusherInstance = null;
    let channel = null;
    if (CONFIG.PUSHER_KEY && CONFIG.PUSHER_KEY !== 'your_key') {
      try {
        pusherInstance = new Pusher(CONFIG.PUSHER_KEY, {
          cluster: CONFIG.PUSHER_CLUSTER,
        });
        pusherRef.current = pusherInstance;

        pusherInstance.connection.bind('connected', () => {
          pusherActive = true;
          updateCombinedStatus();
        });

        pusherInstance.connection.bind('disconnected', () => {
          pusherActive = false;
          updateCombinedStatus();
        });

        pusherInstance.connection.bind('error', () => {
          pusherActive = false;
          updateCombinedStatus();
        });

        channel = pusherInstance.subscribe('crowd-channel');
        channel.bind('density-update', (data) => {
          handleTelemetryUpdate(data, 'Pusher');
        });

        channel.bind('incident-dispatched', (data) => {
          setIncidents((prev) => [data, ...prev.filter((i) => i.id !== data.id)]);
        });

        channel.bind('incident-resolved', (data) => {
          setIncidents((prev) =>
            prev.map((i) => (i.id === data.id ? { ...i, status: 'RESOLVED', ...data } : i))
          );
        });
      } catch (e) {
        console.debug('Pusher connection error:', e);
      }
    }

    // Cleanup transports on unmount
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (pusherInstance) {
        pusherInstance.disconnect();
      }
    };
  }, [handleTelemetryUpdate]);

  // Dispatch incident action
  const dispatchIncident = async (incidentPayload) => {
    const payload = {
      camera_id: incidentPayload.camera_id || activeZone,
      zone: incidentPayload.camera_id || activeZone,
      zone_name: zonesConfig[incidentPayload.camera_id || activeZone]?.name || incidentPayload.camera_id || activeZone,
      responder: incidentPayload.responder || 'Rapid Response Alpha',
      units: incidentPayload.units || 2,
      type: incidentPayload.type || 'STAMPEDE_PREVENTION',
      note: incidentPayload.note || 'Operator initiated crowd dispersal protocol',
      status: 'DISPATCHED',
      priority: incidentPayload.priority || 'HIGH',
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const result = await res.json();
        const saved = result.incident || { id: `INC-${Date.now().toString().slice(-4)}`, ...payload };
        setIncidents((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)]);
        return saved;
      }
    } catch (e) {
      console.debug('Backend dispatch API queued locally:', e.message);
    }

    // Local fallback if backend is offline
    const fallbackInc = { id: `INC-${Date.now().toString().slice(-4)}`, ...payload };
    setIncidents((prev) => [fallbackInc, ...prev]);
    return fallbackInc;
  };

  // Resolve incident action
  const resolveIncident = async (id) => {
    // Optimistic update
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : inc))
    );

    try {
      await fetch(`${CONFIG.BACKEND_URL}/api/incidents/${id}/resolve`, {
        method: 'POST',
      });
    } catch (e) {
      console.debug('Resolve incident request error:', e.message);
    }
  };

  const currentZoneData = zonesData[activeZone] || {
    cameraId: activeZone,
    count: 0,
    global_density: 0,
    hotspot_density: 0,
    status: 'NORMAL',
    history: [],
    lastUpdate: null,
  };

  const isAlert = currentZoneData.status !== 'NORMAL';

  // Count active hazards across all zones
  const activeHazardZones = Object.entries(zonesData).filter(
    ([, z]) => z.status && z.status !== 'NORMAL'
  );

  return {
    activeZone,
    setActiveZone,
    zonesConfig,
    zonesData,
    currentZoneData,
    liveCount: currentZoneData.count,
    isAlert,
    status: currentZoneData.status,
    history: currentZoneData.history,
    connectionStatus,
    transportMode,
    soundEnabled,
    setSoundEnabled,
    incidents,
    dispatchIncident,
    resolveIncident,
    isLoadingHistory,
    activeHazardZones,
    hazardCount: activeHazardZones.length,
  };
}
