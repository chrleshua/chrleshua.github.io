const svg = d3.select("svg");
const width = +svg.attr("width") - 150;
const height = +svg.attr("height") - 100;
const margin = { top: 50, right: 50, bottom: 50, left: 150 };

const teamColors = {
    "McLaren": "#FF8700",
    "Mercedes": "#00D2BE",
    "Red Bull": "#1E41FF",
    "Ferrari": "#DC0000",
    "Aston Martin": "#006F62",
    "Alpine": "#0090FF",
    "Williams": "#005AFF",
    "RB": "#6692FF",
    "Kick Sauber": "#00E701",
    "Haas": "#FFFFFF",
  };

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
const tooltip = d3.select(".tooltip");

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().range([0, height]).padding(0.2);
const color = d3.scaleOrdinal(d3.schemeCategory10);

let allData = [];
let races = [];
let currentView = "finish";

// Create new SVG for pit lane view
const pitSvg = d3.select("#pitlane-svg");
const pitMargin = { top: 50, right: 50, bottom: 50, left: 150 };
const pitHeight = +pitSvg.attr("height") - pitMargin.top - pitMargin.bottom;
const pitG = pitSvg.append("g").attr("transform", `translate(${pitMargin.left},${pitMargin.top})`);

d3.csv("data/f1db.csv", d => ({
    year: +d.year,
    round: +d.round,
    raceId: +d.raceId,
    raceName: d.raceName,
    driverId: d.driverId,
    driverName: d.driverName,
    nationality: d.nationality,
    constructorId: d.constructorId,
    constructorName: d.constructorName,
    grid: +d.grid,
    positionOrder: +d.positionOrder,
    points: +d.points,
    laps: +d.laps,
    fastestLapTime: d.fastestLapTime,
    pitStops: +d.pitStops,
    avgLapTime_ms: +d.avgLapTime_ms
})).then(data => {
    allData = data;

    races = Array.from(new Set(data.map(d => d.raceName)));

    const select = d3.select("#raceSelect");
    select.selectAll("option")
        .data(races)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    updateRace(races[0]);

    select.on("change", () => updateRace(select.property("value")));
    d3.select("#toggleView").on("click", () => {
        currentView = currentView === "finish" ? "grid" : "finish";
        updateRace(select.property("value"), true);
    });
});

function updateRace(raceName, skipAnimation = false) {
    const raceData = allData.filter(d => d.raceName === raceName)
        .sort((a, b) => a.grid - b.grid);

    x.domain([1, d3.max(raceData, d => d.positionOrder)]);
    y.domain(raceData.map(d => d.driverName));

    g.selectAll("*").remove();

    // --- GRID → FINISH VIEW ---
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(20).tickFormat(d3.format("d")))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "#fff")
        .attr("text-anchor", "middle")
        .text(currentView === "finish" ? "Race Finish Position" : "Grid Position");

    g.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -120)
        .attr("fill", "#fff")
        .attr("text-anchor", "middle")
        .text("Driver");

    // grid/pos line
    g.selectAll(".line")
        .data(raceData)
        .enter()
        .append("line")
        .attr("class", "line")
        .attr("x1", d => x(d.grid))
        .attr("y1", d => y(d.driverName) + y.bandwidth() / 2)
        .attr("x2", d => currentView === "finish" ? x(d.grid) : x(d.positionOrder))
        .attr("y2", d => y(d.driverName) + y.bandwidth() / 2)
        .attr("stroke", "#ff0000")
        .attr("stroke-width", 1)
        .attr("opacity", 0.5);

    // og place dot
    g.selectAll(".gridDot")
        .data(raceData)
        .enter()
        .append("circle")
        .attr("class", "gridDot")
        .attr("cx", d => x(d.grid))
        .attr("cy", d => y(d.driverName) + y.bandwidth() / 2)
        .attr("r", 5)
        .attr("fill", "#fff")
        .attr("opacity", 0.7);

    // transition
    const circles = g.selectAll(".driverCircle")
        .data(raceData)
        .enter()
        .append("circle")
        .attr("class", "driverCircle")
        .attr("cx", d => currentView === "finish" ? x(d.grid) : x(d.positionOrder))
        .attr("cy", d => y(d.driverName) + y.bandwidth() / 2)
        .attr("r", 12)
        .attr("fill", d => color(d.constructorId))
        .attr("opacity", 0.8)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong>${d.driverName}</strong><br/>
                Constructor: ${d.constructorName}<br/>
                Grid: ${d.grid}<br/>
                Finish: ${d.positionOrder}<br/>
                Pit Stops: ${d.pitStops}<br/>
                Points: ${d.points}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(200).style("opacity", 0);
        });

    if (!skipAnimation) {
        circles.transition()
            .duration(5000)
            .attr("cx", d => currentView === "finish" ? x(d.positionOrder) : x(d.grid))
            .on("end", function () {
                const top10 = raceData.filter(d => d.positionOrder <= 10).map(d => d.driverName);
                d3.select(this)
                    .attr("class", d => top10.includes(d.driverName) ? "top10" : "")
                    .attr("opacity", d => top10.includes(d.driverName) ? 1 : 0.3);
            });
    }

    pitG.selectAll("*").remove();

    const teams = Array.from(d3.group(raceData, d => d.constructorName),
        ([constructorName, drivers]) => ({ constructorName, drivers }));

    const teamSpacing = 180;
    const totalWidth = teams.length * teamSpacing;
    pitSvg.attr("width", totalWidth + pitMargin.left + pitMargin.right);

    const pitLane = pitG.append("g")
        .attr("class", "pit-lane")
        .attr("transform", `translate(0,${pitHeight/2})`);

    const teamGroups = pitLane.selectAll(".team")
        .data(teams)
        .enter()
        .append("g")
        .attr("class", "team")
        .attr("transform", (d,i) => `translate(${i*teamSpacing},0)`)
        .on("mouseover", (event,d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong>${d.constructorName}</strong><br/>
                ${d.drivers.map(dr => `${dr.driverName}: ${dr.pitStops} pit stops, avg lap ${dr.avgLapTime_ms.toFixed(0)} ms`).join("<br/>")}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(200).style("opacity", 0);
        });

    teamGroups.append("rect")
        .attr("x", -50).attr("y", -30)
        .attr("width", 100).attr("height", 60)
        .attr("fill", d => color(d.constructorName))
        .attr("rx", 10).attr("ry", 10)
        .attr("opacity", 0.85);


    teamGroups.append("text")
        .text(d => d.constructorName)
        .attr("y", 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .style("font-weight", "bold");
}

document.querySelectorAll(".feature-card").forEach(card => {
    card.addEventListener("click", () => {
      const targetId = card.id.replace("btn-", "") + "-section";
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  
