

export function racecarSVG(teamColor) {
  return `
      <svg class="racecar-svg" viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg">
  <!-- Front Wing -->
  <rect x="50" y="50" width="300" height="20" fill="${teamColor}" stroke="black" stroke-width="2" rx="4"/>
  
  <!-- Nose -->
  <path d="M 150 70 L 120 120 L 120 180 L 150 180 L 150 70 Z" fill="white" stroke="black" stroke-width="2"/>
  <path d="M 250 70 L 280 120 L 280 180 L 250 180 L 250 70 Z" fill="white" stroke="black" stroke-width="2"/>
  <rect x="150" y="70" width="100" height="110" fill="${teamColor}" stroke="black" stroke-width="2"/>
  
  <!-- Front Wheels -->
  <rect x="80" y="160" width="40" height="100" fill="black" stroke="black" stroke-width="2" rx="4"/>
  <rect x="280" y="160" width="40" height="100" fill="black" stroke="black" stroke-width="2" rx="4"/>
  
  <!-- Main Body - Front Section -->
  <path d="M 120 180 L 120 300 L 140 320 L 260 320 L 280 300 L 280 180 L 120 180 Z"
        fill="${teamColor}" stroke="black" stroke-width="2"/>
  
  <!-- Cockpit -->
  <ellipse cx="200" cy="250" rx="40" ry="60" fill="#e5e5e5" stroke="black" stroke-width="2"/>
  
  <!-- Main Body - Middle Section -->
  <rect x="140" y="320" width="120" height="200" fill="${teamColor}" stroke="black" stroke-width="2"/>
  
  <!-- Side Pods -->
  <path d="M 50 300 L 140 320 L 140 520 L 50 540 L 50 300 Z"
        fill="${teamColor}" stroke="black" stroke-width="2"/>
  <path d="M 350 300 L 260 320 L 260 520 L 350 540 L 350 300 Z"
       fill="${teamColor}" stroke="black" stroke-width="2"/>
  
  <!-- Rear Wheels -->
  <rect x="60" y="480" width="50" height="120" fill="black" stroke="black" stroke-width="2" rx="4"/>
  <rect x="290" y="480" width="50" height="120" fill="black" stroke="black" stroke-width="2" rx="4"/>
  
  <!-- Rear Body -->
  <path d="M 140 520 L 100 600 L 100 650 L 140 680 L 260 680 L 300 650 L 300 600 L 260 520 L 140 520 Z"
        fill="${teamColor}" stroke="black" stroke-width="2"/>
  
  <!-- Engine Cover -->
  <rect x="170" y="560" width="60" height="100" fill="#f0f0f0" stroke="black" stroke-width="2" rx="4"/>
  
  <!-- Rear Wing -->
  <rect x="80" y="690" width="240" height="25" fill="${teamColor}"" stroke="black" stroke-width="2" rx="4"/>
  <rect x="60" y="720" width="280" height="30" fill="${teamColor}" stroke="black" stroke-width="2" rx="4"/>
      </svg>
`;}





export function pitstopSVG(teamName = "Team") {
  return ` 
      <svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Large Blank Sign on Top -->
  <rect x="80" y="20" width="440" height="80" fill="white" stroke="black" stroke-width="3" rx="4"/>
  
  <!-- Sign Support Structure -->
  <rect x="100" y="100" width="10" height="30" fill="#666" stroke="black" stroke-width="2"/>
  <rect x="490" y="100" width="10" height="30" fill="#666" stroke="black" stroke-width="2"/>
  
  <!-- Support Poles -->
  <rect x="200" y="100" width="12" height="300" fill="#888" stroke="black" stroke-width="2"/>
  <rect x="388" y="100" width="12" height="300" fill="#888" stroke="black" stroke-width="2"/>
  
  <!-- Main Garage Structure -->
  <rect x="80" y="130" width="440" height="270" fill="#d0d0d0" stroke="black" stroke-width="3"/>
  
  <!-- Darker Side Sections -->
  <rect x="80" y="130" width="80" height="270" fill="#a8a8a8" stroke="black" stroke-width="2"/>
  <rect x="440" y="130" width="80" height="270" fill="#a8a8a8" stroke="black" stroke-width="2"/>
  
  <!-- Timing Board -->
  <rect x="90" y="240" width="50" height="80" fill="#4a4a4a" stroke="black" stroke-width="2"/>
  
  <!-- Center Opening -->
  <rect x="160" y="200" width="280" height="200" fill="#e0e0e0" stroke="black" stroke-width="2"/>
  
  <!-- Equipment Shelf -->
  <rect x="180" y="210" width="240" height="40" fill="#b0b0b0" stroke="black" stroke-width="2"/>
  
  <!-- Tools on Shelf -->
  <circle cx="200" cy="230" r="5" fill="#333"/>
  <circle cx="220" cy="230" r="5" fill="#333"/>
  <circle cx="240" cy="230" r="5" fill="#333"/>
  <circle cx="260" cy="230" r="5" fill="#333"/>
  <circle cx="280" cy="230" r="5" fill="#333"/>
  
  <!-- Ground -->
  <rect x="50" y="400" width="500" height="100" fill="#c0c0c0" stroke="black" stroke-width="3"/>
  
  <!-- Yellow Markings -->
  <rect x="50" y="400" width="40" height="100" fill="#ffd700" opacity="0.7"/>
  <rect x="510" y="400" width="40" height="100" fill="#ffd700" opacity="0.7"/>
  <polygon points="70,400 90,400 110,500 90,500" fill="#2a2a2a" opacity="0.3"/>
  <polygon points="510,400 530,400 550,500 530,500" fill="#2a2a2a" opacity="0.3"/>
  
  <!-- Tires Left -->
  <ellipse cx="100" cy="450" rx="25" ry="10" fill="#1a1a1a" stroke="black" stroke-width="2"/>
  <rect x="75" y="420" width="50" height="30" fill="#2a2a2a" stroke="black" stroke-width="2"/>
  <ellipse cx="100" cy="420" rx="25" ry="10" fill="#1a1a1a" stroke="black" stroke-width="2"/>
  <circle cx="100" cy="435" r="12" fill="#d4af37" stroke="black" stroke-width="1"/>
  
  <!-- Tires Right -->
  <ellipse cx="500" cy="450" rx="25" ry="10" fill="#1a1a1a" stroke="black" stroke-width="2"/>
  <rect x="475" y="420" width="50" height="30" fill="#2a2a2a" stroke="black" stroke-width="2"/>
  <ellipse cx="500" cy="420" rx="25" ry="10" fill="#1a1a1a" stroke="black" stroke-width="2"/>
  <circle cx="500" cy="435" r="12" fill="#d4af37" stroke="black" stroke-width="1"/>
  
  <!-- Tires Center -->
  <ellipse cx="220" cy="460" rx="30" ry="30" fill="#2a2a2a" stroke="black" stroke-width="2"/>
  <circle cx="220" cy="460" r="15" fill="#d4af37" stroke="black" stroke-width="1"/>
  <circle cx="220" cy="460" r="10" fill="#1a1a1a"/>
  
  <ellipse cx="380" cy="460" rx="30" ry="30" fill="#2a2a2a" stroke="black" stroke-width="2"/>
  <circle cx="380" cy="460" r="15" fill="#d4af37" stroke="black" stroke-width="1"/>
  <circle cx="380" cy="460" r="10" fill="#1a1a1a"/>
  
  <!-- Extra Tires -->
  <ellipse cx="60" cy="480" rx="20" ry="8" fill="#1a1a1a" stroke="black" stroke-width="2"/>
  <ellipse cx="540" cy="480" rx="20" ry="8" fill="#1a1a1a" stroke="black" stroke-width="2"/>
  
  <!-- Traffic Cones -->
  <polygon points="280,480 270,490 290,490" fill="#ff4500" stroke="black" stroke-width="1"/>
  <rect x="275" y="490" width="10" height="5" fill="#ff4500"/>
  
  <polygon points="320,480 310,490 330,490" fill="#ff4500" stroke="black" stroke-width="1"/>
  <rect x="315" y="490" width="10" height="5" fill="#ff4500"/>
</svg>
`;
}