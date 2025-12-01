import * as d3 from "d3";
import { analiseHora } from ".";

export async function carregarDadosTreemap(crash, hora) {
    const { tiposVeiculo } = await analiseHora(crash, hora);

    // Normaliza automaticamente: ignora maiúsculas/minúsculas e espaços
    const dadosNormalizados = tiposVeiculo.reduce((acc, d) => {
        const total = d.total[0];
        if (!total || total <= 0) return acc;

        const tipoChave = d.tipo.trim().toLowerCase();

        if (acc[tipoChave]) {
            acc[tipoChave].total += total;
        } else {
            acc[tipoChave] = { tipo: tipoChave, total };
        }

        return acc;
    }, {});

    // Converter para array e capitalizar a primeira letra
    const agrupado = Object.values(dadosNormalizados).map(d => ({
        tipo: d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1),
        total: d.total
    }));

    // Pega os 10 maiores
    const top10 = agrupado
        .sort((a, b) => b.total - a.total)
        .slice(0, 9);

    console.log("Top 10 tipos de veículo:", top10);

    return top10;
}

export function montarTreemap(dados) {
  const container = d3.select("#vis-treemap");
  container.selectAll("*").remove();

  const { width, height } = container.node().getBoundingClientRect();

  const margins = { top: 20, right: 20, bottom: 30, left: 20 };

  const svg = container.append("svg")
      .attr("width", "100%")
      .attr("height", "100%");


  // Cria a hierarquia e calcula o layout
  const raiz = d3.hierarchy({children: dados})
      .sum(d => d.total)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
        .size([width - margins.left - margins.right, height - margins.top - margins.bottom])
        .padding(2)
        (raiz);

  const colors = d3.scaleOrdinal(d3.schemeReds[9]);

  const group = svg.append("g")
      .attr("transform", `translate(${margins.left}, ${margins.top})`);

  // Adiciona os retângulos
  const nodes = group.selectAll("g")
      .data(raiz.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0}, ${d.y0})`);

  nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", (d, i) => colors(i));

  // Adiciona os rótulos
  nodes.append("text")
      .attr("x", 4)
      .attr("y", 14)
      .text(d => `${d.data.tipo}`)
      .attr("font-size", "14px")
      .attr("fill", "#333")
      .attr("font-weight", "bold");

  // Legenda opcional: Tamanho proporcional ao total
  svg.append("text")
      .attr("x", width / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "#333")
      .text("Tipos de veículo por hora");
    


  return svg;
}
