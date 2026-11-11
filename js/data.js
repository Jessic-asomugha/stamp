/* Shared data + a tiny localStorage "backend" so the whole flow works without a server.
   When the real back end exists, replace the Store methods with fetch() calls — pages stay the same. */

/* How a service describes its requirements:
   - steps:   the client's real requirements, step by step (Services card + Request form use these).
       title, who (whose details), note (info only), items (what is needed),
       fields (form questions the client fills in), prepare (checkbox text: items are prepared and brought, NOT typed in).
   - upload:  things that may be uploaded in the Documents box (optional).
   - pending: true = PLACEHOLDER, the client has not sent requirements yet. Do not invent them.
   NIN numbers and digital signatures are "prepare and bring" only. No form fields collect them (open decision, see CLAUDE.md). */
const SERVICES = [
  { id: 'nin', group: 'Identity', name: 'NIN retrieval', blurb: 'Recover the details of a National Identification Number you already have.',
    who: 'Anyone who has a NIN and needs their details or slip retrieved.', time: 'Usually 1–3 working days',
    note: 'NIN registration (getting a new NIN) can only be done in person.',
    upload: ['A recent photo of yourself'],
    steps: [
      { title: 'Means of identification', items: ['NIN number', 'Date of birth and a photo, to confirm you are the true owner'], prepare: 'I have these ready.' },
    ] },
  // PLACEHOLDER: BVN requirements not sent by the client yet.
  { id: 'bvn', group: 'Identity', name: 'BVN enrolment and retrieval', blurb: 'Register for a Bank Verification Number or retrieve a forgotten one.',
    who: 'Account holders without a BVN, or anyone who cannot recall theirs.', time: 'Usually 1–3 working days', pending: true },
  { id: 'bizname', group: 'Business', name: 'Business name registration', blurb: 'Register a sole proprietorship or partnership name.',
    who: 'Small traders, freelancers and new founders.', time: 'Usually 5–7 working days',
    upload: ['Passport photo of each proprietor'],
    steps: [
      { title: 'Reserve a name', items: ['Desired name', 'Nature of business'], fields: [
        { id: 'name', label: 'Desired business name' },
        { id: 'nature', label: 'Nature of business', type: 'textarea', hint: 'what the business does' } ] },
      { title: 'Prepare the core identity files', who: 'For each proprietor',
        items: ['Passport photo', 'NIN, with date of birth', 'Digital signature', 'Home address', 'Phone number and email address', 'Occupation'],
        prepare: 'I have these ready for each proprietor.' },
      { title: 'Business contact information', items: ['Address', 'Phone number', 'Email address'], fields: [
        { id: 'addr', label: 'Business address', type: 'textarea' },
        { id: 'tel', label: 'Business phone number', type: 'tel' },
        { id: 'mail', label: 'Business email address', type: 'email' } ] },
    ] },
  { id: 'company', group: 'Business', name: 'Company registration', blurb: 'Incorporate a limited company with all statutory documents.',
    who: 'Founders who need a limited liability company.', time: 'Usually 7–14 working days',
    steps: [
      { title: 'Reserve a name', items: ['Desired name', 'Nature of business'], fields: [
        { id: 'name', label: 'Desired company name' },
        { id: 'nature', label: 'Nature of business', type: 'textarea', hint: 'what the company will do' } ] },
      { title: 'Prepare the core identity files', who: 'For every director / shareholder',
        items: ['NIN, with date of birth', 'Digital signature', 'Home address', 'Phone number and email address', 'Occupation'],
        prepare: 'I have these ready for every director / shareholder.' },
      { title: 'Draft the incorporation documents',
        note: 'Done by Stamp from what you provide, including the Memorandum and Articles of Association and all form filling. Nothing for you to submit at this step.' },
      { title: 'Specify share capital', who: 'Only for a company with shareholders',
        items: ['Authorised and paid-up capital', 'Number of shares each director has'], fields: [
        { id: 'has_shares', label: 'Will the company have shareholders?', type: 'select', options: ['Yes', 'No'] },
        { id: 'auth_cap', label: 'Authorised capital (₦)', when: ['has_shares', 'Yes'] },
        { id: 'paid_cap', label: 'Paid-up capital (₦)', when: ['has_shares', 'Yes'] },
        { id: 'shares', label: 'Number of shares each director has', type: 'textarea', hint: 'for example: Ada Obi, 600,000', when: ['has_shares', 'Yes'] } ] },
      { title: 'Company contact information', items: ['Address', 'Phone number', 'Email address'], fields: [
        { id: 'addr', label: 'Company address', type: 'textarea' },
        { id: 'tel', label: 'Company phone number', type: 'tel' },
        { id: 'mail', label: 'Company email address', type: 'email' } ] },
    ] },
  // PLACEHOLDER: logo and brand identity requirements not sent by the client yet.
  { id: 'brand', group: 'Business', name: 'Logo and brand identity', blurb: 'A logo, colours and basic brand guide for your business.',
    who: 'New or rebranding businesses.', time: 'Usually 5–10 working days', pending: true },
  // PLACEHOLDER: website requirements not sent by the client yet.
  { id: 'website', group: 'Business', name: 'Website design', blurb: 'A clean website for your business, ready to launch.',
    who: 'Businesses that need an online presence.', time: 'Depends on size; agreed after review', pending: true },
  // PLACEHOLDER: visa requirements not sent by the client yet.
  { id: 'visa', group: 'Travel', name: 'Visa application support', blurb: 'We check your documents and guide the application from start to finish.',
    who: 'Travellers applying for tourist, study or business visas.', time: 'Depends on the embassy; we advise after review', pending: true },
  // PLACEHOLDER: accommodation booking requirements not sent by the client yet.
  { id: 'hotel', group: 'Travel', name: 'Accommodation booking', blurb: 'Hotels and short stays booked to fit your trip and budget.',
    who: 'Travellers who want booking handled for them.', time: 'Usually 1–2 working days', pending: true },
  // PLACEHOLDER: travel consultation requirements not sent by the client yet.
  { id: 'consult', group: 'Travel', name: 'Travel consultation', blurb: 'A one-to-one session to plan your trip or visa route.',
    who: 'Anyone unsure where to start.', time: 'Booked for a time that suits you', schedule: true, pending: true },
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
