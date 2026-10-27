export type JobStatus = "queued" | "running" | "done" | "failed";

export interface Job {
  id: string;
  name: string;
  created: number;
  expires: number;
  status: JobStatus;
  stage: string;
  started: number | null;
  finished: number | null;
  error: string | null;
  summary: Record<string, number>;
  /** The comparison's warnings: drawings it could not read. */
  warnings: string[];
  log: string[];
}

export type Cell = string | number | boolean | null;

export interface Sheet {
  name: string;
  headers: string[];
  rows: Cell[][];
}

export interface UploadFile {
  /** Path inside the tender, e.g. "IIT B full tender/6 BOQ/boq.pdf", or the .zip file name. */
  path: string;
  file: File;
}

/** The API's address: empty when the page and the API share one (locally, through the dev server). */
const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `The server answered ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export const getJob = (id: string) => fetch(`${API}/api/jobs/${id}`).then((r) => read<Job>(r));

export const getSheets = (id: string) =>
  fetch(`${API}/api/jobs/${id}/sheets`).then((r) => read<{ sheets: Sheet[] }>(r)).then((d) => d.sheets);

export const downloadUrl = (id: string) => `${API}/api/jobs/${id}/download`;

/** Uploads a tender; XMLHttpRequest rather than fetch, for upload progress on a tender of up to a few GB. */
export function createJob(files: UploadFile[], onProgress: (share: number) => void): Promise<Job> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const f of files) form.append("files", f.file, f.path);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/api/jobs`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as Job);
      else reject(new Error(xhr.response?.detail ?? `The upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("The upload did not reach the comparison service. Is the backend running?"));
    xhr.send(form);
  });
}
