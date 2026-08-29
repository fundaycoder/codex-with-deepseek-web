#!/usr/bin/env node
import { Command, Option } from "commander";
import { Workspace } from "../workspace/manager.js";
import { gitInfo } from "../workspace/git.js";
import { appendExecutionRecord } from "../execution/records.js";
import { buildPlanPacket, buildReviewPacket, parseFileSelection } from "../context/packet.js";
import { clearSession, getSession, saveSession } from "../session/store.js";
import { PRODUCT_NAME, VERSION } from "../version.js";

type OutputOptions = { json?: boolean };

function resolveWorkspace(value?: string): string {
  return value ?? process.cwd();
}

function output(value: unknown, opts: OutputOptions): void {
  if (opts.json) {
    process.stdout.write(JSON.stringify(value, null, 2) + "\n");
  } else if (typeof value === "string") {
    process.stdout.write(value + (value.endsWith("\n") ? "" : "\n"));
  } else {
    process.stdout.write(JSON.stringify(value, null, 2) + "\n");
  }
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function parsePositiveInt(value: string, label: string): number {
  if (!/^\d+$/.test(value)) throw new Error(`${label} must be a non-negative integer`);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} must be a non-negative integer`);
  return parsed;
}

const program = new Command()
  .name("c2d")
  .description(`${PRODUCT_NAME} — DeepSeek Web plans and reviews; Codex executes locally.`)
  .version(VERSION);

program
  .command("status")
  .description("Show project and saved DeepSeek Web session state")
  .option("-w, --workspace <path>")
  .option("--json", "machine-readable output", false)
  .action((opts: { workspace?: string; json?: boolean }) => {
    const workspace = new Workspace(resolveWorkspace(opts.workspace));
    output(
      {
        ok: true,
        product: PRODUCT_NAME,
        workspace: {
          id: workspace.id,
          name: workspace.name,
          root: workspace.root,
          project: workspace.detectProject(),
          git: gitInfo(workspace.root),
        },
        session: getSession(workspace.id),
      },
      opts
    );
  });

const session = program
  .command("session")
  .description("Remember one DeepSeek Web conversation per workspace");

session
  .command("get", { isDefault: true })
  .description("Show the saved DeepSeek Web conversation")
  .option("-w, --workspace <path>")
  .option("--json", "machine-readable output", false)
  .action((opts: { workspace?: string; json?: boolean }) => {
    const workspace = new Workspace(resolveWorkspace(opts.workspace));
    const saved = getSession(workspace.id);
    if (opts.json) output({ ok: true, session: saved }, opts);
    else if (!saved) output("尚未记录 DeepSeek 网页会话。", opts);
    else output(`会话：${saved.title ?? "(untitled)"}\n地址：${saved.url}\n任务：${saved.taskId ?? "-"}（第 ${saved.iteration ?? 0} 轮，${saved.lastState ?? "-"}）`, opts);
  });

session
  .command("set")
  .description("Save or update the DeepSeek Web conversation")
  .option("-w, --workspace <path>")
  .requiredOption("--url <url>", "DeepSeek conversation URL")
  .option("--title <title>")
  .option("--task <id>")
  .option("--iteration <n>")
  .option("--state <state>")
  .option("--json", "machine-readable output", false)
  .action((opts: {
    workspace?: string;
    url: string;
    title?: string;
    task?: string;
    iteration?: string;
    state?: string;
    json?: boolean;
  }) => {
    const workspace = new Workspace(resolveWorkspace(opts.workspace));
    const saved = saveSession(workspace.id, {
      url: opts.url,
      title: opts.title,
      taskId: opts.task,
      iteration: opts.iteration === undefined ? undefined : parsePositiveInt(opts.iteration, "iteration"),
      lastState: opts.state,
    });
    output(opts.json ? { ok: true, session: saved } : "✓ 已记录 DeepSeek 网页会话", opts);
  });

session
  .command("clear")
  .description("Forget the saved conversation")
  .option("-w, --workspace <path>")
  .option("--json", "machine-readable output", false)
  .action((opts: { workspace?: string; json?: boolean }) => {
    const workspace = new Workspace(resolveWorkspace(opts.workspace));
    clearSession(workspace.id);
    output(opts.json ? { ok: true } : "✓ 已清除 DeepSeek 网页会话记录", opts);
  });

const packet = program
  .command("packet")
  .description("Build bounded, redacted prompts for DeepSeek Web");

packet
  .command("plan")
  .description("Build a planning packet")
  .option("-w, --workspace <path>")
  .requiredOption("--task <id>")
  .requiredOption("--goal <text>")
  .option("--iteration <n>", "protocol iteration", "0")
  .option("--file <path[#start-end]>", "include a file or line range; repeatable", collect, [])
  .option("--max-chars <n>", "packet character limit", "60000")
  .option("--json", "wrap the packet and metadata in JSON", false)
  .action(async (opts: {
    workspace?: string;
    task: string;
    goal: string;
    iteration: string;
    file: string[];
    maxChars: string;
    json?: boolean;
  }) => {
    const workspace = new Workspace(resolveWorkspace(opts.workspace));
    const result = await buildPlanPacket(workspace, {
      taskId: opts.task,
      iteration: parsePositiveInt(opts.iteration, "iteration"),
      goal: opts.goal,
      files: opts.file.map(parseFileSelection),
      maxChars: parsePositiveInt(opts.maxChars, "max-chars"),
    });
    output(opts.json ? { ok: true, ...result } : result.packet, opts);
  });

packet
  .command("review")
  .description("Build an independent review packet from the current git diff")
  .option("-w, --workspace <path>")
  .requiredOption("--task <id>")
  .requiredOption("--goal <text>")
  .requiredOption("--iteration <n>")
  .option("--tests <summary>")
  .option("--notes <text>")
  .addOption(new Option("--diff-mode <mode>", "diff to review").choices(["unstaged", "staged", "head"]).default("unstaged"))
  .option("--file <path[#start-end]>", "include an additional file or line range; repeatable", collect, [])
  .option("--max-chars <n>", "packet character limit", "60000")
  .option("--json", "wrap the packet and metadata in JSON", false)
  .action(async (opts: {
    workspace?: string;
    task: string;
    goal: string;
    iteration: string;
    tests?: string;
    notes?: string;
    diffMode: "unstaged" | "staged" | "head";
    file: string[];
    maxChars: string;
    json?: boolean;
  }) => {
    const workspace = new Workspace(resolveWorkspace(opts.workspace));
    const result = await buildReviewPacket(workspace, {
      taskId: opts.task,
      iteration: parsePositiveInt(opts.iteration, "iteration"),
      goal: opts.goal,
      tests: opts.tests,
      notes: opts.notes,
      diffMode: opts.diffMode,
      files: opts.file.map(parseFileSelection),
      maxChars: parsePositiveInt(opts.maxChars, "max-chars"),
    });
    output(opts.json ? { ok: true, ...result } : result.packet, opts);
  });

program
  .command("record")
  .description("Record one Codex execution iteration")
  .option("-w, --workspace <path>")
  .requiredOption("--task <id>")
  .requiredOption("--iteration <n>")
  .option("--changed-files <filesOrCount>", "comma-separated files or a count", "0")
  .option("--tests <summary>")
  .option("--exit-status <status>", "ok | failed | blocked", "ok")
  .option("--notes <text>")
  .option("--json", "machine-readable output", false)
  .action((opts: {
    workspace?: string;
    task: string;
    iteration: string;
    changedFiles: string;
    tests?: string;
    exitStatus: string;
    notes?: string;
    json?: boolean;
  }) => {
    const workspace = new Workspace(resolveWorkspace(opts.workspace));
    const changedFiles = /^\d+$/.test(opts.changedFiles)
      ? Number.parseInt(opts.changedFiles, 10)
      : opts.changedFiles.split(",").map((file) => file.trim()).filter(Boolean);
    const record = {
      taskId: opts.task,
      iteration: parsePositiveInt(opts.iteration, "iteration"),
      changedFiles,
      tests: opts.tests ?? null,
      exitStatus: opts.exitStatus,
      timestamp: new Date().toISOString(),
      notes: opts.notes,
    };
    appendExecutionRecord(workspace.id, record);
    output(opts.json ? { ok: true, record } : "✓ 已记录本轮执行结果", opts);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`c2d: ${message}\n`);
  process.exitCode = 1;
});
