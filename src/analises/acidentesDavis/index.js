import * as d3 from "d3";

// Variáveis globais de Estado
let anoSelecionado = "Todos";
let distritoSelecionado = "Todos";
let crashInstance = null;

// Variáveis para guardar REFERÊNCIA DOS CONTAINERS (Evita buscar por ID)
let containerEstacoes = null;
let containerTendencia = null;
let containerSeveridade = null;

export async function mount(crash, containerId) {
    console.log("--- INICIANDO MOUNT (DAVIS - V3 FINAL) ---");
    
    crashInstance = crash;
    const root = d3.select(containerId);
    root.html(""); // Limpa o #analise-davis
    
    // Título
    root.append("h2")
        .text("Análise Temporal e Espacial - Grupo Davis")
        .style("color", "#333")
        .style("margin-bottom", "15px");
    
    // --- 1. Criação dos Filtros ---
    const areaFiltros = root.append("div")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("gap", "20px")
        .style("margin-bottom", "20px")
        .style("padding", "15px")
        .style("background", "#f4f4f4")
        .style("border-radius", "8px")
        .style("border", "1px solid #ddd");

    // Botões de Ano
    const containerAno = areaFiltros.append("div");
    containerAno.append("h4").text("Filtrar por Ano:").style("margin", "0 0 10px 0");
    ["Todos", "2018", "2019", "2020", "2021"].forEach(ano => {
        containerAno.append("button")
            .text(ano)
            .attr("class", "btn-filtro-ano-davis") // Classe única para não conflitar
            .style("margin-right", "5px")
            .style("padding", "6px 12px")
            .style("cursor", "pointer")
            .style("border", "1px solid #ccc")
            .style("background", "white")
            .on("click", async function() {
                anoSelecionado = ano;
                d3.selectAll(".btn-filtro-ano-davis").style("background", "white").style("color", "black");
                d3.select(this).style("background", "#333").style("color", "white");
                await atualizarGraficos();
            });
    });

    // Botões de Distrito
    const containerDistrito = areaFiltros.append("div");
    containerDistrito.append("h4").text("Filtrar por Distrito:").style("margin", "0 0 10px 0");
    ["Todos", "MANHATTAN", "BROOKLYN", "QUEENS", "BRONX", "STATEN ISLAND"].forEach(distrito => {
        containerDistrito.append("button")
            .text(distrito)
            .attr("class", "btn-filtro-distrito-davis")
            .style("margin-right", "5px")
            .style("padding", "6px 12px")
            .style("cursor", "pointer")
            .style("border", "1px solid #ccc")
            .style("background", "white")
            .on("click", async function() {
                distritoSelecionado = distrito;
                d3.selectAll(".btn-filtro-distrito-davis").style("background", "white").style("color", "black");
                d3.select(this).style("background", "#333").style("color", "white");
                await atualizarGraficos();
            });
    });

    // --- 2. Área dos Gráficos ---
    const grid = root.append("div")
        .style("display", "grid")
        .style("grid-template-columns", "1fr 1fr")
        .style("gap", "20px");

    // CRIAÇÃO DOS CONTAINERS (Guardamos a referência na variável, não usamos ID string depois)
    // Usamos .node() para pegar o elemento HTML puro
    containerEstacoes = grid.append("div")
        .style("background", "white").style("padding", "10px")
        .style("border", "1px solid #ddd").style("border-radius", "8px")
        .style("min-height", "300px")
        .node();
    
    containerTendencia = grid.append("div")
        .style("background", "white").style("padding", "10px")
        .style("border", "1px solid #ddd").style("border-radius", "8px")
        .style("min-height", "300px")
        .node();
    
    containerSeveridade = grid.append("div")
        .style("grid-column", "span 2")
        .style("background", "white").style("padding", "10px")
        .style("border", "1px solid #ddd").style("border-radius", "8px")
        .style("min-height", "300px")
        .node();

    // Feedback visual de carregamento
    d3.select(containerEstacoes).html("<p>Carregando...</p>");
    d3.select(containerTendencia).html("<p>Carregando...</p>");
    d3.select(containerSeveridade).html("<p>Carregando...</p>");

    // Botão inicial ativo
    d3.selectAll(".btn-filtro-ano-davis").filter(function(){ return d3.select(this).text() === "Todos" })
      .style("background", "#333").style("color", "white");

    try {
        await atualizarGraficos();
    } catch (error) {
        console.error("ERRO NO MOUNT:", error);
        root.append("p").text("Erro ao iniciar gráficos: " + error.message).style("color", "red");
    }
}

async function atualizarGraficos() {
    if (!crashInstance) return;

    // Expressões SQL
    const dateExpr = `strptime("CRASH DATE", '%m/%d/%Y')`;
    const injuredExpr = `CAST(COALESCE("NUMBER OF PERSONS INJURED", '0') AS INTEGER)`;
    const killedExpr = `CAST(COALESCE("NUMBER OF PERSONS KILLED", '0') AS INTEGER)`;

    // Filtros
    let whereClause = "WHERE 1=1"; 
    if (anoSelecionado !== "Todos") whereClause += ` AND YEAR(${dateExpr}) = ${anoSelecionado}`;
    if (distritoSelecionado !== "Todos") whereClause += ` AND BOROUGH = '${distritoSelecionado}'`;

    // Queries
    const queryEstacoes = `
        SELECT 
            CASE 
                WHEN MONTH(${dateExpr}) IN (12, 1, 2) THEN 'Inverno'
                WHEN MONTH(${dateExpr}) IN (3, 4, 5) THEN 'Primavera'
                WHEN MONTH(${dateExpr}) IN (6, 7, 8) THEN 'Verão'
                ELSE 'Outono'
            END as estacao,
            COUNT(*) as total
        FROM crashes ${whereClause} GROUP BY estacao
    `;
    
    const queryTendencia = `
        SELECT YEAR(${dateExpr}) as ano, COUNT(*) as total
        FROM crashes
        WHERE 1=1 ${distritoSelecionado !== "Todos" ? `AND BOROUGH = '${distritoSelecionado}'` : ""}
        GROUP BY ano ORDER BY ano
    `;

    const querySeveridade = `
        SELECT BOROUGH as distrito, SUM(${injuredExpr} + ${killedExpr}) as vitimas
        FROM crashes
        WHERE BOROUGH IS NOT NULL ${anoSelecionado !== "Todos" ? `AND YEAR(${dateExpr}) = ${anoSelecionado}` : ""}
        GROUP BY distrito ORDER BY vitimas DESC
    `;

    // Executa e trata dados
    const dadosEstacoes = await executarQuery(queryEstacoes);
    const dadosTendencia = await executarQuery(queryTendencia);
    const dadosSeveridade = await executarQuery(querySeveridade);

    console.log("Dados prontos para renderizar:", {dadosEstacoes, dadosTendencia, dadosSeveridade});

    // Renderiza PASSANDO O ELEMENTO HTML (Node)
    if(containerEstacoes) renderGraficoEstacoesLocal(dadosEstacoes, containerEstacoes);
    if(containerTendencia) renderGraficoTendenciaLocal(dadosTendencia, containerTendencia);
    if(containerSeveridade) renderGraficoSeveridadeLocal(dadosSeveridade, containerSeveridade);
}

// Helper SQL
async function executarQuery(sql) {
    try {
        let result;
        if (typeof crashInstance.query === 'function') {
            result = await crashInstance.query(sql);
        } else if (typeof crashInstance.processQuery === 'function') {
            result = await crashInstance.processQuery(sql);
        } else {
            const db = crashInstance.db || crashInstance;
            const conn = await db.connect();
            result = await conn.query(sql);
            await conn.close();
        }

        let arrayResult = result;
        if (result && typeof result.toArray === 'function') {
            arrayResult = result.toArray();
        }
        if (!arrayResult) return [];

        return Array.from(arrayResult).map(row => {
            const cleanObj = { ...row };
            for (const key in cleanObj) {
                if (typeof cleanObj[key] === 'bigint') cleanObj[key] = Number(cleanObj[key]);
            }
            return cleanObj;
        });
    } catch (e) {
        console.error("Erro SQL:", e);
        return [];
    }
}

// ---------------------------------------------------------
// FUNÇÕES DE RENDERIZAÇÃO (Recebem o elemento HTML direto)
// ---------------------------------------------------------

function renderGraficoEstacoesLocal(dados, htmlElement) {
    const containerId = d3.select(htmlElement); // Seleciona o elemento passado
    containerId.html(""); // Limpa o "Carregando..."

    if(!dados || dados.length === 0) {
        containerId.html("<p>Sem dados para exibir.</p>");
        return;
    }

    const largura = 400, altura = 300;
    const margem = { top: 40, right: 20, bottom: 40, left: 60 };

    const svg = containerId.append("svg")
        .attr("viewBox", `0 0 ${largura} ${altura}`)
        .style("width", "100%")
        .style("height", "auto");

    const escalaX = d3.scaleBand()
        .domain(dados.map(d => d.estacao))
        .range([margem.left, largura - margem.right])
        .padding(0.4);

    const escalaY = d3.scaleLinear()
        .domain([0, d3.max(dados, d => d.total)])
        .range([altura - margem.bottom, margem.top]);

    // Eixos
    svg.append("g")
        .attr("transform", `translate(0,${altura - margem.bottom})`)
        .call(d3.axisBottom(escalaX));

    svg.append("g")
        .attr("transform", `translate(${margem.left},0)`)
        .call(d3.axisLeft(escalaY).ticks(5).tickFormat(d3.format(".2s")));

    // Barras
    svg.selectAll("rect")
        .data(dados)
        .enter()
        .append("rect")
        .attr("x", d => escalaX(d.estacao))
        .attr("y", d => escalaY(d.total))
        .attr("width", escalaX.bandwidth())
        .attr("height", d => (altura - margem.bottom) - escalaY(d.total))
        .attr("fill", "#69b3a2");
        
    // Título
    svg.append("text")
        .attr("x", largura/2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Acidentes por Estação");
}

function renderGraficoTendenciaLocal(dados, htmlElement) {
    const containerId = d3.select(htmlElement);
    containerId.html("");

    if(!dados || dados.length === 0) {
        containerId.html("<p>Sem dados para exibir.</p>");
        return;
    }

    const largura = 400, altura = 300;
    const margem = { top: 40, right: 20, bottom: 40, left: 60 };

    const svg = containerId.append("svg")
        .attr("viewBox", `0 0 ${largura} ${altura}`)
        .style("width", "100%")
        .style("height", "auto");

    const totalGeral = d3.sum(dados, d => d.total);
    const media = totalGeral / dados.length;

    const escalaX = d3.scaleBand()
        .domain(dados.map(d => d.ano))
        .range([margem.left, largura - margem.right])
        .padding(0.2);

    const escalaY = d3.scaleLinear()
        .domain([0, d3.max(dados, d => d.total) * 1.1])
        .range([altura - margem.bottom, margem.top]);

    svg.append("g")
        .attr("transform", `translate(0,${altura - margem.bottom})`)
        .call(d3.axisBottom(escalaX).tickValues(escalaX.domain().filter((d,i) => !(i%2))));

    svg.append("g")
        .attr("transform", `translate(${margem.left},0)`)
        .call(d3.axisLeft(escalaY).ticks(5).tickFormat(d3.format(".2s")));

    // Linha Média
    svg.append("line")
        .attr("x1", margem.left)
        .attr("x2", largura - margem.right)
        .attr("y1", escalaY(media))
        .attr("y2", escalaY(media))
        .attr("stroke", "red").attr("stroke-dasharray", "4");

    // Barras
    svg.selectAll("rect")
        .data(dados)
        .enter()
        .append("rect")
        .attr("x", d => escalaX(d.ano))
        .attr("y", d => escalaY(d.total))
        .attr("width", escalaX.bandwidth())
        .attr("height", d => (altura - margem.bottom) - escalaY(d.total))
        .attr("fill", d => d.total > media ? "#ffab00" : "#4682b4");
        
    svg.append("text")
        .attr("x", largura/2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Tendência vs Média");
}

function renderGraficoSeveridadeLocal(dados, htmlElement) {
    const containerId = d3.select(htmlElement);
    containerId.html("");

    if(!dados || dados.length === 0) {
        containerId.html("<p>Sem dados para exibir.</p>");
        return;
    }

    const largura = 600, altura = 300;
    const margem = { top: 30, right: 50, bottom: 20, left: 120 };

    const svg = containerId.append("svg")
        .attr("viewBox", `0 0 ${largura} ${altura}`)
        .style("width", "100%")
        .style("height", "auto");

    const escalaY = d3.scaleBand()
        .domain(dados.map(d => d.distrito))
        .range([margem.top, altura - margem.bottom])
        .padding(0.3);

    const escalaX = d3.scaleLinear()
        .domain([0, d3.max(dados, d => d.vitimas)])
        .range([margem.left, largura - margem.right]);

    svg.append("g")
        .attr("transform", `translate(${margem.left},0)`)
        .call(d3.axisLeft(escalaY));

    svg.append("g")
        .attr("transform", `translate(0,${margem.top})`)
        .call(d3.axisTop(escalaX).ticks(5));

    svg.selectAll("rect")
        .data(dados)
        .enter()
        .append("rect")
        .attr("x", margem.left)
        .attr("y", d => escalaY(d.distrito))
        .attr("width", d => escalaX(d.vitimas) - margem.left)
        .attr("height", escalaY.bandwidth())
        .attr("fill", "#d95f02");
        
    svg.append("text")
        .attr("x", largura/2)
        .attr("y", altura - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Vítimas por Distrito");
}