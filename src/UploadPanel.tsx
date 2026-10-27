import { useRef, useState } from "react";
import { FileArchive, FolderOpen, Play } from "lucide-react";
import type { UploadFile } from "./api";

interface Props {
  onStart: (files: UploadFile[], name: string) => void;
  error: string | null;
}

interface Picked {
  name: string;
  files: UploadFile[];
  bytes: number;
}

export function UploadPanel({ onStart, error }: Props) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [over, setOver] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const zipInput = useRef<HTMLInputElement>(null);

  function pick(files: UploadFile[]) {
    setProblem(null);
    if (files.length === 0) return setProblem("Nothing to upload: the folder is empty.");
    const zips = files.filter((f) => f.path.toLowerCase().endsWith(".zip"));
    if (files.length === 1 && zips.length === 1) {
      return setPicked({ name: files[0].path.replace(/\.zip$/i, ""), files, bytes: files[0].file.size });
    }
    const top = files[0].path.split("/")[0];
    const name = files.every((f) => f.path.startsWith(top + "/")) ? top : "Uploaded tender";
    setPicked({ name, files, bytes: files.reduce((n, f) => n + f.file.size, 0) });
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    const entries = [...e.dataTransfer.items].map((i) => i.webkitGetAsEntry()).filter((x): x is FileSystemEntry => !!x);
    pick(await collect(entries));
  }

  return (
    <div
      className={`drop${over ? " over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <h1>Check a tender's drawings against its BOQ</h1>
      <p className="lead">
        Drop the tender folder or its .zip here, or choose it. The BOQ and the drawing folders are found inside it,
        whatever they are called.
      </p>
      <div className="choose">
        <button className="btn ghost" type="button" onClick={() => folderInput.current?.click()}>
          <FolderOpen size={18} aria-hidden /> Choose folder
        </button>
        <button className="btn ghost" type="button" onClick={() => zipInput.current?.click()}>
          <FileArchive size={18} aria-hidden /> Choose .zip
        </button>
        <input
          ref={folderInput} className="visually-hidden" type="file" multiple tabIndex={-1} aria-hidden
          {...({ webkitdirectory: "", directory: "" } as object)}
          onChange={(e) => pick([...(e.target.files ?? [])].map((file) => ({ path: file.webkitRelativePath || file.name, file })))}
        />
        <input
          ref={zipInput} className="visually-hidden" type="file" accept=".zip,application/zip" tabIndex={-1} aria-hidden
          onChange={(e) => pick([...(e.target.files ?? [])].map((file) => ({ path: file.name, file })))}
        />
      </div>

      {picked && (
        <div className="picked">
          <div className="what">
            <b>{picked.name}</b>
            <span>
              {picked.files.length === 1 ? ".zip archive" : `${picked.files.length.toLocaleString("en-GB")} files`} ·{" "}
              {formatBytes(picked.bytes)}
            </span>
          </div>
          <button className="btn" type="button" onClick={() => onStart(picked.files, picked.name)}>
            <Play size={16} aria-hidden /> Start comparison
          </button>
        </div>
      )}
      {(problem || error) && <p className="error-line" role="alert">{problem ?? error}</p>}

      <dl className="facts">
        <div><dt>Time</dt><dd>About 6 minutes for a tender of around 500 drawing pages.</dd></div>
        <div><dt>Privacy</dt><dd>Everything runs on this computer. Nothing is sent to an outside service.</dd></div>
        <div><dt>Kept for</dt><dd>24 hours. The upload and the results are then deleted.</dd></div>
      </dl>
    </div>
  );
}

/** Files under dropped folders (or dropped files), with paths relative to what was dropped. */
async function collect(entries: FileSystemEntry[]): Promise<UploadFile[]> {
  const out: UploadFile[] = [];
  async function walk(entry: FileSystemEntry, prefix: string): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File>((ok, fail) => (entry as FileSystemFileEntry).file(ok, fail));
      out.push({ path: prefix + entry.name, file });
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      // readEntries returns at most ~100 entries per call: read until it returns none.
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((ok, fail) => reader.readEntries(ok, fail));
        if (batch.length === 0) break;
        for (const child of batch) await walk(child, `${prefix}${entry.name}/`);
      }
    }
  }
  for (const entry of entries) await walk(entry, "");
  return out;
}

function formatBytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${Math.round(n / 1024 ** 2)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
