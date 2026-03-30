# Sprint 2 - RBAC and Hardening

> **Goal:** Add RBAC enforcement, full test coverage, and QA validation.
> **Spec Sections:** `MCP-055` through `MCP-075`

## Tasks

1. **RBAC Enforcement**: Verify the `roles: ["ADMIN"]` constraint in the descriptor is correctly enforced by the `RbacGuardMiddleware`.
2. **Determinism Audit**: Verify that results from MCP are ordered correctly (newest first) and that the `limit` parameter is strictly respected in the output.
3. **Full Integration Testing**: Create `tests/core/use-cases/tools/get-capital-events.integration.test.ts` to test the full tool stack from dispatch to mock MCP response.
4. **Final Hardening**: Run the full project test suite and build pipeline to ensure zero regressions.
5. **QA Verification**: Complete the QA pass and record any deviations or fixes applied.

## Completion Checklist

- [x] RBAC enforcement verified via tests
- [x] Result ordering and limit enforcement verified
- [x] Full integration tests passing
- [x] Production build clean
- [x] QA report finalized

## QA Deviations

None.

## Verification

- `npx vitest tests/core/use-cases/tools/get-capital-events.integration.test.ts`
- `npx vitest` (full suite)
- `npm run build`
