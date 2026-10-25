/* Shared data + a tiny localStorage "backend" so the whole flow works without a server.
   When the real back end exists, replace the Store methods with fetch() calls — pages stay the same. */

const SERVICES = [
  { id: 'nin', group: 'Identity', name: 'NIN enrolment and retrieval', blurb: 'Get a National Identification Number or recover one you already have.',
    who: 'Anyone who has no NIN, lost their slip, or needs details corrected.', bring: ['A valid ID or birth certificate', 'Active phone number', 'Passport photograph'], time: 'Usually 1–3 working days' },
  { id: 'bvn', group: 'Identity', name: 'BVN enrolment and retrieval', blurb: 'Register for a Bank Verification Number or retrieve a forgotten one.',
    who: 'Account holders without a BVN, or anyone who cannot recall theirs.', bring: ['A valid ID', 'Bank account details', 'Phone number linked to the account'], time: 'Usually 1–3 working days' },
  { id: 'bizname', group: 'Business', name: 'Business name registration', blurb: 'Register a sole proprietorship or partnership name.',
    who: 'Small traders, freelancers and new founders.', bring: ['Two name options', 'Valid ID', 'Business address', 'Passport photograph'], time: 'Usually 5–7 working days' },
  { id: 'company', group: 'Business', name: 'Company registration', blurb: 'Incorporate a limited company with all statutory documents.',
    who: 'Founders who need a limited liability company.', bring: ['Proposed company names', 'IDs of all directors and shareholders', 'Registered address', 'Share structure'], time: 'Usually 7–14 working days' },
  { id: 'brand', group: 'Business', name: 'Logo and brand identity', blurb: 'A logo, colours and basic brand guide for your business.',
    who: 'New or rebranding businesses.', bring: ['Business name and what you sell', 'Colours or logos you like', 'Examples of brands you admire'], time: 'Usually 5–10 working days' },
  { id: 'website', group: 'Business', name: 'Website design', blurb: 'A clean website for your business, ready to launch.',
    who: 'Businesses that need an online presence.', bring: ['Your logo and colours', 'Text and photos for each page', 'Preferred domain name'], time: 'Depends on size; agreed after review' },
  { id: 'visa', group: 'Travel', name: 'Visa application support', blurb: 'We check your documents and guide the application from start to finish.',
    who: 'Travellers applying for tourist, study or business visas.', bring: ['International passport', 'Bank statements', 'Travel dates and destination', 'Invitation or admission letter, if any'], time: 'Depends on the embassy; we advise after review' },
  { id: 'hotel', group: 'Travel', name: 'Accommodation booking', blurb: 'Hotels and short stays booked to fit your trip and budget.',
    who: 'Travellers who want booking handled for them.', bring: ['Destination and dates', 'Budget per night', 'Number of guests'], time: 'Usually 1–2 working days' },
  { id: 'consult', group: 'Travel', name: 'Travel consultation', blurb: 'A one-to-one session to plan your trip or visa route.',
    who: 'Anyone unsure where to start.', bring: ['Your questions', 'Destination ideas'], time: 'Booked for a time that suits you', schedule: true },
];

const STEPS = [
  { key: 'submitted', label: 'Request submitted' },
  { key: 'confirmed', label: 'Email confirmed' },
  { key: 'review', label: 'Under review' },
  { key: 'accepted', label: 'Request accepted' },
  { key: 'progress', label: 'Work in progress' },
  { key: 'done', label: 'Completed' },
];
const STATUS_LABEL = { submitted: 'Awaiting email', confirmed: 'New', review: 'Under review', accepted: 'Accepted', progress: 'In progress', done: 'Completed', declined: 'Declined', withdrawn: 'Withdrawn' };

const Store = {
  _get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  _set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  requests() {
    let list = this._get('stamp_requests', null);
    if (!list) { list = this._seed(); this._set('stamp_requests', list); }
    return list;
  },
  save(list) { this._set('stamp_requests', list); },
  user() { return this._get('stamp_user', null); },
  setUser(u) { this._set('stamp_user', u); },
  logout() { try { localStorage.removeItem('stamp_user'); } catch (e) {} },
  pending() { return this._get('stamp_pending', null); },
  setPending(r) { this._set('stamp_pending', r); },
  clearPending() { try { localStorage.removeItem('stamp_pending'); } catch (e) {} },
  find(id) { return this.requests().find(r => r.id === id); },
  update(id, fn) { const l = this.requests(); const r = l.find(x => x.id === id); if (r) { fn(r); this.save(l); } return r; },
  setStatus(id, status, note) { return this.update(id, r => { r.status = status; r.history.push({ status, at: Date.now(), note: note || '' }); }); },
  addMessage(id, from, text) { return this.update(id, r => r.messages.push({ from, text, at: Date.now() })); },
  newId() { return 'ST-' + Math.floor(1000 + Math.random() * 9000); },
  _seed() {
    const d = 86400000, n = Date.now();
    const mk = (id, svc, name, email, status, ago, answers) => ({ id, service: svc, name, email, status, answers, files: [], created: n - ago * d,
      history: [{ status: 'submitted', at: n - ago * d }, { status: 'confirmed', at: n - ago * d + 600000 }].concat(status === 'confirmed' ? [] : [{ status, at: n - (ago - 1) * d }]),
      messages: [], demo: true });
    return [
      mk('ST-2041', 'company', 'Amaka Obi', 'amaka@example.com', 'confirmed', 0, { Budget: '₦150,000 – ₦300,000', Timeline: 'Within 2 weeks', 'Documents ready': 'Yes, all of them' }),
      mk('ST-2038', 'visa', 'Tunde Bello', 'tunde@example.com', 'review', 1, { Destination: 'United Kingdom', Timeline: 'Within 1 month', 'Documents ready': 'Some of them' }),
      mk('ST-2030', 'nin', 'Zainab Musa', 'zainab@example.com', 'progress', 3, { Timeline: 'As soon as possible', 'Documents ready': 'Yes, all of them' }),
    ];
  },
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const svcName = id => (SERVICES.find(s => s.id === id) || {}).name || id;
const fmtDate = t => new Date(t).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = t => new Date(t).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
