const express = require("express");
const app = express();
const port = 8000;

const client = require('prom-client');//metrics collection


const collectDefaultMetrics = client.collectDefaultMetrics;

const Registry = client.Registry;

const register = new Registry();

collectDefaultMetrics({ register });


app.get("/api/success", async (req, res) => {
    try {
        // Simulate variable latency: 100ms–2000ms
        const latency = Math.floor(Math.random() * 2000) + 100;
        await new Promise(resolve => setTimeout(resolve, latency));

        res.status(200).json({ message: "Hello from server", latency });
    } catch (err) {

        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ---- Failure Route ----
app.get("/api/failure", async (req, res) => {
    try {
        const errorType = Math.floor(Math.random() * 9); // 9 types of failure

        switch (errorType) {
            case 0:

                return res.status(400).json({ error: "Bad Request" });
            case 1:

                return res.status(401).json({ error: "Unauthorized" });
            case 2:

                return res.status(403).json({ error: "Forbidden" });
            case 3:

                return res.status(404).json({ error: "Resource Not Found" });
            case 4:

                return res.status(500).json({ error: "Internal Server Error" });
            case 5:

                return res.status(502).json({ error: "Bad Gateway" });
            case 6:

                return res.status(503).json({ error: "Service Unavailable" });
            case 7:

                await new Promise(resolve => setTimeout(resolve, 3000));
                return res.status(504).json({ error: "Gateway Timeout" });
            case 8:

                throw new Error("Simulated unhandled exception");
        }
    } catch (err) {

        res.status(500).json({ error: "Unhandled Exception" });
    }
});



app.get("/metrics", async (req, res) => {
    try {
        res.setHeader('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {

        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ---- Start server ----
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
});
