import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.API_BASE_URL || "http://localhost:8080/api";

const server = new Server(
  { name: "ocs-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Helper to fetch, update, and save location sceneData
async function updateSceneData(locationId: string, updater: (sceneData: any) => void) {
  // 1. Fetch current location
  const getRes = await fetch(`${API_BASE}/locations/${locationId}`);
  if (!getRes.ok) throw new Error(`Location not found: ${locationId}`);
  const location = await getRes.json();
  
  // 2. Parse existing sceneData
  let sceneData: any = {};
  if (location.sceneData) {
    try {
      sceneData = JSON.parse(location.sceneData);
    } catch (e) {
      sceneData = {};
    }
  }

  // Ensure base arrays exist
  sceneData.tracks = sceneData.tracks || [];
  sceneData.foundations = sceneData.foundations || [];
  sceneData.poles = sceneData.poles || [];
  sceneData.cantilevers = sceneData.cantilevers || [];
  sceneData.vanes = sceneData.vanes || [];

  // 3. Apply updates
  updater(sceneData);

  // 4. Save back to API
  const putRes = await fetch(`${API_BASE}/locations/${locationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: location.name,
      sceneData: JSON.stringify(sceneData),
    }),
  });

  if (!putRes.ok) throw new Error(`Failed to update location: ${putRes.statusText}`);
  return await putRes.json();
}

// Setup tool list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_track",
        description: "Creates a new track in the location's sceneData.",
        inputSchema: {
          type: "object",
          properties: {
            locationId: { type: "string" },
            trackData: { type: "object", description: "Track properties (e.g. alignment, coordinates)" },
          },
          required: ["locationId", "trackData"],
        },
      },
      {
        name: "create_pole",
        description: "Creates a new pole in the location's sceneData.",
        inputSchema: {
          type: "object",
          properties: {
            locationId: { type: "string" },
            poleData: { type: "object", description: "Pole properties (x, z, label, etc.)" },
          },
          required: ["locationId", "poleData"],
        },
      },
      {
        name: "create_cantilever",
        description: "Creates a new cantilever in the location's sceneData.",
        inputSchema: {
          type: "object",
          properties: {
            locationId: { type: "string" },
            cantileverData: { type: "object", description: "Cantilever properties (x1, z1, x2, z2, contactWireHeight, etc.)" },
          },
          required: ["locationId", "cantileverData"],
        },
      },
      {
        name: "create_vane",
        description: "Creates a new vane in the location's sceneData.",
        inputSchema: {
          type: "object",
          properties: {
            locationId: { type: "string" },
            vaneData: { type: "object", description: "Vane properties (cantileverIdx1, cantileverIdx2, poleIdx, etc.)" },
          },
          required: ["locationId", "vaneData"],
        },
      }
    ],
  };
});

// Setup tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "create_track": {
        const { locationId, trackData } = request.params.arguments as any;
        await updateSceneData(locationId, (data) => data.tracks.push(trackData));
        return { content: [{ type: "text", text: `Track created in location ${locationId}` }] };
      }
      case "create_pole": {
        const { locationId, poleData } = request.params.arguments as any;
        await updateSceneData(locationId, (data) => data.poles.push(poleData));
        return { content: [{ type: "text", text: `Pole created in location ${locationId}` }] };
      }
      case "create_cantilever": {
        const { locationId, cantileverData } = request.params.arguments as any;
        await updateSceneData(locationId, (data) => data.cantilevers.push(cantileverData));
        return { content: [{ type: "text", text: `Cantilever created in location ${locationId}` }] };
      }
      case "create_vane": {
        const { locationId, vaneData } = request.params.arguments as any;
        await updateSceneData(locationId, (data) => data.vanes.push(vaneData));
        return { content: [{ type: "text", text: `Vane created in location ${locationId}` }] };
      }
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

const app = express();
let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No active SSE connection");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.error(`OCS MCP Server running on SSE at http://localhost:${PORT}`);
});
