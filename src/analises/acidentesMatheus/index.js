// src/analises/acidentesMatheus.js
import * as d3 from "d3";

export async function acidentesMatheus(crash, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const controls = d3
    .select(container)
    .append("div")
    .attr("class", "year-controls")
    .style("margin", "0 0 8px 0");

  const yearOptions = [
    { label: "2023–2025", value: null },
    { label: "2023", value: 2023 },
    { label: "2024", value: 2024 },
    { label: "2025", value: 2025 },
  ];

  let selectedYear = null;

  const buttons = controls
    .selectAll("button")
    .data(yearOptions)
    .join("button")
    .attr("type", "button")
    .text((d) => d.label)
    .style("margin-right", "6px")
    .style("padding", "4px 8px")
    .style("border-radius", "4px")
    .style("border", "1px solid #ccc")
    .style("cursor", "pointer")
    .style("background-color", (d) =>
      d.value === selectedYear ? "#ddd" : "#f9f9f9"
    )
    .on("click", async (_event, d) => {
      selectedYear = d.value;
      buttons.style("background-color", (b) =>
        b.value === selectedYear ? "#ddd" : "#f9f9f9"
      );
      await updateMap(selectedYear);
      await updateDetails(null, selectedYear);
    });

  const width = container.clientWidth || 900;
  const height = 600;
  const margin = { top: 40, right: 20, bottom: 40, left: 20 };
  const mapWidth = width - margin.left - margin.right;
  const mapHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const rootG = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const mapG = rootG.append("g").attr("class", "map");

  mapG
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", mapWidth)
    .attr("height", mapHeight)
    .attr("fill", "#f7f7f7ff");

  const neighborhoodsGroup = mapG.append("g").attr("class", "neighborhoods");
  const boroughGroup = mapG.append("g").attr("class", "boroughs");
  const streetsGroup = mapG.append("g").attr("class", "streets");
  const labelGroup = mapG.append("g").attr("class", "borough-labels");

  const detailsDiv = d3
    .select(container)
    .append("div")
    .attr("class", "details")
    .style("margin-top", "16px")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center");

  const detailsTitle = detailsDiv
    .append("h3")
    .style("margin", "0 0 8px 0")
    .style("font-size", "14px")
    .style("text-align", "center")
    .text(
      "Clique em um distrito para ver os horários de maior risco e fatores contribuintes."
    );

  const detailsWrapper = detailsDiv
    .append("div")
    .style("display", "flex")
    .style("gap", "24px")
    .style("flex-wrap", "wrap")
    .style("justify-content", "center");

  const horariosChartDiv = detailsWrapper
    .append("div")
    .style("flex", "1 1 420px");

  const fatoresChartDiv = detailsWrapper
    .append("div")
    .style("flex", "1 1 420px");

  let boroughs, neighborhoods, streets;
  try {
    boroughs = await d3.json("nyc-boroughs.geojson");
    neighborhoods = await d3.json("nyc-neighborhoods.geojson");
    streets = await d3.json("nyc-streets.geojson");
  } catch (e) {
    console.error("Erro carregando GeoJSON:", e);
    container.innerHTML = "<p>Erro ao carregar os arquivos de mapa.</p>";
    return;
  }

  if (!boroughs || !boroughs.features) {
    container.innerHTML = "<p>Não foi possível carregar o mapa de distritos.</p>";
    return;
  }

  const projection = d3.geoMercator().fitSize([mapWidth, mapHeight], boroughs);
  const path = d3.geoPath().projection(projection);

  if (neighborhoods && neighborhoods.features) {
    neighborhoodsGroup
      .selectAll("path.neighborhood")
      .data(neighborhoods.features)
      .join("path")
      .attr("class", "neighborhood")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#b0b0b0")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "3,2")
      .attr("stroke-opacity", 0.7);
  }

  if (streets && streets.features) {
    streetsGroup
      .selectAll("path.street")
      .data(streets.features)
      .join("path")
      .attr("class", "street")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#d0d0d0")
      .attr("stroke-width", 0.4)
      .attr("stroke-opacity", 0.9);
  }

  const titleText = svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", 20)
    .attr("font-size", 16)
    .attr("font-weight", "bold");

  const legendWidth = 200;
  const legendHeight = 10;
  const legendX = width - margin.right - legendWidth;
  const legendY = height - margin.bottom - 40;

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX},${legendY})`);

  const legendLabel = legend
    .append("text")
    .attr("x", legendWidth / 2)
    .attr("y", legendHeight + 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 10);

  function normalizeBoroughName(name) {
    if (name == null) return "";
    let raw = String(name).trim();

    if (/^[0-9]+$/.test(raw)) {
      switch (raw) {
        case "1":
          return "MANHATTAN";
        case "2":
          return "BRONX";
        case "3":
          return "BROOKLYN";
        case "4":
          return "QUEENS";
        case "5":
          return "STATEN ISLAND";
        default:
          return raw;
      }
    }

    let n = raw.toUpperCase();

    if (n === "NEW YORK") n = "MANHATTAN";
    if (n === "RICHMOND") n = "STATEN ISLAND";

    if (n === "MN") n = "MANHATTAN";
    if (n === "BX") n = "BRONX";
    if (n === "BK") n = "BROOKLYN";
    if (n === "QN") n = "QUEENS";
    if (n === "SI") n = "STATEN ISLAND";

    return n;
  }

  function makeInferFeatureName(acidentesPorBorough) {
    const knownNames = new Set(acidentesPorBorough.keys());

    return function inferFeatureBoroughName(f) {
      const props = f.properties || {};
      const candidateFields = [
        "BoroName",
        "boro_name",
        "BORONAME",
        "borough",
        "Borough",
        "BOROUGH",
        "boro",
        "BORO",
      ];

      for (const key of candidateFields) {
        if (key in props) {
          const norm = normalizeBoroughName(props[key]);
          if (knownNames.has(norm)) return norm;
        }
      }

      for (const value of Object.values(props)) {
        const norm = normalizeBoroughName(value);
        if (knownNames.has(norm)) return norm;
      }

      return "";
    };
  }

  async function updateMap(year) {
    let yearClause = "";
    if (year != null) {
      yearClause = ` AND EXTRACT(year FROM STRPTIME("CRASH DATE", '%m/%d/%Y')) = ${year}`;
    }

    const sql = `
      SELECT
        UPPER(TRIM(borough)) AS borough,
        CAST(COUNT(*) AS DOUBLE) AS total_acidentes
      FROM crashes
      WHERE borough IS NOT NULL
        AND TRIM(borough) <> ''
        AND EXTRACT(year FROM STRPTIME("CRASH DATE", '%m/%d/%Y')) BETWEEN 2023 AND 2025
        ${yearClause}
      GROUP BY UPPER(TRIM(borough))
    `;

    let rows;
    try {
      rows = await crash.query(sql);
    } catch (e) {
      console.error("Erro na query DuckDB:", e);
      container.innerHTML = "<p>Erro ao consultar os dados de acidentes.</p>";
      return;
    }

    if (!rows || !rows.length) {
      boroughGroup.selectAll("*").remove();
      labelGroup.selectAll("*").remove();
      legend.selectAll("rect").remove();
      legend.selectAll(".legend-axis").remove();

      titleText.text("Sem dados de acidentes para o período selecionado.");
      legendLabel.text("");
      return;
    }

    rows.forEach((d) => {
      d.borough = normalizeBoroughName(d.borough);
    });

    const acidentesPorBorough = new Map(
      rows.map((d) => [d.borough, d.total_acidentes])
    );

    const counts = rows.map((d) => d.total_acidentes);
    const maxCount = d3.max(counts) || 1;
    const minCount = d3.min(counts) || 0;

    const colorScale = d3
      .scaleSequential()
      .domain([minCount, maxCount])
      .interpolator(d3.interpolateRgb("#97f5f8ff", "#1a197aff"));

    const inferFeatureBoroughName = makeInferFeatureName(acidentesPorBorough);

    if (year == null) {
      titleText.text("Horários com risco de acidente e fatores contribuintes mais comuns por distrito (2023–2025)");
    } else {
      titleText.text(`Acidentes por distrito em Nova York (${year})`);
    }

    boroughGroup.selectAll("*").remove();
    labelGroup.selectAll("*").remove();

    const boroughPaths = boroughGroup
      .selectAll("path.borough")
      .data(boroughs.features)
      .join("path")
      .attr("class", "borough")
      .attr("d", path)
      .attr("fill", (d) => {
        const name = inferFeatureBoroughName(d);
        const total = name ? acidentesPorBorough.get(name) : null;
        if (total == null) return "#e0e0e0";
        return colorScale(total);
      })
      .attr("stroke", "#555")
      .attr("stroke-width", 1.0)
      .style("cursor", "pointer");

    boroughPaths.append("title").text((d) => {
      const name = inferFeatureBoroughName(d) || "(sem match)";
      const total = name ? acidentesPorBorough.get(name) || 0 : 0;
      return `${name}\nAcidentes: ${total.toLocaleString("en-US")}`;
    });

    boroughPaths.on("click", async (_event, d) => {
      const name = inferFeatureBoroughName(d);
      if (!name) return;
      boroughPaths.attr("stroke-width", (b) => (b === d ? 2.5 : 1.0));
      await updateDetails(name, year);
    });

    labelGroup
      .selectAll("text.blabel")
      .data(boroughs.features)
      .join("text")
      .attr("class", "blabel")
      .attr("x", (d) => path.centroid(d)[0])
      .attr("y", (d) => path.centroid(d)[1])
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", 10)
      .attr("fill", "#212121")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("paint-order", "stroke")
      .text((d) => {
        const name = inferFeatureBoroughName(d);
        const total = name ? acidentesPorBorough.get(name) : null;
        return total != null ? d3.format(".2s")(total) : "";
      });

    legend.selectAll("rect").remove();
    legend.selectAll(".legend-axis").remove();

    const legendScale = d3
      .scaleLinear()
      .domain([minCount, maxCount])
      .range([0, legendWidth]);

    const legendSteps = 80;
    const legendData = d3
      .range(legendSteps)
      .map(
        (i) => minCount + (i / (legendSteps - 1)) * (maxCount - minCount)
      );

    legend
      .selectAll("rect")
      .data(legendData)
      .join("rect")
      .attr("x", (d) => legendScale(d))
      .attr("y", 0)
      .attr("width", legendWidth / legendSteps + 1)
      .attr("height", legendHeight)
      .attr("fill", (d) => colorScale(d));

    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(4)
      .tickFormat(d3.format(".2s"));

    legend
      .append("g")
      .attr("class", "legend-axis")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(legendAxis);

    legendLabel.text(
      year == null
        ? "Número de acidentes por distrito (2023–2025)"
        : `Número de acidentes por distrito (${year})`
    );
  }

  async function updateDetails(boroughName, year) {
    horariosChartDiv.selectAll("*").remove();
    fatoresChartDiv.selectAll("*").remove();

    if (!boroughName) {
      detailsTitle.text(
        "Clique em um distrito no mapa para ver os horários de maior risco e fatores contribuintes."
      );
      return;
    }

    const yearLabel = year == null ? "2023–2025" : String(year);
    detailsTitle.text(
      `Análise de ${boroughName} (${yearLabel})`
    );

    const yearClause =
      year != null
        ? ` AND EXTRACT(year FROM STRPTIME("CRASH DATE", '%m/%d/%Y')) = ${year}`
        : "";

    const boroughEsc = boroughName.replace(/'/g, "''");

    const sqlHorarios = `
      SELECT
        CAST(EXTRACT(hour FROM STRPTIME("CRASH TIME", '%H:%M')) AS INTEGER) AS hora,
        CAST(COUNT(*) AS DOUBLE) AS total
      FROM crashes
      WHERE borough IS NOT NULL
        AND TRIM(borough) <> ''
        AND UPPER(TRIM(borough)) = '${boroughEsc}'
        AND "CRASH TIME" IS NOT NULL
        AND TRIM("CRASH TIME") <> ''
        AND EXTRACT(year FROM STRPTIME("CRASH DATE", '%m/%d/%Y')) BETWEEN 2023 AND 2025
        ${yearClause}
      GROUP BY hora
      ORDER BY hora
    `;

    let horariosRows = [];
    try {
      horariosRows = await crash.query(sqlHorarios);
    } catch (e) {
      console.error("Erro na query de horários:", e);
    }

    if (horariosRows.length) {
     
      const allHours = Array.from({ length: 24 }, (_, i) => i);
      const hourMap = new Map(horariosRows.map(d => [d.hora, d.total]));
      
      const completeData = allHours.map(hora => ({
        hora,
        total: hourMap.get(hora) || 0,
        hora_formatada: `${String(hora).padStart(2, '0')}:00`
      }));

      renderLineChart(horariosChartDiv, completeData, {
        categoryField: "hora",
        valueField: "total",
        title: "Acidentes por hora do dia",
        xLabel: "Hora do dia",
        yLabel: "Número de acidentes"
      });
    } else {
      horariosChartDiv
        .append("p")
        .text("Não há dados de horários para este distrito/período.");
    }

  
    const sqlFatores = `
      WITH all_factors AS (
        SELECT "CONTRIBUTING FACTOR VEHICLE 1" AS fator,
               UPPER(TRIM(borough)) AS borough,
               "CRASH DATE"
        FROM crashes
        UNION ALL
        SELECT "CONTRIBUTING FACTOR VEHICLE 2" AS fator,
               UPPER(TRIM(borough)) AS borough,
               "CRASH DATE"
        FROM crashes
        UNION ALL
        SELECT "CONTRIBUTING FACTOR VEHICLE 3" AS fator,
               UPPER(TRIM(borough)) AS borough,
               "CRASH DATE"
        FROM crashes
        UNION ALL
        SELECT "CONTRIBUTING FACTOR VEHICLE 4" AS fator,
               UPPER(TRIM(borough)) AS borough,
               "CRASH DATE"
        FROM crashes
        UNION ALL
        SELECT "CONTRIBUTING FACTOR VEHICLE 5" AS fator,
               UPPER(TRIM(borough)) AS borough,
               "CRASH DATE"
        FROM crashes
      )
      SELECT
        UPPER(TRIM(fator)) AS fator,
        CAST(COUNT(*) AS DOUBLE) AS total
      FROM all_factors
      WHERE fator IS NOT NULL
        AND TRIM(fator) <> ''
        AND UPPER(TRIM(fator)) NOT IN ('UNSPECIFIED', 'UNKNOWN')
        AND borough = '${boroughEsc}'
        AND EXTRACT(year FROM STRPTIME("CRASH DATE", '%m/%d/%Y')) BETWEEN 2023 AND 2025
        ${yearClause}
      GROUP BY UPPER(TRIM(fator))
      ORDER BY total DESC
      LIMIT 15
    `;

    let fatoresRows = [];
    try {
      fatoresRows = await crash.query(sqlFatores);
    } catch (e) {
      console.error("Erro na query de fatores:", e);
    }

    if (fatoresRows.length) {
      renderBubbleChart(fatoresChartDiv, fatoresRows, {
        categoryField: "fator",
        valueField: "total",
        title: "Fatores contribuintes mais comuns",
        valueLabel: "Número de ocorrências"
      });
    } else {
      fatoresChartDiv
        .append("p")
        .text("Não há dados de fatores contribuintes para este distrito/período.");
    }
  }

  function renderLineChart(div, data, cfg) {
    const w = 420;
    const h = 280;
    const m = { top: 40, right: 20, bottom: 40, left: 50 };

    const svg = d3
      .select(div.node())
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, d => d[cfg.categoryField]))
      .range([m.left, w - m.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d[cfg.valueField])])
      .nice()
      .range([h - m.bottom, m.top]);

   
    const line = d3.line()
      .x(d => x(d[cfg.categoryField]))
      .y(d => y(d[cfg.valueField]))
      .curve(d3.curveMonotoneX);

   
    const area = d3.area()
      .x(d => x(d[cfg.categoryField]))
      .y0(y(0))
      .y1(d => y(d[cfg.valueField]))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(data)
      .attr("fill", "steelblue")
      .attr("fill-opacity", 0.3)
      .attr("d", area);

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    
    svg
      .append("g")
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => x(d[cfg.categoryField]))
      .attr("cy", d => y(d[cfg.valueField]))
      .attr("r", 3)
      .attr("fill", "steelblue")
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    
    svg
      .append("g")
      .attr("transform", `translate(0,${h - m.bottom})`)
      .call(d3.axisBottom(x).ticks(24).tickFormat(d => `${d}h`))
      .selectAll("text")
      .attr("font-size", 8)
      .attr("transform", "rotate(-45)");

    svg
      .append("g")
      .attr("transform", `translate(${m.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select(".domain").remove());

    
    svg
      .append("text")
      .attr("x", w / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text(cfg.title);

    
    svg
      .append("text")
      .attr("x", w / 2)
      .attr("y", h - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .text(cfg.xLabel);

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .text(cfg.yLabel);
  }

  // 5.2. Função: Bubble Chart para fatores contribuintes
  function renderBubbleChart(div, data, cfg) {
    const w = 420;
    const h = 280;
    const m = { top: 40, right: 20, bottom: 20, left: 20 };

    const svg = d3
      .select(div.node())
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    // Escala para tamanho das bolhas
    const radius = d3
      .scaleSqrt()
      .domain([0, d3.max(data, d => d[cfg.valueField])])
      .range([8, 40]);

    // Escala de cores
    const color = d3
      .scaleSequential(d3.interpolateReds)
      .domain([0, d3.max(data, d => d[cfg.valueField])]);

    // Posicionamento usando força
    const simulation = d3.forceSimulation(data)
      .force("charge", d3.forceManyBody().strength(50))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide().radius(d => radius(d[cfg.valueField]) + 2))
      .stop();

    // Executar a simulação
    for (let i = 0; i < 100; ++i) simulation.tick();

    // Bolhas
    const bubbles = svg
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => radius(d[cfg.valueField]))
      .attr("fill", d => color(d[cfg.valueField]))
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .style("opacity", 0.8);

    // Labels das bolhas
    const labels = svg
      .selectAll("text")
      .data(data)
      .join("text")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", 8)
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .text(d => {
        const value = d3.format(".2s")(d[cfg.valueField]);
        return value;
      });

    // Tooltips
    bubbles
      .append("title")
      .text(d => {
        const factorName = d[cfg.categoryField].length > 30 
          ? d[cfg.categoryField].substring(0, 30) + "..." 
          : d[cfg.categoryField];
        return `${factorName}\nOcorrências: ${d[cfg.valueField].toLocaleString()}`;
      });

    // Título
    svg
      .append("text")
      .attr("x", w / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text(cfg.title);

    // Legenda de tamanho (opcional)
    const legendData = [
      d3.min(data, d => d[cfg.valueField]),
      d3.median(data, d => d[cfg.valueField]),
      d3.max(data, d => d[cfg.valueField])
    ];

    const legend = svg
      .append("g")
      .attr("transform", `translate(${w - 80}, ${h - 60})`);

    legend
      .selectAll("circle")
      .data(legendData)
      .join("circle")
      .attr("cx", 0)
      .attr("cy", (d, i) => i * 15)
      .attr("r", d => radius(d))
      .attr("fill", "none")
      .attr("stroke", "#999");

    legend
      .selectAll("text")
      .data(legendData)
      .join("text")
      .attr("x", 10)
      .attr("y", (d, i) => i * 15)
      .attr("dy", "0.35em")
      .attr("font-size", 7)
      .text(d => d3.format(".2s")(d));
  }

  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .translateExtent([
      [0, 0],
      [mapWidth, mapHeight],
    ])
    .on("zoom", (event) => {
      mapG.attr("transform", event.transform);
    });

  svg.call(zoom);

  svg.on("dblclick.zoom", null);
  svg.on("dblclick", () => {
    svg
      .transition()
      .duration(300)
      .call(zoom.transform, d3.zoomIdentity);
  });

  await updateMap(selectedYear);
  await updateDetails(null, selectedYear);
}