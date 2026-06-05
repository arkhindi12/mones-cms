let C = window.CONTENT;
const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const saveState = () => $('#saveState');
const viewTitle = () => $('#viewTitle');
const viewHint = () => $('#viewHint');
let mediaCache = [];
let mediaTargetInputId = null;
let dirty = false;

function escHtml(s = '') {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function toast(msg, err) {
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : '');
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2400);
}

function markDirty(v = true) {
  dirty = v;
  saveState().textContent = v ? 'Belum disimpan' : 'Tersimpan';
  saveState().className = 'statusbox' + (v ? ' warn' : '');
}

async function save() {
  saveState().textContent = 'Menyimpan...';
  const r = await fetch('/admin/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(C)
  });
  if (r.ok) {
    markDirty(false);
    toast('Draft berhasil disimpan');
  } else {
    saveState().textContent = 'Gagal simpan';
    saveState().className = 'statusbox err';
    toast('Save failed', 1);
  }
}
window.save = save;

async function generate() {
  if (dirty) await save();
  saveState().textContent = 'Publish live...';
  const r = await fetch('/admin/api/generate', { method: 'POST' });
  if (r.ok) {
    saveState().textContent = 'Sudah live';
    saveState().className = 'statusbox ok';
    toast('Landing page berhasil dipublish');
  } else {
    saveState().textContent = 'Publish gagal';
    saveState().className = 'statusbox err';
    toast('Generate failed', 1);
  }
}
window.generate = generate;

function setActive(name) {
  document.querySelectorAll('.sidebar button').forEach(b => {
    b.classList.toggle('active', b.textContent.trim().toLowerCase() === name);
  });
}

const VIEW_META = {
  brand: ['Brand', 'Ubah nama brand, warna, dan font utama landing page.'],
  contact: ['Contact', 'Atur nomor WhatsApp, Instagram, dan area layanan.'],
  hero: ['Hero', 'Edit headline, CTA, dan gambar utama bagian atas.'],
  sections: ['Sections', 'Atur urutan dan tampil/sembunyi tiap section.'],
  security: ['Security', 'Ganti username dan password admin CMS.'],
  problems: ['Problems', 'Kelola daftar masalah customer di landing page.'],
  services: ['Services', 'Kelola card layanan utama.'],
  advantages: ['Advantages', 'Kelola poin keunggulan MG Mones Galery.'],
  portfolio: ['Portfolio', 'Kelola card portfolio dan tandai foto yang perlu diganti.'],
  videos: ['Videos', 'Kelola reels/video showcase atau thumbnail pengganti.'],
  process: ['Process', 'Kelola timeline proses kerja.'],
  packages: ['Packages', 'Kelola paket layanan tanpa harga pasti.'],
  testimonials: ['Testimonials', 'Kelola testimoni customer.'],
  faq: ['FAQ', 'Kelola pertanyaan dan jawaban.'],
  media: ['Media', 'Upload media lalu copy/pilih URL ke field yang dibutuhkan.']
};

function show(view) {
  setActive(view);
  const meta = VIEW_META[view] || [view, ''];
  viewTitle().textContent = meta[0];
  viewHint().textContent = meta[1];
  if (view === 'brand') return renderBrand();
  if (view === 'hero') return renderHero();
  if (view === 'sections') return renderSections();
  if (view === 'media') return renderMedia();
  if (view === 'contact') return renderContact();
  if (view === 'security') return renderSecurity();
  if (view === 'problems') return renderTextList('problems', 'Masalah Customer', 'text');
  if (view === 'advantages') return renderStringList('advantages', 'Keunggulan', 'Tambah poin keunggulan');
  return renderCrud(view);
}
window.show = show;

function bindDirtyInputs(root = document) {
  root.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', () => markDirty(true));
    el.addEventListener('change', () => markDirty(true));
  });
}

function inputWithPicker(id, label, value = '', placeholder = '') {
  return `<label>${label}</label>
    <div class="input-with-action">
      <input id="${id}" value="${escHtml(value)}" placeholder="${escHtml(placeholder)}">
      <button type="button" class="ghost small" onclick="openMediaPicker('${id}')">Pilih Media</button>
    </div>`;
}

function renderBrand() {
  const b = C.brand;
  app.innerHTML = `<div class="panel-grid two">
    <div class="card">
      <h3>Identitas Brand</h3>
      <label>Brand Name</label><input id="bname" value="${escHtml(b.name)}">
      <label>Tagline</label><input id="btag" value="${escHtml(b.tagline)}">
      <div class="row">
        <div><label>Body Font</label><input id="fb" value="${escHtml(b.fonts.body)}"></div>
        <div><label>Heading Font</label><input id="fh" value="${escHtml(b.fonts.heading)}"></div>
      </div>
      <button class="primary" onclick="saveBrand()">Simpan Brand</button>
    </div>
    <div class="card">
      <h3>Warna Tema</h3>
      <div class="row">
        <div><label>Primary (Gold)</label><div class="swatch"><input type="color" id="cp" value="${b.colors.primary}"><input id="cpt" value="${b.colors.primary}"></div></div>
        <div><label>Terracotta</label><div class="swatch"><input type="color" id="ct" value="${b.colors.terracotta}"><input id="ctt" value="${b.colors.terracotta}"></div></div>
        <div><label>Charcoal</label><div class="swatch"><input type="color" id="cc" value="${b.colors.charcoal}"><input id="cct" value="${b.colors.charcoal}"></div></div>
      </div>
      <div class="theme-preview">
        <div class="theme-chip" style="background:${b.colors.primary}">Gold</div>
        <div class="theme-chip" style="background:${b.colors.terracotta}">Terracotta</div>
        <div class="theme-chip" style="background:${b.colors.charcoal};color:#fff">Charcoal</div>
      </div>
    </div>
  </div>`;
  [['cp', 'cpt'], ['ct', 'ctt'], ['cc', 'cct']].forEach(([a, b]) => {
    $('#' + a).oninput = () => { $('#' + b).value = $('#' + a).value; markDirty(true); };
    $('#' + b).oninput = () => { $('#' + a).value = $('#' + b).value; markDirty(true); };
  });
  bindDirtyInputs(app);
}
window.saveBrand = () => {
  C.brand = {
    name: $('#bname').value,
    tagline: $('#btag').value,
    colors: { primary: $('#cpt').value, terracotta: $('#ctt').value, charcoal: $('#cct').value },
    fonts: { body: $('#fb').value, heading: $('#fh').value }
  };
  save();
};

function renderHero() {
  const h = C.hero;
  app.innerHTML = `<div class="panel-grid two">
    <div class="card">
      <h3>Konten Hero</h3>
      <label>Headline</label><textarea id="hh">${escHtml(h.headline)}</textarea>
      <label>Subheadline</label><textarea id="hs">${escHtml(h.subheadline)}</textarea>
      <div class="row">
        <div><label>Primary CTA</label><input id="hc1" value="${escHtml(h.cta_primary)}"></div>
        <div><label>Secondary CTA</label><input id="hc2" value="${escHtml(h.cta_secondary)}"></div>
      </div>
      ${inputWithPicker('hbg', 'Background Image URL', h.background_image, '/media/...')}
      <button class="primary" onclick="saveHero()">Simpan Hero</button>
    </div>
    <div class="card">
      <h3>Preview Gambar Hero</h3>
      <div class="preview-box hero-preview">
        ${h.background_image ? `<img src="${escHtml(h.background_image)}" alt="hero preview">` : '<div class="empty-state">Belum ada gambar</div>'}
      </div>
      <p class="helper">Tips: pakai foto vertikal/portrait dengan kualitas bagus agar hero lebih kuat.</p>
    </div>
  </div>`;
  bindDirtyInputs(app);
}
window.saveHero = () => {
  C.hero = {
    headline: $('#hh').value,
    subheadline: $('#hs').value,
    cta_primary: $('#hc1').value,
    cta_secondary: $('#hc2').value,
    background_image: $('#hbg').value
  };
  save();
};

function renderSections() {
  app.innerHTML = `<div class="card"><h3>Section Order & Visibility</h3><p class="helper">Drag untuk ubah urutan. Centang untuk tampilkan di landing page.</p><div id="seclist"></div></div>`;
  const list = $('#seclist');
  const sorted = [...C.sections].sort((a, b) => a.order - b.order);
  sorted.forEach(s => {
    const el = document.createElement('div');
    el.className = 'section-row drag';
    el.draggable = true;
    el.dataset.id = s.id;
    el.innerHTML = `<strong>⠿ ${escHtml(s.name)}</strong>
      <label class="inline-check"><input type="checkbox" ${s.enabled ? 'checked' : ''} onchange="toggleSec('${s.id}',this.checked)"> Enabled</label>`;
    list.appendChild(el);
  });
  let dragEl;
  list.querySelectorAll('.drag').forEach(el => {
    el.addEventListener('dragstart', () => { dragEl = el; el.classList.add('dragging'); });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); commitOrder(); });
    el.addEventListener('dragover', e => {
      e.preventDefault();
      const after = getAfter(list, e.clientY);
      if (after == null) list.appendChild(dragEl); else list.insertBefore(dragEl, after);
    });
  });
}
function getAfter(list, y) {
  const els = [...list.querySelectorAll('.drag:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: -Infinity }).element;
}
async function commitOrder() {
  const ids = [...$('#seclist').querySelectorAll('.drag')].map(el => el.dataset.id);
  const ordered = ids.map(id => C.sections.find(s => s.id === id));
  C.sections = ordered.map((s, i) => ({ ...s, order: i + 1 }));
  const r = await fetch('/admin/api/section-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sections: C.sections }) });
  if (r.ok) {
    markDirty(false);
    toast('Urutan section disimpan');
  } else {
    toast('Gagal simpan urutan', 1);
  }
}
window.toggleSec = (id, v) => {
  C.sections.find(s => s.id === id).enabled = v;
  save();
};

const FIELDS = {
  services: [['title', 'Title'], ['description', 'Description', 'textarea'], ['icon', 'Icon (emoji)']],
  portfolio: [['title', 'Title'], ['location', 'Location'], ['description', 'Description', 'textarea'], ['image', 'Image URL', 'media'], ['notice', 'Tampilkan badge ganti foto', 'checkbox']],
  testimonials: [['quote', 'Quote', 'textarea'], ['name', 'Name'], ['location', 'Location']],
  faq: [['question', 'Question'], ['answer', 'Answer', 'textarea']],
  packages: [['title', 'Title'], ['desc', 'Description', 'textarea'], ['icon', 'Icon (emoji)']],
  videos: [['src', 'Video URL', 'media'], ['thumb', 'Thumb URL', 'media']],
  process: [['step', 'Step', 'number'], ['title', 'Title'], ['desc', 'Description', 'textarea']]
};

function fieldHtml(field, item, idx) {
  const [k, lbl, type] = field;
  const value = item[k] ?? '';
  if (type === 'textarea') return `<label>${lbl}</label><textarea data-k="${k}">${escHtml(value)}</textarea>`;
  if (type === 'checkbox') return `<label class="inline-check big"><input type="checkbox" data-k="${k}" ${value ? 'checked' : ''}> ${lbl}</label>`;
  if (type === 'number') return `<label>${lbl}</label><input type="number" data-k="${k}" value="${escHtml(value)}">`;
  if (type === 'media') {
    const inputId = `${k}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
    return `<label>${lbl}</label><div class="input-with-action"><input id="${inputId}" data-k="${k}" value="${escHtml(value)}"><button type="button" class="ghost small" onclick="openMediaPicker('${inputId}')">Pilih Media</button></div>`;
  }
  return `<label>${lbl}</label><input data-k="${k}" value="${escHtml(value)}">`;
}

function renderCrud(type) {
  const fields = FIELDS[type];
  app.innerHTML = `<div class="section-head"><div><h3>${VIEW_META[type]?.[0] || type}</h3><p class="helper">Drag card untuk ubah urutan tampil di landing page.</p></div><button class="primary" onclick="addItem('${type}')">+ Tambah Baru</button></div><div id="items"></div>`;
  const wrap = $('#items');
  C[type].forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'card drag crud-item';
    el.draggable = true;
    el.dataset.id = item.id;
    const preview = type === 'portfolio' && item.image ? `<div class="mini-preview"><img src="${escHtml(item.image)}" alt="preview"></div>` : '';
    const sortMeta = `<div class="crud-meta"><strong>⠿ Geser card</strong><span>Urutan ${idx + 1}</span></div>`;
    el.innerHTML = `${sortMeta}${preview}${fields.map(f => fieldHtml(f, item, idx)).join('')}<div class="row actions"><button class="primary" onclick="updItem('${type}','${item.id}',this)">Update</button><button class="danger" onclick="delItem('${type}','${item.id}')">Delete</button></div>`;
    wrap.appendChild(el);
  });
  enableCrudDrag(type);
  bindDirtyInputs(app);
}

function enableCrudDrag(type) {
  const list = $('#items');
  if (!list) return;
  let dragEl;
  list.querySelectorAll('.crud-item').forEach(el => {
    el.addEventListener('dragstart', () => { dragEl = el; el.classList.add('dragging'); });
    el.addEventListener('dragend', async () => {
      el.classList.remove('dragging');
      await commitCrudOrder(type);
    });
    el.addEventListener('dragover', e => {
      e.preventDefault();
      const after = getAfter(list, e.clientY);
      if (after == null) list.appendChild(dragEl); else list.insertBefore(dragEl, after);
    });
  });
}

async function commitCrudOrder(type) {
  const ids = [...$('#items').querySelectorAll('.crud-item')].map(el => el.dataset.id);
  const byId = new Map(C[type].map(item => [item.id, item]));
  C[type] = ids.map(id => byId.get(id)).filter(Boolean);
  const r = await fetch(`/admin/api/items-order/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  if (r.ok) {
    markDirty(false);
    toast('Urutan card disimpan');
    renderCrud(type);
  } else {
    toast('Gagal simpan urutan card', 1);
  }
}
window.addItem = async (type) => {
  const body = {};
  FIELDS[type].forEach(([k, , t]) => body[k] = t === 'checkbox' ? false : '');
  const r = await fetch('/admin/api/items/' + type, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  C[type] = j.items;
  renderCrud(type);
  toast('Item ditambahkan');
};
window.updItem = async (type, id, btn) => {
  const card = btn.closest('.card');
  const body = {};
  card.querySelectorAll('[data-k]').forEach(f => {
    if (f.type === 'checkbox') body[f.dataset.k] = f.checked;
    else if (f.type === 'number') body[f.dataset.k] = Number(f.value || 0);
    else body[f.dataset.k] = f.value;
  });
  const r = await fetch(`/admin/api/items/${type}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  const i = C[type].findIndex(x => x.id === id);
  C[type][i] = j.item;
  markDirty(false);
  toast('Item diupdate');
  renderCrud(type);
};
window.delItem = async (type, id) => {
  if (!confirm('Delete this item?')) return;
  await fetch(`/admin/api/items/${type}/${id}`, { method: 'DELETE' });
  C[type] = C[type].filter(x => x.id !== id);
  renderCrud(type);
  toast('Item dihapus');
};

function renderTextList(key, title, fieldName) {
  const items = C[key] || [];
  app.innerHTML = `<div class="section-head"><h3>${title}</h3><button class="primary" onclick="addTextRow('${key}')">+ Tambah</button></div><div class="card"><div id="textRows"></div><div class="row actions"><button class="primary" onclick="saveTextList('${key}','${fieldName}')">Simpan ${title}</button></div></div>`;
  const wrap = $('#textRows');
  items.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'list-row';
    row.innerHTML = `<textarea data-idx="${idx}" rows="2">${escHtml(item[fieldName] || '')}</textarea><button class="danger small" onclick="removeTextRow('${key}',${idx})">Hapus</button>`;
    wrap.appendChild(row);
  });
  bindDirtyInputs(app);
}
window.addTextRow = (key) => {
  C[key].push({ id: Date.now().toString(36), text: '' });
  renderTextList(key, VIEW_META[key][0], key === 'problems' ? 'text' : 'text');
  markDirty(true);
};
window.removeTextRow = (key, idx) => {
  C[key].splice(idx, 1);
  renderTextList(key, VIEW_META[key][0], key === 'problems' ? 'text' : 'text');
  markDirty(true);
};
window.saveTextList = (key, fieldName) => {
  C[key] = [...$('#textRows').querySelectorAll('textarea')].map((t, i) => ({ id: C[key][i]?.id || Date.now().toString(36) + i, [fieldName]: t.value.trim() })).filter(x => x[fieldName]);
  save();
};

function renderStringList(key, title, addLabel) {
  const items = C[key] || [];
  app.innerHTML = `<div class="section-head"><h3>${title}</h3><button class="primary" onclick="addStringRow('${key}')">+ ${addLabel}</button></div><div class="card"><div id="stringRows"></div><div class="row actions"><button class="primary" onclick="saveStringList('${key}')">Simpan ${title}</button></div></div>`;
  const wrap = $('#stringRows');
  items.forEach((text, idx) => {
    const row = document.createElement('div');
    row.className = 'list-row';
    row.innerHTML = `<input data-idx="${idx}" value="${escHtml(text)}"><button class="danger small" onclick="removeStringRow('${key}',${idx})">Hapus</button>`;
    wrap.appendChild(row);
  });
  bindDirtyInputs(app);
}
window.addStringRow = (key) => {
  C[key].push('');
  renderStringList(key, VIEW_META[key][0], 'Tambah poin');
  markDirty(true);
};
window.removeStringRow = (key, idx) => {
  C[key].splice(idx, 1);
  renderStringList(key, VIEW_META[key][0], 'Tambah poin');
  markDirty(true);
};
window.saveStringList = (key) => {
  C[key] = [...$('#stringRows').querySelectorAll('input')].map(i => i.value.trim()).filter(Boolean);
  save();
};

function renderContact() {
  const c = C.contact || { whatsapp: '', instagram: '', areas: [] };
  const waPreview = c.whatsapp ? `https://wa.me/${c.whatsapp}` : '-';
  app.innerHTML = `<div class="panel-grid two">
    <div class="card">
      <h3>Contact</h3>
      <label>WhatsApp Number (format: 62xxxxxxxxxxx)</label><input id="wa" value="${escHtml(c.whatsapp || '')}">
      <label>Instagram</label><input id="ig" value="${escHtml(c.instagram || '')}">
      <label>Area Layanan (1 baris per area)</label><textarea id="areas">${escHtml((c.areas || []).join('\n'))}</textarea>
      <button class="primary" onclick="saveContact()">Simpan Contact</button>
    </div>
    <div class="card">
      <h3>Quick Preview</h3>
      <div class="info-list">
        <div><span>WhatsApp link</span><code>${escHtml(waPreview)}</code></div>
        <div><span>Instagram</span><code>${escHtml(c.instagram || '-')}</code></div>
        <div><span>Jumlah area</span><code>${(c.areas || []).length}</code></div>
      </div>
    </div>
  </div>`;
  bindDirtyInputs(app);
}
window.saveContact = async () => {
  C.contact = { whatsapp: $('#wa').value.trim(), instagram: $('#ig').value.trim(), areas: $('#areas').value.split('\n').map(x => x.trim()).filter(Boolean) };
  const r = await fetch('/admin/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(C.contact) });
  if (r.ok) {
    markDirty(false);
    toast('Contact disimpan');
    renderContact();
  } else toast('Save failed', 1);
};

function renderSecurity() {
  app.innerHTML = `<div class="card narrow"><h3>Security</h3>
    <label>New Username</label><input id="su" value="admin">
    <label>New Password (min 6 chars)</label><input id="sp" type="password" placeholder="new password">
    <button class="primary" onclick="changePassword()">Ganti Login</button>
    <p class="helper warn-text">Setelah ganti password, simpan baik-baik.</p>
  </div>`;
  bindDirtyInputs(app);
}
window.changePassword = async () => {
  const username = $('#su').value.trim(), password = $('#sp').value;
  if (!username || password.length < 6) return toast('Username & password min 6 chars', 1);
  const r = await fetch('/admin/api/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  if (r.ok) toast('Login updated'); else toast('Update failed', 1);
};

async function renderMedia() {
  app.innerHTML = `<div class="panel-grid two">
    <div class="card">
      <h3>Upload Media</h3>
      <input type="file" id="file" accept="image/*,video/*">
      <div class="row actions"><button class="primary" onclick="doUpload()">Upload</button><button class="ghost" onclick="loadMedia()">Refresh List</button></div>
      <div id="uploaded" class="helper" style="margin-top:12px"></div>
    </div>
    <div class="card">
      <h3>Tips Penggunaan</h3>
      <ul class="tips">
        <li>Upload dulu media baru, lalu copy URL atau pakai tombol Pilih Media di field lain.</li>
        <li>Untuk hero/portfolio, pilih gambar yang paling representatif.</li>
        <li>Untuk video showcase, isi <code>src</code> untuk video atau <code>thumb</code> untuk foto vertikal.</li>
      </ul>
    </div>
  </div><div id="mediaGrid" class="media-grid"></div>`;
  await loadMedia();
}
async function loadMedia() {
  const r = await fetch('/admin/api/media');
  const j = await r.json();
  mediaCache = j.files || [];
  const grid = $('#mediaGrid');
  const pickerGrid = $('#mediaPickerGrid');
  const html = mediaCache.map(f => {
    const isVideo = /\.(mp4|webm)$/i.test(f.url);
    return `<div class="media-item" data-name="${escHtml(f.name.toLowerCase())}"><div class="thumb">${isVideo ? `<video src="${f.url}" muted controls></video>` : `<img src="${f.url}" alt="${escHtml(f.name)}">`}</div><code>${escHtml(f.url)}</code><div class="media-actions"><button class="ghost small" onclick="copyText('${f.url}')">Copy URL</button><button class="primary small" onclick="selectMediaUrl('${f.url}')">Pilih</button></div></div>`;
  }).join('');
  if (grid) grid.innerHTML = html;
  if (pickerGrid) pickerGrid.innerHTML = html;
}
window.copyText = async (t) => { await navigator.clipboard.writeText(t); toast('URL dicopy'); };
window.doUpload = async () => {
  const f = $('#file').files[0];
  if (!f) return toast('Pick a file', 1);
  const fd = new FormData();
  fd.append('media', f);
  const r = await fetch('/admin/api/upload', { method: 'POST', body: fd });
  const j = await r.json();
  if (j.success) {
    $('#uploaded').innerHTML = `Uploaded: <code>${escHtml(j.url)}</code>`;
    toast('Upload berhasil');
    await loadMedia();
  } else toast('Upload failed', 1);
};

window.openMediaPicker = async (inputId) => {
  mediaTargetInputId = inputId;
  $('#mediaModal').classList.remove('hidden');
  $('#mediaSearch').value = '';
  if (!mediaCache.length) await loadMedia();
  filterMediaPicker();
};
window.closeMediaPicker = () => $('#mediaModal').classList.add('hidden');
window.selectMediaUrl = (url) => {
  if (mediaTargetInputId) {
    const input = document.getElementById(mediaTargetInputId);
    if (input) {
      input.value = url;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  closeMediaPicker();
  toast('Media dipilih');
};
window.filterMediaPicker = () => {
  const q = ($('#mediaSearch').value || '').toLowerCase().trim();
  $('#mediaPickerGrid').querySelectorAll('.media-item').forEach(el => {
    el.style.display = !q || el.dataset.name.includes(q) ? '' : 'none';
  });
};

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    save();
  }
  if (e.key === 'Escape') closeMediaPicker();
});

window.addEventListener('beforeunload', (e) => {
  if (!dirty) return;
  e.preventDefault();
  e.returnValue = '';
});

show('brand');
markDirty(false);
