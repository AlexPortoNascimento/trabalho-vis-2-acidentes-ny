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

	const { width, height } = container.node().getBoundingClientRect();

	const margins = { top: 10, right: 20, bottom: 30, left: 50 };

	//Cria o svg
	const svg = container
		.append("svg")
    	.attr("width", "100%")
    	.attr("height", "100%");

	//Escalas
	const xScale = d3.scaleLinear()
		.domain([0,23])
		.range([margins.left, width - margins.right]);

	const yScale = d3.scaleLinear()
		.domain([0, d3.max(dados, d => d.total)])
		.range([height - margins.bottom, margins.top]);
	
	//Eixos
	svg.append("g")
		.attr("transform", `translate(0, ${height - margins.bottom})`)
		.call(
			d3.axisBottom(xScale)
			.ticks(24)
			.tickFormat(d => `${d}h`)
		);
	
	svg.append("g")
		.attr("transform", `translate(${margins.left}, 0)`)
		.call(
			d3.axisLeft(yScale)
			.ticks(6)
		);
	
	//Linha
	const line = d3.line()
		.x(d => xScale(d.hora))
		.y(d => yScale(d.total));
	
	svg.append("path")
		.datum(dados)
		.attr("fill", "none")
		.attr("stroke", "#C0392B")
		.attr("stroke-width", 3)
		.attr("d", line);

	//Seletor
	const larguraHora = xScale(1) - xScale(0);

	let horaAtual = 0;

	const seletor = svg.append("rect")
		.attr("x", xScale(horaAtual))
		.attr("y", margins.top)
		.attr("width", larguraHora)
		.attr("height", height - margins.top - margins.bottom)
		.attr("fill", "rgba(255, 0, 0, 0.15)")
		.attr("stroke", "black")
		.attr("stroke-width", 1)
		.style("cursor", "grab");
	
	function onHourChange(h) {
  		console.log("Hora selecionada:", h);
  		// aqui você chama os outros gráficos
	}

	// Função de drag
	const drag = d3.drag()
	.on("start", () => {
		seletor.style("cursor", "grabbing");
	})
	.on("drag", (event) => {
		let x = event.x;
		
		const min = margins.left;
		const max = width - margins.right - larguraHora;
		
		x = Math.max(min, Math.min(max, x));
		seletor.attr("x", x);
	})
	.on("end", () => {
		seletor.style("cursor", "grab");

		const x = parseFloat(seletor.attr("x"));
		const hora = Math.round(xScale.invert(x));

		horaAtual = Math.max(0, Math.min(23, hora));

		seletor.attr("x", xScale(horaAtual));

		onHourChange(horaAtual);
	});

	seletor.call(drag);


  return svg;


}

