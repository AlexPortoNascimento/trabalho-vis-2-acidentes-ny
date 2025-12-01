import { analiseHora } from './analises/acidentesAlexandre';
import { montarBoxplot } from './analises/acidentesAlexandre/boxplot';
import { carregarDadosLinha, montarGraficoLinha } from './analises/acidentesAlexandre/linha';
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

        const { severidadePorHora } = await analiseHora(crash, horaSelecionada);

        console.log("Severidade para boxplot:", severidadePorHora);
    });

    const { severidadePorHora } = await analiseHora(crash, 0);
    montarBoxplot(severidadePorHora)

}