import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { expect, test, beforeAll } from 'vitest';
import { RUNS, REFERENCES, SPLIT, GROUPS } from '../components/wsp/data';
import LoopScene from '../components/wsp/LoopScene';
import SearchStepScene from '../components/wsp/SearchStepScene';
import PatchScene from '../components/wsp/PatchScene';
import SeedsScene from '../components/wsp/SeedsScene';
import SplitScene from '../components/wsp/SplitScene';

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = (q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }) as unknown as MediaQueryList;
  }
});

function ranks(values: number[]) {
  const order = values.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]);
  const out = new Array<number>(values.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    for (let k = i; k <= j; k++) out[order[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return out;
}
function pearson(a: number[], b: number[]) {
  const n = a.length;
  const ma = a.reduce((x, y) => x + y, 0) / n;
  const mb = b.reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return num / Math.sqrt(da * db);
}
const spearman = (x: number[], y: number[]) => pearson(ranks(x), ranks(y));
const math = RUNS.map((r) => r.math500);

test('data: twelve runs, three per group, six below thinking off, best run 60.6', () => {
  expect(RUNS).toHaveLength(12);
  for (const g of GROUPS) expect(RUNS.filter((r) => r.group === g.id)).toHaveLength(3);
  expect(RUNS.filter((r) => r.math500 < REFERENCES.thinkingOff.math500)).toHaveLength(6);
  expect(Math.max(...math)).toBe(60.6);
});

test('data: rank correlations round to 0.11 for the search score and 0.77 for held-out', () => {
  const search = spearman(RUNS.map((r) => r.searchScore), math);
  const held = spearman(RUNS.map((r) => r.heldOut), math);
  expect(search.toFixed(2)).toBe('0.11');
  expect(held.toFixed(2)).toBe('0.77');
  expect(SPLIT.rankCorrelation.searchOwnScore).toBe(0.11);
  expect(SPLIT.rankCorrelation.heldOut).toBe(0.77);
});

const scenes: [string, () => ReactElement][] = [
  ['loop', () => <LoopScene />],
  ['search step', () => <SearchStepScene />],
  ['patch', () => <PatchScene />],
  ['seeds', () => <SeedsScene />],
  ['split', () => <SplitScene />],
];

for (const [name, Scene] of scenes) {
  test(`scene renders its poster and exposes a full-sentence aria-label: ${name}`, () => {
    const { container, unmount } = render(<Scene />);
    const figure = container.querySelector('.wsp-figure');
    expect(figure).not.toBeNull();
    const label = figure!.getAttribute('aria-label') ?? '';
    expect(label.length).toBeGreaterThan(40);
    expect(label.endsWith('.')).toBe(true);
    expect(container.querySelectorAll('.ss-stage').length).toBe(2);
    unmount();
  });
}

test('seeds scene: the segmented control changes the three values shown', async () => {
  const user = userEvent.setup();
  const { container } = render(<SeedsScene />);
  const figure = container.querySelector('.wsp-figure')!;
  expect(figure.getAttribute('aria-label')).toContain('60.6%');
  const shown = () => Array.from(container.querySelectorAll('.wsp-run-value')).map((el) => el.textContent);
  expect(shown().slice(0, 3)).toEqual(['32.0%', '60.6%', '40.6%']);
  await user.click(screen.getByRole('radio', { name: 'No GEPA' }));
  expect(container.querySelector('.wsp-figure')!.getAttribute('aria-label')).toContain('59.4%');
  expect(shown().slice(0, 3)).toEqual(['59.4%', '36.6%', '43.3%']);
  expect(within(container).queryAllByText('60.6%')).toHaveLength(0);
});
