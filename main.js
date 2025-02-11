const files = ["als1.csv", "control1.csv", "hunt1.csv", "park1.csv"];
const folder = "csv_files/";

let allData = {};

// Loading Data
Promise.all(
    files.map(file =>
        d3.csv(`${folder}${file}`, d3.autoType).then(data => {
            allData[file] = data;
        }).catch(error => console.error(`Error loading ${file}:`, error))
    )
).then(() => {
    console.log("All data loaded", allData);
    drawLineChart();
});

function drawLineChart() {
    d3.select("#chart").html("");

    const width = 800;
    const height = 500;
    const margin = { top: 50, right: 150, bottom: 70, left: 80 };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const xScale = d3.scaleLinear()
        .domain([
            d3.min(Object.values(allData), d => d3.min(d, v => v.Elapsed_Time)),
            d3.max(Object.values(allData), d => d3.max(d, v => v.Elapsed_Time))
        ])
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([
            d3.min(Object.values(allData), d => d3.min(d, v => v.Left_Stride_Interval)),
            d3.max(Object.values(allData), d => d3.max(d, v => v.Left_Stride_Interval))
        ])
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(files);

    // Draw line for each data
    Object.keys(allData).forEach((file, index) => {
        const line = d3.line()
            .x(d => xScale(d.Elapsed_Time))
            .y(d => yScale(d.Left_Stride_Interval));

        svg.append("path")
            .datum(allData[file])
            .attr("fill", "none")
            .attr("stroke", color(file))
            .attr("stroke-width", 2)
            .attr("d", line);
    });

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    // X-axis
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Elapsed Time (seconds)");

    // Y-axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Left Stride Interval (seconds)");

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 120}, 50)`);

    files.forEach((file, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 25)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", color(file));

        legend.append("text")
            .attr("x", 30)
            .attr("y", i * 25 + 15)
            .text(file)
            .attr("alignment-baseline", "middle");
    });
}
