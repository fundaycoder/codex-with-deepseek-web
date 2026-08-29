import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clearSession, getSession, saveSession, validateDeepSeekSessionUrl } from "../src/session/store.js";
import { cleanup, isolateStateDir } from "./helpers.js";

let stateDir: string;

beforeAll(() => {
  stateDir = isolateStateDir();
});

afterAll(() => {
  delete process.env.C2D_STATE_DIR;
  cleanup(stateDir);
});

describe("DeepSeek session store", () => {
  it("accepts only DeepSeek HTTPS URLs", () => {
    expect(validateDeepSeekSessionUrl("https://chat.deepseek.com/a/chat/s/abc")).toContain("chat.deepseek.com");
    expect(() => validateDeepSeekSessionUrl("https://example.com/chat")).toThrow(/DeepSeek|chat\.deepseek/);
    expect(() => validateDeepSeekSessionUrl("http://chat.deepseek.com/chat")).toThrow(/https/);
  });

  it("saves, merges, reads, and clears one session", () => {
    const first = saveSession("workspace-1", {
      url: "https://chat.deepseek.com/a/chat/s/abc",
      title: "C2D demo",
      taskId: "c2d_1234",
      iteration: 0,
    });
    expect(first.title).toBe("C2D demo");
    const second = saveSession("workspace-1", {
      url: first.url,
      iteration: 1,
      lastState: "EXECUTED",
    });
    expect(second.taskId).toBe("c2d_1234");
    expect(getSession("workspace-1")?.lastState).toBe("EXECUTED");
    clearSession("workspace-1");
    expect(getSession("workspace-1")).toBeNull();
  });
});
