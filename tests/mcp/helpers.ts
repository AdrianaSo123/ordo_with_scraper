/**
 * Shared test helpers for Capital Intelligence MCP tests.
 */
import type { ChildProcess } from "child_process";
import { EventEmitter, Readable, Writable } from "stream";
import { vi } from "vitest";
import type { ToolExecutionContext } from "../../src/core/tool-registry/ToolExecutionContext";

// ---------------------------------------------------------------------------
// Mock child process factory
// ---------------------------------------------------------------------------

export interface MockChildOptions {
  stdoutData?: string;
  exitCode?: number;
  stderrData?: string;
}

interface MockChildResult {
  child: ChildProcess;
  getCapturedStdin: () => string;
}

export function createMockChild(opts: MockChildOptions = {}): MockChildResult {
  const { stdoutData = "", exitCode = 0, stderrData = "" } = opts;

  let capturedStdin = "";
  const child = new EventEmitter() as ChildProcess;
  const stdout = new Readable({ read() {} });
  const stderr = new Readable({ read() {} });
  const stdin = new Writable({
    write(chunk, _encoding, callback) {
      capturedStdin += chunk.toString();
      callback();
    },
  });

  Object.assign(child, { stdout, stderr, stdin, kill: vi.fn() });

  setTimeout(() => {
    if (stdoutData) stdout.push(stdoutData);
    stdout.push(null);
    if (stderrData) stderr.push(stderrData);
    stderr.push(null);
    child.emit("close", exitCode);
  }, 0);

  return { child, getCapturedStdin: () => capturedStdin };
}

// ---------------------------------------------------------------------------
// Common test contexts
// ---------------------------------------------------------------------------

export const ADMIN_CONTEXT: ToolExecutionContext = {
  role: "ADMIN",
  userId: "admin-001",
  conversationId: "conv-001",
};

export const AUTHENTICATED_CONTEXT: ToolExecutionContext = {
  role: "AUTHENTICATED",
  userId: "user-001",
  conversationId: "conv-002",
};

export const ANONYMOUS_CONTEXT: ToolExecutionContext = {
  role: "ANONYMOUS",
  userId: "anon-001",
};

export const STAFF_CONTEXT: ToolExecutionContext = {
  role: "STAFF",
  userId: "staff-001",
};
