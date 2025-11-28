export function renderTable(data, containerId) {
    const container = document.getElementById(containerId);
    
    if (!data || data.length === 0) {
        container.innerHTML = "<p>Nenhum dado encontrado.</p>";
        return;
    }

    let html = "<table border='1' cellpadding='5'><thead><tr>";

    Object.keys(data[0]).forEach(key => {
        html += `<th>${key}</th>`;
    });

    html += "</tr></thead><tbody>";

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