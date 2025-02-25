let plants = [];
    let editingPlantId = null;
    let currentPage = 1;
    let searchQuery = "";
    let timeoutId = null;

    // ดึงข้อมูลพืชจาก API ตามหน้าและคำค้นหา
    async function fetchPlants(page = currentPage, searchQuery) {
      currentPage = page;
      try {
        let url = `http://localhost:3000/api/plants?page=${page}`;
        if (searchQuery.trim() !== "") {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        plants = data;
        renderPlants(plants);
        renderPagination(data.length);
      } catch (error) {
        console.error("Error fetching plants:", error);
      }
    }

    // Render ตารางข้อมูลพืช
    function renderPlants(plantData) {
      const plantList = document.getElementById("plantList");
      plantList.innerHTML = plantData.map(plant => {
        const plantingDate = plant.Timestamp_Per_Month ? plant.Timestamp_Per_Month.split(" ")[0] : "";
        return `
          <tr>
            <td class="px-6 py-4 whitespace-nowrap">${plant.plant_name || ""}</td>
            <td class="px-6 py-4 whitespace-nowrap">${plant.Soil_type || "-"}</td>
            <td class="px-6 py-4 whitespace-nowrap">${plant.Growth_stage || "-"}</td>
            <td class="px-6 py-4 whitespace-nowrap">${plant.Plant_season}</td>
            <td class="px-6 py-4 whitespace-nowrap">${plant.Plantation_area || "-"}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button onclick="editPlant(${plant.Plant_id})" class="text-blue-600 hover:text-blue-900 mr-4">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deletePlant(${plant.Plant_id})" class="text-red-600 hover:text-red-900">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join("");
    }

    // Render Pagination
    function renderPagination(fetchedCount) {
      const paginationContainer = document.getElementById("pagination");
      const disableNext = fetchedCount < 10;
      const disablePrev = currentPage === 1;
      const nextBtnClass = disableNext
        ? "px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
        : "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer";
      const prevBtnClass = disablePrev
        ? "px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
        : "px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition cursor-pointer";

      paginationContainer.innerHTML = `
        <div class="flex items-center justify-center space-x-4 mt-4">
          <button 
            onclick="${disablePrev ? "" : `fetchPlants(${currentPage - 1}, '${searchQuery}')`}" 
            ${disablePrev ? "disabled" : ""} 
            class="${prevBtnClass}">
            Previous
          </button>
          <span class="text-lg font-semibold">Page ${currentPage}</span>
          <button 
            onclick="${disableNext ? "" : `fetchPlants(${currentPage + 1}, '${searchQuery}')`}" 
            ${disableNext ? "disabled" : ""} 
            class="${nextBtnClass}">
            Next
          </button>
        </div>
      `;
    }

    // ค้นหาพืชด้วย debounce
    document.getElementById("searchPlant").addEventListener("input", function (e) {
      clearTimeout(timeoutId);
      const query = e.target.value;
      timeoutId = setTimeout(function () {
        searchQuery = query;
        fetchPlants(1, searchQuery);
      }, 500);
    });

    // เมื่อหน้าเพจโหลด
    document.addEventListener("DOMContentLoaded", function () {
      fetchPlants(currentPage, searchQuery);
      fetchPlantAreas();
    });

    // ฟังก์ชันเปิด modal (ไม่รีเซ็ตค่า)
    function openPlantModal() {
      document.getElementById("plantModal").classList.remove("hidden");
    }

    // ฟังก์ชันสำหรับเพิ่มพืชใหม่
    function newPlant() {
      editingPlantId = null;
      document.getElementById("modalTitle").textContent = "Add New Plant";
      document.getElementById("plantForm").reset();
      openPlantModal();
    }

    // ฟังก์ชันปิด modal
    function closePlantModal() {
      document.getElementById("plantModal").classList.add("hidden");
    }

    function editPlant(id) {
        const plant = plants.find(p => p.Plant_id === id);
      
        console.log("editPlant -> plant:", plant);
      
        if (plant) {
          editingPlantId = id;
          document.getElementById("modalTitle").textContent = "Edit Plant";
      
          // ชื่อพืช
          document.getElementById("plantName").value = plant.plant_name || "";
      
          // ระยะการเจริญเติบโต
          document.getElementById("growthStage").value = plant.Growth_stage || "seedling";
      
          // ฤดูกาลปลูก
          // ในตาราง DB มีฟิลด์ Plant_season ให้ดึงค่ามาเซ็ต
          document.getElementById("plantSeason").value = plant.Plant_season || "January";
      
          // พื้นที่ปลูก
          document.getElementById("paId").value = plant.PA_id || "";
      
          openPlantModal();
        }
      }
      
      

      document.getElementById("plantForm").addEventListener("submit", async function (e) {
        e.preventDefault();
      
        // เก็บค่าจากฟอร์ม
        const plantName = document.getElementById("plantName").value;
        const growthStage = document.getElementById("growthStage").value;
        const plantSeason = document.getElementById("plantSeason").value; // <-- จาก select
        const paId = document.getElementById("paId").value;
      
        // อาจกำหนดระยะห่างจากเมืองแบบสุ่ม หรือให้ผู้ใช้ระบุ (ตัวอย่างเดิม)
        const urban_area_proximity = Math.floor(Math.random() * 50);
      
        // สร้าง timestamp อัตโนมัติ (เวลาปัจจุบัน)
        const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
        // สร้าง object สำหรับส่งไป API
        const plantData = {
          plant_name: plantName,
          urban_area_proximity: urban_area_proximity,
          PA_id: paId,
          growth_stage: growthStage,
          plant_season: plantSeason,
          timestamp_per_month: currentTimestamp // <-- Stamp ใหม่ทุกครั้ง
        };
      
        try {
          if (editingPlantId) {
            // PUT => แก้ไข
            const res = await fetch(`http://localhost:3000/api/plants/${editingPlantId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(plantData)
            });
            const result = await res.json();
            console.log("Update response:", result);
          } else {
            // POST => เพิ่มใหม่
            const res = await fetch("http://localhost:3000/api/plants", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(plantData)
            });
            const result = await res.json();
            console.log("Create response:", result);
          }
          // หลังจากบันทึกสำเร็จ ดึงข้อมูลใหม่ + ปิด modal
          await fetchPlants(currentPage, searchQuery);
          closePlantModal();
        } catch (error) {
          console.error("Error saving plant:", error);
        }
      });
      

    // ลบข้อมูลพืช
    async function deletePlant(id) {
      if (confirm("Are you sure you want to delete this plant?")) {
        try {
          const res = await fetch(`http://localhost:3000/api/plants/${id}`, {
            method: "DELETE"
          });
          const result = await res.json();
          console.log("Delete response:", result);
          await fetchPlants(currentPage, searchQuery);
        } catch (error) {
          console.error("Error deleting plant:", error);
        }
      }
    }

    // โหลดรายการพื้นที่ปลูก
    async function fetchPlantAreas() {
      try {
        const res = await fetch('http://localhost:3000/api/plant_areas');
        const areas = await res.json();
        const paSelect = document.getElementById('paId');
        paSelect.innerHTML = areas.map(area => `
          <option value="${area.PA_id}">
            ${area.Plantation_area} (${area.Soil_type})
          </option>
        `).join('');
      } catch (error) {
        console.error('Error fetching plant areas:', error);
      }
    }