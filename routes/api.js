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

// ✅ API: Get Plant Locations with Sensor Data
router.get("/plant-locations", (req, res) => {
  const query = `
      SELECT 
        pa.PA_id AS location_id, 
        pa.Plantation_area, 
        pa.Soil_type, 
        pi.Plant AS plant_name, 
        sd.Temperature AS temperature, 
        sd.humidity, 
        sd.ph, 
        sd.rainfall,
        pi.Urban_area_proximity AS urban_offset
      FROM plant_area pa
      LEFT JOIN plant_information pi ON pa.PA_id = pi.PA_id
      LEFT JOIN sensor_data sd ON pi.Plant_id = sd.Plant_id
      ORDER BY pa.PA_id;
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error("❌ Error fetching plant locations:", err);
          return res.status(500).send(err);
      }

      console.log("✅ API Data Sent:", results);
      res.json(results);
  });
});


// 📌 ดึงข้อมูลพืชทั้งหมด
router.get('/plants', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
  
  let sql = `
    SELECT 
      p.Plant_id,
      p.Plant AS plant_name,
      p.Urban_area_proximity,
      p.PA_id,
      g.Growth_stage,
      g.Plant_season,
      g.Timestamp_Per_Month,
      pa.Plantation_area,
      pa.Soil_type
    FROM plant_information p
    LEFT JOIN plant_growth g ON p.Plant_id = g.Plant_id
    LEFT JOIN plant_area pa ON p.PA_id = pa.PA_id
  `;
  
  // หากมี query search ให้เพิ่มเงื่อนไขใน WHERE clause
  if (search) {
    sql += " WHERE LOWER(p.Plant) LIKE ?";
  }
  
  sql += " ORDER BY p.Plant_id LIMIT ? OFFSET ?;";

  try {
    let params = [];
    if (search) {
      params.push(`%${search}%`);
    }
    params.push(limit, offset);
    const [results] = await db.promise().query(sql, params);
    res.json(results);
  } catch (err) {
    console.error('❌ Error fetching plants:', err);
    res.status(500).json({ error: err.message });
  }
});



//เพิ่มข้อมูลพืชใหม่
router.post('/plants', (req, res) => {
  const {
    plant_name,
    urban_area_proximity,
    PA_id,
    growth_stage,
    plant_season,
    timestamp_per_month,
  } = req.body;

  // 1) Insert ลงใน plant_information
  const sqlInsertPlantInfo = `
    INSERT INTO plant_information (Plant, Urban_area_proximity, PA_id)
    VALUES (?, ?, ?);
  `;

  db.query(sqlInsertPlantInfo, [plant_name, urban_area_proximity, PA_id], (err, result) => {
    if (err) {
      console.error('❌ Error inserting plant_information:', err);
      return res.status(500).json({ error: err.message });
    }

    const newPlantId = result.insertId; // ดึงค่า Plant_id ที่เพิ่ง insert

    // 2) Insert ลงใน plant_growth (ถ้ามีการบันทึก growth_stage ด้วย)
    const sqlInsertGrowth = `
      INSERT INTO plant_growth (Growth_stage, Plant_season, Timestamp_Per_Month, Plant_id)
      VALUES (?, ?, ?, ?);
    `;
    db.query(
      sqlInsertGrowth,
      [growth_stage, plant_season, timestamp_per_month, newPlantId],
      (err2, result2) => {
        if (err2) {
          console.error('❌ Error inserting plant_growth:', err2);
          return res.status(500).json({ error: err2.message });
        }

        // สำเร็จ
        res.json({
          message: '✅ New plant added successfully',
          plant_id: newPlantId,
        });
      }
    );
  });
});

// (3) แก้ไขข้อมูลพืช
router.put('/plants/:id', (req, res) => {
  const plantId = req.params.id;
  const {
    plant_name,
    urban_area_proximity,
    PA_id,
    growth_stage,
    plant_season,
    timestamp_per_month
  } = req.body;

  // อัปเดตตาราง plant_information
  const sqlUpdatePlantInfo = `
    UPDATE plant_information
    SET Plant = ?, Urban_area_proximity = ?, PA_id = ?
    WHERE Plant_id = ?;
  `;
  db.query(sqlUpdatePlantInfo, [plant_name, urban_area_proximity, PA_id, plantId], (err, result) => {
    if (err) {
      console.error('❌ Error updating plant_information:', err);
      return res.status(500).json({ error: err.message });
    }

    // อัปเดตตาราง plant_growth (ถ้ามีข้อมูล growth stage)
    const sqlUpdateGrowth = `
      UPDATE plant_growth
      SET Growth_stage = ?, Plant_season = ?, Timestamp_Per_Month = ?
      WHERE Plant_id = ?;
    `;
    db.query(sqlUpdateGrowth, [growth_stage, plant_season, timestamp_per_month, plantId], (err2, result2) => {
      if (err2) {
        console.error('❌ Error updating plant_growth:', err2);
        return res.status(500).json({ error: err2.message });
      }

      res.json({ message: '✅ Plant updated successfully' });
    });
  });
});

//ลบข้อมูลพืช
router.delete('/plants/:id', (req, res) => {
  const plantId = req.params.id;

  // 1. ลบข้อมูลใน water_management
  const sqlDeleteWaterManagement = `DELETE FROM water_management WHERE Plant_id = ?`;
  db.query(sqlDeleteWaterManagement, [plantId], (err, result) => {
    if (err) {
      console.error('❌ Error deleting water_management:', err);
      return res.status(500).json({ error: err.message });
    }

    // 2. ลบข้อมูลใน sensor_data
    const sqlDeleteSensorData = `DELETE FROM sensor_data WHERE Plant_id = ?`;
    db.query(sqlDeleteSensorData, [plantId], (err, result) => {
      if (err) {
        console.error('❌ Error deleting sensor_data:', err);
        return res.status(500).json({ error: err.message });
      }

      // 3. ลบข้อมูลใน crop_management
      const sqlDeleteCropManagement = `DELETE FROM crop_management WHERE Plant_id = ?`;
      db.query(sqlDeleteCropManagement, [plantId], (err, result) => {
        if (err) {
          console.error('❌ Error deleting crop_management:', err);
          return res.status(500).json({ error: err.message });
        }

        // 4. ลบข้อมูลใน plant_growth
        const sqlDeleteGrowth = `DELETE FROM plant_growth WHERE Plant_id = ?`;
        db.query(sqlDeleteGrowth, [plantId], (err, result) => {
          if (err) {
            console.error('❌ Error deleting plant_growth:', err);
            return res.status(500).json({ error: err.message });
          }

          // 5. ลบข้อมูลใน plant_information
          const sqlDeletePlantInfo = `DELETE FROM plant_information WHERE Plant_id = ?`;
          db.query(sqlDeletePlantInfo, [plantId], (err, result) => {
            if (err) {
              console.error('❌ Error deleting plant_information:', err);
              return res.status(500).json({ error: err.message });
            }
            res.json({ message: '✅ Plant deleted successfully' });
          });
        });
      });
    });
  });
});

// ตัวอย่าง router: plantRoutes.js
router.get('/plant_areas', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM plant_area');
    res.json(rows); // [{ PA_id:1, Plantation_area:'North', Soil_type:'Loamy'}, ...]
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/sensor-history", (req, res) => {
  const query = `
    (SELECT 
       sd.timestampPerHr AS timestamp,
       sd.humidity,
       sd.Soil_moisture AS soil_moisture,
       sd.rainfall,
       pa.Plantation_area
     FROM sensor_data sd
       JOIN plant_information pi ON sd.Plant_id = pi.Plant_id
       JOIN plant_area pa ON pi.PA_id = pa.PA_id
     WHERE pa.Plantation_area = 'Center'
     ORDER BY sd.timestampPerHr DESC
     LIMIT 50
    )

    UNION ALL

    (SELECT 
       sd.timestampPerHr AS timestamp,
       sd.humidity,
       sd.Soil_moisture AS soil_moisture,
       sd.rainfall,
       pa.Plantation_area
     FROM sensor_data sd
       JOIN plant_information pi ON sd.Plant_id = pi.Plant_id
       JOIN plant_area pa ON pi.PA_id = pa.PA_id
     WHERE pa.Plantation_area = 'North'
     ORDER BY sd.timestampPerHr DESC
     LIMIT 50
    )

    UNION ALL

    (SELECT 
       sd.timestampPerHr AS timestamp,
       sd.humidity,
       sd.Soil_moisture AS soil_moisture,
       sd.rainfall,
       pa.Plantation_area
     FROM sensor_data sd
       JOIN plant_information pi ON sd.Plant_id = pi.Plant_id
       JOIN plant_area pa ON pi.PA_id = pa.PA_id
     WHERE pa.Plantation_area = 'South'
     ORDER BY sd.timestampPerHr DESC
     LIMIT 50
    )
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching sensor history:", err);
      return res.status(500).send(err);
    }
    // ส่งผลลัพธ์ในรูป JSON กลับไปยัง client
    res.json(results);
  });
});

module.exports = router;
