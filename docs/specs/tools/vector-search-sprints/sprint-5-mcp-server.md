# Sprint 5 — MCP Server

> **Goal:** Create the MCP embedding server that exposes embedding operations
> over stdio transport — matching the existing `mcp/calculator-server.ts` pattern.
> This gives CLI access, external tool access, and decoupled embedding for
> CPU-intensive operations.
> **Spec ref:** §11.1–11.4
> **Prerequisite:** Sprint 4 complete (full hybrid search wired)

---

## Task 5.1 — MCP embedding server scaffold

**What:** Create the MCP server entry point following the existing calculator
server pattern. Uses `@modelcontextprotocol/sdk` with `StdioServerTransport`.

| Item | Detail |
| --- | --- |
| **Create** | `mcp/embedding-server.ts` |
| **Spec** | §11.1–11.3 |

### Server structure

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "embedding-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Tool definitions + handlers (Task 5.2)

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

### Package script

```json
{
  "scripts": {
    "mcp:embeddings": "tsx mcp/embedding-server.ts"
  }
}
```

### Verify

```bash
npm run build   # passes
```

---

## Task 5.2 — MCP tools (6 tools)

**What:** Implement the 6 MCP tools. Each tool is a thin transport layer that
delegates to `EmbeddingPipeline`, `VectorStore`, or `Embedder` from core.

| Item | Detail |
| --- | --- |
| **Add to** | `mcp/embedding-server.ts` |
| **Modify** | `package.json` — add `mcp:embeddings` script |
| **Spec** | §11.2 |
| **Reqs** | VSEARCH-30 through VSEARCH-34 |

### Tool definitions

| Tool | Description | Input | Delegates to |
| --- | --- | --- | --- |
| `embed_text` | Embed arbitrary text, return vector | `{text: string}` | `Embedder.embed()` |
| `embed_document` | Chunk + embed + store a document | `{source_type, source_id, content}` | `EmbeddingPipeline.indexDocument()` |
| `search_similar` | Vector similarity search | `{query, source_type?, limit?}` | `HybridSearchEngine.search()` |
| `rebuild_index` | Full or incremental rebuild | `{source_type, force?}` | `EmbeddingPipeline.rebuildAll()` |
| `get_index_stats` | Embedding counts, coverage | `{source_type?}` | `VectorStore.count()` |
| `delete_embeddings` | Remove embeddings for a source | `{source_id}` | `VectorStore.delete()` |

### Handler pattern (per tool)

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "embed_text": {
      const embedding = await embedder.embed(args.text);
      return { content: [{ type: "text", text: JSON.stringify({ dimensions: embedding.length }) }] };
    }
    case "embed_document": {
      const pipeline = factory.createForSource(args.source_type);
      const result = await pipeline.indexDocument({ ... });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
    // ... remaining tools
  }
});
```

### Verify

```bash
echo '{"method":"tools/list","params":{}}' | npm run mcp:embeddings
# Should return list of 6 tools
```

---

## Task 5.3 — MCP integration tests

**What:** Integration tests that spin up the MCP server via stdio transport and
exercise all 6 tools.

| Item | Detail |
| --- | --- |
| **Create** | `tests/search/mcp-embedding-server.test.ts` |
| **Spec** | Phase 6.26 |

### Tests (`tests/search/mcp-embedding-server.test.ts`)

| Test ID | Scenario |
| --- | --- |
| TEST-VS-33 | `embed_text` returns 384-dimensional vector description |
| TEST-VS-34 | `embed_document` chunks and stores embeddings in VectorStore |
| TEST-VS-35 | `search_similar` returns ranked results for a query |
| TEST-VS-36 | `rebuild_index` processes chapters and reports stats |
| TEST-VS-37 | `get_index_stats` returns counts by source_type and chunk_level |

### Verify

```bash
npx vitest run tests/search/mcp-embedding-server.test.ts   # 5 tests pass
npm run build && npm test                                   # all tests green
```

---

## Sprint 5 — Completion Checklist

- [ ] `mcp/embedding-server.ts` follows existing calculator server pattern
- [ ] 6 MCP tools: embed_text, embed_document, search_similar, rebuild_index, get_index_stats, delete_embeddings
- [ ] Each tool delegates to core — server is a thin transport layer
- [ ] `npm run mcp:embeddings` script added to package.json
- [ ] ~5 integration tests via stdio transport
- [ ] `npm run build && npm test` — all tests green
- [ ] Total project: 213 + ~60 = ~273 tests passing
