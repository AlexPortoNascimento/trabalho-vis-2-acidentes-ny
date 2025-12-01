import { analiseHora } from './analises/acidentesAlexandre';
import { carregarDadosBoxplot, montarBoxplot } from './analises/acidentesAlexandre/boxplot';
import { carregarDadosLinha, montarGraficoLinha } from './analises/acidentesAlexandre/linha';
import { carregarDadosTreemap, montarTreemap } from './analises/acidentesAlexandre/treemap';
import { Crash } from './crash';
import { setupTabs } from './tabs.js/';


window.onload = async () => {
    const crash = new Crash("Motor_Vehicle_Collisions_-_Crashes.csv");
    await crash.init();
    await crash.loadCrash();

    window.crash = crash;
    window.q = (sql) => crash.query(sql);

    setupTabs(crash);

    const dadosLinha = await carregarDadosLinha(crash);

    montarGraficoLinha(dadosLinha, async (horaSelecionada) => {
        console.log("Atualizando gráficos para hora: ", horaSelecionada);

        const dadosBoxplot = await carregarDadosBoxplot(crash, horaSelecionada);

        console.log("Severidade para boxplot:", severidadePorHora);

        // Carrega dados processados para o treemap
        const dadosTreemap = await carregarDadosTreemap(crash, horaSelecionada);
        console.log("Dados para treemap:", dadosTreemap);

        montarBoxplot(dadosBoxplot);
        montarTreemap(dadosTreemap);
    });


    const dadosBoxplot = await carregarDadosBoxplot(crash, 0);
    montarBoxplot(dadosBoxplot);

    const dadosTreemap = await carregarDadosTreemap(crash, 0);
    montarTreemap(dadosTreemap);

}