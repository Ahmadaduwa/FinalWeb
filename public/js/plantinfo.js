let plants = [];

function addPlant() {
    const name = document.getElementById("plantName").value;
    const type = document.getElementById("plantType").value;
    const growthTime = document.getElementById("growthTime").value;
    const waterNeed = document.getElementById("waterNeed").value;

    if (name && type && growthTime && waterNeed) {
        plants.push({ name, type, growthTime, waterNeed });
        renderPlants();
        clearForm();
    } else {
        alert("Please fill all fields!");
    }
}

function renderPlants() {
    const tableBody = document.getElementById("plantTableBody");
    tableBody.innerHTML = "";

    plants.forEach((plant, index) => {
        const row = document.createElement("tr");
        row.classList.add("border-b");

        row.innerHTML = `
            <td class="p-2">${plant.name}</td>
            <td class="p-2">${plant.type}</td>
            <td class="p-2">${plant.growthTime} days</td>
            <td class="p-2">${plant.waterNeed} L/week</td>
            <td class="p-2">
                <button onclick="editPlant(${index})" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
                <button onclick="deletePlant(${index})" class="text-red-500 hover:text-red-700 ml-2"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function deletePlant(index) {
    plants.splice(index, 1);
    renderPlants();
}

function editPlant(index) {
    const plant = plants[index];
    document.getElementById("plantName").value = plant.name;
    document.getElementById("plantType").value = plant.type;
    document.getElementById("growthTime").value = plant.growthTime;
    document.getElementById("waterNeed").value = plant.waterNeed;

    deletePlant(index);
}

function clearForm() {
    document.getElementById("plantName").value = "";
    document.getElementById("plantType").value = "";
    document.getElementById("growthTime").value = "";
    document.getElementById("waterNeed").value = "";
}
