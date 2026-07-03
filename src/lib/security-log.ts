import { promises as fs } from "node:fs";
import path from "node:path";

const eventsFile = path.join(process.cwd(), "src", "data", "security-events.jsonl");

type SecurityEvent = {
  type: string;
  email?: string;
  ip?: string;
  detail?: string;
  userId?: string;
};

export async function recordSecurityEvent(event: SecurityEvent) {
  await fs.mkdir(path.dirname(eventsFile), { recursive: true });
  const entry = {
    ...event,
    createdAt: new Date().toISOString()
  };

  await fs.appendFile(eventsFile, `${JSON.stringify(entry)}\n`, "utf8");
}
