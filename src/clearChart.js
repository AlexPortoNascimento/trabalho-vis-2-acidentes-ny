export function clearChart() {
    const svg = d3.select('svg');
    svg.selectAll('*').remove();
}