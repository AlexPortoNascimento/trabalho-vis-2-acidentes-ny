import * as d3 from "d3";
import { analiseInicial } from ".";

export async function carregarDadosLinha(crash) {
	const { acidentesHora } = await analiseInicial(crash);
	
	const dadosConvertidos = acidentesHora.map(d => ({
    hora: Number(d.hora),
    total: Number(d.total)
  }));

	console.log("Dados convertidos para o gráfico de linha:", dadosConvertidos);

	return dadosConvertidos;
}

export function montarGraficoLinha(dados) {

	const container = d3.select("#vis-linha");

	container.selectAll("*").remove();

	const width = 500;
	const height =250;

	const margins = { top: 20, right: 20, bottom: 30, left: 40 };

	//Cria o svg
	const svg = container
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	//Cria as escalas para o gráfico
	const x = d3.scaleTime()
		.domain([0,23])
		.range([margins.left, width - margins.right]);

	const y = d3.scaleLinear()
		.domain([0, d3.max(dados, d => d.total)])
		.range([height - margins.bottom, margins.top]);
	
	// Debug opcional
  console.log("Escala X:", x.domain(), x.range());
  console.log("Escala Y:", y.domain(), y.range());

  return svg;


}

