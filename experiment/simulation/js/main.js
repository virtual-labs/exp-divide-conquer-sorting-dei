// ===== DOM =====
const $ = id => document.getElementById(id);
const algoSelect = $('algoSelect'), arrayType = $('arrayType'), runBtn = $('runBtn'), resetBtn = $('resetBtn');
const autoRunBtn = $('autoRun'), originalArrayEl = $('originalArray');
const stepIndex = $('stepIndex'), stepTotal = $('stepTotal'), prevStep = $('prevStep'), nextStep = $('nextStep');
const pseudoContainer = $('pseudoContainer'), factsText = $('factsText'), nRange = $('nRange'), nValue = $('nValue');
const speedMenu = $('speedMenu');
const customInputContainer = $('customInputContainer'), customArrayInput = $('customArrayInput');
const treeContainer = $('treeContainer'), treeCanvas = $('treeCanvas');
const opDetail = $('opDetail'), opLabel = $('opLabel'), opCells = $('opCells');
const speedButtons = speedMenu.querySelectorAll('button');

let autoRunSpeed = null, comparisonCount = 0, baseArray = [], originalArray = [], steps = [], curStep = -1, stepCounter = 0, autoRunInterval = null, treeData = null;
let selectedAlgoName = '';

const PSEUDO_CODE = {
  merge: [
    "function mergeSort(A)",
    "    if size(A) ≤ 1",
    "        return A                        // BASE CASE",
    "    mid ← floor(size(A) / 2)",
    "    left  ← mergeSort(A[0 … mid-1])     // DIVIDE (left)",
    "    right ← mergeSort(A[mid … end])     // DIVIDE (right)",
    "    return merge(left, right)           // MERGE",
    "",
    "function merge(L, R)",
    "    result ← empty list",
    "    while L and R are not empty",
    "        if L[0] ≤ R[0]",
    "            move L[0] → result          // COMPARE & MOVE",
    "        else",
    "            move R[0] → result",
    "    append remaining L or R to result",
    "    return result"
  ],
  quick: [
    "function quickSort(A, l, r)",
    "    if l ≥ r",
    "        return                          // BASE CASE",
    "    p ← partitionMedian3(A, l, r)       // PARTITION",
    "    quickSort(A, l, p - 1)              // LEFT SUBARRAY",
    "    quickSort(A, p + 1, r)              // RIGHT SUBARRAY",
    "",
    "function partitionMedian3(A, l, r)",
    "    m ← floor((l + r) / 2)",
    "    pivot ← median(A[l], A[m], A[r])    // CHOOSE PIVOT",
    "    swap pivot with A[r - 1]             // pivot at end-1",
    "    i ← l",
    "    for j ← l to r - 2",
    "        if A[j] < pivot",
    "            swap A[i], A[j]              // SWAP",
    "            i ← i + 1",
    "    swap A[i], A[r - 1]                  // FINAL PIVOT PLACE",
    "    return i"
  ]
};

function renderPseudocode(algo) {
  pseudoContainer.innerHTML = '';
  if (!PSEUDO_CODE[algo]) return;
  PSEUDO_CODE[algo].forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'pseudo-line';
    div.dataset.line = i + 1;
    // Render with original spaces, use nbsp for leading spaces if needed, or just white-space: pre
    div.innerHTML = `<span class="pseudo-arrow">➤</span><span class="ln">${i + 1}</span><span class="pseudo-content">${line || '&nbsp;'}</span>`;
    pseudoContainer.appendChild(div);
  });
}

algoSelect.value = "";
factsText.textContent = 'Select an algorithm to view facts.';
nRange.value = 0; nValue.textContent = '0';
nRange.addEventListener('input', () => { nValue.textContent = nRange.value });

algoSelect.addEventListener('change', () => {
  if (!algoSelect.value) return;
  resetLeftPanel();
  resetVisualization();
  selectedAlgoName = algoSelect.value === 'merge' ? 'Merge Sort' : 'Quick Sort';
  renderPseudocode(algoSelect.value);
  setFacts();
});

arrayType.addEventListener('change', () => {
  if (arrayType.value === 'custom') { customInputContainer.classList.remove('hidden'); nRange.disabled = true; nValue.parentElement.style.opacity = '0.5' }
  else { customInputContainer.classList.add('hidden'); nRange.disabled = false; nValue.parentElement.style.opacity = '1' }
});

function randArr(n) { return Array.from({ length: n }, () => Math.floor(Math.random() * 99) + 1) }
function mkNode(arr) { return { arr: arr.slice(), left: null, right: null, merged: null } }

// ===== MERGE SORT =====
function mergeSortTrace(arr) {
  treeData = mkNode(arr);
  const fullArr = [...arr]; // Working copy

  function rec(a, l, r, node) {
    const sub = a.slice(l, r + 1);
    steps.push({
      type: 'split', desc: `Split Subarray: [${sub.join(', ')}]`, tree: { node, phase: 'split' },
      vis: { cells: sub.map(v => ({ val: v })), label: 'Split Subarray' }, step: ++stepCounter
    });

    if (l >= r) {
      node.merged = [a[l]];
      steps.push({
        type: 'base', desc: `Base Case: ${a[l]} is already sorted.`, tree: { node, phase: 'base' },
        vis: {
          cells: a.map((v, idx) => ({
            val: v,
            cls: idx === l ? 'hl-placed' : 'hl-dim',
            top: idx === l ? '✓' : ''
          })),
          label: 'Base Case'
        }, step: ++stepCounter
      });
      return [a[l]];
    }

    const mid = l + Math.floor((r - l) / 2);
    const L_arr = a.slice(l, mid + 1);
    const R_arr = a.slice(mid + 1, r + 1);
    node.left = mkNode(L_arr);
    node.right = mkNode(R_arr);

    // Divide step
    const dc = [];
    for (let i = l; i <= mid; i++) dc.push({ val: a[i], cls: 'hl-left', top: i === l ? 'Left' : '' });
    dc.push({ sep: '|' });
    for (let i = mid + 1; i <= r; i++) dc.push({ val: a[i], cls: 'hl-right', top: i === mid + 1 ? 'Right' : '' });

    steps.push({
      type: 'divide', desc: `Divide into Left [${L_arr.join(', ')}] and Right [${R_arr.join(', ')}]`,
      tree: { node, phase: 'divide' }, vis: { cells: dc, label: 'Divide Step' }, step: ++stepCounter
    });

    const sL = rec(a, l, mid, node.left);
    const sR = rec(a, mid + 1, r, node.right);

    // Merge start
    const mc = [];
    sL.forEach((v, i) => mc.push({ val: v, cls: 'hl-left', top: i === 0 ? 'Left' : '' }));
    mc.push({ sep: '+' });
    sR.forEach((v, i) => mc.push({ val: v, cls: 'hl-right', top: i === 0 ? 'Right' : '' }));

    steps.push({
      type: 'merge-start', desc: `Preparing to Merge [${sL.join(', ')}] and [${sR.join(', ')}]`,
      tree: { node, phase: 'merge-start' }, vis: { cells: mc, label: 'Merge' }, step: ++stepCounter
    });

    const merged = [];
    let i = 0, j = 0;
    while (i < sL.length && j < sR.length) {
      const cc = [];
      sL.forEach((v, k) => cc.push({ val: v, cls: k === i ? 'hl-compare' : '', top: k === i ? 'i' : '' }));
      cc.push({ sep: 'vs' });
      sR.forEach((v, k) => cc.push({ val: v, cls: k === j ? 'hl-compare' : '', top: k === j ? 'j' : '' }));
      if (merged.length) {
        cc.push({ sep: '→' });
        merged.forEach(v => cc.push({ val: v, cls: 'hl-placed' }));
      }
      steps.push({
        type: 'compare', desc: `Compare ${sL[i]} vs ${sR[j]}`,
        tree: { node, phase: 'merging' }, vis: { cells: cc, label: 'Compare' }, step: ++stepCounter
      });

      if (sL[i] <= sR[j]) {
        merged.push(sL[i++]);
      } else {
        merged.push(sR[j++]);
      }

      // Show placement
      const pc = [];
      sL.forEach((v, k) => pc.push({ val: v, cls: k === i ? 'hl-compare' : '', top: k === i ? 'i' : '' }));
      pc.push({ sep: '+' });
      sR.forEach((v, k) => pc.push({ val: v, cls: k === j ? 'hl-compare' : '', top: k === j ? 'j' : '' }));
      pc.push({ sep: '→' });
      merged.forEach(v => pc.push({ val: v, cls: 'hl-placed' }));

      steps.push({
        type: 'place', desc: `Placed ${merged[merged.length - 1]} into merged result`,
        tree: { node, phase: 'merging' }, vis: { cells: pc, label: 'Merged' }, step: ++stepCounter
      });
    }

    while (i < sL.length) merged.push(sL[i++]);
    while (j < sR.length) merged.push(sR[j++]);

    node.merged = merged.slice();
    // Update the array 'a' for subsequent merges
    for (let k = 0; k < merged.length; k++) {
      a[l + k] = merged[k];
    }

    steps.push({
      type: 'merge-done', desc: `Merged Subarray Result → [${merged.join(', ')}]`,
      tree: { node, phase: 'merged' },
      vis: { cells: merged.map(v => ({ val: v, cls: 'hl-placed' })), label: 'Sorted' }, step: ++stepCounter
    });
    return merged;
  }
  rec(fullArr, 0, arr.length - 1, treeData);
}

// ===== QUICK SORT =====
function quickSortTrace(arr) {
  treeData = mkNode(arr);
  function rec(a, l, r, node) {
    const sub = a.slice(l, r + 1);
    steps.push({
      type: 'q-split', desc: `Subarray to Sort: [${sub.join(', ')}]`, tree: { node, phase: 'split' },
      vis: { cells: sub.map(v => ({ val: v })), label: 'Subarray' }, step: ++stepCounter
    });
    if (l > r) { node.merged = []; return }
    if (l === r) {
      node.merged = [a[l]];
      // Pedagogical Requirement: show base case within array context
      steps.push({
        type: 'base', desc: `Base Case: ${a[l]} is already sorted.`, tree: { node, phase: 'base' },
        vis: {
          cells: a.map((v, idx) => ({
            val: v,
            cls: idx === l ? 'hl-placed' : 'hl-dim',
            top: idx === l ? 'Base ✓' : ''
          })),
          label: 'Base Case'
        }, step: ++stepCounter
      });
      return;
    }
    if (r - l === 1) {
      if (a[l] > a[r]) {
        [a[l], a[r]] = [a[r], a[l]];
        steps.push({
          type: 'swap', desc: `Swap ${a[r]} ↔ ${a[l]} to sort pair`, tree: { node, phase: 'partition' },
          vis: { cells: [{ val: a[l], cls: 'hl-swap', top: 'Swap' }, { val: a[r], cls: 'hl-swap', top: 'Swap' }], label: 'Swap' }, step: ++stepCounter
        });
      }
      node.merged = a.slice(l, r + 1);
      steps.push({
        type: 'base', desc: `Sorted Pair: [${a.slice(l, r + 1).join(', ')}]`, tree: { node, phase: 'base' },
        vis: { cells: a.slice(l, r + 1).map(v => ({ val: v, cls: 'hl-placed' })), label: 'Sorted' }, step: ++stepCounter
      });
      return;
    }

    // Median of Three (M3) Selection
    const c = Math.floor((l + r) / 2);
    const motCells = a.slice(l, r + 1).map((v, k) => {
      const idx = k + l;
      if (idx === l) return { val: v, cls: 'hl-left', top: 'First' };
      if (idx === c) return { val: v, cls: 'hl-pivot', top: 'Mid' };
      if (idx === r) return { val: v, cls: 'hl-right', top: 'Last' };
      return { val: v };
    });
    steps.push({
      type: 'pivot-sel', desc: `Median-of-Three: first=${a[l]}, mid=${a[c]}, last=${a[r]}`,
      tree: { node, phase: 'partition' }, vis: { cells: motCells, label: 'Pivot (M3)' }, step: ++stepCounter
    });

    if (a[l] > a[c]) [a[l], a[c]] = [a[c], a[l]];
    if (a[l] > a[r]) [a[l], a[r]] = [a[r], a[l]];
    if (a[c] > a[r]) [a[c], a[r]] = [a[r], a[c]];
    [a[c], a[r - 1]] = [a[r - 1], a[c]]; // Move pivot to penultimate position

    const pi = r - 1, pv = a[pi];
    const pvCells = a.slice(l, r + 1).map((v, k) => {
      if (k + l === pi) return { val: v, cls: 'hl-pivot', top: 'Pivot' };
      return { val: v };
    });
    steps.push({
      type: 'pivot', desc: `Pivot Selected: ${pv}. All partitioning will be around this value.`, tree: { node, phase: 'partition' },
      vis: { cells: pvCells, label: 'Pivot Selected' }, step: ++stepCounter
    });

    let i = l + 1, j = r - 2;
    while (true) {
      while (i <= j && a[i] < pv) {
        steps.push({
          type: 'moveP', desc: `i moves right: ${a[i]} < pivot ${pv}`, tree: { node, phase: 'partition' },
          vis: { cells: mkQSCells(a, l, r, pi, i, j, 'i'), label: 'Compare' }, step: ++stepCounter
        });
        i++;
      }
      while (i <= j && a[j] > pv) {
        steps.push({
          type: 'moveQ', desc: `j moves left: ${a[j]} > pivot ${pv}`, tree: { node, phase: 'partition' },
          vis: { cells: mkQSCells(a, l, r, pi, i, j, 'j'), label: 'Compare' }, step: ++stepCounter
        });
        j--;
      }
      if (i < j) {
        steps.push({
          type: 'swap', desc: `Swap arr[${i}]=${a[i]} and arr[${j}]=${a[j]}`, tree: { node, phase: 'partition' },
          vis: { cells: mkQSCells(a, l, r, pi, i, j, 'swap'), label: 'Swap' }, step: ++stepCounter
        });
        [a[i], a[j]] = [a[j], a[i]];
        i++; j--;
      } else break;
    }

    [a[pi], a[i]] = [a[i], a[pi]];
    const fpCells = a.slice(l, r + 1).map((v, k) => {
      if (k + l === i) return { val: v, cls: 'hl-pivot', top: 'Pivot ✓' };
      return { val: v };
    });
    steps.push({
      type: 'pivot-place', desc: `Pivot ${pv} is placed at its final sorted position ${i}`, tree: { node, phase: 'partition' },
      vis: { cells: fpCells, label: 'Pivot Positioned' }, step: ++stepCounter
    });

    const leftSub = a.slice(l, i), rightSub = a.slice(i + 1, r + 1);
    node.left = mkNode(leftSub); node.right = mkNode(rightSub);

    const splitCells = [];
    leftSub.forEach((v, k) => splitCells.push({ val: v, cls: 'hl-left', top: k === 0 ? 'Left' : '' }));
    splitCells.push({ val: pv, cls: 'hl-pivot', top: 'Pivot' });
    rightSub.forEach((v, k) => splitCells.push({ val: v, cls: 'hl-right', top: k === 0 ? 'Right' : '' }));
    steps.push({
      type: 'partition-done', desc: `Partition Done: [${leftSub.join(', ')}] | ${pv} | [${rightSub.join(', ')}]`, tree: { node, phase: 'divide' },
      vis: { cells: splitCells, label: 'Partition' }, step: ++stepCounter
    });

    rec(a, l, i - 1, node.left);
    rec(a, i + 1, r, node.right);
    node.merged = a.slice(l, r + 1);
    steps.push({
      type: 'combine', desc: `Combined sorted partitions: [${node.merged.join(', ')}]`, tree: { node, phase: 'merged' },
      vis: { cells: node.merged.map(v => ({ val: v, cls: 'hl-placed' })), label: 'Sorted' }, step: ++stepCounter
    });
  }
  rec(arr, 0, arr.length - 1, treeData);
}


function mkQSCells(a, l, r, pi, i, j, mode) {
  return a.slice(l, r + 1).map((v, k) => {
    const idx = k + l;
    if (idx === pi) return { val: v, cls: 'hl-pivot', top: 'P' };
    if (mode === 'swap' && idx === i) return { val: v, cls: 'hl-swap', top: 'i (swap)' };
    if (mode === 'swap' && idx === j) return { val: v, cls: 'hl-swap', top: 'j (swap)' };
    if (idx === i) return { val: v, cls: 'hl-compare', top: 'i →' };
    if (idx === j) return { val: v, cls: 'hl-compare', top: '← j' };
    return { val: v };
  });
}

// ===== RENDER OP DETAIL =====
function renderOpDetail(s) {
  opLabel.textContent = s.vis ? s.vis.label : '';
  opCells.innerHTML = '';
  if (!s.vis || !s.vis.cells) return;
  s.vis.cells.forEach(c => {
    if (c.sep) {
      const sp = document.createElement('span'); sp.className = 'op-separator'; sp.textContent = c.sep;
      opCells.appendChild(sp); return;
    }
    const wrap = document.createElement('span'); wrap.className = 'op-cell-wrapper';
    const topLbl = document.createElement('span'); topLbl.className = 'op-cell-top-label'; topLbl.textContent = c.top || '';
    if (c.cls === 'hl-pivot') topLbl.style.color = '#92400e';
    else if (c.cls === 'hl-left') topLbl.style.color = '#1e40af';
    else if (c.cls === 'hl-right') topLbl.style.color = '#065f46';
    else if (c.cls === 'hl-swap') topLbl.style.color = '#991b1b';
    else if (c.cls === 'hl-compare') topLbl.style.color = '#9a3412';
    wrap.appendChild(topLbl);
    const cell = document.createElement('span'); cell.className = 'op-cell'; cell.textContent = c.val;
    if (c.cls) cell.classList.add(c.cls);
    wrap.appendChild(cell);
    opCells.appendChild(wrap);
  });
}

// ===== RENDER TREE =====
function getTreeState(upTo) {
  const m = new Map(); let act = null;
  for (let i = 0; i <= upTo && i < steps.length; i++) { const s = steps[i]; if (s.tree) { m.set(s.tree.node, s.tree.phase); act = s.tree.node } }
  return { states: m, active: act };
}

// Map phase to descriptive tag — algorithm-aware
function phaseToTag(phase, algo) {
  if (algo === 'merge') {
    switch (phase) {
      case 'split': return { cls: 'ph-split', text: 'Split' };
      case 'divide': return { cls: 'ph-split', text: 'Divide Array' };
      case 'merge-start': return { cls: 'ph-merge', text: 'Merge' };
      case 'merging': return { cls: 'ph-compare', text: 'Compare' };
      case 'merge-done': return { cls: 'ph-sorted', text: 'Merge Result' };
      case 'merged': return { cls: 'ph-sorted', text: 'Merge Result' };
      case 'base': return { cls: 'ph-sorted', text: 'Base Case' };
      default: return { cls: 'ph-split', text: 'Split' };
    }
  } else {
    switch (phase) {
      case 'split': return { cls: 'ph-split', text: 'Subarray' };
      case 'divide': return { cls: 'ph-split', text: 'Divide Around Pivot' };
      case 'partition': return { cls: 'ph-partition', text: 'Partition (Pivot M3)' };
      case 'merge-start': return { cls: 'ph-merge', text: 'Combine' };
      case 'merging': return { cls: 'ph-compare', text: 'Compare' };
      case 'merged': return { cls: 'ph-sorted', text: 'Sorted' };
      case 'combine': return { cls: 'ph-sorted', text: 'Sorted' };
      case 'base': return { cls: 'ph-sorted', text: 'Base Case' };
      default: return { cls: 'ph-split', text: 'Subarray' };
    }
  }
}

function nodeWidth(len) {
  return Math.max(len, 1) * 36; // 36 = cell width
}

function renderTree(upTo) {
  treeCanvas.innerHTML = '';
  if (selectedAlgoName) {
    const h = document.createElement('div'); h.className = 'tree-heading';
    h.textContent = selectedAlgoName; treeCanvas.appendChild(h);
  }
  if (!treeData) { const ph = document.createElement('div'); ph.className = 'tree-placeholder'; ph.textContent = 'Generate array and step through'; treeCanvas.appendChild(ph); return }
  const { states, active } = getTreeState(upTo);
  if (!states.size) { const ph = document.createElement('div'); ph.className = 'tree-placeholder'; ph.textContent = 'Step through to build tree'; treeCanvas.appendChild(ph); return }
  const algo = algoSelect.value;

  // BFS on FULL tree structure (includes unvisited nodes for spacing)
  const allLevels = []; let queue = [treeData];
  while (queue.length) {
    allLevels.push([...queue]);
    const nq = [];
    for (const n of queue) { if (n.left) nq.push(n.left); if (n.right) nq.push(n.right); }
    queue = nq;
  }

  // ===== DIVIDE HALF — always shows node.arr, never merged =====
  for (let i = 0; i < allLevels.length; i++) {
    const level = allLevels[i];
    if (!level.some(n => states.has(n))) break;
    // Divide arrows ↙ ↘
    if (i > 0) {
      const ad = document.createElement('div'); ad.className = 'tree-arrows-row';
      allLevels[i - 1].forEach(p => {
        const hasL = p.left && states.has(p.left), hasR = p.right && states.has(p.right);
        if (hasL || hasR) {
          const g = document.createElement('span'); g.className = 'tree-arrow-pair';
          const w = Math.max(
            p.left ? nodeWidth(p.left.arr.length) : 0,
            p.right ? nodeWidth(p.right.arr.length) : 0
          );
          g.style.minWidth = w + 'px'; g.style.justifyContent = 'center';
          if (hasL) { const a = document.createElement('span'); a.textContent = '↙'; g.appendChild(a) }
          if (hasR) { const a = document.createElement('span'); a.textContent = '↘'; g.appendChild(a) }
          ad.appendChild(g);
        } else {
          const sp = document.createElement('span'); sp.className = 'tree-arrow-pair';
          sp.style.minWidth = nodeWidth(p.arr.length) + 'px'; sp.style.visibility = 'hidden';
          sp.textContent = '↙'; ad.appendChild(sp);
        }
      });
      treeCanvas.appendChild(ad);
    }
    const ld = document.createElement('div'); ld.className = 'tree-level';
    const visNodes = [];
    level.forEach(node => {
      if (!states.has(node)) {
        const box = document.createElement('div'); box.className = 'tree-node'; box.style.visibility = 'hidden';
        box.style.minWidth = nodeWidth(node.arr.length) + 'px';
        node.arr.forEach(v => { const c = document.createElement('div'); c.className = 'tree-cell'; c.textContent = v; box.appendChild(c) });
        ld.appendChild(box); return;
      }
      visNodes.push(node);
      const st = states.get(node);
      const box = document.createElement('div'); box.className = 'tree-node';
      box.style.minWidth = nodeWidth(node.arr.length) + 'px';
      if (node === active) box.classList.add('active');
      if (st === 'base') box.classList.add('merged');
      node.arr.forEach(v => { const c = document.createElement('div'); c.className = 'tree-cell'; c.textContent = v; box.appendChild(c) });
      ld.appendChild(box);
    });
    // Phase tag — pick dominant phase, map merge phases back to divide context
    if (visNodes.length && allLevels.length > 1) {
      const phases = visNodes.map(n => states.get(n));
      const mapped = phases.map(p => ['merged', 'combine', 'merge-start', 'merging', 'merge-done'].includes(p) ? 'divide' : p);
      let pick = mapped[0];
      const pri = ['base', 'split', 'divide', 'partition'];
      mapped.forEach(p => { if (pri.indexOf(p) > pri.indexOf(pick)) pick = p });
      const info = phaseToTag(pick, algo);
      const tag = document.createElement('span'); tag.className = 'phase-tag ' + info.cls;
      tag.textContent = info.text; ld.appendChild(tag);
    }
    treeCanvas.appendChild(ld);
  }

  // ===== MERGE HALF — shows node.merged, converging arrows ↘ ↙ =====
  const mergeStart = allLevels.length > 1 ? allLevels.length - 2 : 0;
  for (let i = mergeStart; i >= 0; i--) {
    const level = allLevels[i];
    if (!level.some(n => { const s = states.get(n); return s === 'merged' || s === 'base'; })) continue;
    const isFinal = (i === 0);
    // Converging arrows
    const ad = document.createElement('div'); ad.className = 'tree-arrows-row';
    level.forEach(p => {
      const g = document.createElement('span'); g.className = 'tree-arrow-pair';
      const w = Math.max(
        p.left ? nodeWidth(p.left.arr.length) : 0,
        p.right ? nodeWidth(p.right.arr.length) : 0
      );
      g.style.minWidth = w + 'px'; g.style.justifyContent = 'center';
      const st = states.get(p); const done = st === 'merged' || st === 'base';
      if (done && (p.left || p.right)) {
        const a1 = document.createElement('span'); a1.textContent = '↘'; g.appendChild(a1);
        const a2 = document.createElement('span'); a2.textContent = '↙'; g.appendChild(a2);
      } else { g.style.visibility = 'hidden'; g.textContent = '·'; }
      ad.appendChild(g);
    });
    treeCanvas.appendChild(ad);
    // Merged nodes row
    const ld = document.createElement('div'); ld.className = 'tree-level';
    level.forEach(node => {
      const st = states.get(node); const done = st === 'merged' || st === 'base';
      const len = (node.merged || node.arr).length;
      if (!done) {
        const box = document.createElement('div'); box.className = 'tree-node'; box.style.visibility = 'hidden';
        box.style.minWidth = nodeWidth(len) + 'px';
        (node.merged || node.arr).forEach(v => { const c = document.createElement('div'); c.className = 'tree-cell'; c.textContent = v; box.appendChild(c) });
        ld.appendChild(box); return;
      }
      const box = document.createElement('div'); box.className = 'tree-node merged';
      box.style.minWidth = nodeWidth(len) + 'px';
      if (node === active) box.classList.add('active');
      if (isFinal) { box.style.borderColor = '#059669'; box.style.borderWidth = '3px'; }
      (node.merged || node.arr).forEach(v => {
        const c = document.createElement('div'); c.className = 'tree-cell'; c.textContent = v;
        if (isFinal) { c.style.color = '#059669'; c.style.fontWeight = '800'; }
        box.appendChild(c);
      });
      ld.appendChild(box);
    });
    const tag = document.createElement('span');
    if (isFinal) {
      tag.className = 'phase-tag ph-final'; tag.textContent = 'Sorted Array ✓';
    } else {
      const mergeLabel = algo === 'merge' ? 'Merge Result' : 'Sorted';
      tag.className = 'phase-tag ph-sorted'; tag.textContent = mergeLabel;
    }
    ld.appendChild(tag);
    treeCanvas.appendChild(ld);
  }
}

// ===== SHOW STEP =====
function highlightPseudo(stepType) {
  pseudoContainer.querySelectorAll('.pseudo-line').forEach(l => l.classList.remove('highlight'));
  let linesToHighlight = [1];
  const isMerge = algoSelect.value === 'merge';

  if (isMerge) {
    if (stepType === 'split') linesToHighlight = [1];
    else if (stepType === 'base') linesToHighlight = [2, 3];
    else if (stepType === 'divide') linesToHighlight = [4, 5, 6];
    else if (stepType === 'merge-start') linesToHighlight = [9, 11];
    else if (['compare', 'place'].includes(stepType)) linesToHighlight = [13, 14, 15];
    else if (stepType === 'merge-done') linesToHighlight = [9, 17];
  } else {
    // Quick Sort lines (18 lines total)
    if (stepType === 'q-split') linesToHighlight = [1];
    else if (stepType === 'base') linesToHighlight = [2, 3];
    else if (['pivot-sel', 'pivot'].includes(stepType)) linesToHighlight = [10, 11];
    else if (['moveP', 'moveQ', 'swap'].includes(stepType)) linesToHighlight = [13, 14, 15, 16];
    else if (stepType === 'pivot-place') linesToHighlight = [17];
    else if (stepType === 'divide') linesToHighlight = [4];
    else if (stepType === 'combine') linesToHighlight = [5, 6];
  }

  linesToHighlight.forEach(ln => {
    const el = pseudoContainer.querySelector(`.pseudo-line[data-line="${ln}"]`);
    if (el) {
      el.classList.add('highlight');
      // Scroll into view if not visible
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

function showStep(i, highlightHistory = true) {
  if (!steps || i < 0 || i >= steps.length) return;
  const s = steps[i];
  stepIndex.textContent = i + 1; stepTotal.textContent = steps.length;
  if (s.vis) renderOpDetail(s); else { opLabel.textContent = ''; opCells.innerHTML = '' }
  renderTree(i);
  treeContainer.scrollTop = treeContainer.scrollHeight;

  highlightPseudo(s.type);

  if (s.type === 'done') { setFacts() }
}

function removeLastLog() {
  // Not needed for pseudo-based UI, keeping empty to avoid errors
}

// ===== CONTROLS =====
resetBtn.addEventListener('click', resetAll);
runBtn.addEventListener('click', () => {
  if (!algoSelect.value) { alert("Select algorithm first"); return }
  const n = Number(nRange.value), t = arrayType.value;
  if (t === 'custom') {
    const p = customArrayInput.value.split(/[\s,]+/).filter(v => v.trim() !== '').map(Number);
    if (!p.length) { alert("Enter at least one number"); return }
    if (p.some(isNaN)) { alert("Enter valid numbers only"); return }
    if (p.length > 20) { alert("Max 20 elements"); return }
    baseArray = p; nRange.value = p.length; nValue.textContent = p.length;
  } else {
    if (n <= 0) { alert("Select N > 0"); return }
    baseArray = t === 'random' ? randArr(n) : t === 'asc' ? Array.from({ length: n }, (_, i) => i + 1) : Array.from({ length: n }, (_, i) => n - i);
  }
  originalArray = baseArray.slice();
  originalArrayEl.textContent = '[' + originalArray.join(', ') + ']';
  pseudoContainer.innerHTML = '';
  renderPseudocode(algoSelect.value);
  steps = []; curStep = -1; stepCounter = 0; comparisonCount = 0;
  stepIndex.textContent = 0; stepTotal.textContent = 0;
  treeData = null;
  opLabel.textContent = ''; opCells.innerHTML = '';
  selectedAlgoName = algoSelect.value === 'merge' ? 'Merge Sort' : 'Quick Sort';
  treeCanvas.innerHTML = '';
  const ph = document.createElement('div'); ph.className = 'tree-heading'; ph.textContent = selectedAlgoName; treeCanvas.appendChild(ph);
  const plc = document.createElement('div'); plc.className = 'tree-placeholder'; plc.textContent = 'Use Next / Auto Run to step through'; treeCanvas.appendChild(plc);
  prepareSteps();
});

prevStep.addEventListener('click', () => { if (curStep > 0) { curStep--; removeLastLog(); showStep(curStep, false) } });
nextStep.addEventListener('click', () => { if (curStep < steps.length - 1) { curStep++; showStep(curStep, true) } });

autoRunBtn.addEventListener('click', () => { if (autoRunInterval) { stopAutoRun(); return } speedMenu.classList.toggle('hidden') });
speedButtons.forEach(b => {
  b.addEventListener('click', () => {
    autoRunSpeed = Number(b.dataset.speed); speedMenu.classList.add('hidden');
    if (!steps || !steps.length) { alert("Generate array first"); return } startAutoRun()
  })
});

function startAutoRun() {
  autoRunBtn.textContent = '⏸ Pause'; autoRunBtn.classList.remove('primary'); autoRunBtn.classList.add('danger');
  prevStep.disabled = true; nextStep.disabled = true;
  autoRunInterval = setInterval(() => { if (curStep < steps.length - 1) { curStep++; showStep(curStep, true) } else stopAutoRun() }, autoRunSpeed);
}
function stopAutoRun() {
  clearInterval(autoRunInterval); autoRunInterval = null;
  autoRunBtn.textContent = 'Auto Run'; autoRunBtn.classList.remove('danger'); autoRunBtn.classList.add('primary');
  prevStep.disabled = false; nextStep.disabled = false;
}

function prepareSteps() {
  steps = []; curStep = -1; stepCounter = 0;
  const arr = baseArray.slice();
  comparisonCount = getComparisonCount(algoSelect.value, arr);
  if (algoSelect.value === 'merge') mergeSortTrace(arr);
  else if (algoSelect.value === 'quick') quickSortTrace(arr);
  steps.push({
    type: 'done', desc: 'Sorting complete! ✓', tree: treeData ? { node: treeData, phase: 'merged' } : null,
    vis: { cells: arr.map(v => ({ val: v, cls: 'hl-placed' })), label: 'FINAL SORTED ARRAY' }, step: ++stepCounter
  });
  stepTotal.textContent = steps.length; stepIndex.textContent = 0; setFacts();
}

function getComparisonCount(algo, arr) {
  let count = 0; const a = [...arr];
  if (algo === 'merge') {
    function ms(b) {
      if (b.length <= 1) return b;
      const m = Math.floor(b.length / 2);
      const L = ms(b.slice(0, m)), R = ms(b.slice(m));
      const res = []; let i = 0, j = 0;
      while (i < L.length && j < R.length) {
        count++;
        if (L[i] <= R[j]) res.push(L[i++]); else res.push(R[j++]);
      }
      return res.concat(L.slice(i)).concat(R.slice(j));
    }
    ms(a);
  } else {
    function qs(b, l, r) {
      if (l >= r) return;
      if (r - l === 1) { count++; if (b[l] > b[r]) [b[l], b[r]] = [b[r], b[l]]; return; }
      const c = Math.floor((l + r) / 2);
      count++; if (b[l] > b[c]) [b[l], b[c]] = [b[c], b[l]];
      count++; if (b[l] > b[r]) [b[l], b[r]] = [b[r], b[l]];
      count++; if (b[c] > b[r]) [b[c], b[r]] = [b[r], b[c]];
      [b[c], b[r - 1]] = [b[r - 1], b[c]];
      const pv = b[r - 1]; let i = l + 1, j = r - 2;
      while (true) {
        while (i <= j) { count++; if (b[i] < pv) i++; else break; }
        while (i <= j) { count++; if (b[j] > pv) j--; else break; }
        if (i < j) { [b[i], b[j]] = [b[j], b[i]]; i++; j--; } else break;
      }
      [b[r - 1], b[i]] = [b[i], b[r - 1]];
      qs(b, l, i - 1); qs(b, i + 1, r);
    }
    qs(a, 0, a.length - 1);
  }
  return count;
}

function resetVisualization() {
  if (autoRunInterval) { clearInterval(autoRunInterval); autoRunInterval = null; autoRunBtn.textContent = 'Auto Run'; autoRunBtn.classList.remove('danger'); autoRunBtn.classList.add('primary') }
  prevStep.disabled = false; nextStep.disabled = false;
  speedMenu.classList.add('hidden'); autoRunSpeed = null;
  baseArray = []; originalArray = []; steps = []; curStep = -1; stepCounter = 0; comparisonCount = 0;
  originalArrayEl.textContent = '-'; pseudoContainer.innerHTML = '';
  stepIndex.textContent = 0; stepTotal.textContent = 0;
  factsText.textContent = 'Select an algorithm to view facts.';
  treeData = null; treeCanvas.innerHTML = ''; opLabel.textContent = ''; opCells.innerHTML = '';
}

function resetLeftPanel() {
  nRange.value = 0; nValue.textContent = '0';
  nRange.disabled = false; nValue.parentElement.style.opacity = '1';
  arrayType.value = "random";
  customInputContainer.classList.add('hidden');
  customArrayInput.value = "";
}

function resetAll() {
  resetVisualization();
}

function setFacts() {
  if (!algoSelect.value) { factsText.textContent = 'Select an algorithm to view facts.'; return }
  const ct = curStep === steps.length - 1 ? comparisonCount : 'After completion';
  if (algoSelect.value === 'quick') {
    factsText.innerHTML = `<strong>Quick Sort (Median-of-Three):</strong>
    <ul style="margin:6px 0;padding-left:18px;font-size:12px"><li><b>Time:</b> Avg O(n log n), Worst O(n²)</li>
    <li><b>Space:</b> O(log n) in-place</li><li><b>Stable:</b> No</li><li><b>Comparisons:</b> ${ct}</li></ul>`;
  } else {
    factsText.innerHTML = `<strong>Merge Sort:</strong>
    <ul style="margin:6px 0;padding-left:18px;font-size:12px"><li><b>Time:</b> O(n log n) always</li>
    <li><b>Space:</b> O(n) extra</li><li><b>Stable:</b> Yes</li><li><b>Comparisons:</b> ${ct}</li></ul>`;
  }
}


