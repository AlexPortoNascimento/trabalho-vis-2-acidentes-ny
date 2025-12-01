import * as d3 from "d3";
import { analiseHora } from ".";

export async function carregarDadosBoxplot(crash, hora) {
  const { severidadePorHora } = await analiseHora(crash, hora);

  const severidades = severidadePorHora
    .map(d => {
      if (Array.isArray(d.severidade)) return d.severidade[0];
      return Number(d.severidade);
    })
    .filter(v => !isNaN(v) && v > 0);

  console.log("Dados de severidade para boxplot:", severidades);

  return severidades;
}

export function montarBoxplot(dadosBrutos) {
    const container = d3.select("#vis-boxplot");
    container.selectAll("*").remove();

    const { width, height } = container.node().getBoundingClientRect();

    const margins = { top: 20, right: 20, bottom: 30, left: 50 };


    //Cria o svg
    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    //Define os quartis
    const valores = dadosBrutos.filter(v => !isNaN(v) && v > 0).sort((a, b) => a - b);

 
    if (valores.length === 0) {
        valores.push(0); // ou [0,1] se quiser range
    }

    function q(p) {
        const pos = (valores.length - 1) * p;
        const base = Math.floor(pos);
        const rest = pos - base;
        return valores[base] + (valores[base + 1] - valores[base]) * rest || valores[base];
    }

    const min = d3.min(valores);
    const max = d3.max(valores);
    const q1 = q(0.25);
    const mediana = q(0.5);
    const q3 = q(0.75);

    //Escalas
    const xScale = d3.scaleBand()
        .domain(["box"])
        .range([margins.left, width - margins.right])
        .paddingInner(0.4);
    
    const p95 = d3.quantile(valores, 0.95);

    const yScale = d3.scaleLinear()
        .domain([0, p95])
        .range([height - margins.bottom, margins.top]);

    
    //Eixos
    svg.append("g")
        .attr("transform", `translate(0, ${height - margins.bottom})`)
        .call(
        d3.axisBottom(xScale)
        .tickSize(0)
        .tickFormat(() => "")
        );

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .text("Distribuição de severidade");

    svg.append("g")
        .attr("transform", `translate(${margins.left}, 0)`)
        .call(d3.axisLeft(yScale).ticks(6));

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", 20)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Severidade");

    // Boxplot
    const boxWidth = xScale.bandwidth();

    // Linha vertical (min-max)
    svg.append("line")
        .attr("x1", xScale("box") + boxWidth / 2)
        .attr("x2", xScale("box") + boxWidth / 2)
        .attr("y1", yScale(min))
        .attr("y2", yScale(max))
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    // Retângulo do box (Q1-Q3)
    svg.append("rect")
        .attr("x", xScale("box"))
        .attr("y", yScale(q3))
        .attr("width", boxWidth)
        .attr("height", yScale(q1) - yScale(q3))
        .attr("fill", "rgba(192, 57, 43, 0.5)")
        .attr("stroke", "black");

    // Mediana
    svg.append("line")
        .attr("x1", xScale("box"))
        .attr("x2", xScale("box") + boxWidth)
        .attr("y1", yScale(mediana))
        .attr("y2", yScale(mediana))
        .attr("stroke", "black")
        .attr("stroke-width", 2);

    return svg;

}