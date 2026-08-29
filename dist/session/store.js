import fs from "node:fs";
import path from "node:path";
import { getStateDir, readJsonIfExists, writeSecureJson } from "../config/paths.js";
function sessionFile(workspaceId) {
    return path.join(getStateDir(), "sessions", `${workspaceId}.json`);
}
export function validateDeepSeekSessionUrl(value) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "chat.deepseek.com") {
        throw new Error("Session URL must be an https://chat.deepseek.com/ address");
    }
    return url.toString();
}
export function getSession(workspaceId) {
    return readJsonIfExists(sessionFile(workspaceId));
}
export function saveSession(workspaceId, update) {
    const previous = getSession(workspaceId);
    const saved = {
        url: validateDeepSeekSessionUrl(update.url),
        title: update.title ?? previous?.title,
        taskId: update.taskId ?? previous?.taskId,
        iteration: update.iteration ?? previous?.iteration,
        lastState: update.lastState ?? previous?.lastState,
        savedAt: new Date().toISOString(),
    };
    writeSecureJson(sessionFile(workspaceId), saved);
    return saved;
}
export function clearSession(workspaceId) {
    fs.rmSync(sessionFile(workspaceId), { force: true });
}
//# sourceMappingURL=store.js.map