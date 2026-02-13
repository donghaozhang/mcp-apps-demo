# MCP Apps Demo

Testing [MCP Apps](https://modelcontextprotocol.io/docs/extensions/apps) — interactive HTML UIs rendered inside chat.

## Tools

- **get-time** — Interactive clock with live time display
- **show-dashboard** — System metrics dashboard with charts

## Setup

### Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "mcp-apps-demo": {
      "command": "node",
      "args": ["C:\\Users\\yanie\\Desktop\\mcp-apps-demo\\server.js"]
    }
  }
}
```

### Claude Code
```bash
claude mcp add mcp-apps-demo node C:\Users\yanie\Desktop\mcp-apps-demo\server.js
```

## Test
```bash
node server.js
```
