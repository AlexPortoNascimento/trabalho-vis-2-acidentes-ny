import { renderTable } from "../renderTable";

export async function acidentesPorDistrito(crash, containerId) {
  const sql = `
    SELECT borough,
    COUNT(*) AS total
    FROM crashes
    WHERE borough IS NOT NULL AND borough != ''
    GROUP BY borough
    ORDER BY total DESC;
  `;

  const data = await crash.query(sql);
  renderTable(data, containerId);
  return data;
}