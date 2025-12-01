import * as d3 from "d3";
import { analiseHora } from ".";

export async function carregarDadosBoxplot(crash, hora) {
  const { severidadePorHora } = await analiseHora(crash, hora);

  // Converte para um array puro de números
  const severidades = severidadePorHora
    .map(d => Number(d.severidade))
    .filter(v => !isNaN(v));

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
    const valores = dadosBrutos.map(d => Number(d.severidade));

    valores.sort((a, b) => a - b);

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

    const yScale = d3.scaleLinear()
        .domain([min, max])
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

    return svg;

}