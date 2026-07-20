import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDatabase } from "@/lib/mongodb";

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  company: string;
  service: string;
  budget: string;
  message: string;
  locale: "en" | "ur";
  createdAt: string;
};

const defaultPath = path.join(process.cwd(), "data", "contact-submissions.local.json");
const storagePath = process.env.CONTACT_STORAGE_PATH
  ? path.resolve(process.env.CONTACT_STORAGE_PATH)
  : defaultPath;

let writeQueue = Promise.resolve();

export function getContactPersistenceMode() {
  return process.env.MONGODB_URI?.trim() ? "mongodb" : "local-file";
}

async function readSubmissions(): Promise<ContactSubmission[]> {
  try {
    const file = await readFile(storagePath, "utf8");
    const data: unknown = JSON.parse(file);
    return Array.isArray(data) ? (data as ContactSubmission[]) : [];
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "ENOTDIR")
    ) {
      return [];
    }
    throw error;
  }
}

async function appendToFile(submission: ContactSubmission) {
  const submissions = await readSubmissions();
  submissions.push(submission);

  const directory = path.dirname(storagePath);
  const temporaryPath = `${storagePath}.${process.pid}.tmp`;
  await mkdir(directory, { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(submissions, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, storagePath);
}

export function saveContactSubmission(submission: ContactSubmission) {
  if (getContactPersistenceMode() === "mongodb") {
    return getDatabase().then(async (database) => {
      await database.collection("contact_submissions").insertOne({
        ...submission,
        createdAt: new Date(submission.createdAt),
      });
    });
  }

  const operation = writeQueue.then(() => appendToFile(submission));
  writeQueue = operation.catch(() => undefined);
  return operation;
}
