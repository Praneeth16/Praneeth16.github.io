// Static strip plot of all twelve searches, four setups by three seeds. Rendered on the server only, so it ships no JavaScript.
import { GROUPS, REFERENCES, RUNS } from './data';

const MIN = 25;
const MAX = 65;
const TICKS = [30, 40, 50, 60];
const LOW = REFERENCES.thinkingOff.math500;
const HIGH = REFERENCES.published.math500;
const at = (v: number) => `${((v - MIN) / (MAX - MIN)) * 100}%`;
const tone = (v: number) => (v < LOW ? 'low' : v > HIGH ? 'high' : 'mid');

export default function RunsChart() {
  const summary = GROUPS.map((g) => `${g.label}: ${RUNS.filter((r) => r.group === g.id).map((r) => r.math500.toFixed(1) + '%').join(', ')}`).join('. ');
  return (
    <figure className="wsp-strip" aria-label={`MATH-500 score of each of the ${RUNS.length} searches. ${summary}. Reference lines at ${LOW}% (thinking off, no edit) and ${HIGH}% (published edit).`}>
      <p className="wsp-bars-title">All {RUNS.length} searches, three seeds per setup</p>
      <div className="wsp-strip-plot">
        <div className="wsp-strip-refs" aria-hidden="true">
          <span className="wsp-strip-ref" data-side="left" style={{ left: at(LOW) }}><b>Thinking off {LOW}%</b></span>
          <span className="wsp-strip-ref" data-side="right" style={{ left: at(HIGH) }}><b>{HIGH}% Published edit</b></span>
        </div>
        <ul className="wsp-strip-rows">
          {GROUPS.map((g) => (
            <li key={g.id}>
              <span className="wsp-bars-label">{g.label}</span>
              <span className="wsp-strip-track">
                <i className="wsp-strip-line" data-ref="low" style={{ left: at(LOW) }} />
                <i className="wsp-strip-line" data-ref="high" style={{ left: at(HIGH) }} />
                {RUNS.filter((r) => r.group === g.id).map((r) => (
                  <span key={r.seed} className="wsp-strip-dot" data-tone={tone(r.math500)} style={{ left: at(r.math500) }} title={`${g.label}, seed ${r.seed}: ${r.math500.toFixed(1)}%`}>
                    <span className="wsp-strip-value">{r.math500.toFixed(1)}</span>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="wsp-strip-axis" aria-hidden="true">
          {TICKS.map((t) => <span key={t} style={{ left: at(t) }}>{t}%</span>)}
        </div>
      </div>
      <p className="wsp-strip-legend" aria-hidden="true">The dashed line is thinking off, at {LOW}%. The solid line is the published edit, at {HIGH}%.</p>
      <figcaption>MATH-500, 500 problems, two samples each. Each dot is one search. Red dots score below thinking off with no edit, and green dots score above the published edit.</figcaption>
    </figure>
  );
}
