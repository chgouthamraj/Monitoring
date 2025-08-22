const express = require("express");
const app = express();
const port = 8000;
const responseTime = require("response-time");
const client = require("prom-client"); // Prometheus metrics

// ---- Prometheus Default Metrics ----
client.collectDefaultMetrics({ timeout: 5000 });

// ---- Histogram for HTTP request duration ----
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5] // in seconds
});

// ---- Counter for total HTTP requests ----
const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"]
});

// ---- Middleware to record metrics ----
app.use(
  responseTime((req, res, time) => {
    const route = req.route ? req.route.path : req.path;
    const status = res.statusCode;

    httpRequestsTotal.inc({ method: req.method, route, status_code: status });
    httpRequestDuration.observe({ method: req.method, route, status_code: status }, time / 1000); // convert ms -> s
  })
);

// ---- Success Route ----
app.get("/api/success", async (req, res) => {
  try {
    const latency = Math.floor(Math.random() * 2000) + 100; // 100ms-2s
    await new Promise(resolve => setTimeout(resolve, latency));

    res.status(200).json({ message: "Success", latency });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- Failure Route ----
app.get("/api/failure", async (req, res) => {
  try {
    const errorType = Math.floor(Math.random() * 9); // 9 failure types

    switch (errorType) {
      case 0: return res.status(400).json({ error: "Bad Request" });
      case 1: return res.status(401).json({ error: "Unauthorized" });
      case 2: return res.status(403).json({ error: "Forbidden" });
      case 3: return res.status(404).json({ error: "Resource Not Found" });
      case 4: return res.status(500).json({ error: "Internal Server Error" });
      case 5: return res.status(502).json({ error: "Bad Gateway" });
      case 6: return res.status(503).json({ error: "Service Unavailable" });
      case 7:
        await new Promise(resolve => setTimeout(resolve, 3000));
        return res.status(504).json({ error: "Gateway Timeout" });
      case 8: throw new Error("Simulated unhandled exception");
    }
  } catch (err) {
    res.status(500).json({ error: "Unhandled Exception" });
  }
});

// ---- Metrics endpoint ----
app.get("/metrics", async (req, res) => {
  try {
    res.setHeader("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- Start server ----
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Metrics available at http://localhost:${port}/metrics`);
});
