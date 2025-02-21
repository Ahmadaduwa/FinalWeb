const express = require("express");
const db = require("../database/db");
const axios = require("axios");
const router = express.Router();

// ดึงข้อมูล Sensor Data
router.get("/sensor_data", (req, res) => {
  db.query("SELECT * FROM Sensor_Data ORDER BY TimestampPerHr DESC LIMIT 100", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 📌 ดึงข้อมูลอากาศจาก OpenWeather
router.get("/weather", async (req, res) => {
  try {
    const { LAT, LON, WEATHER_API_KEY } = process.env;

    if (!WEATHER_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&lang=th&appid=${WEATHER_API_KEY}`;
    
    const response = await axios.get(weatherApiUrl);
    const weatherData = response.data;

    res.json({
      location: weatherData.name,
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      weather: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
    });

  } catch (error) {
    console.error("Error fetching weather data:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Cannot fetch weather data" });
  }
});



module.exports = router;
