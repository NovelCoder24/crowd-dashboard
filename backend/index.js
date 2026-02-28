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

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID || "123456",
    key: process.env.PUSHER_KEY || "your_key",
    secret: process.env.PUSHER_SECRET || "your_secret",
    cluster: process.env.PUSHER_CLUSTER || "mt1",
    useTLS: true
});

const historyBuffer = {};


const zonesConfigPath = path.join(__dirname, 'zones_config.json');
let zonesConfig = {};

function loadConfig() {
    try {
        const data = fs.readFileSync(zonesConfigPath, 'utf8');
        zonesConfig = JSON.parse(data);
        console.log("[INFO] Zones configuration loaded.");
    } catch (err) {
        console.error("[ERROR] Failed to load zones_config.json:", err.message);
    }
}

loadConfig();

app.post('/api/density', (req, res) => {
    const { camera_id, count, global_density, hotspot_density, status } = req.body;

    if (!camera_id) {
        return res.status(400).send("Missing camera_id");
    }

    const timestamp = new Date().toISOString();

    const updatePayload = {
        camera_id,
        count,
        global_density,
        hotspot_density,
        status,
        timestamp
    };

    // Update History Buffer
    if (!historyBuffer[camera_id]) {
        historyBuffer[camera_id] = [];
    }
    historyBuffer[camera_id].push(updatePayload);

    // Keep only last 100 points
    if (historyBuffer[camera_id].length > 100) {
        historyBuffer[camera_id].shift();
    }

    // Trigger real-time update via Pusher
    pusher.trigger('crowd-channel', 'density-update', updatePayload);

    console.log(`[DATA] ${camera_id}: ${count} people | ${global_density} ppl/m^2 | ${hotspot_density} ppl/m^2 | Status: ${status}`);
    res.status(200).send("Update received");
});


app.get('/api/history/:cameraId', (req, res) => {
    const { cameraId } = req.params;
    const history = historyBuffer[cameraId] || [];
    res.json(history);
});
 
app.get('/api/config', (req, res) => {
    res.json(zonesConfig);
});

app.listen(PORT, () => {
    console.log(`\n--- DRISHTI-SAFE BACKEND RUNNING ---`);
    console.log(`Server listening at http://localhost:${PORT}`);
    console.log(`Pusher Channel: crowd-channel`);
    console.log(`------------------------------------\n`);
});
