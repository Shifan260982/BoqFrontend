import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { createJob, downloadUrl, getJob, getSheets, type Job, type Sheet, type UploadFile } from "./api";
import { RunPanel } from "./RunPanel";
import { SheetTable } from "./SheetTable";
import { UploadPanel } from "./UploadPanel";

const POLL_MS = 2000;
/** How long a run that finishes while watched shows its READY FOR REVIEW stamp before the result opens. */
const READY_HOLD_MS = 900;

export function App() {
  const [jobId, setJobId] = useState<string | null>(() => new URLSearchParams(location.search).get("job"));
  const [job, setJob] = useState<Job | null>(null);
  const [name, setName] = useState("");
  const [upload, setUpload] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<Sheet[] | null>(null);
  const [tab, setTab] = useState(0);
  const [holding, setHolding] = useState(false);

  const remember = (id: string | null) => {
    const url = new URL(location.href);
    if (id) url.searchParams.set("job", id); else url.searchParams.delete("job");
    history.replaceState(null, "", url);
    setJobId(id);
  };

  // Follow the job until it finishes; then load its sheets once.
  useEffect(() => {
    if (!jobId) return;
    let stop = false;
    let timer: number | undefined;
    let watched = false; // seen queued or running here, so its finish is worth showing
    const tick = async () => {
      try {
        const next = await getJob(jobId);
        if (stop) return;
        setJob(next);
        setName(next.name);
        if (next.status === "queued" || next.status === "running") watched = true;
        if (next.status === "done") {
          if (watched) { setHolding(true); window.setTimeout(() => setHolding(false), READY_HOLD_MS); }
          const loaded = await getSheets(jobId);
          if (!stop) { setSheets(loaded); setTab(Math.max(0, loaded.findIndex((s) => s.name === "BOQ vs Drawings"))); }
        } else if (next.status !== "failed") timer = window.setTimeout(tick, POLL_MS);
      } catch (e) {
        if (stop) return;
        setError((e as Error).message);
        remember(null);
      }
    };
    tick();
    return () => { stop = true; window.clearTimeout(timer); };
  }, [jobId]);

  async function start(files: UploadFile[], tenderName: string) {
    setError(null);
    setName(tenderName);
    setUpload(0);
    try {
      const created = await createJob(files, setUpload);
      setJob(created);
      remember(created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpload(null);
    }
  }

  const restart = useCallback(() => { setJob(null); setSheets(null); setName(""); setError(null); remember(null); }, []);
  const done = job?.status === "done" && sheets && !holding;

  return (
    <div className="app">
      <header className={`band${done ? " has-result" : ""}`}>
        <span className="mark">Arecon · BOQ check</span>
        {done && job && (
          <div>
            <h2 className="tender-name">{job.name}</h2>
            <p className="tender-meta">
              {job.summary["BOQ Items"] !== undefined && <>{job.summary["BOQ Items"].toLocaleString("en-GB")} BOQ items · </>}
              read {when(job.finished)} · deleted after {when(job.expires)}
            </p>
          </div>
        )}
        {done && job && (
          <div className="band-actions">
            <button className="btn ghost" type="button" onClick={restart}><RotateCcw size={16} aria-hidden /> <span className="long">Check another tender</span><span className="short">New tender</span></button>
            <a className="btn primary" href={downloadUrl(job.id)} download><Download size={16} aria-hidden /> <span className="long">Download Excel (.xlsx)</span><span className="short">Download .xlsx</span></a>
          </div>
        )}
      </header>

      <section className="notice" aria-label="About these results">
        <span className="stamp">Machine-read · review before use</span>
        <p>
          The results are extracted by code (rules, OCR and word matching on the drawings), not by a person. Check every
          match against the drawing it cites before you rely on it.
        </p>
      </section>

      {done && job && job.warnings?.length > 0 && (
        <section className="notice" aria-label="Drawings not read">
          <span className="stamp failed">Drawings not read</span>
          <p>{job.warnings.join(" ")} The result leaves these drawings out.</p>
        </section>
      )}

      {done ? (
        <Result sheets={sheets} tab={tab} onTab={setTab} />
      ) : (jobId && !job && !error) || (job?.status === "done" && !sheets && !holding) ? (
        <main className="desk" aria-busy="true">
          <p className="stage-line">{job ? "Loading the result…" : "Opening the comparison…"}</p>
          <div className="loading-rows" aria-hidden><span /><span /><span /><span /><span /></div>
        </main>
      ) : (
        <main className="desk">
          {jobId || upload !== null ? (
            <RunPanel job={job} upload={upload} name={name} onRestart={restart} />
          ) : (
            <UploadPanel onStart={start} error={error} />
          )}
        </main>
      )}
    </div>
  );
}

function Result({ sheets, tab, onTab }: { sheets: Sheet[]; tab: number; onTab: (i: number) => void }) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (e: React.KeyboardEvent, i: number) => {
    const keys: Record<string, number> = { ArrowRight: (i + 1) % sheets.length, ArrowLeft: (i - 1 + sheets.length) % sheets.length, Home: 0, End: sheets.length - 1 };
    const next = keys[e.key] ?? -1;
    if (next < 0) return;
    e.preventDefault();
    onTab(next);
    tabs.current[next]?.focus();
  };
  return (
    <main className="result">
      <div className="tabs" role="tablist" aria-label="Workbook sheets">
        {sheets.map((s, i) => (
          <button
            key={s.name} ref={(el) => { tabs.current[i] = el; }} className="tab" role="tab" type="button"
            id={`tab-${i}`} aria-selected={i === tab} aria-controls="sheet" tabIndex={i === tab ? 0 : -1}
            onClick={() => onTab(i)} onKeyDown={(e) => move(e, i)}
          >
            {s.name}{s.name !== "Summary" && <span className="n">{s.rows.length.toLocaleString("en-GB")}</span>}
          </button>
        ))}
      </div>
      <div id="sheet" role="tabpanel" aria-labelledby={`tab-${tab}`} style={{ display: "contents" }}>
        <SheetTable key={sheets[tab].name} sheet={sheets[tab]} />
      </div>
    </main>
  );
}

function when(seconds: number | null): string {
  if (!seconds) return "";
  return new Date(seconds * 1000).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
