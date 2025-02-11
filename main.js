// Set dimensions for the SVG container
const width = 800;
const height = 400;

// Select the SVG element and set attributes
const svg = d3.select("#chart")
    .attr("width", width)
    .attr("height", height);

// Example dataset
const dataset = [
    { x: 50, y: 300 },
    { x: 150, y: 200 },
    { x: 250, y: 250 },
    { x: 350, y: 150 },
    { x: 450, y: 100 }
];

// Create circles for each data point
svg.selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 10)
    .attr("fill", "steelblue");

// Tooltip interaction (hover effect)
svg.selectAll("circle")
    .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", "orange");
    })
    .on("mouseout", function(event, d) {
        d3.select(this).attr("fill", "steelblue");
    });
