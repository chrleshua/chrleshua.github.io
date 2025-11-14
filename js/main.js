import { racecarSVG, pitstopSVG } from './svgTemplates.js';

const svg = d3.select("#grid-svg");
const width = +svg.attr("width") - 150;
const height = +svg.attr("height") - 100;
const margin = { top: 50, right: 50, bottom: 50, left: 150 };

let selectedTeam = null;

const teamColors = {
  "McLaren": "#FF8700",
  "Mercedes": "#00D2BE",
  "Red Bull": "#1E41FF",
  "Ferrari": "#DC0000",
  "Aston Martin": "#006F62",
  "Alpine F1 Team": "#ffb6c1",
  "Williams": "#005AFF",
  "RB F1 Team": "#6495ed",
  "Sauber": "#228b22",
  "Haas F1 Team": "#a9a9a9",
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

  races = Array.from(new Set(allData.map(d => d.raceName))).sort((a,b) => a.localeCompare(b));

  const select = d3.select("#raceSelect");
  select.selectAll("option")
    .data(races)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  const select_pit = d3.select("#raceSelect1");
    select_pit.selectAll("option")
      .data(races)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d);


  // initial draw

  updateRace(races[0]);
  updatePit(races[0]);
  updateRaceSim(races[0]);


  // listeners
  select.on("change", () => updateRace(select.property("value")));
  d3.select("#restart").on("click", () => {
    updateRace(select.property("value"));
    updateRaceSim(select.property("value"));
  });

  select_pit.on("change", () => updatePit(select_pit.property("value")));

  setupPodium(); // sets up buttons and draws constructors by default
});

function updateRace(raceName, skipAnimation = false) {
  const raceData = allData
    .filter(d => d.raceName === raceName)
    .sort((a, b) => a.grid - b.grid);

  drawGrid(raceData);
}

function updatePit(raceName) {
  const raceData = allData
    .filter(d => d.raceName === raceName)
    .sort((a, b) => a.grid - b.grid);

  drawPitStops(raceData);
}

function updateRaceSim(raceName) {
  const raceData = allData
    .filter(d => d.raceName === raceName)
    .sort((a, b) => a.grid - b.grid);

  drawRaceSim(raceData);
}

d3.select("#auto-select").on("click", async () => {
  const select = d3.select("#raceSelect");
  const selectPit = d3.select("#raceSelect1");

  const g = d3.select("#auto-select");

  

  // get current index
  let currentRace = select.property("value");
  let startIndex = races.findIndex(r => r === currentRace);
  if (startIndex === -1) startIndex = 0;

  for (let i = startIndex; i < races.length; i++) {
    const race = races[i];

    // update both grid and pit stop
    updateRace(race);
    updatePit(race);

    // update select dropdowns visually
    select.property("value", race);
    selectPit.property("value", race);

    // wait 7 seconds before next race
    if (i < races.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
  }
});

d3.select("#show-graph").on("click", () => {
  document.getElementById("top5-view").classList.add("hidden");
  document.getElementById("grid-view").classList.remove("hidden");

  d3.select("#show-graph").classed("active", true);
  d3.select("#show-top5-grid").classed("active", false);

  updateRace(d3.select("#raceSelect").property("value"));
});

d3.select("#show-top5-grid").on("click", () => {
  const btn = d3.select("#show-top5-grid");
  document.getElementById("grid-view").classList.add("hidden");
  document.getElementById("top5-view").classList.remove("hidden");

  d3.select("#show-graph").classed("active", false);
  d3.select("#show-top5-grid").classed("active", true);

  updateRaceSim(d3.select("#raceSelect").property("value"));
});

function drawRaceSim(raceData) {
  const g = d3.select("#top5-svg");
  g.selectAll("*").remove(); // clear previous

  const svgW = +g.attr("width");
  const svgH = +g.attr("height");

  const carW = 100;
  const carH = 200;
  const spacingX = 100;
  const startX = 150;
  const yOffsetTop = 200;

  const top5 = raceData
    .filter(d => d.grid >= 1 && d.grid <= 5)
    .sort((a, b) => a.grid - b.grid);

  // stop any previous intervals
  if(window.audienceIntervals) window.audienceIntervals.forEach(i=>i.stop());
  window.audienceIntervals = [];

  // --- FLAGS ---
  const flagWidth = 40;
  const flagHeight = 60;
  const leftFlag = g.append("rect")
    .attr("x", 0).attr("y",20)
    .attr("width",flagWidth).attr("height",flagHeight)
    .attr("fill","green").style("display","none");
  const rightFlag = g.append("rect")
    .attr("x",svgW-flagWidth).attr("y",20)
    .attr("width",flagWidth).attr("height",flagHeight)
    .attr("fill","green").style("display","none");

  // --- TOOLTIP ---
  const tooltip = d3.select("body").append("div")
    .attr("class","tooltip")
    .style("opacity",0)
    .style("position","absolute")
    .style("background","rgba(0,0,0,0.8)")
    .style("color","#fff")
    .style("padding","6px 10px")
    .style("border-radius","5px")
    .style("pointer-events","none")
    .style("font-family","Formula1-Bold");

  // --- CARS + BRACKETS + DRIVER NAMES ---
  const carInfo = top5.map((d,i)=>{
    const x = startX + i*(carW + spacingX);
    const y = yOffsetTop + i*30;

    const bracketG = g.append("g")
      .attr("class","bracket")
      .attr("transform",`translate(${x},${y-40})`);
    bracketG.append("rect").attr("width",carW).attr("height",30)
      .attr("fill","white").attr("rx",5).attr("ry",5);
    bracketG.append("text")
      .attr("x",carW/2).attr("y",15)
      .attr("text-anchor","middle").attr("dominant-baseline","middle")
      .attr("fill","black").attr("font-size","18px").attr("font-family","Formula1-Bold")
      .text(`P${d.grid}`);

    const carG = g.append("g")
      .attr("class","car")
      .attr("transform",`translate(${x},${y})`);

    carG.append("foreignObject")
      .attr("width",carW).attr("height",carH)
      .html(racecarSVG(teamColors[d.constructorName]||"#fff"));

    carG.append("text")
      .attr("x",carW/2).attr("y",carH+20)
      .attr("text-anchor","middle")
      .attr("fill",teamColors[d.constructorName]||"#fff")
      .attr("font-size","16px")
      .attr("font-family","Formula1-Bold")
      .text(d.driverName);

    carG.on("mouseover",(event)=>{
      tooltip.style("opacity",1)
        .style("left",(event.pageX+10)+"px")
        .style("top",(event.pageY-20)+"px")
        .html(`<strong>${d.driverName}</strong><br/>Grid: ${d.grid}<br/>Final: ${d.positionOrder}`);
    }).on("mouseout",()=>tooltip.style("opacity",0));

    return {x,carG,bracketG,driver:d};
  });

  // --- START BUTTON ---
  const startBtn = g.append("foreignObject")
    .attr("x", svgW/2-250).attr("y",20).attr("width",500).attr("height",120)
    .append("xhtml:div")
    .style("display","flex").style("justify-content","center").style("align-items","center")
    .style("font-size","48px").style("font-family","Formula1-Bold")
    .style("background-color","red").style("color","white").style("border-radius","15px")
    .style("cursor","pointer").text("START");

  startBtn.on("click", function(){
    d3.select(this.parentNode).style("display","none");
    leftFlag.style("display",null); rightFlag.style("display",null);

    const exitY = svgH + 100;
    const p3Y = yOffsetTop + 2*30;

    // Animate cars to P3Y then random movement
    carInfo.forEach(info=>{
      const {x,carG,bracketG} = info;
      carG.transition().duration(1500)
        .attr("transform",`translate(${x},${p3Y})`)
        .on("end", function repeat(){
          const dx = (Math.random()-0.5)*25;
          const dy = (Math.random()-0.5)*30;
          d3.select(this)
            .transition().duration(1000+Math.random()*400)
            .attr("transform",`translate(${x+dx},${p3Y+dy})`)
            .on("end",repeat);
        });

      bracketG.transition().duration(2500).attr("transform",`translate(${x},${exitY})`);
    });

    leftFlag.transition().duration(2500).attr("y",exitY);
    rightFlag.transition().duration(2500).attr("y",exitY);

    // --- BLEACHERS ---
    const bleacherWidth = 60;
    g.append("rect")
    .attr("class", "bleacher-rect")
    .attr("x",0).attr("y",0).attr("width",bleacherWidth).attr("height",svgH).attr("fill","white");

    g.append("rect")
    .attr("class", "bleacher-rect")
    .attr("x",svgW-bleacherWidth).attr("y",0).attr("width",bleacherWidth).attr("height",svgH).attr("fill","white");

    // --- AUDIENCE ---
    const colors = ["#000","#666","#00f"];
    const circleRadius = 15; const spawnInterval=100; const speed=1500;
    function spawnCircle(startX){
      const x = startX + Math.random()*bleacherWidth;
      g.append("circle")
        .attr("class", "audience-circle")
        .attr("cx",x).attr("cy",-circleRadius).attr("r",circleRadius)
        .attr("fill",colors[Math.floor(Math.random()*colors.length)])
        .attr("opacity",0.9)
        .transition().duration(speed).ease(d3.easeLinear)
        .attr("cy",svgH+circleRadius).remove();
    }
    const leftInterval = d3.interval(()=>spawnCircle(0),spawnInterval);
    const rightInterval = d3.interval(()=>spawnCircle(svgW-bleacherWidth),spawnInterval);
    window.audienceIntervals.push(leftInterval,rightInterval);

    // --- AFTER 5 SECONDS: FINAL 5 ---
    setTimeout(()=>{
      const final5Drivers = raceData.sort((a,b)=>a.positionOrder-b.positionOrder).slice(0,5).map(d=>d.driverName);

      const finalSpacing = (svgH-150)/8; // more exaggerated Y positions
      final5Drivers.forEach((name,i)=>{
        const finalY = 150 + i*finalSpacing;
        const x = startX + i*(carW+spacingX);
        let existing = carInfo.find(c=>c.driver.driverName===name);
        if(existing){
          existing.carG.transition().duration(2000)
            .attr("transform",`translate(${x},${finalY})`);
        } else {
          // Animate new car driving in
          const driverData = raceData.find(d=>d.driverName===name);
          const carG = g.append("g").attr("class","car").attr("transform",`translate(${x},${exitY})`);

          carG.append("foreignObject").attr("width",carW).attr("height",carH)
            .html(racecarSVG(teamColors[driverData.constructorName]||"#fff"));
            
          carG.append("text")
            .attr("x",carW/2).attr("y",carH+20)
            .attr("text-anchor","middle")
            .attr("fill",teamColors[driverData.constructorName]||"#fff")
            .attr("font-size","16px")
            .attr("font-family","Formula1-Bold")
            .text(driverData.driverName);
      
          carG.on("mouseover",(event)=>{
            tooltip.style("opacity",1)
              .style("left",(event.pageX+10)+"px")
              .style("top",(event.pageY-20)+"px")
              .html(`<strong>${driverData.driverName}</strong><br/>Grid: ${driverData.grid}<br/>Final: ${driverData.positionOrder}`);
          }).on("mouseout",()=>tooltip.style("opacity",0));

          carG.transition().duration(2000).attr("transform",`translate(${x},${finalY})`);

          carInfo.push({x,carG,driver:driverData});
        }
      });

      // Remove non-final cars
      carInfo.forEach(info=>{
        if(!final5Drivers.includes(info.driver.driverName)){
          info.carG.transition().duration(2000)
            .attr("transform",`translate(${info.x},${exitY})`);
        }
      });
    },5000);

    // --- AFTER 7 SECONDS: END RACE ---
    setTimeout(()=>{
      window.audienceIntervals.forEach(i=>i.stop());
      // Bleachers exit
      g.selectAll(".bleacher-rect").transition().duration(2000).attr("y",exitY);

      // Display final positions rectangle
      const rectX = startX;
      const rectWidth = (carW+spacingX)*5-spacingX;
      g.append("rect").attr("x",rectX).attr("y",10)
        .attr("class", "final-banner")
        .attr("width",rectWidth).attr("height",50)
        .attr("fill","black").attr("stroke","white").attr("stroke-width",4);
      g.append("text").attr("x",rectX+rectWidth/2).attr("y",45)
      .attr("class", "final-banner")
        .attr("text-anchor","middle")
        .attr("fill","white")
        .attr("font-size","24px")
        .attr("font-family","Formula1-Bold")
        .text("FINAL POSITIONS");
    },7000);
  });
}







/* ------------------ GRID VISUALIZATION ------------------ */
function drawGrid(raceData, skipAnimation = false) {
  // prepare scales / domains
  x.domain([1, d3.max(raceData, d => d.positionOrder)]);
  y.domain(raceData.map(d => d.driverName));

  // clear previous content

  g.selectAll("*").remove();
  g.selectAll(".dotted-line").remove();

  // X axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .ticks(Math.min(20, d3.max(raceData, d => d.positionOrder)))
        .tickFormat(d3.format("d"))
    )
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "#fff")
    .attr("text-anchor", "middle")
    .style("font-family", "Formula1-Bold")
    .text("Race Finish Position");

  // Y axis
  g.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -120)
    .attr("fill", "#fff")
    .attr("text-anchor", "middle")
    .style("font-family", "Formula1-Bold")
    .text("Driver");

  // grid dots (initial positions)
  const gridDots = g.selectAll(".gridDot")
    .data(raceData, d => d.driverId + "_" + d.raceId);

  gridDots.enter()
    .append("circle")
    .attr("class", "gridDot")
    .attr("cx", d => x(d.grid || d.positionOrder)) // handle cases with grid=0
    .attr("cy", d => y(d.driverName) + y.bandwidth() / 2)
    .attr("r", 5)
    .attr("fill", "#fff")
    .attr("opacity", 0.7);

  // driver circles (start at grid)
  const circles = g.selectAll(".driverCircle")
    .data(raceData, d => d.driverId + "_" + d.raceId);

  const circlesEnter = circles.enter()
    .append("circle")
    .attr("class", "driverCircle")
    .attr("cx", d => x(d.grid)) // start at grid
    .attr("cy", d => y(d.driverName) + y.bandwidth() / 2)
    .attr("r", 12)
    .attr("fill", d => teamColors[d.constructorName] || color(d.constructorId))
    .attr("opacity", 0.9)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      // grow on hover
      d3.select(this).transition().duration(120).attr("r", 18);
      tooltip.style("opacity", 1)
        .style("left", (event.pageX + 20) + "px")
        .style("top", (event.pageY - 28) + "px")
        .html(`<strong>${d.driverName}</strong><br/>
               Constructor: ${d.constructorName}<br/>
               Grid: ${d.grid} → Finish: ${d.positionOrder}<br/>
               Pit Stops: ${d.pitStops}<br/>
               Points: ${d.points}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 20) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).transition().duration(120).attr("r", 12);
      tooltip.style("opacity", 0);
    });

  // merge so we have a stable selection if rerendering
  circlesEnter.merge(circles)
    .attr("cy", d => y(d.driverName) + y.bandwidth() / 2);

  // Identify top10 names (finish)
  const top10Names = new Set(raceData.filter(d => d.positionOrder <= 10).map(d => d.driverName));



  if (!skipAnimation) {
    // Animate from grid -> finish
    circlesEnter.merge(circles)
      .transition()
      .duration(4000)
      .ease(d3.easeCubicInOut)
      .attr("cx", d => x(d.positionOrder))
      .on("end", function (event, d) {
        g.selectAll(".dotted-line").remove();

        // add dotted lines for all drivers
        g.selectAll(".dotted-line")
          .data(raceData)
          .enter()
          .append("line")
          .attr("class", "dotted-line")
          .attr("x1", d => x(d.grid))
          .attr("y1", d => y(d.driverName) + y.bandwidth() / 2)
          .attr("x2", d => x(d.positionOrder))
          .attr("y2", d => y(d.driverName) + y.bandwidth() / 2)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.2)
          .attr("stroke-dasharray", "4,4")
          .attr("opacity", 0)
          .lower()
          .transition()
          .duration(1000)
          .attr("opacity", 0.6);
      
        // update opacity: top 10 full, bottom 10 half
        g.selectAll(".driverCircle")
          .attr("opacity", d => d.positionOrder <= 10 ? 0.95 : 0.5);
      });


  } else {
    // immediate static positions (no animation)
    circlesEnter.merge(circles)
      .attr("cx", d => x(d.positionOrder));

    // set opacities immediately
    g.selectAll(".driverCircle")
      .attr("opacity", d => top10Names.has(d.driverName) ? 0.95 : 0.5);
  }
}



// assumes pitstopSVG (string), teamColors (map), allData (array) already exist
function drawPitStops(raceData) {
  const svg = d3.select("#pitlane-svg");
  svg.selectAll("*").remove();

  const width = 240 * 11 + 200;
  const height = +svg.attr("height");
  svg.attr("width", width);

  // road background
  svg.append("rect")
      .attr("x", -100)
      .attr("y", -100)
      .attr("width", width+100)
      .attr("height", height+100)
      .attr("fill", "#D3D3D3");
  
  svg.append("rect")
      .attr("x", 0)
      .attr("y", 300)
      .attr("width", width)
      .attr("height", height - 300)
      .attr("fill", "#2a2a2a");
  


  const teamStats = Array.from(
      d3.rollups(allData, v => d3.sum(v, d => d.points), d => d.constructorName),
      ([constructorName, points]) => ({ constructorName, points })
  ).sort((a, b) => d3.descending(a.points, b.points));

  const top10 = new Set(teamStats.slice(0, 10).map(d => d.constructorName));

  const stationWidth = 240;
  const stationHeight = 200;
  const startX = 50;
  const startY = 100;
  const gap = 40;

  const stations = svg.selectAll(".pitstop-station")
      .data(teamStats)
      .enter()
      .append("g")
      .attr("class", d => `pitstop-station ${top10.has(d.constructorName) ? "" : "pitstop-dimmed"}`)
      .attr("transform", (d, i) => `translate(${startX + i * (stationWidth + gap)}, ${startY})`);

  stations.each(function(d) {
      const g = d3.select(this);

      // Background rect for hover outline
      g.append("rect")
          .attr("class", "pitstop-bg")
          .attr("width", stationWidth)
          .attr("height", stationHeight)
          .attr("rx", 6);

      // insert pitstop SVG
      const foreign = g.append("foreignObject")
          .attr("width", stationWidth)
          .attr("height", stationHeight)
          .attr("x", 0)
          .attr("y", 0);

      const div = foreign.append("xhtml:div")
          .html(pitstopSVG);

      const innerSVG = div.select("svg")
          .attr("width", stationWidth)
          .attr("height", stationHeight)
          .node();

      // team name text
      d3.select(innerSVG)
          .append("text")
          .attr("class", "pit-team-name")
          .attr("x", 300)
          .attr("y", 60)
          .attr("font-size", "40px")
          .attr("font-family", "Formula1-Bold")
          .attr("fill", teamColors[d.constructorName] || "#fff")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .text(d.constructorName);

      // Click action: zoom & switch view
      g.on("click", function (event, d) {
        // 1. record team
        selectedTeam = d.constructorName;
    
        // 2. center scroll (your existing code already does this)
        const container = document.querySelector("#pitlane-view");
        const stationX = this.getBoundingClientRect().left + container.scrollLeft;
        const centerX = stationX - container.offsetWidth / 2 + 150;
        container.scrollTo({ left: centerX, behavior: "smooth" , duration: 250});
    
        // 3. zoom into station
        const station = d3.select(this);
    
        station.transition()
            .duration(250)
            .on("end", () => {
                // 4. After zoom -> switch views
                document.getElementById("pitlane-view").classList.add("hidden");
                document.getElementById("team-view").classList.remove("hidden");
    
                // 5. draw new view
                drawTeamPitView(selectedTeam, raceData);
            });
    });
    
  });

  // reset scroll
  const wrapper = document.querySelector(".pitlane-view");
  if (wrapper) wrapper.scrollLeft = 0;
}


// Ensure this function is available in the same module scope as your other functions.
// Expects racecarSVG() to be imported and return a string (either full <svg>...</svg> or inner contents).

function drawTeamPitView(teamName, raceData) {
  // Record selected team globally (so other code can access)
  window.__selectedTeamName = teamName;

  const svgSel = d3.select("#team-pit-svg");
  svgSel.selectAll("*").remove();

  // Container sizes
  const W = +svgSel.attr("width");
  const H = +svgSel.attr("height");

  // grey background
  svgSel.append("rect")
    .attr("x", 0).attr("y", 0)
    .attr("width", 1000).
    attr("height", 800)
    .attr("fill", "#dddddd");

  // small header with team name (left)
  svgSel.append("text")
    .attr("x", 20).attr("y", 40)
    .attr("class", "team-view-title")
    .style("font-family", "Formula1-Bold")
    .style("font-size", "28px")
    .style("fill", teamColors[teamName] || "#000")
    .text(teamName);

  // Back button area (top-right)
  // create a group for button to guarantee it exists for event binding
  const btnGroup = svgSel.append("g")
    .attr("id", "team-back-btn")
    .style("cursor", "pointer")
    .attr("transform", `translate(${W - 140}, 10)`);

  btnGroup.append("rect")
    .attr("width", 120).attr("height", 36)
    .attr("rx", 6)
    .attr("fill", "#111")
    .attr("stroke", "#333");

  btnGroup.append("text")
    .attr("x", 60).attr("y", 24)
    .attr("text-anchor", "middle")
    .style("fill", "#fff")
    .style("font-family", "Formula1-Bold")
    .style("font-size", "12px")
    .text("Back to Pitlane");

  // click to return to pit lane view
  btnGroup.on("click", () => {
    // hide team view and show pitlane view (assumes these are controlled by classes .hidden)
    d3.select("#team-view").classed("hidden", true);
    d3.select("#pitlane-view").classed("hidden", false);

    svgSel.selectAll("*").remove();

    // restore focus/scroll to pitlane (optional)
    const wrapper = document.querySelector(".pitlane-view");
    if (wrapper) wrapper.scrollLeft = 0;
  });

  // Find the two drivers for this team for this raceData (raceData should be the selected race's records)
  // If raceData not provided, attempt to derive from allData (filter the most recent race or first)
  let drivers = [];
  if (raceData && Array.isArray(raceData) && raceData.length) {
    drivers = Array.from(new Map(
      raceData
        .filter(d => d.constructorName === teamName)
        .map(d => [d.driverName, d])
    ).values());
  } else {
    // fallback: take top two drivers from allData for this constructor
    drivers = Array.from(new Map(
      allData
        .filter(d => d.constructorName === teamName)
        .sort((a,b)=>b.points-a.points)
        .map(d => [d.driverName, d])
    ).values()).slice(0,2);
  }

  // ensure two slots
  if (drivers.length === 0 && constructorsData) {
    // try to pick from constructorsData global (if exists)
  }
  // Layout: two cars side-by-side centered
  const carW = 200;    // intrinsic viewBox width in template
  const carH = 400;    // intrinsic height
  const desiredH = Math.min(380, H - 140); // scale to fit vertically
  const scale = desiredH / carH;
  const spacing = 200;
  const totalW = (carW * scale) * 2 + spacing;
  const startX = 200;
  const yOffset = 100;

  // FIRST DRIVER
  const drv1Data = raceData.find(d => d.driverName === drivers[0].driverName) ?? {};
  const drv2Data = raceData.find(d => d.driverName === drivers[1].driverName) ?? {};

  const info1 = {
    name: drivers[0].driverName,
    pitStops: drv1Data.pitStops ?? "N/A",
    fastestLap: drv1Data.fastestLap ?? drv1Data.fastestLapTime ?? "N/A",
    avgLap: formatAndCapLap(drv1Data.avgLapTime_ms) ?? "N/A",
    finish: drv1Data.positionOrder ?? drv1Data.position ?? "N/A",
  };
  const info2 = {
    name: drivers[1].driverName,
    pitStops: drv2Data.pitStops ?? "N/A",
    fastestLap: drv2Data.fastestLap ?? drv2Data.fastestLapTime ?? "N/A",
    avgLap: formatAndCapLap(drv2Data.avgLapTime_ms) ?? "N/A",
    finish: drv2Data.positionOrder ?? drv2Data.position ?? "N/A",
  };

const foreign1 = svgSel.append("foreignObject")
  .attr("width", carW)
  .attr("height", carH)
  .attr("x", startX)
  .attr("y", yOffset)
  .on("mouseover", (event) => {
    tooltip.style("opacity", 0.9)
      .style("left", (event.pageX + 30) + "px")
      .style("top", (event.pageY - 28) + "px")
      .html(`<strong>${info1.name}</strong><br/>
             Pit stops: ${info1.pitStops}<br/>
             Fastest lap: ${info1.fastestLap}<br/>
             Avg lap: ${info1.avgLap}<br/>
             Final pos: ${info1.finish}`);
  })
  .on("mousemove", (event) => {
    tooltip.style("left", (event.pageX + 30) + "px")
           .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", () => tooltip.style("opacity", 0));

foreign1.append("xhtml:div")
  .html(racecarSVG(teamColors[teamName] || "#fff"));

const foreign2 = svgSel.append("foreignObject")
  .attr("width", carW)
  .attr("height", carH)
  .attr("x", startX + (carW * scale) + spacing)
  .attr("y", yOffset)
  .on("mouseover", (event) => {
    tooltip.style("opacity", 0.9)
      .style("left", (event.pageX + 30) + "px")
      .style("top", (event.pageY - 28) + "px")
      .html(`<strong>${info2.name}</strong><br/>
             Pit stops: ${info2.pitStops}<br/>
             Fastest lap: ${info2.fastestLap}<br/>
             Avg lap: ${info2.avgLap}<br/>
             Final pos: ${info2.finish}`);
  })
  .on("mousemove", (event) => {
    tooltip.style("left", (event.pageX + 30) + "px")
           .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", () => tooltip.style("opacity", 0));

foreign2.append("xhtml:div")
  .html(racecarSVG(teamColors[teamName] || "#fff"));

  }

  function formatAndCapLap(ms, minSeconds = 60, maxSeconds = 120) {
    if (ms == null || isNaN(ms) ) return "N/A";
    // Convert ms → seconds
    let sec = ms / 1000;
  
    // Apply cap
    sec = Math.max(minSeconds, Math.min(sec, maxSeconds));
  
    // Convert seconds → M:SS.sss
    const minutes = Math.floor(sec / 60);
    const seconds = (sec % 60).toFixed(3).padStart(6, "0");
  
    return `${minutes}:${seconds}`;
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

  // --- 1. Top 5 constructors (by total points) ---
  const constructorsData = Array.from(
    d3.rollups(
      allData,
      v => d3.sum(v, d => d.points),
      d => d.constructorName
    ),
    ([constructorName, points]) => ({ constructorName, points })
  )
  .sort((a, b) => d3.descending(a.points, b.points))
  .slice(0, 5);

  if (constructorsData.length === 0) return;

  const ordinalOrder = [4, 2, 1, 3, 5];
  const indexOrder = ordinalOrder.map(o => o - 1);

  const baseBarWidth = 130;
  const gap = 3;
  const svgWidth = +constructorsSvg.attr("width");
  const svgHeight = +constructorsSvg.attr("height");
  const baseY = svgHeight - 350;
  const centerX = svgWidth / 2;

  const heights = { 1: 350, 2: 300, 3: 250, 4: 200, 5: 150 };

  const fillMap = {};
  constructorsData.forEach((d) => { fillMap[d.constructorName] = teamColors[d.constructorName] || "#fff"; });

  const n = indexOrder.length;
  const totalWidth = n * baseBarWidth + (n - 1) * gap;
  const startX = (centerX) - totalWidth / 2;

  const groups = [];

  // --- Info Panel BELOW bars ---
  let infoGroup = svg.select("g#info-panel");
  if (infoGroup.empty()) {
      infoGroup = svg.append("g")
          .attr("id", "info-panel")
          .attr("transform", `translate(${svgWidth - 350}, 50)`); // position right side
  
      infoGroup.append("text").attr("class", "team-name")
          .attr("y", 0)
          .style("font-family", "Formula1-Bold").style("font-size", "60px")
          .style("fill", "#fff");
  
      infoGroup.append("text").attr("class", "placement")
          .attr("y", 60).style("font-size", "30px").style("fill", "#fff");
  
      infoGroup.append("text").attr("class", "total-points")
          .attr("y", 100).style("font-size", "30px").style("fill", "#fff");
  
      infoGroup.append("g").attr("class", "drivers-list")
          .attr("transform", "translate(0, 120)");
  }

  indexOrder.forEach((top5Index, posIdx) => {
    const team = constructorsData[top5Index];
    if (!team) return;

    const ordinal = top5Index + 1;
    const barH = heights[ordinal] || 140;
    const xPos = startX - 200 + posIdx * (baseBarWidth + gap);

    const g = svg.append("g")
      .attr("class", `podium-bar ordinal-${ordinal}`)
      .attr("transform", `translate(${xPos}, ${baseY}) scale(1,0)`)
      .style("cursor", "pointer");

    g.append("rect")
      .attr("x", 0)
      .attr("y", -barH)
      .attr("width", baseBarWidth)
      .attr("height", barH)
      .attr("rx", 6)
      .attr("fill", fillMap[team.constructorName] || "transparent")
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5)
      .attr("class", "podium-rect");

    g.append("text")
      .attr("class", "podium-place")
      .attr("x", baseBarWidth / 2)
      .attr("y", -barH / 2 + 6)
      .attr("text-anchor", "middle")
      .style("font-family", "Formula1-Bold")
      .style("font-size", "18px")
      .style("fill", "#fff")
      .text(`#${ordinal}`);

    g.append("text")
      .attr("class", "podium-pts")
      .attr("x", baseBarWidth / 2)
      .attr("y", -barH - 10)
      .attr("text-anchor", "middle")
      .style("font-family", "Formula1-Bold")
      .style("font-size", "12px")
      .style("fill", "#fff")
      .text(`${team.points} pts`);
    
    g.append("text")
      .attr("class", "team-name")
      .attr("x", baseBarWidth / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("fill", fillMap[team.constructorName] || "transparent")
      .style("font-family", "Formula1-Bold")
      .style("font-size", "18px")
      .text(`${team.constructorName}`);
  

      g.on("mouseover", (event) => {
        const focusedScaleX = 1.4;
        const focusedScaleY = 1.2;
      
        const widths = indexOrder.map((_, i) => (i === posIdx ? baseBarWidth * focusedScaleX : baseBarWidth));
        const newTotalWidth = widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * gap;
        const newStartX = centerX - 200 - newTotalWidth / 2;
      
        groups.forEach((obj, i) => {
          const targetX = newStartX + widths.slice(0, i).reduce((a, b) => a + b, 0) + i * gap;
          const isFocused = (i === posIdx);
          const sX = isFocused ? focusedScaleX : 1;
          const sY = isFocused ? focusedScaleY : 1;
          obj.g.transition().duration(150)
            .attr("transform", `translate(${targetX}, ${baseY}) scale(${sX}, ${sY})`);
          obj.x = targetX;
        });
      

        const team = constructorsData[top5Index];
        const drivers = Array.from(
            d3.rollups(
                allData.filter(d => d.constructorName === team.constructorName),
                v => d3.sum(v, d => d.points),
                d => d.driverName
            ),
            ([driverName, pts]) => ({ driverName, pts })
        ).sort((a, b) => d3.descending(a.pts, b.pts));
    
        infoGroup.select(".team-name")
            .text(team.constructorName)
            .style("fill", fillMap[team.constructorName] || "#fff");
    
        infoGroup.select(".placement")
        .text(`Placement: #${top5Index}`)
        .style("font-size", "30px");

        infoGroup.select(".total-points")
        .text(`Total points: ${team.points}`)
        .style("font-size", "30px");
    
        // Clear old drivers
        const driverG = infoGroup.select(".drivers-list");
        driverG.selectAll("*").remove();
    
        // Add driver rows
        driverG.selectAll("text")
            .data(drivers)
            .enter()
            .append("text")
            .attr("y", (d, i) => i * 30 + 20)
            .style("font-size", "25px")
            .style("fill", "#fff")
            .text(d => `${d.driverName} — ${d.pts} pts`);
    });
      

    g.on("mouseout", () => {
      const widths = indexOrder.map(() => baseBarWidth);
      const totalW = widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * gap;
      const newStartX = (centerX - 200) - totalW / 2;

      groups.forEach((obj, i) => {
        const targetX = newStartX + i * (baseBarWidth + gap);
        obj.g.transition().duration(100)
          .attr("transform", `translate(${targetX}, ${baseY}) scale(1,1)`);
        obj.x = targetX;
      });

      
    });

    groups.push({ g, x: xPos, idx: top5Index });
  });

  groups.forEach((obj, i) => {
    obj.g.transition().delay(120 * i).duration(900).ease(d3.easeBackOut)
      .attr("transform", `translate(${obj.x}, ${baseY}) scale(1,1)`);
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

  const margin = { top: 50, right: 150, bottom: 100, left: 200 };
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
      const carHeight = 15;

      races.forEach((raceObj, idx) => {
          const xEnd = 10 + idx * 35; // left-aligned spacing
          const yEnd = y + carHeight + 7;
          

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

const pitSvg = d3.select("#pitlane-svg");
// const pitMargin = { top: 50, right: 50, bottom: 50, left: 150 };
// const pitHeight = +pitSvg.attr("height") - pitMargin.top - pitMargin.bottom;
// const pitG = pitSvg.append("g").attr("transform", `translate(${pitMargin.left},${pitMargin.top})`);

// Constructors + drivers svg refs
const constructorsSvg = d3.select("#constructors-svg");
const driversSvg = d3.select("#drivers-svg");


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

// === Scroll-based F1 title shrink ===
const titleEl = document.querySelector("#f1-title");
const subtitleEl = document.querySelector(".f1-subtitle");
const sectionHeaders = document.querySelectorAll(".section-header");

// --- Title shrink behavior ---
const titleMax = parseFloat(titleEl.dataset.max);
const titleMin = parseFloat(titleEl.dataset.min);
const subtitleMax = parseFloat(subtitleEl.dataset.max);
const subtitleMin = parseFloat(subtitleEl.dataset.min);

window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;

    // --- Main title ---
    const maxScroll = 500; // px over which shrinking occurs
    const titleFactor = Math.min(1, scrollY / maxScroll); // 0->1
    const newTitleSize = titleMax - titleFactor * (titleMax - titleMin);
    const newSubtitleSize = subtitleMax - titleFactor * (subtitleMax - subtitleMin);

    titleEl.style.fontSize = `${newTitleSize}vw`;
    subtitleEl.style.fontSize = `${newSubtitleSize}vw`;

    // --- Section headers ---
    const windowHeight = window.innerHeight;
    sectionHeaders.forEach(header => {
        const rect = header.getBoundingClientRect();
        const headerCenter = rect.top + rect.height / 2;

        // distance from viewport center
        const distance = Math.abs(headerCenter - windowHeight / 2);

        // scaling factor: 1 when far, maxScale when center
        const maxDistance = windowHeight - 200; // normalize
        let factor = 1 - Math.min(distance / maxDistance, 1); // 0..1
        const minScale = 3;
        const maxScale = 3.5;

        const scale = minScale + factor * (maxScale - minScale);
        header.style.transform = `scale(${scale})`;
    });
});
