import { renderTable } from "../graficos/renderTable";

export async function acidentesPorHorarioQuery(crash, containerId) {
  const sql = `
    SELECT 
      CAST(strftime('%H', STRPTIME("CRASH TIME", '%H:%M')) AS INTEGER) AS hora,
      COUNT(*) AS total
      FROM crashes
      WHERE "CRASH TIME" IS NOT NULL AND "CRASH TIME" != ''
      GROUP BY hora
      ORDER BY hora;
  `;

  const data = await crash.query(sql);
  renderTable(data, containerId);
  return data;
}