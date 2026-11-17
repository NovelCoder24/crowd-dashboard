import express from 'express';
import cors from 'cors';
import Pusher from 'pusher';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Pusher Client (with graceful offline fallback)
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID || "dummy_app_id",
    key: process.env.PUSHER_KEY || "dummy_key",
    secret: process.env.PUSHER_SECRET || "dummy_secret",
    cluster: process.env.PUSHER_CLUSTER || "ap2",
    useTLS: true
});

function safePusherTrigger(channel, event, payload) {
    try {
        pusher.trigger(channel, event, payload).catch(err => {
            // Harmless in offline / local development mode
        });
    } catch {
        // Ignore initialization or synchronous errors
    }
}

// Zones Configuration
const zonesConfigPath = path.join(__dirname, 'zones_config.json');
let zonesConfig = {};

function loadConfig() {
    try {
        const data = fs.readFileSync(zonesConfigPath, 'utf8');
        zonesConfig = JSON.parse(data);
        console.log(`[INFO] Zones configuration loaded (${Object.keys(zonesConfig).length} zones configured).`);
    } catch (err) {
        console.error("[ERROR] Failed to load zones_config.json:", err.message);
    }
}
loadConfig();

// In-Memory Storage
const historyBuffer = {
    CAM_ZONE_ALPHA: [],
    CAM_ZONE_BETA: [],
    CAM_ZONE_GAMMA: []
};

const latestTelemetry = {};

// Pre-seed realistic baseline telemetry for all configured zones
const initNow = Date.now();
Object.keys(zonesConfig).forEach(zoneId => {
    const zoneArea = zonesConfig[zoneId]?.area_sqm || 100;
    const baseCount = zoneId === 'CAM_ZONE_ALPHA' ? 24 : zoneId === 'CAM_ZONE_BETA' ? 16 : 9;
    historyBuffer[zoneId] = [];

    for (let i = 15; i >= 0; i--) {
        const t = new Date(initNow - i * 4000).toISOString();
        const cnt = Math.max(2, Math.floor(baseCount + Math.sin(i * 0.4) * 5));
        const gd = parseFloat((cnt / zoneArea).toFixed(2));
        const hd = Math.max(1, Math.floor(gd * 1.5));
        const status = hd >= (zonesConfig[zoneId]?.critical_threshold || 4) ? "CRITICAL"
                     : hd >= (zonesConfig[zoneId]?.warning_threshold || 2.5) ? "WARNING"
                     : "NORMAL";

        const point = {
            camera_id: zoneId,
            count: cnt,
            global_density: gd,
            hotspot_density: hd,
            status,
            timestamp: t
        };
        historyBuffer[zoneId].push(point);
        if (i === 0) {
            latestTelemetry[zoneId] = point;
        }
    }
});

// In-Memory Incident Store
const incidents = [
    {
        id: "INC-INIT-001",
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        zone: "CAM_ZONE_BETA",
        zoneName: "North Concourse",
        responder: "Unit Bravo-2 (Officer Sharma)",
        type: "CORRIDOR_CONGESTION",
        severity: "MEDIUM",
        status: "RESOLVED",
        notes: "Bottleneck cleared after passenger flow redirected to West corridor.",
        resolvedAt: new Date(Date.now() - 1000 * 60 * 6).toISOString()
    },
    {
        id: "INC-INIT-002",
        timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        zone: "CAM_ZONE_ALPHA",
        zoneName: "Concourse Main",
        responder: "Rapid Response Alpha (Team Lead Patel)",
        type: "RAPID_DENSITY_SURGE",
        severity: "HIGH",
        status: "DISPATCHED",
        notes: "Surge detected near Central Flight Info Display. Staff actively managing cordon."
    }
];

// Active SSE Connections
const sseClients = new Set();

function broadcastSSE(event, data) {
    const sseMessage = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
        try {
            client.write(sseMessage);
        } catch {
            sseClients.delete(client);
        }
    }
}

// SSE Keepalive Heartbeat (every 20s)
const sseHeartbeat = setInterval(() => {
    for (const client of sseClients) {
        try {
            client.write(`: ping\n\n`);
        } catch {
            sseClients.delete(client);
        }
    }
}, 20000);
sseHeartbeat.unref();

// -----------------------------------------------------------------------------
// ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Native Server-Sent Events (SSE) Stream
app.get('/api/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no'
    });

    // Send connection greeting
    res.write(`: ping\n\n`);
    res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected", time: new Date().toISOString() })}\n\n`);

    // Replay latest telemetry for all zones so new clients instantly populate
    Object.values(latestTelemetry).forEach(item => {
        res.write(`event: density-update\ndata: ${JSON.stringify(item)}\n\n`);
    });

    sseClients.add(res);
    console.log(`[SSE] Client connected. Active SSE clients: ${sseClients.size}`);

    req.on('close', () => {
        sseClients.delete(res);
        console.log(`[SSE] Client disconnected. Active SSE clients: ${sseClients.size}`);
    });
});

// 2. Telemetry Ingestion Endpoint
app.post('/api/density', (req, res) => {
    const {
        camera_id,
        count = 0,
        global_density = 0,
        hotspot_density = 0,
        status = "NORMAL",
        flow_velocity,
        flow_anomaly,
        ...extra
    } = req.body;

    if (!camera_id) {
        return res.status(400).json({ error: "Missing camera_id" });
    }

    const timestamp = new Date().toISOString();

    const updatePayload = {
        camera_id,
        count: Number(count),
        global_density: Number(global_density),
        hotspot_density: Number(hotspot_density),
        status,
        timestamp,
        ...(flow_velocity !== undefined && { flow_velocity }),
        ...(flow_anomaly !== undefined && { flow_anomaly }),
        ...extra
    };

    // Cache latest
    latestTelemetry[camera_id] = updatePayload;

    // Update History Buffer (keep last 100 points)
    if (!historyBuffer[camera_id]) {
        historyBuffer[camera_id] = [];
    }
    historyBuffer[camera_id].push(updatePayload);
    if (historyBuffer[camera_id].length > 100) {
        historyBuffer[camera_id].shift();
    }

    // Dual-Broadcast: Pusher + Native SSE
    safePusherTrigger('crowd-channel', 'density-update', updatePayload);
    broadcastSSE('density-update', updatePayload);

    console.log(`[DATA] ${camera_id}: ${count} people | ${global_density} ppl/m^2 | ${hotspot_density} ppl/m^2 | Status: ${status} | SSE Clients: ${sseClients.size}`);
    res.status(200).json({ success: true, payload: updatePayload });
});

// 3. Telemetry History Endpoints
app.get('/api/history/:cameraId', (req, res) => {
    const { cameraId } = req.params;
    const history = historyBuffer[cameraId] || [];
    res.json(history);
});

app.get('/api/history', (req, res) => {
    res.json(historyBuffer);
});

// 4. Venue & Zones Configuration Endpoints
app.get('/api/config', (req, res) => {
    res.json(zonesConfig);
});

app.get('/api/zones', (req, res) => {
    res.json(zonesConfig);
});

// 5. Incident Dispatch Management
app.get('/api/incidents', (req, res) => {
    const { status, zone } = req.query;
    let filtered = [...incidents];

    if (status) {
        filtered = filtered.filter(i => i.status.toUpperCase() === status.toUpperCase());
    }
    if (zone) {
        filtered = filtered.filter(i => i.zone === zone);
    }

    res.json(filtered);
});

app.post('/api/dispatch', (req, res) => {
    const {
        zone,
        camera_id,
        responder,
        responder_name,
        type = "CROWD_BOTTLENECK",
        severity = "HIGH",
        notes = "Security response unit deployed to manage crowd density."
    } = req.body;

    const targetZone = zone || camera_id || "CAM_ZONE_ALPHA";
    const targetResponder = responder || responder_name || "Emergency Rapid Response Unit";

    const incident = {
        id: `INC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toISOString(),
        zone: targetZone,
        zoneName: zonesConfig[targetZone]?.name || targetZone,
        responder: targetResponder,
        type,
        severity,
        status: "DISPATCHED",
        notes
    };

    incidents.unshift(incident);
    if (incidents.length > 200) {
        incidents.pop();
    }

    console.log(`[DISPATCH] ${incident.id} dispatched to ${targetZone} (${targetResponder})`);

    // Dual-Broadcast dispatch event
    safePusherTrigger('crowd-channel', 'incident-dispatched', incident);
    broadcastSSE('incident-dispatched', incident);

    res.status(201).json({ success: true, incident });
});

const handleResolve = (req, res) => {
    const { id } = req.params;
    const incident = incidents.find(i => i.id === id);

    if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
    }

    incident.status = "RESOLVED";
    incident.resolvedAt = new Date().toISOString();
    incident.resolutionNotes = req.body.notes || "Marked resolved by operator.";

    safePusherTrigger('crowd-channel', 'incident-resolved', incident);
    broadcastSSE('incident-resolved', incident);

    console.log(`[RESOLVED] ${incident.id} resolved by operator`);
    res.json({ success: true, incident });
};

app.post('/api/incidents/:id/resolve', handleResolve);
app.patch('/api/incidents/:id/resolve', handleResolve);

// 6. Health & Diagnostic Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: "healthy",
        uptime: process.uptime(),
        activeSSEClients: sseClients.size,
        zonesCount: Object.keys(zonesConfig).length,
        incidentsCount: incidents.length,
        timestamp: new Date().toISOString()
    });
});

// Root Information
app.get('/', (req, res) => {
    res.json({
        service: "Drishti-Safe / CrowdFlow Backend",
        version: "2.0.0",
        sseEndpoint: "/api/stream",
        endpoints: [
            "GET  /api/stream",
            "POST /api/density",
            "GET  /api/history/:cameraId",
            "GET  /api/history",
            "GET  /api/config",
            "GET  /api/zones",
            "GET  /api/incidents",
            "POST /api/dispatch",
            "POST /api/incidents/:id/resolve",
            "GET  /api/health"
        ]
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  DRISHTI-SAFE & CROWDFLOW COMMAND BACKEND (v2.0)    `);
    console.log(`======================================================`);
    console.log(`Server URL      : http://localhost:${PORT}`);
    console.log(`SSE Stream      : http://localhost:${PORT}/api/stream`);
    console.log(`Pusher Channel  : crowd-channel`);
    console.log(`Active Zones    : ${Object.keys(zonesConfig).join(', ')}`);
    console.log(`======================================================\n`);
});
