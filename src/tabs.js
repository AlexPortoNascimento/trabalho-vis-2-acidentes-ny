import { acidentesPorDistrito } from "./analises/acidentesPorDistrito";
import { acidentesPorHorarioQuery } from "./analises/acidentesPorHorarioQuery";

export function setupTabs() {
    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".tab-panel");

    tabs.forEach(tab => {
        tab.addEventListener("click", async () => {
            tabs.forEach(t => t.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(tab.dataset.target).classList.add("active");

            switch (tab.dataset.target) {

                case "tab-alexandre":
                    await acidentesPorHorarioQuery(crash, "analise-alexandre");
                    break;

                case "tab-davis":
                    await acidentesPorDistrito(crash, "analise-davis");
                    break;

                case "tab-mainoth":
                    await acidentesPorHorarioQuery(crash, "analise-mainoth");
                    break;

                case "tab-matheus":
                    await acidentesPorDistrito(crash, "analise-matheus");
                    break;

                default:
                    console.warn("Nenhuma análise definida para esta aba:", tab.dataset.target);
            }            
        });
    });
}
