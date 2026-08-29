import { spawnSync } from "node:child_process";
export function runGit(root, args) {
    const result = spawnSync("git", args, {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        timeout: 30_000,
    });
    return {
        ok: result.status === 0,
        stdout: result.stdout ?? "",
        stderr: result.stderr ?? "",
        code: result.status,
    };
}
export function gitInfo(root) {
    const check = runGit(root, ["rev-parse", "--is-inside-work-tree"]);
    if (!check.ok || check.stdout.trim() !== "true") {
        return { isRepo: false, branch: null, commit: null, dirty: false };
    }
    const branch = runGit(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
    const commit = runGit(root, ["rev-parse", "--short", "HEAD"]);
    // Pathspec confines the result to the workspace subtree even when the
    // workspace root sits inside a larger repository.
    const status = runGit(root, ["status", "--porcelain", "--", "."]);
    return {
        isRepo: true,
        branch: branch.ok ? branch.stdout.trim() : null,
        commit: commit.ok ? commit.stdout.trim() : null,
        dirty: status.ok ? status.stdout.trim().length > 0 : false,
    };
}
export function gitStatus(root) {
    const empty = {
        isRepo: false,
        branch: null,
        upstream: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: [],
    };
    const result = runGit(root, ["status", "--porcelain=v2", "--branch", "--", "."]);
    if (!result.ok)
        return empty;
    const out = { ...empty, isRepo: true };
    for (const line of result.stdout.split("\n")) {
        if (line.startsWith("# branch.head ")) {
            out.branch = line.slice("# branch.head ".length).trim();
        }
        else if (line.startsWith("# branch.upstream ")) {
            out.upstream = line.slice("# branch.upstream ".length).trim();
        }
        else if (line.startsWith("# branch.ab ")) {
            const m = line.match(/\+(\d+) -(\d+)/);
            if (m) {
                out.ahead = parseInt(m[1], 10);
                out.behind = parseInt(m[2], 10);
            }
        }
        else if (line.startsWith("1 ") || line.startsWith("2 ")) {
            const parts = line.split(" ");
            const xy = parts[1];
            const filePath = line.startsWith("2 ")
                ? line.split("\t")[0]?.split(" ").slice(9).join(" ") + " -> " + (line.split("\t")[1] ?? "")
                : parts.slice(8).join(" ");
            const x = xy[0];
            const y = xy[1];
            if (x !== ".")
                out.staged.push({ path: filePath, change: x });
            if (y !== ".")
                out.unstaged.push({ path: filePath, change: y });
        }
        else if (line.startsWith("? ")) {
            out.untracked.push(line.slice(2));
        }
        else if (line.startsWith("u ")) {
            const parts = line.split(" ");
            out.conflicted.push(parts.slice(10).join(" "));
        }
    }
    return out;
}
const SENSITIVE_DIFF_EXCLUDES = [
    ":(exclude,glob)**/.env",
    ":(exclude,glob)**/.env.*",
    ":(exclude,glob)**/*.pem",
    ":(exclude,glob)**/*.key",
    ":(exclude,glob)**/id_rsa*",
    ":(exclude,glob)**/id_ed25519*",
];
export function gitDiff(root, opts = {}, relPath) {
    const mode = opts.mode ?? "unstaged";
    const offset = Math.max(0, Math.floor(opts.offset ?? 0));
    const maxBytes = Math.min(256 * 1024, Math.max(1024, Math.floor(opts.maxBytes ?? 64 * 1024)));
    if (!gitInfo(root).isRepo) {
        return {
            isRepo: false,
            mode,
            totalBytes: 0,
            offset: 0,
            returnedBytes: 0,
            hasMore: false,
            nextOffset: null,
            diff: "",
        };
    }
    const base = ["diff", "--no-color"];
    if (mode === "staged")
        base.push("--cached");
    if (mode === "head")
        base.push("HEAD");
    base.push("--");
    if (relPath) {
        base.push(relPath);
    }
    else {
        base.push(".", ...SENSITIVE_DIFF_EXCLUDES);
    }
    const result = runGit(root, base);
    if (!result.ok && /not a git repository/i.test(result.stderr)) {
        return {
            isRepo: false,
            mode,
            totalBytes: 0,
            offset: 0,
            returnedBytes: 0,
            hasMore: false,
            nextOffset: null,
            diff: "",
        };
    }
    const full = Buffer.from(result.stdout, "utf8");
    const slice = full.subarray(offset, offset + maxBytes);
    let text = slice.toString("utf8");
    let sliceLen = slice.length;
    // Avoid cutting mid-line when more content follows.
    if (offset + sliceLen < full.length) {
        const lastNewline = text.lastIndexOf("\n");
        if (lastNewline > 0) {
            text = text.slice(0, lastNewline + 1);
            sliceLen = Buffer.byteLength(text, "utf8");
        }
    }
    const hasMore = offset + sliceLen < full.length;
    return {
        isRepo: true,
        mode,
        totalBytes: full.length,
        offset,
        returnedBytes: sliceLen,
        hasMore,
        nextOffset: hasMore ? offset + sliceLen : null,
        diff: text,
    };
}
//# sourceMappingURL=git.js.map