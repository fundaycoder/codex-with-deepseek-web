import fs from "node:fs";
import path from "node:path";
import { ensureDir, getStateDir } from "../config/paths.js";
function recordsFile(workspaceId) {
    const dir = ensureDir(path.join(getStateDir(), "executions"));
    return path.join(dir, `${workspaceId}.jsonl`);
}
export function appendExecutionRecord(workspaceId, record) {
    const file = recordsFile(workspaceId);
    fs.appendFileSync(file, JSON.stringify(record) + "\n", { mode: 0o600 });
}
export function readExecutionRecords(workspaceId, limit = 10) {
    const file = recordsFile(workspaceId);
    if (!fs.existsSync(file))
        return [];
    const lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean);
    const records = [];
    for (const line of lines.slice(-limit)) {
        try {
            records.push(JSON.parse(line));
        }
        catch {
            // skip corrupt lines
        }
    }
    return records;
}
export function latestExecutionRecord(workspaceId) {
    const records = readExecutionRecords(workspaceId, 1);
    return records[records.length - 1] ?? null;
}
//# sourceMappingURL=records.js.map