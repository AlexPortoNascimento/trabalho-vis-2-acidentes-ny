import { Crash } from './crash';
import { acidentesPorDistrito } from './analises/acidentesPorDistrito.js';
import { setupTabs } from './tabs.js/';
import { acidentesPorHorarioQuery } from './analises/acidentesPorHorarioQuery.js';

window.onload = async () => {
    const crash = new Crash("Motor_Vehicle_Collisions_-_Crashes.csv");
    await crash.init();
    await crash.loadCrash();

    window.crash = crash;
    window.q = (sql) => crash.query(sql);

    setupTabs(crash)

    await acidentesPorDistrito(crash, "analise-matheus");
    await acidentesPorHorarioQuery(crash, "analise-alexandre");


}