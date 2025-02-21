const maxDataPoints = 10;

const tempCtx = document.getElementById("tempChart")?.getContext("2d");
const tempChart = new Chart(tempCtx, {
  type: "line",
  data: { labels: [], datasets: [{ label: "Temperature (°C)", data: [], backgroundColor: "rgba(255, 99, 132, 0.2)", borderColor: "rgba(255, 99, 132, 1)", borderWidth: 1, tension: 0.3 }] },
  options: {
    scales: {
      x: { title: { display: true, text: "Time" } },
      y: { title: { display: true, text: "°C" }, beginAtZero: true }
    },
    animation: { duration: 0 }
  }
});

const humCtx = document.getElementById("humidityChart")?.getContext("2d");
const humidityChart = new Chart(humCtx, {
  type: "line",
  data: { labels: [], datasets: [{ label: "Humidity (%)", data: [], backgroundColor: "rgba(54, 162, 235, 0.2)", borderColor: "rgba(54, 162, 235, 1)", borderWidth: 1, tension: 0.3 }] },
  options: {
    scales: {
      x: { title: { display: true, text: "Time" } },
      y: { title: { display: true, text: "%" }, beginAtZero: true }
    },
    animation: { duration: 0 }
  }
});

const soilCtx = document.getElementById("soilMoistureChart")?.getContext("2d");
const soilMoistureChart = new Chart(soilCtx, {
  type: "line",
  data: { labels: [], datasets: [{ label: "Soil Moisture (%)", data: [], backgroundColor: "rgba(153, 102, 255, 0.2)", borderColor: "rgba(153, 102, 255, 1)", borderWidth: 1, tension: 0.3 }] },
  options: {
    scales: {
      x: { title: { display: true, text: "Time" } },
      y: { title: { display: true, text: "%" }, beginAtZero: true }
    },
    animation: { duration: 0 }
  }
});

const ws = new WebSocket("ws://localhost:3000");
ws.onopen = () => console.log("Connected to WebSocket server");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateRealtimeCharts(data);
  addRealtimeDataRow(data);
};

function updateRealtimeCharts(data) {
  const timeLabel = new Date(data.timestamp).toLocaleTimeString();

  function updateChart(chart, value) {
    if (chart.data.labels.length >= maxDataPoints) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.data.labels.push(timeLabel);
    chart.data.datasets[0].data.push(value);
    chart.update();
  }

  updateChart(tempChart, data.temperature);
  updateChart(humidityChart, data.humidity);
  updateChart(soilMoistureChart, data.soil_moisture);
}

function addRealtimeDataRow(data) {
  const tbody = document.getElementById("realtimeData");
  if (!tbody) return;

  const row = document.createElement("tr");
  row.classList.add("transition", "duration-300", "hover:bg-gray-100");
  row.innerHTML = `
    <td class="px-4 py-2 text-sm text-gray-700">${data.timestamp}</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.temperature}°C</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.humidity}%</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.soil_moisture}%</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.ph}%</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.rainfall}%</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.nitrogen}%</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.phosphorus}%</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.potassium}%</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.organic_matter}%</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.wind_speed}%</td>
    <td class="px-4 py-2 text-sm text-gray-700">${data.co2}%</td>
  `;
  tbody.prepend(row);

  while (tbody.rows.length > 10) {
    tbody.deleteRow(tbody.rows.length - 1);
  }
}

function loadData(endpoint, tableBodyId) {
  fetch(endpoint)
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById(tableBodyId);
      if (!tbody) return;
      tbody.innerHTML = "";
      data.forEach(item => {
        const row = document.createElement("tr");
        row.classList.add("transition", "duration-300", "hover:bg-gray-100");

        row.innerHTML = Object.keys(item).map(key =>
          `<td class="px-4 py-2 text-sm text-gray-700">${item[key]}</td>`
        ).join("");
        tbody.appendChild(row);
      });
    })
    .catch(error => {
      console.error(`Error loading data from ${endpoint}`, error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  async function fetchWeatherData() {
    try {
      const response = await fetch("http://localhost:3000/api/weather");
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      const data = await response.json();

      // ตรวจสอบว่ามีค่าที่ถูกต้องหรือไม่
      if (data && data.temperature !== undefined) {
        document.getElementById("weatherLocation").textContent = data.location || "Unknown";
        document.getElementById("weatherTemp").textContent = data.temperature || "-";
        document.getElementById("weatherHumidity").textContent = data.humidity || "-";
        document.getElementById("weatherWind").textContent = data.windSpeed || "-";
        document.getElementById("weatherDesc").textContent = data.weather || "No data";

        // อัปเดตไอคอน ถ้ามีข้อมูล
        if (data.icon) {
          const weatherIcon = `https://openweathermap.org/img/wn/${data.icon}.png`;
          const iconElement = document.getElementById("weatherIcon");
          iconElement.src = weatherIcon;
          iconElement.classList.remove("hidden"); // แสดงไอคอนเมื่อโหลดสำเร็จ
        }
      } else {
        console.error("Invalid weather data:", data);
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  }

  // เรียกใช้เมื่อโหลดหน้าเว็บ และอัปเดตทุก 10 นาที
  fetchWeatherData();
  setInterval(fetchWeatherData, 600000);
});