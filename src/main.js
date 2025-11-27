import { clearChart } from './clearChart';
import { Crash } from './crash';


function callbacks(data, pickupLocationsData, taxi, zonesData) {
    
    const clearBtn = document.querySelector('#clearBtn');

    if (!loadBtn || !clearBtn) {
        return;
    }

    clearBtn.addEventListener('click', async () => {
        clearChart();
    });
}

window.onload = async () => {
    const crash = new Crash("Motor_Vehicle_Collisions_-_Crashes_20251126.csv");
    await crash.init();

    await crash.loadCrash();

    window.crash = crash;
    window.q = (sql) => crash.query(sql);

    const sql = `
        SELECT borough,
        COUNT(*) AS total
        FROM crashes
        WHERE borough IS NOT NULL AND borough != ''
        GROUP BY borough
        ORDER BY total DESC;
    `;

    const data = await crash.query(sql);
    console.log("Acidentes por borough:", data);

    renderTable(data);
}


function renderTable(data) {
    const container = document.getElementById('result-table');
    
    if (!data || data.length === 0) {
        container.innerHTML = "<p>Nenhum dado encontrado.</p>";
        return;
    }

    // Cria a tabela
    let html = "<table border='1' cellpadding='5'><thead><tr>";

    // Cabeçalhos
    Object.keys(data[0]).forEach(key => {
        html += `<th>${key}</th>`;
    });

    html += "</tr></thead><tbody>";

    // Dados
    data.forEach(row => {
        html += "<tr>";
        Object.values(row).forEach(value => {
            html += `<td>${value}</td>`;
        });
        html += "</tr>";
    });

    html += "</tbody></table>";

    container.innerHTML = html;
}
