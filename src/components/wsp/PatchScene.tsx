// Scene 3: where each edit changes the model. A diagram scene: the Stage keeps
// the clock, the poster and the controls; the layers are plain DOM in the page style.
import { useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@ui-sdk/react/segmented-control';
import { Roll } from '../stageshow/kit/motion/Roll';
import type { Act } from '../stageshow/kit/act';
import { SceneFrame } from './SceneFrame';
import { EDITS, MODEL } from './data';

type Edit = 'published' | 'found';
type S = { edit: Edit; active: number };

const LAYERS = Array.from({ length: MODEL.layers }, (_, i) => i);
const changes = (edit: Edit, layer: number, part: 'attention' | 'mlp') =>
  edit === 'published'
    ? (EDITS.published.layers as readonly number[]).includes(layer) && part === 'mlp'
    : (EDITS.found.layers as readonly number[]).includes(layer) && (EDITS.found.parts as readonly string[]).includes(part);

const initial: Record<Edit, S> = {
  published: { edit: 'published', active: -1 },
  found: { edit: 'found', active: -1 },
};
const poster: Record<Edit, S> = {
  published: { edit: 'published', active: MODEL.layers - 1 },
  found: { edit: 'found', active: MODEL.layers - 1 },
};

async function script(a: Act<S>) {
  a.mark('sweep');
  await a.wait(600);
  for (let i = 0; i < MODEL.layers; i++) {
    a.put({ active: i });
    await a.wait(190);
  }
  a.mark('done');
  await a.wait(3600);
}

function Composition({ s, compact }: { s: S; compact: boolean }) {
  const active = s.active;
  const changed = active >= 0 && (changes(s.edit, active, 'mlp') || changes(s.edit, active, 'attention'));
  const status = active < 0
    ? 'Each layer adds to the model state. Green marks the parts this edit changes.'
    : active === MODEL.layers - 1
      ? 'Every layer checked. The edit touches only the green parts.'
      : changed
        ? `Layer ${active}: removing the looping direction`
        : `Layer ${active}: no change`;
  const stat = s.edit === 'published'
    ? { big: '131,072 weights, 0.016% of the model', short: '131,072 weights', small: 'MLP output only, in layers 15 and 19.', smallCompact: '0.016% of the model. MLP output only, in layers 15 and 19.' }
    : { big: 'about 61 million weights', short: 'about 61 million weights', small: 'MLP and attention outputs, in layers 10 to 22.', smallCompact: 'MLP and attention outputs, in layers 10 to 22.' };
  return (
    <div className={`wsp-patch${compact ? ' is-compact' : ''}`}>
      <div className="wsp-patch-stat">
        <p className="wsp-patch-big">{compact ? stat.short : <Roll>{stat.big}</Roll>}</p>
        <p className="wsp-patch-small">{compact ? stat.smallCompact : <Roll>{stat.small}</Roll>}</p>
      </div>
      <div className="wsp-patch-cols">
        {LAYERS.map((layer) => (
          <div key={layer} className="wsp-col" data-active={(active === layer && active < MODEL.layers - 1) || undefined}>
            <span className="wsp-cell" data-part="attention" data-on={changes(s.edit, layer, 'attention') && active >= layer ? '' : undefined} />
            <span className="wsp-cell" data-part="mlp" data-on={changes(s.edit, layer, 'mlp') && active >= layer ? '' : undefined} />
            <span className="wsp-layer">{layer}</span>
          </div>
        ))}
      </div>
      <p className="wsp-patch-status">{compact ? status : <Roll>{status}</Roll>}</p>
      <p className="wsp-patch-legend"><span className="wsp-swatch" data-on="" /><span>Changed by this edit</span><span className="wsp-swatch wsp-swatch-next" /><span>Unchanged</span><span className="wsp-patch-rows">Top row is attention. Bottom row is MLP.</span></p>
    </div>
  );
}

export default function PatchScene() {
  const [edit, setEdit] = useState<Edit>('found');
  return (
    <SceneFrame<S>
      variant={edit}
      label="Which layers each edit changes, across the model's 24 layers. The published edit changes 131,072 weights, 0.016% of the model, in the MLP output of layers 15 and 19. The edit found by the search changes about 61 million weights in the MLP and attention outputs of layers 10 to 22."
      caption="Published edit from the Sparks post. Found edit is the best GEPA run, seed 1."
      toolbar={
        <SegmentedControl aria-label="Choose an edit" value={edit} onValueChange={(v: string | null) => { if (v === 'published' || v === 'found') setEdit(v); }}>
          <SegmentedControlItem value="published">Published edit</SegmentedControlItem>
          <SegmentedControlItem value="found">Edit found by the search</SegmentedControlItem>
        </SegmentedControl>
      }
      wide={{ width: 960, height: 368 }}
      narrow={{ width: 358, height: 520 }}
      initial={initial[edit]}
      poster={poster[edit]}
      script={script}
    >
      {(s, compact) => <Composition s={s} compact={compact} />}
    </SceneFrame>
  );
}
