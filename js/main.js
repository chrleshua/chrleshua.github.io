const svg = d3.select("#grid-svg");
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

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().range([0, height]).padding(0.2);
const color = d3.scaleOrdinal(d3.schemeCategory10);

let allData = [];
let races = [];
let currentView = "finish";

// Pit lane setup
const pitSvg = d3.select("#pitlane-svg");
const pitMargin = { top: 50, right: 50, bottom: 50, left: 150 };
const pitHeight = +pitSvg.attr("height") - pitMargin.top - pitMargin.bottom;
const pitG = pitSvg.append("g").attr("transform", `translate(${pitMargin.left},${pitMargin.top})`);

// Constructors + drivers svg refs
const constructorsSvg = d3.select("#constructors-svg");
const driversSvg = d3.select("#drivers-svg");

// Load data
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
  // If your CSV includes many years, you can filter to 2024 here if desired:
  // allData = allData.filter(d => d.year === 2024);

  races = Array.from(new Set(allData.map(d => d.raceName))).sort((a,b) => a.localeCompare(b));

  const select = d3.select("#raceSelect");
  select.selectAll("option")
    .data(races)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  // initial draw
  updateRace(races[0]);

  // listeners
  select.on("change", () => updateRace(select.property("value")));
  d3.select("#toggleView").on("click", () => {
    currentView = currentView === "finish" ? "grid" : "finish";
    updateRace(select.property("value"), true);
  });

  setupPodium(); // sets up buttons and draws constructors by default
});

// ---------- GRID + PIT (kept nearly identical to working version) ----------
function updateRace(raceName, skipAnimation = false) {
  const raceData = allData.filter(d => d.raceName === raceName)
    .sort((a, b) => a.grid - b.grid);

  x.domain([1, d3.max(raceData, d => d.positionOrder)]);
  y.domain(raceData.map(d => d.driverName));

  // clear main group and draw axes + labels
  g.selectAll("*").remove();

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(Math.min(20, d3.max(raceData, d => d.positionOrder))).tickFormat(d3.format("d")))
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

  // lines (grid -> finish)
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

  // original grid small dot
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

  // animated driver circles
  const circles = g.selectAll(".driverCircle")
    .data(raceData)
    .enter()
    .append("circle")
    .attr("class", "driverCircle")
    .attr("cx", d => currentView === "finish" ? x(d.grid) : x(d.positionOrder))
    .attr("cy", d => y(d.driverName) + y.bandwidth() / 2)
    .attr("r", 12)
    .attr("fill", d => teamColors[d.constructorName] || color(d.constructorId))
    .attr("opacity", 0.9)
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px")
        .html(`<strong>${d.driverName}</strong><br/>
               Constructor: ${d.constructorName}<br/>
               Grid: ${d.grid} → Finish: ${d.positionOrder}<br/>
               Pit Stops: ${d.pitStops}<br/>
               Points: ${d.points}`);
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

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

  // PIT LANE (keeps same approach)
  pitG.selectAll("*").remove();
  const teams = Array.from(d3.group(raceData, d => d.constructorName),
    ([constructorName, drivers]) => ({ constructorName, drivers }));

  const teamSpacing = 180;
  const totalWidth = Math.max(teams.length * teamSpacing, 600);
  pitSvg.attr("width", totalWidth + pitMargin.left + pitMargin.right);

  const pitLane = pitG.append("g")
    .attr("class", "pit-lane")
    .attr("transform", `translate(0,${pitHeight / 2})`);

  const teamGroups = pitLane.selectAll(".team")
    .data(teams)
    .enter()
    .append("g")
    .attr("class", "team")
    .attr("transform", (d, i) => `translate(${i * teamSpacing},0)`)
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px")
        .html(`<strong>${d.constructorName}</strong><br/>` +
          d.drivers.map(dr => `${dr.driverName}: ${dr.pitStops} pit stops, avg lap ${Math.round(dr.avgLapTime_ms)} ms`).join("<br/>"));
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  teamGroups.append("rect")
    .attr("x", -50).attr("y", -30)
    .attr("width", 100).attr("height", 60)
    .attr("fill", d => teamColors[d.constructorName] || "#333")
    .attr("rx", 10).attr("ry", 10)
    .attr("opacity", 0.95);

  teamGroups.append("text")
    .text(d => d.constructorName)
    .attr("y", 5)
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .style("font-weight", "bold");
}

// ---------- PODIUM (Constructors + Drivers) ----------
// Setup buttons and initial draw
function setupPodium() {
  const showConstructorsBtn = document.getElementById("show-constructors");
  const showDriversBtn = document.getElementById("show-drivers");
  const constructorsView = document.getElementById("constructors-view");
  const driversView = document.getElementById("drivers-view");

  showConstructorsBtn.addEventListener("click", () => {
    showConstructorsBtn.classList.add("active");
    showDriversBtn.classList.remove("active");
    constructorsView.classList.remove("hidden");
    driversView.classList.add("hidden");
    drawConstructorsPodium();
  });

  showDriversBtn.addEventListener("click", () => {
    showDriversBtn.classList.add("active");
    showConstructorsBtn.classList.remove("active");
    driversView.classList.remove("hidden");
    constructorsView.classList.add("hidden");
    drawDriversChampionship();
  });

  // draw constructors by default
  drawConstructorsPodium();
}

function drawConstructorsPodium() {
  const svg = constructorsSvg;
  svg.selectAll("*").remove();

  // --- 1. Filter all 2024 GP points per constructor ---
  const constructorsData = Array.from( d3.rollups(allData, v => d3.sum(v, d => d.points), 
  d => d.constructorName), ([constructorName, points]) => ({ constructorName, points }) )
  .sort((a, b) => d3.descending(a.points, b.points)) .slice(0, 5);

  // Sort descending by points
  constructorsData.sort((a, b) => d3.descending(a.points, b.points));

  // --- 2. Map ordinal order to indices (4-2-1-3-5) ---
  const ordinalOrder = [4, 2, 1, 3, 5];
  const indexOrder = ordinalOrder.map(o => o - 1);

  const svgWidth = +svg.attr("width");
  const svgHeight = +svg.attr("height");
  const baseY = svgHeight - 10; // bottom line
  const totalBars = indexOrder.length;
  const barGap = 1; // bars touching
  const barWidth = 60; // thinner

  // Height differences exaggerated
  const heights = { 1: 320, 2: 240, 3: 180, 4: 140, 5: 100 };

  indexOrder.forEach((top5Index, posIdx) => {
      const team = constructorsData[top5Index];
      if (!team) return;

      const ordinal = top5Index + 1;
      const barH = heights[ordinal] || 120;
      const xPos = posIdx * (barWidth + barGap);
      const yPos = baseY - barH;

      const barGroup = svg.append("g")
          .attr("class", `podium-bar ordinal-${ordinal}`)
          .attr("transform", `translate(${xPos}, ${yPos})`);

      // Rectangle bar
      const rect = barGroup.append("rect")
          .attr("width", barWidth)
          .attr("height", barH)
          .attr("fill", teamColors[team.constructorName] || "#fff")
          .attr("rx", 2)
          .style("cursor", "pointer")
          .on("mouseover", (event) => {
              // Grow height and width
              const newHeight = barH ;
              const deltaHeight = newHeight - barH;

              rect.transition().duration(150)
                  .attr("height", newHeight)
                  .attr("y", yPos - deltaHeight)
                  .attr("width", barWidth);

              // --- Show constructor info ---
              const drivers = allData
                  .filter(d => d.constructorName === team.constructorName && d.season === 2024)
                  .sort((a,b)=>b.points - a.points)
                  .slice(0,2);

              const driverInfoHTML = drivers.map(d =>
                  `<div>#${d.positionOrder} ${d.driverName}: ${d.points} pts</div>`
              ).join("");

              d3.select("#constructors-info")
                  .html(`
                      <div class="team-name" style="color:${teamColors[team.constructorName] || "#fff"}">
                          ${team.constructorName} (#${ordinal}) - ${team.points} pts
                      </div>
                      ${driverInfoHTML}
                  `)
                  .style("opacity", 1);
          })
          .on("mouseout", () => {
              rect.transition().duration(250)
                  .attr("height", heights[ordinal])
                  .attr("y", yPos + barH)
                  .attr("width", barWidth);

              d3.select("#constructors-info").style("opacity", 0);
          });

      // Place number inside bar
      barGroup.append("text")
          .attr("class", "placement")
          .attr("x", barWidth / 2)
          .attr("y", barH / 2 + 6)
          .text(`#${ordinal}`);

      // Team name on top
      barGroup.append("text")
          .attr("class", "team-name")
          .attr("x", barWidth / 2)
          .attr("y", -10)
          .attr("fill", teamColors[team.constructorName] || "#fff")
          .text(team.constructorName);

      // Total points under bar
      barGroup.append("text")
          .attr("class", "points")
          .attr("x", barWidth / 2)
          .attr("y", barH + 20)
          .text(`${team.points} pts`);
  });
}



function drawDriversChampionship() {
  const svg = driversSvg;
  svg.selectAll("*").remove();

  svg
  .style("border", "3px solid red")
  .style("filter", "drop-shadow(0px 0px 2px rgba(255, 0, 0, 0.7))");


  // Aggregate driver points
  const driverPoints = Array.from(
      d3.rollups(allData, v => d3.sum(v, d => d.points), d => d.driverName),
      ([driverName, points]) => ({ driverName, points })
  ).sort((a, b) => d3.descending(a.points, b.points));

  const margin = { top: 100, right: 200, bottom: 100, left: 300 };
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);


  const xScale = d3.scaleLinear()
      .domain([0, d3.max(driverPoints, d => d.points)])
      .range([0, width]);

  const yScale = d3.scaleBand()
      .domain(driverPoints.map(d => d.driverName))
      .range([0, height])
      .padding(0.2);

  // Axes
  g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("fill", "#fff")
      .style("font-size", "15px")
      .style("font-family", "Formula1-Regular");

  g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));

  // Bars
  g.selectAll(".bar")
      .data(driverPoints)
      .enter()
      .append("rect")
      .attr("class", "bar driver-bar")
      .attr("y", d => yScale(d.driverName))
      .attr("height", yScale.bandwidth())
      .attr("x", 2)
      .attr("width", 0)
      .attr("fill", "#2b2b2b")
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr("width", d => xScale(d.points));

  // Points text
  setTimeout(() => {
      g.selectAll(".points-text")
          .data(driverPoints)
          .enter()
          .append("text")
          .attr("class", "points-text")
          .attr("x", d => xScale(d.points) + 10)
          .attr("y", d => yScale(d.driverName) + yScale.bandwidth() / 1.6)
          .attr("fill", "#fff")
          .style("font-size", "13px")
          .style("font-family", "Formula1-Bold")
          .text(d => `${d.points} pts`)
          .attr("opacity", 0)
          .transition()
          .duration(1000)
          .attr("opacity", 1);
  }, 1500);

  // Cars (race winners)
  const raceWins = d3.rollups(
      allData.filter(d => d.positionOrder === 1),
      v => v.map(d => ({ raceName: d.raceName, constructorName: d.constructorName })),
      d => d.driverName
  );

  raceWins.forEach(([driverName, races]) => {
      const y = yScale(driverName) + yScale.bandwidth() / 2; // center of bar
      const carHeight = 14;

      races.forEach((raceObj, idx) => {
          const xEnd = 10 + idx * 35; // left-aligned spacing
          const yEnd = y + carHeight + 6;
          

          // Random starting point outside SVG
          const startX = Math.random() * width * 4 + width;
          const startY = Math.random() * height * 30 - height;

          const car = g.append("rect")
              .attr("class", "car")
              .attr("width", 28)
              .attr("height", carHeight)
              .attr("rx", 3)
              .attr("x", startX)
              .attr("y", startY)
              .attr("fill", teamColors[raceObj.constructorName] || "#e10600")
              .attr("stroke", "#000")
              .attr("stroke-width", 1)
              .style("cursor", "pointer")
              .attr("transform", `rotate(0,${startX + 14},${startY + 7})`) // initial rotation
              .on("mouseover", (event) => {
                  tooltip.style("opacity", 1)
                      .style("left", (event.pageX + 12) + "px")
                      .style("top", (event.pageY - 28) + "px")
                      .html(`<strong>${driverName}</strong><br/> ${raceObj.raceName}`);
              })
              .on("mousemove", (event) => {
                  tooltip.style("left", (event.pageX + 12) + "px")
                      .style("top", (event.pageY - 28) + "px");
              })
              .on("mouseout", () => tooltip.style("opacity", 0));

          // Animate along a smooth exaggerated path with rotation
          const swirlAmplitude = 30; // bigger curves
          const rotateAmplitude = 260; // rotation in degrees

          car.transition()
              .delay(idx * 400)
              .duration(4000 + Math.random() * 1500)
              .ease(d3.easeCubicOut)
              .attrTween("x", function () {
                  const interpolateX = d3.interpolateNumber(startX, xEnd);
                  return t => interpolateX(t) + swirlAmplitude * Math.sin(t * Math.PI * 3);
              })
              .attrTween("y", function () {
                  const interpolateY = d3.interpolateNumber(startY, yEnd);
                  return t => interpolateY(t) + swirlAmplitude * Math.cos(t * Math.PI * 3);
              })
              .attrTween("transform", function () {
                  return t => {
                      const xCurrent = startX + (xEnd - startX) * t + swirlAmplitude * Math.sin(t * Math.PI * 3);
                      const yCurrent = startY + (yEnd - startY) * t + swirlAmplitude * Math.cos(t * Math.PI * 3);
                      const rotate = rotateAmplitude * Math.sin(t * Math.PI * 3); 
                      return `rotate(${rotate},${xCurrent + 7},${yCurrent + 7})`;
                  };
              })
              .on("end", function () {
                  // reset rotation to 0° at final position
                  d3.select(this).attr("transform", `rotate(0,${xEnd + 14},${yEnd + 7})`);
              });
      });
  });
}




// ---------- Feature card scrolling ----------
document.querySelectorAll(".feature-card").forEach(card => {
  card.addEventListener("click", () => {
    const targetId = card.id.replace("btn-", "") + "-section";
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});