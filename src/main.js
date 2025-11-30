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

    montarGraficoLinha(dadosLinha);

}