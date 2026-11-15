// Shared frame for the GEPA essay scenes. Two StageShow stages, a wide and a
// compact design, both rendered by the server; CSS shows one by container
// width. The poster is the finished state. Play runs the script once; Replay
// restarts it; Show result stops and returns to the poster. Controls appear
// only after mount and never under reduced motion.
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@ui-sdk/react/button';
import { Stage } from '../stageshow/kit/stage';
import type { Script } from '../stageshow/kit/act';
import type { LookTokens } from '../stageshow/kit/stage';

type Size = { width: number; height: number };

export const TOKENS: LookTokens = {
  '--ss-font': "'Inclusive Sans', sans-serif",
  '--ss-mono': "'DM Mono', monospace",
  '--ss-canvas': '#ffffff',
  '--ss-surface': '#fbfbf7',
  '--ss-chrome': '#eff2e8',
  '--ss-well': '#eff2e8',
  '--ss-fill': '#eff2e8',
  '--ss-ink-1': '#eff2e8',
  '--ss-line': '#d9dfd1',
  '--ss-text': '#596450',
  '--ss-text-strong': '#262d24',
  '--ss-text-faint': '#7d8772',
  '--ss-icon': '#596450',
  '--ss-accent': '#315c43',
  '--ss-accent-2': '#315c43',
  '--ss-accent-text': '#315c43',
  '--ss-accent-soft': '#eff2e8',
  '--ss-success': '#315c43',
  '--ss-success-soft': '#eff2e8',
  '--ss-success-text': '#315c43',
  '--ss-danger': '#9d3029',
  '--ss-danger-soft': '#fbefeb',
  '--ss-danger-text': '#9d3029',
  '--ss-warning': '#9d3029',
  '--ss-warning-soft': '#fbefeb',
  '--ss-warning-text': '#9d3029',
  '--ss-shadow-window': '0 0 0 1px #d9dfd1',
  '--ss-shadow-satellite': '0 0 0 1px #d9dfd1',
  '--ss-radius-window': '8px',
};

/** The phone layouts use this page-style panel in place of a desktop window, which would be squashed at that width. */
export function Panel({ title, toolbar, className = '', children }: { title: string; toolbar?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={`wsp-panel ${className}`}>
      <div className="wsp-panel-bar"><span className="wsp-panel-title">{title}</span>{toolbar}</div>
      <div className="wsp-panel-body">{children}</div>
    </div>
  );
}

export interface SceneFrameProps<S extends object> {
  label: string;
  caption: string;
  toolbar?: ReactNode;
  /** Which version of the scene is shown. A change returns to the poster without remounting the toolbar, so a
   * segmented control keeps keyboard focus. */
  variant?: string;
  /** The stage's inner gutter on wide screens, in design pixels. 0 when the drawing runs edge to edge. */
  inset?: 0 | 24;
  wide: Size;
  narrow: Size;
  initial: S;
  poster: S;
  script: Script<S>;
  children: (s: S, compact: boolean) => ReactNode;
}

export function SceneFrame<S extends object>({ label, caption, toolbar, variant = '', inset = 24, wide, narrow, initial, poster, script, children }: SceneFrameProps<S>) {
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    setReady(true);
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setStill(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => { setPlaying(false); }, [variant]);

  const stage = (compact: boolean) => {
    const size = compact ? narrow : wide;
    return (
      <Stage
        key={`${compact ? 'n' : 'w'}-${variant}-${run}-${playing ? 'play' : 'poster'}`}
        width={size.width}
        height={size.height}
        initial={playing ? initial : poster}
        poster={poster}
        script={playing ? script : undefined}
        play="once"
        tokens={TOKENS}
      >
        {(s) => children(s, compact)}
      </Stage>
    );
  };

  return (
    <figure className="wsp-scene" data-inset={inset}>
      {toolbar && <div className="wsp-toolbar">{toolbar}</div>}
      <div className="wsp-figure" role="img" aria-label={label}>
        <div className="wsp-twin wsp-twin-wide">{stage(false)}</div>
        <div className="wsp-twin wsp-twin-narrow">{stage(true)}</div>
      </div>
      <figcaption className="wsp-caption">
        <span>{caption}</span>
        {ready && !still && (
          <span className="wsp-controls">
            {playing ? (
              <>
                <Button onClick={() => { setRun((n) => n + 1); }}>Replay</Button>
                <Button onClick={() => setPlaying(false)}>Show result</Button>
              </>
            ) : (
              <Button onClick={() => { setRun((n) => n + 1); setPlaying(true); }}>Play</Button>
            )}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
