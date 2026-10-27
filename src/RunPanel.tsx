import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Job } from "./api";

const STAMPS = ["Received", "Reading drawings", "Matching", "Ready for review"];

/** Which stamp a run has reached, from the stage the server reports. */
function reached(job: Job | null): number {
  if (!job || job.status === "queued") return 0;
  if (job.status === "done") return 3;
  if (/Matching|Writing/.test(job.stage)) return 2;
  return 1;
}

interface Props {
  job: Job | null;
  /** Share of the upload sent, while uploading. */
  upload: number | null;
  name: string;
  onRestart: () => void;
}

export function RunPanel({ job, upload, name, onRestart }: Props) {
  const now = useNow(job?.status === "failed" ? null : 1000);
  const at = reached(job);
  const failed = job?.status === "failed";
  const started = job?.started ?? null;

  return (
    <section className="run" aria-live="polite">
      <h1>{failed ? "The comparison stopped" : upload !== null ? "Uploading the tender" : job?.status === "done" ? "Ready for review" : "Comparing drawings with the BOQ"}</h1>
      <p className="sub">{name}</p>

      <div className="stamps">
        {STAMPS.map((label, i) => {
          const isFailed = failed && i === at;
          const state = isFailed ? "failed" : i < at || (i === at && i === 3) ? "done" : i === at && upload === null ? "inking" : "pending";
          return (
            <span key={label} className={`stamp ${state === "done" ? "current" : state}`} aria-current={state === "inking" ? "step" : undefined}>
              {isFailed ? "Run failed" : label}
            </span>
          );
        })}
      </div>

      {upload !== null && (
        <>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(upload * 100)}>
            <span style={{ width: `${upload * 100}%` }} />
          </div>
          <p className="stage-line"><b>{Math.round(upload * 100)}%</b> sent</p>
        </>
      )}

      {upload === null && job && !failed && (
        <p className="stage-line">
          <b>{job.status === "queued" ? "Waiting for the previous comparison to finish" : job.stage}</b>
          {started && <> · {elapsed(now - started * 1000)}</>}
          <br />You can leave this page open; the result appears here when it is ready.
        </p>
      )}

      {failed && job && (
        <>
          <p className="error" role="alert">{job.error}</p>
          {job.log.length > 0 && <pre className="log" aria-label="Last lines of the comparison log">{job.log.join("\n")}</pre>}
          <div className="actions">
            <button className="btn" type="button" onClick={onRestart}><RotateCcw size={16} aria-hidden /> Check another tender</button>
          </div>
        </>
      )}
    </section>
  );
}

function useNow(every: number | null): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (every === null) return;
    const t = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
}

function elapsed(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
}
