Here’s a cleaned, polished version you can paste directly into your spec doc (kept your structure but tightened wording, consistency, and formatting):

---

# Capital Intelligence Tool – MCP Integration Spec



> **Status:** Planned
> **Date:** 2026-03-29
> **Scope:** Integration of the external MCP-based capital intelligence system into Studio Ordo as a first-class tool
> **Affects:**
>
> * `src/core/use-cases/tools/`
> * `src/lib/chat/tool-composition-root.ts`
> * ToolCommand execution layer
> * MCP integration boundary
>
> **Motivation:**
> Studio Ordo currently supports only internal tools. The capital intelligence system exists externally as an MCP server and must be integrated in a way that preserves internal contracts, prevents MCP leakage, and maintains deterministic execution.
>
> **Requirement IDs:** `MCP-XXX`

---

## 1. Problem Statement

### 1.1 Verified System Gaps

The current system lacks integration with the capital intelligence MCP service:

1. MCP returns responses in `{ success, data, error }` format, which does not match Studio Ordo’s expected tool output. `[MCP-010]`
2. MCP encodes failures in responses instead of throwing errors, conflicting with Studio Ordo’s exception-based model. `[MCP-011]`
3. No existing ToolDescriptor wraps MCP functionality within the ToolRegistry. `[MCP-012]`
4. MCP-specific metadata (e.g., `success`, `execution_time_ms`) would leak without filtering. `[MCP-013]`
5. MCP operates as an external system with its own logic and must not be duplicated or tightly coupled. `[MCP-014]`

---

### 1.2 Root Cause

Studio Ordo and MCP follow incompatible execution contracts:

* MCP: Always returns structured responses (including failures)
* Studio Ordo: Uses thrown exceptions for failure handling

There is currently no adapter layer translating between these models, which would break:

* Error handling
* Output consistency
* Tool orchestration

`[MCP-020]`

---

## 2. Design Goals

1. **Contract alignment** – Translate MCP responses into Studio Ordo-compatible behavior. `[MCP-030]`
2. **Strict validation** – Enforce input validation at ToolCommand level. `[MCP-031]`
3. **Error correctness** – Convert MCP failure states into thrown exceptions. `[MCP-032]`
4. **Output consistency** – Normalize all successful responses to `{ results: [...] }`. `[MCP-033]`
5. **Encapsulation** – Prevent MCP-specific fields from leaking into the app layer. `[MCP-034]`
6. **Determinism** – Maintain consistent ordering and structure. `[MCP-035]`
7. **RBAC compatibility** – Integrate with role-based access control. `[MCP-036]`
8. **Boundary integrity** – Treat MCP strictly as an external system accessed via protocol. `[MCP-037]`

---

## 3. Architecture Direction

### 3.1 External Dependency Contract

The capital intelligence system is external and accessed via MCP over stdio.

Expected MCP response format:

```json
{
  "success": boolean,
  "data": [...],
  "error": string | null
}
```

---

### 3.2 Tool Definition Contract

A new ToolDescriptor must be created for:

```
get_capital_events
```

**Requirements:**

* Must define a valid Anthropic-compatible JSON schema `[MCP-040]`
* Must implement `ToolCommand.execute(input, context)` `[MCP-041]`
* Must be registered in `tool-composition-root.ts` `[MCP-042]`

---

### 3.3 Input Validation Contract

All inputs must be validated before invoking MCP.

**Rules:**

* `limit` must be an integer between 1 and 100 `[MCP-043]`
* `event_type` must be one of:
  `funding | acquisition | partnership | contract | restructuring | other` `[MCP-044]`
* Invalid input must immediately throw an error `[MCP-045]`

---

### 3.4 MCP Interaction Contract

MCP is accessed via a Docker-based stdio process.

**Execution:**

```bash
docker run -i --rm -v <data_path>:/app/data ai-capital-mcp:latest
```

**Rules:**

* Communication occurs over stdin/stdout using MCP protocol `[MCP-046]`
* Tool invocation:

```json
{
  "tool": "get_capital_events",
  "arguments": {
    "limit": number,
    "event_type": optional
  }
}
```

* MCP interaction must occur only inside `ToolCommand.execute` `[MCP-047]`
* MCP internal logic must never be reimplemented `[MCP-048]`

---

### 3.5 Response Translation Contract

MCP responses must be normalized before returning.

**Rules:**

* If `success: true` → return:

```json
{
  "results": [...]
}
```

`[MCP-049]`

* Strip all MCP metadata (`success`, `error`, etc.) `[MCP-050]`
* Empty results must return:

```json
{ "results": [] }
```

`[MCP-051]`

---

### 3.6 Error Handling Contract

All MCP failures must be elevated to system-level exceptions.

**Rules:**

* If `success: false` → throw error using MCP message `[MCP-052]`
* If invocation fails (timeout, crash) → throw generic error `[MCP-053]`
* Errors must never be returned as structured payloads `[MCP-054]`

---

### 3.7 Determinism Contract

The tool must behave deterministically.

**Rules:**

* Results must remain ordered (newest → oldest) `[MCP-055]`
* Output structure must always match `{ results: [...] }` `[MCP-056]`
* Enforce `limit` strictly `[MCP-057]`

---

### 3.8 RBAC Contract

Access must respect system roles.

**Rules:**

* Tool must be accessible to `ADMIN` role `[MCP-058]`
* Additional roles may be enabled later `[MCP-059]`

---

## 4. Testing Strategy

The implementation must include tests for:

* Input validation (valid vs invalid inputs) `[MCP-070]`
* Successful MCP response translation `[MCP-071]`
* MCP failure → thrown exception `[MCP-072]`
* Empty result handling `[MCP-073]`
* RBAC enforcement `[MCP-074]`
* Output structure consistency `[MCP-075]`

---

## 5. Sprint Plan

| Sprint | Goal                                                                  |
| ------ | --------------------------------------------------------------------- |
| 0      | Implement ToolCommand with validation + MCP client connection         |
| 1      | Add response translation, error handling, ToolDescriptor registration |
| 2      | Add RBAC enforcement, full test coverage, QA validation               |

---