import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function renderGraficoSeveridade(dados, elementoId) {
    const container = d3.select(elementoId);
    container.html("");

    const largura = 500;
    const altura = 300;
    const margem = { top: 30, right: 30, bottom: 20, left: 100 }; // Margem esquerda maior para nomes dos distritos

    const svg = container.append("svg")
        .attr("width", largura)
        .attr("height", altura)
        .style("background", "#f9f9f9")
        .style("border-radius", "8px");

    // Escalas (Invertidas para gráfico horizontal)
    const escalaY = d3.scaleBand()
        .domain(dados.map(d => d.distrito))
        .range([margem.top, altura - margem.bottom])
        .padding(0.3);

    const escalaX = d3.scaleLinear()
        .domain([0, d3.max(dados, d => d.vitimas)])
        .range([margem.left, largura - margem.right]);

    // Eixos
    svg.append("g")
        .attr("transform", `translate(${margem.left},0)`)
        .call(d3.axisLeft(escalaY));

    svg.append("g")
        .attr("transform", `translate(0,${margem.top})`)
        .call(d3.axisTop(escalaX).ticks(5));

    // Barras Horizontais
    svg.selectAll("rect")
        .data(dados)
        .enter()
        .append("rect")
        .attr("x", margem.left)
        .attr("y", d => escalaY(d.distrito))
        .attr("width", d => escalaX(d.vitimas) - margem.left)
        .attr("height", escalaY.bandwidth())
        .attr("fill", "#d95f02");

    // Rótulos de valor na ponta da barra
    svg.selectAll(".label")
        .data(dados)
        .enter()
        .append("text")
        .attr("x", d => escalaX(d.vitimas) + 5)
        .attr("y", d => escalaY(d.distrito) + escalaY.bandwidth() / 2 + 4)
        .text(d => d.vitimas)
        .style("font-size", "10px")
        .attr("fill", "black");

    // Título
    svg.append("text")
        .attr("x", largura / 2)
        .attr("y", altura - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Severidade (Feridos + Mortos) por Distrito");
}