export const softmax = (values, temperature = 1) => {
  if (temperature === 0) return values.map((_, i) => i === values.indexOf(Math.max(...values)) ? 1 : 0);
  const max = Math.max(...values);
  const exps = values.map(x => Math.exp((x - max) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(x => x / sum);
};
export const crossEntropy = (logits, target) => -Math.log(softmax(logits)[target]);
export function gradientStep(logits, target, rate) {
  const p = softmax(logits);
  return logits.map((x, i) => x - rate * (p[i] - Number(i === target)));
}
export function attention(q, keys, values, position) {
  const scores = keys.map((k, j) => j > position ? -Infinity : k.reduce((s, x, i) => s + x * q[i], 0) / Math.sqrt(q.length));
  const weights = softmax(scores);
  const output = values[0].map((_, i) => values.reduce((s, v, j) => s + weights[j] * v[i], 0));
  return { scores, weights, output };
}
export const sigmoid = x => 1 / (1 + Math.exp(-x));
export const dpoLoss = (margin, referenceMargin, beta) => -Math.log(sigmoid(beta * (margin - referenceMargin)));
export const dpoStep = (margin, referenceMargin, beta, rate) => margin + rate * beta * (1 - sigmoid(beta * (margin - referenceMargin)));
export function topP(probabilities, threshold) {
  const sorted = probabilities.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
  let sum = 0;
  const keep = [];
  for (const item of sorted) { keep.push(item.i); sum += item.p; if (sum >= threshold) break; }
  const mass = keep.reduce((s, i) => s + probabilities[i], 0);
  return probabilities.map((p, i) => keep.includes(i) ? p / mass : 0);
}
export function bpeStep(parts) {
  const counts = new Map();
  for (let i = 0; i < parts.length - 1; i++) {
    if (parts[i] === ' ' || parts[i + 1] === ' ') continue;
    const key = JSON.stringify([parts[i], parts[i + 1]]);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  if (!counts.size) return { parts, pair: null, count: 0 };
  const [key, count] = [...counts].sort((a, b) => b[1] - a[1])[0];
  const pair = JSON.parse(key), merged = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === pair[0] && parts[i + 1] === pair[1]) { merged.push(parts[i] + parts[i + 1]); i++; }
    else merged.push(parts[i]);
  }
  return { parts: merged, pair, count };
}
