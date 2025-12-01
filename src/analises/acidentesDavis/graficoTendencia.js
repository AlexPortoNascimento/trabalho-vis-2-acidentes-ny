import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function renderGraficoTendencia(dados, elementoId) {
    const container = d3.select(elementoId);
    container.html("");

    const largura = 500;
    const altura = 300;
    const margem = { top: 30, right: 30, bottom: 50, left: 60 };

    const svg = container.append("svg")
        .attr("width", largura)
        .attr("height", altura)
        .style("background", "#f9f9f9")
        .style("border-radius", "8px");

    // Calcular a Média Geral
    const totalGeral = d3.sum(dados, d => d.total);
    const media = totalGeral / dados.length;

    // Escalas
    const escalaX = d3.scaleBand()
        .domain(dados.map(d => d.ano))
        .range([margem.left, largura - margem.right])
        .padding(0.2);

    const escalaY = d3.scaleLinear()
        .domain([0, d3.max(dados, d => d.total) * 1.1]) // * 1.1 dá um respiro no topo
        .range([altura - margem.bottom, margem.top]);

    // Eixos
    svg.append("g")
        .attr("transform", `translate(0,${altura - margem.bottom})`)
        .call(d3.axisBottom(escalaX).tickFormat(d3.format("d"))); // Remove vírgula de milhar do ano

    svg.append("g")
        .attr("transform", `translate(${margem.left},0)`)
        .call(d3.axisLeft(escalaY));

    // Linha de Média (Pontilhada)
    svg.append("line")
        .attr("x1", margem.left)
        .attr("x2", largura - margem.right)
        .attr("y1", escalaY(media))
        .attr("y2", escalaY(media))
        .attr("stroke", "red")
        .attr("stroke-dasharray", "5,5") // Faz a linha pontilhada
        .attr("stroke-width", 2);
    
    // Texto da Média
    svg.append("text")
        .attr("x", largura - margem.right - 10)
        .attr("y", escalaY(media) - 5)
        .attr("text-anchor", "end")
        .attr("fill", "red")
        .style("font-size", "10px")
        .text(`Média: ${Math.round(media)}`);

    // Barras (Cor muda se estiver acima ou abaixo da média)
    svg.selectAll("rect")
        .data(dados)
        .enter()
        .append("rect")
        .attr("x", d => escalaX(d.ano))
        .attr("y", d => escalaY(d.total))
        .attr("width", escalaX.bandwidth())
        .attr("height", d => (altura - margem.bottom) - escalaY(d.total))
        .attr("fill", d => d.total > media ? "#ffab00" : "#4682b4") // Laranja se acima, Azul se abaixo
        .append("title") // Tooltip nativo simples
        .text(d => `Ano: ${d.ano}\nTotal: ${d.total}`);

    // Título
    svg.append("text")
        .attr("x", largura / 2)
        .attr("y", margem.top / 1.5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Tendência Anual vs Média");
}