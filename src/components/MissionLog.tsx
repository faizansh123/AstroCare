// F11 Mission log (file 07 §4): chronological entries for measurements, assessments, symptoms, environment and
// notes, each recording who or what produced it (audit event). Export / import JSON (D16). Free text is rendered as
// plain text by React, never as HTML.
import { useRef, useState } from "react";
import type { Ctx } from "../appTypes";
import { exportLogJson, importLogJson } from "../lib/store";
import type { LogEvent } from "../types/health";
import { StatusChip } from "./StatusBadge";
import { Card, Icon } from "./ui";

const TYPES: LogEvent["type"][] = ["self-assessment", "assessment", "measurement", "lab", "environment", "crew-note", "ai-check", "import"];

export function MissionLog({ ctx }: { ctx: Ctx }) {
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"all" | LogEvent["type"]>("all");
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const shown = [...ctx.log].reverse().filter((e) => filter === "all" || e.type === filter);

  const download = () => {
    const blob = new Blob([exportLogJson(ctx.log)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `AstroCare_Mission_Log_Demo_Day${ctx.snapshot.missionDay}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const res = importLogJson(await f.text(), ctx.log);
    if ("error" in res) { setMsg(res.error); return; }
    ctx.replaceLog(res.log);
    ctx.addLog({ type: "import", author: "Crew (demo)", source: "system", text: `Imported mission log file "${f.name.slice(0, 80)}".` });
    setMsg(`Imported. Log now has ${res.log.length + 1} entries.`);
  };

  return (
    <div className="space-y-5">
      <Card title="Add a crew observation" icon="plus">
        <label htmlFor="log-note" className="sr-only">Crew observation</label>
        <textarea id="log-note" className="input min-h-[80px]" maxLength={1000} value={note}
          placeholder="E.g. repeated reading after exercise; environmental sensor check…" onChange={(e) => setNote(e.target.value)} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="mini">Saved in this browser only (localStorage). Not encrypted clinical storage.</p>
          <button type="button" className="btn-primary" disabled={!note.trim()} onClick={() => {
            ctx.addLog({ type: "crew-note", author: "Crew (demo)", source: "crew-entry", text: note.trim() });
            setNote("");
          }}>Add log entry</button>
        </div>
      </Card>

      <Card title={`Mission log (${ctx.log.length})`} icon="list" aside={
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filter by type" className="input min-h-[36px] w-auto py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">All types</option>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="button" className="btn-secondary min-h-[36px]" onClick={download} disabled={!ctx.log.length}><Icon name="download" />Export JSON</button>
          <button type="button" className="btn-ghost min-h-[36px]" onClick={() => fileRef.current?.click()}><Icon name="upload" />Import</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ""; }} />
        </div>}>
        {msg && <p role="status" className="mb-3 rounded-lg bg-card-2 px-3 py-2 text-sm text-fg-2">{msg}</p>}
        {shown.length === 0 ? (
          <p className="mini py-6 text-center">No events yet. Save a check-in, run an assessment, or add a note.</p>
        ) : (
          <ol className="divide-y divide-edge/60">
            {shown.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-card-3 px-2 py-0.5 font-semibold capitalize text-fg">{e.type.replace("-", " ")}</span>
                  {e.status && <StatusChip status={e.status} />}
                  <span className="text-fg-3">{new Date(e.createdAt).toLocaleString()} · Day {e.missionDay} · {e.author} · {e.source}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-fg-2">{e.text}</p>
                {e.reasonCodes && e.reasonCodes.length > 0 && <p className="mt-1 font-mono text-[11px] text-fg-3">Reason codes: {e.reasonCodes.join(", ")}</p>}
              </li>
            ))}
          </ol>
        )}
        <div className="mt-4 flex justify-end">
          {confirmClear ? (
            <span className="flex items-center gap-2 text-sm">
              Clear all entries in this browser?
              <button type="button" className="btn-ghost min-h-[34px] border-bad-line text-bad-fg" onClick={() => { ctx.replaceLog([]); setConfirmClear(false); }}>Yes, clear</button>
              <button type="button" className="btn-ghost min-h-[34px]" onClick={() => setConfirmClear(false)}>Cancel</button>
            </span>
          ) : (
            <button type="button" className="btn-ghost min-h-[34px]" disabled={!ctx.log.length} onClick={() => setConfirmClear(true)}>Clear log</button>
          )}
        </div>
      </Card>
    </div>
  );
}
