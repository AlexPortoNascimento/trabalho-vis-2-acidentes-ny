export async function analiseAlexandre(crash) {

  //Como varia o número de acidentes ao longo das 24 horas do dia?
  const acidentesHora = await crash.query(`
    SELECT 
      HOUR("CRASH DATE") AS hora,
      COUNT(*) AS total
    FROM crashes
    GROUP BY hora
    ORDER BY hora
  `);
  
  //Quais regiões de Nova York apresentam maior concentração de acidentes?
  // (Futuro: quando a tabela `zones` estiver carregada)
  const acidentesPorRegiao = await crash.query(`
    SELECT 
      z.zone as zona,
      COUNT(*) AS total
    FROM crashes c
    JOIN zones z
    ON ST_Contains(z.geom, ST_Point(c.LONGITUDE, c.LATITUDE))
    GROUP BY z.zone
    ORDER BY total DESC;
  `);
  
  //Qual é a distribuição da severidade dos acidentes (feridos + mortos) em um dado horário do dia?
  // ATENÇÃO: hora será passada depois dinamicamente
  const severidadePorHora = await crash.query(`
    SELECT
      COALESCE("NUMBER OF PERSONS INJURED", 0)
      + COALESCE("NUMBER OF PERSONS KILLED", 0)
      AS severidade
    FROM crashes
    WHERE HOUR("CRASH DATE") = ?;
  `);

  //Como a composição dos tipos de veículos envolvidos em acidentes muda conforme o horário do dia?
  const tiposVeiculo = await crash.query(`
    SELECT tipo, SUM(total) as total
    FROM (
      SELECT "VEHICLE TYPE CODE1" AS tipo, COUNT(*) AS total 
      FROM crashes 
      WHERE "VEHICLE TYPE CODE1" IS NOT NULL
        AND HOUR("CRASH DATE") = ?
      GROUP BY "VEHICLE TYPE CODE1"
      
      UNION ALL
      SELECT "VEHICLE TYPE CODE2" AS tipo, COUNT(*) AS total 
      FROM crashes 
      WHERE "VEHICLE TYPE CODE2" IS NOT NULL
        AND HOUR("CRASH DATE") = ? 
      GROUP BY "VEHICLE TYPE CODE2"
      
      UNION ALL
      SELECT "VEHICLE TYPE CODE3" AS tipo, COUNT(*) AS total 
      FROM crashes 
      WHERE "VEHICLE TYPE CODE3" IS NOT NULL 
        AND HOUR("CRASH DATE") = ?
      GROUP BY "VEHICLE TYPE CODE3"
      
      UNION ALL
      SELECT "VEHICLE TYPE CODE4" AS tipo, COUNT(*) AS total 
      FROM crashes 
      WHERE "VEHICLE TYPE CODE4" IS NOT NULL
        AND HOUR("CRASH DATE") = ? 
      GROUP BY "VEHICLE TYPE CODE4"
      
      UNION ALL
      SELECT "VEHICLE TYPE CODE5" AS tipo, COUNT(*) AS total 
      FROM crashes
      WHERE "VEHICLE TYPE CODE5" IS NOT NULL 
        AND HOUR("CRASH DATE") = ?
      GROUP BY "VEHICLE TYPE CODE5"
    ) veículos
    GROUP BY tipo
    ORDER BY total DESC;
  `);

  return { acidentesHora, acidentesPorRegiao, severidadePorHora, tiposVeiculo };
}