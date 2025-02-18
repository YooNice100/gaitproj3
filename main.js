const files = ["als1.csv", "control1.csv", "hunt1.csv", "park1.csv"];
const folder = "csv_files/";

let allData = {};
let animationRunning = false;
let paths = [];
let elapsedTimeMetric = document.getElementById("elapsedTimeMetric");
let animationStartTime = 0;
let animationDuration = 7000;
let startTime = 0;
let elapsedPausedTime = 0;
const timelineSlider = document.getElementById("timelineSlider");
let zoom;

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

function updateSliderPosition(progress) {
    const elapsedMin = d3.min(Object.values(allData), d => d3.min(d, v => v.Elapsed_Time));
    const elapsedMax = d3.max(Object.values(allData), d => d3.max(d, v => v.Elapsed_Time));

    timelineSlider.value = progress * 100;

    const currentTime = elapsedMin + progress * (elapsedMax - elapsedMin);
    elapsedTimeMetric.textContent = currentTime.toFixed(2) + "s";

    paths.forEach(path => {
        const totalLength = path.node().getTotalLength();
        const offset = progress * totalLength;
        path.attr("stroke-dashoffset", totalLength - offset);
    });
}

function manualSliderUpdate() {
    const progress = timelineSlider.value / 100;
    updateSliderPosition(progress);
}

function drawLineChart() {
    d3.select("#chart").html("");

    const width = 800;
    const height = 500;
    const margin = { top: 50, right: 150, bottom: 70, left: 80 };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g");

    zoom = d3.zoom()
        .scaleExtent([1, 10]) 
        .translateExtent([[0, 0], [width, height]]) 
        .on("zoom", zoomed);

    svg.call(zoom);

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

    const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "lightgray")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("display", "none");

    const fileToGroup = {
      "als1.csv": "ALS",
      "control1.csv": "Control",
      "hunt1.csv": "Huntington",
      "park1.csv": "Parkinson"
    };

    function updateTooltipVisibility(isVisible) {
        tooltip.style("display", isVisible ? "block" : "none");
    }

    function updateTooltipPosition(event) {
        tooltip.style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
    }

    function updateTooltipContent(d, lineColor, file) {
      const group = fileToGroup[file] || "Unknown";
      tooltip.html(`Group: ${group}<br>Elapsed Time: ${d.Elapsed_Time}<br>Left Stride Interval: ${d.Left_Stride_Interval}`)
        .style("background", lineColor);
    }

    paths = Object.keys(allData).map(file => {
        const line = d3.line()
            .x(d => xScale(d.Elapsed_Time))
            .y(d => yScale(d.Left_Stride_Interval));

        const path = g.append("path")
            .datum(allData[file])
            .attr("fill", "none")
            .attr("stroke", color(file))
            .attr("stroke-width", 2)
            .attr("d", line)
            .on("mousemove", function(event) {
                const [x] = d3.pointer(event, this);
                const closestData = allData[file].reduce((prev, curr) => 
                    Math.abs(xScale(curr.Elapsed_Time) - x) < Math.abs(xScale(prev.Elapsed_Time) - x) ? curr : prev
                );
                const lineColor = color(file);
                updateTooltipContent(closestData, lineColor, file);
                updateTooltipVisibility(true);
                updateTooltipPosition(event);
            })
            .on("mouseout", () => updateTooltipVisibility(false));

        const length = path.node().getTotalLength();
        path.attr("stroke-dasharray", `${length} ${length}`)
            .attr("stroke-dashoffset", length);

        return path;
    });

    g.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Elapsed Time (s)");

    g.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -height / 2)
        .attr("y", 20)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("transform", "rotate(-90deg)")
        .text("Left Stride Interval (s)");

    const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    files.forEach((file, index) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${index * 20})`);

        legendRow.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(file));

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(file)
            .attr("font-size", "12px")
            .attr("fill", "black");
    });

    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.addEventListener('click', toggleAnimation);

    d3.select(".controls").append("button")
      .attr("id", "resetZoomBtn")
      .text("Reset Zoom")
      .on("click", () => svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity));

  function zoomed(event) {
    g.attr("transform", event.transform);
  }
}

function resetAnimation() {
  timelineSlider.value = 0;
  
  paths.forEach(path => {
      const totalLength = path.node().getTotalLength();
      path.attr("stroke-dashoffset", totalLength);
  });
  
  const elapsedMin = d3.min(Object.values(allData), d => d3.min(d, v => v.Elapsed_Time));
  elapsedTimeMetric.textContent = elapsedMin.toFixed(2) + "s";
  
  elapsedPausedTime = 0;
  startTime = Date.now();
}

function playAnimation() {
  if (timelineSlider.value >= 100) {
      resetAnimation();
  }
  
  if (animationRunning) return;
  animationRunning = true;

  let progress = timelineSlider.value / 100;
  
  startTime = Date.now() - (progress * animationDuration);

  function animate() {
      if (!animationRunning) return;

      const currentTime = Date.now();
      let progress = (currentTime - startTime) / animationDuration;
      
      progress = Math.min(Math.max(progress, 0), 1);
      
      updateSliderPosition(progress);

      if (progress < 1) {
          requestAnimationFrame(animate);
      } else {
          animationRunning = false;
          elapsedPausedTime = 0;
      }
  }

  animate();
}

function pauseAnimation() {
  if (!animationRunning) return;
  animationRunning = false;
  elapsedPausedTime = Date.now() - startTime;
}

function toggleAnimation() {
  if (animationRunning) {
      pauseAnimation();
  } else {
      playAnimation();
  }
}

timelineSlider.addEventListener("input", function() {
  if (animationRunning) {
      pauseAnimation();
  }
  manualSliderUpdate();
});





