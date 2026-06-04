let C = window.CONTENT;
const $ = (s,el=document)=>el.querySelector(s);
const app = $('#app');

function toast(msg, err){
  const t=document.createElement('div');
  t.className='toast'+(err?' err':'');t.textContent=msg;document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},2200);
}

async function save(){
  const r=await fetch('/admin/api/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(C)});
  if(r.ok)toast('Saved'); else toast('Save failed',1);
}

async function generate(){
  await save();
  const r=await fetch('/admin/api/generate',{method:'POST'});
  if(r.ok)toast('HTML generated to live site'); else toast('Generate failed',1);
}
window.generate=generate;

function setActive(name){document.querySelectorAll('aside button').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase()===name));}

function show(view){
  setActive(view);
  if(view==='brand')return renderBrand();
  if(view==='hero')return renderHero();
  if(view==='sections')return renderSections();
  if(view==='media')return renderMedia();
  if(view==='contact')return renderContact();
  if(view==='security')return renderSecurity();
  return renderCrud(view);
}
window.show=show;

function renderBrand(){
  const b=C.brand;
  app.innerHTML=`<h2>Brand & Theme</h2>
  <div class="card">
    <label>Brand Name</label><input id="bname" value="${b.name}">
    <label>Tagline</label><input id="btag" value="${b.tagline}">
    <div class="row">
      <div><label>Primary (Gold)</label><div class="swatch"><input type="color" id="cp" value="${b.colors.primary}"><input id="cpt" value="${b.colors.primary}"></div></div>
      <div><label>Terracotta</label><div class="swatch"><input type="color" id="ct" value="${b.colors.terracotta}"><input id="ctt" value="${b.colors.terracotta}"></div></div>
      <div><label>Charcoal</label><div class="swatch"><input type="color" id="cc" value="${b.colors.charcoal}"><input id="cct" value="${b.colors.charcoal}"></div></div>
    </div>
    <div class="row">
      <div><label>Body Font</label><input id="fb" value="${b.fonts.body}"></div>
      <div><label>Heading Font</label><input id="fh" value="${b.fonts.heading}"></div>
    </div>
    <button class="btn" onclick="saveBrand()">Save Brand</button>
  </div>`;
  [['cp','cpt'],['ct','ctt'],['cc','cct']].forEach(([a,b])=>{
    $('#'+a).oninput=()=>$('#'+b).value=$('#'+a).value;
    $('#'+b).oninput=()=>$('#'+a).value=$('#'+b).value;
  });
}
window.saveBrand=()=>{
  C.brand={name:$('#bname').value,tagline:$('#btag').value,
    colors:{primary:$('#cpt').value,terracotta:$('#ctt').value,charcoal:$('#cct').value},
    fonts:{body:$('#fb').value,heading:$('#fh').value}};
  save();
};

function renderHero(){
  const h=C.hero;
  app.innerHTML=`<h2>Hero Section</h2><div class="card">
    <label>Headline</label><textarea id="hh">${h.headline}</textarea>
    <label>Subheadline</label><textarea id="hs">${h.subheadline}</textarea>
    <label>Primary CTA</label><input id="hc1" value="${h.cta_primary}">
    <label>Secondary CTA</label><input id="hc2" value="${h.cta_secondary}">
    <label>Background Image URL</label><input id="hbg" value="${h.background_image}">
    <button class="btn" onclick="saveHero()">Save Hero</button>
  </div>`;
}
window.saveHero=()=>{
  C.hero={headline:$('#hh').value,subheadline:$('#hs').value,cta_primary:$('#hc1').value,
    cta_secondary:$('#hc2').value,background_image:$('#hbg').value};
  save();
};

function renderSections(){
  app.innerHTML=`<h2>Section Order & Visibility</h2><p style="margin-bottom:14px;color:#666">Drag to reorder. Toggle to show/hide.</p><div id="seclist"></div>`;
  const list=$('#seclist');
  const sorted=[...C.sections].sort((a,b)=>a.order-b.order);
  sorted.forEach(s=>{
    const el=document.createElement('div');
    el.className='card drag';el.draggable=true;el.dataset.id=s.id;
    el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><strong>⠿ ${s.name}</strong><label style="margin:0"><input type="checkbox" style="width:auto" ${s.enabled?'checked':''} onchange="toggleSec('${s.id}',this.checked)"> Enabled</label></div>`;
    list.appendChild(el);
  });
  let dragEl;
  list.querySelectorAll('.drag').forEach(el=>{
    el.addEventListener('dragstart',()=>{dragEl=el;el.classList.add('dragging')});
    el.addEventListener('dragend',()=>{el.classList.remove('dragging');commitOrder()});
    el.addEventListener('dragover',e=>{e.preventDefault();
      const after=getAfter(list,e.clientY);
      if(after==null)list.appendChild(dragEl);else list.insertBefore(dragEl,after);
    });
  });
}
function getAfter(list,y){
  const els=[...list.querySelectorAll('.drag:not(.dragging)')];
  return els.reduce((closest,child)=>{
    const box=child.getBoundingClientRect();const offset=y-box.top-box.height/2;
    if(offset<0&&offset>closest.offset)return{offset,element:child};return closest;
  },{offset:-Infinity}).element;
}
async function commitOrder(){
  const ids=[...$('#seclist').querySelectorAll('.drag')].map(el=>el.dataset.id);
  const ordered=ids.map(id=>C.sections.find(s=>s.id===id));
  C.sections=ordered.map((s,i)=>({...s,order:i+1}));
  await fetch('/admin/api/section-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sections:C.sections})});
  toast('Order saved');
}
window.toggleSec=(id,v)=>{C.sections.find(s=>s.id===id).enabled=v;save();};

const FIELDS={
  services:[['title','Title'],['description','Description','textarea'],['icon','Icon (emoji)']],
  portfolio:[['title','Title'],['location','Location'],['description','Description','textarea'],['image','Image URL']],
  testimonials:[['quote','Quote','textarea'],['name','Name'],['location','Location']],
  faq:[['question','Question'],['answer','Answer','textarea']]
};
function renderCrud(type){
  const fields=FIELDS[type];
  app.innerHTML=`<h2>${type.charAt(0).toUpperCase()+type.slice(1)}</h2><div id="items"></div><button class="btn add" onclick="addItem('${type}')">+ Add New</button>`;
  const wrap=$('#items');
  C[type].forEach(item=>{
    const el=document.createElement('div');el.className='card';
    el.innerHTML=fields.map(([k,lbl,t])=>t==='textarea'
      ?`<label>${lbl}</label><textarea data-k="${k}">${item[k]||''}</textarea>`
      :`<label>${lbl}</label><input data-k="${k}" value="${(item[k]||'').replace(/"/g,'&quot;')}">`).join('')
      +`<div class="row"><button class="btn" onclick="updItem('${type}','${item.id}',this)">Update</button><button class="btn del" onclick="delItem('${type}','${item.id}')">Delete</button></div>`;
    wrap.appendChild(el);
  });
}
window.addItem=async(type)=>{
  const body={};FIELDS[type].forEach(([k])=>body[k]='');
  const r=await fetch('/admin/api/items/'+type,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json();C[type]=j.items;renderCrud(type);toast('Added');
};
window.updItem=async(type,id,btn)=>{
  const card=btn.closest('.card');const body={};
  card.querySelectorAll('[data-k]').forEach(f=>body[f.dataset.k]=f.value);
  const r=await fetch(`/admin/api/items/${type}/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json();const i=C[type].findIndex(x=>x.id===id);C[type][i]=j.item;toast('Updated');
};
window.delItem=async(type,id)=>{
  if(!confirm('Delete this item?'))return;
  await fetch(`/admin/api/items/${type}/${id}`,{method:'DELETE'});
  C[type]=C[type].filter(x=>x.id!==id);renderCrud(type);toast('Deleted');
};

function renderContact(){
  const c=C.contact||{whatsapp:'',instagram:'',areas:[]};
  app.innerHTML=`<h2>Contact & Area</h2><div class="card">
    <label>WhatsApp Number (format: 62xxxxxxxxxxx)</label><input id="wa" value="${c.whatsapp||''}">
    <label>Instagram</label><input id="ig" value="${c.instagram||''}">
    <label>Area Layanan (1 baris per area)</label><textarea id="areas">${(c.areas||[]).join('\n')}</textarea>
    <button class="btn" onclick="saveContact()">Save Contact</button>
  </div>`;
}
window.saveContact=async()=>{
  C.contact={whatsapp:$('#wa').value.trim(),instagram:$('#ig').value.trim(),areas:$('#areas').value.split('\n').map(x=>x.trim()).filter(Boolean)};
  const r=await fetch('/admin/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(C.contact)});
  if(r.ok)toast('Contact saved'); else toast('Save failed',1);
};

function renderSecurity(){
  app.innerHTML=`<h2>Security</h2><div class="card">
    <label>New Username</label><input id="su" value="admin">
    <label>New Password (min 6 chars)</label><input id="sp" type="password" placeholder="new password">
    <button class="btn" onclick="changePassword()">Change Login</button>
    <p style="color:#b45309;margin-top:12px">Catatan: setelah ganti password, simpan baik-baik.</p>
  </div>`;
}
window.changePassword=async()=>{
  const username=$('#su').value.trim(), password=$('#sp').value;
  if(!username||password.length<6)return toast('Username & password min 6 chars',1);
  const r=await fetch('/admin/api/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
  if(r.ok)toast('Login updated'); else toast('Update failed',1);
};

async function renderMedia(){
  app.innerHTML=`<h2>Media Library</h2><div class="card"><input type="file" id="file" accept="image/*,video/*"><button class="btn" onclick="doUpload()">Upload</button><div id="uploaded" style="margin-top:14px"></div></div><div id="mediaGrid" class="media-grid"></div>`;
  await loadMedia();
}
async function loadMedia(){
  const r=await fetch('/admin/api/media'); const j=await r.json();
  const grid=$('#mediaGrid'); if(!grid||!j.files)return;
  grid.innerHTML=j.files.map(f=>`<div class="media-item"><div class="thumb">${f.url.match(/\.mp4|\.webm/i)?`<video src="${f.url}" muted controls></video>`:`<img src="${f.url}">`}</div><code>${f.url}</code><button onclick="copyText('${f.url}')">Copy URL</button></div>`).join('');
}
window.copyText=async(t)=>{await navigator.clipboard.writeText(t);toast('Copied');};
window.doUpload=async()=>{
  const f=$('#file').files[0];if(!f)return toast('Pick a file',1);
  const fd=new FormData();fd.append('media',f);
  const r=await fetch('/admin/api/upload',{method:'POST',body:fd});
  const j=await r.json();
  if(j.success){$('#uploaded').innerHTML=`<p>Uploaded: <code>${j.url}</code></p>`;toast('Uploaded');await loadMedia();}
  else toast('Upload failed',1);
};

show('brand');
