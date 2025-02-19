const files = ["als1.csv", "hunt2.csv","control1.csv", "park3.csv"];
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

const colorMapping = {
    "als1.csv": "#1f77b4",    // blue
    "hunt2.csv": "#ff7f0e",   // orange
    "control1.csv": "#2ca02c", // green
    "park3.csv": "#d62728"     // red
};


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

    const width = 1000;
    const height = 500;
    const margin = { top: 50, right: 150, bottom: 70, left: 80 };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.right - margin.left)
        .attr("height", height - margin.top - margin.bottom);

    const g = svg.append("g");

    const xAxisGroup = g.append("g").attr("class", "x-axis");
    const yAxisGroup = g.append("g").attr("class", "y-axis");
    const dataGroup = g.append("g")
        .attr("clip-path", "url(#clip)");

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

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    let currentTransform = d3.zoomIdentity;

    function zoomed(event) {
        currentTransform = event.transform;
        
        const newXScale = currentTransform.rescaleX(xScale);
        const newYScale = currentTransform.rescaleY(yScale);

        xAxisGroup.attr("transform", `translate(0,${height - margin.bottom})`)
            .call(xAxis.scale(newXScale));
        yAxisGroup.attr("transform", `translate(${margin.left},0)`)
            .call(yAxis.scale(newYScale));

        paths.forEach(path => {
            const data = path.datum();
            const line = d3.line()
                .x(d => newXScale(d.Elapsed_Time))
                .y(d => newYScale(d.Left_Stride_Interval))
                .curve(d3.curveLinear);

            path.attr("d", line(data));
            
            const totalLength = path.node().getTotalLength();
            const progress = timelineSlider.value / 100;
            const offset = progress * totalLength;
            
            path.attr("stroke-dasharray", `${totalLength} ${totalLength}`)
                .attr("stroke-dashoffset", totalLength - offset);
        });
    }

    zoom = d3.zoom()
        .scaleExtent([1, 20])
        .translateExtent([
            [margin.left, margin.top],
            [width - margin.right, height - margin.bottom]
        ])
        .extent([
            [margin.left, margin.top],
            [width - margin.right, height - margin.bottom]
        ])
        .on("zoom", zoomed);

    svg.call(zoom);

    zoom = d3.zoom()
        .scaleExtent([1, 20])
        .translateExtent([
            [margin.left, margin.top],
            [width - margin.right, height - margin.bottom]
        ])
        .extent([
            [margin.left, margin.top],
            [width - margin.right, height - margin.bottom]
        ])
        .on("zoom", zoomed);

    svg.call(zoom);

    // const color = d3.scaleOrdinal(d3.schemeCategory10).domain(files);

    const tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")

    const fileToGroup = {
        "als1.csv": "ALS (Amyotrophic Lateral Sclerosis)",
        "hunt2.csv": "Huntington's Disease",
        "control1.csv": "Control (Healthy)",
        "park3.csv": "Parkinson's Disease"
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

    g.selectAll(".x-gridline")
    .data(xScale.ticks())
    .enter().append("line")
    .attr("class", "x-gridline")
    .attr("x1", d => xScale(d))
    .attr("x2", d => xScale(d))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "lightgray")
    .attr("stroke-dasharray", "2,2");

    g.selectAll(".y-gridline")
        .data(yScale.ticks())
        .enter().append("line")
        .attr("class", "y-gridline")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "lightgray")
        .attr("stroke-dasharray", "2,2");
    const pathsByFile = {};
    paths = files.map(file => {
        const line = d3.line()
            .x(d => xScale(d.Elapsed_Time))
            .y(d => yScale(d.Left_Stride_Interval))
            .curve(d3.curveLinear);

        const path = dataGroup.append("path")
            .datum(allData[file])
            .attr("fill", "none")
            .attr("stroke", colorMapping[file])
            .attr("stroke-width", 2)
            .attr("d", line)
            .attr("data-file", file)
            .on("mousemove", function(event) {
                const [x] = d3.pointer(event);
                const xValue = currentTransform.rescaleX(xScale).invert(x + margin.left);
                const closestData = allData[file].reduce((prev, curr) => 
                    Math.abs(curr.Elapsed_Time - xValue) < Math.abs(prev.Elapsed_Time - xValue) ? curr : prev
                );
                
                updateTooltipContent(closestData, colorMapping[file], file);
                updateTooltipVisibility(true);
                updateTooltipPosition(event);
            })
            .on("mouseout", () => updateTooltipVisibility(false));

        const length = path.node().getTotalLength();
        path.attr("stroke-dasharray", `${length} ${length}`)
            .attr("stroke-dashoffset", length);
        pathsByFile[file] = path;
        return path;
    });

    xAxisGroup.attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis);

    yAxisGroup.attr("transform", `translate(${margin.left},0)`)
        .call(yAxis);

    g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Elapsed Time (seconds)");

    g.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -height / 2)
        .attr("y", 20)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("transform", "rotate(-90deg)")
        .text("Left Stride Interval (seconds)");

    const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    legend.append("text")
    .attr("x", 0)
    .attr("y", -10) 
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .text("Click Below to Filter by Groups");

    let visibilityState = Object.fromEntries(files.map(file => [file, true]));

    files.forEach((file, index) => {
        visibilityState[file] = true; 

    const legendRow = legend.append("g")
    .attr("transform", `translate(0, ${index * 20})`)
    .style("cursor", "pointer")
    .on("click", function() {
        visibilityState[file] = !visibilityState[file];
        const path = pathsByFile[file];
        path.style("display", visibilityState[file] ? null : "none");
        legendText.style("opacity", visibilityState[file] ? 1 : 0.5);
        d3.select(this).select("rect")

            .style("opacity", visibilityState[file] ? 1 : 0.5);

    });

    legendRow.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorMapping[file]);

    const legendText = legendRow.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(fileToGroup[file])
        .attr("font-size", "10px")
        .attr("fill", "black");
    });

    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.addEventListener('click', toggleAnimation);

    d3.select(".controls").append("button")
        .attr("id", "resetZoomBtn")
        .text("Reset Zoom")
        .on("click", () => {
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        });
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





