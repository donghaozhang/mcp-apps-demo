import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const RESOURCE_MIME_TYPE = "text/html";

// Interactive clock HTML app
const clockHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      padding: 20px;
    }
    .clock {
      font-size: 48px;
      font-weight: 700;
      letter-spacing: 2px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
      margin-bottom: 10px;
    }
    .date {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 20px;
    }
    .timezone {
      font-size: 14px;
      opacity: 0.7;
      background: rgba(255,255,255,0.15);
      padding: 6px 16px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    button {
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.4);
      color: white;
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover {
      background: rgba(255,255,255,0.3);
      border-color: white;
    }
    .server-time {
      margin-top: 15px;
      font-size: 14px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="clock" id="clock">--:--:--</div>
  <div class="date" id="date">Loading...</div>
  <div class="timezone" id="tz">🌏 Detecting timezone...</div>
  <button id="getServerTime">📡 Get Server Time</button>
  <div class="server-time" id="serverTime"></div>

  <script type="module">
    import { App } from "https://esm.sh/@modelcontextprotocol/ext-apps";

    const app = new App({ name: "Clock App", version: "1.0.0" });
    
    try {
      await app.connect();
    } catch(e) {
      // Running standalone without MCP host
    }

    function updateClock() {
      const now = new Date();
      document.getElementById('clock').textContent = now.toLocaleTimeString();
      document.getElementById('date').textContent = now.toLocaleDateString('en-AU', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      document.getElementById('tz').textContent = '🌏 ' + Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    updateClock();
    setInterval(updateClock, 1000);

    // MCP tool result handler
    app.ontoolresult = (result) => {
      const time = result.content?.find(c => c.type === "text")?.text;
      document.getElementById('serverTime').textContent = '📡 Server: ' + (time ?? '[ERROR]');
    };

    document.getElementById('getServerTime').addEventListener('click', async () => {
      try {
        await app.callServerTool({ name: "get-time", arguments: {} });
      } catch(e) {
        document.getElementById('serverTime').textContent = '⚠️ Not connected to MCP host';
      }
    });
  </script>
</body>
</html>`;

// Dashboard HTML app
const dashboardHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #1a1a2e;
      color: white;
      padding: 20px;
      min-height: 400px;
    }
    h2 { margin-bottom: 20px; color: #e94560; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .card .value {
      font-size: 32px;
      font-weight: 700;
      color: #0f3460;
      background: linear-gradient(135deg, #e94560, #0f3460);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .card .label {
      font-size: 12px;
      opacity: 0.6;
      margin-top: 5px;
      text-transform: uppercase;
    }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 120px;
      padding: 10px 0;
    }
    .bar {
      flex: 1;
      background: linear-gradient(to top, #e94560, #0f3460);
      border-radius: 4px 4px 0 0;
      min-width: 30px;
      position: relative;
      transition: height 0.5s;
    }
    .bar-label {
      position: absolute;
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <h2>📊 System Dashboard</h2>
  <div class="grid">
    <div class="card">
      <div class="value" id="cpu">--</div>
      <div class="label">CPU Usage</div>
    </div>
    <div class="card">
      <div class="value" id="mem">--</div>
      <div class="label">Memory</div>
    </div>
    <div class="card">
      <div class="value" id="uptime">--</div>
      <div class="label">Uptime (h)</div>
    </div>
    <div class="card">
      <div class="value" id="requests">--</div>
      <div class="label">Requests/s</div>
    </div>
  </div>
  <h3 style="margin-bottom:10px;opacity:0.7">Traffic (last 7 days)</h3>
  <div class="bar-chart" id="chart"></div>

  <script>
    function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    
    function update() {
      document.getElementById('cpu').textContent = rand(20, 85) + '%';
      document.getElementById('mem').textContent = rand(40, 75) + '%';
      document.getElementById('uptime').textContent = rand(100, 999);
      document.getElementById('requests').textContent = rand(50, 500);
    }

    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const chart = document.getElementById('chart');
    days.forEach(d => {
      const h = rand(20, 100);
      chart.innerHTML += '<div class="bar" style="height:' + h + '%"><span class="bar-label">' + d + '</span></div>';
    });

    update();
    setInterval(update, 3000);
  </script>
</body>
</html>`;

// Create MCP Server
const server = new McpServer({
  name: "mcp-apps-demo",
  version: "1.0.0",
});

// Register tools
const clockResourceUri = "ui://get-time/clock.html";
const dashboardResourceUri = "ui://dashboard/dashboard.html";

// Tool: get-time with interactive clock UI
server.tool(
  "get-time",
  "Shows an interactive clock with current time. Returns both server time and a rich interactive clock UI.",
  {},
  async () => ({
    content: [
      { type: "text", text: `Current server time: ${new Date().toISOString()}` },
      { type: "resource", resource: { uri: clockResourceUri, mimeType: RESOURCE_MIME_TYPE, text: clockHtml } }
    ],
  })
);

// Tool: dashboard with system metrics UI
server.tool(
  "show-dashboard",
  "Shows an interactive system metrics dashboard with CPU, memory, and traffic data.",
  {},
  async () => ({
    content: [
      { type: "text", text: JSON.stringify({
        cpu: Math.floor(Math.random() * 60 + 20) + "%",
        memory: Math.floor(Math.random() * 40 + 40) + "%",
        uptime: Math.floor(process.uptime()) + "s",
        timestamp: new Date().toISOString()
      }) },
      { type: "resource", resource: { uri: dashboardResourceUri, mimeType: RESOURCE_MIME_TYPE, text: dashboardHtml } }
    ],
  })
);

// Register UI resources
server.resource(
  "clock-ui",
  clockResourceUri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => ({
    contents: [{ uri: clockResourceUri, mimeType: RESOURCE_MIME_TYPE, text: clockHtml }],
  })
);

server.resource(
  "dashboard-ui",
  dashboardResourceUri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => ({
    contents: [{ uri: dashboardResourceUri, mimeType: RESOURCE_MIME_TYPE, text: dashboardHtml }],
  })
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP Apps Demo server running on stdio");
