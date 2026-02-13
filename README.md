# MCP Apps Demo

Interactive HTML UIs rendered inside AI chat via [MCP Apps](https://modelcontextprotocol.io/docs/extensions/apps) — a new MCP extension that lets tools return rich, interactive UI instead of plain text.

## Screenshots

### 🔧 MCP Server Interaction (Before → Rendering)
The server handles JSON-RPC calls and returns both structured data AND interactive HTML:

![MCP Interaction](screenshots/mcp-interaction.png)

### ⏰ Clock App (Rendered UI)
Real-time interactive clock with timezone display and server time fetching.

![Clock App](screenshots/clock-app.png)

### 📊 System Dashboard (Rendered UI)
Live system metrics dashboard with CPU, memory, uptime stats and weekly traffic charts.

![Dashboard](screenshots/dashboard.png)

## What is MCP Apps?

MCP Apps extends the [Model Context Protocol](https://modelcontextprotocol.io/) to allow tools to return **interactive HTML content** that renders directly in the chat UI. Instead of getting a text response like `"The time is 3:15 PM"`, the AI can show you a beautiful, interactive clock widget.

This demo includes two tools:
- **`get-time`** — Returns an interactive clock UI with live updating time
- **`show-dashboard`** — Returns a system metrics dashboard with animated charts

## Quick Start

### 1. Install dependencies
```bash
cd mcp-apps-demo
npm install
```

### 2. Add to Claude Desktop

Edit your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "mcp-apps-demo": {
      "command": "node",
      "args": ["/path/to/mcp-apps-demo/server.js"]
    }
  }
}
```

### 3. Add to Claude Code
```bash
claude mcp add mcp-apps-demo node /path/to/mcp-apps-demo/server.js
```

### 4. Try it out

Ask Claude: *"What time is it?"* or *"Show me the system dashboard"*

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Desktop                         │
│                                                             │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────────┐  │
│  │   User   │───▶│  Claude   │───▶│   MCP Client         │  │
│  │  "What   │    │  (LLM)    │    │   (JSON-RPC over     │  │
│  │  time?"  │    │           │    │    stdio)             │  │
│  └──────────┘    └───────────┘    └──────────┬───────────┘  │
│                                              │              │
│                                     JSON-RPC │ request      │
│                                   tools/call │              │
│                                              ▼              │
│                                  ┌───────────────────────┐  │
│                                  │   MCP Server          │  │
│                                  │   (server.js)         │  │
│                                  │                       │  │
│                                  │  tool("get-time")     │  │
│                                  │  tool("show-dashboard")│  │
│                                  └──────────┬────────────┘  │
│                                             │               │
│                                    response │               │
│                                  ┌──────────┴────────────┐  │
│                                  │  content: [           │  │
│                                  │   { type: "text" },   │  │
│                                  │   { type: "resource", │  │
│                                  │     mimeType: "text/  │  │
│                                  │     html", ... }      │  │
│                                  │  ]                    │  │
│                                  └──────────┬────────────┘  │
│                                             │               │
│                                             ▼               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Chat UI (iframe sandbox)                  │   │
│  │  ┌────────────────────┐  ┌────────────────────────┐  │   │
│  │  │   ⏰ Clock App     │  │  📊 Dashboard App      │  │   │
│  │  │                    │  │                        │  │   │
│  │  │  14:32:05          │  │  CPU: 45%  MEM: 62%   │  │   │
│  │  │  Thursday,         │  │  ▃▅▇▂▆▄▅             │  │   │
│  │  │  Feb 13, 2026      │  │  Traffic (7 days)     │  │   │
│  │  │                    │  │                        │  │   │
│  │  │  [📡 Server Time]  │  │  Requests/s: 230      │  │   │
│  │  └────────────────────┘  └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Flow

```
1. User asks a question          "What time is it?"
         │
         ▼
2. LLM picks the right tool      get-time / show-dashboard
         │
         ▼
3. MCP Client calls server       JSON-RPC → stdio → server.js
         │
         ▼
4. Server returns content        text (data) + resource (HTML)
         │
         ▼
5. Client renders HTML           Interactive UI in chat iframe
         │
         ▼
6. User interacts with UI        Clicks buttons, sees live data
         │
         ▼
7. UI calls back to server       ext-apps SDK → callServerTool()
   (optional, bidirectional)
```

### Key Concept

Traditional MCP tools return **plain text**. MCP Apps adds the ability to return **interactive HTML** alongside text — the client renders it in a sandboxed iframe directly in the chat.

The HTML app can also **call back** to the MCP server via `@modelcontextprotocol/ext-apps`, enabling true bidirectional interaction (e.g., clicking "Get Server Time" in the clock app triggers a new tool call).

```js
// Server: return HTML UI alongside text
server.tool("get-time", "Interactive clock", {}, async () => ({
  content: [
    { type: "text", text: `Server time: ${new Date().toISOString()}` },
    { type: "resource", resource: {
      uri: "ui://clock/clock.html",
      mimeType: "text/html",
      text: `<html><!-- interactive clock --></html>`
    }}
  ],
}));

// Client (in HTML): call back to server
import { App } from "https://esm.sh/@modelcontextprotocol/ext-apps";
const app = new App({ name: "Clock" });
await app.connect();
await app.callServerTool({ name: "get-time", arguments: {} });
```

## Preview

Open `preview.html` in a browser to see both UIs without needing Claude Desktop.

## Tech Stack

- [MCP SDK](https://www.npmjs.com/package/@modelcontextprotocol/sdk) — Model Context Protocol server
- [MCP Apps Extension](https://www.npmjs.com/package/@modelcontextprotocol/ext-apps) — HTML UI extension
- Vanilla HTML/CSS/JS — No frameworks needed

## License

MIT
