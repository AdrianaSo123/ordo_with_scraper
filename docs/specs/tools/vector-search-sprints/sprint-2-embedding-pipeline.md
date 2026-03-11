# Sprint 2 — Embedding Pipeline

> **Goal:** Wire up the embedding model, build the orchestration pipeline, and
> create the build script. After this sprint, running `npm run build:search-index`
> populates the SQLite `embeddings` table with real vectors from book content.
> **Spec ref:** §4.1–4.5, §9.1–9.4
> **Prerequisite:** Sprint 1 complete (chunker, SQLite stores)

---

## Task 2.1 — LocalEmbedder adapter (ONNX model wrapper)

**What:** Implement the `Embedder` port using `@huggingface/transformers` with
the `all-MiniLM-L6-v2` ONNX model. The model downloads on first use (~23MB)
and is cached in `~/.cache/`.

| Item | Detail |
| --- | --- |
| **Install** | `npm install @huggingface/transformers` |
| **Create** | `src/adapters/LocalEmbedder.ts` |
| **Create** | `tests/search/local-embedder.test.ts` |
| **Modify** | `package.json` — new dependency |
| **Spec** | §4.1, §4.2 |

### Key behaviors

```typescript
class LocalEmbedder implements Embedder {
  private pipeline: FeatureExtractionPipeline | null = null;

  async embed(text: string): Promise<Float32Array> {
    const pipe = await this.getPipeline();
    const output = await pipe(text, { pooling: "mean", normalize: false });
    return new Float32Array(output.data);
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    // Batch for efficiency — model handles multiple inputs
  }

  dimensions(): number { return 384; }

  isReady(): boolean { return this.pipeline !== null; }

  private async getPipeline(): Promise<FeatureExtractionPipeline> {
    if (!this.pipeline) {
      const { pipeline } = await import("@huggingface/transformers");
      this.pipeline = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    return this.pipeline;
  }
}
```

### Tests (`tests/search/local-embedder.test.ts`)

| Test ID | Scenario |
| --- | --- |
| TEST-VS-33 | `embed()` returns 384-dimensional Float32Array |
| — | `embedBatch()` returns array of 384-dim vectors |
| — | `isReady()` returns true after first `embed()` call |

### Verify

```bash
npx vitest run tests/search/local-embedder.test.ts   # 3 tests pass (slow — model download)
npm run build
```

---

## Task 2.2 — ChangeDetector + EmbeddingPipeline + EmbeddingPipelineFactory

**What:** Implement the three orchestration components. `ChangeDetector` handles
content hash comparison (UB-2). `EmbeddingPipeline` coordinates chunk → embed →
normalize → store. `EmbeddingPipelineFactory` constructs pipelines per source
type (GoF-2).

| Item | Detail |
| --- | --- |
| **Create** | `src/core/search/ChangeDetector.ts` |
| **Create** | `src/core/search/EmbeddingPipeline.ts` |
| **Create** | `src/core/search/EmbeddingPipelineFactory.ts` |
| **Create** | `tests/search/embedding-pipeline.test.ts` |
| **Spec** | §4.3, §4.4, §4.5 |
| **Reqs** | VSEARCH-22, VSEARCH-23, VSEARCH-25, VSEARCH-42, VSEARCH-45 |

### `ChangeDetector` (UB-2)

```typescript
class ChangeDetector {
  constructor(private vectorStore: VectorStore) {}

  hasChanged(sourceId: string, contentHash: string): boolean {
    const storedHash = this.vectorStore.getContentHash(sourceId);
    return storedHash !== contentHash;
  }

  findOrphaned(sourceType: string, activeSourceIds: Set<string>): string[] {
    const stored = this.vectorStore.getAll({ sourceType });
    const storedIds = new Set(stored.map(r => r.sourceId));
    return [...storedIds].filter(id => !activeSourceIds.has(id));
  }
}
```

### `EmbeddingPipeline`

```typescript
class EmbeddingPipeline {
  constructor(
    private chunker: Chunker,
    private embedder: Embedder,
    private vectorStore: VectorStore,
    private changeDetector: ChangeDetector,
    private modelVersion: string,
  ) {}

  async indexDocument(params: {
    sourceType: string;
    sourceId: string;
    content: string;
    contentHash: string;
    metadata: ChunkMetadata;
  }): Promise<IndexResult> {
    // 1. Check change via ChangeDetector (UB-2)
    // 2. Check model version via vectorStore.getModelVersion()
    // 3. If unchanged & model matches → skip
    // 4. Chunk content (metadata passed for prefix — GH-2)
    // 5. Embed all chunks (batched)
    // 6. L2-normalize each vector (GH-3)
    // 7. Upsert into VectorStore (delete old first)
  }

  async rebuildAll(sourceType: string, documents: DocumentInput[]): Promise<RebuildResult> {
    // For each doc → indexDocument
    // Detect orphans via ChangeDetector.findOrphaned()
  }
}
```

### `EmbeddingPipelineFactory` (GoF-2)

```typescript
class EmbeddingPipelineFactory {
  constructor(
    private embedder: Embedder,
    private vectorStore: VectorStore,
    private modelVersion: string,
  ) {}

  createForSource(sourceType: "book_chunk" | "conversation"): EmbeddingPipeline {
    const chunker = sourceType === "book_chunk"
      ? new MarkdownChunker()
      : new ConversationChunker();  // future
    const changeDetector = new ChangeDetector(this.vectorStore);
    return new EmbeddingPipeline(chunker, this.embedder, this.vectorStore, changeDetector, this.modelVersion);
  }
}
```

### Tests (`tests/search/embedding-pipeline.test.ts`)

| Test ID | Scenario |
| --- | --- |
| TEST-VS-22 | Unchanged chapter (same hash) → skipped during rebuild |
| TEST-VS-23 | Modified chapter (different hash) → old chunks deleted, new created |
| TEST-VS-24 | Deleted chapter → orphans removed |
| TEST-VS-42 | `ChangeDetector.hasChanged()` true for different hash, false for same |
| TEST-VS-43 | `ChangeDetector.findOrphaned()` returns orphaned sourceIds |
| TEST-VS-47 | `EmbeddingPipelineFactory.createForSource("book_chunk")` → MarkdownChunker pipeline |
| TEST-VS-59 | Model version mismatch triggers re-embedding |
| TEST-VS-60 | New embeddings stored with current model_version |

### Verify

```bash
npx vitest run tests/search/embedding-pipeline.test.ts   # 8 tests pass
npm run build
```

---

## Task 2.3 — EmbeddingValidator (build-time quality checks — GH-1)

**What:** Implement the build-time embedding quality validation. Embeds known
semantic pairs and asserts similarity thresholds.

| Item | Detail |
| --- | --- |
| **Create** | `src/core/search/EmbeddingValidator.ts` |
| **Create** | `tests/search/embedding-validator.test.ts` |
| **Spec** | §9.1 (step 7) |
| **Reqs** | VSEARCH-50 |

### Key behaviors

```typescript
interface ValidationPair {
  textA: string;
  textB: string;
  expectedSimilar: boolean;
}

const VALIDATION_PAIRS: ValidationPair[] = [
  { textA: "WCAG contrast ratios", textB: "accessibility color guidelines", expectedSimilar: true },
  { textA: "mobile responsive design", textB: "adaptive layout breakpoints", expectedSimilar: true },
  { textA: "user experience heuristics", textB: "UX usability principles", expectedSimilar: true },
  { textA: "agile sprint planning", textB: "SQL database normalization", expectedSimilar: false },
  { textA: "CSS flexbox alignment", textB: "project management methodology", expectedSimilar: false },
];

async function validateEmbeddingQuality(embedder: Embedder): Promise<ValidationResult> {
  const SIMILAR_THRESHOLD = 0.7;
  const DISSIMILAR_THRESHOLD = 0.3;
  // Embed pairs, L2-normalize, compute dot product, check thresholds
}
```

### Tests (`tests/search/embedding-validator.test.ts`)

| Test ID | Scenario |
| --- | --- |
| TEST-VS-54 | Known similar pairs produce similarity > 0.7 |
| TEST-VS-55 | Known dissimilar pairs produce similarity < 0.3 |

### Verify

```bash
npx vitest run tests/search/embedding-validator.test.ts   # 2 tests pass
```

---

## Task 2.4 — Build script (`scripts/build-search-index.ts`)

**What:** Create the CLI build script that chunks all book chapters, embeds them,
and persists to SQLite. Runs incrementally by default, with `--force` for full
rebuild. Includes quality validation.

| Item | Detail |
| --- | --- |
| **Create** | `scripts/build-search-index.ts` |
| **Spec** | §9.1–9.4 |
| **Reqs** | VSEARCH-18, VSEARCH-19, VSEARCH-20, VSEARCH-21 |

### Script flow

```text
1. Load embedding model (first run downloads ~23MB ONNX)
2. Check model version against stored embeddings (GH-4)
3. Load all chapters via FileSystemBookRepository
4. For each chapter:
   a. ChangeDetector.hasChanged(sourceId, hash) (UB-2)
   b. If unchanged & model matches → skip
   c. Chunk → transform → embed → L2-normalize → upsert
5. ChangeDetector.findOrphaned() → delete orphans
6. Rebuild BM25 index → persist via BM25IndexStore (UB-3)
7. Validate embedding quality (GH-1)
8. Print stats
```

### Package scripts

```json
{
  "scripts": {
    "build:search-index": "tsx scripts/build-search-index.ts",
    "build:search-index:force": "tsx scripts/build-search-index.ts --force",
    "prebuild": "npm run build:search-index"
  }
}
```

### Verify

```bash
npm run build:search-index
# Output:
#   Chapters: 104 (104 new, 0 updated, 0 unchanged)
#   Chunks: ~2024 total
#   Model: all-MiniLM-L6-v2@1.0
#   Quality: 5/5 pairs passed
#   Time: ~45-60s (full rebuild)

# Run again (incremental):
npm run build:search-index
# Output:
#   Chapters: 104 (0 new, 0 updated, 104 unchanged)
#   Time: ~0.5s
```

---

## Task 2.5 — On-demand embedding API

**What:** Wire `EmbeddingPipelineFactory` into the composition root so runtime
code can on-demand embed a single document without a full rebuild.

| Item | Detail |
| --- | --- |
| **Add to** | `src/lib/chat/tool-composition-root.ts` (factory accessor only — no tool changes yet) |
| **Spec** | §10.1–10.3 |
| **Reqs** | VSEARCH-22 |

### Integration point

```typescript
const MODEL_VERSION = "all-MiniLM-L6-v2@1.0";

export function getEmbeddingPipelineFactory(): EmbeddingPipelineFactory {
  if (!factory) {
    factory = new EmbeddingPipelineFactory(
      new LocalEmbedder(),
      new SQLiteVectorStore(getDb()),
      MODEL_VERSION,
    );
  }
  return factory;
}

export function getBookPipeline(): EmbeddingPipeline {
  return getEmbeddingPipelineFactory().createForSource("book_chunk");
}
```

### Tests

| Test ID | Scenario |
| --- | --- |
| TEST-VS-25 | On-demand `indexDocument()` embeds a single chapter in <5 seconds |

### Verify

```bash
npm run build && npm test   # all tests green — no runtime changes
```

---

## Sprint 2 — Completion Checklist

- [ ] `@huggingface/transformers` installed, `LocalEmbedder` wraps ONNX runtime
- [ ] `ChangeDetector` handles hash comparison + orphan detection (UB-2)
- [ ] `EmbeddingPipeline` orchestrates chunk → embed → normalize → store
- [ ] `EmbeddingPipelineFactory` constructs pipelines per source type (GoF-2)
- [ ] `EmbeddingValidator` validates embedding quality at build time (GH-1)
- [ ] `build-search-index.ts` runs incrementally by default
- [ ] On-demand API accessible via composition root
- [ ] ~10 new tests passing
- [ ] `npm run build:search-index` populates `embeddings` table with real vectors
- [ ] `npm run build && npm test` — all tests green
