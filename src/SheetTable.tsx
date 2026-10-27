import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Cell, Sheet } from "./api";

const STATUS_COLUMNS = ["Drawing Status", "BOQ Status"];
const PART_COLUMN = "BOQ Part";
const WIDE = /Description|Evidence|\(list\)|Parent|Other|Note|Quantities|Reason|Drawing Item/;
/** Long labels that only orient the reader: kept narrow so the status stays on screen. */
const LABEL = /^(BOQ Part|Section|Buildings|Disciplines|Buildings on Drawings|BOQ Location)$/;
/** The column naming the row's item: kept in view while the table scrolls sideways. */
const ITEM = ["Item Description", "Drawing Item"];

function cellClass(header: string, numeric: boolean): string {
  if (numeric) return "num nowrap";
  if (LABEL.test(header)) return "wide label";
  return WIDE.test(header) ? "wide" : "nowrap";
}

/** Status fills, as in the workbook (export._STATUS_FILL). */
const STATUS_FILL: Record<string, string> = {
  "Shown on drawings": "var(--shown)",
  "Mentioned in drawing text": "var(--mentioned)",
  "Possible match (review)": "var(--possible)",
  "Not found on drawings": "var(--notfound)",
  "Not expected on drawings (excluded)": "var(--notfound)",
  "Matched in BOQ": "var(--shown)",
  "Not in BOQ": "var(--notinboq)",
};

export function SheetTable({ sheet }: { sheet: Sheet }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [part, setPart] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const statusAt = sheet.headers.findIndex((h) => STATUS_COLUMNS.includes(h));
  const partAt = sheet.headers.indexOf(PART_COLUMN);
  const numeric = useMemo(
    () => sheet.headers.map((_, c) => sheet.rows.some((r) => typeof r[c] === "number") && sheet.rows.every((r) => r[c] === null || typeof r[c] === "number")),
    [sheet],
  );
  // A column with any fraction shows two decimals throughout, so right-aligned figures line up.
  const decimals = useMemo(
    () => sheet.headers.map((_, c) => sheet.rows.some((r) => typeof r[c] === "number" && !Number.isInteger(r[c]))),
    [sheet],
  );
  const pinAt = sheet.headers.findIndex((h) => ITEM.includes(h));
  const options = (at: number) => (at < 0 ? [] : [...new Set(sheet.rows.map((r) => String(r[at] ?? "")).filter(Boolean))]);
  const statuses = useMemo(() => options(statusAt), [sheet, statusAt]);
  const parts = useMemo(() => options(partAt), [sheet, partAt]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sheet.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) =>
        (!status || row[statusAt] === status) &&
        (!part || row[partAt] === part) &&
        (!q || row.some((v) => v !== null && String(v).toLowerCase().includes(q))));
  }, [sheet, query, status, part, statusAt, partAt]);

  return (
    <>
      <div className="tools">
        <label className="field">
          <Search size={16} aria-hidden />
          <span className="visually-hidden">Search this sheet</span>
          <input className="search" type="search" placeholder="Search items, evidence, drawings…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        {statusAt >= 0 && (
          <label>
            <span className="visually-hidden">Status</span>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        )}
        {partAt >= 0 && parts.length > 1 && (
          <label>
            <span className="visually-hidden">BOQ part</span>
            <select className="select" value={part} onChange={(e) => setPart(e.target.value)}>
              <option value="">All parts</option>
              {parts.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        )}
        <span className="count" aria-live="polite">
          {rows.length === sheet.rows.length ? `${rows.length.toLocaleString("en-GB")} rows` : `${rows.length.toLocaleString("en-GB")} of ${sheet.rows.length.toLocaleString("en-GB")} rows`}
        </span>
      </div>

      <div className="table-wrap" tabIndex={0} aria-label={`${sheet.name} table`}>
        {sheet.rows.length === 0 ? (
          <p className="empty"><b>This sheet has no rows.</b> Nothing in the tender fell into it.</p>
        ) : rows.length === 0 ? (
          <p className="empty"><b>No rows match.</b> Clear the search or choose another status.</p>
        ) : (
          <table>
            <thead>
              <tr>{sheet.headers.map((h, c) => <th key={c} className={[numeric[c] && "num", c === pinAt && "pin"].filter(Boolean).join(" ") || undefined} scope="col">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map(({ row, index }) => (
                <tr
                  key={index}
                  aria-expanded={open === index}
                  onClick={() => setOpen(open === index ? null : index)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen(open === index ? null : index))}
                  tabIndex={0}
                >
                  {row.map((value, c) => (
                    <td key={c} className={cellClass(sheet.headers[c], numeric[c]) + (c === pinAt ? " pin" : "")}>
                      {c === statusAt && value ? <span className="chip" style={{ background: STATUS_FILL[String(value)] }}>{String(value)}</span>
                        : cellClass(sheet.headers[c], numeric[c]).startsWith("wide") ? <div>{show(value, decimals[c])}</div> : show(value, decimals[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function show(value: Cell, decimals: boolean): string {
  if (value === null) return "";
  if (typeof value === "number") return value.toLocaleString("en-GB", decimals ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined);
  return String(value);
}
