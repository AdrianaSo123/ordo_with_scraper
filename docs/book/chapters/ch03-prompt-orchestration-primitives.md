# Chapter 3 - Prompt Orchestration Primitives

## Abstract
This chapter defines reusable primitives for controlling LLM behavior: role framing, constraints, acceptance criteria, decomposition, and feedback. These primitives make prompts composable and testable.

## The Primitive Set
If you want repeatable quality, treat prompt orchestration as a composition of primitives.

### 1) Role Framing
Define the operating posture: auditor, implementer, reviewer, operator, or educator. Role framing changes optimization behavior.

> **A note from the model:**
> Role framing is not a metaphor. When you instruct me to act as an auditor, the outputs shift measurably toward systematic checking, gap identification, and constraint-first reasoning compared to when you say "help me with this," which is associated with helpful acquiescence — finding what you seem to want and providing it. Both postures are available to me. Which one leads your work is, partly, your choice. Naming it explicitly is faster and more reliable than hoping I infer the right one.

### 2) Scope Boundary
Specify exactly what should and should not change. Scope is the guardrail against accidental architecture drift. A well-defined scope names the files, modules, or domains that are in bounds and explicitly excludes everything else. Without scope, an AI assistant may "helpfully" fix related problems in adjacent code — introducing changes nobody asked for and nobody tested.

### 3) Invariants
State non-negotiable rules (for example: do not skip tests, do not introduce unrelated changes, preserve existing API behavior unless explicitly requested). Invariants are the constraints that must hold true before, during, and after execution. They are the difference between a sprint that improves the codebase and one that silently breaks assumptions.

### 4) Acceptance Criteria
Make completion testable. If completion cannot be measured, completion is ambiguous. Acceptance criteria define *what* must be true when the work is done — the conditions under which a sprint or task can be declared finished. They answer the question: "How will we know this worked?"

### 5) Sequencing
For larger work, enforce ordered phases: discover -> plan -> implement -> validate -> archive. Sequencing prevents scope creep by making each phase's output the explicit input to the next. It also creates natural checkpoints where you can pause, verify, and course-correct before committing to more work.

### 6) Verification
Tie changes to concrete commands and expected outputs. Where acceptance criteria define *what* must be true, verification defines *how* you check it — the specific commands, scripts, or inspections that produce objective evidence. A sprint without verification is a promise; a sprint with verification is a proof.

### 7) Artifact Discipline
Persist decisions in durable files (plans, runbooks, QA notes), not only chat history. Artifacts serve two purposes: they give future sessions the context they need (since the model has no memory between conversations), and they create an auditable record that turns ephemeral decisions into a reconstructable trail.

## Why Primitives Beat Clever Prompts
A single clever prompt may produce good output once. Primitive-driven orchestration produces good output repeatedly.

That difference matters in real software where consistency beats novelty.

## Repository Example: Primitive Mapping
This repository’s execution path maps directly to the primitive set:

- Scope and sequencing: multi-sprint workflows in `sprints/planning`, `sprints/active`, `sprints/completed`.
- Invariants and verification: repeated gates through `npm test`, `npm run lint`, `npm run build`.
- Artifact discipline: QA reports and sprint completion notes in `sprints/completed`.
- Named framework compression (see Chapter 4): 12-factor and GoF directives converted into concrete module-level refactors.

## Reusable Prompt Skeleton
Use this skeleton as a baseline orchestration contract:

1. Role: define the execution persona.
2. Scope: define in-bound and out-of-bound changes.
3. Invariants: define hard constraints.
4. Acceptance: define objective completion checks.
5. Sequence: define ordered steps for non-trivial work.
6. Validation: define exact commands and expected status.
7. Deliverable: define required artifacts.

> The execution loop that puts these primitives into practice — audit, plan, sprint, verify, archive — is covered in [Chapter 5](ch05-audit-to-sprint-loop.md).

## Anti-Patterns
- Vague objective with no constraints.
- Multiple priorities with no sequencing.
- Architectural changes with no regression gates.
- Long-running work with no artifact trail.

## Exercise
Take one chapter-level objective and write two orchestration specs:

- Spec A: only high-level request.
- Spec B: primitive-based request using the skeleton above.

Execute both against the same codebase and compare:

- number of correction iterations,
- number of unintended changes,
- validation pass rate,
- artifact completeness.

## Reader Exercise: Primitive Comparison
Draw a component diagram of the seven orchestration primitives and show how they map to one execution loop: role -> scope -> invariants -> acceptance -> sequence -> validation -> artifacts. Then identify which primitives your current workflow addresses and which it skips.

## Chapter Checklist
- Are primitives defined clearly enough to reuse?
- Are examples tied to this repository’s execution history?
- Is there at least one operational template the reader can apply immediately?

When these checks pass, prompt orchestration stops being “prompt craft” and becomes engineering method.
