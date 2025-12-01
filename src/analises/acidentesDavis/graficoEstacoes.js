import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Função para desenhar o gráfico de estações
export function renderGraficoEstacoes(dados, elementoId) {
    // 1. Limpar gráfico anterior
    const container = d3.select(elementoId);
    container.html(""); 

    if (dados.length === 0) {
        container.append("p").text("Sem dados para este período/filtro.");
        return;
    }

    // 2. Definir dimensões
    const largura = 500;
    const altura = 300;
    const margem = { top: 30, right: 30, bottom: 50, left: 60 };

    // 3. Criar o SVG (o "quadro" do desenho)
    const svg = container.append("svg")
        .attr("width", largura)
        .attr("height", altura)
        .style("background", "#f9f9f9")
        .style("border-radius", "8px");

    // 4. Criar as Escalas (converter valores em pixels)
    // Eixo X: Estações do ano
    const escalaX = d3.scaleBand()
        .domain(dados.map(d => d.estacao)) // ["Inverno", "Primavera", etc.]
        .range([margem.left, largura - margem.right])
        .padding(0.4);

    // Eixo Y: Quantidade de acidentes
    const maxAcidentes = d3.max(dados, d => d.total);
    const escalaY = d3.scaleLinear()
        .domain([0, maxAcidentes])
        .range([altura - margem.bottom, margem.top]);

    // 5. Desenhar os Eixos
    // Eixo X
    svg.append("g")
        .attr("transform", `translate(0,${altura - margem.bottom})`)
        .call(d3.axisBottom(escalaX));

    // Eixo Y
    svg.append("g")
        .attr("transform", `translate(${margem.left},0)`)
        .call(d3.axisLeft(escalaY));

    // 6. Desenhar as Barras
    svg.selectAll("rect")
        .data(dados)
        .enter()
        .append("rect")
        .attr("x", d => escalaX(d.estacao))
        .attr("y", d => escalaY(d.total))
        .attr("width", escalaX.bandwidth())
        .attr("height", d => (altura - margem.bottom) - escalaY(d.total))
        .attr("fill", "#69b3a2") // Cor das barras
        .on("mouseover", function() { d3.select(this).attr("fill", "#4e8a7c"); }) // Efeito simples ao passar o mouse
        .on("mouseout", function() { d3.select(this).attr("fill", "#69b3a2"); });

    // 7. Título
    svg.append("text")
        .attr("x", largura / 2)
        .attr("y", margem.top / 1.5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Acidentes por Estação do Ano");
}