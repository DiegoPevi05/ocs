# MCP Infrastructure Design Plan: OCS Components

## 1. Overview
The goal of this infrastructure is to provide an AI assistant with the ability to communicate with the backend API (`ocs-api`) to create, read, update, and delete OCS components. This specifically focuses on **tracks**, **foundations**, **cantilevers**, **vanes**, and **poles**.
The AI will be guided by a markdown-based guidance system and will interact with users via a bubble chat interface within the web editor page (`ocs-web`).

## 2. Architecture Components

### 2.1. Dedicated MCP Server (`ocs-mcp`)
A newly created, dedicated package (`ocs-mcp`) will act as the proxy and translation layer between the AI model and the `ocs-api`. 
- **Language/Framework**: Node.js / TypeScript (aligning with the existing repository stack).
- **Responsibilities**:
  - Expose specialized MCP tools for tracks, foundations, cantilevers, vanes, and poles.
  - Authenticate and forward validated requests to the `ocs-api`.
  - Provide structured responses (success, validation errors) back to the AI.
  - Keep AI-specific logic securely separated from the core backend.

### 2.2. Web Frontend (`ocs-web`)
- **Bubble Chat Interface**: A chat widget on the editor page where the user can request the creation or modification of elements.
- **Context Injection**: The frontend will automatically inject the current editor state (location, existing infrastructure like foundations and tracks) into the prompt context so the AI has spatial awareness.

### 2.3. AI Guidance System
- **Guidance `.md` File**: A system prompt or context file that defines the engineering rules, spacing requirements, and design constraints for all components.
- **Workflow**: 
  1. The AI reads the guidance `.md`.
  2. The AI receives the user's request from the bubble chat.
  3. The AI evaluates the request against the rules in the guidance file.
  4. The AI calls the appropriate MCP tools on the `ocs-mcp` server.

## 3. MCP Tools Definition

The `ocs-mcp` server will expose the following tools to the AI:

### Tracks
- `create_track(locationId, specifications)`: Creates a new track alignment.
- `get_tracks(locationId)`: Retrieves existing tracks for spatial awareness.

### Foundations
- `create_foundation(locationId, trackId, position, specifications)`: Creates a foundation at a specific location relative to a track.
- `get_foundations(locationId)`: Retrieves existing foundations.

### Poles
- `create_pole(locationId, foundationId, specifications)`: Creates a pole attached to a given foundation.
- `get_poles(locationId)`: Retrieves existing poles.

### Cantilevers
- `create_cantilever(locationId, poleId, trackId, specifications)`: Creates a new cantilever attached to a specific pole (or foundation) and bridging over a track.
- `get_cantilevers(locationId)`: Retrieves existing cantilevers.

### Vanes
- `create_vane(locationId, cantileverId, specifications)`: Creates a vane, typically attached to or associated with a cantilever or pole.
- `get_vanes(locationId)`: Retrieves existing vanes.

## 4. Implementation Steps

1. **Step 1: Bootstrap the Dedicated MCP Server**
   - Create a new package named `ocs-mcp` within the monorepo workspace.
   - Install the official `@modelcontextprotocol/sdk`.
   - Setup basic server initialization and transport layer (stdio or HTTP/SSE).

2. **Step 2: Define and Implement Tools**
   - Define the JSON schemas for the tools listed above (tracks, foundations, poles, cantilevers, vanes).
   - Implement handlers in `ocs-mcp` that make HTTP requests to the core `ocs-api` endpoints.

3. **Step 3: Create the Guidance Markdown**
   - Draft `ai_guidance.md` containing the business logic and constraints for AI generation.
   - Expose this file to the AI, either as an MCP Resource or by injecting it into the system prompt.

4. **Step 4: Frontend Integration**
   - Implement the bubble chat in the `ocs-web` editor.
   - Connect the chat to the AI provider, passing the guidance context and connecting it to the `ocs-mcp` server.

## 5. Security and Validation
- **Validation**: All tool calls must be strictly validated against JSON schemas in `ocs-mcp` before hitting the `ocs-api`.
- **Authorization**: The `ocs-mcp` server should forward user tokens or use a scoped service account to ensure the AI can only modify permitted locations.
