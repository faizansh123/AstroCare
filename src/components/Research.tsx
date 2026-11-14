// F12 Research provenance / NASA Research (file 07 §4, Flow C in file 15 §6): study, cohort size, units, timepoints,
// data origin, "published" vs "simulated" labels. Never mixed into the personal baseline.
import research from "../data/research.json";
import { signed } from "../lib/deltas";
import type { Ctx } from "../appTypes";
import { Card, Icon, SimTag, Unverified } from "./ui";

export function Research({ ctx }: { ctx: Ctx }) {
  const norsk = research.studies[0];
  const { baseline: b, snapshot: s } = ctx;
  const mine = [
    { label: "Systolic BP", earth: b.vitals.sbp, space: s.vitals.sbp, unit: "mmHg" },
    { label: "Diastolic BP", earth: b.vitals.dbp, space: s.vitals.dbp, unit: "mmHg" },
    { label: "Heart rate", earth: b.vitals.hr, space: s.vitals.hr, unit: "bpm" },
  ];
  return (
    <div className="space-y-5">
      <p className="callout">{research.label} {research.verification}</p>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Published: Norsk et al. 2015" icon="library" aside={<span className="flex gap-2"><span className="chip bg-space/15 text-[11px] uppercase tracking-wider text-space">Published</span><Unverified /></span>}>
          <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-fg-3">Cohort</dt><dd>{norsk.cohort}</dd>
            <dt className="text-fg-3">Timepoints</dt><dd>{norsk.timepoints}</dd>
            <dt className="text-fg-3">Origin</dt><dd>{norsk.origin}</dd>
          </dl>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-fg-3"><th className="py-1">Measure</th><th className="py-1 text-right">Earth</th><th className="py-1 text-right">ISS</th><th className="py-1 text-right">Change</th></tr></thead>
            <tbody>{norsk.values.map((v) => (
              <tr key={v.label} className="num border-t border-edge/60"><td className="py-2">{v.label}</td><td className="py-2 text-right">{v.earth}</td><td className="py-2 text-right">{v.space} {v.unit}</td><td className="py-2 text-right">{signed(v.space - v.earth, 0)}</td></tr>
            ))}</tbody>
          </table>
          <p className="mini mt-2">{norsk.citation}</p>
          <a className="btn-ghost mt-3" href={norsk.url} target="_blank" rel="noopener noreferrer">Open the original paper<Icon name="external" /></a>
        </Card>

        <Card title="Simulated: this astronaut" icon="user" aside={<SimTag />}>
          <p className="mini mb-3">Fictional preflight baseline vs today's simulated reading. A different source from the study: do not mix cohorts or infer personal thresholds from group means.</p>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-fg-3"><th className="py-1">Measure</th><th className="py-1 text-right">Earth</th><th className="py-1 text-right">In-flight</th><th className="py-1 text-right">Change</th></tr></thead>
            <tbody>{mine.map((v) => (
              <tr key={v.label} className="num border-t border-edge/60"><td className="py-2">{v.label}</td><td className="py-2 text-right">{v.earth}</td><td className="py-2 text-right">{v.space ?? "—"} {v.unit}</td><td className="py-2 text-right">{v.space === undefined ? "—" : signed(v.space - v.earth, 0)}</td></tr>
            ))}</tbody>
          </table>
        </Card>
      </div>

      <Card title="Other sources" icon="book">
        <ul className="divide-y divide-edge/60">
          {research.studies.slice(1).map((st) => (
            <li key={st.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm text-fg">{st.citation}</p>
                <p className="mini">Origin: {st.origin} · Cohort: {st.cohort}</p>
              </div>
              <a className="inline-flex items-center gap-1 text-sm text-accent-2 hover:underline" href={st.url} target="_blank" rel="noopener noreferrer">Open<Icon name="external" className="h-3.5 w-3.5" /></a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
