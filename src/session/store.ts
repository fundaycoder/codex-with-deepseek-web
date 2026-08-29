import fs from "node:fs";
import path from "node:path";
import { getStateDir, readJsonIfExists, writeSecureJson } from "../config/paths.js";

export interface SavedSession {
  url: string;
  title?: string;
  taskId?: string;
  iteration?: number;
  lastState?: string;
  savedAt: string;
}

function sessionFile(workspaceId: string): string {
  return path.join(getStateDir(), "sessions", `${workspaceId}.json`);
}

export function validateDeepSeekSessionUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "chat.deepseek.com") {
    throw new Error("Session URL must be an https://chat.deepseek.com/ address");
  }
  return url.toString();
}

export function getSession(workspaceId: string): SavedSession | null {
  return readJsonIfExists<SavedSession>(sessionFile(workspaceId));
}

export function saveSession(workspaceId: string, update: Partial<SavedSession> & { url: string }): SavedSession {
  const previous = getSession(workspaceId);
  const saved: SavedSession = {
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

export function clearSession(workspaceId: string): void {
  fs.rmSync(sessionFile(workspaceId), { force: true });
}
