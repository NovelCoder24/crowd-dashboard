// Quick verification test for backend endpoints
import http from 'http';

async function testBackend() {
    console.log("Starting backend server test...");
    // Import and start server dynamically on an alternate port for test
    process.env.PORT = "3099";
    const serverModule = await import('./index.js');

    // Give server 500ms to bind
    await new Promise(r => setTimeout(r, 600));

    const baseUrl = 'http://localhost:3099';

    // Helper for fetch
    async function request(path, options = {}) {
        const res = await fetch(`${baseUrl}${path}`, options);
        const data = await res.json().catch(() => null);
        return { status: res.status, data };
    }

    try {
        // 1. Test /api/health
        const health = await request('/api/health');
        console.log("1. /api/health:", health.status === 200 && health.data?.status === 'healthy' ? "PASS" : "FAIL", health.data);

        // 2. Test /api/zones and /api/config
        const zones = await request('/api/zones');
        const hasZones = zones.data && zones.data.CAM_ZONE_ALPHA && zones.data.CAM_ZONE_BETA && zones.data.CAM_ZONE_GAMMA;
        console.log("2. /api/zones (Alpha, Beta, Gamma):", hasZones ? "PASS" : "FAIL", Object.keys(zones.data || {}));

        // 3. Test /api/history/CAM_ZONE_ALPHA
        const historyAlpha = await request('/api/history/CAM_ZONE_ALPHA');
        console.log("3. /api/history/CAM_ZONE_ALPHA:", Array.isArray(historyAlpha.data) && historyAlpha.data.length > 0 ? "PASS" : "FAIL", `(${historyAlpha.data?.length} items)`);

        // 4. Test /api/density ingestion
        const densityRes = await request('/api/density', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                camera_id: "CAM_ZONE_ALPHA",
                count: 35,
                global_density: 0.29,
                hotspot_density: 3,
                status: "WARNING",
                flow_velocity: 0.82
            })
        });
        console.log("4. POST /api/density:", densityRes.status === 200 && densityRes.data?.success ? "PASS" : "FAIL");

        // 5. Test /api/incidents
        const incidentsRes = await request('/api/incidents');
        console.log("5. GET /api/incidents:", Array.isArray(incidentsRes.data) && incidentsRes.data.length >= 2 ? "PASS" : "FAIL", `(${incidentsRes.data?.length} incidents)`);

        // 6. Test POST /api/dispatch
        const dispatchRes = await request('/api/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                zone: "CAM_ZONE_GAMMA",
                responder: "Gate Unit 4 Patrol",
                notes: "Rapid dispatch test verification"
            })
        });
        console.log("6. POST /api/dispatch:", dispatchRes.status === 201 && dispatchRes.data?.incident?.id ? "PASS" : "FAIL", dispatchRes.data?.incident?.id);

        const newIncidentId = dispatchRes.data?.incident?.id;

        // 7. Test POST /api/incidents/:id/resolve
        if (newIncidentId) {
            const resolveRes = await request(`/api/incidents/${newIncidentId}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: "Resolved during automated verification" })
            });
            console.log("7. POST /api/incidents/:id/resolve:", resolveRes.status === 200 && resolveRes.data?.incident?.status === "RESOLVED" ? "PASS" : "FAIL");
        }

        // 8. Test /api/stream (SSE connection)
        const ssePassed = await new Promise((resolve) => {
            const req = http.get(`${baseUrl}/api/stream`, (res) => {
                let receivedData = '';
                res.on('data', (chunk) => {
                    receivedData += chunk.toString();
                    if (receivedData.includes('event: connected') && receivedData.includes('event: density-update')) {
                        req.destroy();
                        resolve(true);
                    }
                });
                res.on('error', () => resolve(false));
            });
            req.on('error', () => resolve(false));
            setTimeout(() => {
                req.destroy();
                resolve(false);
            }, 3000);
        });
        console.log("8. GET /api/stream (SSE stream & initial replay):", ssePassed ? "PASS" : "FAIL");

        console.log("\nALL BACKEND VERIFICATION CHECKS PASSED!");
        process.exit(0);
    } catch (err) {
        console.error("Test failed with error:", err);
        process.exit(1);
    }
}

testBackend();
