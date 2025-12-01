export async function analiseInicial(crash) {
	//Como varia o número de acidentes ao longo das 24 horas do dia?
	const acidentesHora = await crash.query(`
  	SELECT 
    	HOUR(STRPTIME("CRASH DATE" || ' ' || "CRASH TIME", '%m/%d/%Y %H:%M')) as hora,
    	COUNT(*) AS total
  	FROM crashes
  	GROUP BY hora
  	ORDER BY hora
	`);

	return {acidentesHora}
}

export async function analiseHora(crash, horaEscolhida) {
  
  //Quais regiões de Nova York apresentam maior concentração de acidentes?
  // (Futuro: quando a tabela `zones` estiver carregada)
  /*const acidentesPorRegiao = await crash.query(`
    SELECT 
      z.zone as zona,
      COUNT(*) AS total
    FROM crashes c
    JOIN zones z
    	ON ST_Contains(z.geom, ST_Point(c.LONGITUDE, c.LATITUDE))
		WHERE HOUR(STRPTIME(c."CRASH DATE" || ' ' || c."CRASH TIME", '%m/%d/%Y %H:%M')) = ${horaEscolhida}
    GROUP BY z.zone
    ORDER BY total DESC;
  `);*/
  
  //Qual é a distribuição da severidade dos acidentes (feridos + mortos) em um dado horário do dia?
  const severidadePorHora = await crash.query(`
    SELECT
      CAST(COALESCE(CAST("NUMBER OF PERSONS INJURED" AS INTEGER), 0) AS INTEGER)
  		+ CAST(COALESCE(CAST("NUMBER OF PERSONS KILLED" AS INTEGER), 0) AS INTEGER)
      AS severidade
    FROM crashes
    WHERE HOUR(STRPTIME("CRASH DATE" || ' ' || "CRASH TIME", '%m/%d/%Y %H:%M')) = ${horaEscolhida}
  `);

  //Como a composição dos tipos de veículos envolvidos em acidentes muda conforme o horário do dia?
  const tiposVeiculo = await crash.query(`
    SELECT tipo, SUM(total) as total
    FROM (
      SELECT "VEHICLE TYPE CODE 1" AS tipo, COUNT(*) AS total 
      FROM crashes 
      WHERE "VEHICLE TYPE CODE 1" IS NOT NULL
        AND HOUR(STRPTIME("CRASH DATE" || ' ' || "CRASH TIME", '%m/%d/%Y %H:%M')) = ${horaEscolhida}
      GROUP BY "VEHICLE TYPE CODE 1"
      
      UNION ALL
      SELECT "VEHICLE TYPE CODE 2" AS tipo, COUNT(*) AS total 
      FROM crashes 
      WHERE "VEHICLE TYPE CODE 2" IS NOT NULL
        AND HOUR(STRPTIME("CRASH DATE" || ' ' || "CRASH TIME", '%m/%d/%Y %H:%M')) = ${horaEscolhida} 
      GROUP BY "VEHICLE TYPE CODE 2"
      
      UNION ALL
      SELECT "VEHICLE TYPE CODE 3" AS tipo, COUNT(*) AS total 
      FROM crashes 
      WHERE "VEHICLE TYPE CODE 3" IS NOT NULL 
        AND HOUR(STRPTIME("CRASH DATE" || ' ' || "CRASH TIME", '%m/%d/%Y %H:%M')) = ${horaEscolhida}
      GROUP BY "VEHICLE TYPE CODE 3"
      
      UNION ALL
      SELECT "VEHICLE TYPE CODE 4" AS tipo, COUNT(*) AS total 
      FROM crashes 
      WHERE "VEHICLE TYPE CODE 4" IS NOT NULL
        AND HOUR(STRPTIME("CRASH DATE" || ' ' || "CRASH TIME", '%m/%d/%Y %H:%M')) = ${horaEscolhida}
      GROUP BY "VEHICLE TYPE CODE 4"
      
      UNION ALL
      SELECT "VEHICLE TYPE CODE 5" AS tipo, COUNT(*) AS total 
      FROM crashes
      WHERE "VEHICLE TYPE CODE 5" IS NOT NULL 
        AND HOUR(STRPTIME("CRASH DATE" || ' ' || "CRASH TIME", '%m/%d/%Y %H:%M')) = ${horaEscolhida}
      GROUP BY "VEHICLE TYPE CODE 5"
    ) veículos
    GROUP BY tipo
    ORDER BY total DESC;
  `);

  return { /*acidentesPorRegiao*/ severidadePorHora, tiposVeiculo };
}