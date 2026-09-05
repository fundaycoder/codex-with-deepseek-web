import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Workspace } from "../src/workspace/manager.js";
import { buildPlanPacket, buildReviewPacket, parseFileSelection } from "../src/context/packet.js";
import { redactSecrets } from "../src/context/redact.js";
import { cleanup, git, makeGitRepo, makeTmpDir, write } from "./helpers.js";

let root: string;
let workspace: Workspace;

beforeAll(() => {
  root = makeTmpDir("context-packet");
  makeGitRepo(root);
  write(root, "src/config.ts", 'export const api_key = "super-secret-value";\n');
  write(root, ".env", "PASSWORD=must-not-leak\n");
  workspace = new Workspace(root);
});

afterAll(() => cleanup(root));

describe("redactSecrets", () => {
  it("redacts common assignments, JSON values, tokens, and private keys", () => {
    const input = [
      "password=hunter2",
      '{"api_key":"json-secret"}',
      "token: sk-abcdefghijklmnopqrstuv",
      "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
    ].join("\n");
    const result = redactSecrets(input);
    expect(result.replacements).toBeGreaterThanOrEqual(4);
    expect(result.text).not.toContain("hunter2");
    expect(result.text).not.toContain("json-secret");
    expect(result.text).not.toContain("abcdefghijklmnopqrstuv");
    expect(result.text).not.toContain("BEGIN PRIVATE KEY");
  });
});

describe("file selection", () => {
  it("supports optional #start-end ranges", () => {
    expect(parseFileSelection("src/app.ts#10-20")).toEqual({ path: "src/app.ts", startLine: 10, endLine: 20 });
    expect(parseFileSelection("README.md")).toEqual({ path: "README.md" });
  });
});

describe("context packets", () => {
  it("builds a goal-first planning packet without reading source files", async () => {
    const result = await buildPlanPacket(workspace, {
      taskId: "c2d_fast",
      iteration: 0,
      goal: "Add CSV export",
    });
    expect(result.packet).toContain("Add CSV export");
    expect(result.packet).toContain("WORKSPACE_TREE:");
    expect(result.packet).toContain("(No file excerpts supplied. Plan from the project metadata and goal.)");
    expect(result.includedFiles).toEqual([]);
    expect(result.omittedFiles).toEqual([]);
    expect(result.redactions).toBe(0);
    expect(result.truncated).toBe(false);
  });

  it("builds a planning packet and omits denied files", async () => {
    const result = await buildPlanPacket(workspace, {
      taskId: "c2d_ab12",
      iteration: 0,
      goal: "Add a configuration screen",
      files: [{ path: "src/config.ts" }, { path: ".env" }],
    });
    expect(result.packet).toContain("STATE: INIT");
    expect(result.packet).toContain("[C2D]\nSTATE: PLAN\nTASK_ID: c2d_ab12\nITERATION: 1");
    expect(result.packet).toContain("only planning request");
    expect(result.packet).toContain("Add a configuration screen");
    expect(result.packet).toContain("[REDACTED]");
    expect(result.packet).not.toContain("super-secret-value");
    expect(result.packet).not.toContain("must-not-leak");
    expect(result.omittedFiles.some((entry) => entry.startsWith(".env"))).toBe(true);
  });

  it("builds a review packet from the current diff without sensitive diffs", async () => {
    write(root, "hello.txt", "changed for review\n");
    write(root, ".env", "PASSWORD=changed-secret\n");
    const result = await buildReviewPacket(workspace, {
      taskId: "c2d_ab12",
      iteration: 1,
      goal: "Change the greeting",
      tests: "3 passed",
    });
    expect(result.packet).toContain("STATE: EXECUTED");
    expect(result.packet).toContain("changed for review");
    expect(result.packet).not.toContain("changed-secret");
    expect(result.packet).toContain("STATE: DONE");
    expect(result.packet).toContain("submit the next iteration");
    expect(result.packet).toContain("STATE: DONE only when");
    git(root, "checkout", "--", "hello.txt");
  });

  it("keeps the review request when a large diff is truncated", async () => {
    const large = Array.from({ length: 4000 }, (_, index) => `line-${index}-${"x".repeat(30)}`).join("\n") + "\n";
    write(root, "hello.txt", large);
    const result = await buildReviewPacket(workspace, {
      taskId: "c2d_large",
      iteration: 2,
      goal: "Review a large change",
      maxChars: 12_000,
    });
    expect(result.packet.length).toBeLessThanOrEqual(12_000);
    expect(result.packet).toContain("REQUEST:");
    expect(result.packet).toContain("STATE: DONE");
    expect(result.truncated).toBe(true);
    git(root, "checkout", "--", "hello.txt");
  });
});
