// Static result chart for the essay intro. Rendered on the server only (no client directive), so it ships no JavaScript.
import { REFERENCES, RUNS } from './data';

const scores = RUNS.map((r) => r.math500);
const ROWS: { label: string; value: number; tone?: 'good' | 'bad' }[] = [
  { label: 'No edit, thinking on', value: REFERENCES.base.math500 },
  { label: 'No edit, thinking off', value: REFERENCES.thinkingOff.math500 },
  { label: 'Published edit', value: REFERENCES.published.math500 },
  { label: `Best of ${RUNS.length} searches`, value: Math.max(...scores), tone: 'good' },
  { label: `Worst of ${RUNS.length} searches`, value: Math.min(...scores), tone: 'bad' },
];

export default function ResultChart() {
  return (
    <figure className="wsp-bars" aria-labelledby="wsp-bars-title">
      <p className="wsp-bars-title" id="wsp-bars-title">MATH-500 accuracy of Qwen3.5-0.8B</p>
      <ul className="wsp-bars-rows">
        {ROWS.map((r) => (
          <li key={r.label} data-tone={r.tone}>
            <span className="wsp-bars-label">{r.label}</span>
            <span className="wsp-bars-track">
              <span className="wsp-bars-bar" style={{ width: `${r.value}%` }} />
              <span className="wsp-bars-value">{r.value.toFixed(1)}%</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="wsp-bars-axis" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
      <figcaption>500 problems, two samples each, strict grading. The best and worst rows come from the same kind of search with different seeds.</figcaption>
    </figure>
  );
}
