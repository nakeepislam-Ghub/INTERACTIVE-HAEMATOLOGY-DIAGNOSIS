(function(){
'use strict';
const $=s=>document.querySelector(s);
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- display: palette, light/dark, text size ---------- */
const DE=document.documentElement;
if(!DE.dataset.palette)DE.dataset.palette=store.get('palette')||'giemsa';
{const th=store.get('theme');if(th&&th!=='auto')DE.dataset.theme=th}
function dispSync(){const pal=DE.dataset.palette,mode=DE.dataset.theme||'auto',sz=DE.style.fontSize||'';
  document.querySelectorAll('#disp [data-pal]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pal===pal));
  document.querySelectorAll('#disp [data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));
  document.querySelectorAll('#disp [data-size]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.size===sz));
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=getComputedStyle(DE).getPropertyValue('--bar1').trim()||'#8f0e31'}
$('#disp').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.pal){DE.dataset.palette=b.dataset.pal;store.set('palette',b.dataset.pal)}
  else if(b.dataset.mode){if(b.dataset.mode==='auto')delete DE.dataset.theme;else DE.dataset.theme=b.dataset.mode;store.set('theme',b.dataset.mode)}
  else if(b.dataset.size!==undefined){DE.style.fontSize=b.dataset.size;store.set('tsize',b.dataset.size)}
  dispSync()});

/* ---------- popovers ---------- */
const POPS={otp:'#otpBtn',disp:'#themeBtn'};
function popShow(id,on){const p=$('#'+id),b=$(POPS[id]);if(on===undefined)on=p.hidden;
  Object.keys(POPS).forEach(k=>{if(k!==id){$('#'+k).hidden=true;$(POPS[k]).setAttribute('aria-expanded','false')}});
  p.hidden=!on;b.setAttribute('aria-expanded',on);if(on){if(id==='disp')dispSync();if(id==='otp')otpMark();const f=p.querySelector('a.cur,button,a');if(f&&matchMedia('(pointer:fine)').matches)f.focus({preventScroll:true})}}
$('#themeBtn').onclick=e=>{e.stopPropagation();popShow('disp')};
$('#otpBtn').onclick=e=>{e.stopPropagation();popShow('otp')};
document.addEventListener('click',e=>{if(!e.target.closest('.pop'))Object.keys(POPS).forEach(k=>{if(!$('#'+k).hidden)popShow(k,false)})});
document.addEventListener('keydown',e=>{if(e.key==='Escape')Object.keys(POPS).forEach(k=>{if(!$('#'+k).hidden){popShow(k,false);$(POPS[k]).focus()}})});

/* ---------- online status ---------- */
function net(){const on=navigator.onLine;const el=$('#net');el.textContent=on?'Online':'Offline: videos unavailable';el.classList.toggle('off',!on)}
addEventListener('online',net);addEventListener('offline',net);net();

/* ---------- contents ---------- */
const PARTS=[
 ['Foundations · Normal blood and marrow (supplementary)',['Haematopoiesis','Erythropoiesis and red cell physiology','Granulocytes: neutrophils, eosinophils, basophils','Monocytes, macrophages and lymphocytes','Megakaryocytes and platelets','Bone marrow structure and examination','Reference values and physiological variation'],{start:44,pre:'F'}],
 ['Part 1 · Red cell disorders',['Introduction to anaemia','Iron and haem disorders','Disorders of DNA synthesis','Haemolytic anaemia: introduction','Haemoglobin disorders','Red cell membrane disorders','Red cell enzyme disorders','Acquired haemolytic anaemias','Anaemia of chronic disorders']],
 ['Part 2 · Spleen and marrow failure',['The spleen and hypersplenism','Pancytopenia and bone marrow failure']],
 ['Part 3 · Myeloid neoplasms',['Clonal haematopoiesis','Myeloproliferative neoplasms','Mastocytosis','Myelodysplastic neoplasms','MDS/MPN overlap','Acute myeloid leukaemia','Mixed-lineage acute leukaemias','Secondary myeloid neoplasms']],
 ['Part 4 · Lymphoid neoplasms',['B-lymphoblastic leukaemia','CLL and splenic lymphomas','Indolent B-cell lymphomas','Aggressive B-cell and Hodgkin lymphoma','Plasma cell neoplasms','T- and NK-cell neoplasms']],
 ['Part 5 · Flow cytometry',['Principles and gating','Immunophenotyping of leukaemias']],
 ['Part 6 · Haemostasis and thrombosis',['Physiology of haemostasis','Laboratory evaluation of haemostasis','Platelet disorders','Coagulation factor disorders','Von Willebrand disease','Thrombophilia','Drugs affecting haemostasis']],
 ['Part 7 · White cell and histiocytic disorders',['Neutrophil, basophil and monocyte disorders','Eosinophil disorders','Lymphocyte disorders, infectious mononucleosis and ALPS','HLH and histiocytic and dendritic cell neoplasms','Lysosomal storage diseases']],
 ['Part 8 · Laboratory haematology',['The automated blood count','Diagnosis of haemoglobinopathies','Red cell investigations','Investigating haematological malignancies']]
];
const READY=window.BOOK_READY||[];
const TITLES={},LABEL={},ORDER=[];
const BOOK=(()=>{let n=0;return PARTS.map(([p,chs,o])=>({p,items:chs.map((c,i)=>{const k=o?o.start+i:++n;TITLES[k]=c;LABEL[k]=o?o.pre+(i+1):String(k);if(READY.includes(k))ORDER.push(k);return {n:k,c}})}))})();
const adj=(n,d)=>{const i=ORDER.indexOf(n);return i<0?null:ORDER[i+d]||null};
let CUR=null;
function buildToc(cur){let html='<a class="home-link'+(cur===0?' cur':'')+'" href="#home">Cover and contents</a><a class="home-link'+(cur==='atlas'?' cur':'')+'" href="#atlas">Haematology atlas</a><a class="home-link'+(cur==='practice'?' cur':'')+'" href="#practice">Practice: flashcards and cases</a><a class="home-link'+(cur==='flowlab'?' cur':'')+'" href="#flowlab">Flow lab: simulator</a><a class="home-link'+(cur==='anim'?' cur':'')+'" href="#animations">Animations index</a><a class="home-link'+(cur==='videos'?' cur':'')+'" href="#videos">Videos index</a><a class="home-link'+(cur==='exam'?' cur':'')+'" href="#exam">Mock exam</a><a class="home-link'+(cur==='credits'?' cur':'')+'" href="#credits">Credits and sources</a>';
  BOOK.forEach(({p,items:its})=>{const chs=its;let items='',ready=0,has=false;
    its.forEach(({n,c})=>{if(READY.includes(n))ready++;if(n===cur)has=true;
      items+= READY.includes(n)?`<li><a class="live${n===cur?' cur':''}" href="#ch${n}"${n===cur?' aria-current="page"':''}><span class="n">${LABEL[n]}</span>${c}</a></li>`:`<li><span><span class="n">${LABEL[n]}</span>${c}<span class="soon">soon</span></span></li>`});
    const open=typeof cur==='number'&&cur>0?has:true;
    html+=`<details class="tpart${has?' has-cur':''}"${open?' open':''}><summary><span>${p}</span><span class="tp-c" title="${ready} of ${chs.length} chapters ready">${ready}/${chs.length}</span></summary><ol>${items}</ol></details>`});
  $('#tocList').innerHTML=html+'<p class="nomatch" hidden>No chapter matches.</p>';
  const q=$('#tocQ');if(q&&q.value)tocFilter(q.value);
  navState(typeof cur==='number'&&cur>0?cur:null)}
function tocFilter(v){v=v.trim().toLowerCase();let any=false;
  document.querySelectorAll('#tocList .tpart').forEach(d=>{let m=0;
    d.querySelectorAll('li').forEach(li=>{const ok=!v||li.textContent.toLowerCase().includes(v)||d.querySelector('summary').textContent.toLowerCase().includes(v);li.hidden=!ok;if(ok)m++});
    d.hidden=!m;if(v&&m)d.open=true;if(m)any=true});
  $('#tocList .nomatch').hidden=any}
$('#tocQ').addEventListener('input',e=>tocFilter(e.target.value));
document.querySelector('.toc-all').addEventListener('click',e=>{const b=e.target.closest('[data-tall]');if(b)document.querySelectorAll('#tocList .tpart').forEach(d=>d.open=b.dataset.tall==='open')});

/* ---------- page navigation: prev/next, on this page, progress ---------- */
function navState(n){CUR=n;const pv=n?adj(n,-1):null,nx=n?adj(n,1):null;
  const P=$('#prevBtn'),N=$('#nextBtn');
  P.hidden=N.hidden=$('#otpBtn').hidden=!n;P.disabled=!pv;N.disabled=!nx;
  P.title=pv?`Previous: ${LABEL[pv]}. ${TITLES[pv]} (←)`:'';N.title=nx?`Next: ${LABEL[nx]}. ${TITLES[nx]} (→)`:'';
  P.onclick=()=>{if(pv)location.hash='#ch'+pv};N.onclick=()=>{if(nx)location.hash='#ch'+nx};
  $('#crumb').textContent=n?`${LABEL[n]} · ${TITLES[n]}`:'';
  if(!n)$('#otp').hidden=true;onScroll()}
$('#topBtn').onclick=()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
let OTP=[];
function onScroll(){const h=document.documentElement.scrollHeight-innerHeight;$('#progBar').style.width=(h>0?Math.min(100,scrollY/h*100):0)+'%'}
function otpMark(){let cur=null;for(const o of OTP){const el=document.getElementById(o);if(el&&el.getBoundingClientRect().top<innerHeight*.35)cur=o}
  document.querySelectorAll('#otpList a').forEach(a=>a.classList.toggle('cur',a.dataset.id===cur))}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);
function reveal(el){if(!el)return;const s=el.closest('.fold.shut,.panel.shut');if(s)setFold(s,true);if(el.classList&&(el.classList.contains('shut')))setFold(el,true)}
function setFold(s,open){s.classList.toggle('shut',!open);const b=s.querySelector(':scope > h2 .sec-tg, :scope > .pn-tg');if(b){b.setAttribute('aria-expanded',open);if(b.classList.contains('pn-tg'))b.setAttribute('aria-label',(open?'Hide ':'Show ')+(s.querySelector('h2')||{}).textContent)}onScroll()}
function foldAll(open){view.querySelectorAll('.lec > .fold').forEach(s=>setFold(s,open));store.set('secmode',open?'open':'closed')}
function enhanceChapter(){
  const secs=[...view.querySelectorAll('.lec > section')];const mode=store.get('secmode')||'first';
  secs.forEach((s,i)=>{const h=s.querySelector(':scope > h2');if(!h)return;if(!s.id)s.id='sec-'+(i+1);
    const body=document.createElement('div');body.className='sec-body';body.id=s.id+'-body';
    while(h.nextSibling)body.appendChild(h.nextSibling);
    const sub=[...body.querySelectorAll('h3')].map(x=>x.textContent.trim()).slice(0,4);
    const peek=document.createElement('p');peek.className='sec-peek';
    const nt=body.querySelectorAll('.tbl').length,nf=body.querySelectorAll('figure').length,nv=body.querySelectorAll('.video').length;
    peek.textContent=[sub.length?sub.join(' · '):'',[nt&&`${nt} table${nt>1?'s':''}`,nf&&`${nf} figure${nf>1?'s':''}`,nv&&'video'].filter(Boolean).join(', ')].filter(Boolean).join('  —  ')||'Tap to open';
    s.appendChild(peek);s.appendChild(body);
    const b=document.createElement('button');b.type='button';b.className='sec-tg';b.setAttribute('aria-controls',body.id);
    b.innerHTML=h.innerHTML+'<span class="chev" aria-hidden="true"></span>';h.innerHTML='';h.appendChild(b);
    s.classList.add('fold');setFold(s,mode==='open'||(mode==='first'&&i===0));
    b.onclick=()=>setFold(s,s.classList.contains('shut'))});
  const lec=view.querySelector('.lec');
  if(lec&&secs.length>1){const t=document.createElement('div');t.className='lec-tools';
    t.innerHTML=`<span class="eyebrow">Lecture · ${secs.length} sections</span><span><button type="button" class="btn sm" data-all="open">Expand all</button><button type="button" class="btn sm" data-all="close">Collapse all</button></span>`;lec.prepend(t)}
  view.querySelectorAll('section.panel').forEach(p=>{const hd=p.querySelector(':scope > header');if(!hd)return;
    const body=document.createElement('div');body.className='pn-body';while(hd.nextSibling)body.appendChild(hd.nextSibling);p.appendChild(body);
    const b=document.createElement('button');b.type='button';b.className='pn-tg';p.insertBefore(b,hd.nextSibling);b.onclick=()=>setFold(p,p.classList.contains('shut'));setFold(p,true)});
  // on this page
  OTP=[];let h='';const L=secs.filter(s=>s.classList.contains('fold'));
  if(L.length){h+='<li class="og">Lecture</li>';L.forEach(s=>{OTP.push(s.id);const sn=s.querySelector('.sn');const tx=[...s.querySelector('.sec-tg').childNodes].filter(x=>!(x.classList&&(x.classList.contains('sn')||x.classList.contains('chev')))).map(x=>x.textContent).join('').trim();
    h+=`<li><a href="#${s.id}" data-id="${s.id}"><span class="n">${sn?sn.textContent:''}</span>${esc(tx)}</a></li>`})}
  const PN=[...view.querySelectorAll('section.panel[id]')];
  if(PN.length){h+='<li class="og">Interactive and practice</li>';PN.forEach(p=>{OTP.push(p.id);const e=p.querySelector('header .eyebrow'),t2=p.querySelector('header h2');
    h+=`<li><a href="#${p.id}" data-id="${p.id}"><span class="n">${e?'•':''}</span>${esc(t2?t2.textContent:p.id)}</a></li>`})}
  $('#otpList').innerHTML=h}
document.addEventListener('click',e=>{const b=e.target.closest('[data-all]');if(!b)return;foldAll(b.dataset.all==='open')});
$('#otpList').addEventListener('click',e=>{if(e.target.closest('a'))popShow('otp',false)});
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;const tg=e.target;if(tg.closest&&tg.closest('input,select,textarea,[contenteditable],.lb'))return;
  if(!$('#lb').hidden)return;
  if(e.key==='ArrowLeft'&&CUR&&!$('#prevBtn').disabled){$('#prevBtn').click()}
  else if(e.key==='ArrowRight'&&CUR&&!$('#nextBtn').disabled){$('#nextBtn').click()}
  else if(e.key==='/'&&innerWidth>900){e.preventDefault();$('#tocQ').focus()}});
const toc=$('#toc');
$('#menuBtn').onclick=()=>{toc.classList.add('open');$('#menuBtn').setAttribute('aria-expanded','true')};
$('#tocClose').onclick=()=>{toc.classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false')};
toc.addEventListener('click',e=>{if(e.target.closest('a'))toc.classList.remove('open')});

/* ---------- router ---------- */
const view=$('#view');
function home(){
  let parts='';
  BOOK.forEach(({p,items:its})=>{const items=its.map(({n,c})=>READY.includes(n)?`<li><a href="#ch${n}"><span class="n">${LABEL[n]}</span>${c}</a></li>`:`<li class="off"><span class="n">${LABEL[n]}</span>${c}</li>`).join('');parts+=`<section class="hpart"><h3>${p}</h3><ol>${items}</ol></section>`});
  view.innerHTML=`<div class="cover wide">
    <div class="eyebrow">Interactive</div>
    <h1>Haematology Diagnosis</h1>
    <p class="by"><b>Prof. Abeer Mohammed, MD PhD</b><small>Professor of Clinical Pathology, Faculty of Medicine for Girls, Al-Azhar University</small><b>Ass. Prof. Islam Fathy Elnakeeb</b><small>Assistant Professor of Clinical Pathology, Faculty of Medicine, Aswan University</small></p>
    <p class="lede">For medical students, haematology residents, and Master's and MD candidates: Prof. Abeer Mohammed's lecture notes rebuilt with her videos, 3D animations, clickable diagrams, blood film galleries, calculators, cases and quizzes.</p>
    <p class="ded">Offered free by the authors for public benefit.</p>
    <p class="inst" id="instBox" hidden><button class="btn primary" id="instBtn">⬇ Install on this device</button><span class="note">Works offline and updates itself.</span></p>
    <a class="at-cta feat" href="#flowlab"><span class="eyebrow">New · Flow cytometry lab</span><b>Egypt Flow Educational App</b><span>A simulator for learning by doing: gate simulated patient samples, remove doublets, set compensation and diagnose 14 cases with scores, an exam mode and Arabic explanations.</span></a>
    <a class="at-cta" href="#atlas"><span class="eyebrow">Atlas</span><b>Haematology atlas</b><span>Every blood film, marrow and lab image in one place, with an Identify quiz.</span></a>
    <a class="at-cta" href="#practice"><span class="eyebrow">Practice</span><b>Flashcards, questions and cases</b><span>176 revision cards, 76 questions, 19 stepwise cases, diagnostic algorithms and reporting checklists.</span></a>
    <a class="at-cta" href="#animations"><span class="eyebrow">Animations</span><b>Every animation in one place</b><span>11 narrated 3D scenes and 42 animated diagrams, each with a direct link to its place in the book.</span></a>
    <a class="at-cta" href="#videos"><span class="eyebrow">Videos</span><b>Every lecture video in one place</b><span>Prof. Abeer Mohammed's lectures and playlists, listed by chapter with direct links.</span></a>
    <a class="at-cta" href="#exam"><span class="eyebrow">Mock exam</span><b>Test yourself on the whole book</b><span>Random timed exams from 479 questions, with your score by part and a review of every mistake.</span></a>
    <div class="hparts">${parts}</div>
    <p class="note" style="margin-top:2rem"><a href="#credits">Credits and sources</a></p>
  </div>`;
  instSync();
  document.title="Interactive Haematology Diagnosis";buildToc(0);scrollTo(0,0)}
let INST=null;
function instSync(){const b=$('#instBox');if(!b)return;b.hidden=!INST;const t=$('#instBtn');if(t)t.onclick=async()=>{if(!INST)return;INST.prompt();try{await INST.userChoice}catch(e){}INST=null;instSync()}}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();INST=e;instSync()});
addEventListener('appinstalled',()=>{INST=null;instSync()});
const PRE={1:[45,50],2:[45],3:[45],4:[45],5:[45],6:[45],7:[45],11:[44,49],12:[44],13:[44,49],15:[49],17:[44,46],20:[47],21:[47],24:[47],28:[48],30:[48],35:[46],36:[46],37:[47],40:[50],43:[49]};
async function chapter(n){
  view.innerHTML='<p class="col note" style="padding-top:2rem">Loading chapter…</p>';
  try{const r=await fetch(`chapters/ch${n}.html`);if(!r.ok)throw 0;view.innerHTML=await r.text()+footer()}
  catch(e){view.innerHTML=`<div class="col"><h1>Chapter not available</h1><p>This chapter could not be loaded. If you are offline, open it once while online so it is saved for offline reading.</p><p><a href="#home">Back to contents</a></p></div>`;return}
  document.title=`${TITLES[n]||'Chapter '+n} · Interactive Haematology Diagnosis`;buildToc(n);
  view.querySelectorAll('[data-widget]').forEach(w=>{const f=W[w.dataset.widget];if(f)try{f(w)}catch(err){console.error(err)}});
  const pre=PRE[n],hd=view.querySelector('.chead .jump');
  if(pre&&hd)hd.insertAdjacentHTML('beforebegin',`<p class="pre-link"><b>Foundations first:</b> ${pre.filter(k=>READY.includes(k)).map(k=>`<a href="#ch${k}">${LABEL[k]} · ${TITLES[k]}</a>`).join('')}</p>`);
  view.querySelectorAll('.video').forEach(video);animFigures(view);enhanceChapter();
  const nx=adj(n,1),pv=adj(n,-1);
  const nav=document.createElement('nav');nav.className='wide chnav';
  nav.innerHTML=(pv?`<a href="#ch${pv}">← ${LABEL[pv]}. ${TITLES[pv]}</a>`:'<span></span>')+(nx?`<a href="#ch${nx}">${LABEL[nx]}. ${TITLES[nx]} →</a>`:'');
  view.querySelector('footer').before(nav);
  scrollTo(0,0)}
function footer(){return `<footer class="wide"><b>Interactive Haematology Diagnosis</b>, a free teaching book for public benefit. Lecture content by Prof. Abeer Mohammed, MD PhD (Al-Azhar University), from her notes on the Egyptian Clinical Pathology Atlas (ecpatlas.com). Concept, design and interactive edition by Ass. Prof. Islam Fathy Elnakeeb (Aswan University). For education only, not a substitute for clinical judgement. Videos stream from YouTube and need an internet connection; everything else works offline once the book is installed.</footer>`}
function goSpot(a){let t=null;const f=/^fig-(\d+)$/.exec(a),vd=/^vid-(\d+)$/.exec(a);if(f)t=view.querySelectorAll('figure.redraw')[+f[1]];else if(vd)t=view.querySelectorAll('.video')[+vd[1]];else t=document.getElementById(a);if(!t)return;reveal(t);setTimeout(()=>t.scrollIntoView({block:f||vd?'center':'start'}),60)}
function route(){const h=location.hash.slice(1);const m=/^ch(\d+)(?:\/([\w-]+))?$/.exec(h);
  if(m&&READY.includes(+m[1])){const p=chapter(+m[1]);if(m[2])p.then(()=>goSpot(m[2]))}
  else if(h==='animations')animations();
  else if(h==='videos')videos();
  else if(h==='atlas')atlas();
  else if(h==='credits')credits();
  else if(h==='practice')practice();
  else if(/^flowlab(\/[\w-]+)?$/.test(h))flowlab(h.split('/')[1]);
  else if(h==='exam')exam();
  else if(!h||h==='home'||m)home();
  else{const t=document.getElementById(h);if(t){reveal(t);t.scrollIntoView()}}}
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href').slice(1);
  if(id==='home'||/^flowlab(\/[\w-]+)?$/.test(id)||id==='atlas'||id==='credits'||id==='practice'||id==='exam'||id==='animations'||id==='videos'||/^ch\d+(\/[\w-]+)?$/.test(id))return;const t=document.getElementById(id);if(t){e.preventDefault();reveal(t);t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}});
addEventListener('hashchange',route);

/* ---------- Flow lab (Egypt Flow Educational App) ---------- */
const FLOW_MODS=[['gating','Gating lab','Draw gates, back-gate, histograms and MFI'],['singlet','Singlet gating','Remove doublets on FSC-A vs FSC-H'],['compensation','Compensation','FITC and PE spillover'],['glossary','Marker glossary','Antigens and what they mean'],['cases','Clinical cases','14 cases with scoring and exam mode']];
function flowlab(sub){
  const cur=FLOW_MODS.some(m=>m[0]===sub)?sub:'gating';
  view.innerHTML=`<article class="col chead" id="top"><div class="eyebrow">Flow cytometry · Practice lab</div><h1>Egypt Flow Educational App</h1><p>A simulator for learning flow cytometry by doing: gate simulated patient samples, remove doublets, set compensation and diagnose 14 cases. It follows the book's colours and works on a phone.</p></article>
  <div class="wide flowlab">
    <div class="fl-tabs" role="group" aria-label="Simulator modules">${FLOW_MODS.map(m=>`<button class="btn${m[0]===cur?' primary':''}" data-m="${m[0]}" title="${m[2]}">${m[1]}</button>`).join('')}</div>
    <iframe id="flFrame" src="flowedu/index.html#${cur}" title="Egypt Flow Educational App"></iframe>
    <p class="note">Prefer a bigger view? <a href="flowedu/index.html#${cur}" target="_blank" rel="noopener">Open full screen</a>. Read first: <a href="#ch26">26 Principles and gating</a> and <a href="#ch27">27 Immunophenotyping of leukaemia</a>. Data are simulated, for teaching only.</p>
  </div>`;
  document.title='Flow lab · Interactive Haematology Diagnosis';buildToc('flowlab');
  const fr=$('#flFrame');
  view.querySelectorAll('.fl-tabs button').forEach(b=>b.onclick=()=>{view.querySelectorAll('.fl-tabs button').forEach(x=>x.classList.toggle('primary',x===b));try{fr.contentWindow.location.hash=b.dataset.m}catch(e){fr.src='flowedu/index.html#'+b.dataset.m}});
  scrollTo(0,0)}

/* ---------- Credits ---------- */
const CC_PHOTOS=[["Basophilic normoblast", "Bobjgalindo", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Prorubricyte.jpg"], ["Polychromatic normoblast", "El*Falaf", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Hem1PolychromaticErythroblast.jpg"], ["Orthochromatic normoblast", "Bobjgalindo", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Metarubricyte.jpg"], ["Reticulocytes (supravital stain)", "Ed Uthman, MD, pathologist, Houston, Texas, USA", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Reticulocytes_Human_Blood_Supravital_Stain.jpg"], ["Normal red cells", "Keith Chambers", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Normal_Adult_Blood_Smear.JPG"], ["Promyelocyte", "isis325", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Ww325_promyelocyte.jpg"], ["Myelocyte", "El*Falaf", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Hem1Myelocyte.jpg"], ["Metamyelocyte", "El*Falaf", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Hem1Metamyelocyte.jpg"], ["Band neutrophil", "Ajay Kumar Chaurasiya", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Band_form_neutrophil_in_Wright_stained_PBS_microscopy.jpg"], ["Segmented neutrophil", "El*Falaf", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Hem1SegmNeutrophile.jpg"], ["Eosinophil", "El*Falaf", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Hem1Eosinophile.jpg"], ["Basophil", "El*Falaf", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Hem1Basophile.jpg"], ["Monocyte", "El*Falaf", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Hem1Monocyte.jpg"], ["Small lymphocyte", "El*Falaf", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Hem1Lymphocyte.jpg"], ["Normal megakaryocyte", "Simon Caulton", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Megakaryocyte.jpg"], ["Platelet clumps", "Tommaso Leonardi (Tleonardi)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Platelets.jpg"], ["Mast cell", "Ed Uthman", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Mast_Cell,_Bone_Marrow_Aspirate,_Wright_Stain_(5916735712).jpg"], ["Spherocytes (hereditary spherocytosis)", "Joan-Lluis Vives-Corrons et al.", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Peripheral_blood_smear_stained_with_MGG_from_a_patient_with_hereditary_spherocytosis.png"], ["Target cells", "Ed Uthman", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Target_Cells,_Peripheral_Blood_Smear_(39144139915).jpg"], ["Schistocytes", "Mikael Häggström", "CC0", "https://commons.wikimedia.org/wiki/File:Micrograph_of_schistocytes.jpg"], ["Sickle cells", "Ed Uthman", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Sickle_Cell_Anemia_(5610746554).jpg"], ["Acanthocytes", "S Bhimji", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Human_blood_film_with_acanthocytes_01.jpg"], ["Howell–Jolly bodies", "El*Falaf", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Howell-Jolly_body_in_erythrocyte_(bottom_left).jpg"], ["Pappenheimer bodies", "Paulo Henrique Orlandi Mourão", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Pappenheimer_bodies_smear_2015-08-31.jpg"], ["Megaloblastic marrow", "Makysm", "CC0", "https://commons.wikimedia.org/wiki/File:Megaloblasts.jpg"], ["Ring sideroblasts (Perls)", "Paulo Henrique Orlandi Mourão", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Ring_Sideroblast_smear_2010-01-13.JPG"], ["Hypersegmented neutrophil", "Ed Uthman", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Hypersegmented_neutrophil.jpg"], ["Polychromatic red cell", "Mikael Häggström", "CC0", "https://commons.wikimedia.org/wiki/File:Peripheral_blood_smear_with_polychromasia.jpg"], ["Teardrop cell", "Mikael Häggström", "CC0", "https://commons.wikimedia.org/wiki/File:Micrograph_of_a_tear_drop_cell_(dacrocyte).jpg"], ["Basophilic stippling", "Mikael Häggström", "CC0", "https://commons.wikimedia.org/wiki/File:Micrograph_of_a_red_blood_cell_with_basophilic_stippling.jpg"], ["Elliptocyte", "Mikael Häggström", "CC0", "https://commons.wikimedia.org/wiki/File:Micrograph_of_an_elliptocyte_on_a_peripheral_blood_smear_02.jpg"], ["Myeloblast with Auer rod", "Armed Forces Institute of Pathology (US)", "Public domain", "https://commons.wikimedia.org/wiki/File:Two_myeloblasts_with_Auer_rods.jpg"], ["Iron deficiency anaemia", "Ed Uthman", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Iron-deficiency_Anemia,_Peripheral_Blood_Smear_(4422704616).jpg"], ["Hypergranular APL (M3)", "Armed Forces Institute of Pathology (US)", "Public domain", "https://commons.wikimedia.org/wiki/File:AML-M3.jpg"], ["Lymphoblasts (ALL)", "VashiDonsk (English Wikipedia)", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Acute_leukemia-ALL.jpg"], ["Myeloma plasma cells", "Dr Roshan Nasimudeen", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Multiple_myeloma.jpg"], ["Sézary cell", "El*Falaf", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Hem1SezaryCell.jpg"], ["Toxic granulation", "DaFerRod", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Cayado_con_granulaci%C3%B3n_t%C3%B3xica.jpg"]];
const CC_LIC={"CC0": "https://creativecommons.org/publicdomain/zero/1.0/", "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/", "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/", "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/", "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/", "CC BY-SA 2.5": "https://creativecommons.org/licenses/by-sa/2.5/", "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/", "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/"};
function credits(){
  const src=[['Part 1 · Red cell disorders','Red Cells Disorders notes','Chapters 1–9'],['Part 2 · Spleen and marrow failure','Spleen, Pancytopenia and Bone Marrow Failure notes','Chapters 10–11'],['Part 3 · Myeloid neoplasms','Myeloid Proliferations and Neoplasms notes','Chapters 12–19'],['Part 4 · Lymphoid neoplasms','Lymphoid Neoplasms notes','Chapters 20–25'],['Part 5 · Flow cytometry','Flow cytometry notes','Chapters 26–27'],['Part 6 · Haemostasis and thrombosis','Hemostasis notes','Chapters 28–34'],['Part 7 · White cell and histiocytic disorders','Leukocyte Disorders, Histiocytic/Dendritic Cell Disorders, Lysosomal Storage Diseases and Autoimmune Lymphoproliferative Disorders notes','Chapters 35–39'],['Part 8 · Laboratory haematology','Haematological Investigations and Haematological and Lymphoid Neoplasms: Introduction notes','Chapters 40–43']];
  view.innerHTML=`<article class="col chead" id="top"><div class="eyebrow">About this book</div><h1>Credits and sources</h1><p>Who wrote what, where every image comes from, and the tools that make the book work offline.</p></article>
  <div class="col lec">
  <section><h2>Authors</h2><p><b>Prof. Abeer Mohammed, MD PhD</b>, Professor of Clinical Pathology, Faculty of Medicine for Girls, Al-Azhar University: scientific content. <b>Ass. Prof. Islam Fathy Elnakeeb</b>, Assistant Professor of Clinical Pathology, Faculty of Medicine, Aswan University: concept, design, editing and the interactive edition, built with AI assistance (Claude). The authors offer this book free for public benefit.</p><p>All lecture content, criteria, algorithms, micrographs and laboratory images in Parts 1 to 8 come from her lecture notes and her teaching on the <a href="https://www.ecpatlas.com/hematology-atlas/hema-lectures" target="_blank" rel="noopener">Egyptian Clinical Pathology Atlas</a>. Lecture content © Prof. Abeer Mohammed. The Foundations part and the Practice page are supplementary and are described below.</p></section>
  <section><h2>Source notes</h2><div class="tbl"><table><thead><tr><th>Part</th><th>Dr Abeer's notes</th><th>Chapters</th></tr></thead><tbody>${src.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div><p class="note">Each chapter names the exact pages it draws on under its title.</p></section>
  <section><h2>Supplementary material</h2><p><b>The Foundations part, normal blood and marrow (chapters F1–F7)</b> and the <a href="#practice">Practice</a> page (flashcards, questions, cases, algorithms and checklists) were not taken from Dr Abeer's notes. They were written by Ass. Prof. Islam Fathy Elnakeeb, with AI assistance, from standard references, and are labelled as supplementary wherever they appear:</p><ul><li>Dacie and Lewis Practical Haematology, 11th ed.</li><li>Bain, Blood Cells: A Practical Guide, 5th ed.; Bain et al., Bone Marrow Pathology, 4th ed.</li><li>Hoffbrand et al., Postgraduate Haematology, 7th ed.</li><li>Jaffe et al., Hematopathology, 2nd ed.</li><li>WHO Classification of Haematolymphoid Tumours, 5th ed. (2022) and the International Consensus Classification (2022); ELN 2022 AML recommendations; IMWG myeloma criteria</li><li>ISTH guidance and the ASH/ISTH/NHF/WFH 2021 von Willebrand disease guidelines</li></ul><p class="note">Each supplementary chapter lists its own references at the end.</p></section>
  <section><h2>Videos</h2><p>All videos are Dr Abeer's own lectures on her YouTube channel, <a href="https://www.youtube.com/@abeermohammed135" target="_blank" rel="noopener">@abeermohammed135</a>. They stream from YouTube and need an internet connection.</p></section>
  <section><h2>Images</h2><ul>
    <li><b>Blood films, marrow, flow cytometry plots and laboratory images</b> in the galleries of Parts 1 to 8 are taken from Dr Abeer's lecture notes and keep her captions and identifications.</li>
    <li><b>Redrawn diagrams</b> (captions start "Redrawn") were drawn new for this edition from her notes, to replace textbook or internet figures and to make small text readable on phones. Their source files are kept with the book.</li>
    <li>Figures carrying a publisher's copyright mark or a textbook figure caption were left out, and their content was redrawn or turned into tables.</li>
    <li><b>Openly licensed photographs</b> from Wikimedia Commons are used in the Foundations part and in the atlas. Each one carries a "Photo:" credit in its caption and is listed below with its author, licence and source. All were cropped and resized.</li>
    <li>No image in this book was generated artificially. Micrographs are real preparations.</li>
  </ul></section>
  <section><h2>Openly licensed photographs</h2><div class="tbl"><table><thead><tr><th>Image</th><th>Author</th><th>Licence</th><th>Source</th></tr></thead><tbody>${CC_PHOTOS.map(p=>`<tr><td>${p[0]}</td><td>${esc(p[1])}</td><td>${CC_LIC[p[2]]?`<a href="${CC_LIC[p[2]]}" target="_blank" rel="noopener">${p[2]}</a>`:p[2]}</td><td><a href="${p[3]}" target="_blank" rel="noopener">Wikimedia Commons</a></td></tr>`).join('')}</tbody></table></div><p class="note">Photographs under a ShareAlike licence remain under that licence; the cropped versions used here may be reused on the same terms.</p></section>
  <section><h2>Interactive tools</h2><p>Calculators, flowcharts, matchers and quizzes were built from the criteria and algorithms in Dr Abeer's notes, with current WHO 5th edition and ICC 2022 terms where her notes use them. They are teaching aids: always integrate the clinical picture, morphology, immunophenotype and genetics, and check local protocols before treatment decisions.</p></section>
  <section><h2>Typefaces and software</h2><ul>
    <li><b>Young Serif</b> (Bastien Sozeau), <b>Source Sans 3</b> (Adobe) and <b>IBM Plex Mono</b> (IBM): SIL Open Font License, via Google Fonts.</li>
    <li>Plain HTML, CSS and JavaScript with no external libraries; a service worker keeps chapters available offline after the first visit.</li>
  </ul></section>
  <section><h2>Edition</h2><p>Interactive Haematology Diagnosis, interactive edition by <b>Ass. Prof. Islam Fathy Elnakeeb</b>. Offered free by the authors for public benefit.</p><p><a href="#home">Back to contents</a></p></section>
  </div>`+footer();
  document.title="Credits · Interactive Haematology Diagnosis";buildToc('credits');scrollTo(0,0)}

/* ---------- Atlas ---------- */
const AT={sys:'all',type:'all',q:'',mode:'browse',quiz:null,score:[0,0]};
const AT_SYS=[['all','All systems'],['Normal blood and marrow','Normal cells'],['Red cells','Red cells'],['White cells','White cells'],['Platelets and haemostasis','Platelets and haemostasis']];
const AT_TYPE=[['all','All'],['film','Blood film'],['marrow','Bone marrow'],['lab','Lab test']];
let ATLAS=null;
async function atlas(){
  view.innerHTML='<p class="col note" style="padding-top:2rem">Loading atlas…</p>';
  try{if(!ATLAS){const r=await fetch('atlas.json');if(!r.ok)throw 0;ATLAS=await r.json()}}
  catch(e){view.innerHTML=`<div class="col"><h1>Atlas not available</h1><p>Open the atlas once while online so it is saved for offline use.</p><p><a href="#home">Back to contents</a></p></div>`;return}
  view.innerHTML=`<article class="col chead"><div class="eyebrow">Atlas</div><h1>Haematology atlas</h1>
    <p>Every blood film, marrow and laboratory image in the book in one place. Search or filter, tap an image to enlarge it, or test yourself with Identify.</p>
    <div class="at-mode" role="tablist"><button role="tab" class="btn" data-m="browse">Browse</button><button role="tab" class="btn" data-m="quiz">Identify</button></div></article>
    <section class="wide at"><div class="at-f">
      <input type="search" id="atQ" placeholder="Search, e.g. spherocytes, marrow, CML" aria-label="Search the atlas">
      <div class="at-chips" data-g="sys">${AT_SYS.map(([k,l])=>`<button class="chip" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="at-chips" data-g="type">${AT_TYPE.map(([k,l])=>`<button class="chip" data-v="${k}">${l}</button>`).join('')}</div>
    </div><div id="atBody" aria-live="polite"></div></section>`+footer();
  const q=$('#atQ');q.value=AT.q;q.oninput=()=>{AT.q=q.value;AT.quiz=null;atDraw()};
  view.querySelector('.at').addEventListener('click',atClick);
  view.querySelector('.at-mode').onclick=e=>{const b=e.target.closest('button');if(b){AT.mode=b.dataset.m;AT.quiz=null;atDraw()}};
  document.title="Atlas · Interactive Haematology Diagnosis";buildToc('atlas');atDraw();scrollTo(0,0)}
function atList(){const t=AT.q.trim().toLowerCase();
  return ATLAS.filter(a=>(AT.sys==='all'||a.sys===AT.sys)&&(AT.type==='all'||a.type===AT.type)&&(!t||(a.name+' '+a.cap).toLowerCase().includes(t)))}
const atChs=a=>a.chs.map(c=>`<a href="#ch${c}">Chapter ${LABEL[c]||c}</a>`).join(' · ');
function atDraw(){
  view.querySelectorAll('.at-chips button').forEach(b=>b.setAttribute('aria-pressed',AT[b.parentNode.dataset.g]===b.dataset.v));
  view.querySelectorAll('.at-mode button').forEach(b=>b.setAttribute('aria-selected',AT.mode===b.dataset.m));
  const L=atList(),body=$('#atBody');
  if(AT.mode==='browse'){
    body.innerHTML=`<p class="note">${L.length} image${L.length===1?'':'s'}</p>`+(L.length?`<div class="gal at-grid">${L.map(a=>`<figure><button data-src="${a.src}"><img src="${a.src}" alt="${esc(a.name)}" loading="lazy" width="400" height="300"></button><figcaption><b>${a.name}</b><span>${a.cap}</span><small>${atChs(a)}</small></figcaption></figure>`).join('')}</div>`:'<p>No images match. Try another word or filter.</p>');
    return}
  if(L.length<2){body.innerHTML='<p>Choose a wider filter: Identify needs at least two images.</p>';return}
  if(!AT.quiz){const a=L[Math.floor(Math.random()*L.length)];
    const pool=ATLAS.filter(x=>x!==a&&x.name!==a.name);const same=pool.filter(x=>x.type===a.type).sort(()=>Math.random()-.5);
    const opts=[a,...same.slice(0,3)];for(const x of pool.sort(()=>Math.random()-.5)){if(opts.length>=4)break;if(!opts.includes(x))opts.push(x)}
    AT.quiz={a,opts:opts.sort(()=>Math.random()-.5),pick:null}}
  const Z=AT.quiz,done=Z.pick!==null;
  body.innerHTML=`<div class="at-quiz"><div class="at-img"><img src="${Z.a.src}" alt="Image to identify"></div><div>
    <div class="eyebrow">What does this image show?</div>
    <div class="at-opts">${Z.opts.map((o,i)=>`<button class="btn${done?(o===Z.a?' ok':i===Z.pick?' bad':''):''}" data-o="${i}"${done?' disabled':''}>${o.name}</button>`).join('')}</div>
    ${done?`<div class="verdict"><b>${Z.opts[Z.pick]===Z.a?'Correct.':'Not quite: it is '+Z.a.name+'.'}</b><div class="note">${Z.a.cap}</div><div class="note">${atChs(Z.a)}</div></div><button class="btn primary" data-c="next">Next image</button>`:''}
    <p class="note">Score ${AT.score[0]} of ${AT.score[1]}</p></div></div>`}
function atClick(e){const b=e.target.closest('button');if(!b)return;
  const g=b.parentNode.dataset&&b.parentNode.dataset.g;
  if(g){AT[g]=b.dataset.v;AT.quiz=null;atDraw()}
  else if(b.dataset.src){const a=ATLAS.find(x=>x.src===b.dataset.src);$('#lbImg').src=a.src;$('#lbImg').alt=a.name;$('#lbCap').innerHTML=`<b>${a.name}</b> ${a.cap} <span class="note">${atChs(a)}</span>`;$('#lb').hidden=false;$('#lbX').focus()}
  else if(b.dataset.o!==undefined&&AT.quiz.pick===null){AT.quiz.pick=+b.dataset.o;AT.score[1]++;if(AT.quiz.opts[AT.quiz.pick]===AT.quiz.a)AT.score[0]++;atDraw()}
  else if(b.dataset.c==='next'){AT.quiz=null;atDraw()}}
$('#lbCap').addEventListener('click',e=>{if(e.target.closest('a'))$('#lb').hidden=true});

/* ---------- videos ---------- */
function video(v){
  const id=v.dataset.video, t=v.dataset.title, list=v.dataset.list, sub=v.dataset.sub||'';
  if(!id){v.classList.add('pending');v.innerHTML=`<div class="frame"><div>Video slot: <b>${t}</b><br>Dr Abeer's lecture video will play here.</div></div>`;return}
  const q=list?`&list=${list}`:'';
  v.innerHTML=`<div class="frame"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35" onerror="this.remove()"><button class="play" style="position:relative" aria-label="Play ${t}"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="31" fill="rgba(0,0,0,.35)" stroke="#fff" stroke-width="2"/><path d="M26 20 L46 32 L26 44z" fill="#fff"/></svg><span>Play here</span></button></div>
  <div class="cap"><div><b>${t}</b>${sub?`<br><span>${sub}</span>`:''}</div><a href="https://www.youtube.com/watch?v=${id}${q}" target="_blank" rel="noopener">Open on YouTube</a></div>`;
  const blocked=/claude|anthropic/.test(location.hostname)||[...(location.ancestorOrigins||[])].some(o=>/claude\.ai/.test(o))||location.protocol==='file:';
  if(blocked){const b=v.querySelector('.play');const a=document.createElement('a');a.className='play';a.style.position='relative';a.style.textDecoration='none';a.href=`https://www.youtube.com/watch?v=${id}${q}`;a.target='_blank';a.rel='noopener';a.innerHTML=b.innerHTML;a.querySelector('span').textContent=location.protocol==='file:'?'Watch on YouTube (in-page playback works once the book is online)':'Watch on YouTube (this preview cannot play videos inside the page)';b.replaceWith(a);return}
  v.querySelector('.play').onclick=()=>{
    if(!navigator.onLine){v.querySelector('.play span').textContent='You are offline. Connect to watch.';return}
    v.querySelector('.frame').innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${q}" title="${t}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`};
}

/* ---------- widgets ---------- */
const W={};
const data=w=>w._data||JSON.parse(document.getElementById(w.dataset.src).textContent);

W.cascade=function(){
  const N={
   XII:{x:90,y:70,c:'intr',name:'Factor XII',alt:'Hageman factor',d:{Gene:'Chromosome 5 (long arm)',Activation:'Contact with negatively charged / rough surfaces; cleaved into a 52 kDa surface-binding and a 28 kDa active fragment',Action:'Converts prekallikrein to kallikrein; with XI forms the contact activation product; enhances V and VIII activation with traces of thrombin; activates fibrinolysis','Clinical note':'Deficiency prolongs APTT but does not cause bleeding'}},
   XI:{x:170,y:150,c:'intr',name:'Factor XI',alt:'Plasma thromboplastin antecedent',d:{Gene:'Chromosome 4',Synthesis:'Liver',Activation:'Thrombin, XIIa and XIa itself','Half-life':'52 hours',Action:'Activates factor IX',Inactivation:'Protein Z dependent inhibitor'}},
   IX:{x:250,y:230,c:'intr',name:'Factor IX',alt:'Christmas factor (vitamin K dependent)',d:{Gene:'X chromosome',Activation:'TF–VIIa complex or XIa','Half-life':'1 day',Action:'With VIIIa, phospholipid and Ca²⁺ forms the intrinsic tenase, which activates X',Inhibition:'Antithrombin','Clinical note':'Deficiency = haemophilia B'}},
   VIII:{x:130,y:300,c:'cof',name:'Factor VIII',alt:'Antihaemophilic factor',d:{Gene:'X chromosome',Synthesis:'Liver and endothelial cells',Carrier:'Circulates bound to VWF','Half-life':'12 hours',Activation:'Thrombin releases it from VWF and cleaves it',Action:'Cofactor in the intrinsic tenase',Inactivation:'Activated protein C at Arg336 and Arg562','Clinical note':'Deficiency = haemophilia A'}},
   VII:{x:540,y:150,c:'extr',name:'Factor VII',alt:'Proconvertin, stable factor (vitamin K dependent)',d:{Gene:'Chromosome 13',Activation:'Tissue factor','Half-life':'5 hours (shortest of the vitamin K factors)','TF–VIIa actions':'Activates X, IX, XI and more VII',Inhibition:'TFPI','Clinical note':'First factor to fall on warfarin, so the PT/INR rises early'}},
   TF:{x:540,y:240,c:'cof',name:'Tissue factor',alt:'Formerly factor III, thromboplastin (CD142)',d:{Sites:'Adventitial cells, skin, organ surfaces, smooth muscle; on endothelium and monocytes only when stimulated by cytokines',Structure:'Glycoprotein with phospholipid; cell-surface and soluble forms',Action:'Binds and activates VII to form the TF–VIIa complex that starts coagulation in vivo'}},
   X:{x:330,y:400,c:'comm',name:'Factor X',alt:'Stuart–Prower factor (vitamin K dependent)',d:{Gene:'Chromosome 13 (long arm)',Synthesis:'Liver',Activation:'Extrinsic tenase (TF–VIIa) or intrinsic tenase (IXa–VIIIa)','Half-life':'2 days',Action:'With Va, phospholipid and Ca²⁺ forms prothrombinase; can activate V',Inactivation:'Protein Z dependent inhibitor (needs protein Z)'}},
   V:{x:510,y:470,c:'cof',name:'Factor V',alt:'Proaccelerin, labile factor',d:{Gene:'Chromosome 1',Synthesis:'Liver','Half-life':'12–36 hours',Activation:'Thrombin or Xa; can act unactivated at the very start',Action:'Cofactor in prothrombinase',Inactivation:'Activated protein C at Arg306, Arg506, Arg679','Clinical note':'Factor V Leiden (Arg506Gln) resists APC → thrombophilia'}},
   II:{x:330,y:470,c:'comm',name:'Factor II',alt:'Prothrombin → thrombin',d:{Gene:'Chromosome 11',Synthesis:'Liver','Half-life':'3 days',Activation:'Prothrombinase (Xa, Va, phospholipid, Ca²⁺) releasing fragment 1.2',Procoagulant:'Activates fibrinogen, V, VIII, XI, XIII and platelets (PAR, GPIb, GPV)',Anticoagulant:'With thrombomodulin activates protein C; activates TAFI'}},
   I:{x:330,y:540,c:'comm',name:'Factor I',alt:'Fibrinogen → fibrin',d:{Gene:'Chromosome 4','Normal range':'200–400 mg/dL','Half-life':'4 days',Structure:'340 kDa dimer of Aα, Bβ and γ chains; central E and outer D domains',Activation:'Thrombin releases fibrinopeptides A and B → fibrin monomers polymerise',Other:'Acute phase protein; plasma viscosity'}},
   XIII:{x:510,y:540,c:'cof',name:'Factor XIII',alt:'Fibrin stabilising factor',d:{Sites:'Plasma (α2β2 tetramer), platelets and monocytes (α2)',Activation:'Thrombin with Ca²⁺','Half-life':'5–9 days',Action:'Cross-links fibrin by lysine–glutamine bonds; links fibrin to fibronectin','Clinical note':'Deficiency gives delayed bleeding with normal PT and APTT'}},
   CLOT:{x:330,y:610,c:'comm',name:'Stable fibrin clot',alt:'Cross-linked fibrin',d:{Result:'Cross-linked fibrin anchored to platelet GPIIb/IIIa, then retracted',Removal:'Plasmin digests it to D-dimers'}},
  };
  const LBL={CLOT:'Clot',TF:'TF'};
  const E=[['XII','XI'],['XI','IX'],['IX','X'],['VIII','X',1],['VII','X'],['TF','VII',1],['VII','IX',0,'cb'],['X','II'],['V','II',1],['II','I'],['I','CLOT'],['XIII','CLOT'],['II','V',0,'fb'],['II','VIII',0,'fb'],['II','XI',0,'fb'],['II','XIII',0,'fb']];
  const W=74,H=34;
  const svgNS='http://www.w3.org/2000/svg';
  function el(t,a){const e=document.createElementNS(svgNS,t);for(const k in a)e.setAttribute(k,a[k]);return e}
  function edgePath(a,b){const A=N[a],B=N[b];let x1=A.x,y1=A.y,x2=B.x,y2=B.y;
    const dx=x2-x1,dy=y2-y1;const s=Math.min(Math.abs((W/2+4)/(dx||1e-6)),Math.abs((H/2+4)/(dy||1e-6)));
    const sx=x1+dx*s,sy=y1+dy*s,ex=x2-dx*s,ey=y2-dy*s;return `M${sx},${sy} L${ex},${ey}`}
  const eg=$('#edges'),ng=$('#nodes');
  E.forEach(([a,b,cof,kind])=>{
    let d=edgePath(a,b);
    if(kind==='fb'){const A=N[a],B=N[b];const mx=(A.x+B.x)/2+(B.x>A.x?40:-60),my=(A.y+B.y)/2;
      const p=edgePath(a,b).split(/[ML, ]+/).filter(Boolean).map(Number);d=`M${p[0]},${p[1]} Q${mx},${my} ${p[2]},${p[3]}`}
    const pth=el('path',{d,class:'edge'+(kind==='fb'?' fb':''),'marker-end':kind==='fb'?'url(#arr)':'url(#ar)'});
    if(cof)pth.setAttribute('stroke-dasharray','2 4');
    if(kind==='cb')pth.setAttribute('stroke-dasharray','6 4');
    pth.dataset.a=a;pth.dataset.b=b;pth.dataset.kind=kind||'';eg.appendChild(pth)});
  Object.entries(N).forEach(([k,v])=>{
    const g=el('g',{class:'node '+v.c,tabindex:0,role:'button','aria-label':v.name});g.dataset.k=k;
    g.appendChild(el('rect',{x:v.x-W/2,y:v.y-H/2,width:W,height:H,rx:8}));
    const t=el('text',{x:v.x,y:v.y});t.textContent=LBL[k]||k;g.appendChild(t);
    g.onclick=()=>select(k);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(k)}};ng.appendChild(g)});
  /* contact labels */
  const ct=el('text',{x:24,y:112,class:'zone'});ct.textContent='PK · HMWK';ng.appendChild(ct);
  /* inhibitors */
  const INH={VII:'TFPI',X:'AT · TFPI',IX:'AT',II:'AT',V:'APC + S',VIII:'APC + S'};
  Object.entries(INH).forEach(([k,lab])=>{const v=N[k];const t=el('text',{x:v.x+W/2+6,y:v.y-6});t.textContent='⊣ '+lab;$('#inh').appendChild(t)});
  const TEST={XII:'APTT',XI:'APTT',IX:'APTT',VIII:'APTT',VII:'PT',TF:'PT',X:'PT + APTT',V:'PT + APTT',II:'PT + APTT',I:'PT + APTT',XIII:'neither'};
  Object.entries(TEST).forEach(([k,lab])=>{const v=N[k];const t=el('text',{x:v.x+W/2+6,y:v.y+12});t.textContent=lab;
    t.style.fill=lab==='APTT'?'var(--intr)':lab==='PT'?'var(--extr)':lab==='neither'?'var(--ink-2)':'var(--comm)';$('#tests').appendChild(t)});
  const STAGES={
   classic:{t:'Classical model',d:'The in-vitro view behind the PT and APTT. Intrinsic (XII → XI → IX + VIII) and extrinsic (TF–VII) pathways meet at factor X, then the common pathway (X + V → thrombin → fibrin → XIII) builds the clot.',on:null},
   init:{t:'1 · Initiation',d:'On tissue-factor-bearing cells. TF–VIIa activates X and IX. The little Xa made is quickly blocked by TFPI and antithrombin, so only a trace of thrombin forms: not enough to clot fibrinogen.',on:['TF','VII','X','IX','II'],edges:['TF>VII','VII>X','VII>IX','X>II']},
   amp:{t:'2 · Amplification',d:'The trace of thrombin activates platelets and factors V, XI and XIII, and frees VIII from VWF. The platelet surface is now primed.',on:['II','V','VIII','XI','XIII'],edges:['II>V','II>VIII','II>XI','II>XIII']},
   prop:{t:'3 · Propagation',d:'On activated platelets: IXa + VIIIa (tenase) make large amounts of Xa; Xa + Va (prothrombinase) produce the thrombin burst. Fibrin forms and XIIIa cross-links it.',on:['IX','VIII','X','V','II','I','XIII','CLOT','XI'],edges:['XI>IX','IX>X','VIII>X','X>II','V>II','II>I','I>CLOT','XIII>CLOT']}
  };
  let mode='classic';
  function setMode(m){mode=m;
    [['mClassic','classic'],['mInit','init'],['mAmp','amp'],['mProp','prop']].forEach(([id,k])=>$('#'+id).setAttribute('aria-pressed',k===m));
    const s=STAGES[m];
    document.querySelectorAll('.node').forEach(g=>{const k=g.dataset.k;g.classList.toggle('dim',!!s.on&&!s.on.includes(k));g.classList.toggle('hot',!!s.on&&s.on.includes(k))});
    document.querySelectorAll('.edge').forEach(p=>{const key=p.dataset.a+'>'+p.dataset.b;
      if(!s.on){p.classList.toggle('dim',p.dataset.kind==='cb'||p.dataset.kind==='fb');}
      else p.classList.toggle('dim',!s.edges.includes(key))});
    $('#stage').innerHTML=`<b>${s.t}</b><br>${s.d}`}
  $('#mClassic').onclick=()=>setMode('classic');$('#mInit').onclick=()=>setMode('init');$('#mAmp').onclick=()=>setMode('amp');$('#mProp').onclick=()=>setMode('prop');
  $('#tTest').onchange=e=>$('#cSvg').classList.toggle('show-test',e.target.checked);
  $('#tInh').onchange=e=>$('#cSvg').classList.toggle('show-inh',e.target.checked);
  function select(k){const v=N[k];
    document.querySelectorAll('.node').forEach(g=>g.classList.toggle('sel',g.dataset.k===k));
    $('#info').innerHTML=`<div class="eyebrow">${{intr:'Intrinsic pathway',extr:'Extrinsic pathway',comm:'Common pathway',cof:'Cofactor'}[v.c]}</div><h3>${v.name}</h3><div class="note">${v.alt}</div><dl>${Object.entries(v.d).map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`}
  setMode('classic');select('X');
};

/* gallery + lightbox */
W.gallery=function(w){const G=data(w);
  w.innerHTML=G.map((g,i)=>`<button data-i="${i}"><img src="${g.src}" alt="${esc(g.cap.replace(/<[^>]+>/g,''))}" loading="lazy" width="400" height="300"><span>${g.cap}</span></button>`).join('');
  w.onclick=e=>{const b=e.target.closest('button');if(!b)return;const g=G[b.dataset.i];$('#lbImg').src=g.src;$('#lbImg').alt=g.cap.replace(/<[^>]+>/g,'');$('#lbCap').innerHTML=g.cap;$('#lb').hidden=false;$('#lbX').focus()}};
document.addEventListener('click',e=>{const im=e.target.closest('.lec figure img');if(!im)return;$('#lbImg').src=im.getAttribute('src');$('#lbImg').alt=im.alt;const c=im.closest('figure').querySelector('figcaption');$('#lbCap').innerHTML=c?c.innerHTML:'';$('#lb').hidden=false;$('#lbX').focus()});
$('#lbX').onclick=()=>$('#lb').hidden=true;$('#lb').onclick=e=>{if(e.target.id==='lb')$('#lb').hidden=true};
addEventListener('keydown',e=>{if(e.key==='Escape')$('#lb').hidden=true});

/* warfarin */
W.warfarin=function(w){
  const HL=[['Factor VII',5],['Protein C',6,'pc'],['Factor IX',24],['Factor X',48],['Prothrombin (II)',72]];
  const hrs=w.querySelector('#hrs');
  function calc(){const h=+hrs.value;w.querySelector('#hrsOut').textContent=h<48?h+' h':h+' h ('+(h/24).toFixed(1)+' days)';
    const vals=HL.map(([n,t,c])=>[n,100*Math.pow(.5,h/t),c]);
    w.querySelector('#bars').innerHTML=vals.map(([n,v,c])=>`<div class="brow ${c||''}"><span>${n}</span><div class="t"><div class="f" style="width:${v.toFixed(1)}%"></div></div><span class="v">${v<1?'<1':v.toFixed(0)}%</span></div>`).join('');
    const II=vals[4][1],VII=vals[0][1],PC=vals[1][1];let msg;
    if(h===0)msg='Start of treatment: all factors at their baseline.';
    else if(II>50)msg=`<b>Not yet protected.</b> Factor VII (${VII.toFixed(0)}%) has fallen, so the INR is already rising, but prothrombin is still ${II.toFixed(0)}%. Protein C (${PC.toFixed(0)}%) has fallen too, which can briefly make the patient <b>more</b> prone to clotting. This is why heparin is overlapped.`;
    else if(II>25)msg=`<b>Partly anticoagulated.</b> Prothrombin is ${II.toFixed(0)}%. Keep the heparin overlap going until the INR has been in range for at least 24 hours.`;
    else msg=`<b>Full warfarin effect.</b> Prothrombin is down to ${II.toFixed(0)}%, so all four vitamin K dependent factors are low. Heparin can usually stop once the INR is in range for 24 hours.`;
    w.querySelector('#verdict').innerHTML=msg}
  hrs.oninput=calc;calc()};

/* MCQ engine */
function mcq(box,items,onAnswer,saved){
  box.innerHTML='';items.forEach((q,i)=>{
    const d=document.createElement('div');d.className='step';
    d.innerHTML=`${q.stage?`<div class="eyebrow">${q.stage}</div>`:`<div class="qn">Question ${i+1} of ${items.length}</div>`}${q.scene?`<p>${q.scene}</p>`:''}<p><b>${q.q}</b></p><div class="opts">${q.o.map((o,j)=>`<button class="opt" data-j="${j}">${o}</button>`).join('')}</div><div class="expl" hidden></div>`;
    const answer=(j)=>{d.querySelectorAll('.opt').forEach((b,k)=>{b.disabled=true;if(k===q.a)b.classList.add('right');else if(k===j)b.classList.add('wrong')});
      const ex=d.querySelector('.expl');ex.innerHTML=(j===q.a?'<b>Correct.</b> ':'<b>Not quite.</b> ')+q.e;ex.hidden=false;onAnswer&&onAnswer(i,j)};
    d.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(+b.dataset.j));
    if(saved&&saved[i]!=null)answer(saved[i]);
    box.appendChild(d)})}
W.case=function(w){const CASE=data(w);const ans=[];
  function render(upTo){mcq(w,CASE.slice(0,upTo),(i,j)=>{ans[i]=j;if(i===upTo-1&&upTo<CASE.length)setTimeout(()=>render(upTo+1),300)},ans.slice())}
  render(1)};
W.quiz=function(w){const Q=data(w),key=w.dataset.key;let qs=[];try{qs=JSON.parse(store.get(key)||'[]')}catch(e){qs=[]}
  const bar=document.createElement('div');bar.className='score';bar.innerHTML='<span class="qn"></span><button class="btn">Start again</button>';w.before(bar);
  const sc=()=>{const done=qs.filter(x=>x!=null).length,right=qs.filter((x,i)=>x===Q[i].a).length;bar.firstChild.textContent=done?`Score ${right} / ${done} answered (of ${Q.length})`:`${Q.length} questions`};
  const render=()=>{mcq(w,Q,(i,j)=>{qs[i]=j;store.set(key,JSON.stringify(qs));sc()},qs.slice());sc()};
  bar.lastChild.onclick=()=>{qs=[];store.set(key,'[]');render()};render()};

/* ---------- Chapter 29: first-line screen interpreter ---------- */
W.screen=function(w){
  const T=[ // PT, APTT, TT, Fib, Plt  (N, H=prolonged/high, L=low, '*'=either)
   {p:['N','N','N','N','N'],c:['Normal haemostasis','Platelet dysfunction','Vascular causes','Factor XIII deficiency','Mild factor deficiency','Mild von Willebrand disease','Disorders of fibrinolysis'],n:'First-line tests do not detect platelet function, vessel, FXIII or fibrinolytic defects. If the bleeding history is convincing, go to second-line tests.'},
   {p:['H','N','N','N','N'],c:['Factor VII deficiency','Early oral anticoagulant therapy','Lupus anticoagulant (some reagents)','Mild deficiency of II, V or X'],n:'Isolated PT prolongation points to factor VII, the factor with the shortest half-life.'},
   {p:['N','H','N','N','N'],c:['Deficiency of VIII, IX, XI, XII, prekallikrein or HMWK','Von Willebrand disease (low VIII)','Lupus anticoagulant','Mild deficiency of II, V or X'],n:'Do a mixing study next. XII, prekallikrein and HMWK deficiency prolong the APTT without bleeding.'},
   {p:['H','H','N','N','N'],c:['Vitamin K deficiency or malabsorption','Oral anticoagulant therapy','Deficiency of V, X or II','Multiple factor deficiency (liver disease)','Combined V + VIII deficiency'],n:'Both pathways meet at the common pathway, or several factors are low.'},
   {p:['*','H','H','N','N'],c:['Heparin (large dose)'],n:'TT is very sensitive to heparin. Confirm with a reptilase time (normal with heparin) or protamine correction.'},
   {p:['H','H','H','L','N'],c:['Liver disease','Fibrinogen deficiency or dysfibrinogenaemia','Hyperfibrinolysis'],n:'Low or abnormal fibrinogen prolongs every clotting-based test.'},
   {p:['H','H','H','L','L'],c:['Disseminated intravascular coagulation','Massive transfusion','Acute liver disease'],n:'Consumption of factors and platelets. Check D-dimer and the blood film for schistocytes.'},
   {p:['N','N','N','N','L'],c:['Thrombocytopenia'],n:'Check the film first to exclude pseudothrombocytopenia (EDTA clumping).'}
  ];
  const F=[['PT','H'],['APTT','H'],['TT','H'],['Fibrinogen','L'],['Platelets','L']];
  const st=['N','N','N','N','N'];
  w.innerHTML=`<div class="scr-in">${F.map(([n,ab],i)=>`<div class="scr-f"><span>${n}</span><div class="seg" role="group" aria-label="${n}"><button data-i="${i}" data-v="N" aria-pressed="true">Normal</button><button data-i="${i}" data-v="${ab}" aria-pressed="false">${ab==='H'?(i<3?'Prolonged':'High'):'Low'}</button></div></div>`).join('')}</div><div class="scr-out" aria-live="polite"></div>`;
  function out(){const hits=T.filter(r=>r.p.every((v,i)=>v==='*'||v===st[i]));
    w.querySelector('.scr-out').innerHTML=hits.length?hits.map(h=>`<div class="verdict"><b>Consider:</b><ul>${h.c.map(x=>`<li>${x}</li>`).join('')}</ul><div class="note">${h.n}</div></div>`).join(''):
      `<div class="verdict"><b>This pattern is not in the first-line table.</b><div class="note">Think of combined disorders (for example DIC on heparin) and move to second-line tests: mixing studies, factor assays, D-dimer.</div></div>`}
  w.addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(!b)return;st[+b.dataset.i]=b.dataset.v;
    b.parentNode.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));out()});
  out()};

/* ---------- Chapter 29: mixing study (APTT algorithm from her notes) ---------- */
W.mixing=function(w){
  const ADS=['XII','XI','VIII','V','I'];           // Al(OH)3-adsorbed plasma contains
  const AGED=['VII','XII','XI','IX','X','II','I'];  // aged plasma contains
  const PTF=['VII','X','V','II','I'];               // PT-sensitive
  const OPTS=['VIII','IX','XI','XII','X','V','II','I','inhibitor','tdi'];
  const LBL={inhibitor:'Immediate inhibitor (e.g. lupus anticoagulant)',tdi:'Time-dependent inhibitor (e.g. acquired anti-VIII)'};
  let hidden=null,mode='explore';
  w.innerHTML=`<div class="tools"><div class="seg" role="group" aria-label="Mode"><button data-m="explore" aria-pressed="true">Explore</button><button data-m="mystery" aria-pressed="false">Mystery patient</button></div>
   <label class="chk mx-pick">Patient has <select id="mxSel">${OPTS.map(o=>`<option value="${o}">${LBL[o]||'Factor '+o+' deficiency'}</option>`).join('')}</select></label>
   <button class="btn mx-new" hidden>New mystery patient</button></div>
   <ol class="mx-steps"></ol><div class="mx-guess" hidden></div>`;
  const sel=w.querySelector('#mxSel');
  function steps(d){const s=[];const isF=!LBL[d];
    s.push(['APTT','Prolonged']);
    if(d==='inhibitor'){s.push(['Mix 1:1 with normal plasma','<b>Not corrected</b>']);s.push(['Conclusion','An inhibitor is present. Confirm lupus anticoagulant with phospholipid-dependent tests.']);return s}
    s.push(['Mix 1:1 with normal plasma','<b>Corrected</b>']);
    if(d==='tdi'){s.push(['Repeat after 2 hours at 37 °C','<b>Not corrected</b>']);s.push(['Conclusion','Time-dependent inhibitor, typically an acquired factor VIII antibody. Measure it in Bethesda units.']);return s}
    s.push(['Repeat after 2 hours at 37 °C','<b>Still corrected</b>: a factor deficiency']);
    const a=ADS.includes(d);s.push(['Mix with Al(OH)₃-adsorbed plasma (has XII, XI, VIII, V, I)',a?'<b>Corrected</b>':'<b>Not corrected</b>: the missing factor is IX, X or II']);
    if(!a){const pt=PTF.includes(d);s.push(['Prothrombin time',pt?'<b>Prolonged</b>':'<b>Normal</b>']);s.push(['Conclusion',pt?`Deficiency of factor X or II (here factor ${d}). Confirm with a specific factor assay.`:'Deficiency of factor IX (haemophilia B).']);return s}
    const g=AGED.includes(d);s.push(['Mix with aged plasma (has VII, XII, XI, IX, X, II, I)',g?'<b>Corrected</b>: the missing factor is XII, XI or I':'<b>Not corrected</b>: the missing factor is VIII or V']);
    const pt=PTF.includes(d);s.push(['Prothrombin time',pt?'<b>Prolonged</b>':'<b>Normal</b>']);
    s.push(['Conclusion',g?(pt?'Deficiency of fibrinogen (factor I).':`Deficiency of factor ${d==='XII'?'XII':'XI'} (XII or XI; a specific assay separates them). XII deficiency does not bleed; XI deficiency does.`):(pt?'Deficiency of factor V.':'Deficiency of factor VIII (haemophilia A, or check VWD).')]);
    return s}
  function render(){const d=mode==='explore'?sel.value:hidden;const s=steps(d);
    const show=mode==='explore'?s:s.filter(x=>x[0]!=='Conclusion');
    w.querySelector('.mx-steps').innerHTML=show.map(([a,b])=>`<li><span>${a}</span><span>${b}</span></li>`).join('');
    const g=w.querySelector('.mx-guess');g.hidden=mode!=='mystery';
    if(mode==='mystery')g.innerHTML=`<p><b>Your diagnosis?</b></p><div class="opts">${OPTS.map(o=>`<button class="opt" data-g="${o}">${LBL[o]||'Factor '+o+' deficiency'}</button>`).join('')}</div><div class="expl" hidden></div>`}
  w.addEventListener('click',e=>{const m=e.target.closest('[data-m]');if(m){mode=m.dataset.m;w.querySelectorAll('[data-m]').forEach(x=>x.setAttribute('aria-pressed',x===m));
      w.querySelector('.mx-pick').hidden=mode!=='explore';w.querySelector('.mx-new').hidden=mode==='explore';if(mode==='mystery')hidden=OPTS[Math.floor(Math.random()*OPTS.length)];render();return}
    if(e.target.closest('.mx-new')){hidden=OPTS[Math.floor(Math.random()*OPTS.length)];render();return}
    const gb=e.target.closest('[data-g]');if(gb){const ok=gb.dataset.g===hidden||(['X','II'].includes(hidden)&&['X','II'].includes(gb.dataset.g)&&false);
      w.querySelectorAll('[data-g]').forEach(b=>{b.disabled=true;if(b.dataset.g===hidden)b.classList.add('right');else if(b===gb)b.classList.add('wrong')});
      const ex=w.querySelector('.mx-guess .expl');ex.hidden=false;ex.innerHTML=(gb.dataset.g===hidden?'<b>Correct.</b> ':'<b>Not quite.</b> ')+steps(hidden).pop()[1]+(['X','II','XI','XII'].includes(hidden)?' (The mixing steps alone cannot separate this pair; the specific factor assay does.)':'')}});
  sel.onchange=render;render()};

/* ---------- Chapter 29: INR calculator ---------- */
W.inr=function(w){
  const f=w.querySelectorAll('input');
  function calc(){const pt=+w.querySelector('#iPt').value,mn=+w.querySelector('#iMn').value,isi=+w.querySelector('#iIsi').value;
    if(!(pt>0&&mn>0&&isi>0)){w.querySelector('#iOut').textContent='–';return}
    const r=pt/mn,inr=Math.pow(r,isi);
    w.querySelector('#iRatio').textContent=r.toFixed(2);w.querySelector('#iOut').textContent=inr.toFixed(1);
    let m;if(inr<1.3)m='Within the usual non-anticoagulated range.';else if(inr<2)m='Mildly raised: early warfarin, vitamin K deficiency, liver disease, or factor VII deficiency.';
    else if(inr<=3)m='Target range for most warfarin indications (2.0–3.0).';else if(inr<=3.5)m='Upper target for mechanical mitral valves (2.5–3.5).';else m='Above target ranges: bleeding risk rises steeply. Review the dose and the bleeding.';
    w.querySelector('#iMsg').textContent=m}
  f.forEach(i=>i.oninput=calc);calc()};

/* ---------- Chapter 29: platelet aggregation patterns ---------- */
W.aggregation=function(w){
  const AG=['ADP (low dose)','Arachidonic acid','Collagen','Ristocetin'];
  const D={
   'Normal':['Biphasic, normal','Normal','Normal','Normal'],
   'Glanzmann thrombasthenia (GPIIb/IIIa defect)':['Absent','Absent','Absent','Normal'],
   'Bernard–Soulier syndrome (GPIb defect)':['Normal','Normal','Normal','Absent'],
   'Von Willebrand disease':['Normal','Normal','Normal','Reduced or absent'],
   'Pseudo-VWD (platelet-type, ↑ GPIb affinity)':['Normal','Normal','Normal','Increased at low dose'],
   'Storage pool disease (dense granules)':['Primary wave only','Normal or reduced','Reduced','Normal'],
   'Cyclo-oxygenase defect or aspirin':['Primary wave only','Absent','Reduced','Normal'],
   'Thromboxane synthase defect':['Primary wave only','Absent','Reduced','Normal'],
   'Thromboxane A₂ receptor defect':['Primary wave only','Absent','Reduced','Normal'],
   'ADP (P2Y12) receptor defect or clopidogrel':['Reduced or absent','Reduced','Reduced','Normal']
  };
  const cls=v=>/Absent/.test(v)?'ab':/Reduced|Primary/.test(v)?'rd':/Increased/.test(v)?'up':'ok';
  w.innerHTML=`<label class="chk">Disorder <select>${Object.keys(D).map(k=>`<option>${k}</option>`).join('')}</select></label><div class="agg"></div>`;
  const s=w.querySelector('select');
  function r(){const v=D[s.value];w.querySelector('.agg').innerHTML=AG.map((a,i)=>`<div class="agc ${cls(v[i])}"><span class="eyebrow">${a}</span><b>${v[i]}</b><svg viewBox="0 0 120 50" aria-hidden="true"><path d="${curve(v[i])}" /></svg></div>`).join('')}
  function curve(v){if(/Absent/.test(v))return 'M0,8 L120,9';if(/Primary/.test(v))return 'M0,8 C20,8 25,22 40,24 C55,26 70,16 120,12';
    if(/Reduced/.test(v))return 'M0,8 L15,8 C35,10 50,24 120,26';if(/Increased/.test(v))return 'M0,8 L8,8 C18,30 30,44 120,46';
    if(/Biphasic/.test(v))return 'M0,8 L12,8 C22,20 28,22 36,22 C46,22 52,40 120,44';return 'M0,8 L15,8 C30,30 45,42 120,44'}
  s.onchange=r;r()};

/* ---------- Chapter 30: 4Ts score for HIT ---------- */
W.hit4t=function(w){
  const Q=[
   ['Thrombocytopenia',['Fall &lt;30%, or nadir &lt;10 × 10⁹/L','Fall 30–50%, or nadir 10–19','Fall &gt;50% and nadir ≥20']],
   ['Timing of the fall',['Fall ≤4 days with no recent heparin','Probably day 5–10 but unclear, after day 10, or ≤1 day with heparin 30–100 days ago','Clear onset day 5–10, or ≤1 day with heparin in the past 30 days']],
   ['Thrombosis or other sequelae',['None','Progressive or recurrent thrombosis, red skin lesions, suspected thrombosis','New confirmed thrombosis, skin necrosis, or acute systemic reaction to a heparin bolus']],
   ['Other cause for thrombocytopenia',['Definite other cause','Possible other cause','None apparent']]];
  const v=[0,0,0,0];
  w.innerHTML=Q.map(([t,o],i)=>`<fieldset class="t4"><legend>${t}</legend>${o.map((x,j)=>`<label><input type="radio" name="t4-${i}" value="${j}"${j===0?' checked':''}> <span class="pt">${j}</span> ${x}</label>`).join('')}</fieldset>`).join('')+`<div class="t4-res"><div><div class="eyebrow">4Ts score</div><div class="big" id="t4s">0</div></div><p class="verdict" id="t4m"></p></div>`;
  function out(){const s=v.reduce((a,b)=>a+b,0);w.querySelector('#t4s').textContent=s;
    w.querySelector('#t4m').innerHTML=s<=3?'<b>Low probability (0–3).</b> HIT is unlikely; testing is usually not needed.':s<=5?'<b>Intermediate probability (4–5).</b> Stop heparin, start a non-heparin anticoagulant and test for anti-PF4/heparin antibodies.':'<b>High probability (6–8).</b> Stop all heparin now, start a non-heparin anticoagulant and confirm with antibody and functional tests.'}
  w.addEventListener('change',e=>{const m=/t4-(\d)/.exec(e.target.name);if(m){v[+m[1]]=+e.target.value;out()}});out()};

/* ---------- Chapter 30: ITP response ---------- */
W.itpresp=function(w){
  function out(){const b=+w.querySelector('#irB').value,c=+w.querySelector('#irC').value,bl=w.querySelector('#irBl').checked;let r;
    if(!(b>0&&c>=0)){r='Enter both counts.'}
    else if(c>100&&!bl)r='<b>Complete response (CR):</b> count above 100 × 10⁹/L with no bleeding.';
    else if(c>=30&&c>=2*b&&!bl)r='<b>Response (R):</b> count at least 30 × 10⁹/L and at least double the baseline, with no bleeding.';
    else r='<b>No response (NR):</b> count below 30 × 10⁹/L, less than double the baseline, or bleeding.';
    w.querySelector('#irOut').innerHTML=r+' <span class="note">Confirm on two counts at least 7 days apart.</span>'}
  w.querySelectorAll('input').forEach(i=>i.oninput=out);w.querySelector('#irBl').onchange=out;out()};

/* ---------- Chapter 31: ISTH overt DIC score ---------- */
W.dic=function(w){
  const Q=[['Platelet count',[['> 100 × 10⁹/L',0],['50–100 × 10⁹/L',1],['< 50 × 10⁹/L',2]]],
   ['Fibrin markers (D-dimer, FDPs)',[['No increase',0],['Moderate increase',2],['Strong increase',3]]],
   ['PT prolongation over control',[['< 3 s',0],['3–6 s',1],['> 6 s',2]]],
   ['Fibrinogen',[['> 1 g/L',0],['< 1 g/L',1]]]];
  const v=[0,0,0,0];
  w.innerHTML=`<label class="chk dic-q"><input type="checkbox" id="dicCause" checked> The patient has an underlying disorder known to cause DIC</label>`+
   Q.map(([t,o],i)=>`<fieldset class="t4"><legend>${t}</legend>${o.map(([x,s],j)=>`<label><input type="radio" name="dic-${i}" value="${s}"${j===0?' checked':''}> <span class="pt">${s}</span> ${x}</label>`).join('')}</fieldset>`).join('')+
   `<div class="t4-res"><div><div class="eyebrow">Score</div><div class="big" id="dicS">0</div></div><p class="verdict" id="dicM"></p></div>`;
  function out(){const s=v.reduce((a,b)=>a+b,0);w.querySelector('#dicS').textContent=s;
    w.querySelector('#dicM').innerHTML=!w.querySelector('#dicCause').checked?'<b>Do not use the score.</b> It only applies when there is an underlying cause of DIC.':s>=5?'<b>Compatible with overt DIC (≥5).</b> Treat the cause; support with FFP, cryoprecipitate and platelets only for bleeding. Repeat daily.':'<b>Suggestive of non-overt DIC (&lt;5).</b> Repeat the score every 1–2 days.'}
  w.addEventListener('change',e=>{const m=/dic-(\d)/.exec(e.target.name);if(m)v[+m[1]]=+e.target.value;out()});out()};

/* ---------- Chapter 31: haemophilia severity + Bethesda ---------- */
W.haemo=function(w){
  const r=w.querySelector('#hfLvl');
  function out(){const x=+r.value;w.querySelector('#hfOut').textContent=x+'%';let s;
    if(x<2)s='<b>Severe (&lt;2%)</b>: spontaneous haemarthroses, joint deformity; muscle bleeds; risk of intracranial haemorrhage.';
    else if(x<10)s='<b>Moderate (2–10%)</b>: bleeding after trauma and occasional spontaneous bleeds.';
    else if(x<=20)s='<b>Mild (10–20%)</b>: minor bleeding after trauma or surgery.';
    else s='<b>Over 20%</b>: usually no symptoms. Carriers often fall in this range.';
    w.querySelector('#hfMsg').innerHTML=s}
  r.oninput=out;out()};
W.bethesda=function(w){
  function out(){const R=+w.querySelector('#bR').value,d=+w.querySelector('#bD').value;let m;
    if(!(R>0&&d>0)){w.querySelector('#bOut').textContent='–';return}
    const bu=d*Math.log(100/R)/Math.log(2);w.querySelector('#bOut').textContent=R>=100?'0':bu.toFixed(1);
    if(R>=80)m='Residual activity 80–100%: no inhibitor.';else if(R>=60)m='Residual activity 60–80%: borderline.';else m='Inhibitor present.';
    if(R<25||R>75)m+=' For an accurate titre, test another dilution so the residual activity falls between 25% and 75%.';
    if(R<80)m+=bu<5?' Low titre (&lt;5 BU): higher doses of factor VIII may overcome it.':' High titre (&gt;5 BU): use bypassing agents (rFVIIa, aPCC) or porcine FVIII, plus immunosuppression.';
    w.querySelector('#bMsg').innerHTML=m}
  w.querySelectorAll('input').forEach(i=>i.oninput=out);out()};

/* ---------- Chapter 32: VWD type explorer ---------- */
W.vwd=function(w){
  const P=['VWF:Ag','VWF activity','Activity : Ag ratio','FVIII:C','RIPA (low-dose ristocetin)','Multimers','Platelets'];
  const T={
   'Type 1 (partial quantitative, ~75%)':['Low','Low','≥ 0.7','Normal or low','Normal or reduced','All present, reduced','Normal','Autosomal dominant. Usually mild mucocutaneous bleeding. Responds to desmopressin.'],
   'Type 2A (loss of large multimers)':['Low or normal','Very low','< 0.7','Normal or low','Reduced','Loss of high and intermediate','Normal','Increased ADAMTS13 cleavage or defective assembly.'],
   'Type 2B (gain of function to GPIb)':['Low or normal','Low','< 0.7','Normal or low','<b>Increased</b>','Loss of high','<b>Low</b>','Large multimers bind platelets spontaneously and are cleared. Desmopressin can worsen thrombocytopenia.'],
   'Type 2M (defective GPIb binding)':['Low or normal','Low','< 0.7','Normal or low','Reduced','Normal','Normal','Multimers look normal; the A1 domain does not bind GPIb.'],
   'Type 2N (defective FVIII binding)':['Normal','Normal','≥ 0.7','<b>Low</b>','Normal','Normal','Normal','Looks like mild haemophilia A but autosomal (recessive). Confirm with a VWF:FVIII binding assay.'],
   'Type 3 (virtually absent)':['<b>Absent</b>','<b>Absent</b>','–','<b>Very low (1–10%)</b>','Absent','Absent','Normal','Autosomal recessive. Severe bleeding including haemarthroses. Needs VWF-containing concentrate.'],
   'Platelet-type (pseudo) VWD':['Low or normal','Low','< 0.7','Normal or low','<b>Increased</b>','Loss of high','<b>Low</b>','GPIb gain-of-function on the platelet. Patient platelets + cryoprecipitate aggregate; treat with platelets.']
  };
  w.innerHTML=`<label class="chk">Type <select>${Object.keys(T).map(k=>`<option>${k}</option>`).join('')}</select></label><div class="agg vwdg"></div><p class="verdict vwdn"></p>`;
  const s=w.querySelector('select');
  function r(){const v=T[s.value];w.querySelector('.vwdg').innerHTML=P.map((p,i)=>{const t=v[i];const c=/Absent|Very low|Increased|<b>Low/.test(t)?'ab':/Low|Reduced|Loss|< 0.7/.test(t)?'rd':'ok';return `<div class="agc ${c}"><span class="eyebrow">${p}</span><b>${t}</b></div>`}).join('');w.querySelector('.vwdn').innerHTML=v[7]}
  s.onchange=r;r()};

/* ---------- Chapter 33: lupus anticoagulant ---------- */
W.la=function(w){
  function out(){const sp=+w.querySelector('#laSP').value,sn=+w.querySelector('#laSN').value,cp=+w.querySelector('#laCP').value,cn=+w.querySelector('#laCN').value;
    if(!(sp>0&&sn>0&&cp>0&&cn>0)){w.querySelector('#laOut').innerHTML='Enter all four times.';return}
    const S=sp/sn,C=cp/cn,ratio=S/C,corr=(S-C)/S*100;
    w.querySelector('#laS').textContent=S.toFixed(2);w.querySelector('#laC').textContent=C.toFixed(2);w.querySelector('#laR').textContent=ratio.toFixed(2);w.querySelector('#laP').textContent=corr.toFixed(0)+'%';
    const pos=ratio>1.2||corr>10;
    w.querySelector('#laOut').innerHTML=S<=1.2?'<b>Screen not prolonged.</b> Lupus anticoagulant not detected by this test. Use a second test based on a different principle (DRVVT and a sensitive APTT).':
      pos?'<b>Lupus anticoagulant detected.</b> Screen prolonged and corrected by excess phospholipid. Repeat after 12 weeks to show persistence.':'<b>Screen prolonged but not phospholipid-dependent.</b> Consider factor deficiency or a specific inhibitor; check the mixing study.'}
  w.querySelectorAll('input').forEach(i=>i.oninput=out);out()};

/* ---------- Chapter 34: warfarin overdose ---------- */
W.vka=function(w){
  function out(){const inr=+w.querySelector('#vI').value,bl=w.querySelector('#vB').value;let m;
    if(!(inr>0)){m='Enter the INR.'}
    else if(bl==='major')m='<b>Serious bleeding:</b> stop warfarin; give <b>intravenous vitamin K 5–10 mg</b> and <b>prothrombin complex concentrate</b> (or FFP if PCC is not available). Recheck soon after.';
    else if(inr<2)m='<b>Below the usual target (2–3).</b> Check adherence, diet and interacting drugs; adjust the dose.';
    else if(inr<=3.5)m='<b>In or near the target range.</b> Continue the current dose.';
    else if(inr<6)m='<b>INR below 6, no serious bleeding:</b> reduce the dose or omit one or more doses; recheck in 3–7 days.';
    else if(inr<=10)m='<b>INR 6–10:</b> omit one to three doses, reduce the dose, give <b>oral vitamin K 1–2 mg</b>; recheck in 24–48 hours.';
    else m='<b>INR above 10:</b> withhold warfarin until the INR is back in range; <b>oral vitamin K 1–2 mg</b> (some guidelines use more); recheck in 24 hours.';
    if(bl==='minor'&&inr>3.5)m+=' With minor bleeding, lean towards giving vitamin K.';
    w.querySelector('#vOut').innerHTML=m}
  w.querySelectorAll('input,select').forEach(i=>i.oninput=i.onchange=out);out()};

/* ---------- Chapter 1: indices and classification ---------- */
W.rbcidx=function(w){const g=id=>+w.querySelector('#'+id).value,set=(id,t)=>w.querySelector('#'+id).textContent=t;
  function out(){const hb=g('rHb'),hct=g('rHct'),rbc=g('rRbc'),ret=g('rRet');
    if(!(hb>0&&hct>0&&rbc>0)){w.querySelector('#rOut').innerHTML='Enter Hb, PCV and RBC count.';return}
    const mcv=hct*10/rbc,mch=hb*10/rbc,mchc=hb/hct*100,men=mcv/rbc;
    set('rMcv',mcv.toFixed(0));set('rMch',mch.toFixed(1));set('rMchc',mchc.toFixed(1));set('rMen',men.toFixed(1));
    const m=[];
    m.push(mcv<78?'<b>Microcytic</b>':mcv>96?'<b>Macrocytic</b>':'<b>Normocytic</b>');
    m[0]+=mch<27?' and hypochromic.':' with normal haemoglobin content.';
    if(mcv<78)m.push(men<13?'Mentzer index below 13 favours <b>thalassaemia trait</b>.':'Mentzer index above 13 favours <b>iron deficiency</b>.');
    if(ret>=0&&w.querySelector('#rRet').value!==''){const cr=ret*hct/45,mf=hct>=40?1:hct>=30?1.5:hct>=20?2:2.5,rpi=cr/mf;set('rRpi',rpi.toFixed(1));
      m.push(`Corrected reticulocytes ${cr.toFixed(2)}% (maturation factor ${mf}). `+(hct>=40?'No anaemia by haematocrit.':rpi>=2?'RPI ≥ 2: <b>adequate marrow response</b>, think blood loss or haemolysis.':'RPI below 2: <b>hypoproliferative</b>, the marrow is not keeping up.'))}
    else set('rRpi','–');
    w.querySelector('#rOut').innerHTML=m.join(' ')}
  w.querySelectorAll('input').forEach(i=>i.oninput=out);out()};
W.anflow=function(w){
  const R={
   'low|any':['Microcytic hypochromic',['Iron deficiency','Thalassaemia','Anaemia of chronic disorders','Sideroblastic anaemia','HbC, HbE and some unstable haemoglobins','Congenital atransferrinaemia','PNH (iron loss in urine)'],'Ferritin and iron studies first; Mentzer index; Hb electrophoresis or HPLC if iron is normal; Perls stain of marrow for ring sideroblasts.'],
   'normal|high':['Normocytic with a good response',['Acute blood loss','Haemolysis or haemolytic crisis','Hypersplenism'],'Look for bleeding; haemolysis screen: bilirubin, LDH, haptoglobin, film, DAT.'],
   'normal|low':['Normocytic, hypoproliferative',['Anaemia of chronic disorders','Chronic renal failure and endocrine disease','Aplastic anaemia','Marrow infiltration','Myelodysplasia','Congenital dyserythropoietic anaemia','Early iron deficiency'],'Renal and liver function, ferritin and CRP, film for leucoerythroblastic change; marrow if other lines are affected.'],
   'high|high':['Macrocytic with reticulocytosis',['Haemolysis (reticulocytes are large)','Recovery from bleeding or on haematinics'],'Haemolysis screen; the MCV falls as the reticulocytes settle.'],
   'high|low':['Macrocytic, low reticulocytes',['Vitamin B12 or folate deficiency (often pancytopenia)','Alcohol and liver disease','Hypothyroidism','Myelodysplasia, aplastic anaemia, myeloma','Pregnancy, chronic respiratory failure, after splenectomy'],'Film for oval macrocytes and hypersegmented neutrophils; B12 and folate; TSH and liver tests; marrow if cytopenias are unexplained.']};
  const st={mcv:'low',ret:'low'};
  w.innerHTML=`<div class="chips" role="group" aria-label="MCV"><span class="eyebrow" style="align-self:center">MCV</span>${[['low','Low (<78 fL)'],['normal','Normal'],['high','High (>96 fL)']].map(([k,l])=>`<button class="chip" data-g="mcv" data-k="${k}">${l}</button>`).join('')}</div>
   <div class="chips anret" role="group" aria-label="Reticulocytes"><span class="eyebrow" style="align-self:center">Reticulocyte response</span>${[['high','Raised (RPI ≥ 2)'],['low','Low or normal']].map(([k,l])=>`<button class="chip" data-g="ret" data-k="${k}">${l}</button>`).join('')}</div>
   <div class="scr-out anout" aria-live="polite"></div>`;
  function r(){w.querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-pressed',st[b.dataset.g]===b.dataset.k));
    w.querySelector('.anret').hidden=st.mcv==='low';
    const v=R[st.mcv==='low'?'low|any':st.mcv+'|'+st.ret];
    w.querySelector('.anout').innerHTML=`<h3>${v[0]}</h3><ul>${v[1].map(x=>`<li>${x}</li>`).join('')}</ul><p><b>Next tests:</b> ${v[2]}</p>`}
  w.addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;st[b.dataset.g]=b.dataset.k;r()});r()};

/* ---------- Chapter 2: iron studies ---------- */
W.ironstudies=function(w){const q=id=>w.querySelector('#'+id);
  function out(){const fe=+q('fFe').value,tibc=+q('fTibc').value,fer=+q('fFer').value,inf=q('fInf').checked,m=q('fSex').value==='m';
    if(!(fe>0&&tibc>0&&fer>=0)||q('fFer').value===''){q('fOut').innerHTML='Enter serum iron, TIBC and ferritin.';return}
    const sat=fe/tibc*100;q('fSat').textContent=sat.toFixed(0)+'%';
    const hi=m?55:50;let p,t;
    if(sat>hi&&fer>(m?300:200)){p='Iron overload';t=`Saturation above ${hi}% with a high ferritin. Think of <b>hereditary haemochromatosis</b> (HFE genotyping), ineffective erythropoiesis or transfusion. Look for organ damage.`}
    else if(sat>hi){p='High saturation';t=`Saturation above ${hi}% is the earliest sign of overload, even before ferritin rises. Repeat fasting and consider HFE genotyping.`}
    else if(fer<15){p='Iron deficiency';t='Ferritin below 15 µg/L means stores are empty. '+(tibc>400?'The high TIBC fits. ':'')+'Find the cause (blood loss first) and treat with iron.'}
    else if(sat<15&&inf&&fer<100){p='Possible mixed';t='Low saturation with inflammation and a ferritin under 100 µg/L: iron deficiency may be hidden by the acute phase. A soluble transferrin receptor (or sTfR ÷ log ferritin) helps.'}
    else if(sat<15&&(inf||tibc<250)){p='Chronic disorders';t='Low iron and saturation with '+(tibc<250?'a low TIBC':'inflammation')+' and normal or high ferritin: <b>anaemia of chronic disorders</b>. Iron is trapped in macrophages by hepcidin.'}
    else if(sat<15){p='Low supply';t='Low saturation with ferritin '+fer+' µg/L. Iron supply to the marrow is short; check CRP and the soluble transferrin receptor to separate early iron deficiency from chronic disorders.'}
    else {p='Normal iron';t='The iron profile is normal. If the red cells are microcytic, check the Mentzer index and Hb electrophoresis or HPLC for thalassaemia trait.'}
    q('fPat').textContent=p;q('fOut').innerHTML=t}
  w.querySelectorAll('input,select').forEach(i=>i.oninput=i.onchange=out);out()};

/* ---------- Chapter 3: Schilling test ---------- */
W.schilling=function(w){
  const D={'Normal absorption':[1],'Dietary deficiency (vegan)':[1],'Pernicious anaemia':[0,1],'Blind loop syndrome':[0,0,1],'Ileal disease or resection':[0,0,0]};
  const ST=['Stage 1: radioactive B12 alone','Stage 2: with oral intrinsic factor','Stage 3: after a week of oral antibiotics'];
  const END={'Normal absorption':'Absorption is normal. A low B12 with normal absorption points to <b>poor intake</b>.','Dietary deficiency (vegan)':'Absorption is normal. A low B12 with normal absorption points to <b>poor intake</b>.','Pernicious anaemia':'Corrected by intrinsic factor: <b>pernicious anaemia</b> or another cause of IF lack (gastrectomy, congenital).','Blind loop syndrome':'Corrected only after antibiotics: bacteria were taking the B12, as in <b>blind loop syndrome</b> and other intestinal colonisation.','Ileal disease or resection':'Never corrected: <b>ileal disease</b> (Crohn disease, resection, sprue, Imerslund–Gräsbeck).'};
  const keys=Object.keys(D);let mode='learn',cur=keys[2],guess=null;
  w.innerHTML=`<div class="seg" role="group" aria-label="Mode"><button data-m="learn">Pick a diagnosis</button><button data-m="mystery">Mystery patient</button></div>
   <div class="chips sch-pick" style="margin-top:var(--s4)"></div><ol class="mx-steps sch-steps"></ol><div class="sch-end" style="margin-top:var(--s4)"></div>`;
  function steps(d){const r=D[d];const out=[];for(let i=0;i<r.length||i<1;i++){out.push([ST[i],r[i]?'≥ 10% in urine: absorbed':'< 10% in urine: not absorbed']);if(r[i])break}return out}
  function r(){w.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===mode));
    const pick=w.querySelector('.sch-pick'),end=w.querySelector('.sch-end');
    w.querySelector('.sch-steps').innerHTML=steps(cur).map(([a,b])=>`<li><span>${a}</span><b>${b}</b></li>`).join('');
    if(mode==='learn'){pick.innerHTML=keys.map(k=>`<button class="chip" data-d="${k}" aria-pressed="${k===cur}">${k}</button>`).join('');end.innerHTML=`<p class="verdict">${END[cur]}</p>`}
    else{pick.innerHTML='<span class="eyebrow" style="align-self:center">Your diagnosis</span>'+keys.slice(1).map(k=>`<button class="chip" data-g="${k}" aria-pressed="${guess===k}">${k}</button>`).join('')+'<button class="chip" data-new="1">New patient</button>';
      const ok=guess&&(guess===cur||(END[guess]===END[cur]));end.innerHTML=guess?`<p class="verdict"><b>${ok?'Correct.':'Not quite.'}</b> ${END[cur]}</p>`:'<p class="note">Read the stages, then choose.</p>'}}
  w.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.m){mode=b.dataset.m;guess=null;if(mode==='mystery')cur=keys[1+Math.floor(Math.random()*4)]}
    else if(b.dataset.d)cur=b.dataset.d;else if(b.dataset.g)guess=b.dataset.g;else if(b.dataset.new){let n;do{n=keys[1+Math.floor(Math.random()*4)]}while(n===cur);cur=n;guess=null}
    r()});r()};

/* ---------- Chapter 4: site of haemolysis ---------- */
W.haemsite=function(w){
  const F=[['hburia','Red or dark urine with haemoglobinuria',3,0,'Haemoglobinuria: free Hb exceeded haptoglobin'],['hsid','Haemosiderin in urine',2,0,'Haemosiderinuria: recent or chronic intravascular loss'],['hapt','Haptoglobin absent',1,0,''],['ldh','LDH very high',1,0,''],
   ['acute','Sudden onset with fever, rigors or back pain',2,0,'Acute onset suggests transfusion reaction, G6PD crisis or infection'],['schisto','Schistocytes on the film',2,0,'Fragments point to MAHA, DIC or a mechanical valve'],['bite','Bite cells or Heinz bodies',1,0,'Bite cells and Heinz bodies: oxidant damage (G6PD) or unstable Hb'],
   ['sphero','Spherocytes on the film',0,2,'Spherocytes: hereditary spherocytosis or warm autoimmune haemolysis'],['spleen','Splenomegaly',0,2,'Splenomegaly: chronic extravascular destruction'],['bili','High indirect bilirubin, normal-coloured urine',0,1,''],['stones','Pigment gallstones',0,1,'Gallstones: long-standing haemolysis'],['target','Target or sickle cells',0,1,'Target or sickle cells: haemoglobin disorder; do HPLC'],['dat','DAT positive',0,0,'DAT positive: immune haemolysis (warm IgG is mostly extravascular; complement-fixing antibodies can lyse in the vessels)']];
  w.innerHTML=`<div class="chips">${F.map(([k,l])=>`<label class="chk"><input type="checkbox" data-k="${k}"> ${l}</label>`).join('')}</div>
   <div class="rng" style="margin:var(--s4) 0"><div class="eyebrow">Leaning</div><div class="hs-bar" style="position:relative;height:12px;border-radius:6px;background:linear-gradient(90deg,var(--haem),var(--rule) 50%,var(--stain))"><span class="hs-dot" style="position:absolute;top:-4px;width:20px;height:20px;border-radius:50%;background:var(--ink);border:3px solid var(--paper);transform:translateX(-50%);left:50%;transition:left .25s"></span></div>
   <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-top:.3rem"><span>Intravascular</span><span>Extravascular</span></div></div>
   <div class="verdict hs-out" aria-live="polite"></div>`;
  function r(){let iv=0,ev=0;const notes=[];w.querySelectorAll('input:checked').forEach(c=>{const f=F.find(x=>x[0]===c.dataset.k);iv+=f[2];ev+=f[3];if(f[4])notes.push(f[4])});
    const t=iv+ev,pos=t?50+50*(ev-iv)/t:50;w.querySelector('.hs-dot').style.left=pos+'%';
    let head=!t?'Tick findings to begin.':iv>ev?'<b>Mainly intravascular.</b> Think of mismatched transfusion, acute G6PD haemolysis, fragmentation, malaria or clostridia, PNH, or complement-mediated immune haemolysis.':ev>iv?'<b>Mainly extravascular.</b> Think of membrane, enzyme and haemoglobin disorders, hypersplenism and warm autoimmune haemolysis.':'<b>Mixed picture.</b> Both mechanisms may be working; many disorders have some of each.';
    w.querySelector('.hs-out').innerHTML=head+(notes.length?'<ul>'+notes.map(n=>`<li>${n}</li>`).join('')+'</ul>':'')}
  w.addEventListener('change',r);r()};

/* ---------- Chapter 5: Hb pattern viewer ---------- */
W.hbviewer=function(w){
  const RT={H:.25,Bart:.45,F:1.1,A:2.5,A2:3.6,E:3.6,Lepore:3.45,Portland:3.0,D:4.1,G:4.15,S:4.6,CS:4.95,O:5.12,C:5.1};
  const EP={CS:.55,C:1,A2:1,E:1,O:1,S:2,D:2,G:2,Lepore:2,F:3,Portland:2.6,A:4,Bart:4.5,H:5};
  const AC={F:1,Bart:1,Portland:1.4,A:2.2,A2:2.2,D:2.2,E:2.2,G:2.2,Lepore:2.2,H:2.2,CS:2.2,O:2.85,S:3.4,C:4.4};
  const P={
   'Normal adult':[{A:96.5,A2:2.5,F:1},'HbA with HbA₂ 2–3.5% and HbF under 1%.'],
   'β thalassaemia trait':[{A:92,A2:5.5,F:2.5},'<b>HbA₂ 3.6–7%</b> with a little extra HbF. Exclude iron deficiency, which lowers HbA₂.'],
   'β⁰ thalassaemia major':[{F:95,A2:5},'No HbA at all; HbF is almost everything.'],
   'β⁺ thalassaemia major':[{F:60,A:35,A2:5},'HbF high and heterogeneous, HbA reduced.'],
   'α thalassaemia trait':[{A:97.5,A2:2,F:.5},'A normal pattern: α trait needs DNA analysis (or α/β synthesis ratio).'],
   'HbH disease':[{A:82,H:15,Bart:2,A2:1},'A fast HbH peak (5–40%), sometimes a little Hb Bart\'s; HbA₂ normal or low.'],
   'Hb Bart\'s hydrops':[{Bart:80,Portland:20},'Hb Bart\'s about 80%, Hb Portland 20%; no HbA, HbA₂ or HbF.'],
   'Sickle cell trait (AS)':[{A:58,S:37,A2:3.5,F:1.5},'HbA more than HbS (HbS about 35–40%).'],
   'Sickle cell anaemia (SS)':[{S:88,F:8.5,A2:3.5},'HbS with no HbA; HbF often raised.'],
   'HbS/β⁰ thalassaemia':[{S:83,F:12,A2:5},'Like SS but microcytic, with a high HbA₂ and persistent splenomegaly.'],
   'HbSC disease':[{S:48,C:48,F:2,A2:2},'HbS and HbC in about equal amounts. On alkaline electrophoresis HbC runs with HbA₂.'],
   'HbC trait':[{A:58,C:38,A2:3,F:1},'HbC under 50%, HbA over 50%.'],
   'HbE trait':[{A:69,E:30,F:1},'HbE about 30% in the HbA₂ window (it co-elutes with A₂). Confirm by acid agarose or IEF.'],
   'δβ thalassaemia trait':[{A:85,F:13,A2:2},'HbF 5–15% (heterocellular) with a normal HbA₂ and microcytosis.'],
   'Hb Lepore trait':[{A:82,Lepore:10,F:5.5,A2:2.5},'Hb Lepore 5–15% near the A₂ window, HbF raised, HbA₂ normal.'],
   'HPFH (heterozygous)':[{A:72,F:26,A2:2},'HbF 10–35%, pancellular, with normal indices and HbA₂.'],
   'HbE homozygous (EE)':[{E:92,F:8},'HbE plus HbA₂ about 90%, no HbA; marked microcytosis with many target cells but little anaemia.'],
   'HbE/β⁰ thalassaemia':[{E:55,F:42,A2:3},'HbE with a high HbF and no HbA: a thalassaemia intermedia or major picture.'],
   'HbD-Punjab trait':[{A:57,D:39,A2:2.5,F:1.5},'HbD-Punjab elutes in the D window on HPLC. On alkaline electrophoresis it runs with HbS but on acid agar with HbA, and the solubility test is negative.'],
   'HbS/D-Punjab':[{S:47,D:45,F:5,A2:3},'Two peaks in the D and S windows with no HbA: a sickling disorder as severe as SS. Both bands sit together in the S position on alkaline electrophoresis.'],
   'HbO-Arab trait':[{A:60,O:35,A2:3,F:2},'HbO-Arab elutes in the C window on HPLC and runs with HbC and HbA₂ on alkaline electrophoresis; on acid agar it sits near HbS, closer to the origin.'],
   'HbS/O-Arab':[{S:50,O:43,F:4,A2:3},'HbS with HbO-Arab and no HbA: a severe sickling disorder.'],
   'HbG-Philadelphia trait':[{A:70,G:27,A2:2,F:1},'An α-chain variant of about 25% (less with α thalassaemia) in the D window, with a small hybrid HbA₂ (α₂ᴳδ₂) peak. It runs with HbS on alkaline electrophoresis. Harmless.'],
   'Hb Constant Spring trait':[{A:95,CS:2.4,A2:2.6},'A cluster of small peaks (1–3%) just before the C window, easily missed; on alkaline electrophoresis a faint band behind HbA₂. Combined with α⁰ trait it gives HbH–Constant Spring disease.'],
   'Newborn, normal':[{F:78,A:20,A2:.4,Bart:.3},'HbF dominates and HbA is about 20%; acetylated HbF with the injection artefact gives the typical triple peak at the start.'],
   'Newborn with α thalassaemia trait':[{F:76,A:20,Bart:4},'Hb Bart\'s (γ₄) of 1–10% at birth suggests α thalassaemia; it disappears by 6 months, so diagnose it at birth.']};
  const keys=Object.keys(P);let cur=keys[1];
  w.innerHTML=`<label class="chk">Condition <select>${keys.map(k=>`<option>${k}</option>`).join('')}</select></label>
   <figure class="hb-fig" style="margin:var(--s4) 0"><div class="eyebrow">HPLC (schematic)</div><svg class="hb-hplc" viewBox="0 0 600 230" role="img" style="width:100%;height:auto;display:block"></svg></figure>
   <figure class="hb-fig" style="margin:0 0 var(--s4)"><div class="eyebrow">Alkaline electrophoresis, pH 8.4 (schematic)</div><svg class="hb-ep" viewBox="0 0 600 70" role="img" style="width:100%;height:auto;display:block"></svg></figure>
   <figure class="hb-fig" style="margin:0 0 var(--s4)"><div class="eyebrow">Acid (citrate agar) electrophoresis, pH 6.0–6.2 (schematic)</div><svg class="hb-ac" viewBox="0 0 600 70" role="img" style="width:100%;height:auto;display:block"></svg></figure>
   <div class="hb-tab" style="display:flex;flex-wrap:wrap;gap:var(--s4)"></div><p class="verdict hb-note"></p>`;
  const sel=w.querySelector('select');sel.value=cur;
  const lab=k=>({A2:'A₂',Bart:"Bart's",H:'H',Portland:'Portland',CS:'CS',O:'O-Arab',D:'D-Punjab',G:'G-Phila'}[k]||k);
  function r(){cur=sel.value;const [pk,note]=P[cur];
    const X=t=>40+t/5.6*545,Y0=200;let path='';const pts=[];
    for(let i=0;i<=560;i++){const t=i/100;let y=0;for(const k in pk){const sd=k==='A'?.14:.07;y+=Math.sqrt(pk[k])*Math.exp(-((t-RT[k])**2)/(2*sd*sd))}pts.push(`${X(t).toFixed(1)},${(Y0-y*17.5).toFixed(1)}`)}
    path='M'+pts.join(' L');
    let svg=`<line x1="40" y1="${Y0}" x2="585" y2="${Y0}" stroke="currentColor" opacity=".4"/>`;
    for(let t=0;t<=5;t++)svg+=`<text x="${X(t)}" y="${Y0+18}" font-size="11" text-anchor="middle" fill="currentColor" opacity=".7">${t}</text>`;
    svg+=`<text x="585" y="${Y0+18}" font-size="11" text-anchor="end" fill="currentColor" opacity=".7">min</text>`;
    svg+=`<path d="${path}" fill="none" stroke="var(--haem)" stroke-width="2"/>`;
    for(const k in pk){const h=Math.sqrt(pk[k])*17.5;svg+=`<text x="${X(RT[k])}" y="${Math.max(14,Y0-h-6)}" font-size="12" font-weight="600" text-anchor="middle" fill="currentColor">${lab(k)==='E'?'A₂/E':lab(k)}</text>`}
    w.querySelector('.hb-hplc').innerHTML=svg;
    let ep=`<rect x="10" y="12" width="580" height="40" rx="4" fill="none" stroke="currentColor" opacity=".35"/><text x="14" y="66" font-size="11" fill="currentColor" opacity=".7">Origin (−)</text><text x="586" y="66" font-size="11" text-anchor="end" fill="currentColor" opacity=".7">Anode (+)</text>`;
    const ex=v=>40+v*100;const done={};
    for(const k in pk){const x=ex(EP[k]);const op=Math.min(1,.25+Math.sqrt(pk[k])/8);ep+=`<rect x="${x-14}" y="18" width="28" height="28" rx="3" fill="var(--stain)" opacity="${op.toFixed(2)}"/>`;
      const key=EP[k];done[key]=(done[key]?done[key]+'/':'')+lab(k)}
    for(const v in done)ep+=`<text x="${ex(+v)}" y="10" font-size="10" text-anchor="middle" fill="currentColor">${done[v]}</text>`;
    w.querySelector('.hb-ep').innerHTML=ep;
    let ac=`<rect x="10" y="12" width="580" height="40" rx="4" fill="none" stroke="currentColor" opacity=".35"/><text x="14" y="66" font-size="11" fill="currentColor" opacity=".7">Band order F · A · S · C</text>`;const dn={};
    for(const k in pk){const x=40+AC[k]*115;const op=Math.min(1,.25+Math.sqrt(pk[k])/8);ac+=`<rect x="${x-14}" y="18" width="28" height="28" rx="3" fill="var(--stain)" opacity="${op.toFixed(2)}"/>`;dn[AC[k]]=(dn[AC[k]]?dn[AC[k]]+'/':'')+lab(k)}
    for(const v in dn)ac+=`<text x="${40+v*115}" y="10" font-size="10" text-anchor="middle" fill="currentColor">${dn[v]}</text>`;
    w.querySelector('.hb-ac').innerHTML=ac;
    w.querySelector('.hb-tab').innerHTML=Object.entries(pk).map(([k,v])=>`<div><div class="eyebrow">Hb ${lab(k)}</div><div class="big" style="font-size:1.5rem">${v}%</div></div>`).join('');
    w.querySelector('.hb-note').innerHTML=note+' <span class="note">Peak heights use a square-root scale so small peaks stay visible.</span>'}
  sel.onchange=r;r()};

/* ---------- Chapter 6: osmotic fragility ---------- */
W.ofcurve=function(w){
  const C={'Hereditary spherocytosis':[[.9,.52,.66],[.1,.38,.42],'Curve shifted right: spherocytes burst in nearly normal saline. Incubation exaggerates it. The small tail on the left is young reticulocytes.'],
   'Thalassaemia or iron deficiency (target cells)':[[1,.33,.37]],'Sickle cell disease':[[1,.36,.40]],'Pyruvate kinase deficiency':[[1,.40,.55]]};
  C['Thalassaemia or iron deficiency (target cells)'][1]=null;C['Thalassaemia or iron deficiency (target cells)'][2]='Curve shifted left: flat target cells have extra surface area and resist lysis (decreased fragility).';
  C['Sickle cell disease'][1]=null;C['Sickle cell disease'][2]='Decreased fragility, as Dr Abeer notes.';
  C['Pyruvate kinase deficiency'][1]=null;C['Pyruvate kinase deficiency'][2]='Fresh blood is normal or less fragile (many reticulocytes); after incubation fragility rises because the cells run out of ATP.';
  const keys=Object.keys(C);let cur=keys[0],inc=false;
  w.innerHTML=`<div class="tcp-top"><label class="chk">Condition <select>${keys.map(k=>`<option>${k}</option>`).join('')}</select></label><label class="chk"><input type="checkbox" class="ofinc"> Incubated 24 h at 37 °C</label></div>
   <svg viewBox="0 0 600 300" role="img" aria-label="Osmotic fragility curve" style="width:100%;height:auto;display:block"></svg>
   <div style="display:flex;gap:var(--s4);flex-wrap:wrap;font-size:.9rem;margin:.4rem 0"><span><span style="display:inline-block;width:22px;border-top:2px dashed currentColor;vertical-align:middle;opacity:.6"></span> Normal</span><span><span style="display:inline-block;width:22px;border-top:3px solid var(--haem);vertical-align:middle"></span> Patient</span><span class="ofmcf"></span></div>
   <p class="verdict ofout"></p>`;
  const sel=w.querySelector('select');
  const lys=(x,pops,incb)=>pops.reduce((a,[f,m,mi])=>{const c=incb?mi:m;return a+f*100/(1+Math.exp((x-c)/.025))},0);
  const X=x=>50+(x-.1)/.8*530,Y=y=>260-y*2.3;
  function line(pops,incb){let d='';for(let i=0;i<=160;i++){const x=.1+i*.005;d+=(i?'L':'M')+X(x).toFixed(1)+','+Y(lys(x,pops,incb)).toFixed(1)}return d}
  function mcf(pops,incb){let lo=.1,hi=.9;for(let k=0;k<40;k++){const m=(lo+hi)/2;if(lys(m,pops,incb)>50)lo=m;else hi=m}return (lo+hi)/2}
  function r(){cur=sel.value;inc=w.querySelector('.ofinc').checked;const c=C[cur];const pops=c[1]?[c[0],c[1]]:[c[0]];const norm=[[1,.43,.47]];
    let g='';for(let v=0;v<=100;v+=25)g+=`<line x1="50" x2="580" y1="${Y(v)}" y2="${Y(v)}" stroke="currentColor" opacity=".12"/><text x="44" y="${Y(v)+4}" font-size="11" text-anchor="end" fill="currentColor" opacity=".7">${v}%</text>`;
    for(let x=.1;x<=.91;x+=.1)g+=`<text x="${X(x)}" y="280" font-size="11" text-anchor="middle" fill="currentColor" opacity=".7">${x.toFixed(1)}</text>`;
    g+=`<text x="315" y="298" font-size="11" text-anchor="middle" fill="currentColor" opacity=".8">NaCl concentration (g/dL)</text><text x="12" y="140" font-size="11" fill="currentColor" opacity=".8" transform="rotate(-90 12 140)" text-anchor="middle">Lysis</text>`;
    g+=`<path d="${line(norm,inc)}" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 5" opacity=".6"/><path d="${line(pops,inc)}" fill="none" stroke="var(--haem)" stroke-width="3"/>`;
    w.querySelector('svg').innerHTML=g;
    w.querySelector('.ofmcf').innerHTML=`MCF (50% lysis): patient <b>${mcf(pops,inc).toFixed(2)}</b>, normal ${mcf(norm,inc).toFixed(2)} g/dL`;
    w.querySelector('.ofout').innerHTML=c[2]}
  sel.onchange=r;w.querySelector('.ofinc').onchange=r;r()};

/* ---------- Chapter 7: autohaemolysis ---------- */
W.autohaem=function(w){
  const D={'Normal':[1.2,.5,.6,'Little lysis, kept low by glucose.'],'Hereditary spherocytosis':[10,2,4,'Increased lysis, <b>corrected by glucose</b> (the cells can make their own ATP if fed).'],'Pyruvate kinase deficiency':[9,8.5,2,'Increased lysis, <b>corrected by ATP but not glucose</b>: the block is at the ATP-producing step.'],'Unstable haemoglobin':[6,5.5,5.5,'Increased lysis <b>not corrected</b> by either: the problem is the haemoglobin, not energy.']};
  const keys=Object.keys(D);let cur=keys[1];
  w.innerHTML=`<div class="chips">${keys.map(k=>`<button class="chip" data-k="${k}">${k}</button>`).join('')}</div><svg viewBox="0 0 600 240" role="img" aria-label="Autohaemolysis bars" style="width:100%;max-width:640px;height:auto;display:block"></svg><p class="verdict ahout"></p>`;
  function r(){w.querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===cur));const v=D[cur],L=['No additive','+ Glucose','+ ATP'];
    let g=`<line x1="60" x2="580" y1="200" y2="200" stroke="currentColor" opacity=".4"/>`;
    for(let t=0;t<=12;t+=4)g+=`<text x="52" y="${200-t*14+4}" font-size="11" text-anchor="end" fill="currentColor" opacity=".7">${t}%</text><line x1="60" x2="580" y1="${200-t*14}" y2="${200-t*14}" stroke="currentColor" opacity=".1"/>`;
    g+=`<rect x="60" y="${200-2*14}" width="520" height="${2*14}" fill="var(--plasma)" opacity=".18"/><text x="576" y="${200-2*14+12}" font-size="10" text-anchor="end" fill="currentColor" opacity=".7">normal range</text>`;
    v.slice(0,3).forEach((x,i)=>{const bx=110+i*160,h=x*14;g+=`<rect x="${bx}" y="${200-h}" width="80" height="${h}" rx="4" fill="${i?'var(--stain)':'var(--haem)'}"/><text x="${bx+40}" y="${195-h}" font-size="13" font-weight="600" text-anchor="middle" fill="currentColor">${x}%</text><text x="${bx+40}" y="220" font-size="12" text-anchor="middle" fill="currentColor">${L[i]}</text>`});
    w.querySelector('svg').innerHTML=g;w.querySelector('.ahout').innerHTML=v[3]}
  w.addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){cur=b.dataset.k;r()}});r()};

/* ---------- Chapter 8: DAT ---------- */
W.datint=function(w){const q=id=>w.querySelector('#'+id);
  function out(){const g=q('dG').value==='1',c=q('dC').value==='1',x=q('dX').value;let m;
    if(x==='nohaem'&&(g||c))m='<b>Positive DAT without haemolysis.</b> Seen in myeloma, SLE and other autoimmune disease, and with methyldopa or cephalosporins. Check for haemolysis markers before calling it AIHA.';
    else if(!g&&!c)m='<b>DAT negative.</b> Immune haemolysis is unlikely (rarely low-affinity or very few IgG molecules need special methods). Think of HS, enzyme defects, MAHA or PNH.';
    else if(x==='dl')m='<b>Paroxysmal cold haemoglobinuria.</b> The biphasic IgG anti-P binds in the cold and fixes complement, so the DAT usually shows <b>C3 only</b>. Keep the patient warm.';
    else if(x==='cold')m=c&&!g?'<b>Cold agglutinin disease.</b> IgM binds in the cold and falls off, leaving <b>C3d only</b>. Anti-I or anti-i; look for Mycoplasma, EBV or a B-cell lymphoproliferative disorder.':'Cold agglutinins usually leave <b>C3d only</b>. IgG positivity with cold agglutinins suggests <b>mixed warm and cold AIHA</b> (SLE, lymphoma).';
    else if(x==='drug')m=g&&!c?'<b>Drug-induced, hapten or autoantibody type</b> (penicillin, cephalosporins; methyldopa, mefenamic acid). The hapten type is positive only with the drug; the autoantibody type stays positive without it.':!g&&c?'<b>Drug-induced, immune-complex (ternary complex) type</b> (quinidine, sulphonamides, chloramphenicol): C3 only, often acute intravascular haemolysis.':'<b>Drug-induced, autoantibody type</b> (rare with IgG plus complement), or warm AIHA in a patient on drugs.';
    else m=g&&c?'<b>Warm AIHA</b> with IgG and complement: expect spherocytes and mixed spleen and liver destruction.':g?'<b>Warm AIHA</b> (IgG alone): extravascular, mainly in the spleen. Look for lymphoma, CLL, SLE or drugs.':'<b>C3 only:</b> cold agglutinin disease, PCH, the immune-complex drug type, or warm AIHA with IgG below the detection limit. Add a cold agglutinin titre and Donath–Landsteiner test.';
    q('dOut').innerHTML=m}
  w.querySelectorAll('select').forEach(s=>s.onchange=out);out()};

/* ---------- Chapter 9: systemic disease ---------- */
W.sysanaemia=function(w){
  const D={'Chronic kidney disease':[['Low erythropoietin','Anaemia of chronic disorders','Uraemic marrow suppression','Short red cell life (chloramine)','Aluminium toxicity','Marrow fibrosis from hyperparathyroidism'],['Iron deficiency (diet, malabsorption, dialysis losses)'],[],['MAHA with dialysis, HUS or TTP']],
   'Malignancy':[['Anaemia of chronic disorders','Marrow infiltration'],['GI blood loss (colon, stomach)','Poor intake'],['Folate deficiency from high turnover'],['Autoimmune haemolysis','MAHA with mucin-secreting tumours']],
   'Collagen disease':[['Anaemia of chronic disorders','Aplasia from cytotoxic drugs','Renal failure','Hypersplenism (Felty syndrome)'],['GI bleeding from aspirin, NSAIDs, steroids'],['Folate deficiency from drugs'],['Secondary autoimmune haemolysis']],
   'Liver disease':[['Anaemia of chronic disorders','Dilution from portal hypertension','Hypersplenism','Marrow depression from hepatitis or alcohol'],['Variceal and portal hypertensive bleeding'],['Folate deficiency','Abnormal membrane lipids (round macrocytes)'],['Acanthocytes (spur cell anaemia)','Zieve syndrome','Wilson disease','Autoimmune hepatitis with AIHA']],
   'Pregnancy':[['Dilution (Hb ≤ 11 g/dL from week 8)','Protein deficiency','Aplasia from viruses or drugs','Puerperal blood loss'],['Iron deficiency'],['Folate (and B12) deficiency'],['MAHA, HELLP, AIHA']],
   'Thyroid and endocrine':[['Low metabolism lowers EPO (hypothyroidism, hypopituitarism, Addison disease, androgen deficiency)','Dilution','Antithyroid drug aplasia','Marrow sclerosis in hyperparathyroidism'],['Menorrhagia','Less iron absorption without thyroxine'],['Non-megaloblastic macrocytosis','Pernicious anaemia with autoimmune thyroiditis'],[]],
   'Alcohol':[['Anaemia of chronic disorders','Toxic marrow suppression','Hypersplenism'],['Iron deficiency (intake, absorption, bleeding)','Ring sideroblasts'],['Folate and B12 deficiency','Direct macrocytosis'],['Lipid abnormalities, hypophosphataemia, Zieve syndrome']]};
  const H=['Normocytic or hypoproliferative','Microcytic','Macrocytic','Haemolytic'];
  const keys=Object.keys(D);let cur=keys[0];
  w.innerHTML=`<div class="chips">${keys.map(k=>`<button class="chip" data-k="${k}">${k}</button>`).join('')}</div><div class="agg sysg"></div>`;
  function r(){w.querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===cur));
    w.querySelector('.sysg').innerHTML=D[cur].map((l,i)=>`<div class="agc ${l.length?'ok':''}" style="${l.length?'':'opacity:.5'}"><span class="eyebrow">${H[i]}</span>${l.length?'<ul style="margin:.3rem 0 0;padding-left:1.1rem">'+l.map(x=>`<li>${x}</li>`).join('')+'</ul>':'<b>Not typical</b>'}</div>`).join('')}
  w.addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){cur=b.dataset.k;r()}});r()};

/* ---------- Chapter 12: CHIP / CCUS ---------- */
W.chip=function(w){const q=id=>w.querySelector('#'+id).value==='1';
  function out(){const m=q('cMut'),c=q('cCyt'),n=q('cNeo');let t;
    if(n)t='<b>Defined myeloid neoplasm.</b> Classify it by the marrow and genetics (MDS, MPN, MDS/MPN or AML).';
    else if(m&&c)t='<b>CCUS</b>: a clone with persistent unexplained cytopenia but no neoplasm. Follow up; risk depends on clone size, number of mutations and the genes involved.';
    else if(m)t='<b>CHIP</b>: a clone without unexplained cytopenia. Risk of progression is about 0.5–1% a year; cardiovascular risk is increased.';
    else if(c)t='<b>ICUS</b>: unexplained persistent cytopenia without a detectable clone. Repeat studies over time.';
    else t='No clonal haematopoiesis and no cytopenia: <b>normal</b>, as far as these tests show.';
    w.querySelector('#cOut').innerHTML=t}
  w.querySelectorAll('select').forEach(s=>s.onchange=out);out()};

/* ---------- Chapter 13: MPN classifier ---------- */
W.mpncls=function(w){const q=id=>w.querySelector('#'+id);
  function out(){const m=q('mSex').value==='m',hb=+q('mHb').value,plt=+q('mPlt').value,wbc=+q('mWbc').value,g=q('mGen').value,bm=q('mBm').value,epo=q('mEpo').value==='low',minor=q('mMin').checked;
    let dx,t;const drv=['jak2','ex12','calr','mpl'].includes(g),clone=drv||g==='other';
    const hbHi=hb>(m?16.5:16),hbVery=hb>(m?18.5:16.5);
    if(g==='bcr'){dx='CML';t='BCR::ABL1 defines <b>chronic myeloid leukaemia</b>, whatever the counts. Check the marrow for phase and blasts.'}
    else if(hbHi&&(g==='jak2'||g==='ex12')&&(bm==='pan'||(bm==='na'&&hbVery&&epo))){dx='PV';t='Raised Hb, JAK2 mutation and '+(bm==='pan'?'panmyelosis':'a very high Hb with low EPO (marrow optional)')+': <b>polycythaemia vera</b>.'+(epo?'':' EPO is not low, but the three major criteria are met.')}
    else if(hbHi&&(g==='jak2'||g==='ex12')){dx='Probable PV';t='Raised Hb with a JAK2 mutation. Complete the criteria: marrow biopsy, or a very high Hb with low EPO.'}
    else if(hbHi&&!clone){dx='Secondary?';t='Erythrocytosis without a clonal marker: look for hypoxia, smoking, renal or hepatic tumours, and check EPO (high in secondary causes).'}
    else if(bm==='fib'&&clone){dx=minor?'Overt PMF':'Overt PMF?';t='Atypical megakaryocytes with grade 2–3 fibrosis and a clonal marker: <b>overt primary myelofibrosis</b>'+(minor?'.':' if at least one minor criterion is present (tick the box when it is).')}
    else if(bm==='pre'&&clone){dx=minor?'Pre-fibrotic PMF':'Pre-PMF?';t='Atypical clustered megakaryocytes without significant fibrosis: <b>pre-fibrotic myelofibrosis</b>'+(minor?'. It can mimic ET in the blood.':', but at least one minor criterion is needed.')}
    else if(plt>=450&&bm==='et'&&clone){dx='ET';t='Platelets ≥ 450 × 10⁹/L, large mature hyperlobulated megakaryocytes and a '+(drv?'driver mutation':'clonal marker')+': <b>essential thrombocythaemia</b>.'}
    else if(plt>=450&&!clone){dx='Reactive?';t='Thrombocytosis without a clonal marker: exclude iron deficiency, bleeding, infection, inflammation and malignancy first. ET remains possible if no reactive cause is found (triple-negative).'}
    else if(plt>=450&&bm==='na'){dx='Needs marrow';t='Thrombocytosis with a clonal marker: a marrow biopsy is needed to separate ET from pre-fibrotic PMF and PV.'}
    else if(wbc>=25&&!clone){dx='Check CNL / reactive';t='Neutrophilia ≥ 25 × 10⁹/L: test CSF3R and exclude reactive causes for chronic neutrophilic leukaemia.'}
    else if(clone){dx='MPN-NOS?';t='A clonal driver with features that do not fit a single entity. Consider MPN-NOS, or reassess when the picture evolves.'}
    else {dx='No MPN';t='No clonal marker and no criteria met.'}
    q('mDx').textContent=dx;q('mOut').innerHTML=t}
  w.querySelectorAll('input,select').forEach(i=>i.oninput=i.onchange=out);out()};

/* ---------- Yes/No work-up flowchart (generic) ---------- */
W.flow=function(w){
  const T=JSON.parse(document.getElementById(w.dataset.src).textContent);
  let path=[],full=false;
  const at=p=>[...p].reduce((n,a)=>n[a],T);
  function tree(n,p){
    const on=path.join('').startsWith(p),cur=path.join('')===p;
    const lab=n.dx?`<b>${n.dx}</b>`:n.q;
    let h=`<button class="fl-t${n.dx?' lf':''}${on?' on':''}${cur?' cur':''}" data-p="${p}">${lab}</button>`;
    if(!n.dx)h+=`<ul>${['y','n'].map(a=>`<li><span class="fl-tag ${a}">${a==='y'?'Yes':'No'}</span>${tree(n[a],p+a)}</li>`).join('')}</ul>`;
    return h}
  function render(){
    let n=T,h='<ol class="fl-path">';
    path.forEach((a,i)=>{h+=`<li><button class="fl-node done" data-p="${path.slice(0,i).join('')}" title="Change this answer">${n.q}</button><div class="fl-arrow ${a}"><span>${a==='y'?'Yes':'No'}</span></div></li>`;n=n[a]});
    if(n.dx)h+=`<li><div class="fl-node leaf" tabindex="-1"><div class="eyebrow">Most likely</div><b>${n.dx}</b>${n.d?`<p>${n.d}</p>`:''}${n.next?`<p class="fl-next"><b>Next step:</b> ${n.next}</p>`:''}</div></li>`;
    else h+=`<li><div class="fl-node cur"><div class="eyebrow">Step ${path.length+1}</div><span class="fl-q">${n.q}</span>${n.hint?`<p class="note">${n.hint}</p>`:''}<div class="fl-btns"><button class="btn fl-a y" data-a="y">Yes</button><button class="btn fl-a n" data-a="n">No</button></div></div></li>`;
    h+='</ol>';
    h+=`<div class="fl-ctl"><button class="btn" data-c="back"${path.length?'':' disabled'}>Back one step</button><button class="btn" data-c="reset"${path.length?'':' disabled'}>Start again</button><button class="btn" data-c="full" aria-expanded="${full}">${full?'Hide':'Show'} the whole chart</button></div>`;
    if(full)h+=`<div class="fl-tree"><p class="note">Tap any box to jump to it.</p>${tree(T,'')}</div>`;
    w.innerHTML=h}
  w.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.a){path.push(b.dataset.a);render();const f=w.querySelector('.fl-node.leaf,.fl-node.cur');if(f&&f.getBoundingClientRect().bottom>innerHeight)f.scrollIntoView({block:'nearest',behavior:'smooth'})}
    else if(b.dataset.p!==undefined){path=[...b.dataset.p];render()}
    else if(b.dataset.c==='back'){path.pop();render()}
    else if(b.dataset.c==='reset'){path=[];render()}
    else if(b.dataset.c==='full'){full=!full;render()}});
  render()};

/* ---------- Chapter 14: SM criteria checker ---------- */
W.smcrit=function(w){
  const C=[['maj','Major: dense aggregates of ≥15 mast cells in marrow or another extracutaneous organ'],
   ['m1','Minor: >25% of mast cells atypical (type I or II) or spindle-shaped'],
   ['m2','Minor: activating KIT mutation (codon 816 or other critical region)'],
   ['m3','Minor: mast cells express CD2, CD25 or CD30'],
   ['m4','Minor: baseline tryptase >20 ng/mL (no associated myeloid neoplasm)']];
  w.innerHTML=`<div class="chips">${C.map(([k,l])=>`<label class="chk"><input type="checkbox" data-k="${k}"> ${l}</label>`).join('')}</div><p class="verdict" id="smOut" aria-live="polite"></p>`;
  function out(){const v=k=>w.querySelector(`[data-k="${k}"]`).checked;const minors=['m1','m2','m3','m4'].filter(v).length;const maj=v('maj');
    const ok=(maj&&minors>=1)||minors>=3;
    w.querySelector('#smOut').innerHTML=ok?`<b>Criteria met for systemic mastocytosis</b> (${maj?'major + '+minors+' minor':minors+' minor'}). Now look for B and C findings and an associated neoplasm to name the subtype; the work-up chart below does this step by step.`
      :`<b>Criteria not met</b> (${maj?'major only':'major absent'}, ${minors} minor). ${maj?'One more minor criterion is needed.':'Need the major plus one minor, or three minor criteria.'} Clonal markers without the criteria suggest monoclonal mast cell activation syndrome.`}
  w.addEventListener('change',out);out()};

/* ---------- Chapter 15: dysplasia and blast counter ---------- */
W.mdscount=function(w){
  const F=[['eD','Dysplastic erythroblasts',14],['eT','Erythroblasts counted',100],['gD','Dysplastic granulocytes',6],['gT','Granulocytes counted',100],['mD','Dysplastic megakaryocytes',9],['mT','Megakaryocytes counted',30],['bm','Marrow blasts (of 500 cells)',35],['pb','Blood blasts (of 200 leucocytes)',4]];
  w.innerHTML=`<div class="ir">${F.map(([id,l,v])=>`<label for="mc_${id}">${l}<input id="mc_${id}" type="number" inputmode="numeric" min="0" value="${v}"></label>`).join('')}<label class="chk" style="font-weight:400"><input id="mc_auer" type="checkbox"> Auer rods seen</label></div><div class="scr-out" id="mcOut" aria-live="polite"></div>`;
  const g=id=>+w.querySelector('#mc_'+id).value||0;
  function out(){
    const L=[['Erythroid','eD','eT'],['Granulocytic','gD','gT'],['Megakaryocytic','mD','mT']].map(([n,d,t])=>{const p=g(t)?100*g(d)/g(t):0;return [n,p,g(t)]});
    const sig=L.filter(x=>x[1]>=10);const bm=100*g('bm')/500,pb=100*g('pb')/200,auer=w.querySelector('#mc_auer').checked;
    let band;if(bm>=20||pb>=20)band='<b>≥20% blasts: AML range</b> (Chapter 17).';
    else if(bm>=10||pb>=5||auer)band='<b>MDS with increased blasts-2 range</b> (10–19% marrow, 5–19% blood, or Auer rods).';
    else if(bm>=5||pb>=2)band='<b>MDS with increased blasts-1 range</b> (5–9% marrow or 2–4% blood).';
    else band='<b>Low blasts</b> (&lt;5% marrow and &lt;2% blood): MDS-LB, MDS-5q, MDS-SF3B1 or MDS-h depending on genetics and cellularity.';
    const mWarn=g('mT')<30?'<div class="note">Fewer than 30 megakaryocytes counted: megakaryocytic dysplasia cannot be judged reliably.</div>':'';
    w.querySelector('#mcOut').innerHTML=`<div class="verdict"><b>Dysplasia:</b> ${L.map(([n,p])=>`${n} ${p.toFixed(0)}%${p>=10?' ✔':''}`).join(' · ')}<div class="note">${sig.length?`Significant (≥10%) in ${sig.length} lineage${sig.length>1?'s':''}: ${sig.map(x=>x[0].toLowerCase()).join(', ')}.`:'No lineage reaches 10%: dysplasia is not significant.'}</div>${mWarn}</div>
      <div class="verdict"><b>Blasts:</b> marrow ${bm.toFixed(1)}%, blood ${pb.toFixed(1)}%. ${band}</div>`}
  w.addEventListener('input',out);w.addEventListener('change',out);out()};

W.cmml=function(w){
  const F=[['wbc','WBC (× 10⁹/L)',16.4],['mono','Monocytes (% of WBC)',22],['pb','Blood blasts + promonocytes (%)',2],['bm','Marrow blasts + promonocytes (%)',7]];
  const C=[['ex','Not CML/MPN; no PDGFRA, PDGFRB, FGFR1 or JAK2 rearrangement',1],['s1','Supporting 1: dysplasia in ≥1 myeloid lineage',1],['s2','Supporting 2: acquired clonal cytogenetic or molecular abnormality',0],['s3','Supporting 3: abnormal monocyte partitioning (classical CD14+CD16− >94%)',1],['au','Auer rods seen',0]];
  w.innerHTML=`<div class="ir">${F.map(([id,l,v])=>`<label for="cm_${id}">${l}<input id="cm_${id}" type="number" inputmode="decimal" min="0" step="0.1" value="${v}"></label>`).join('')}</div><div class="ir">${C.map(([id,l,v])=>`<label class="chk" style="font-weight:400"><input id="cm_${id}" type="checkbox"${v?' checked':''}> ${l}</label>`).join('')}</div><div class="scr-out" id="cmOut" aria-live="polite"></div>`;
  const g=id=>+w.querySelector('#cm_'+id).value||0,c=id=>w.querySelector('#cm_'+id).checked;
  function out(){
    const wbc=g('wbc'),mp=g('mono'),am=wbc*mp/100,pb=g('pb'),bm=g('bm');
    const pre1=am>=0.5&&mp>=10,pre2=pb<20&&bm<20,pre=pre1&&pre2&&c('ex');
    const ns=['s1','s2','s3'].filter(c).length;
    const sup=am>=1?ns>=1:(c('s1')&&c('s2'));
    let v,sub='';
    if(!pre2)v='<b>Blasts + promonocytes ≥20%: acute leukaemia range</b> (Chapter 17), not CMML.';
    else if(!pre1)v=`<b>Prerequisite not met:</b> monocytosis needs ≥0.5 × 10⁹/L <i>and</i> ≥10%. ${mp<10&&wbc>=13?'With neutrophilia and left shift, think of MDS/MPN with neutrophilia.':''}`;
    else if(!c('ex'))v='<b>Exclusions not confirmed:</b> rule out CML (BCR::ABL1), other MPNs and myeloid/lymphoid neoplasms with eosinophilia and TK rearrangement first.';
    else if(!sup)v=am>=1?'<b>No supporting criterion:</b> with monocytes ≥1 × 10⁹/L at least one is needed. Consider reactive monocytosis.':'<b>Supporting criteria not met:</b> with monocytes &lt;1 × 10⁹/L both dysplasia (1) and a clonal abnormality (2) are required.';
    else{const two=pb>=5||bm>=10||c('au');v=`<b>Meets WHO 2022 criteria for CMML: ${two?'CMML-2':'CMML-1'}, ${wbc>=13?'myeloproliferative':'myelodysplastic'} type.</b>`;
      sub=`<div class="note">${two?'CMML-2: 5–19% blood or 10–19% marrow blasts + promonocytes, or Auer rods.':'CMML-1: &lt;5% blood and &lt;10% marrow blasts + promonocytes, no Auer rods.'} ${wbc>=13?'WBC ≥13: expect splenomegaly and constitutional symptoms.':'WBC &lt;13: cytopenias and marrow failure symptoms dominate.'}</div>`}
    w.querySelector('#cmOut').innerHTML=`<div class="verdict"><b>Absolute monocytes:</b> ${am.toFixed(2)} × 10⁹/L (${mp}%). ${pre1?'✔ ≥0.5 and ≥10%':'✘ below threshold'}<div class="note">${am>=1?'Monocytes ≥1 × 10⁹/L: one supporting criterion is enough.':'Monocytes &lt;1 × 10⁹/L: supporting criteria 1 and 2 are both needed.'} Supporting criteria ticked: ${ns} of 3.</div></div><div class="verdict">${v}${sub}</div>`}
  w.addEventListener('input',out);w.addEventListener('change',out);out()};

W.amlresp=function(w){
  const F=[['bm','Marrow blasts (%)',3],['anc','Neutrophils (× 10⁹/L)',1.4],['plt','Platelets (× 10⁹/L)',85],['pre','Marrow blasts before treatment (%)',62],['cyc','Intensive induction courses given',1]];
  const C=[['pb','Blasts in the blood',0],['auer','Blasts with Auer rods',0],['emd','Extramedullary disease',0],['mrd','MRD negative (PCR or flow)',0],['prior','Patient was previously in remission',0]];
  w.innerHTML=`<div class="ir">${F.map(([id,l,v])=>`<label for="ar_${id}">${l}<input id="ar_${id}" type="number" inputmode="decimal" min="0" step="0.1" value="${v}"></label>`).join('')}</div><div class="ir">${C.map(([id,l,v])=>`<label class="chk" style="font-weight:400"><input id="ar_${id}" type="checkbox"${v?' checked':''}> ${l}</label>`).join('')}</div><div class="scr-out" id="arOut" aria-live="polite"></div>`;
  const g=id=>+w.querySelector('#ar_'+id).value||0,c=id=>w.querySelector('#ar_'+id).checked;
  function out(){
    const bm=g('bm'),anc=g('anc'),plt=g('plt'),pre=g('pre'),cyc=g('cyc');
    const clear=bm<5&&!c('pb')&&!c('auer')&&!c('emd');
    const rec=anc>1&&plt>100;
    let v,n;
    if(c('prior')&&(bm>=5||c('pb')||c('emd'))){v='Haematological relapse';n='Marrow blasts ≥5%, blasts back in the blood, or new extramedullary disease after remission.'}
    else if(clear&&rec){v=c('mrd')?'Complete remission without MRD (CR MRD−)':'Complete remission (CR)';n=c('mrd')?'CR plus a negative genetic marker by PCR or flow cytometry: the best response.':'Marrow blasts &lt;5%, no circulating blasts or Auer rods, no extramedullary disease, ANC &gt;1.0 and platelets &gt;100. Check MRD next.'}
    else if(clear){v='CR with incomplete haematological recovery (CRi)';n=`All the marrow and blood-blast criteria of CR, but ${anc<=1?'neutrophils ≤1.0':''}${anc<=1&&plt<=100?' and ':''}${plt<=100?'platelets ≤100':''} × 10⁹/L.`}
    else if(bm<5&&!c('auer')&&!c('emd')){v='Morphologic leukaemia-free state (MLFS)';n='Marrow blasts &lt;5% without Auer rods or extramedullary disease; no blood recovery is required. Recheck the blood blasts.'}
    else if(bm>=5&&bm<=25&&pre&&bm<=pre/2&&rec&&!c('pb')){v='Partial remission (PR)';n=`Blood criteria of CR met; marrow blasts 5–25% and down by at least 50% (from ${pre}% to ${bm}%).`}
    else if(cyc>=2){v='Primary refractory disease';n='No CR or CRi after 2 courses of intensive induction (excluding death in aplasia).'}
    else {v='No response yet';n='Criteria for CR, CRi, MLFS or PR are not met. Reassess after the next course; refractory if still not in CR or CRi after 2 courses.'}
    const why=[bm<5?'✔ marrow blasts &lt;5%':'✘ marrow blasts ≥5%',!c('pb')?'✔ no blood blasts':'✘ blood blasts',!c('auer')?'✔ no Auer rods':'✘ Auer rods',!c('emd')?'✔ no extramedullary disease':'✘ extramedullary disease',anc>1?'✔ ANC &gt;1.0':'✘ ANC ≤1.0',plt>100?'✔ platelets &gt;100':'✘ platelets ≤100'];
    w.querySelector('#arOut').innerHTML=`<div class="verdict"><b>${v}</b><div class="note">${n}</div></div><div class="verdict"><div class="note">${why.join(' · ')}</div></div>`}
  w.addEventListener('input',out);w.addEventListener('change',out);out()};

W.mpal=function(w){
  const G=[['B lineage',[['b19s','CD19 strong (>50% of normal B progenitor)',1],['b19w','CD19 weak',0],['b10','CD10 strong',1],['b22','CD22 strong',0],['b79','CD79a strong',1]]],
    ['T lineage',[['t3','Cytoplasmic or surface CD3 bright (>50% of mature T cells), or IHC with non-zeta antibody',0]]],
    ['Myeloid lineage',[['m1','MPO in part >50% of mature neutrophil level',1],['nse','Non-specific esterase (diffuse)',0],['c11','CD11c',0],['c14','CD14',0],['c64','CD64',0],['lys','Lysozyme',0]]],
    ['Other',[['stem','Stem cell markers only (CD34, HLA-DR, CD38) with no lineage marker',0],['twopop','Two separate blast populations seen on flow',0]]]];
  w.innerHTML=G.map(([h,L])=>`<h3 style="margin:.6em 0 .2em">${h}</h3><div class="ir">${L.map(([id,l,v])=>`<label class="chk" style="font-weight:400"><input id="mp_${id}" type="checkbox"${v?' checked':''}> ${l}</label>`).join('')}</div>`).join('')+`<div class="scr-out" id="mpOut" aria-live="polite"></div>`;
  const c=id=>w.querySelector('#mp_'+id).checked;
  function out(){
    const t=c('t3');const bOthers=['b10','b22','b79'].filter(x=>!(x==='b79'&&t)).filter(c).length;
    const B=(c('b19s')&&bOthers>=1)||(c('b19w')&&bOthers>=2);
    const mono=['nse','c11','c14','c64','lys'].filter(c).length>=2;const M=c('m1')||mono;
    const L=[B&&'B',t&&'T',M&&'myeloid'].filter(Boolean);
    let v,n='';
    if(!L.length){v=c('stem')?'Acute undifferentiated leukaemia (AUL)':'Acute leukaemia of ambiguous lineage, NOS';n=c('stem')?'No lineage can be assigned; blasts carry stem cell markers only. Exclude AML with minimal differentiation and non-haemopoietic tumours.':'Markers present do not allow a lineage to be assigned.'}
    else if(L.length===1){v=`Single lineage: ${L[0]==='myeloid'?'AML':L[0]+'-ALL'}`;n='Only one lineage meets the criteria. Aberrant markers of another lineage (for example CD13 or CD33 on ALL, CD7 or CD19 on AML) are common and do not make MPAL.'}
    else{v=`Mixed-phenotype acute leukaemia, ${L.join('/')}`;n=`${c('twopop')?'Bilineal: two populations, each of one lineage.':'Biphenotypic: one population expressing both lineages.'} Next, look for BCR::ABL1, KMT2A, ZNF384 or BCL11B, which define genetic types.`}
    const why=[`B: ${B?'✔':'✘'}${c('b19s')||c('b19w')?` (CD19 ${c('b19s')?'strong':'weak'} + ${bOthers} of CD10/CD22/CD79a${t?' — CD79a not counted when T is present':''})`:' (no CD19)'}`,`T: ${t?'✔':'✘'}`,`Myeloid: ${M?'✔':'✘'}${c('m1')?' (MPO)':mono?' (≥2 monocytic markers)':''}`];
    w.querySelector('#mpOut').innerHTML=`<div class="verdict"><b>${v}</b><div class="note">${n}</div></div><div class="verdict"><div class="note">${why.join(' · ')}</div></div>`}
  w.addEventListener('change',out);out()};

W.germ=function(w){
  const D=JSON.parse(document.getElementById(w.dataset.src).textContent);
  const G=['All',...new Set(D.map(x=>x.g))];let cur='All',q='';
  w.innerHTML=`<label for="gmQ" style="display:block;font-weight:600;margin-bottom:.3em">Search a gene, syndrome or feature</label><input id="gmQ" type="search" placeholder="e.g. RUNX1, platelets, monosomy 7" style="width:100%;max-width:420px;padding:.5em .7em;font:inherit;border:1px solid var(--rule);border-radius:8px;background:var(--card);color:var(--ink)"><div class="chips" style="margin:.7em 0">${G.map(g=>`<button class="chip" data-g="${g}" aria-pressed="${g==='All'}">${g}</button>`).join('')}</div><div id="gmB" class="gm-grid"></div><p class="note" id="gmN"></p>`;
  function draw(){const r=D.filter(x=>(cur==='All'||x.g===cur)&&(!q||JSON.stringify(x).toLowerCase().includes(q)));
    w.querySelector('#gmB').innerHTML=r.map(x=>`<div class="gm-card"><div class="gm-h"><b>${x.n}</b><span>${x.g}</span></div><div class="gm-m"><span>Inheritance: ${x.i}</span><span>Age: ${x.a}</span></div><p><b>Mechanism:</b> ${x.m}</p><p><b>Features:</b> ${x.f}</p></div>`).join('')||'<p>No match.</p>';
    w.querySelector('#gmN').textContent=`${r.length} of ${D.length} shown.`}
  w.querySelector('#gmQ').addEventListener('input',e=>{q=e.target.value.trim().toLowerCase();draw()});
  w.querySelectorAll('[data-g]').forEach(b=>b.addEventListener('click',()=>{cur=b.dataset.g;w.querySelectorAll('[data-g]').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()}));
  draw()};

W.ballrisk=function(w){
  const GEN=[['none','Not yet known',''],['hyper','High hyperdiploidy (51–65)','fav'],['etv','ETV6::RUNX1','fav'],['dux','DUX4 rearranged','fav'],['tcf','TCF3::PBX1','int'],['bcr','BCR::ABL1','adv*'],['like','BCR::ABL1-like','adv'],['kmt','KMT2A rearranged','adv'],['hypo','High hypodiploidy (≤43)','adv'],['iamp','iAMP21','adv*'],['hlf','TCF3::HLF','adv'],['il3','IGH::IL3','int'],['nos','B-ALL, NOS','int']];
  const lab={fav:'favourable',int:'intermediate',adv:'adverse','adv*':'adverse, but improved by targeted or intensified therapy'};
  w.innerHTML=`<div class="ir"><label for="br_age">Age (years)<input id="br_age" type="number" inputmode="decimal" min="0" step="0.1" value="4"></label><label for="br_wbc">WBC (× 10⁹/L)<input id="br_wbc" type="number" inputmode="decimal" min="0" step="0.1" value="12"></label><label for="br_chr">Modal chromosome number<input id="br_chr" type="number" inputmode="numeric" min="20" max="90" value="46"></label><label for="br_mrd">End-of-induction MRD (%)<input id="br_mrd" type="number" inputmode="decimal" min="0" step="0.001" value="0.005"></label></div>
  <div class="ir"><label for="br_gen">Genetic subtype<select id="br_gen">${GEN.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label><label for="br_cns">CNS status<select id="br_cns"><option value="1">CNS1: no blasts in CSF</option><option value="2">CNS2: blasts, &lt;5 WBC/µL</option><option value="3">CNS3: ≥5 WBC/µL with blasts, or palsy/mass</option></select></label></div><div class="scr-out" id="brOut" aria-live="polite"></div>`;
  const v=id=>w.querySelector('#br_'+id).value,n=id=>+v(id)||0;
  function out(){
    const age=n('age'),wbc=n('wbc'),ch=n('chr'),mrd=n('mrd'),g=GEN.find(x=>x[0]===v('gen'));
    let pl;if(!ch)pl='—';else if(ch<=31)pl='near-haploid (24–31): high hypodiploid group, poor';else if(ch<=39)pl='low-hypodiploid (32–39): poor; test germline TP53 (Li–Fraumeni)';else if(ch<=43)pl='high-hypodiploid (40–43): poor';else if(ch<=45)pl='near-diploid (44–45): not in the hypodiploid group';else if(ch<=50)pl='diploid or low hyperdiploid (46–50)';else if(ch<=65)pl='high hyperdiploid (51–65): very favourable';else pl='near-triploid or above: beware masked hypodiploidy (doubled clone); check SNP array and DNA index';
    const nci=age>=1&&age<10&&wbc<50;const flags=[];
    if(age<1)flags.push('infant (think KMT2A)');if(age>=10)flags.push('age ≥10');if(wbc>=50)flags.push('WBC ≥50');if(v('cns')==='3')flags.push('CNS3 disease');else if(v('cns')==='2')flags.push('CNS2');if(mrd>=0.01)flags.push(`MRD ${mrd}% (≥0.01%)`);if(g[2].startsWith('adv'))flags.push(g[1]);
    w.querySelector('#brOut').innerHTML=`<div class="verdict"><b>NCI group: ${age<1?'infant protocol':nci?'standard risk':'high risk'}</b><div class="note">Standard risk needs age 1–9.99 years and WBC &lt;50 × 10⁹/L.</div></div>
    <div class="verdict"><b>Ploidy:</b> ${pl}</div>
    <div class="verdict"><b>Genetics:</b> ${g[2]?g[1]+' — '+lab[g[2]]:'complete karyotype, FISH and molecular tests; without them call it B-ALL, not further classified.'}</div>
    <div class="verdict"><b>Adverse features:</b> ${flags.length?flags.join(', '):'none entered'}.<div class="note">Children do better than adults. Early MRD response is the strongest single predictor.</div></div>`}
  w.addEventListener('input',out);w.addEventListener('change',out);out()};

W.cllscore=function(w){
  const M=[['sig','Surface Ig','Weak','Strong'],['cd5','CD5','Positive','Negative'],['cd23','CD23','Positive','Negative'],['fmc7','FMC7','Negative','Positive'],['cd22','CD22 or CD79b','Weak','Strong']];
  const ck=(id,l,v)=>`<label class="chk" style="font-weight:400"><input id="cs_${id}" type="checkbox"${v?' checked':''}> ${l}</label>`;
  w.innerHTML=`<h3 style="margin-top:0">1. Matutes score</h3><div class="ir">${M.map(([id,l,a,b])=>`<label for="cs_${id}">${l}<select id="cs_${id}"><option value="1">${a} (1 point)</option><option value="0">${b} (0)</option></select></label>`).join('')}</div><div class="scr-out" id="csM" aria-live="polite"></div>
  <h3>2. Rai and Binet stage</h3><div class="ir"><label for="cs_lym">Lymphocytes (× 10⁹/L)<input id="cs_lym" type="number" inputmode="decimal" min="0" step="0.1" value="24"></label><label for="cs_hb">Haemoglobin (g/dL)<input id="cs_hb" type="number" inputmode="decimal" min="0" step="0.1" value="12.8"></label><label for="cs_plt">Platelets (× 10⁹/L)<input id="cs_plt" type="number" inputmode="numeric" min="0" value="182"></label></div>
  <div class="ir">${ck('cer','Cervical nodes',1)}${ck('axi','Axillary nodes',1)}${ck('ing','Inguinal nodes',0)}${ck('spl','Spleen palpable',0)}${ck('liv','Liver palpable',0)}</div><div class="scr-out" id="csS" aria-live="polite"></div>`;
  const q=id=>w.querySelector('#cs_'+id),n=id=>+q(id).value||0,c=id=>q(id).checked;
  function out(){
    const sc=M.reduce((a,[id])=>a+ +q(id).value,0);
    const mv=sc>=4?['Typical CLL','Score 4–5. Confirm CD200 bright and cyclin D1 negative.']:sc===3?['Atypical CLL','Score 3. Exclude mantle cell lymphoma with cyclin D1 or SOX11 and FISH for t(11;14).']:['Not CLL: another B-cell lymphoma in leukaemic phase','Score 0–2. Think mantle cell, marginal zone, follicular, hairy cell or lymphoplasmacytic lymphoma.'];
    w.querySelector('#csM').innerHTML=`<div class="verdict"><b>Score ${sc}/5: ${mv[0]}</b><div class="note">${mv[1]}</div></div>`;
    const lym=n('lym'),hb=n('hb'),plt=n('plt'),nodes=c('cer')||c('axi')||c('ing'),org=c('spl')||c('liv');
    const areas=['cer','axi','ing','spl','liv'].filter(c).length;
    let rai,rr;
    if(lym<=5){rai=null}
    else if(plt&&plt<100){rai='IV'}else if(hb&&hb<11){rai='III'}else if(org){rai='II'}else if(nodes){rai='I'}else rai='0';
    rr=rai==='0'?'low risk':rai==='I'||rai==='II'?'intermediate risk':'high risk';
    let bin,br;if((hb&&hb<10)||(plt&&plt<100)){bin='C';br='high risk'}else if(areas>=3){bin='B';br='intermediate risk'}else{bin='A';br='low risk'}
    w.querySelector('#csS').innerHTML=lym<=5?`<div class="verdict"><b>Lymphocytes ≤5 × 10⁹/L</b><div class="note">CLL needs a clonal B-cell count ≥5 × 10⁹/L. Below that, think MBL, or SLL if nodes are enlarged.</div></div>`:
    `<div class="verdict"><b>Rai stage ${rai}: ${rr}</b><div class="note">0 lymphocytosis only; I nodes; II spleen or liver; III Hb &lt;11 g/dL; IV platelets &lt;100 × 10⁹/L.</div></div><div class="verdict"><b>Binet stage ${bin}: ${br}</b> (${areas} of 5 lymphoid areas)<div class="note">A: fewer than 3 areas; B: 3 or more; C: Hb &lt;10 g/dL or platelets &lt;100 × 10⁹/L, whatever the areas. Check that anaemia or thrombocytopenia is not autoimmune before upstaging.</div></div>`}
  w.addEventListener('input',out);w.addEventListener('change',out);out()};

W.blpd=function(w){
  const D=JSON.parse(document.getElementById(w.dataset.src).textContent),K=D.markers;
  w.innerHTML=`<p class="note" style="margin-top:0">Set each marker you know. Leave the rest as "not done".</p><div class="ir bl-grid">${K.map((m,i)=>`<label for="bl_${i}">${m}<select id="bl_${i}"><option value="">not done</option><option value="+">positive</option><option value="-">negative</option></select></label>`).join('')}</div><div class="scr-out" id="blOut" aria-live="polite"></div>`;
  const val=(u,t)=>{t=t.replace(/−/g,'-');if(t==='n/a')return null;const pos={'+':2,'+/-':1,'-/+':-1,'-':-2}[t];if(pos===undefined)return null;return u==='+'?pos:-pos};
  function out(){
    const sel=K.map((_,i)=>w.querySelector('#bl_'+i).value);const used=sel.filter(Boolean).length;
    if(!used){w.querySelector('#blOut').innerHTML='<div class="verdict"><b>Choose at least one marker.</b><div class="note">CD5 and CD10 are the best place to start.</div></div>';return}
    const r=D.rows.map(([name,vals,tip])=>{let s=0,mx=0,mis=[];vals.forEach((t,i)=>{if(!sel[i])return;const v=val(sel[i],t);if(v===null)return;s+=v;mx+=2;if(v<0)mis.push(K[i])});return{name,tip,p:mx?Math.round(50+50*s/mx):0,mis}}).sort((a,b)=>b.p-a.p);
    w.querySelector('#blOut').innerHTML=r.slice(0,4).map((x,i)=>`<div class="verdict"${i?' style="opacity:.85"':''}><b>${x.name}: ${x.p}% match</b><div class="note">${x.tip}${x.mis.length?' Against it: '+x.mis.join(', ')+'.':''}</div></div>`).join('')+'<p class="note">A teaching aid, not a diagnosis: always integrate morphology, histology and genetics.</p>'}
  w.addEventListener('change',out);out()};

W.score=function(w){
  const L=JSON.parse(document.getElementById(w.dataset.src).textContent);let k=0;
  w.innerHTML=(L.length>1?`<div class="ir" role="group" aria-label="Choose a score">${L.map((s,i)=>`<button type="button" class="chip" data-i="${i}" aria-pressed="${i===0}">${s.name}</button>`).join('')}</div>`:'')+'<div class="sc-body"></div>';
  const body=w.querySelector('.sc-body');
  function draw(){const s=L[k];
    body.innerHTML=`<p class="note" style="margin-top:.2rem">${s.intro||''}</p><div class="ir">${s.items.map((it,i)=>`<label class="chk" style="font-weight:400"><input type="${it.g?'radio':'checkbox'}"${it.g?` name="sg${k}-${it.g}"`:''}${it.def?' checked':''} data-j="${i}"> ${it.l}${it.g?` (${it.pts||0})`:(it.pts||1)!==1?` (${it.pts} points)`:''}</label>`).join('')}</div><div class="scr-out" aria-live="polite"></div>`;out()}
  function out(){const s=L[k];const on=[...body.querySelectorAll('input:checked')].map(x=>s.items[+x.dataset.j]);
    const sc=on.reduce((a,it)=>a+(it.g?(it.pts||0):(it.pts||1)),0),ids=on.map(it=>it.id).sort().join(',');
    const b=s.bands.find(b=>b.only!==undefined?b.only.slice().sort().join(',')===ids:sc>=b.min&&sc<=b.max)||{t:'—',d:''};
    body.querySelector('.scr-out').innerHTML=`<div class="verdict"><b>${s.name}: ${sc} point${sc===1?'':'s'}, ${b.t}</b><div class="note">${b.d}</div></div>${s.note?`<p class="note">${s.note}</p>`:''}`}
  w.addEventListener('click',e=>{const c=e.target.closest('.chip');if(!c)return;k=+c.dataset.i;w.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x===c));draw()});
  w.addEventListener('change',out);draw()};

W.pcd=function(w){
  const F=[['sm','Serum M protein (g/dL)',3.4],['um','Urine M protein (mg/24 h)',0],['bm','Clonal marrow plasma cells (%)',18],['flc','Involved/uninvolved FLC ratio',12],['pb','Blood plasma cells (% of WBC)',0]];
  const C=[['c','Hypercalcaemia (Ca >2.75 mmol/L or >0.25 above normal)',0],['r','Renal insufficiency (creatinine >177 µmol/L or CrCl <40) from light chains',0],['a','Anaemia (Hb <10 g/dL or >2 below normal)',0],['b','Lytic bone lesion(s) on CT/PET-CT or X-ray',0],['mri','More than 1 focal lesion (≥5 mm) on MRI',0],['sol','A single biopsy-proven plasmacytoma',0],['igm','The M protein is IgM',0],['am','Amyloid on tissue biopsy',0]];
  w.innerHTML=`<div class="ir">${F.map(([id,l,v])=>`<label for="pc_${id}">${l}<input id="pc_${id}" type="number" inputmode="decimal" min="0" step="0.1" value="${v}"></label>`).join('')}</div><div class="ir">${C.map(([id,l,v])=>`<label class="chk" style="font-weight:400"><input id="pc_${id}" type="checkbox"${v?' checked':''}> ${l}</label>`).join('')}</div><div class="scr-out" id="pcOut" aria-live="polite"></div>`;
  const g=id=>+w.querySelector('#pc_'+id).value||0,c=id=>w.querySelector('#pc_'+id).checked;
  function out(){
    const sm=g('sm'),um=g('um'),bm=g('bm'),flc=g('flc'),pb=g('pb');
    const crab=['c','r','a','b'].filter(c),slim=[];if(bm>=60)slim.push('marrow plasma cells ≥60%');if(flc>=100)slim.push('FLC ratio ≥100');if(c('mri'))slim.push('>1 MRI focal lesion');
    const mde=crab.length||slim.length;const names={c:'C',r:'R',a:'A',b:'B'};
    let dx,d;
    if(c('igm')&&!mde){dx=bm>=10?'IgM: think Waldenström macroglobulinaemia':'IgM MGUS';d=bm>=10?'IgM with ≥10% lymphoplasmacytic infiltrate: see Chapter 22 (MYD88 L265P).':'IgM <3 g/dL, <10% clonal infiltrate, no symptoms. Risk of WM and AL amyloidosis.'}
    else if(pb>=5){dx='Plasma cell leukaemia';d='WHO 5th edition threshold ≥5% circulating plasma cells (older definition >20% or >2 × 10⁹/L). Aggressive; often light chain, IgD or IgE.'}
    else if(mde&&(bm>=10||c('sol'))){dx='Plasma cell myeloma';d='Clonal plasma cells plus a myeloma-defining event: '+[...crab.map(x=>names[x]),...slim].join(', ')+'.'}
    else if(c('sol')&&bm<10&&!mde){dx=bm>0?'Solitary plasmacytoma with minimal marrow involvement':'Solitary plasmacytoma';d=bm>0?'Clonal marrow plasma cells 1–9%: higher risk of progression to myeloma.':'One lesion, no CRAB, no clonal marrow cells. Treated with radiotherapy.'}
    else if(!mde&&(bm>=10||sm>=3||um>=500)){dx='Smouldering myeloma';d='Marrow 10–59% and/or serum M ≥3 g/dL or urine ≥500 mg/24 h, with no myeloma-defining event. Monitor closely; high-risk cases may be treated.'}
    else if(mde&&bm<10){dx='Myeloma-defining event without ≥10% clonal plasma cells';d='Look for a plasmacytoma (biopsy a lesion), repeat a targeted marrow, or find another cause for the CRAB feature.'}
    else if(sm>0||um>0||flc>1.65||flc<0.26&&flc>0){dx=sm>0?'Non-IgM MGUS':'Light-chain MGUS';d='M protein <3 g/dL, marrow <10%, no CRAB. Progression about 1% a year.'}
    else{dx='No plasma cell neoplasm shown';d='Enter the paraprotein and marrow results.'}
    let extra='';
    if(c('am'))extra=`<div class="verdict"><b>AL amyloidosis</b><div class="note">Amyloid with a monoclonal protein: type the fibril (mass spectrometry), stage with NT-proBNP, troponin and FLC. Can coexist with any of the above.</div></div>`;
    if(/MGUS/.test(dx)&&!c('igm')){const rf=[sm>=1.5,flc>1.65||(flc<0.26&&flc>0)].filter(Boolean).length;extra+=`<div class="note">Mayo MGUS risk factors present (non-IgG type also counts; not entered here): ${rf} of M ≥1.5 g/dL and abnormal FLC ratio.</div>`}
    w.querySelector('#pcOut').innerHTML=`<div class="verdict"><b>${dx}</b><div class="note">${d}</div></div>${extra}`}
  w.addEventListener('input',out);w.addEventListener('change',out);out()};

W.riss=function(w){
  w.innerHTML=`<div class="ir"><label for="rs_b2">β2-microglobulin (mg/L)<input id="rs_b2" type="number" inputmode="decimal" min="0" step="0.1" value="4.2"></label><label for="rs_alb">Albumin (g/dL)<input id="rs_alb" type="number" inputmode="decimal" min="0" step="0.1" value="3.2"></label><label for="rs_age">Age<input id="rs_age" type="number" inputmode="numeric" min="0" value="64"></label></div>
  <div class="ir">${[['ldh','LDH above normal'],['p17','del(17p)'],['t414','t(4;14)'],['t1416','t(14;16)'],['q1','1q gain/amplification']].map(([id,l])=>`<label class="chk" style="font-weight:400"><input id="rs_${id}" type="checkbox"> ${l}</label>`).join('')}</div><div class="scr-out" id="rsOut" aria-live="polite"></div>`;
  const g=id=>+w.querySelector('#rs_'+id).value||0,c=id=>w.querySelector('#rs_'+id).checked;
  function out(){const b2=g('b2'),al=g('alb'),age=g('age');
    const iss=b2&&b2<3.5&&al>=3.5?1:b2>=5.5?3:2;const hr=c('p17')||c('t414')||c('t1416');
    const riss=iss===1&&!hr&&!c('ldh')?1:iss===3&&(hr||c('ldh'))?3:2;
    const imwg=(iss<=2&&age<55&&!c('t414')&&!c('p17')&&!c('q1'))?'low':(iss>=2&&(c('t414')||c('p17')))?'high':'standard';
    const R=['','I','II','III'];
    w.querySelector('#rsOut').innerHTML=`<div class="verdict"><b>ISS stage ${R[iss]}</b><div class="note">I: β2M &lt;3.5 mg/L and albumin ≥3.5 g/dL; III: β2M ≥5.5 mg/L; II: neither.</div></div><div class="verdict"><b>R-ISS stage ${R[riss]}</b><div class="note">I: ISS I, normal LDH, no del(17p), t(4;14) or t(14;16). III: ISS III with high LDH or one of those lesions. II: all others.</div></div><div class="verdict"><b>IMWG risk: ${imwg}</b><div class="note">Low: ISS I/II, age &lt;55, no t(4;14), del(17p) or 1q gain. High: ISS II/III with t(4;14) or del(17p).</div></div>`}
  w.addEventListener('input',out);w.addEventListener('change',out);out()};

W.etp=function(w){
  const F=[['cd1a','CD1a (% of blasts)',2],['cd8','CD8 (% of blasts)',1],['cd5','CD5 (% of blasts)',40],['mye','Highest myeloid or stem marker: CD34, CD117, HLA-DR, CD13, CD33, CD11b, CD65 (% of blasts)',60],['mpo','MPO by flow (% of blasts)',0]];
  w.innerHTML=`<label class="chk" style="font-weight:400"><input id="et_c3" type="checkbox" checked> Cytoplasmic CD3 positive</label><div class="ir">${F.map(([id,l,v])=>`<label for="et_${id}">${l}<input id="et_${id}" type="number" inputmode="decimal" min="0" max="100" value="${v}"></label>`).join('')}</div><div class="scr-out" id="etOut" aria-live="polite"></div>`;
  const g=id=>+w.querySelector('#et_'+id).value||0;
  function out(){let dx,d;const c3=w.querySelector('#et_c3').checked,ok1=g('cd1a')<5&&g('cd8')<5,my=g('mye')>=25;
    if(!c3){dx='Not T lineage';d='Without cytoplasmic CD3 think AML, B-ALL, NK-lineage leukaemia or acute undifferentiated leukaemia.'}
    else if(g('mpo')>=10){dx='Consider mixed-phenotype acute leukaemia, T/myeloid';d='MPO in ≥10% of blasts by flow (or ≥3% by cytochemistry) excludes ETP-ALL (Chapter 18).'}
    else if(ok1&&my&&g('cd5')<75){dx='Early T-precursor ALL (ETP-ALL)';d='CD1a and CD8 under 5%, CD5 under 75% (or dim), and ≥25% of blasts carry a myeloid or stem marker. FLT3, NRAS, JAK3, RUNX1, EZH2 mutations; NOTCH1 uncommon.'}
    else if(ok1&&my){dx='Near-ETP ALL';d='ETP pattern but CD5 on 75% or more of blasts.'}
    else{dx='T-ALL, NOS (non-ETP)';d=g('cd1a')>=5?'CD1a expression points to the cortical (T-III) stage, which carries the best outlook.':'Classify by stage with CD1a, CD4/CD8 and surface CD3.'}
    w.querySelector('#etOut').innerHTML=`<div class="verdict"><b>${dx}</b><div class="note">${d}</div></div>`}
  w.addEventListener('input',out);w.addEventListener('change',out);out()};

W.atll=function(w){
  const F=[['ly','Lymphocytes (× 10⁹/L)',5.6],['ab','Abnormal T cells in blood (%)',12],['ldh','LDH (× upper limit of normal)',1.2],['ca','Corrected calcium (mmol/L)',2.4]];
  const C=[['hiv','Anti-HTLV-1 antibody positive',1],['ln','Histology-proven lymphadenopathy',0],['sk','Skin or lung tumour lesions',0],['lv','Liver or spleen involvement',0],['ext','CNS, bone, ascites, pleural effusion or gut involvement',0],['fc','Flower cells present',0],['unf','BUN above normal or albumin below normal',0]];
  w.innerHTML=`<div class="ir">${F.map(([id,l,v])=>`<label for="at_${id}">${l}<input id="at_${id}" type="number" inputmode="decimal" min="0" step="0.1" value="${v}"></label>`).join('')}</div><div class="ir">${C.map(([id,l,v])=>`<label class="chk" style="font-weight:400"><input id="at_${id}" type="checkbox"${v?' checked':''}> ${l}</label>`).join('')}</div><div class="scr-out" id="atOut" aria-live="polite"></div>`;
  const g=id=>+w.querySelector('#at_'+id).value||0,c=id=>w.querySelector('#at_'+id).checked;
  function out(){let dx,d;const ly=g('ly'),ab=g('ab'),ldh=g('ldh'),ca=g('ca');
    if(!c('hiv')){dx='Not ATLL';d='ATLL needs HTLV-1 infection (antibody, or clonal proviral integration). Consider Sézary syndrome, T-PLL or PTCL.'}
    else if(ly<4&&ldh<=1.5&&ca<2.74&&!c('ln')&&!c('lv')&&!c('ext')&&(ab>=5||c('sk'))){dx='Smouldering ATLL (indolent)';d='Lymphocytes <4 × 10⁹/L, ≥5% abnormal T cells (or a biopsy-proven skin/lung lesion if <5%), LDH ≤1.5× normal, no hypercalcaemia, nodes or organ disease beyond skin and lung.'}
    else if(ly>=4&&ab>0&&ldh<=2&&ca<2.74&&!c('ext')){const unf=ldh>1||c('unf');dx=`Chronic ATLL, ${unf?'unfavourable (aggressive)':'favourable (indolent)'}`;d='Lymphocytes ≥4 × 10⁹/L, LDH ≤2× normal, calcium <2.74, no CNS, bone, effusion or gut disease. Unfavourable if LDH or BUN is high or albumin low.'}
    else if(ly<4&&ab<=1&&c('ln')){dx='Lymphoma-type ATLL (aggressive)';d='Biopsy-proven lymphadenopathy with ≤1% abnormal T cells in blood.'}
    else{dx='Acute ATLL (aggressive)';d='Diagnosed by exclusion of the other three types: usually flower cells, high LDH, hypercalcaemia and organ involvement.'}
    w.querySelector('#atOut').innerHTML=`<div class="verdict"><b>${dx}</b><div class="note">${d}</div></div><p class="note">Shimoyama classification, as tabulated in Dr Abeer's notes (p 210). Aggressive types (acute, lymphoma, unfavourable chronic) share a poor prognosis.</p>`}
  w.addEventListener('input',out);w.addEventListener('change',out);out()};

/* ---------- Chapters 26–27: CD45/SSC gate explorer ---------- */
W.gate=function(w){
  const D=JSON.parse(document.getElementById(w.dataset.src).textContent),S=D.scenarios;
  const C={haem:'#b4304a',blue:'#4467b0',purple:'#7650a8',green:'#2f8a57',grey:'#7d7682',amber:'#b98316',orange:'#c26128',teal:'#1f8a8a'};
  let k=0,mode='explore',sel=-1,target=-1,score=[0,0],answered=false;
  w.innerHTML=`<div class="chips" role="group" aria-label="Choose a sample">${S.map((s,i)=>`<button type="button" class="chip" data-s="${i}" aria-pressed="${i===0}">${s.name}</button>`).join('')}</div>
  <div class="gt-wrap"><div class="gt-plot"></div><div class="gt-side"><div class="ir" role="group" aria-label="Mode"><button type="button" class="chip" data-m="explore" aria-pressed="true">Explore</button><button type="button" class="chip" data-m="quiz" aria-pressed="false">Test yourself</button></div><div class="gt-info scr-out" aria-live="polite"></div></div></div>`;
  const plot=w.querySelector('.gt-plot'),info=w.querySelector('.gt-info');
  function rnd(seed){return()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646}}
  function draw(){
    const s=S[k],r=rnd(11+k*97),P=300,X=v=>30+v*P,Y=v=>10+(1-v)*P;
    let dots='',hits='',labs='';
    s.pops.forEach((p,i)=>{const col=C[p.c]||p.c;
      for(let j=0;j<(p.k||120);j++){const a=r()*6.283,q=Math.sqrt(r());dots+=`<circle cx="${X(p.x+p.rx*q*Math.cos(a)).toFixed(1)}" cy="${Y(p.y+p.ry*q*Math.sin(a)).toFixed(1)}" r="1.8" fill="${col}" opacity=".75"/>`}
      const on=i===sel;
      hits+=`<ellipse class="gt-hit" data-i="${i}" tabindex="0" role="button" aria-label="${mode==='quiz'?'Population '+(i+1):p.n}" cx="${X(p.x)}" cy="${Y(p.y)}" rx="${p.rx*P+10}" ry="${p.ry*P+10}" fill="transparent" stroke="${on?col:'transparent'}" stroke-width="2.5" stroke-dasharray="${on?'6 4':'0'}"/>`;
      if(mode==='explore'){const an=p.x<.25?'start':p.x>.78?'end':'middle',lx=an==='start'?Math.max(p.x-p.rx,.01):an==='end'?Math.min(p.x+p.rx,.99):p.x;labs+=`<text x="${X(lx)}" y="${Y(p.y+p.ry)-8}" text-anchor="${an}" font-size="12.5" font-weight="700" fill="${col}" pointer-events="none">${p.n}</text>`}});
    plot.innerHTML=`<svg viewBox="0 0 340 350" role="img" aria-label="CD45 versus side scatter dot plot: ${s.name}"><rect x="30" y="10" width="300" height="300" fill="var(--card)" stroke="var(--rule)"/>${[1,2,3].map(t=>`<line x1="${30+t*75}" y1="10" x2="${30+t*75}" y2="310" stroke="var(--rule)" stroke-dasharray="2 4"/>`).join('')}${dots}${hits}${labs}<text x="180" y="334" text-anchor="middle" font-size="12" fill="var(--ink-2)">CD45 (log) →</text><text x="14" y="160" text-anchor="middle" font-size="12" fill="var(--ink-2)" transform="rotate(-90 14 160)">Side scatter →</text></svg>`;
    w.querySelectorAll('[data-s]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===k));
    w.querySelectorAll('[data-m]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===mode))}
  function say(){const s=S[k];
    if(mode==='explore'){const p=s.pops[sel];info.innerHTML=p?`<div class="verdict"><b>${p.n}</b><div class="note">${p.d}</div></div>`:`<div class="verdict"><b>${s.name}</b><div class="note">${s.note} Tap a cluster to learn what it is.</div></div>`}
    else{const p=s.pops[target];info.innerHTML=`<div class="verdict"><b>Tap the ${p.n.toLowerCase()}</b><div class="note">Score ${score[0]} of ${score[1]}.</div></div><div class="gt-fb"></div>`}}
  function newQ(){const n=S[k].pops.length;let t;do t=Math.floor(Math.random()*n);while(n>1&&t===target);target=t;sel=-1;answered=false;draw();say()}
  function pick(i){if(mode==='explore'){sel=i;draw();say();return}
    if(answered)return;answered=true;score[1]++;const s=S[k],ok=i===target;if(ok)score[0]++;sel=target;draw();say();
    info.querySelector('.gt-fb').outerHTML=`<div class="verdict" style="border-left:4px solid ${ok?'var(--ok)':'var(--haem)'}"><b>${ok?'Correct.':'Not quite: you tapped the '+s.pops[i].n.toLowerCase()+'.'}</b><div class="note">${s.pops[target].d}</div><p style="margin:.5rem 0 0"><button type="button" class="btn" data-next="1">Next question</button></p></div>`}
  w.addEventListener('click',e=>{const h=e.target.closest('.gt-hit');if(h){pick(+h.dataset.i);return}
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.s!==undefined){k=+b.dataset.s;sel=-1;if(mode==='quiz')newQ();else{draw();say()}}
    else if(b.dataset.m){mode=b.dataset.m;sel=-1;score=[0,0];if(mode==='quiz')newQ();else{draw();say()}}
    else if(b.dataset.next)newQ()});
  w.addEventListener('keydown',e=>{const h=e.target.closest('.gt-hit');if(h&&(e.key==='Enter'||e.key===' ')){e.preventDefault();pick(+h.dataset.i)}});
  draw();say()};

/* ---------- Chapter 27: light-chain and CD4/CD8 ratio ---------- */
W.kl=function(w){
  w.innerHTML=`<div class="ir"><label for="kl_m">Population<select id="kl_m"><option value="b">Gated B cells: surface κ and λ</option><option value="p">Gated plasma cells: cytoplasmic κ and λ</option><option value="t">Gated T cells: CD4 and CD8</option></select></label><label for="kl_a"><span id="kl_la">κ positive (% of gated cells)</span><input id="kl_a" type="number" min="0" max="100" step="0.1" value="60"></label><label for="kl_b"><span id="kl_lb">λ positive (% of gated cells)</span><input id="kl_b" type="number" min="0" max="100" step="0.1" value="35"></label></div><div class="scr-out" id="klOut" aria-live="polite"></div>`;
  const q=id=>w.querySelector('#'+id),f=x=>x>=10?x.toFixed(0):x.toFixed(1);
  let last='b';
  function out(){const m=q('kl_m').value;
    if(m!==last){last=m;const t=m==='t';q('kl_la').textContent=t?'CD4 positive (% of T cells)':'κ positive (% of gated cells)';q('kl_lb').textContent=t?'CD8 positive (% of T cells)':'λ positive (% of gated cells)';q('kl_a').value=t?62:m==='p'?55:60;q('kl_b').value=t?30:m==='p'?45:35}
    const a=+q('kl_a').value,b=+q('kl_b').value;let v,n,extra='';
    if(!(a>=0&&b>=0)||a+b===0){q('klOut').innerHTML='<div class="verdict"><b>Enter both percentages.</b></div>';return}
    const r=b?a/b:Infinity,rs=b?f(r):'∞';
    if(m==='b'){const neg=100-a-b;
      if(r>3){v=`κ:λ ${rs}:1, kappa restricted`;n='A ratio above about 3:1 suggests a monoclonal κ B-cell population. Check that the restricted cells share one phenotype (CD5, CD10, CD20 intensity, size).'}
      else if(r<0.3){v=`κ:λ ${rs}:1 (λ:κ ${a?f(b/a):'∞'}:1), lambda restricted`;n='A ratio below about 0.3:1 suggests a monoclonal λ B-cell population.'}
      else{v=`κ:λ ${rs}:1, polyclonal pattern`;n='Within the usual range (roughly 0.5 to 3). A small clone can hide among normal B cells, so gate on the abnormal population (for example CD5+ or CD10+ B cells) and look again.'}
      if(neg>=25)extra=`<div class="verdict"><b>${f(neg)}% of B cells lack surface light chain</b><div class="note">sIg-negative B cells: consider CLL (very dim sIg), follicular lymphoma, DLBCL, PMBL, plasma cells, or B lymphoblasts and haematogones (CD10+, CD34/TdT+).</div></div>`}
    else if(m==='p'){
      if(r>=8){v=`κ:λ ${rs}:1, monoclonal κ plasma cells`;n='Dr Abeer\'s notes: a ratio of 8 or more κ to 1 λ strongly suggests a monoclonal κ population.'}
      else if(b/a>=4){v=`λ:κ ${f(b/a)}:1, monoclonal λ plasma cells`;n='Even 4 λ to 1 κ indicates a monoclonal λ population, because normal plasma cells favour κ.'}
      else{v=`κ:λ ${rs}:1, not clearly clonal`;n='Look for an aberrant phenotype instead: CD45−, CD19−, CD56+, CD38 bright with CD20−. Neoplastic plasma cells may be few in a mixed sample.'}}
    else{
      if(r>10){v=`CD4:CD8 ${rs}:1, marked CD4 excess`;n='A ratio above 10 with an expanded CD4 population is one of the Sézary syndrome blood criteria, especially with loss of CD7 or CD26. The ratio alone does not prove clonality: confirm with TCR studies.'}
      else if(r<1){v=`CD4:CD8 ${rs}:1, inverted`;n='Seen in viral infection (EBV, CMV, HIV), after transplant, and in CD8+ neoplasms such as T-LGL leukaemia. Look for loss of CD5 or CD7 and NK markers (CD57, CD16).'}
      else if(r>4){v=`CD4:CD8 ${rs}:1, raised`;n='Mildly raised. Normal blood is about 2:1. Check for an expanded CD4 population with abnormal pan-T markers (CD7 or CD26 loss, dim CD3).'}
      else{v=`CD4:CD8 ${rs}:1, normal range`;n='Normal blood is about 2:1. A normal ratio does not exclude a T-cell neoplasm: residual benign T cells can mask a small clone.'}
      if(a+b>110)extra='<div class="verdict"><b>CD4 and CD8 add up to more than 100%</b><div class="note">Suggests CD4+CD8+ double-positive cells: think T-ALL (cortical), some T-PLL.</div></div>';
      else if(a+b<70)extra='<div class="verdict"><b>Many T cells lack both CD4 and CD8</b><div class="note">Double-negative T cells: γδ T cells, hepatosplenic T-cell lymphoma, T-PLL, ALPS (αβ double-negative), or NK cells if CD3 is absent.</div></div>'}
    q('klOut').innerHTML=`<div class="verdict"><b>${v}</b><div class="note">${n}</div></div>${extra}<p class="note">Thresholds differ between laboratories. Always read the ratio together with the phenotype of the cells.</p>`}
  w.addEventListener('input',out);w.addEventListener('change',out);out()};

/* ---------- Chapter 27: EGIL score ---------- */
W.egil=function(w){
  const L=[['B','B lymphoid',[['CD79a',2],['Cytoplasmic IgM',2],['Cytoplasmic CD22',2],['CD19',1],['CD10',1],['CD20',1],['TdT',.5],['CD24',.5]]],
    ['T','T lymphoid',[['CD3 (membrane or cytoplasmic)',2],['Anti-TCR α/β',2],['Anti-TCR γ/δ',2],['CD2',1],['CD5',1],['CD8',1],['CD10',1],['TdT',.5],['CD1a',.5],['CD7',.5]]],
    ['M','Myeloid',[['Anti-MPO (or lysozyme)',2],['CD13',1],['CD33',1],['CDw65',1],['CD117',1],['CD14',.5],['CD15',.5],['CD64',.5]]]];
  w.innerHTML=`<div class="eg-grid">${L.map(([k,h,I])=>`<fieldset class="eg-col"><legend>${h}</legend>${I.map(([l,p],i)=>`<label class="chk" style="font-weight:400"><input type="checkbox" data-k="${k}" data-p="${p}"> ${l} <span class="note">(${p})</span></label>`).join('')}</fieldset>`).join('')}</div><div class="scr-out" id="egOut" aria-live="polite"></div>`;
  function out(){const s={B:0,T:0,M:0};w.querySelectorAll('input:checked').forEach(x=>s[x.dataset.k]+=+x.dataset.p);
    const hi=Object.keys(s).filter(k=>s[k]>2),N={B:'B',T:'T',M:'myeloid'};let v,n;
    if(hi.length>=2){v=`Biphenotypic acute leukaemia (${hi.map(k=>N[k]).join('/')})`;n='EGIL: more than 2 points in two lineages, one of them usually myeloid. WHO now calls this mixed-phenotype acute leukaemia; check the WHO criteria below.'}
    else if(hi.length===1){v=`${hi[0]==='M'?'AML':N[hi[0]]+'-ALL'}, single lineage`;n='Only one lineage scores above 2. Points in another lineage are aberrant expression, not MPAL.'}
    else{v='No lineage scores above 2';n='Consider acute undifferentiated leukaemia if only CD34, HLA-DR, TdT or CD38 are present; extend the panel.'}
    w.querySelector('#egOut').innerHTML=`<div class="verdict"><b>${v}</b><div class="note">B ${s.B} · T ${s.T} · Myeloid ${s.M} points. ${n}</div></div><p class="note">EGIL 1995 score, kept for teaching. Diagnosis today uses the WHO lineage criteria.</p>`}
  w.addEventListener('change',out);out()};

/* ---------- more videos list (switches the chapter player) ---------- */
W.vmore=function(w){const L=data(w);const pl=w.previousElementSibling&&w.previousElementSibling.classList.contains('video')?w.previousElementSibling:null;
  const first=pl?{v:pl.dataset.video,t:pl.dataset.title,list:pl.dataset.list}:null;const all=first?[first,...L]:L;
  w.innerHTML=`<div class="vm-h"><span class="eyebrow">Dr Abeer's lectures for this chapter · ${all.length}</span></div><ol class="vm-list">${all.map((x,i)=>{const href=x.v?`https://www.youtube.com/watch?v=${x.v}${x.list?'&list='+x.list:''}`:`https://www.youtube.com/playlist?list=${x.list}`;
    return `<li><button type="button" class="vm-it${i===0&&first?' on':''}" data-i="${i}"${x.v?'':' data-pl="1"'}>${x.v?`<img src="https://i.ytimg.com/vi/${x.v}/mqdefault.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`:'<span class="vm-pl" aria-hidden="true">☰</span>'}<span class="vm-t">${esc(x.t)}${x.short?' <small>short</small>':''}${x.v?'':' <small>playlist</small>'}</span></button><a class="vm-yt" href="${href}" target="_blank" rel="noopener" aria-label="Open ${esc(x.t)} on YouTube">YouTube ↗</a></li>`}).join('')}</ol>`;
  w.addEventListener('click',e=>{const b=e.target.closest('.vm-it');if(!b)return;const x=all[+b.dataset.i];
    if(!x.v||!pl){window.open(`https://www.youtube.com/playlist?list=${x.list}`,'_blank','noopener');return}
    pl.dataset.video=x.v;pl.dataset.title=x.t;if(x.list)pl.dataset.list=x.list;else delete pl.dataset.list;pl.dataset.sub=x.short?'Hematology Short Trips':'';
    video(pl);w.querySelectorAll('.vm-it').forEach(y=>y.classList.toggle('on',y===b));
    const p=pl.querySelector('button.play');if(p)p.click();pl.scrollIntoView({block:'nearest',behavior:'smooth'})})};

/* ---------- animated diagrams ---------- */
let ANI=0;
function animFigures(root){root.querySelectorAll('figure.redraw > img[src$=".svg"]').forEach(img=>{
  if(img.closest('figure').querySelector('.an-bar'))return;
  const bar=document.createElement('div');bar.className='an-bar';
  bar.innerHTML=`<button type="button" class="btn sm an-go"><span aria-hidden="true">▶</span> Animate</button>`;
  img.after(bar);bar.querySelector('.an-go').onclick=()=>animStart(img,bar)})}
async function animStart(img,bar){
  let txt;try{txt=await (await fetch(img.getAttribute('src'))).text()}catch(e){bar.insertAdjacentHTML('beforeend','<span class="note">Could not load the diagram.</span>');return}
  const k='an'+(++ANI)+'_';txt=txt.replace(/id="([^"]+)"/g,`id="${k}$1"`).replace(/url\(#([^)]+)\)/g,`url(#${k}$1)`);
  const box=document.createElement('div');box.className='an-box';box.innerHTML=txt;const svg=box.querySelector('svg');
  svg.removeAttribute('width');svg.removeAttribute('height');svg.setAttribute('role','img');svg.setAttribute('aria-label',img.alt);
  img.hidden=true;img.after(box);
  const els=[...svg.querySelectorAll('rect,circle,ellipse,path,line,polyline,polygon,text,image')].filter(e=>!e.parentNode.closest('defs,marker,text')&&!(e.tagName==='rect'&&e===svg.querySelector(':scope > rect')));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n=els.length,gap=Math.max(4,Math.min(140,7500/n));let s=0;
  const T=els.map(e=>{const arrow=e.hasAttribute('marker-end')||e.tagName==='line'||(e.tagName==='path'&&e.getAttribute('fill')==='none');
    let L=0;if(arrow&&e.getTotalLength)try{L=e.getTotalLength()}catch(_){}
    const o={e,arrow:arrow&&L>4,L,s,d:arrow?650:380,m:e.getAttribute('marker-end'),ms:e.getAttribute('marker-start')};
    s+=arrow?gap*2.5:(e.tagName==='text'?gap*1.2:gap);return o});
  if(s>6500){const f=6500/s;T.forEach(o=>o.s*=f);s=6500}
  const end=s+700;let t=0,last=0,play=true,raf=0,flows=[];
  function frame(now){const dt=last?Math.min(64,now-last):16;last=now;if(play)t+=dt;
    for(const o of T){const p=Math.max(0,Math.min(1,(t-o.s)/o.d));
      if(o.arrow){o.e.style.strokeDasharray=o.L;o.e.style.strokeDashoffset=o.L*(1-p);o.e.style.opacity=p>0?1:0;
        if(p<1){o.e.removeAttribute('marker-end');o.e.removeAttribute('marker-start')}else{if(o.m)o.e.setAttribute('marker-end',o.m);if(o.ms)o.e.setAttribute('marker-start',o.ms)}}
      else o.e.style.opacity=p}
    upd();
    if(t<end)raf=requestAnimationFrame(frame);else{raf=0;T.forEach(o=>{if(o.arrow){o.e.style.strokeDasharray='';o.e.style.strokeDashoffset=''}});if(!reduce)startFlow();upd()}}
  function startFlow(){stopFlow();const NS='http://www.w3.org/2000/svg';
    T.filter(o=>o.arrow&&o.L>30).forEach((o,i)=>{const e=o.e;let d=e.getAttribute('d');
      if(e.tagName==='line')d=`M${e.getAttribute('x1')} ${e.getAttribute('y1')}L${e.getAttribute('x2')} ${e.getAttribute('y2')}`;
      if(!d)return;const col=e.getAttribute('stroke')||'#a3223a';const dur=Math.max(1.4,o.L/90);
      for(let j=0;j<2;j++){const c=document.createElementNS(NS,'circle');c.setAttribute('r','3.6');c.setAttribute('fill',col);c.setAttribute('class','an-dot');
        const am=document.createElementNS(NS,'animateMotion');am.setAttribute('dur',dur+'s');am.setAttribute('repeatCount','indefinite');am.setAttribute('path',d);am.setAttribute('begin',(-(dur/2)*j-(i%5)*.23)+'s');
        c.appendChild(am);svg.appendChild(c);flows.push(c)}});
    if(!play)svg.pauseAnimations()}
  function stopFlow(){flows.forEach(c=>c.remove());flows=[]}
  function upd(){bar.querySelector('[data-a="pp"]').innerHTML=play&&(raf||flows.length)?'<span aria-hidden="true">❚❚</span> Pause':'<span aria-hidden="true">▶</span> Play'}
  bar.innerHTML=`<button type="button" class="btn sm" data-a="pp"></button><button type="button" class="btn sm" data-a="re"><span aria-hidden="true">↺</span> Replay</button><button type="button" class="btn sm" data-a="st">Still image</button><span class="note an-hint">${reduce?'Reduced motion is on: moving dots are off.':'Dots follow each arrow, like flow along the pathway.'}</span>`;
  bar.onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
    if(a==='pp'){play=!play;if(play){svg.unpauseAnimations();if(!raf&&t<end){last=0;raf=requestAnimationFrame(frame)}}else svg.pauseAnimations();upd()}
    else if(a==='re'){stopFlow();svg.unpauseAnimations();t=0;last=0;play=true;if(!raf)raf=requestAnimationFrame(frame);upd()}
    else if(a==='st'){cancelAnimationFrame(raf);box.remove();img.hidden=false;bar.innerHTML=`<button type="button" class="btn sm an-go"><span aria-hidden="true">▶</span> Animate</button>`;bar.querySelector('.an-go').onclick=()=>animStart(img,bar);bar.onclick=null}};
  raf=requestAnimationFrame(frame);upd()}

/* ---------- 3D lab (lazy-loads three.js) ---------- */
const L3META={endo:['Endothelium in haemostasis','One vessel wall, six scenes: the barrier, prostacyclin and nitric oxide, the anticoagulant surface, fibrinolysis, then injury and the switch to a procoagulant surface.'],endoac:['Natural anticoagulants on the endothelium','Watch antithrombin on heparan sulphate, TFPI, thrombomodulin and activated protein C at work. Compare factor V Leiden and protein C deficiency.'],endovwf:['Von Willebrand factor release and ADAMTS13','Weibel–Palade bodies release ultra-large strings that catch platelets until ADAMTS13 trims them. Compare TTP.'],pnh:['Complement and PNH','See CD55 and CD59 on their GPI anchors protect a red cell, then watch C3b and the membrane attack complex punch holes in a PNH cell. Compare eculizumab and proximal inhibitors.'],fib:['Fibrinolysis','Watch tPA and plasminogen meet on fibrin, plasmin cut the fibres and D-dimer break free, then PAI-1 and α2-antiplasmin shut it down. Compare tranexamic acid, thrombolysis and high PAI-1.'],iron:['Iron absorption and hepcidin','Follow iron from the gut lumen through DMT1, ferritin and ferroportin onto transferrin, and see how hepcidin shuts the gate. Compare iron deficiency, inflammation and haemochromatosis.'],
  coag:['Coagulation on cell surfaces','Initiation on the tissue-factor cell, amplification and propagation on the platelet, then fibrin. Compare haemophilia A and B, and heparin with antithrombin.'],
  hb:['Haemoglobin molecule','Watch oxygen load cooperatively as the molecule switches from T to R and 2,3-DPG leaves. Compare HbF and HbS, and see sickle fibres form.'],
  membrane:['Red cell membrane','See the lipid bilayer, band 3, ankyrin and the spectrin net. Stretch it, then compare a vertical defect (spherocytosis) with a horizontal one (elliptocytosis).'],
  platelet:['Platelet activation','Watch a platelet stick, change shape, release its granules and recruit partners. Compare with Bernard–Soulier, von Willebrand disease, Glanzmann and storage pool disease.'],
  rbc:['Red cell shapes','Turn a normal red cell into a spherocyte, target cell, sickle cell and more. Cut it in half to see the profile, or view it from above as on a film.']};
function loadJS(src){return new Promise((ok,no)=>{const old=document.querySelector('script[data-l3="'+src+'"]');if(old){if(old.dataset.ready)ok();else{old.addEventListener('load',ok);old.addEventListener('error',no)}return}
  const s=document.createElement('script');s.src=src;s.dataset.l3=src;s.onload=()=>{s.dataset.ready=1;ok()};s.onerror=no;document.head.appendChild(s)})}
/* ---------- Generic differential diagnosis ranker (data-src JSON {f:[[id,label,group]],dx:[{n,y:[ids],x:[ids],d}]}) ---------- */
W.ddx=function(w){const D=JSON.parse(document.getElementById(w.dataset.src).textContent);
  const groups=[...new Set(D.f.map(f=>f[2]||''))];
  w.innerHTML=groups.map(g=>`<div class="dsec">${g?`<div class="eyebrow">${g}</div>`:''}<div class="ir">${D.f.filter(f=>(f[2]||'')===g).map(f=>`<label class="chk" style="font-weight:400"><input type="checkbox" data-f="${f[0]}"> ${f[1]}</label>`).join('')}</div></div>`).join('')+
    `<div class="ir"><button type="button" class="btn sm" data-clear>Clear all</button></div><div class="scr-out" aria-live="polite"></div>`;
  const out=w.querySelector('.scr-out');
  function r(){const on=new Set([...w.querySelectorAll('input:checked')].map(x=>x.dataset.f));
    if(!on.size){out.innerHTML=`<p class="note">Tick the findings you have. The causes that fit best rise to the top.</p>`;return}
    const L=D.dx.map(d=>{const hit=d.y.filter(f=>on.has(f)).length,miss=(d.x||[]).filter(f=>on.has(f)).length;return{d,hit,miss,s:hit*2-miss*3-(d.y.length?0:1)}}).filter(o=>o.hit>0&&o.s>0).sort((a,b)=>b.s-a.s||b.hit/b.d.y.length-a.hit/a.d.y.length).slice(0,6);
    out.innerHTML=L.length?`<div class="verdict"><b>Best fits</b><ol>${L.map(o=>`<li><b>${o.d.n}</b> <span class="note">(${o.hit} of ${o.d.y.length} features${o.miss?`, ${o.miss} against`:''})</span><div class="note">${o.d.d}</div></li>`).join('')}</ol></div>`:`<div class="verdict">No cause matches this combination well. Re-check the findings or widen the work-up.</div>`}
  w.addEventListener('change',r);w.querySelector('[data-clear]').onclick=()=>{w.querySelectorAll('input').forEach(x=>x.checked=false);r()};r()};

/* ---------- Aplastic anaemia: criteria and severity ---------- */
W.aasev=function(w){
  const f=(id,l,v,st)=>`<label for="aa_${id}">${l}<input id="aa_${id}" type="number" inputmode="decimal" min="0" step="${st||1}" value="${v}"></label>`;
  w.innerHTML=`<div class="ir">${f('hb','Hb (g/dL)',7.8,.1)}${f('plt','Platelets (×10⁹/L)',14)}${f('anc','Neutrophils (×10⁹/L)',.4,.01)}${f('ret','Reticulocytes (×10⁹/L)',15)}</div>
  <div class="ir">${f('cel','Marrow cellularity (%)',15)}${f('res','Residual haemopoietic cells (% of cellular marrow)',40)}</div>
  <div class="ir"><label class="chk" style="font-weight:400"><input id="aa_abn" type="checkbox"> Abnormal cells, blasts, fibrosis or infiltration in the marrow</label></div><div class="scr-out" aria-live="polite"></div>`;
  const g=id=>+w.querySelector('#aa_'+id).value;
  function r(){const hb=g('hb'),plt=g('plt'),anc=g('anc'),ret=g('ret'),cel=g('cel'),res=g('res'),abn=w.querySelector('#aa_abn').checked;
    const two=[hb<10,plt<100,anc<1.5].filter(Boolean).length,hypo=cel<25||(cel<=50&&res<30);
    let t,d;
    if(abn){t='Not aplastic anaemia';d='Aplastic anaemia needs a hypocellular marrow with no abnormal infiltrate and normal reticulin. Think of hypoplastic MDS, hairy cell leukaemia, myelofibrosis or marrow infiltration.'}
    else if(two<2){t='Criteria not met';d='At least two of Hb under 10 g/dL, platelets under 100 ×10⁹/L and neutrophils under 1.5 ×10⁹/L are needed.'}
    else if(!(cel<50)){t='Criteria not met';d='The marrow is not hypocellular. Look for peripheral destruction (hypersplenism, immune) or ineffective haemopoiesis (megaloblastic anaemia, MDS).'}
    else{const sev=[anc<.5,plt<20,ret<20].filter(Boolean).length>=2&&hypo;
      if(sev&&anc<.2){t='Very severe aplastic anaemia';d='Severe criteria plus neutrophils under 0.2 ×10⁹/L. Highest infection risk: isolation, urgent HLA typing and transplant or ATG with ciclosporin.'}
      else if(sev){t='Severe aplastic anaemia';d='Cellularity under 25% (or 25–50% with under 30% residual haemopoietic cells) and two of: neutrophils under 0.5, platelets under 20, reticulocytes under 20 ×10⁹/L.'}
      else{t='Non-severe aplastic anaemia';d='Fulfils the diagnostic criteria but not the severity criteria. Monitor closely; treat if transfusion dependent.'}}
    w.querySelector('.scr-out').innerHTML=`<div class="verdict"><b>${t}</b><div class="note">${d}</div></div><p class="note">Diagnosis needs all three: two cytopenias, a hypocellular marrow, and no abnormal cells. Exclude inherited marrow failure, PNH, MDS and megaloblastic anaemia first.</p>`}
  w.addEventListener('input',r);w.addEventListener('change',r);r()};

/* ---------- Clickable map of the spleen ---------- */
W.spleen=function(w){
  const Z={cap:['Capsule and trabeculae','A dense fibrous capsule sends trabeculae inwards. They support the organ and carry the trabecular arteries and veins.'],
   art:['Central arteriole','Branches of the splenic artery run in the white pulp. Plasma skimming sends plasma and leucocytes into the white pulp, while red cells stay in the axial stream and go on to the red pulp.'],
   pals:['Periarteriolar lymphoid sheath (PALS)','T-cell zone around the central arteriole. The inner PALS has T cells and interdigitating dendritic cells; the outer PALS has B and T cells, macrophages and, after antigen, plasma cells.'],
   gc:['Germinal centre','Inside the follicle. Antigen-stimulated B cells proliferate and undergo somatic hypermutation and class switch.'],
   man:['Mantle zone','Small naive IgM+/IgD+ B cells surrounding the germinal centre. Mantle cell lymphoma arises from this zone.'],
   mz:['Marginal zone','Between white and red pulp: marginal zone macrophages and IgM+/IgD− B cells. Long contact with these macrophages is what clears encapsulated bacteria, so its loss explains post-splenectomy sepsis. Splenic marginal zone lymphoma arises here.'],
   cord:['Red pulp cords (of Billroth)','A meshwork of reticular cells and macrophages. Red cells must squeeze through it, with little oxygen or glucose: conditioning, culling, pitting and phagocytosis of old, rigid or antibody-coated cells. Reticulocytes mature here for 2–3 days.'],
   sin:['Venous sinuses','Lined by endothelial cells with slits about 1–3 µm wide. Flexible red cells pass back into the circulation; rigid ones (spherocytes, sickle cells) are trapped and eaten.']};
  w.innerHTML=`<div class="spl"><svg viewBox="0 0 640 400" role="img" aria-label="Map of the spleen: tap a region">
  <defs><pattern id="splRed" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#c8606a"/><circle cx="4" cy="5" r="2.4" fill="#e58a90"/><circle cx="12" cy="12" r="2.4" fill="#e58a90"/></pattern></defs>
  <g data-z="cord"><path d="M30 40 Q320 5 610 40 L610 370 Q320 400 30 370 Z" fill="url(#splRed)"/></g>
  <g data-z="sin" fill="none" stroke="#7a1e2c" stroke-width="9" stroke-linecap="round" stroke-dasharray="14 5"><path d="M50 90 Q120 60 170 100"/><path d="M500 320 Q560 300 600 330"/><path d="M60 300 Q90 250 70 200"/><path d="M560 80 Q590 140 560 200"/></g>
  <g data-z="cap"><path d="M20 30 Q320 -10 620 30 L620 380 Q320 410 20 380 Z" fill="none" stroke="#8a6a5c" stroke-width="10"/><path d="M180 40 L230 120 M470 40 L430 130 M90 380 L150 300" stroke="#a8877a" stroke-width="14" stroke-linecap="round"/></g>
  <g data-z="mz"><ellipse cx="320" cy="210" rx="210" ry="150" fill="#e9b7a6"/></g>
  <g data-z="man"><circle cx="370" cy="190" r="92" fill="#6d4ca0"/></g>
  <g data-z="gc"><circle cx="370" cy="190" r="56" fill="#cdb8ee"/></g>
  <g data-z="pals"><ellipse cx="250" cy="250" rx="110" ry="58" fill="#4a76c4"/></g>
  <g data-z="art"><path d="M60 330 Q160 270 250 250 Q330 230 400 140" fill="none" stroke="#d8212f" stroke-width="12" stroke-linecap="round"/></g>
  </svg><div class="spl-info verdict" aria-live="polite"></div></div>`;
  const info=w.querySelector('.spl-info');
  const show=k=>{w.querySelectorAll('[data-z]').forEach(g=>g.classList.toggle('on',g.dataset.z===k));info.innerHTML=`<b>${Z[k][0]}</b><div>${Z[k][1]}</div>`};
  w.querySelectorAll('[data-z]').forEach(g=>{g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',Z[g.dataset.z][0]);
    g.addEventListener('click',e=>{e.stopPropagation();show(g.dataset.z)});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(g.dataset.z)}})});
  show('mz')};

/* ---------- Checklist helper used by the criteria widgets ---------- */
function ckList(pfx,items){return items.map(([id,l])=>`<label class="chk ckrow"><input type="checkbox" id="${pfx}_${id}"> ${l}</label>`).join('')}

/* ---------- HLH-2004 diagnostic criteria ---------- */
W.hlh=function(w){
  const C=[['fev','Fever'],['spl','Splenomegaly'],['cyt','Cytopenia in at least 2 lines (Hb under 9 g/dL, or under 12 in neonates; platelets under 100 ×10⁹/L; neutrophils under 1 ×10⁹/L)'],['tg','Fasting triglycerides 3 mmol/L or more and/or fibrinogen under 1.5 g/L'],['fer','Ferritin 500 µg/L or more'],['cd25','Soluble CD25 (sIL-2 receptor) 2400 U/mL or more'],['nk','Low or absent NK-cell activity'],['hph','Haemophagocytosis in marrow, spleen, lymph node or CSF']];
  w.innerHTML=`<div class="ckgrp"><div class="eyebrow">Molecular diagnosis</div><label class="chk ckrow"><input type="checkbox" id="hl_gen"> Familial disease or a known HLH gene defect (PRF1, UNC13D, STX11, STXBP2…)</label></div>
  <div class="ckgrp"><div class="eyebrow">Clinical and laboratory criteria</div>${ckList('hl',C)}</div><div class="scr-out" aria-live="polite"></div>`;
  function r(){const g=w.querySelector('#hl_gen').checked,n=C.filter(([id])=>w.querySelector('#hl_'+id).checked).length;let t,d;
    if(g){t='HLH diagnosis established';d='A molecular diagnosis alone is enough. Start treatment and look for the trigger (EBV, CMV, other infection, malignancy).'}
    else if(n>=5){t='HLH diagnosis established';d=`${n} of 8 criteria met (5 needed). Treat promptly: dexamethasone, etoposide, ciclosporin, treat the trigger, and plan stem cell transplant for familial or refractory disease.`}
    else{t='Criteria not met';d=`${n} of 8 criteria met; 5 are needed. If HLH is still suspected, repeat ferritin, triglycerides and fibrinogen, send soluble CD25 and NK activity, and look for haemophagocytosis in marrow or node.`}
    w.querySelector('.scr-out').innerHTML=`<div class="verdict"><b>${t}</b><div class="note">${d}</div></div><p class="note">Revised criteria of the Histiocyte Society: either a molecular diagnosis, or 5 of the 8 clinical and laboratory criteria.</p>`}
  w.addEventListener('change',r);r()};

/* ---------- ALPS diagnostic criteria ---------- */
W.alps=function(w){
  const R=[['r1','Chronic non-malignant lymphoproliferation: lymphadenopathy and/or splenomegaly for over 6 months'],['r2','Raised double-negative (CD4−CD8−) TCRαβ+ T cells'],['r3','Defective in-vitro FAS-mediated lymphocyte apoptosis'],['r4','Germline or somatic mutation in FAS, FASLG or CASP10']],
        S=[['s1','Family history of ALPS'],['s2','High serum FAS ligand, IL-10, IL-18 or vitamin B12'],['s3','Typical immunohistology of the lymph node'],['s4','Autoimmune cytopenia (haemolytic anaemia, thrombocytopenia or neutropenia)'],['s5','Polyclonal hypergammaglobulinaemia']];
  w.innerHTML=`<div class="ckgrp"><div class="eyebrow">Required criteria</div>${ckList('al',R)}</div><div class="ckgrp"><div class="eyebrow">Supporting criteria</div>${ckList('al',S)}</div><div class="scr-out" aria-live="polite"></div>`;
  const c=id=>w.querySelector('#al_'+id).checked;
  function r(){const base=c('r1')&&c('r2'),oth=c('r3')||c('r4'),sup=S.some(([id])=>c(id));let t,d;
    if(base&&oth){t='Definitive ALPS';d='Both required criteria 1 and 2, plus one more required criterion (defective apoptosis or a mutation).'}
    else if(base&&sup){t='Probable ALPS';d='Required criteria 1 and 2 plus at least one supporting criterion. Treat as ALPS and complete apoptosis and genetic testing.'}
    else if(!c('r1')||!c('r2')){t='Criteria not met';d='Both chronic lymphoproliferation (criterion 1) and raised double-negative T cells (criterion 2) are needed for any ALPS diagnosis. Exclude viral infection, autoimmune disease, lymphoma, leukaemia, IgA deficiency and CVID.'}
    else{t='Criteria not met';d='Criteria 1 and 2 are present. Add one more required criterion for a definitive diagnosis, or one supporting criterion for a probable diagnosis.'}
    w.querySelector('.scr-out').innerHTML=`<div class="verdict"><b>${t}</b><div class="note">${d}</div></div>`}
  w.addEventListener('change',r);r()};

/* ---------- EBV serology interpreter ---------- */
W.ebv=function(w){
  const T=[['vm','VCA IgM'],['vg','VCA IgG'],['ea','EA (early antigen)'],['eb','EBNA-1 IgG'],['het','Heterophile (Paul–Bunnell or Monospot)']];
  w.innerHTML=`<p class="note">Mark each test as positive, negative, or not done.</p><div class="ebvg">${T.map(([id,l])=>`<div class="ebvr"><span>${l}</span><span class="chips" role="group" aria-label="${l}">${['pos','neg','nd'].map((v,i)=>`<button class="chip" data-t="${id}" data-v="${v}" aria-pressed="${i===2}">${['Positive','Negative','Not done'][i]}</button>`).join('')}</span></div>`).join('')}</div><div class="scr-out" aria-live="polite"></div>`;
  const s={vm:'nd',vg:'nd',ea:'nd',eb:'nd',het:'nd'};
  function r(){const p=k=>s[k]==='pos',n=k=>s[k]==='neg';let t,d;
    if(p('vm')&&!p('eb')){t='Acute (primary) EBV infection';d='VCA IgM appears in the incubation period and peaks in week 2, while EBNA antibodies only appear weeks later. A positive EA supports active infection.'}
    else if(p('vm')&&p('eb')){t='Late primary infection or reactivation';d='VCA IgM with EBNA antibodies suggests the tail of a primary infection or a reactivation. Repeat in 2–4 weeks, or measure IgG avidity.'}
    else if(p('vg')&&p('eb')&&!p('vm')){t='Past infection';d='VCA IgG and EBNA-1 persist for life. The current illness is probably not EBV: think of CMV, toxoplasma, HIV or HHV-6.'}
    else if(p('vg')&&n('eb')&&!p('vm')){t='Possibly recent infection';d='VCA IgG without EBNA can mean a recent infection in which IgM has already fallen, or a person who never makes EBNA antibodies (some immunosuppressed patients). Check EA and repeat later.'}
    else if(n('vm')&&n('vg')&&n('eb')){t='No EBV infection (seronegative)';d='Susceptible to primary infection. If the illness is very early, repeat serology in 1–2 weeks.'}
    else if(p('het')){t='Heterophile positive';d='Supports infectious mononucleosis (Paul–Bunnell titre over 1/112). Low titres occur in healthy people, some leukaemias, lymphomas and serum sickness. Confirm with EBV-specific antibodies.'}
    else if(n('het')){t='Heterophile negative';d='The Monospot is often negative in children and in adults over 25. Send VCA IgM, VCA IgG and EBNA.'}
    else{t='Enter results';d='Choose positive or negative for at least one test.'}
    w.querySelector('.scr-out').innerHTML=`<div class="verdict"><b>${t}</b><div class="note">${d}</div></div>`}
  w.addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(!b)return;s[b.dataset.t]=b.dataset.v;w.querySelectorAll(`button[data-t="${b.dataset.t}"]`).forEach(x=>x.setAttribute('aria-pressed',x===b));r()});r()};

/* ---------- Analyser histograms and scattergram simulator ---------- */
W.cbcsim=function(w){
  const g=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2);
  const RBC={
    normal:{t:'Normal',p:[[90,11,1]],f:'',d:'A symmetrical bell curve that starts and ends on the baseline between the discriminators. MCV and RDW are calculated from the peak area (60–125 fL).'},
    micro:{t:'Microcytosis',p:[[66,9.5,1]],f:'',d:'The curve shifts left: iron deficiency, thalassaemia trait, anaemia of chronic disease.'},
    macro:{t:'Macrocytosis',p:[[112,15,1]],f:'',d:'The curve shifts right and often widens: megaloblastic anaemia, liver disease, reticulocytosis.'},
    wide:{t:'Wide (anisocytosis)',p:[[82,22,1]],f:'DW',d:'A low, broad curve with a high RDW: mixed cell sizes, as in early iron deficiency or after treatment.'},
    bimodal:{t:'Two populations',p:[[68,10,.55],[94,12,.55]],f:'DW',d:'Bimodal curve: transfusion, treated iron or folate deficiency, combined iron and folate deficiency, cold agglutinins, fragmentation, extreme leucocytosis.'},
    rl:{t:'Fragments or giant platelets',p:[[88,13,1],[30,6,.35]],f:'RL',d:'The curve does not return to baseline at the lower discriminator (RL flag): platelet clumps, giant platelets, red cell fragments, severe microcytosis.'},
    ru:{t:'Agglutinates or very high WBC',p:[[90,13,1],[205,25,.28]],f:'RU',d:'Raised tail at the upper discriminator (RU flag): red cell agglutination (cold agglutinins) or extreme leucocytosis such as CLL.'}};
  const WBC={
    normal:{t:'Normal',p:[[62,12,.55],[120,14,.12],[220,32,1]],f:'',d:'Three peaks: small cells (lymphocytes, 35–90 fL), mid cells (monocytes, eosinophils, basophils, 90–160 fL) and large cells (neutrophils, 160–300 fL), separated by troughs T1 and T2.'},
    lym:{t:'Lymphocytosis',p:[[64,12,1],[120,14,.12],[220,32,.45]],f:'',d:'The small-cell peak dominates: viral infection, CLL, pertussis.'},
    wl:{t:'Normoblasts or lysis-resistant red cells',p:[[38,5,.6],[64,12,.5],[120,14,.12],[220,32,1]],f:'WL',d:'A peak at the lower discriminator (WL flag): nucleated red cells, lysis-resistant red cells (HbS, HbC, uraemia, neonates), cold agglutinins or platelet clumps.'},
    f2:{t:'Big mid-cell peak',p:[[62,12,.4],[125,16,.7],[220,32,.7]],f:'F2',d:'T1 and T2 troughs are too high, so the mid-cell result is unreliable (F2): eosinophilia, monocytosis, blasts in AML.'},
    t1:{t:'No clear first trough',p:[[62,12,.5],[95,22,.6],[190,40,1]],f:'T1',d:'Lymphocytes and mid cells cannot be separated (T1 flag): a left-shifted granulocyte series such as CML.'},
    wu:{t:'Clumps or extreme neutrophilia',p:[[62,12,.35],[120,14,.12],[230,40,1],[300,20,.4]],f:'WU',d:'Raised curve at the upper discriminator (WU flag): white cell aggregates or extreme neutrophilia.'}};
  const PLT={
    normal:{t:'Normal',p:[[8,3,1]],f:'',d:'A single right-skewed peak between 2 and 30 fL. MPV 7.4–10.4 fL.'},
    big:{t:'Giant platelets',p:[[13,6,1]],f:'PU',d:'The curve is wide and does not fall to baseline at the upper end (PU flag): giant platelets, platelet clumps, severe microcytosis, fragments.'},
    pl:{t:'Small debris',p:[[2.5,1,.7],[8,3,1]],f:'PL',d:'A rise at the lower discriminator (PL flag): high blank, dust or bubbles, electrical noise, red cell or white cell fragments, bacteria.'},
    mp:{t:'Several peaks',p:[[7,2,1],[16,3,.6]],f:'MP',d:'Multiple peaks (MP flag): platelet anisocytosis, recovery after chemotherapy, platelet clumps.'}};
  const C={n:['Neutrophils','#7b4bb3'],l:['Lymphocytes','#2f6db5'],m:['Monocytes','#2f8a55'],e:['Eosinophils','#d0457a'],b:['Basophils','#8a8f98'],ig:['Immature granulocytes','#b07a1a'],bl:['Blasts','#c0392b'],sm:['Smudge cells','#9a7e6a']};
  const SC={
    normal:{t:'Normal',k:[['n',55,24,7,4,300],['l',20,28,4,4,150],['m',33,50,5,5,40],['e',78,20,5,4,20],['b',47,20,2,2,6]],d:'Neutrophils (violet) form a dense teardrop in the centre; lymphocytes (blue) a thumbprint at the bottom left; monocytes (green) above them; eosinophils (pink) at the right; basophils inside the lower left of the neutrophil area.'},
    lym:{t:'Reactive lymphocytosis',k:[['n',55,24,7,4,180],['l',22,32,5,7,330],['m',33,52,5,5,40],['e',78,20,5,4,15]],d:'The lymphocyte region is denser and elongated, with events above it from reactive cells.'},
    eos:{t:'Eosinophilia',k:[['n',55,24,7,4,220],['l',20,28,4,4,120],['m',33,50,5,5,35],['e',76,22,6,5,170]],d:'The eosinophil region is larger, denser and elongated.'},
    cll:{t:'CLL',k:[['n',55,24,7,4,70],['l',19,32,3,8,520],['sm',14,8,4,2,60],['m',33,50,5,5,15]],d:'A compact lymphocyte cluster touching the y axis and rising, but not as high as in acute leukaemia; smudge cells form a small cluster just above the debris.'},
    cml:{t:'CML',k:[['n',57,28,7,6,340],['ig',58,52,7,8,180],['m',36,62,5,6,40],['b',47,20,3,3,70],['l',20,28,4,4,40],['e',78,22,5,4,40]],d:'A dense neutrophil cluster extending upwards (myelocytes, metamyelocytes, bands), clustering in the upper monocyte area, and a prominent basophil cluster.'},
    lr:{t:'Leukaemoid reaction',k:[['n',57,26,7,5,380],['ig',57,48,6,6,120],['l',20,28,4,4,60],['m',33,50,5,5,35]],d:'A prominent cluster above the neutrophils (immature granulocytes) but no basophil cluster: unlike CML.'},
    all:{t:'ALL',k:[['bl',26,40,6,9,480],['n',55,24,7,4,50],['l',20,28,4,4,40]],d:'A large compact cluster in the lymphocyte region encroaching on the monocyte region.'},
    aml:{t:'AML without maturation',k:[['bl',29,48,6,7,380],['l',19,28,4,4,60],['n',55,24,7,4,40]],d:'A smaller cluster in the lymphocyte region and a larger blast cluster between lymphocytes and monocytes, with monocyte-like fluorescence.'},
    m3:{t:'APL (M3)',k:[['l',20,28,4,4,60],['bl',48,40,9,10,380]],d:'A small lymphocyte cluster and, above it, a large neutrophil-like cluster encroaching on the monocyte region: a teardrop shape.'},
    m5:{t:'Monoblastic (M5a)',k:[['bl',36,78,6,12,380],['l',20,28,4,4,50],['n',55,24,7,4,40]],d:'A large cluster in the monocyte region reaching the top margin: high fluorescence monoblasts.'}};
  let tab='rbc',sel='normal';
  const T={rbc:['Red cell histogram',RBC,[0,250],'Volume (fL)',[[50,'LD'],[220,'UD']]],wbc:['White cell histogram',WBC,[0,320],'Volume (fL)',[[35,'LD'],[96,'T1'],[150,'T2'],[300,'UD']]],plt:['Platelet histogram',PLT,[0,30],'Volume (fL)',[[2,'LD'],[24,'UD']]],sc:['Scattergram',SC]};
  let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};const nrm=()=>{let u=0,v=0;while(!u)u=rnd();v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
  function hist(S){const [, ,[x0,x1],xl,disc]=T[tab],W0=560,H0=250,L=40,B=200,R=540,top=24;const N=200,pts=[];let mx=0;
    for(let i=0;i<=N;i++){const x=x0+(x1-x0)*i/N;let y=0;S.p.forEach(([m,s,a])=>{y+=a*g(x,m,s)});if(tab==='plt'&&x>0)y*=1;pts.push([x,y]);mx=Math.max(mx,y)}
    const X=x=>L+(R-L)*(x-x0)/(x1-x0),Y=y=>B-(B-top)*y/(mx*1.08);
    const d='M'+pts.map(([x,y])=>X(x).toFixed(1)+' '+Y(y).toFixed(1)).join(' L')+` L${R} ${B} L${L} ${B}Z`;
    let ticks='';const st=tab==='plt'?5:50;for(let v=x0;v<=x1;v+=st)ticks+=`<text x="${X(v)}" y="${B+20}" text-anchor="middle">${v}</text>`;
    const ds=disc.map(([v,l])=>`<line x1="${X(v)}" x2="${X(v)}" y1="${top}" y2="${B}" stroke="var(--ink-2)" stroke-dasharray="4 4"/><text x="${X(v)}" y="${top-6}" text-anchor="middle" class="dl">${l}</text>`).join('');
    let extra='';if(tab==='rbc'){let s0=0,s1=0,s2=0;pts.forEach(([x,y])=>{if(x>=40&&x<=180){s0+=y;s1+=x*y;s2+=x*x*y}});const mcv=s1/s0,sd=Math.sqrt(s2/s0-mcv*mcv);extra=`MCV ≈ ${mcv.toFixed(0)} fL · RDW-CV ≈ ${(sd/mcv*100).toFixed(1)}%`}
    if(tab==='plt'){let s0=0,s1=0;pts.forEach(([x,y])=>{if(x>=2&&x<=30){s0+=y;s1+=x*y}});extra=`MPV ≈ ${(s1/s0).toFixed(1)} fL`}
    return `<svg viewBox="0 0 ${W0} ${H0}" class="cbcsvg" role="img" aria-label="${T[tab][0]}: ${S.t}"><line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--ink)"/><line x1="${L}" x2="${L}" y1="${top}" y2="${B}" stroke="var(--ink)"/>${ds}<path d="${d}" fill="var(--haem)" fill-opacity=".22" stroke="var(--haem)" stroke-width="2"/><g class="tk">${ticks}</g><text x="${(L+R)/2}" y="${H0-4}" text-anchor="middle" class="ax">${xl}</text></svg>${extra?`<div class="note" style="text-align:center">${extra}</div>`:''}`}
  function scat(S){seed=7;const W0=420,H0=360,L=40,B=320,R=400,top=16,X=v=>L+(R-L)*v/100,Y=v=>B-(B-top)*v/100;let dots='';const used=new Set();
    S.k.forEach(([c,mx,my,sx,sy,n])=>{used.add(c);for(let i=0;i<n;i++){const x=Math.min(98,Math.max(1,mx+sx*nrm())),y=Math.min(99,Math.max(1,my+sy*nrm()));dots+=`<circle cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="1.9" fill="${C[c][1]}" fill-opacity=".75"/>`}});
    for(let i=0;i<60;i++){const x=Math.abs(nrm()*6)+2,y=Math.abs(nrm()*2)+1;dots+=`<circle cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="1.5" fill="var(--ink-2)" fill-opacity=".5"/>`}
    const leg=[...used].map(c=>`<span class="lg"><i style="background:${C[c][1]}"></i>${C[c][0]}</span>`).join('');
    return `<svg viewBox="0 0 ${W0} ${H0}" class="cbcsvg sc" role="img" aria-label="Scattergram: ${S.t}"><rect x="${L}" y="${top}" width="${R-L}" height="${B-top}" fill="none" stroke="var(--ink)"/>${dots}<text x="${(L+R)/2}" y="${H0-12}" text-anchor="middle" class="ax">Side scatter (granularity) →</text><text x="14" y="${(top+B)/2}" text-anchor="middle" class="ax" transform="rotate(-90 14 ${(top+B)/2})">Side fluorescence (RNA/DNA) →</text></svg><div class="lgs">${leg}</div>`}
  function draw(){const S=T[tab][1][sel];
    w.innerHTML=`<div class="chips" role="group" aria-label="Plot">${Object.entries(T).map(([k,v])=>`<button class="chip" data-tab="${k}" aria-pressed="${k===tab}">${v[0]}</button>`).join('')}</div>
    <div class="chips sm" role="group" aria-label="Pattern" style="margin-top:.6rem">${Object.entries(T[tab][1]).map(([k,v])=>`<button class="chip" data-s="${k}" aria-pressed="${k===sel}">${v.t}</button>`).join('')}</div>
    <div class="cbcplot">${tab==='sc'?scat(S):hist(S)}</div>
    <div class="verdict"><b>${S.t}${S.f?` · flag ${S.f}`:''}</b><div class="note">${S.d}</div></div>${tab==='sc'?'<p class="note">Schematic of a Sysmex 5-part WDF channel, drawn from the descriptions in Dr Abeer\'s notes. Real plots differ between instruments.</p>':''}`}
  w.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.tab){tab=b.dataset.tab;sel='normal';draw()}else if(b.dataset.s){sel=b.dataset.s;draw()}});draw()};

/* ---------- PCR cycle stepper ---------- */
W.pcr=function(w){
  const ST=[['Initialisation','94–96 °C, 1–9 min','The template and polymerase are heated once before cycling starts.',95],['Denaturation','94–98 °C, 20–30 s','Hydrogen bonds break and the double helix melts into single strands.',96],['Annealing','50–65 °C, 20–40 s','The two primers bind the 3′ ends of the sense and antisense strands of the target.',58],['Extension','72 °C','Heat-stable DNA polymerase adds dNTPs to each primer, copying the target. Mg²⁺ is the cofactor.',72],['Final elongation','70–74 °C, 5–15 min','After the last cycle, any single strands are completed. Then the products are sized on agarose gel, beside a no-template blank to detect contamination.',72]];
  let cyc=0,st=0;
  function draw(){const s=ST[st],copies=Math.pow(2,cyc);
    const X=i=>40+i*100,Y=t=>150-(t-40)*2;let path=`M${X(0)} ${Y(25)}`;ST.forEach((q,i)=>{path+=` L${X(i)+8} ${Y(q[3])} L${X(i)+92} ${Y(q[3])}`});
    const bars=ST.map((q,i)=>`<rect x="${X(i)+8}" y="${Y(q[3])-4}" width="84" height="8" rx="4" fill="${i===st?'var(--haem)':'var(--rule)'}"/><text x="${X(i)+50}" y="${Y(q[3])-12}" text-anchor="middle" class="ax">${q[3]} °C</text><text x="${X(i)+50}" y="178" text-anchor="middle" class="dl">${['Initial','Denature','Anneal','Extend','Final'][i]}</text>`).join('');
    w.querySelector('.pcrsvg').innerHTML=`<path d="${path}" fill="none" stroke="var(--ink-2)" stroke-dasharray="4 4"/>${bars}`;
    w.querySelector('.pcrout').innerHTML=`<div class="verdict"><b>${s[0]} · ${s[1]}</b><div class="note">${s[2]}</div></div><div style="display:flex;gap:2rem;flex-wrap:wrap;margin-top:.6rem"><div><div class="eyebrow">Cycle</div><div class="big" style="font-size:1.6rem">${cyc}</div></div><div><div class="eyebrow">Copies of the target per template</div><div class="big" style="font-size:1.6rem">${copies.toLocaleString('en')}</div></div></div>`}
  w.innerHTML=`<svg class="pcrsvg cbcsvg" viewBox="0 0 560 190" role="img" aria-label="PCR temperature profile"></svg><div class="chips" style="margin:.6rem 0"><button class="chip" data-a="next">Next step</button><button class="chip" data-a="cyc">Run one full cycle</button><button class="chip" data-a="ten">Run 10 cycles</button><button class="chip" data-a="reset">Reset</button></div><div class="pcrout" aria-live="polite"></div><p class="note">Real runs use 20–40 cycles; copies double each cycle while reagents last, then plateau.</p>`;
  w.addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(!b)return;const a=b.dataset.a;
    if(a==='next'){if(st===0)st=1;else if(st<3)st++;else if(st===3){cyc++;st=cyc>=40?4:1}}
    else if(a==='cyc'){cyc++;st=3}else if(a==='ten'){cyc=Math.min(40,cyc+10);st=3}else{cyc=0;st=0}
    draw()});draw()};

W.teg=function(w){
  const P={
    normal:['Normal',7,2,62,60,3,'All values within range. The clot forms on time, grows quickly, is strong and holds.'],
    factor:['Factor deficiency or anticoagulant',15,6,38,46,2,'Long R and K with a narrow angle: thrombin forms slowly. Give FFP or reverse the anticoagulant; a heparinase cup separates heparin effect.'],
    plt:['Low platelets or platelet dysfunction',7,5,45,38,2,'R is normal but MA is low and K is long: the clot forms on time but is weak. Give platelets (or desmopressin for uraemic or drug-induced dysfunction).'],
    fib:['Low fibrinogen',8,4,48,42,2,'MA is low like a platelet defect. A low MA with ReoPro (functional fibrinogen) points to fibrinogen: give cryoprecipitate or fibrinogen concentrate.'],
    hyper:['Hypercoagulable',3,0.8,78,76,1,'Short R and K, steep angle and high MA (high G value). Seen early in DIC, after surgery, in cancer and pregnancy.'],
    lysis:['Hyperfibrinolysis',7,2,62,55,40,'The clot forms normally, then falls apart: LY30 above 8%. Give tranexamic acid, unless this is DIC.'],
    dic2:['DIC, late (hypocoagulable) stage',14,7,35,32,15,'Long R and K, low MA and increased lysis: consumption of factors and platelets with secondary fibrinolysis. The first stage of DIC looks hypercoagulable.']
  };
  const RG={R:[5,10,'min'],K:[1,3,'min'],A:[53,72,'°'],MA:[50,70,'mm'],LY:[0,8,'%']};
  let cur='normal';
  function amp(p,t){const [,R,K,,MA,LY]=p;if(t<R)return 0;const tau=-K/Math.log(1-20/MA),tm=R+3*tau;let a=MA*(1-Math.exp(-(t-R)/tau));if(t>tm)a*=Math.max(0,1-LY/100*(t-tm)/30);return a}
  function draw(){const p=P[cur],X=t=>40+t*8.2,Y0=120,S=1.25;let up='',dn='';
    for(let t=0;t<=60;t+=0.25){const a=amp(p,t)*S;up+=`${X(t).toFixed(1)},${(Y0-a).toFixed(1)} `;dn=`${X(t).toFixed(1)},${(Y0+a).toFixed(1)} `+dn}
    const R=p[1],K=p[2],tk=[0,10,20,30,40,50,60].map(t=>`<line x1="${X(t)}" y1="225" x2="${X(t)}" y2="230" stroke="var(--ink-2)"/><text x="${X(t)}" y="246" text-anchor="middle">${t}</text>`).join('');
    const mk=(x,l)=>`<line x1="${x}" y1="20" x2="${x}" y2="222" stroke="var(--stain)" stroke-dasharray="3 4"/><text x="${x+4}" y="34" class="dl">${l}</text>`;
    w.querySelector('.tegsvg').innerHTML=`<line x1="40" y1="${Y0}" x2="540" y2="${Y0}" stroke="var(--rule)"/><polygon points="${up}${dn}" fill="var(--haem)" fill-opacity=".22" stroke="var(--haem)" stroke-width="2"/>${mk(X(R),'R')}${mk(X(R+K),'K')}<g class="tk">${tk}</g><text x="290" y="268" text-anchor="middle" class="dl">minutes</text>`;
    const v={R:p[1],K:p[2],A:p[3],MA:p[4],LY:p[5]},nm={R:'R (reaction time)',K:'K (clot kinetics)',A:'α angle',MA:'MA (max amplitude)',LY:'LY30 (lysis at 30 min)'};
    const rows=Object.keys(v).map(k=>{const [lo,hi,u]=RG[k],x=v[k],f=x<lo?'↓ low':x>hi?'↑ high':'normal';return `<tr><td>${nm[k]}</td><td><b>${x}</b> ${u}</td><td>${lo}–${hi}</td><td${f==='normal'?'':' style="color:var(--haem);font-weight:600"'}>${f}</td></tr>`}).join('');
    w.querySelector('.tegout').innerHTML=`<div class="tbl"><table><thead><tr><th>Value</th><th>Result</th><th>Typical range</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><div class="verdict"><b>${p[0]}</b><div class="note">${p[6]}</div></div>`;
    w.querySelectorAll('[data-p]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===cur))}
  w.innerHTML=`<div class="chips">${Object.keys(P).map(k=>`<button class="chip" data-p="${k}" aria-pressed="false">${P[k][0]}</button>`).join('')}</div><svg class="tegsvg cbcsvg" viewBox="0 0 560 275" role="img" aria-label="Thromboelastography tracing"></svg><div class="tegout" aria-live="polite"></div><p class="note">Illustrative kaolin TEG values; each analyser and activator has its own reference ranges.</p>`;
  w.addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b)return;cur=b.dataset.p;draw()});draw()};
/* ---------- Imported study tools: flashcards, maturation, oxygen curve, globin switching, tree, checklists, algorithms ---------- */
W.flash=function(w){const F=data(w);let ord=F.map((_,i)=>i),i=0,open=false;
  w.innerHTML=`<div class="score"><span class="qn"></span><button class="btn sm" data-a="shuf">Shuffle</button></div><button type="button" class="fc-card" aria-live="polite"></button><div class="fc-nav"><button class="btn" data-a="prev">‹ Previous</button><button class="btn primary" data-a="flip"></button><button class="btn" data-a="next">Next ›</button></div>`;
  const card=w.querySelector('.fc-card');
  function r(){const f=F[ord[i]];w.querySelector('.qn').textContent=`Card ${i+1} of ${F.length}`;
    card.innerHTML=`<span class="eyebrow">${open?'Answer':'Question'}</span><b>${f[0]}</b>${open?`<span class="fc-a">${f[1]}</span>`:'<span class="note">Tap to see the answer</span>'}`;card.classList.toggle('open',open);
    w.querySelector('[data-a=flip]').textContent=open?'Hide answer':'Show answer'}
  card.onclick=()=>{open=!open;r()};
  w.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
    if(a==='flip')open=!open;else{open=false;if(a==='next')i=(i+1)%F.length;if(a==='prev')i=(i+F.length-1)%F.length;if(a==='shuf'){ord.sort(()=>Math.random()-.5);i=0}}r()});
  r()};
W.matur=function(w){const S=data(w);let i=0,timer=null;
  w.innerHTML=`<div class="mt-wrap"><div class="mt-pic"></div><div class="mt-side"><div class="mt-info" aria-live="polite"></div>
   <input type="range" min="0" max="${S.length-1}" step="1" value="0" aria-label="Maturation stage"><div class="mt-ticks">${S.map((s,k)=>`<button type="button" data-k="${k}">${k+1}</button>`).join('')}</div>
   <div><button class="btn primary" data-a="play">▶ Play</button></div></div></div>`;
  const rg=w.querySelector('input'),pl=w.querySelector('[data-a=play]');
  function r(){const s=S[i];rg.value=i;
    w.querySelector('.mt-pic').innerHTML=s.img?`<img src="${s.img}" alt="${esc(s.name)}"><small class="cc">${s.credit}</small>`:`<div class="mt-none"><b>${s.name}</b><span>No openly licensed photograph of this stage yet. Use the description.</span></div>`;
    w.querySelector('.mt-info').innerHTML=`<div class="eyebrow">Stage ${i+1} of ${S.length}</div><h3>${s.name}</h3><p><span class="tagp ${s.div?'ok':''}">${s.div?'Can divide':'No longer divides'}</span> <span class="tagp">${s.size}</span></p><dl class="kvl"><dt>Nucleus</dt><dd>${s.nucleus}</dd><dt>Cytoplasm</dt><dd>${s.cyto}</dd><dt>N:C ratio</dt><dd>${s.nc}</dd></dl>`;
    w.querySelectorAll('.mt-ticks button').forEach((b,k)=>b.setAttribute('aria-pressed',k===i))}
  function stop(){clearInterval(timer);timer=null;pl.textContent='▶ Play'}
  rg.oninput=()=>{stop();i=+rg.value;r()};
  w.querySelector('.mt-ticks').onclick=e=>{const b=e.target.closest('button');if(b){stop();i=+b.dataset.k;r()}};
  pl.onclick=()=>{if(timer){stop();return}if(i===S.length-1)i=0;r();pl.textContent='❚❚ Pause';timer=setInterval(()=>{if(!w.isConnected||i>=S.length-1){stop();return}i++;r()},2200)};
  r()};
W.odc=function(w){
  w.innerHTML=`<div class="mt-wrap"><div><svg viewBox="0 0 420 300" role="img" aria-label="Oxygen dissociation curve" style="width:100%;height:auto;display:block"></svg></div><div class="mt-side">
   <label>pH <b class="v-ph"></b><input type="range" data-k="ph" min="7.0" max="7.8" step="0.01" value="7.40"></label>
   <label>Temperature °C <b class="v-tp"></b><input type="range" data-k="tp" min="34" max="42" step="0.1" value="37"></label>
   <label>2,3-BPG mmol/L <b class="v-bpg"></b><input type="range" data-k="bpg" min="3" max="8" step="0.1" value="5"></label>
   <label class="chk"><input type="checkbox" data-k="hbf"> Fetal haemoglobin (HbF)</label>
   <p class="verdict" aria-live="polite"></p><div><button class="btn sm" data-a="reset">Reset to normal</button></div>
   <p class="note">Teaching model using the Hill equation (n = 2.7). Real curves also depend on CO₂, which acts mainly through pH.</p></div></div>`;
  const q=k=>w.querySelector(`[data-k=${k}]`),svg=w.querySelector('svg');
  function r(){const pH=+q('ph').value,T=+q('tp').value,B=+q('bpg').value,F=q('hbf').checked;
    w.querySelector('.v-ph').textContent=pH.toFixed(2);w.querySelector('.v-tp').textContent=T.toFixed(1);w.querySelector('.v-bpg').textContent=B.toFixed(1);
    const base=F?19:26.6,bk=F?.025:.085,p50=base*Math.pow(10,.48*(7.4-pH))*Math.pow(10,.024*(T-37))*(1+bk*(B-5));
    const n=2.7,Sat=(p,P=p50)=>Math.pow(p,n)/(Math.pow(p,n)+Math.pow(P,n)),X=p=>46+p/100*354,Y=s=>262-s*240;
    let g='';const tx='font-size="11" fill="currentColor" opacity=".75"',gr='stroke="currentColor" opacity=".12"';
    for(let p=0;p<=100;p+=20)g+=`<line ${gr} x1="${X(p)}" y1="22" x2="${X(p)}" y2="262"/><text ${tx} x="${X(p)}" y="278" text-anchor="middle">${p}</text>`;
    for(let s=0;s<=1.001;s+=.25)g+=`<line ${gr} x1="46" y1="${Y(s)}" x2="400" y2="${Y(s)}"/><text ${tx} x="40" y="${Y(s)+4}" text-anchor="end">${Math.round(s*100)}</text>`;
    const path=P=>{let d='';for(let p=0;p<=100;p++)d+=(p?'L':'M')+X(p).toFixed(1)+','+Y(Sat(p,P)).toFixed(1);return d};
    g+=`<path d="${path(26.6)}" fill="none" stroke="currentColor" opacity=".55" stroke-width="1.5" stroke-dasharray="5 4"/><path d="${path(p50)}" fill="none" stroke="var(--haem)" stroke-width="3"/>`;
    g+=`<line x1="${X(p50)}" y1="${Y(.5)}" x2="${X(p50)}" y2="262" stroke="var(--haem)" stroke-dasharray="3 3"/><circle cx="${X(p50)}" cy="${Y(.5)}" r="4.5" fill="var(--haem)"/>`;
    [40,100].forEach(p=>{g+=`<circle cx="${X(p)}" cy="${Y(Sat(p))}" r="4" fill="var(--stain)"/>`});
    g+=`<text ${tx} x="223" y="296" text-anchor="middle">PO₂ (mmHg)</text><text ${tx} x="12" y="142" text-anchor="middle" transform="rotate(-90 12 142)">Saturation (%)</text><text ${tx} x="${X(64)}" y="${Y(.56)}">normal (dashed)</text>`;
    svg.innerHTML=g;const un=(Sat(100)-Sat(40))*100;
    const sh=p50>27.6?'<b>Right shift:</b> oxygen is released more easily to the tissues.':p50<25.6?'<b>Left shift:</b> haemoglobin holds oxygen more tightly.':'Close to the normal curve.';
    w.querySelector('.verdict').innerHTML=`P50 <b>${p50.toFixed(1)} mmHg</b> (${(p50*.1333).toFixed(2)} kPa)<br>Saturation at 100 mmHg <b>${(Sat(100)*100).toFixed(0)}%</b>, at 40 mmHg <b>${(Sat(40)*100).toFixed(0)}%</b><br>Unloaded between arterial and venous blood <b>${un.toFixed(0)}%</b><br>${sh}`}
  w.addEventListener('input',r);w.querySelector('[data-a=reset]').onclick=()=>{q('ph').value=7.4;q('tp').value=37;q('bpg').value=5;q('hbf').checked=false;r()};r()};
W.globin=function(w){
  const G={zeta:t=>100/(1+Math.exp((t-7)/1.2)),eps:t=>100/(1+Math.exp((t-8)/1.3)),beta:t=>(8+89/(1+Math.exp(-(t-44)/4.5)))*(1-G.eps(t)/100),delta:t=>2.6/(1+Math.exp(-(t-46)/5)),gamma:t=>Math.max(0,100-G.eps(t)-G.beta(t)-G.delta(t)),alpha:t=>100-G.zeta(t)};
  const LN=[['zeta','ζ','#9a6aa6','5 4',4],['alpha','α','#6a58c0','5 4',18],['eps','ε','#e46a3a','',3],['gamma','γ','#c9416b','',26],['beta','β','#3f84c8','',80],['delta','δ','#2f8a57','',84]];
  w.innerHTML=`<div class="mt-wrap"><div><svg viewBox="0 0 440 300" role="img" aria-label="Globin chain synthesis before and after birth" style="width:100%;height:auto;display:block"></svg></div><div class="mt-side">
   <label>Age <b class="v-age"></b><input type="range" min="2" max="92" step="1" value="40"></label><p class="verdict" aria-live="polite"></p>
   <p class="note">Dashed lines are α-like chains, solid lines β-like chains. The curves are a smoothed teaching model of the published pattern.</p></div></div>`;
  const rg=w.querySelector('input'),svg=w.querySelector('svg');
  function r(){const t=+rg.value,X=x=>40+x/92*385,Y=v=>255-v*2.25;let g='';const tx='font-size="11" fill="currentColor" opacity=".75"',gr='stroke="currentColor" opacity=".12"';
    for(let v=0;v<=100;v+=25)g+=`<line ${gr} x1="40" y1="${Y(v)}" x2="425" y2="${Y(v)}"/><text ${tx} x="34" y="${Y(v)+4}" text-anchor="end">${v}</text>`;
    [[0,'Conception'],[20,'20 wk'],[40,'Birth'],[66,'6 mo'],[92,'1 yr']].forEach(([x,l])=>{g+=`<line ${gr} x1="${X(x)}" y1="30" x2="${X(x)}" y2="255"/><text ${tx} x="${X(x)}" y="272" text-anchor="${x===0?'start':x===92?'end':'middle'}">${l}</text>`});
    g+=`<line x1="${X(40)}" y1="30" x2="${X(40)}" y2="255" stroke="currentColor" opacity=".5" stroke-width="1.5"/>`;
    LN.forEach(([k,lab,col,dash,lx])=>{let d='';for(let x=0;x<=92;x++)d+=(x?'L':'M')+X(x).toFixed(1)+','+Y(G[k](x)).toFixed(1);
      g+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="2.5"${dash?` stroke-dasharray="${dash}"`:''}/><text x="${X(lx)+4}" y="${Y(G[k](lx))-6}" fill="${col}" font-weight="700" font-size="13">${lab}</text>`});
    g+=`<line x1="${X(t)}" y1="30" x2="${X(t)}" y2="255" stroke="var(--haem)" stroke-width="2"/><text ${tx} x="12" y="142" text-anchor="middle" transform="rotate(-90 12 142)">% of chain synthesis</text>`;
    svg.innerHTML=g;
    w.querySelector('.v-age').textContent=t<40?`${t} weeks of gestation`:t===40?'Birth':`${Math.round((t-40)/4.33)} months after birth`;
    const e=G.eps(t),z=G.zeta(t),a=G.alpha(t),hbF=G.gamma(t)*a/100,hbA=G.beta(t)*a/100,hbA2=G.delta(t)*a/100;
    w.querySelector('.verdict').innerHTML=Math.max(e,z)>10?'<b>Embryonic period.</b> The yolk sac makes ζ and ε chains: Hb Gower 1 (ζ₂ε₂), Gower 2 (α₂ε₂) and Portland (ζ₂γ₂).'
      :`HbF (α₂γ₂) <b>${hbF.toFixed(0)}%</b> · HbA (α₂β₂) <b>${hbA.toFixed(0)}%</b> · HbA₂ (α₂δ₂) <b>${hbA2.toFixed(1)}%</b><br>${t<30?'The liver is the main site; γ chains dominate.':t<=44?'The switch from γ to β is under way. HbF is 60–90% at birth.':t<70?'HbF falls quickly. β thalassaemia major usually presents in this period, as γ chain synthesis falls.':'Close to the adult pattern: HbF under 1–2%, HbA₂ 2.2–3.5%.'}`}
  rg.oninput=r;r()};
W.hptree=function(w){
  const N=[['hsc',300,34,'HSC','#5b45a8',0,null,'Haematopoietic stem cell. CD34+ CD38− CD90+ CD45RA−. Self-renews and gives rise to every blood cell.'],
   ['mpp',300,104,'MPP','#5b45a8',1,'hsc','Multipotent progenitor. Has lost long-term self-renewal but can still make all lineages.'],
   ['cmp',185,180,'CMP','#b93a60',2,'mpp','Common myeloid progenitor. Driven by GATA1 towards MEP, or by PU.1 and C/EBPα towards GMP.'],
   ['clp',470,180,'CLP','#2f6fb0',2,'mpp','Common lymphoid progenitor. IL-7 dependent. PAX5 commits to B cells; Notch and GATA3 to T cells.'],
   ['mep',95,258,'MEP','#b93a60',3,'cmp','Megakaryocyte–erythroid progenitor. GATA1 with FOG1, then KLF1 for red cells or FLI1 for megakaryocytes.'],
   ['gmp',275,258,'GMP','#b93a60',3,'cmp','Granulocyte–monocyte progenitor. G-CSF, GM-CSF and M-CSF steer it towards neutrophils or monocytes. Eosinophil and basophil progenitors arise close to this stage, IL-5 driving eosinophils.'],
   ['rbc',40,345,'Red cell','#d06a78',4,'mep','BFU-E → CFU-E → erythroblasts → reticulocyte → red cell. Needs EPO, iron, B12 and folate.'],
   ['plt',115,345,'Platelets','#9a6aa6',4,'mep','Megakaryocytes form by endomitosis under TPO and shed platelets into sinusoids.'],
   ['neut',192,345,'Neutrophil','#c28aa8',4,'gmp','Myeloblast → promyelocyte → myelocyte → metamyelocyte → band → segmented neutrophil.'],
   ['eos',268,345,'Eos / Baso','#e46a3a',4,'gmp','Eosinophils (IL-5) and basophils (IL-3). Basophils are CD123+ CD203c+.'],
   ['mono',344,345,'Monocyte','#7f84b6',4,'gmp','Monoblast → promonocyte → monocyte → tissue macrophage. Dendritic cells arise close to this branch.'],
   ['b',420,345,'B cell','#2f6fb0',4,'clp','Matures in the marrow (hematogones); the final stage is the plasma cell.'],
   ['t',490,345,'T cell','#2f6fb0',4,'clp','Progenitors leave the marrow and mature in the thymus.'],
   ['nk',560,345,'NK cell','#2f6fb0',4,'clp','Large granular lymphocytes, CD16+ CD56+ CD3−.']];
  const by={};N.forEach(n=>by[n[0]]=n);let lv=4,sel='hsc',timer=null;
  w.innerHTML=`<div class="tcp-top"><button class="btn primary" data-a="play">▶ Play the build-up</button><span class="note">Myeloid branch in red, lymphoid in blue. Tap any cell.</span></div><div class="hp-svg"></div><p class="verdict" aria-live="polite"></p>`;
  function r(){let s='<svg viewBox="0 0 600 395" role="img" aria-label="Haematopoietic tree" style="width:100%;height:auto;display:block">';
    N.forEach(n=>{if(n[6]&&n[5]<=lv){const p=by[n[6]];s+=`<path d="M${p[1]},${p[2]+20} C${p[1]},${(p[2]+n[2])/2} ${n[1]},${(p[2]+n[2])/2} ${n[1]},${n[2]-22}" fill="none" stroke="currentColor" opacity=".4" stroke-width="2"/>`}});
    N.forEach(n=>{if(n[5]>lv)return;s+=`<g data-n="${n[0]}" tabindex="0" role="button" aria-label="${n[3]}" style="cursor:pointer"><circle cx="${n[1]}" cy="${n[2]}" r="${n[5]===4?19:23}" fill="${n[4]}" stroke="${n[0]===sel?'currentColor':'none'}" stroke-width="3"/>`+
      (n[5]<4?`<text x="${n[1]}" y="${n[2]+5}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${n[3]}</text>`:`<circle cx="${n[1]}" cy="${n[2]}" r="7" fill="#fff" opacity=".35"/><text x="${n[1]}" y="${n[2]+37}" text-anchor="middle" font-size="12.5" font-weight="600" fill="currentColor">${n[3]}</text>`)+'</g>'});
    w.querySelector('.hp-svg').innerHTML=s+'</svg>';const n=by[sel];w.querySelector('.verdict').innerHTML=`<b>${n[3]}</b><br>${n[7]}`}
  const pick=e=>{const g=e.target.closest('[data-n]');if(g){sel=g.dataset.n;r()}};
  w.querySelector('.hp-svg').onclick=pick;w.querySelector('.hp-svg').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(e)}};
  w.querySelector('[data-a=play]').onclick=()=>{clearInterval(timer);lv=0;sel='hsc';r();timer=setInterval(()=>{if(!w.isConnected||lv>=4){clearInterval(timer);return}lv++;sel=N.find(n=>n[5]===lv)[0];r()},1100)};
  r()};
W.steps=function(w){const S=data(w),key=w.dataset.key;let done=[];try{done=JSON.parse(store.get(key)||'[]')}catch(e){done=[]}
  function r(){const n=S.filter((_,i)=>done[i]).length;
    w.innerHTML=`<div class="score"><span class="qn">${n} of ${S.length} steps ticked</span><button class="btn sm" data-a="clear">Clear</button></div><ol class="stp">${S.map((s,i)=>`<li><label><input type="checkbox" data-i="${i}"${done[i]?' checked':''}><span><b>${s[0]}</b><br>${s[1]}</span></label></li>`).join('')}</ol>`}
  w.addEventListener('change',e=>{const c=e.target.closest('[data-i]');if(!c)return;done[+c.dataset.i]=c.checked?1:0;store.set(key,JSON.stringify(done));r()});
  w.addEventListener('click',e=>{if(e.target.closest('[data-a=clear]')){done=[];store.set(key,'[]');r()}});r()};
W.dtree=function(w){const N=data(w);let path=['start'];
  function r(){const node=N[path[path.length-1]];
    const trail=path.slice(1).map((k,i)=>{const o=N[path[i]].opts.find(x=>x[1]===k);return o?o[0]:k});
    w.innerHTML=(trail.length?`<div class="dt-trail">${trail.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:'')+
      (node.end?`<div class="verdict dt-end"><span class="eyebrow">Conclusion</span><h3>${esc(node.end)}</h3><p>${esc(node.detail||'')}</p></div>`
       :`<div class="step"><p><b>${esc(node.q)}</b></p><div class="opts">${node.opts.map(o=>`<button class="opt" data-n="${o[1]}">${esc(o[0])}</button>`).join('')}</div></div>`)+
      (path.length>1?`<div class="fc-nav"><button class="btn sm" data-a="back">Back</button><button class="btn sm" data-a="reset">Start again</button></div>`:'')}
  w.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.n&&N[b.dataset.n])path.push(b.dataset.n);else if(b.dataset.a==='back')path.pop();else if(b.dataset.a==='reset')path=['start'];else return;r()});r()};

/* ---------- Practice page ---------- */
let PRACT=null;const PR={deck:0,mode:'flash',sub:0};
async function practice(){
  view.innerHTML='<p class="col note" style="padding-top:2rem">Loading practice…</p>';
  try{if(!PRACT){const r=await fetch('practice.json');if(!r.ok)throw 0;PRACT=await r.json()}}
  catch(e){view.innerHTML=`<div class="col"><h1>Practice not available</h1><p>Open this page once while online so it is saved for offline use.</p><p><a href="#home">Back to contents</a></p></div>`;return}
  view.innerHTML=`<article class="col chead" id="top"><div class="eyebrow">Practice</div><h1>Flashcards, questions and cases</h1>
    <p>Revision decks, multiple choice questions, stepwise cases, diagnostic algorithms and reporting checklists for the whole of haematology.</p>
    <div class="meta"><span>Supplementary material written from standard textbooks and current classifications, not from Dr Abeer's notes</span></div></article>
    <section class="wide" id="prBox"><div class="chips" role="group" aria-label="Topic" data-g="deck">${PRACT.map((d,i)=>`<button class="chip" data-v="${i}">${d.title}</button>`).join('')}</div>
    <div class="chips" role="group" aria-label="Activity" data-g="mode">${[['flash','Flashcards'],['quiz','Questions'],['cases','Cases'],['trees','Algorithms'],['check','Checklist']].map(m=>`<button class="chip" data-v="${m[0]}">${m[1]}</button>`).join('')}</div>
    <div id="prBody"></div></section>`+footer();
  $('#prBox').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;const g=b.parentNode.dataset.g;if(!g)return;
    if(g==='sub')PR.sub=+b.dataset.v;else{PR[g]=g==='deck'?+b.dataset.v:b.dataset.v;PR.sub=0}prDraw()});
  document.title='Practice · Interactive Haematology Diagnosis';buildToc('practice');prDraw();scrollTo(0,0)}
function prDraw(){const D=PRACT[PR.deck],body=$('#prBody');
  document.querySelectorAll('#prBox > .chips .chip').forEach(b=>b.setAttribute('aria-pressed',String(PR[b.parentNode.dataset.g])===b.dataset.v));
  const mk=(cls,d)=>{const el=document.createElement('div');el.className=cls;if(cls==='calc')el.style.display='block';el._data=d;return el};
  const sub=(L)=>L.length>1?`<div class="chips" role="group" aria-label="Choose" data-g="sub">${L.map((t,i)=>`<button class="chip" data-v="${i}" aria-pressed="${i===PR.sub}">${t}</button>`).join('')}</div>`:'';
  body.innerHTML='';let el;
  if(PR.mode==='flash'){body.innerHTML=`<p class="note">${D.facts.length} cards. Try to answer before you turn the card.</p>`;el=mk('calc',D.facts);body.appendChild(el);W.flash(el)}
  else if(PR.mode==='quiz'){el=mk('case',D.quiz);el.dataset.key='practice-quiz-'+D.id;body.appendChild(el);W.quiz(el)}
  else if(PR.mode==='cases'){const c=D.cases[PR.sub];body.innerHTML=sub(D.cases.map(x=>x.title));el=mk('case',c.steps);body.appendChild(el);W.case(el)}
  else if(PR.mode==='trees'){const t=D.trees[PR.sub];body.innerHTML=sub(D.trees.map(x=>x.title))+`<p>${esc(t.intro||'')}</p>`;el=mk('calc',t.nodes);body.appendChild(el);W.dtree(el)}
  else{const c=D.check;body.innerHTML=`<h2 class="pr-h">${esc(c.title)}</h2><p>${esc(c.intro||'')}</p>`;el=mk('calc',c.steps.map(s=>[esc(s[0]),esc(s[1])]));el.dataset.key='practice-check-'+D.id;body.appendChild(el);W.steps(el)}}

/* ---------- Mock exam ---------- */
let EXAMQ=null;const EX={n:20,part:'all',timed:true,run:null};
const exPart=c=>{if(!c)return 'Practice decks';const b=BOOK.find(p=>p.items.some(i=>i.n===c));return b?b.p:'Other'};
const exHist=()=>{try{return JSON.parse(store.get('exam-hist')||'[]')}catch(e){return []}};
const exTime=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
async function exam(){
  view.innerHTML='<p class="col note" style="padding-top:2rem">Loading exam…</p>';
  try{if(!EXAMQ){const r=await fetch('exam.json');if(!r.ok)throw 0;EXAMQ=await r.json()}}
  catch(e){view.innerHTML=`<div class="col"><h1>Exam not available</h1><p>Open this page once while online so it is saved for offline use.</p><p><a href="#home">Back to contents</a></p></div>`;return}
  if(EX.run&&EX.run.timer)clearInterval(EX.run.timer);EX.run=null;
  view.innerHTML=`<article class="col chead" id="top"><div class="eyebrow">Mock exam</div><h1>Test yourself on the whole book</h1>
    <p>Random single best answer questions drawn from every chapter. Answers and explanations appear at the end, with your score by part.</p></article>
    <section class="col" id="exBox"></section>`+footer();
  document.title='Mock exam · Interactive Haematology Diagnosis';buildToc('exam');exSetup();scrollTo(0,0)}
function exSetup(){const parts=[...new Set(EXAMQ.map(q=>exPart(q.c)))],H=exHist();
  const pool=()=>EXAMQ.filter(q=>EX.part==='all'||exPart(q.c)===EX.part);
  $('#exBox').innerHTML=`<div class="calc" style="display:block"><div class="ex-set">
    <label>Questions from<select id="exPart"><option value="all">The whole book (${EXAMQ.length} questions)</option>${parts.map(p=>`<option${p===EX.part?' selected':''}>${p}</option>`).join('')}</select></label>
    <div><div class="eyebrow">Number of questions</div><div class="chips" data-g="n">${[10,20,40,60,100].map(n=>`<button class="chip" data-v="${n}" aria-pressed="${n===EX.n}">${n}</button>`).join('')}</div></div>
    <label class="chk"><input type="checkbox" id="exTimed"${EX.timed?' checked':''}> Timed: one minute per question</label>
    <p class="note" id="exInfo"></p><div><button class="btn primary" id="exGo">Start the exam</button></div></div></div>
    ${H.length?`<h2 class="pr-h" style="margin-top:var(--s5)">Your last attempts</h2><div class="tbl"><table><thead><tr><th>Date</th><th>Questions from</th><th>Score</th><th>Time</th></tr></thead><tbody>${H.slice().reverse().map(h=>`<tr><td>${h.d}</td><td>${esc(h.p)}</td><td><b>${h.r} / ${h.n}</b> (${Math.round(h.r/h.n*100)}%)</td><td>${exTime(h.t)}</td></tr>`).join('')}</tbody></table></div><p><button class="btn sm" id="exClr">Clear history</button></p>`:''}`;
  const info=()=>{const m=Math.min(EX.n,pool().length);$('#exInfo').textContent=`${m} questions`+(EX.timed?`, ${m} minutes.`:', no time limit.')};
  $('#exPart').onchange=e=>{EX.part=e.target.value;info()};$('#exTimed').onchange=e=>{EX.timed=e.target.checked;info()};
  $('#exBox').querySelector('[data-g=n]').onclick=e=>{const b=e.target.closest('.chip');if(!b)return;EX.n=+b.dataset.v;b.parentNode.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',c===b));info()};
  if($('#exClr'))$('#exClr').onclick=()=>{store.set('exam-hist','[]');exSetup()};
  $('#exGo').onclick=()=>{const qs=pool().sort(()=>Math.random()-.5).slice(0,EX.n).map(q=>{const ord=q.o.map((_,i)=>i).sort(()=>Math.random()-.5);return {q,ord,pick:null,flag:false}});
    EX.run={qs,i:0,t0:Date.now(),left:EX.timed?qs.length*60:null,timer:null};
    if(EX.timed)EX.run.timer=setInterval(()=>{const R=EX.run;if(!R||!$('#exClock')){clearInterval(R&&R.timer);return}R.left--;$('#exClock').textContent=exTime(Math.max(0,R.left));if(R.left<=0)exFinish()},1000);
    exDraw();scrollTo(0,0)};info()}
function exDraw(){const R=EX.run,x=R.qs[R.i],done=R.qs.filter(q=>q.pick!==null).length;
  $('#exBox').innerHTML=`<div class="score ex-bar"><span class="qn">Question ${R.i+1} of ${R.qs.length} · ${done} answered</span>${R.left!==null?`<b class="ex-clock" id="exClock">${exTime(R.left)}</b>`:''}</div>
    <div class="step"><p><b>${x.q.q}</b></p><div class="opts">${x.ord.map(j=>`<button class="opt${x.pick===j?' picked':''}" data-j="${j}">${x.q.o[j]}</button>`).join('')}</div></div>
    <div class="fc-nav"><button class="btn" data-a="prev"${R.i?'':' disabled'}>‹ Previous</button><button class="btn" data-a="flag" aria-pressed="${x.flag}">${x.flag?'⚑ Flagged':'⚐ Flag'}</button><button class="btn" data-a="next"${R.i<R.qs.length-1?'':' disabled'}>Next ›</button><button class="btn primary" data-a="end">Finish</button></div>
    <div class="ex-map">${R.qs.map((q,k)=>`<button data-k="${k}" class="${q.pick!==null?'done':''}${q.flag?' flag':''}${k===R.i?' cur':''}" aria-label="Question ${k+1}">${k+1}</button>`).join('')}</div>`;
  $('#exBox').onclick=e=>{const b=e.target.closest('button');if(!b||!EX.run)return;
    if(b.dataset.j!==undefined){x.pick=+b.dataset.j;if(R.i<R.qs.length-1)R.i++;exDraw()}
    else if(b.dataset.k!==undefined){R.i=+b.dataset.k;exDraw()}
    else if(b.dataset.a==='prev'){R.i--;exDraw()}else if(b.dataset.a==='next'){R.i++;exDraw()}
    else if(b.dataset.a==='flag'){x.flag=!x.flag;exDraw()}
    else if(b.dataset.a==='end'){const left=R.qs.filter(q=>q.pick===null).length;if(!left||b.dataset.sure){exFinish()}else{b.dataset.sure=1;b.textContent=`${left} unanswered. Finish anyway?`}}}}
function exFinish(){const R=EX.run;if(!R)return;clearInterval(R.timer);EX.run=null;const box=$('#exBox');if(!box)return;box.onclick=null;
  const n=R.qs.length,r=R.qs.filter(x=>x.pick===x.q.a).length,t=Math.round((Date.now()-R.t0)/1000),pc=Math.round(r/n*100);
  const H=exHist();H.push({d:new Date().toISOString().slice(0,10),p:EX.part==='all'?'The whole book':EX.part,r,n,t});store.set('exam-hist',JSON.stringify(H.slice(-10)));
  const by={};R.qs.forEach(x=>{const p=exPart(x.q.c);by[p]=by[p]||[0,0];by[p][1]++;if(x.pick===x.q.a)by[p][0]++});
  const wrong=R.qs.filter(x=>x.pick!==x.q.a);
  box.innerHTML=`<div class="verdict ex-res"><span class="eyebrow">Result</span><h2>${r} / ${n} <small>(${pc}%)</small></h2><p>Time ${exTime(t)}. ${pc>=80?'Excellent.':pc>=60?'A pass, with gaps to close below.':'Review the chapters below and try again.'}</p></div>
    <div class="tbl"><table><thead><tr><th>Part</th><th>Score</th></tr></thead><tbody>${Object.entries(by).map(([p,v])=>`<tr><td>${p}</td><td><b>${v[0]} / ${v[1]}</b></td></tr>`).join('')}</tbody></table></div>
    <div class="fc-nav" style="justify-content:flex-start"><button class="btn primary" id="exAgain">New exam</button></div>
    <h2 class="pr-h" style="margin-top:var(--s5)">${wrong.length?`Review: ${wrong.length} to revisit`:'All correct'}</h2>
    <div class="case">${wrong.map(x=>`<div class="step"><div class="eyebrow">${x.q.c?`<a href="#ch${x.q.c}">Chapter ${LABEL[x.q.c]} · ${TITLES[x.q.c]}</a>`:esc(x.q.d||'Practice')}</div><p><b>${x.q.q}</b></p><div class="opts">${x.q.o.map((o,j)=>`<button class="opt${j===x.q.a?' right':j===x.pick?' wrong':''}" disabled>${o}</button>`).join('')}</div><div class="expl">${x.pick===null?'<b>Not answered.</b> ':''}${x.q.e}</div></div>`).join('')}</div>`;
  $('#exAgain').onclick=()=>{exSetup();scrollTo(0,0)};scrollTo(0,0)}

/* ---------- Animations index ---------- */
let ANIM=null;
const AN_EXTRA={platelet:['Platelet adhesion, activation and aggregation','Follow one platelet from rest to plug, then compare Bernard–Soulier, von Willebrand disease, Glanzmann, storage pool and grey platelet.'],rbc:['Red cell shapes','Nine red cell shapes in 3D, with a cut-in-half view and a blood film view.'],membrane:['Red cell membrane skeleton','Spectrin, ankyrin, band 3 and protein 4.1: vertical and horizontal links, and what breaks in spherocytosis and elliptocytosis.'],hb:['Haemoglobin: oxygen loading, HbF and HbS','The tense and relaxed states as oxygen loads, fetal haemoglobin, and sickle haemoglobin fibres.'],coag:['Cell-based coagulation','Initiation on the tissue factor cell, amplification and propagation on the platelet, and the fibrin clot. Compare haemophilia A and B.']};
const AN_ORDER=['iron','hb','rbc','membrane','pnh','endo','platelet','endovwf','coag','endoac','fib'];
async function animations(){
  view.innerHTML='<p class="col note" style="padding-top:2rem">Loading…</p>';
  try{if(!ANIM){const r=await fetch('anim.json');if(!r.ok)throw 0;ANIM=await r.json()}}
  catch(e){view.innerHTML=`<div class="col"><h1>Animations not available</h1><p>Open this page once while online so it is saved for offline use.</p><p><a href="#home">Back to contents</a></p></div>`;return}
  const chl=(c,a)=>`<a href="#ch${c}/${a}">Chapter ${LABEL[c]} · ${TITLES[c]}</a>`;
  const keys=AN_ORDER.filter(k=>ANIM.scenes[k]).concat(Object.keys(ANIM.scenes).filter(k=>!AN_ORDER.includes(k)));
  const sc=keys.map(k=>{const m=L3META[k]||AN_EXTRA[k]||['3D model',''],L=ANIM.scenes[k];
    return `<figure data-q="${esc((m[0]+' '+m[1]).toLowerCase())}"><a href="#ch${L[0][0]}/${L[0][1]}"><img src="img/3d-${k}.jpg" alt="" loading="lazy" width="400" height="250"><span class="an-badge">3D · narrated</span></a><figcaption><b>${m[0]}</b><span>${m[1]}</span><small>${L.map(x=>chl(x[0],x[1])).join(' · ')}</small></figcaption></figure>`}).join('');
  const fg=ANIM.figs.map(f=>`<figure data-q="${esc((f.cap+' '+TITLES[f.c]).toLowerCase())}"><a class="an-svg" href="#ch${f.c}/fig-${f.i}"><img src="${f.src}" alt="" loading="lazy" width="400" height="250"><span class="an-badge">▶ Animate</span></a><figcaption><span>${f.cap}</span><small>${chl(f.c,'fig-'+f.i)}</small></figcaption></figure>`).join('');
  view.innerHTML=`<article class="col chead" id="top"><div class="eyebrow">Animations</div><h1>Every animation in one place</h1>
    <p>${keys.length} narrated 3D scenes and ${ANIM.figs.length} animated diagrams. Tap one to open it at its place in the book.</p></article>
    <section class="wide an-idx"><input type="search" id="anQ" placeholder="Search, e.g. platelet, hepcidin, flow" aria-label="Search animations">
      <h2 class="pr-h">3D scenes</h2><p class="note">Press the play button on the scene, then Play. Turn on 🔈 for the voice narration.</p><div class="an-grid" id="anSc">${sc}</div>
      <h2 class="pr-h" style="margin-top:var(--s6)">Animated diagrams</h2><p class="note">Each opens at the diagram; press ▶ Animate under it to watch it build step by step.</p><div class="an-grid" id="anFg">${fg}</div>
      <p class="nomatch note" id="anNone" hidden>No animation matches.</p></section>`+footer();
  $('#anQ').oninput=e=>{const v=e.target.value.trim().toLowerCase();let n=0;view.querySelectorAll('.an-grid figure').forEach(f=>{const ok=!v||f.dataset.q.includes(v);f.hidden=!ok;if(ok)n++});$('#anNone').hidden=n>0};
  document.title='Animations · Interactive Haematology Diagnosis';buildToc('anim');scrollTo(0,0)}

/* ---------- Videos index ---------- */
let VIDS=null;
async function videos(){
  view.innerHTML='<p class="col note" style="padding-top:2rem">Loading…</p>';
  try{if(!VIDS){const r=await fetch('videos.json');if(!r.ok)throw 0;VIDS=await r.json()}}
  catch(e){view.innerHTML=`<div class="col"><h1>Videos not available</h1><p>Open this page once while online so it is saved for offline use.</p><p><a href="#home">Back to contents</a></p></div>`;return}
  const by={};VIDS.forEach(c=>by[c.c]=c.items);let total=0,html='';
  BOOK.forEach(({p,items})=>{const chs=items.filter(i=>by[i.n]);if(!chs.length)return;
    html+=`<section class="vd-part"><h2 class="pr-h">${p}</h2>`+chs.map(({n,c})=>{const L=by[n];total+=L.length;
      return `<div class="vd-ch"><h3><a href="#ch${n}/vid-${L[0].k}"><span class="n">${LABEL[n]}</span> ${c}</a> <small>${L.length} video${L.length===1?'':'s'}</small></h3><ol class="vm-list">${L.map(x=>{const yt=x.v?`https://www.youtube.com/watch?v=${x.v}${x.list?'&list='+x.list:''}`:`https://www.youtube.com/playlist?list=${x.list}`;
        return `<li data-q="${esc((x.t+' '+c).toLowerCase())}"><a class="vm-it" href="#ch${n}/vid-${x.k}">${x.v?`<img src="https://i.ytimg.com/vi/${x.v}/mqdefault.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`:'<span class="vm-pl" aria-hidden="true">☰</span>'}<span class="vm-t">${esc(x.t)}${x.short?' <small>short</small>':''}${x.v&&!x.list?'':' <small>playlist</small>'}</span></a><a class="vm-yt" href="${yt}" target="_blank" rel="noopener" aria-label="Open ${esc(x.t)} on YouTube">YouTube ↗</a></li>`}).join('')}</ol></div>`}).join('')+'</section>'});
  view.innerHTML=`<article class="col chead" id="top"><div class="eyebrow">Videos</div><h1>Every lecture video in one place</h1>
    <p>${total} lectures and playlists by Prof. Abeer Mohammed, listed by chapter. Tap a title to open it in its chapter, or YouTube to watch it there.</p>
    <div class="meta"><span>Videos stream from YouTube and need an internet connection</span></div></article>
    <section class="col vd-idx"><input type="search" id="vdQ" placeholder="Search videos, e.g. thalassemia, platelet, flow" aria-label="Search videos">${html}<p class="note" id="vdNone" hidden>No video matches.</p></section>`+footer();
  $('#vdQ').oninput=e=>{const v=e.target.value.trim().toLowerCase();let n=0;view.querySelectorAll('.vd-ch').forEach(ch=>{let k=0;ch.querySelectorAll('li').forEach(li=>{const ok=!v||li.dataset.q.includes(v);li.hidden=!ok;if(ok)k++});ch.hidden=!k;n+=k});
    view.querySelectorAll('.vd-part').forEach(p=>p.hidden=!p.querySelector('.vd-ch:not([hidden])'));$('#vdNone').hidden=n>0};
  document.title='Videos · Interactive Haematology Diagnosis';buildToc('videos');scrollTo(0,0)}

W.lab3d=function(w){const sc=w.dataset.scene,m=L3META[sc]||['3D model',''];
  w.innerHTML='<div class="l3-poster" style="background-image:url(img/3d-'+sc+'.jpg)"><div class="l3-pin"><span class="l3-badge">3D</span><h3>'+esc(m[0])+'</h3><p>'+esc(m[1])+'</p><button type="button" class="l3-go">▶ Open the 3D model</button><small>Works offline. Drag to rotate, pinch to zoom.</small></div></div>';
  const b=w.querySelector('.l3-go');
  b.onclick=()=>{b.disabled=true;b.textContent='Loading…';loadJS('vendor/three.min.js').then(()=>loadJS('lab3d.js')).then(()=>window.Lab3D.mount(w,sc)).catch(()=>{b.disabled=false;b.textContent='Could not load. Try again'})}};

/* ---------- start ---------- */
buildToc(0);route();
if('serviceWorker' in navigator){try{navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}}
})();
