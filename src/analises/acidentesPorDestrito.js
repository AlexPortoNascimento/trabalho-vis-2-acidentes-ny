import { renderTable } from "../renderTable";

export async function acidentesPorDestrito(crash) {
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
    return data;
}