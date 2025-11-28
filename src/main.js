import { Crash } from './crash';
import { acidentesPorDestrito } from './analises/acidentesPorDestrito';
import { acidentesPorHorario } from './analises/acidentesPorHorario';

window.onload = async () => {
    const crash = new Crash("Motor_Vehicle_Collisions_-_Crashes.csv");
    await crash.init();

    await crash.loadCrash();

    window.crash = crash;
    window.q = (sql) => crash.query(sql);

    document.getElementById("btn-destrito").onclick = () => acidentesPorDestrito(crash);
    document.getElementById("btn-horario").onclick = () => acidentesPorHorario(crash);

}