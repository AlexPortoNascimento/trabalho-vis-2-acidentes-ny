// src/analises/acidentesMainoth/index.js
import * as d3 from "d3";

export async function acidentesMainoth(crash, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  // ---------------------------
  // 0. Botões de filtro de ano
  // ---------------------------
  const controls = d3
    .select(container)
    .append("div")
    .attr("class", "year-controls")
    .style("margin", "0 0 8px 0");

  const yearOptions = [
    { label: "2023–2025", value: null }, // todos
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
      // limpa detalhes ao trocar de ano
      await updateDetails(null, selectedYear);
    });

  // ---------------------------
  // 1. Layout geral: mapa + detalhes
  // ---------------------------
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

  // fundo
  mapG
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", mapWidth)
    .attr("height", mapHeight)
    .attr("fill", "#f5f5f5");

  // grupos de camada
  const neighborhoodsGroup = mapG.append("g").attr("class", "neighborhoods");
  const boroughGroup = mapG.append("g").attr("class", "boroughs");
  const streetsGroup = mapG.append("g").attr("class", "streets");
  const labelGroup = mapG.append("g").attr("class", "borough-labels");

  // ---------------------------
  // área de DETALHES por distrito (centralizada)
  // ---------------------------
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
      "Clique em um distrito para ver as ruas e tipos de veículos mais envolvidos em acidentes."
    );

  const detailsWrapper = detailsDiv
    .append("div")
    .style("display", "flex")
    .style("gap", "24px")
    .style("flex-wrap", "wrap")
    .style("justify-content", "center");

  const streetsChartDiv = detailsWrapper
    .append("div")
    .style("flex", "1 1 320px");

  const vehiclesChartDiv = detailsWrapper
    .append("div")
    .style("flex", "1 1 320px");

  // ---------------------------
  // 2. Carregar GeoJSONs
  // ---------------------------
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

  // bairros (contorno)
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

  // ruas (malha cinza)
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

  // título do mapa
  const titleText = svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", 20)
    .attr("font-size", 16)
    .attr("font-weight", "bold");

  // legenda
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

  // ---------------------------
  // 3. Helpers de nomes
  // ---------------------------
  function normalizeBoroughName(name) {
    if (name == null) return "";
    let raw = String(name).trim();

    // caso venha código numérico 1..5
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

  // ---------------------------
  // 4. Mapa principal (choropleth)
  // ---------------------------
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

    // normaliza nomes
    rows.forEach((d) => {
      d.borough = normalizeBoroughName(d.borough);
    });

    const acidentesPorBorough = new Map(
      rows.map((d) => [d.borough, d.total_acidentes])
    );

    const counts = rows.map((d) => d.total_acidentes);
    const maxCount = d3.max(counts) || 1;
    const minCount = d3.min(counts) || 0;

    // escala relativa pra cada filtro
    const colorScale = d3
      .scaleSequential()
      .domain([minCount, maxCount])
      .interpolator(d3.interpolateRgb("#ffebee", "#b71c1c"));

    const inferFeatureBoroughName = makeInferFeatureName(acidentesPorBorough);

    // título
    if (year == null) {
      titleText.text("Acidentes por distrito em Nova York (2023–2025)");
    } else {
      titleText.text(`Acidentes por distrito em Nova York (${year})`);
    }

    // desenha distritos
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

    // clique no distrito → atualiza gráficos de detalhe
    boroughPaths.on("click", async (_event, d) => {
      const name = inferFeatureBoroughName(d);
      if (!name) return;
      boroughPaths.attr("stroke-width", (b) => (b === d ? 2.5 : 1.0));
      await updateDetails(name, year);
    });

    // rótulos numéricos
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

    // legenda
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

  // ---------------------------
  // 5. Gráficos de DETALHE (ruas + veículos)
  // ---------------------------
  async function updateDetails(boroughName, year) {
    streetsChartDiv.selectAll("*").remove();
    vehiclesChartDiv.selectAll("*").remove();

    if (!boroughName) {
      detailsTitle.text(
        "Clique em um distrito no mapa para ver as ruas e tipos de veículos mais envolvidos em acidentes."
      );
      return;
    }

    const yearLabel = year == null ? "2023–2025" : String(year);
    detailsTitle.text(
      `Detalhes de acidentes no distrito de ${boroughName} (${yearLabel})`
    );

    const yearClause =
      year != null
        ? ` AND EXTRACT(year FROM STRPTIME("CRASH DATE", '%m/%d/%Y')) = ${year}`
        : "";

    const boroughEsc = boroughName.replace(/'/g, "''");

    // --- 5.1. Top 5 ruas com mais acidentes ---
    const sqlStreets = `
      SELECT
        UPPER(TRIM("ON STREET NAME")) AS street,
        CAST(COUNT(*) AS DOUBLE) AS total
      FROM crashes
      WHERE borough IS NOT NULL
        AND TRIM(borough) <> ''
        AND UPPER(TRIM(borough)) = '${boroughEsc}'
        AND "ON STREET NAME" IS NOT NULL
        AND TRIM("ON STREET NAME") <> ''
        AND EXTRACT(year FROM STRPTIME("CRASH DATE", '%m/%d/%Y')) BETWEEN 2023 AND 2025
        ${yearClause}
      GROUP BY UPPER(TRIM("ON STREET NAME"))
      ORDER BY total DESC
      LIMIT 5
    `;

    let streetRows = [];
    try {
      streetRows = await crash.query(sqlStreets);
    } catch (e) {
      console.error("Erro na query de ruas:", e);
    }

    if (streetRows.length) {
      renderHorizontalBar(streetsChartDiv, streetRows, {
        categoryField: "street",
        valueField: "total",
        title: "Top 5 ruas com mais acidentes",
        valueLabel: "Número de acidentes",
      });
    } else {
      streetsChartDiv
        .append("p")
        .text("Não há dados de ruas para este distrito/período.");
    }

    // --- 5.2. Tipos de veículos mais envolvidos ---
    const sqlVehicles = `
      WITH vehicle_events AS (
        SELECT "VEHICLE TYPE CODE 1" AS vehicle_type,
               UPPER(TRIM(borough)) AS borough,
               "CRASH DATE"
        FROM crashes
        UNION ALL
        SELECT "VEHICLE TYPE CODE 2" AS vehicle_type,
               UPPER(TRIM(borough)) AS borough,
               "CRASH DATE"
        FROM crashes
        UNION ALL
        SELECT "VEHICLE TYPE CODE 3" AS vehicle_type,
               UPPER(TRIM(borough)) AS borough,
               "CRASH DATE"
        FROM crashes
        UNION ALL
        SELECT "VEHICLE TYPE CODE 4" AS vehicle_type,
               UPPER(TRIM(borough)) AS borough,
               "CRASH DATE"
        FROM crashes
        UNION ALL
        SELECT "VEHICLE TYPE CODE 5" AS vehicle_type,
               UPPER(TRIM(borough)) AS borough,
               "CRASH DATE"
        FROM crashes
      )
      SELECT
        UPPER(TRIM(vehicle_type)) AS vehicle_type,
        CAST(COUNT(*) AS DOUBLE) AS total
      FROM vehicle_events
      WHERE vehicle_type IS NOT NULL
        AND TRIM(vehicle_type) <> ''
        AND borough = '${boroughEsc}'
        AND EXTRACT(year FROM STRPTIME("CRASH DATE", '%m/%d/%Y')) BETWEEN 2023 AND 2025
        ${yearClause}
      GROUP BY UPPER(TRIM(vehicle_type))
      ORDER BY total DESC
      LIMIT 8
    `;

    let vehicleRows = [];
    try {
      vehicleRows = await crash.query(sqlVehicles);
    } catch (e) {
      console.error("Erro na query de veículos:", e);
    }

    if (vehicleRows.length) {
      renderVerticalBar(vehiclesChartDiv, vehicleRows, {
        categoryField: "vehicle_type",
        valueField: "total",
        title: "Tipos de veículos mais envolvidos",
        valueLabel: "Número de envolvimentos",
      });
    } else {
      vehiclesChartDiv
        .append("p")
        .text("Não há dados de tipos de veículos para este distrito/período.");
    }
  }

  // 5.1. Função genérica: barra horizontal (ruas)
  function renderHorizontalBar(div, data, cfg) {
    const w = 420;
    const h = 260;
    const m = { top: 50, right: 20, bottom: 30, left: 160 };

    const svg = d3
      .select(div.node())
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[cfg.valueField]) || 1])
      .nice()
      .range([m.left, w - m.right]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d[cfg.categoryField]))
      .range([m.top, h - m.bottom])
      .padding(0.2);

    svg
      .append("g")
      .attr("transform", `translate(0,${m.top})`)
      .call(d3.axisTop(x).ticks(4).tickFormat(d3.format(".2s")))
      .call((g) => g.select(".domain").remove());

    svg
      .append("g")
      .attr("transform", `translate(${m.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("font-size", 10);

    const color = d3.scaleSequential(d3.interpolateReds).domain(x.domain());

    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", x(0))
      .attr("y", (d) => y(d[cfg.categoryField]))
      .attr("width", (d) => x(d[cfg.valueField]) - x(0))
      .attr("height", y.bandwidth())
      .attr("fill", (d) => color(d[cfg.valueField]));

    svg
      .append("text")
      .attr("x", w / 2)
      .attr("y", 18)
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
      .text(cfg.valueLabel);
  }

  // 5.2. Função genérica: barra vertical (veículos)
  function renderVerticalBar(div, data, cfg) {
    const w = 420;
    const h = 260;
    const m = { top: 30, right: 20, bottom: 80, left: 50 };

    const svg = d3
      .select(div.node())
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d[cfg.categoryField]))
      .range([m.left, w - m.right])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[cfg.valueField]) || 1])
      .nice()
      .range([h - m.bottom, m.top]);

    const color = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[cfg.valueField])])
    .range(["#ffb3b3", "#8b0000"]);  // claro → escuro

    svg
      .append("g")
      .attr("transform", `translate(0,${h - m.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("font-size", 9)
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-35)");

    svg
      .append("g")
      .attr("transform", `translate(${m.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(".2s")))
      .call((g) => g.select(".domain").remove());

    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d[cfg.categoryField]))
      .attr("y", (d) => y(d[cfg.valueField]))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d[cfg.valueField]))
      .attr("fill", (d) => color(d[cfg.valueField]));

    svg
      .append("text")
      .attr("x", w / 2)
      .attr("y", 18)
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
      .text(cfg.valueLabel);
  }

  // ---------------------------
  // 6. Zoom / pan
  // ---------------------------
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

  // ---------------------------
  // 7. Render inicial
  // ---------------------------
  await updateMap(selectedYear);
  await updateDetails(null, selectedYear);
}
