# Sprint 0 - Core Integration

> **Goal:** Implement ToolCommand with validation + MCP client connection.
> **Spec Sections:** `MCP-010` through `MCP-048`

## Tasks

1. **Implement `mcp/capital-intelligence-tool.ts`**: Create the low-level logic to interact with the Docker-based MCP server via stdio. Handle JSON-RPC formatting and response normalization.
2. **Implement `src/core/use-cases/tools/CapitalIntelligenceTool.ts`**: Create the `GetCapitalEventsCommand` class with strict input validation and command-to-mcp wiring.
3. **Implement `src/core/use-cases/tools/get-capital-events.tool.ts`**: Create the `ToolDescriptor` with the Anthropic JSON schema, `ADMIN` roles, and `system` category.
4. **Register in `src/lib/chat/tool-composition-root.ts`**: Import and register the `get_capital_events` tool in the `ToolRegistry`.
5. **Add Unit Tests**: Create tests for MCP response translation (`tests/mcp/capital-intelligence-tool.test.ts`) and command validation (`tests/core/use-cases/tools/get-capital-events.tool.test.ts`).

## Completion Checklist

- [x] Docker-based MCP client implementation
- [x] `GetCapitalEventsCommand` with validation
- [x] `ToolDescriptor` with proper schema and roles
- [x] Tool registered in composition root
- [x] Unit tests for MCP and command logic passing

## QA Deviations

None.

## Verification

- `npx vitest tests/mcp/capital-intelligence-tool.test.ts`
- `npx vitest tests/core/use-cases/tools/get-capital-events.tool.test.ts`
- `npx tsc --noEmit`
- `npm run build`
