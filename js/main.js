/* Shared layout + page logic. Each page sets <body data-page="..."> */
const NAV = [['index.html', 'Home'], ['services.html', 'Services'], ['about.html', 'About'], ['contact.html', 'Contact']];

function layout() {
  const page = document.body.dataset.page;
  const user = Store.user();
  const here = location.pathname.split('/').pop() || 'index.html';
  const links = NAV.map(([h, t]) => `<a href="${h}" ${h === here ? 'aria-current="page"' : ''}>${t}</a>`).join('');
  const account = user
    ? `<a href="${user.role === 'admin' ? 'admin.html' : 'dashboard.html'}">${user.role === 'admin' ? 'Admin' : 'My dashboard'}</a><a href="#" id="logout">Log out</a>`
    : `<a href="login.html">Log in</a>`;
  const hh = document.getElementById('site-header');
  if (hh) hh.outerHTML = `<header class="site-header"><div class="wrap">
    <a class="logo" href="index.html"><span class="logo-mark" aria-hidden="true"></span>Stamp</a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Main">${links}${account}<a class="btn sm" href="request.html">Request a service</a></nav></div></header>`;
  const ff = document.getElementById('site-footer');
  if (ff) ff.outerHTML = `<footer class="site-footer"><div class="wrap"><div class="footer-grid">
    <div><a class="logo" href="index.html"><span class="logo-mark" aria-hidden="true"></span>Stamp</a>
      <p style="margin-top:.8rem">Identity, business and travel paperwork, handled by people who do it every day.</p></div>
    <div><h4>Services</h4><ul><li><a href="services.html#identity">Identity</a></li><li><a href="services.html#business">Business</a></li><li><a href="services.html#travel">Travel</a></li></ul></div>
    <div><h4>Company</h4><ul><li><a href="about.html">About</a></li><li><a href="contact.html">Contact</a></li><li><a href="login.html">Log in</a></li></ul></div></div>
    <div class="copyright">&copy; <span id="yr"></span> Stamp LTD. All rights reserved.</div></div></footer>`;
  const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  const tg = document.querySelector('.nav-toggle');
  if (tg) tg.addEventListener('click', () => { const o = document.getElementById('nav').classList.toggle('open'); tg.setAttribute('aria-expanded', o); });
  const lo = document.getElementById('logout');
  if (lo) lo.addEventListener('click', e => { e.preventDefault(); Store.logout(); location.href = 'index.html'; });
}

/* ---------- Shared request pieces ---------- */
function timelineHTML(r) {
  const reached = r.history.map(h => STEPS.findIndex(s => s.key === h.status)).filter(i => i >= 0);
  const top = Math.max(...reached, 0);
  const at = k => { const h = [...r.history].reverse().find(x => x.status === k); return h ? fmtTime(h.at) : ''; };
  const ended = r.status === 'declined' || r.status === 'withdrawn';
  let items = STEPS.slice(0, top + 1).map((s, i) => {
    const now = !ended && i === top && r.status !== 'done';
    return `<li class="${now ? 'now' : 'done'}">${s.label}<small>${at(s.key)}</small></li>`;
  });
  if (ended) items.push(`<li class="now">${STATUS_LABEL[r.status]}<small>${at(r.status)}</small></li>`);
  else STEPS.slice(top + 1).forEach(s => items.push(`<li>${s.label}</li>`));
  return `<ol class="timeline">${items.join('')}</ol>`;
}

function threadHTML(r, me) {
  const msgs = r.messages.length
    ? r.messages.map(m => `<div class="msg ${m.from === me ? 'me' : ''}">${esc(m.text)}<small>${m.from === 'admin' ? 'Stamp' : esc(r.name)} · ${fmtTime(m.at)}</small></div>`).join('')
    : '<p class="muted small" style="margin:0">No messages yet. Ask a question or share an update here.</p>';
  return `<div class="thread" aria-live="polite">${msgs}</div>
    <form class="send" data-send="${r.id}"><label class="sr" for="msg-${r.id}">Message</label>
    <input id="msg-${r.id}" placeholder="Write a message" required><button class="btn">Send</button></form>`;
}

function answersHTML(r) {
  const rows = Object.entries(r.answers || {}).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  const files = (r.files && r.files.length) ? `<dt>Documents</dt><dd>${r.files.map(esc).join(', ')}</dd>` : '';
  return `<dl class="answers"><dt>Service</dt><dd>${esc(svcName(r.service))}</dd><dt>Sent</dt><dd>${fmtDate(r.created)}</dd>${rows}${files}</dl>`;
}

function wireSend(root, me, after) {
  root.querySelectorAll('form[data-send]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const inp = f.querySelector('input'); const text = inp.value.trim(); if (!text) return;
    Store.addMessage(f.dataset.send, me, text); after();
  }));
}

/* ---------- Pages ---------- */
const Pages = {
  home() {
    const el = document.getElementById('svc-overview'); if (!el) return;
    const groups = [['Identity', 'identity', 'NIN and BVN enrolment and retrieval.'], ['Business', 'business', 'Business and company registration, logos, brand identity and websites.'], ['Travel', 'travel', 'Visa support, accommodation booking and travel consultations.']];
    el.innerHTML = groups.map(([g, a, d]) => `<a class="card svc-link" href="services.html#${a}"><span class="pill">${SERVICES.filter(s => s.group === g).length} services</span><h3 style="margin-top:.8rem">${g}</h3><p>${d}</p></a>`).join('');
  },

  services() {
    const el = document.getElementById('svc-list'); if (!el) return;
    el.innerHTML = ['Identity', 'Business', 'Travel'].map(g => `<h2 class="group-title" id="${g.toLowerCase()}">${g}</h2>` +
      SERVICES.filter(s => s.group === g).map(s => `<div class="acc">
        <button class="acc-btn" aria-expanded="false" aria-controls="p-${s.id}" id="b-${s.id}"><span>${s.name}<small>${s.blurb}</small></span></button>
        <div class="acc-panel" id="p-${s.id}" role="region" aria-labelledby="b-${s.id}">
          <dl><dt>Who it is for</dt><dd>${s.who}</dd><dt>What to bring</dt><dd><ul>${s.bring.map(b => `<li>${b}</li>`).join('')}</ul></dd><dt>Timeline</dt><dd>${s.time}</dd></dl>
          <a class="btn" href="request.html?service=${s.id}">${s.schedule ? 'Book a consultation' : 'Request this service'}</a></div></div>`).join('')).join('');
    el.querySelectorAll('.acc-btn').forEach(b => b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', !open); document.getElementById(b.getAttribute('aria-controls')).classList.toggle('open', !open);
    }));
    const h = location.hash.slice(1); if (h) { const t = document.getElementById(h); if (t) t.scrollIntoView(); }
  },

  contact() {
    const f = document.getElementById('contact-form'); if (!f) return;
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!validate(f)) return;
      f.reset(); toast('Message sent. We reply within one working day.');
    });
  },

  request() {
    const f = document.getElementById('req-form'); if (!f) return;
    const steps = [...f.querySelectorAll('.step')]; const bars = [...document.querySelectorAll('.progress span')];
    let i = 0;
    const svcBox = document.getElementById('svc-choices');
    const pre = new URLSearchParams(location.search).get('service');
    svcBox.innerHTML = ['Identity', 'Business', 'Travel'].map(g => `<p class="hint" style="margin:.8rem 0 .3rem"><b>${g}</b></p>` + SERVICES.filter(s => s.group === g).map(s =>
      `<label class="choice"><input type="radio" name="service" value="${s.id}" ${s.id === pre ? 'checked' : ''}>${s.name}</label>`).join('')).join('');
    const chosen = () => SERVICES.find(s => s.id === (f.service.value || ''));
    const show = n => {
      i = n; steps.forEach((s, k) => s.classList.toggle('on', k === n)); bars.forEach((b, k) => b.classList.toggle('on', k <= n));
      const s = chosen();
      if (n >= 1 && s) {
        document.querySelectorAll('.if-visa').forEach(e => e.hidden = s.id !== 'visa');
        document.querySelectorAll('.if-schedule').forEach(e => e.hidden = !s.schedule);
        document.querySelectorAll('.if-docs').forEach(e => e.hidden = !!s.schedule);
        document.getElementById('chosen-name').textContent = s.name;
        document.getElementById('bring-list').innerHTML = s.bring.map(b => `<li>${b}</li>`).join('');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    f.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => {
      if (i === 0 && !chosen()) { toast('Choose a service to continue.'); return; }
      if (!validate(steps[i])) return; show(i + 1);
    }));
    f.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => show(i - 1)));
    f.files_input.addEventListener('change', () => {
      document.getElementById('file-list').innerHTML = [...f.files_input.files].map(x => `<li>${esc(x.name)}</li>`).join('');
    });
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!validate(steps[i])) return;
      const s = chosen(); const a = {};
      a['Timeline'] = f.timeline.value;
      a['Budget'] = f.budget.value;
      if (s.id === 'visa') a['Destination'] = f.destination.value;
      if (s.schedule) { a['Preferred date'] = f.date.value; a['Preferred time'] = f.time.value; a['Format'] = f.format.value; }
      else a['Documents ready'] = (f.docs.value || 'Not answered');
      a['Phone'] = f.phone.value; if (f.notes.value.trim()) a['Notes'] = f.notes.value.trim();
      const r = { id: Store.newId(), service: s.id, name: f.fullname.value.trim(), email: f.email.value.trim().toLowerCase(), status: 'submitted',
        answers: a, files: [...f.files_input.files].map(x => x.name), created: Date.now(), history: [{ status: 'submitted', at: Date.now() }], messages: [] };
      const l = Store.requests(); l.push(r); Store.save(l); Store.setPending(r.id);
      document.getElementById('req-wrap').hidden = true;
      const done = document.getElementById('req-done'); done.hidden = false;
      document.getElementById('sent-to').textContent = r.email; document.getElementById('req-id').textContent = r.id;
      document.getElementById('demo-confirm').addEventListener('click', () => {
        Store.setStatus(r.id, 'confirmed'); Store.setUser({ email: r.email, name: r.name, role: 'client' }); Store.clearPending();
        location.href = 'dashboard.html?id=' + r.id;
      });
      window.scrollTo({ top: 0 });
    });
    if (pre && chosen()) show(1); else show(0);
  },

  auth() {
    const f = document.getElementById('auth-form'); if (!f) return;
    const mode = document.body.dataset.mode; // login | signup | forgot
    const sent = document.getElementById('auth-sent');
    f.addEventListener('submit', e => {
      e.preventDefault(); if (!validate(f)) return;
      const email = f.email.value.trim().toLowerCase();
      const name = f.fullname ? f.fullname.value.trim() : email.split("@")[0];
      const usePw = f.password && f.password.value;
      const go = () => {
        const admin = email.startsWith('admin');
        Store.setUser({ email, name, role: admin ? 'admin' : 'client' });
        location.href = admin ? 'admin.html' : 'dashboard.html';
      };
      if (usePw && mode !== 'forgot') { go(); return; }
      f.hidden = true; sent.hidden = false;
      document.getElementById('sent-email').textContent = email;
      const d = document.getElementById('demo-link'); if (d) d.addEventListener('click', go);
    });
    const tgl = document.getElementById('pw-toggle');
    if (tgl) tgl.addEventListener('click', e => { e.preventDefault(); const w = document.getElementById('pw-field'); w.hidden = !w.hidden; tgl.textContent = w.hidden ? 'Use a password instead' : 'Use an email link instead'; if (w.hidden) f.password.value = ''; });
  },

  dashboard() {
    const user = Store.user(); if (!user) { location.href = 'login.html'; return; }
    if (user.role === 'admin') { location.href = 'admin.html'; return; }
    document.getElementById('hello').textContent = 'Hello, ' + user.name.split(' ')[0];
    let sel = new URLSearchParams(location.search).get('id');
    const list = document.getElementById('my-list'), detail = document.getElementById('my-detail');
    const render = () => {
      const mine = Store.requests().filter(r => r.email === user.email).sort((a, b) => b.created - a.created);
      if (!mine.length) { list.innerHTML = `<div class="empty card"><p style="margin-inline:auto">You have no requests yet.</p><a class="btn" href="request.html">Request a service</a></div>`; detail.innerHTML = ''; return; }
      if (!mine.find(r => r.id === sel)) sel = mine[0].id;
      list.innerHTML = mine.map(r => `<button class="item ${r.id === sel ? 'active' : ''}" data-id="${r.id}"><b>${esc(svcName(r.service))}</b><span>${r.id} · ${fmtDate(r.created)}</span><br><span class="badge ${r.status}">${STATUS_LABEL[r.status === 'confirmed' ? 'review' : r.status] || r.status}</span></button>`).join('');
      const r = mine.find(x => x.id === sel); const closed = ['done', 'declined', 'withdrawn'].includes(r.status);
      detail.innerHTML = `<div class="card"><h2 style="font-size:1.5rem">${esc(svcName(r.service))}</h2>
        <h3>Progress</h3>${timelineHTML(r)}${answersHTML(r)}
        <h3>Messages</h3>${threadHTML(r, 'client')}
        ${closed ? '' : `<div class="actions"><button class="btn danger sm" id="withdraw">Withdraw this request</button></div>`}</div>`;
      list.querySelectorAll('.item').forEach(b => b.addEventListener('click', () => { sel = b.dataset.id; render(); }));
      wireSend(detail, 'client', render);
      const w = document.getElementById('withdraw');
      if (w) w.addEventListener('click', () => { if (confirm('Withdraw this request? Stamp will be told you no longer need it.')) { Store.setStatus(r.id, 'withdrawn'); toast('Request withdrawn.'); render(); } });
    };
    render();
  },

  admin() {
    const user = Store.user(); if (!user || user.role !== 'admin') { location.href = 'login.html'; return; }
    let sel = null, filter = 'all', tab = 'inq';
    const stats = document.getElementById('stats'), body = document.getElementById('admin-body');
    const visible = () => Store.requests().filter(r => r.status !== 'submitted').sort((a, b) => b.created - a.created);
    const render = () => {
      const all = visible();
      const n = s => all.filter(r => s.includes(r.status)).length;
      stats.innerHTML = [['New', n(['confirmed'])], ['In review', n(['review'])], ['Active', n(['accepted', 'progress'])], ['Completed', n(['done'])]].map(([l, v]) => `<div class="stat"><b>${v}</b>${l}</div>`).join('');
      document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === tab));
      if (tab === 'clients') { renderClients(all); return; }
      const rows = all.filter(r => filter === 'all' || r.status === filter);
      if (!sel || !all.find(r => r.id === sel)) sel = rows[0] && rows[0].id;
      body.innerHTML = `<div class="split"><div><div class="field"><label for="flt">Show</label><select id="flt"><option value="all">All requests</option>${Object.keys(STATUS_LABEL).filter(k => k !== 'submitted').map(k => `<option value="${k}" ${k === filter ? 'selected' : ''}>${STATUS_LABEL[k]}</option>`).join('')}</select></div>
        <div class="list">${rows.length ? rows.map(r => `<button class="item ${r.id === sel ? 'active' : ''}" data-id="${r.id}"><b>${esc(r.name)}</b><span>${esc(svcName(r.service))} · ${fmtDate(r.created)}</span><br><span class="badge ${r.status}">${STATUS_LABEL[r.status]}</span></button>`).join('') : '<p class="empty">No requests match this filter.</p>'}</div></div>
        <div id="a-detail"></div></div>`;
      document.getElementById('flt').addEventListener('change', e => { filter = e.target.value; sel = null; render(); });
      body.querySelectorAll('.item').forEach(b => b.addEventListener('click', () => { sel = b.dataset.id; render(); }));
      const r = all.find(x => x.id === sel); const d = document.getElementById('a-detail');
      if (!r) { d.innerHTML = '<div class="card empty">Select a request to see its details.</div>'; return; }
      const acts = { confirmed: [['review', 'Start review', ''], ['declined', 'Decline', 'danger']], review: [['accepted', 'Accept', ''], ['declined', 'Decline', 'danger']], accepted: [['progress', 'Start work', '']], progress: [['done', 'Mark as done', '']] }[r.status] || [];
      d.innerHTML = `<div class="card"><h2 style="font-size:1.5rem">${esc(svcName(r.service))}</h2>
        <p class="muted">${esc(r.name)} · <a href="mailto:${esc(r.email)}">${esc(r.email)}</a> · ${r.id}</p>
        ${answersHTML(r)}
        <div class="actions">${acts.length ? acts.map(([s, l, c]) => `<button class="btn sm ${c}" data-set="${s}">${l}</button>`).join('') : '<span class="muted small">No further actions. This request is closed.</span>'}</div>
        <h3>Progress</h3>${timelineHTML(r)}<h3>Messages</h3>${threadHTML(r, 'admin')}</div>`;
      d.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.set === 'declined' && !confirm('Decline this request? The client will see it on their dashboard.')) return;
        Store.setStatus(r.id, b.dataset.set); toast('Status updated: ' + STATUS_LABEL[b.dataset.set]); render();
      }));
      wireSend(d, 'admin', render);
    };
    const renderClients = all => {
      const by = {}; all.forEach(r => { (by[r.email] = by[r.email] || { name: r.name, email: r.email, n: 0, last: 0 }); by[r.email].n++; by[r.email].last = Math.max(by[r.email].last, r.created); });
      const rows = Object.values(by).sort((a, b) => b.last - a.last);
      body.innerHTML = `<table><thead><tr><th>Client</th><th>Email</th><th>Requests</th><th>Last request</th></tr></thead><tbody>${rows.map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.email)}</td><td>${c.n}</td><td>${fmtDate(c.last)}</td></tr>`).join('')}</tbody></table>`;
    };
    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { tab = t.dataset.tab; render(); }));
    render();
  },
};

/* ---------- Form validation ---------- */
function validate(scope) {
  let ok = true;
  scope.querySelectorAll('[required]').forEach(inp => {
    if (inp.closest('[hidden]')) return;
    const field = inp.closest('.field'); let bad = !inp.checkValidity();
    if (inp.type === 'radio') { bad = !scope.querySelector(`[name="${inp.name}"]:checked`); }
    if (field) { field.classList.toggle('invalid', bad); const er = field.querySelector('.err'); if (er && bad) er.textContent = inp.type === 'email' ? 'Enter a valid email address.' : 'This field is required.'; }
    if (bad && ok) { inp.focus(); ok = false; } else if (bad) ok = false;
  });
  return ok;
}

document.addEventListener('DOMContentLoaded', () => {
  layout();
  const p = document.body.dataset.page;
  if (Pages[p]) Pages[p]();
});
