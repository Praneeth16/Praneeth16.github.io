const root = document.getElementById('genrec');
if (root) {
  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => [...root.querySelectorAll(selector)];
  const fmt = (number, digits = 2) => number.toFixed(digits);
  const blue = '#28679b', red = '#b54438', line = '#d7dce0';
  const flowStates = {
    rank: [
      ['History → text', 'Select events and express useful context.', 'tokens'],
      ['Read the context', 'A backbone pass computes token states.', 'tokens'],
      ['Pool a state', 'Represent the request as a vector h.', 'vector'],
      ['Score known items', 'A catalog head returns a ranking.', 'bars']
    ],
    generate: [
      ['History → codes', 'Represent items with semantic IDs.', 'codes'],
      ['Read the context', 'Compute states from the input sequence.', 'tokens'],
      ['Decode ID tokens', 'Each code conditions on earlier codes.', 'codes'],
      ['Resolve the ID', 'Map valid codes to eligible items.', 'bars']
    ]
  };
  const flowNotes = {
    rank: ['Context determines what the model gets to see.', 'Prefill computes the input representations.', 'A pooling rule supplies a request representation.', 'One backbone pass, then catalog scoring.'],
    generate: ['Semantic IDs ground the output vocabulary.', 'The model first processes its input.', 'Autoregressive decoding adds dependent steps.', 'Generated codes need catalog resolution and eligibility checks.']
  };
  let flowMode = 'rank', flowStep = 3;
  function mini(type) {
    if (type === 'tokens') return '<div class="gr-mini-tokens" aria-hidden="true">' + '<i></i>'.repeat(12) + '</div>';
    if (type === 'vector') return '<div class="gr-mini-vector" aria-hidden="true">' + [12, 20, 8, 17, 23, 11, 15].map(h => `<i style="height:${h}px"></i>`).join('') + '</div>';
    if (type === 'codes') return '<div class="gr-mini-codes" aria-hidden="true">[12] → [7] → [3]</div>';
    return '<div class="gr-mini-bars" aria-hidden="true">' + [88, 66, 44, 29].map(w => `<i style="width:${w}%"></i>`).join('') + '</div>';
  }
  function drawFlow() {
    $('#flow-diagram').innerHTML = flowStates[flowMode].map((node, i) => `<div class="gr-flow-node ${i === flowStep ? 'is-active' : ''}"><span class="gr-node-step">0${i + 1}</span><h4>${node[0]}</h4><p>${node[1]}</p>${mini(node[2])}</div>`).join('');
    $('#flow-status').textContent = flowNotes[flowMode][flowStep];
    $$('[data-flow]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.flow === flowMode)));
    $('#flow-next').textContent = flowStep === 3 ? 'Start walkthrough' : 'Next step';
  }
  $$('[data-flow]').forEach(b => b.addEventListener('click', () => { flowMode = b.dataset.flow; flowStep = 0; drawFlow(); }));
  $('#flow-next').addEventListener('click', () => { flowStep = (flowStep + 1) % 4; drawFlow(); });
  drawFlow();

  const catalog = [
    { id: 'harbour', title: 'Harbour Signal', genre: 'Mystery', e: [0.90, 0.10], x: 5, y: -12 },
    { id: 'orbital', title: 'Orbital Drift', genre: 'Science fiction', e: [0.20, 0.95], x: 8, y: 3 },
    { id: 'lastlight', title: 'Last Light', genre: 'Sci-fi thriller', e: [0.65, 0.60], x: 8, y: -8 },
    { id: 'field', title: 'Field Notes', genre: 'Nature documentary', e: [-0.40, -0.20], x: 8, y: 20 },
    { id: 'weekend', title: 'Weekend Detour', genre: 'Comedy', e: [-0.70, 0.05], x: 7, y: -10 },
    { id: 'tiny', title: 'Tiny Wonders', genre: 'Family', e: [-0.60, -0.70], x: 8, y: -10 }
  ];
  let selectedItem = 'harbour';
  function scoreData() {
    const h = [Number($('#mystery').value) / 100, Number($('#scifi').value) / 100];
    const items = catalog.map(item => ({ ...item, score: h[0] * item.e[0] + h[1] * item.e[1] }));
    const max = Math.max(...items.map(i => i.score));
    const denominator = items.reduce((sum, i) => sum + Math.exp(i.score - max), 0);
    items.forEach(item => { item.p = Math.exp(item.score - max) / denominator; });
    return { h, items: items.sort((a, b) => b.score - a.score) };
  }
  function drawMap(h, items) {
    const x = v => 205 + v * 142, y = v => 159 - v * 119;
    let s = '<defs><marker id="gr-vector-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b54438"/></marker></defs>';
    s += `<rect x="63" y="40" width="284" height="238" fill="none" stroke="${line}"/>`;
    s += `<path d="M63 159H347M205 40V278" stroke="${line}" fill="none"/>`;
    s += '<text x="205" y="319" text-anchor="middle">Mystery affinity</text><text transform="translate(18 159) rotate(-90)" text-anchor="middle">Sci-fi affinity</text>';
    [-1, 0, 1].forEach(t => { s += `<text x="${x(t)}" y="297" text-anchor="middle">${t}</text><text x="49" y="${y(t) + 4}" text-anchor="end">${t}</text>`; });
    s += `<line x1="205" y1="159" x2="${x(h[0])}" y2="${y(h[1])}" stroke="${red}" stroke-width="2" marker-end="url(#gr-vector-arrow)"/><circle cx="${x(h[0])}" cy="${y(h[1])}" r="5" fill="${red}"/>`;
    s += `<text x="${x(h[0])}" y="${y(h[1]) - 17}" text-anchor="middle" style="fill:${red}">user h</text>`;
    items.forEach(item => { const active = item.id === selectedItem; const anchor = item.e[0] > 0.7 ? 'end' : 'start'; const dx = anchor === 'end' ? -8 : item.x; s += `<g><circle cx="${x(item.e[0])}" cy="${y(item.e[1])}" r="${active ? 6 : 4}" fill="${active ? blue : '#7f939f'}"/><text x="${x(item.e[0]) + dx}" y="${y(item.e[1]) + item.y}" text-anchor="${anchor}">${item.title}</text></g>`; });
    $('#vector-map').innerHTML = s;
  }
  function drawScore() {
    const { h, items } = scoreData();
    $('#mystery-value').textContent = fmt(h[0]); $('#scifi-value').textContent = fmt(h[1]);
    $('#rank-list').innerHTML = items.map((item, i) => `<button type="button" class="gr-rank-row" data-item="${item.id}" aria-pressed="${item.id === selectedItem}"><span class="gr-rank-name"><b>${i + 1}. ${item.title}</b><small>${item.genre}</small></span><span class="gr-rank-score">${fmt(item.score)}</span><span class="gr-share">${fmt(item.p * 100, 1)}%<i style="width:${item.p * 100}%"></i></span></button>`).join('');
    const item = items.find(i => i.id === selectedItem);
    $('#score-readout').innerHTML = `<strong>${item.title}</strong>s = (${fmt(h[0])} × ${fmt(item.e[0])}) + (${fmt(h[1])} × ${fmt(item.e[1])})<br />s = ${fmt(item.score)} · share = ${fmt(item.p * 100, 1)}%`;
    drawMap(h, items);
  }
  $('#rank-list').addEventListener('click', e => { const b = e.target.closest('[data-item]'); if (b) { selectedItem = b.dataset.item; drawScore(); $('#rank-list').querySelector(`[data-item="${selectedItem}"]`).focus({ preventScroll: true }); } });
  ['mystery', 'scifi'].forEach(id => $('#' + id).addEventListener('input', drawScore));
  drawScore();

  function drawReward() {
    const w = Number($('#reward-weight').value);
    const events = [{name:'Complete an episode', p:0.7, w:1}, {name:'Return tomorrow', p:0.5, w}, {name:'Brief click', p:0.6, w:0.5}];
    const losses = events.map(e => -Math.log(e.p) * e.w);
    $('#reward-value').textContent = fmt(w, 1) + '×';
    $('#reward-bars').innerHTML = events.map((e, i) => `<div class="gr-weight-row ${i === 1 ? 'highlight' : ''}"><div><span>${e.name}</span><span>${fmt(losses[i], 3)}</span></div><div class="gr-weight-track"><i style="width:${losses[i] / 2.1 * 100}%"></i></div><small>p = ${e.p} · w = ${fmt(e.w, 1)} · weighted loss</small></div>`).join('');
    $('#reward-total').textContent = 'Mean weighted loss = ' + fmt(losses.reduce((a, b) => a + b, 0) / events.length, 3);
  }
  $('#reward-weight').addEventListener('input', drawReward); drawReward();

  function drawCost() {
    const tokens = Number($('#context-budget').value), size = Number($('#model-size').value), cost = tokens / 5000 * size * 100;
    $('#context-value').textContent = tokens.toLocaleString('en-US'); $('#model-value').textContent = fmt(size, 1) + '×';
    $('#cost-bars').innerHTML = `<div class="gr-cost-bar"><div><span>Reference · 5,000 tokens · 1×</span><span>100</span></div><i style="width:50%"></i></div><div class="gr-cost-bar selected"><div><span>Your configuration · cost index</span><span>${fmt(cost, 1)}</span></div><i style="width:${cost / 2}%"></i></div>`;
    const relation = cost <= 100 ? `${fmt(100 - cost, 0)}% lower estimated cost` : `${fmt(cost - 100, 0)}% higher estimated cost`;
    $('#cost-readout').textContent = relation + '. Quality requires measurement.';
  }
  ['context-budget', 'model-size'].forEach(id => $('#' + id).addEventListener('input', drawCost)); drawCost();

  const systems = {
    sasrec: ['SASRec · Learn from item order', 'A strong sequence baseline: attention over past item IDs predicts what comes next. It does not inherit a pretrained language model’s world knowledge. Its output is a score, so “Transformer” alone does not imply generated recommendations.'],
    tiger: ['TIGER · Generate a semantic address', 'The tokenizer gives an item a tuple of learned codes; the sequence-to-sequence model predicts those codes. Representation learning and next-item prediction are distinct parts of the implementation. The linked external reproduction documents departures from the original setup.'],
    plum: ['PLUM · Adapt a language backbone', 'Item tokenization, continued pretraining, and task fine-tuning bridge language knowledge and recommendation data. The reported retrieval application generates semantic IDs. Its first preprint is from 2025; the conference publication is from 2026.'],
    glide: ['GLIDE · Make discovery an objective', 'Recent history and compact long-term personalization condition a discovery-oriented model. Spotify describes beam search, identifier resolution, and integration into a ranking pipeline. Retrieval quality and serving constraints are both part of the design.'],
    think: ['OneRec-Think · Allocate a reasoning budget', 'Item alignment, reasoning activation, and reward-based enhancement link text reasoning to recommendation. The public repository makes a benchmark path inspectable; the industrial serving architecture is a separate part of the paper.'],
    genrec: ['GenRec · Read once, score known items', 'Closest to the ranking contract in Figure 1. A fixed output inventory provides grounding; quality still depends on the learned representation and objective. This article’s dot-product example is a teaching model, not a released Netflix implementation.']
  };
  function selectSystem(key) {
    $$('[data-compare]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.compare === key)));
    $$('[data-system]').forEach(row => row.classList.toggle('selected', row.dataset.system === key));
    $('#system-detail').innerHTML = `<h4>${systems[key][0]}</h4><p>${systems[key][1]}</p>`;
  }
  $$('[data-compare]').forEach(b => b.addEventListener('click', () => selectSystem(b.dataset.compare))); selectSystem('genrec');

  const milestones = [
    {key:'mf', name:'Factorization', date:'2009 overview', era:0, lane:0, source:'ref-mf', text:'A user and an item can share a latent factor space. This overview captured an influential approach to learning taste from interactions; the method itself is older than this publication.'},
    {key:'youtube', name:'YouTube DNN', date:'2016', era:1, lane:0, source:'ref-youtube', text:'Deep candidate generation and deep ranking were described as separate stages. The distinction remains useful when discussing whether a new model retrieves items, ranks them, or does both.'},
    {key:'sasrec', name:'SASRec', date:'2018', era:2, lane:1, source:'ref-sasrec', text:'Self-attention selects useful parts of an item interaction sequence for next-item prediction. The key shift is in modeling behavior over time, rather than borrowing general language knowledge.'},
    {key:'bert', name:'BERT4Rec', date:'2019', era:2, lane:1, source:'ref-bert', text:'Masked-item training builds bidirectional representations of an observed history. Masking prevents trivial access to the training target; future interactions must still be excluded at evaluation time.'},
    {key:'p5', name:'P5', date:'Mar 2022', era:3, lane:3, source:'ref-p5', text:'Recommendation tasks are expressed with personalized prompts in a text-to-text framework. The interface expands beyond one next-item task and makes language a common task format.'},
    {key:'tiger', name:'TIGER', date:'May 2023', era:3, lane:2, source:'ref-tiger', text:'Semantic codes turn an item into a sequence that a model can generate. Item identity becomes part of a learned output vocabulary rather than just a lookup in a large table.'},
    {key:'onerec', name:'OneRec', date:'Feb 2025', era:4, lane:2, source:'ref-onerec', text:'A generative framework unifies retrieval and ranking and introduces iterative preference alignment. This is a different responsibility from generating candidates for a separate downstream ranker.'},
    {key:'plum', name:'PLUM', date:'Oct 2025', era:4, lane:3, source:'ref-plum', text:'Enhanced semantic IDs and domain adaptation connect pretrained language models to industrial generative retrieval. First-preprint chronology places PLUM in 2025, although it appeared at WWW 2026.'},
    {key:'think', name:'OneRec-Think', date:'Oct 2025', era:4, lane:3, source:'ref-think', text:'Explicit reasoning becomes a trained part of recommendation. A serving design must account for the extra work that reasoning introduces.'},
    {key:'glide', name:'GLIDE', date:'Mar 2026', era:5, lane:3, source:'ref-glide', text:'Language-steerable podcast discovery combines recent behavior with a long-term user soft prompt. Personalization can mix discrete IDs, language instructions, and continuous embeddings.'},
    {key:'genrec', name:'GenRec', date:'Aug 2026 v2', era:5, lane:3, source:'ref-paper', text:'The paper turns the language backbone toward catalog ranking. It highlights how a serving output contract can change independently of the backbone’s language capabilities.'}
  ];
  const eras = ['2009', '2016', '2018–19', '2022–23', '2025', '2026'];
  const lanes = ['Latent factors & neural stages', 'Item sequences', 'Semantic-ID generation', 'Language & personalization'];
  let timelineMarkup = '<div></div>' + eras.map(e => `<div class="gr-era">${e}</div>`).join('');
  lanes.forEach((label, lane) => {
    timelineMarkup += `<div class="gr-lane-label">${label}</div>`;
    eras.forEach((_, era) => {
      const entries = milestones.filter(m => m.lane === lane && m.era === era);
      timelineMarkup += `<div class="gr-timeline-cell ${lane === 2 ? 'semantic' : lane === 3 ? 'language' : ''}">${entries.map(m => `<button type="button" data-milestone="${m.key}" aria-pressed="${m.key === 'genrec'}">${m.name}<small>${m.date}</small></button>`).join('')}</div>`;
    });
  });
  $('#timeline').innerHTML = timelineMarkup;
  function selectMilestone(key) {
    const m = milestones.find(x => x.key === key);
    $$('[data-milestone]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.milestone === key)));
    $('#milestone-detail').innerHTML = `<div><span class="gr-label">${m.date}</span><strong>${m.name}</strong></div><div><p>${m.text}</p><a href="#${m.source}">Read the primary source</a></div>`;
  }
  $('#timeline').addEventListener('click', e => { const b = e.target.closest('[data-milestone]'); if (b) selectMilestone(b.dataset.milestone); });
  selectMilestone('genrec');
  const progress = document.getElementById('reading-progress');
  if (progress) {
    const updateProgress = () => { const max = document.documentElement.scrollHeight - innerHeight; progress.style.width = `${max > 0 ? scrollY / max * 100 : 0}%`; };
    addEventListener('scroll', updateProgress, { passive: true }); updateProgress();
  }
}
