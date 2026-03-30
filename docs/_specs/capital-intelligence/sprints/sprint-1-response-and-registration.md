# Sprint 1 - Response and Registration

> **Goal:** Add response translation, error handling, and ToolDescriptor registration.
> **Spec Sections:** `MCP-049` through `MCP-054`

## Tasks

1. **Response Translation logic**: Update `mcp/capital-intelligence-tool.ts` to normalize MCP responses from `{ success, data, error }` to the Studio Ordo `{ results: [...] }` format.
2. **Error Translation logic**: Implement logic to detect `success: false` in MCP responses and throw a meaningful system exception instead of returning a success payload.
3. **Finalize ToolDescriptor**: Ensure `src/core/use-cases/tools/get-capital-events.tool.ts` consumes the translated results correctly.
4. **Registration Wiring**: Confirm the registry is properly initialized in `src/lib/chat/tool-composition-root.ts` with any required dependencies (Docker path, etc.).
5. **Add Response Tests**: Expand `tests/mcp/capital-intelligence-tool.test.ts` to cover successful translation, empty results, and error lifting.

## Completion Checklist

- [x] MCP response normalization to `{ results: [] }`
- [x] Error lifting from MCP failures to thrown exceptions
- [x] ToolDescriptor finalized and wired
- [x] Tool registration confirmed in composition root
- [x] Tests for translation and error handling passing

## QA Deviations

None.

## Verification

- `npx vitest tests/mcp/capital-intelligence-tool.test.ts`
- `npx tsc --noEmit`
- `npm run build`
