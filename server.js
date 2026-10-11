
import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[MCP REQUEST] ${req.method} ${req.path}`);
  next();
});


app.get("/", (req, res) => {
  res.send("My MCP Server is running!");
});

app.post("/mcp", async (req, res) => {
  const server = new McpServer({
    name: "my-mcp-server",
    version: "1.0.0"
  });

  server.registerTool(
    "add",
    {
      description: "Add two numbers",
      inputSchema: {
        a: z.number(),
        b: z.number()
      }
    },
    async ({ a, b }) => ({
      content: [{
        type: "text",
        text: String(a + b)
      }]
    })
  );

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ error: "MCP error" });
    }
  }
});

app.get("/mcp", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

app.delete("/mcp", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`MCP server running on port ${PORT}`);
});
