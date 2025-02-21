const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const apiRoutes = require("./routes/api");
const axios = require("axios");

// โหลดค่าจาก .env
dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", apiRoutes);

wss.on("connection", ws => {
  console.log("Client connected via WebSocket");
  const interval = setInterval(() => {
    const sensorData = generateSensorData();
    ws.send(JSON.stringify(sensorData));
  }, 1000);
  ws.on("close", () => {
    clearInterval(interval);
    console.log("WebSocket connection closed");
  });
});

/////////////////////////////
function generateSensorData() {
  return {
    timestamp: new Date().toISOString(),
    temperature: (20 + Math.random() * 2.5).toFixed(1),
    humidity: (50 + Math.random() * 30).toFixed(1),
    ph: (5.5 + Math.random() * 2).toFixed(1),
    rainfall: (Math.random() * 10).toFixed(1),
    nitrogen: Math.floor(5 + Math.random() * 10),
    phosphorus: Math.floor(3 + Math.random() * 8),
    potassium: Math.floor(8 + Math.random() * 13),
    organic_matter: (3 + Math.random() * 7).toFixed(1),
    wind_speed: (Math.random() * 5).toFixed(1),
    co2: Math.floor(350 + Math.random() * 150),
    soil_moisture: (10 + Math.random() * 30).toFixed(1)
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
