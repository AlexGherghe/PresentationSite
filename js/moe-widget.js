(function() {
  var TOKENS = [
    {t: '"apple"', s: 'embed'}, {t: '"the"', s: 'embed'}, {t: '"def"', s: 'embed'},
    {t: '"Paris"', s: 'embed'}, {t: '"42"', s: 'embed'}, {t: '"hello"', s: 'embed'},
    {t: '"async"', s: 'embed'}, {t: '"loves"', s: 'embed'}, {t: '"π"', s: 'embed'},
    {t: '"cloud"', s: 'embed'}, {t: '"SELECT"', s: 'embed'}, {t: '"neural"', s: 'embed'}
  ];

  var svg = document.getElementById('moe-svg');
  var btn = document.getElementById('moe-route-btn');
  var statusEl = document.getElementById('moe-status');
  if (!svg || !btn) return;
  var running = false;

  function center(el) {
    var canvas = document.getElementById('moe-canvas');
    var cr = canvas.getBoundingClientRect();
    var er = el.getBoundingClientRect();
    // Compensate for CSS transform: scale() — getBoundingClientRect returns
    // visual (scaled) coords, but dot positioning uses local (unscaled) coords
    var scale = cr.width / canvas.offsetWidth || 1;
    return {
      x: (er.left - cr.left + er.width / 2) / scale,
      y: (er.top - cr.top + er.height / 2) / scale
    };
  }

  function drawLines() {
    svg.innerHTML = '';
    var ns = 'http://www.w3.org/2000/svg';
    var token = document.getElementById('moe-token');
    var gate = document.getElementById('moe-gate');
    var combine = document.getElementById('moe-combine');
    var output = document.getElementById('moe-output');
    var tc = center(token), gc = center(gate);
    var l0 = document.createElementNS(ns, 'line');
    l0.setAttribute('x1', tc.x); l0.setAttribute('y1', tc.y);
    l0.setAttribute('x2', gc.x); l0.setAttribute('y2', gc.y);
    l0.id = 'moe-line-tg';
    svg.appendChild(l0);
    for (var i = 0; i < 8; i++) {
      var exp = document.getElementById('moe-exp-' + i);
      var ec = center(exp);
      var lg = document.createElementNS(ns, 'line');
      lg.setAttribute('x1', gc.x); lg.setAttribute('y1', gc.y);
      lg.setAttribute('x2', ec.x); lg.setAttribute('y2', ec.y);
      lg.id = 'moe-line-ge-' + i;
      svg.appendChild(lg);
      var cc = center(combine);
      var lc = document.createElementNS(ns, 'line');
      lc.setAttribute('x1', ec.x); lc.setAttribute('y1', ec.y);
      lc.setAttribute('x2', cc.x); lc.setAttribute('y2', cc.y);
      lc.id = 'moe-line-ec-' + i;
      svg.appendChild(lc);
    }
    var cc2 = center(combine), oc = center(output);
    var lo = document.createElementNS(ns, 'line');
    lo.setAttribute('x1', cc2.x); lo.setAttribute('y1', cc2.y);
    lo.setAttribute('x2', oc.x); lo.setAttribute('y2', oc.y);
    lo.id = 'moe-line-co';
    svg.appendChild(lo);
  }

  var canvas = document.getElementById('moe-canvas');
  var canvasWrap = canvas.parentElement;
  var CANVAS_HEIGHT = 460;

  function fitAndDraw() {
    // Reset transform so getBoundingClientRect gives unscaled positions
    canvas.style.transform = '';
    canvasWrap.style.height = '';

    drawLines();

    // Scale down on narrow screens
    var wrapWidth = canvasWrap.clientWidth;
    var canvasWidth = canvas.scrollWidth || canvas.offsetWidth;
    if (canvasWidth > wrapWidth && wrapWidth > 0) {
      var scale = wrapWidth / canvasWidth;
      canvas.style.transform = 'scale(' + scale + ')';
      canvasWrap.style.height = Math.ceil(CANVAS_HEIGHT * scale) + 'px';
    }
  }

  fitAndDraw();
  window.addEventListener('resize', fitAndDraw);
  // Deferred fit to ensure layout has settled
  requestAnimationFrame(function() { requestAnimationFrame(fitAndDraw); });

  function fakeSoftmax() {
    var raw = [];
    for (var i = 0; i < 8; i++) raw.push(Math.random());
    var top = [];
    while (top.length < 2) {
      var idx = Math.floor(Math.random() * 8);
      if (top.indexOf(idx) === -1) top.push(idx);
    }
    raw[top[0]] += 3 + Math.random() * 2;
    raw[top[1]] += 1.5 + Math.random() * 1.5;
    var sum = 0;
    for (var j = 0; j < raw.length; j++) sum += raw[j];
    return raw.map(function(v) { return v / sum; });
  }

  function animateDot(dotId, fromEl, toEl, duration) {
    return new Promise(function(resolve) {
      var dot = document.getElementById(dotId);
      var f = center(fromEl), t = center(toEl);
      dot.style.opacity = '1';
      dot.style.left = (f.x - 4) + 'px';
      dot.style.top = (f.y - 4) + 'px';
      var start = performance.now();
      function step(now) {
        var p = Math.min((now - start) / duration, 1);
        var ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        dot.style.left = (f.x + (t.x - f.x) * ease - 4) + 'px';
        dot.style.top = (f.y + (t.y - f.y) * ease - 4) + 'px';
        if (p < 1) requestAnimationFrame(step);
        else { dot.style.opacity = '0'; resolve(); }
      }
      requestAnimationFrame(step);
    });
  }

  function resetAll() {
    var experts = document.querySelectorAll('.moe-node--expert');
    for (var i = 0; i < experts.length; i++) {
      experts[i].classList.remove('active', 'inactive');
    }
    for (var j = 0; j < 8; j++) {
      document.getElementById('moe-prob-' + j).textContent = '';
    }
    document.getElementById('moe-gate').classList.remove('active');
    document.getElementById('moe-combine').classList.remove('active');
    document.getElementById('moe-output').classList.remove('active');
    var lines = document.querySelectorAll('.moe-svg line');
    for (var k = 0; k < lines.length; k++) lines[k].classList.remove('active', 'inactive');
    var dots = document.querySelectorAll('.moe-dot');
    for (var m = 0; m < dots.length; m++) dots[m].style.opacity = '0';
  }

  function delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

  async function routeToken() {
    if (running) return;
    running = true;
    btn.disabled = true;
    resetAll();
    var tok = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    document.getElementById('moe-token-label').textContent = tok.t;
    document.getElementById('moe-token-sub').textContent = tok.s;
    var token = document.getElementById('moe-token');
    var gate = document.getElementById('moe-gate');
    var combine = document.getElementById('moe-combine');
    var output = document.getElementById('moe-output');

    statusEl.textContent = 'Sending token to gating network...';
    document.getElementById('moe-line-tg').classList.add('active');
    await animateDot('moe-dot-0', token, gate, 500);

    gate.classList.add('active');
    statusEl.textContent = 'Computing softmax probabilities...';
    await delay(600);

    var probs = fakeSoftmax();
    var indexed = probs.map(function(p, i) { return {p: p, i: i}; }).sort(function(a, b) { return b.p - a.p; });
    var top2 = [indexed[0].i, indexed[1].i];
    for (var i = 0; i < 8; i++) {
      var el = document.getElementById('moe-exp-' + i);
      var prob = document.getElementById('moe-prob-' + i);
      prob.textContent = (probs[i] * 100).toFixed(1) + '%';
      if (top2.indexOf(i) !== -1) {
        el.classList.add('active');
        document.getElementById('moe-line-ge-' + i).classList.add('active');
      } else {
        el.classList.add('inactive');
        document.getElementById('moe-line-ge-' + i).classList.add('inactive');
      }
    }
    statusEl.textContent = 'Routing to Expert ' + top2[0] + ' (' + (probs[top2[0]] * 100).toFixed(1) + '%) & Expert ' + top2[1] + ' (' + (probs[top2[1]] * 100).toFixed(1) + '%)';
    await delay(400);

    var exp0 = document.getElementById('moe-exp-' + top2[0]);
    var exp1 = document.getElementById('moe-exp-' + top2[1]);
    await Promise.all([animateDot('moe-dot-0', gate, exp0, 450), animateDot('moe-dot-1', gate, exp1, 450)]);

    statusEl.textContent = 'Experts processing... combining weighted outputs';
    document.getElementById('moe-line-ec-' + top2[0]).classList.add('active');
    document.getElementById('moe-line-ec-' + top2[1]).classList.add('active');
    for (var k = 0; k < 8; k++) {
      if (top2.indexOf(k) === -1) document.getElementById('moe-line-ec-' + k).classList.add('inactive');
    }
    await Promise.all([animateDot('moe-dot-0', exp0, combine, 450), animateDot('moe-dot-1', exp1, combine, 450)]);

    combine.classList.add('active');
    await delay(400);

    statusEl.textContent = 'Weighted sum complete → output';
    document.getElementById('moe-line-co').classList.add('active');
    await animateDot('moe-dot-0', combine, output, 400);
    output.classList.add('active');

    statusEl.textContent = 'Done! Token ' + tok.t + ' routed through Expert ' + top2[0] + ' & Expert ' + top2[1];
    running = false;
    btn.disabled = false;
  }

  btn.addEventListener('click', routeToken);
})();
