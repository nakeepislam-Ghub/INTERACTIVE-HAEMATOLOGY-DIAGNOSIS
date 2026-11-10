/* 3D lab: interactive WebGL models (platelet activation, red cell shapes). Needs vendor/three.min.js (global THREE). */
(function(){
'use strict';
const T=THREE, V3=T.Vector3, UP=new V3(0,1,0);
const clamp=(x,a,b)=>x<a?a:x>b?b:x, c01=x=>clamp(x,0,1), seg=(t,a,b)=>c01((t-a)/(b-a));
const ease=x=>x*x*(3-2*x), lerp=(a,b,u)=>a+(b-a)*u;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function fib(n,i,off){const y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y),a=i*2.399963+(off||0);return new V3(Math.cos(a)*r,y,Math.sin(a)*r)}
function fixSeams(g,W,H){const n=g.attributes.normal,row=W+1,v=new V3();
  for(let iy=0;iy<=H;iy++){const a=iy*row,b=a+W;v.set(n.getX(a)+n.getX(b),n.getY(a)+n.getY(b),n.getZ(a)+n.getZ(b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z)}
  for(const iy of [0,H]){v.set(0,0,0);for(let ix=0;ix<=W;ix++){const k=iy*row+ix;v.x+=n.getX(k);v.y+=n.getY(k);v.z+=n.getZ(k)}v.normalize();for(let ix=0;ix<=W;ix++)n.setXYZ(iy*row+ix,v.x,v.y,v.z)}
  n.needsUpdate=true}
function stretch(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);const d=new V3().subVectors(b,a),l=d.length();if(l<1e-5){m.visible=false;return}m.visible=true;m.quaternion.setFromUnitVectors(UP,d.divideScalar(l));m.scale.set(1,l,1)}
function dot(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}

/* ---------------- orbit camera ---------------- */
function Orbit(cam,el,o){
  const st={tx:o.target.clone(),r:o.r,th:o.th,ph:o.ph};let fly=null,engaged=false,pinch0=0,r0=0,idle=0;const P=new Map();
  const self={st,auto:!!o.auto,busy:false};
  el.addEventListener('pointerdown',e=>{engaged=true;fly=null;idle=0;self.busy=true;try{el.setPointerCapture(e.pointerId)}catch(_){}P.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(P.size===2){const[a,b]=[...P.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);r0=st.r}});
  el.addEventListener('pointermove',e=>{const p=P.get(e.pointerId);if(!p)return;
    if(P.size===1){st.th-=(e.clientX-p.x)*.0085;st.ph=clamp(st.ph-(e.clientY-p.y)*.0085,o.phMin,o.phMax)}
    p.x=e.clientX;p.y=e.clientY;
    if(P.size===2&&pinch0){const[a,b]=[...P.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(d>0)st.r=clamp(r0*pinch0/d,o.rMin,o.rMax)}});
  const up=e=>{P.delete(e.pointerId);if(P.size<2)pinch0=0;if(!P.size)self.busy=false};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
  el.addEventListener('wheel',e=>{if(!engaged)return;e.preventDefault();fly=null;st.r=clamp(st.r*Math.exp(e.deltaY*.0012),o.rMin,o.rMax)},{passive:false});
  const outside=e=>{if(!el.contains(e.target))engaged=false};document.addEventListener('pointerdown',outside);
  self.dispose=()=>document.removeEventListener('pointerdown',outside);
  self.zoom=f=>{fly=null;st.r=clamp(st.r*f,o.rMin,o.rMax)};
  self.flyTo=(to,d)=>{let dth=(to.th===undefined?st.th:to.th)-st.th;dth=Math.atan2(Math.sin(dth),Math.cos(dth));
    fly={a:{tx:st.tx.clone(),r:st.r,th:st.th,ph:st.ph},b:{tx:(to.tx||st.tx).clone(),r:to.r===undefined?st.r:to.r,th:st.th+dth,ph:to.ph===undefined?st.ph:to.ph},t:0,d:d||.9}};
  self.reset=()=>self.flyTo({tx:o.target,r:o.r,th:o.th,ph:o.ph});
  self.update=dt=>{
    if(fly){fly.t+=dt/fly.d;const u=ease(c01(fly.t));st.tx.lerpVectors(fly.a.tx,fly.b.tx,u);st.r=lerp(fly.a.r,fly.b.r,u);st.th=lerp(fly.a.th,fly.b.th,u);st.ph=lerp(fly.a.ph,fly.b.ph,u);if(fly.t>=1)fly=null}
    else if(self.auto&&!self.busy){idle+=dt;if(idle>1.2)st.th+=dt*.22}
    const s=Math.sin(st.ph);cam.position.set(st.tx.x+st.r*s*Math.sin(st.th),st.tx.y+st.r*Math.cos(st.ph),st.tx.z+st.r*s*Math.cos(st.th));cam.lookAt(st.tx)};
  return self}

/* ---------------- cinematic post-processing: depth of field, bloom, vignette, grain ---------------- */
function Post(ren){
  const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const quad=new T.Mesh(new T.PlaneGeometry(2,2)),oc=new T.OrthographicCamera(-1,1,1,-1,0,1),qs=new T.Scene();qs.add(quad);quad.frustumCulled=false;
  const HF=T.HalfFloatType,mk=(s)=>new T.WebGLRenderTarget(1,1,Object.assign({type:HF,depthBuffer:false},s||{}));
  const main=new T.WebGLRenderTarget(1,1,{type:HF,samples:4});main.depthTexture=new T.DepthTexture(1,1);main.depthTexture.type=T.UnsignedIntType;
  const h1=mk(),h2=mk(),q1=mk(),q2=mk(),b1=mk(),b2=mk();
  const blur=new T.ShaderMaterial({uniforms:{t:{value:null},dir:{value:new T.Vector2()},th:{value:0}},vertexShader:VS,depthTest:false,depthWrite:false,
    fragmentShader:'uniform sampler2D t;uniform vec2 dir;uniform float th;varying vec2 vUv;vec3 f(vec2 o){vec3 c=texture2D(t,vUv+o).rgb;if(th>0.){float l=dot(c,vec3(.2126,.7152,.0722));c*=smoothstep(th,th+.6,l);}return c;}void main(){vec3 c=f(vec2(0))*.227027;c+=(f(dir*1.3846)+f(-dir*1.3846))*.3162162;c+=(f(dir*3.2308)+f(-dir*3.2308))*.0702703;gl_FragColor=vec4(c,1.);}'});
  const comp=new T.ShaderMaterial({uniforms:{tC:{value:null},tD:{value:null},tH:{value:null},tQ:{value:null},tB:{value:null},near:{value:.1},far:{value:200},focus:{value:8},range:{value:.35},bloom:{value:.9},time:{value:0},res:{value:new T.Vector2()},vig:{value:.55}},
    vertexShader:VS,depthTest:false,depthWrite:false,toneMapped:true,
    fragmentShader:`#include <packing>
uniform sampler2D tC,tD,tH,tQ,tB;uniform float near,far,focus,range,bloom,time,vig;uniform vec2 res;varying vec2 vUv;
float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+time)*43758.5453);}
void main(){float d=texture2D(tD,vUv).x;float z=-perspectiveDepthToViewZ(d,near,far);
 float coc=clamp(abs(z-focus)/(focus*range),0.,1.);
 vec3 c=texture2D(tC,vUv).rgb,h=texture2D(tH,vUv).rgb,q=texture2D(tQ,vUv).rgb;
 c=mix(c,h,smoothstep(.12,.5,coc));c=mix(c,q,smoothstep(.45,1.,coc));
 c+=texture2D(tB,vUv).rgb*bloom;
 vec2 v=vUv-.5;c*=mix(1.,smoothstep(.85,.2,length(v*vec2(res.x/res.y,1.))*.95),vig);
 c+= (rnd(vUv*res)-.5)*.025;
 gl_FragColor=vec4(max(c,0.),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`});
  let W=1,H=1;
  const self={on:true,focus:8,range:.35,bloom:.9};
  self.size=(w,h)=>{W=w;H=h;main.setSize(w,h);const hw=Math.max(1,w>>1),hh=Math.max(1,h>>1),qw=Math.max(1,w>>2),qh=Math.max(1,h>>2);h1.setSize(hw,hh);h2.setSize(hw,hh);q1.setSize(qw,qh);q2.setSize(qw,qh);b1.setSize(qw,qh);b2.setSize(qw,qh);comp.uniforms.res.value.set(w,h)};
  const pass=(m,out)=>{quad.material=m;ren.setRenderTarget(out);ren.render(qs,oc)};
  const bl=(src,out,dx,dy,th)=>{blur.uniforms.t.value=src.texture||src;blur.uniforms.dir.value.set(dx,dy);blur.uniforms.th.value=th||0;pass(blur,out)};
  self.render=(scene,cam,t)=>{
    ren.setRenderTarget(main);ren.render(scene,cam);
    const pw=ren.getPixelRatio(),hw=1/(W/2),hh=1/(H/2),qw=1/(W/4),qh=1/(H/4);
    bl(main,h1,hw,0);bl(h1,h2,0,hh);
    bl(h2,q1,qw*1.6,0);bl(q1,q2,0,qh*1.6);
    bl(h2,b1,qw*1.4,0,1.15);bl(b1,b2,0,qh*1.4);bl(b2,b1,qw*2.6,0);bl(b1,b2,0,qh*2.6);
    const u=comp.uniforms;u.tC.value=main.texture;u.tD.value=main.depthTexture;u.tH.value=h2.texture;u.tQ.value=q2.texture;u.tB.value=b2.texture;
    u.near.value=cam.near;u.far.value=cam.far;u.focus.value=self.focus;u.range.value=self.range;u.bloom.value=self.bloom;u.time.value=(t||0)%10;
    pass(comp,null)};
  self.dispose=()=>{[main,h1,h2,q1,q2,b1,b2].forEach(r=>r.dispose());blur.dispose();comp.dispose();quad.geometry.dispose()};
  return self}

/* ---------------- shared shell ---------------- */
/* ---------- narration: pre-recorded English voice for every caption ---------- */
const NARR={on:false,keys:null,au:null,owner:null,
  hash(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return(h>>>0).toString(16).padStart(8,'0')},
  load(){if(this.keys)return this.keys;this.keys=fetch('audio/narr.json').then(r=>r.ok?r.json():[]).then(a=>new Set(a)).catch(()=>new Set());return this.keys},
  say(api,text){const k=this.hash(text);this.load().then(set=>{if(!this.on||!set.has(k))return;if(!this.au)this.au=new Audio();const a=this.au;a.pause();this.owner=api;this.want=k;this.pend=true;const done=()=>{if(this.want===k)this.pend=false};fetch('audio/'+k+'.mp3').then(r=>r.blob()).then(b=>{if(this.want!==k||!this.on)return;if(this.url)URL.revokeObjectURL(this.url);this.url=URL.createObjectURL(b);a.src=this.url;a.play().then(done,done)}).catch(done)})},
  stop(){this.pend=false;this.want=null;if(this.au)this.au.pause()},
  busy(api){const a=this.au;return!!(this.on&&a&&this.owner===api&&(this.pend||(!a.paused&&!a.ended&&a.src)))}};
window.__narr=NARR;try{NARR.on=localStorage.getItem('l3snd')==='1'}catch(_){}
const narrText=el=>el.textContent.replace(/\s+/g,' ').trim();
// keep a timeline inside the current stage while its narration is still speaking
const holdT=(api,t0,t,stages)=>{if(!NARR.busy(api))return t;const s=stages.find(s=>t0<s[2])||stages[stages.length-1];return Math.min(t,Math.max(t0,s[2]-1e-4))};
function mount(host,name){
  const def=SCENES[name];if(!def)return;
  host.innerHTML='<div class="l3"><div class="l3-stage"><canvas aria-label="'+esc(def.aria)+'"></canvas><svg class="l3-lines" aria-hidden="true"></svg><div class="l3-lbs"></div>'+
    '<div class="l3-tools"><button data-a="in" title="Zoom in" aria-label="Zoom in">+</button><button data-a="out" title="Zoom out" aria-label="Zoom out">−</button>'+
    '<button data-a="reset" title="Reset view" aria-label="Reset view">⟲</button><button data-a="lbl" aria-pressed="true" title="Show or hide labels">Aa</button>'+
    '<button data-a="snd" aria-pressed="false" title="English voice narration" aria-label="Voice narration">🔈</button><button data-a="fx" aria-pressed="true" title="Cinematic effects (turn off on slow devices)">✦</button><button data-a="max" title="Full screen" aria-label="Full screen">⤢</button></div>'+
    '<div class="l3-hint">Drag to rotate · pinch or + / − to zoom'+(def.labels?' · tap a label':'')+'</div></div>'+
    '<div class="l3-cap" aria-live="polite"></div><div class="l3-ctrl"></div><aside class="l3-info" hidden aria-live="polite"></aside></div>';
  const box=host.querySelector('.l3'),stage=box.querySelector('.l3-stage'),cv=stage.querySelector('canvas'),lbs=stage.querySelector('.l3-lbs'),svg=stage.querySelector('.l3-lines'),SVGNS='http://www.w3.org/2000/svg';
  let ren;
  try{ren=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false})}
  catch(e){stage.innerHTML='<p class="l3-err">3D needs WebGL, which this browser or device has turned off. Try another browser, or turn on hardware acceleration.</p>';return}
  const slow=Math.min(screen.width,screen.height)<700||(navigator.hardwareConcurrency||8)<=4;ren.setPixelRatio(Math.min(devicePixelRatio||1,slow?1.5:2));ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.05;ren.localClippingEnabled=true;
  const scene=new T.Scene(),cam=new T.PerspectiveCamera(40,1,.1,200);
  const orbit=Orbit(cam,cv,def.cam);let post=null;try{post=Post(ren)}catch(e){post=null}
  {let fx=null;try{fx=localStorage.getItem('l3fx')}catch(_){}if(post&&fx==='0')post.on=false;}
  const api={box,stage,scene,cam,ren,orbit,post,low:slow,cap:box.querySelector('.l3-cap'),ctrl:box.querySelector('.l3-ctrl'),info:box.querySelector('.l3-info'),labels:[],showLabels:true};
  api.showInfo=(title,html,kicker)=>{const a=api.info;a.hidden=false;a.innerHTML='<div class="l3-ih"><span>'+esc(kicker||'Structure')+'</span><button aria-label="Close">✕</button></div><h4>'+esc(title)+'</h4>'+html;
    a.querySelector('button').onclick=()=>{a.hidden=true;lbs.querySelectorAll('.on').forEach(b=>b.classList.remove('on'))}};
  const S=def.build(api);
  // labels
  const LB=(api.labels||[]).map(L=>{const b=document.createElement('button');b.className='l3-lb';b.type='button';b.innerHTML='<span>'+esc(L.title)+'</span>';lbs.appendChild(b);
    const ln=document.createElementNS(SVGNS,'polyline'),dt=document.createElementNS(SVGNS,'circle');dt.setAttribute('r','3.2');svg.append(ln,dt);L.ln=ln;L.dt=dt;
    b.onclick=e=>{e.stopPropagation();lbs.querySelectorAll('.on').forEach(x=>x.classList.remove('on'));b.classList.add('on');const p=L.pos();if(p)orbit.flyTo({tx:p,r:L.r||5.5,ph:Math.min(orbit.st.ph,1.15)});api.showInfo(L.title,'<p>'+L.text+'</p>',L.kicker)};return{L,b}});
  if(!LB.length)stage.querySelector('[data-a="lbl"]').hidden=true;
  {const sb=stage.querySelector('[data-a="snd"]');sb.setAttribute('aria-pressed',NARR.on);sb.textContent=NARR.on?'🔊':'🔈';
   new MutationObserver(()=>{if(NARR.on)NARR.say(api,narrText(api.cap))}).observe(api.cap,{childList:true,characterData:true,subtree:true})}
  {const fb=stage.querySelector('[data-a="fx"]');if(!post)fb.hidden=true;else fb.setAttribute('aria-pressed',post.on)}
  stage.querySelector('.l3-tools').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;
    if(a==='in')orbit.zoom(.8);else if(a==='out')orbit.zoom(1.25);else if(a==='reset'){orbit.reset();api.info.hidden=true;lbs.querySelectorAll('.on').forEach(x=>x.classList.remove('on'))}
    else if(a==='lbl'){api.showLabels=!api.showLabels;b.setAttribute('aria-pressed',api.showLabels);lbs.hidden=!api.showLabels;svg.style.display=api.showLabels?'':'none'}
    else if(a==='snd'){NARR.on=!NARR.on;try{localStorage.setItem('l3snd',NARR.on?'1':'0')}catch(_){}document.querySelectorAll('.l3-tools [data-a="snd"]').forEach(x=>{x.setAttribute('aria-pressed',NARR.on);x.textContent=NARR.on?'🔊':'🔈'});if(NARR.on)NARR.say(api,narrText(api.cap));else NARR.stop()}
    else if(a==='fx'&&post){post.on=!post.on;b.setAttribute('aria-pressed',post.on);try{localStorage.setItem('l3fx',post.on?'1':'0')}catch(_){}resize()}
    else if(a==='max'){const on=!box.classList.contains('max');box.classList.toggle('max',on);document.documentElement.classList.toggle('l3-lock',on);b.textContent=on?'✕':'⤢';b.setAttribute('aria-label',on?'Exit full screen':'Full screen');resize()}});
  const keyEsc=e=>{if(e.key==='Escape'&&box.classList.contains('max'))stage.querySelector('[data-a="max"]').click()};document.addEventListener('keydown',keyEsc);
  let W=0,H=0;
  function resize(){const r=stage.getBoundingClientRect();W=Math.max(1,r.width|0);H=Math.max(1,r.height|0);ren.setSize(W,H,false);if(post){const pr=ren.getPixelRatio();post.size(Math.round(W*pr),Math.round(H*pr))}svg.setAttribute('viewBox','0 0 '+W+' '+H);cam.aspect=W/H;cam.updateProjectionMatrix()}
  const ro=new ResizeObserver(resize);ro.observe(stage);resize();
  const pv=new V3();
  function place(){if(!api.showLabels)return;const vis=[];for(const it of LB){const{L,b}=it;const p=L.pos();let ok=!!p;if(ok){pv.copy(p).project(cam);ok=pv.z<1&&Math.abs(pv.x)<1.02&&Math.abs(pv.y)<1.02}
    if(!ok){if(!b.hidden){b.hidden=true;L.ln.style.display=L.dt.style.display='none'}continue}if(b.hidden){b.hidden=false;L.ln.style.display=L.dt.style.display=''}
    if(!it.w){it.w=b.offsetWidth;it.h=b.offsetHeight}it.ax=(pv.x+1)/2*W;it.ay=(1-pv.y)/2*H;const right=it.ax<W*.58;it.side=right?1:-1;
    it.x=right?it.ax+34:it.ax-34-it.w;it.y=it.ay-38-it.h;if(it.y<4)it.y=it.ay+22;if(it.x<4)it.x=4;if(it.x+it.w>W-4)it.x=W-4-it.w;vis.push(it)}
    vis.sort((a,b)=>a.y-b.y);for(let i=0;i<vis.length;i++){const A=vis[i];for(let j=0;j<i;j++){const B=vis[j];if(A.x<B.x+B.w+6&&B.x<A.x+A.w+6&&A.y<B.y+B.h+3&&B.y<A.y+A.h+3)A.y=B.y+B.h+3}
      A.b.style.transform='translate('+A.x.toFixed(1)+'px,'+A.y.toFixed(1)+'px)';
      const ey=A.y+A.h,ex=A.side>0?A.x:A.x+A.w,fx=A.side>0?A.x+A.w:A.x;
      A.L.ln.setAttribute('points',A.ax.toFixed(1)+','+A.ay.toFixed(1)+' '+ex.toFixed(1)+','+ey.toFixed(1)+' '+fx.toFixed(1)+','+ey.toFixed(1));A.L.dt.setAttribute('cx',A.ax.toFixed(1));A.L.dt.setAttribute('cy',A.ay.toFixed(1));
      const on=A.b.classList.contains('on');A.L.ln.classList.toggle('on',on);A.L.dt.classList.toggle('on',on)}}
  let raf=0,vis=true,last=performance.now(),dead=false;
  function frame(now){raf=0;if(!host.isConnected){dispose();return}const fake=window.__l3t;let dt=Math.min(.05,(now-last)/1000);last=now;if(fake!==undefined){now=fake*1000;dt=window.__l3dt||1/24}S.tick(dt,now/1000);orbit.update(dt);if(post&&post.on){post.focus=S.focus?S.focus():orbit.st.r;if(S.fx)S.fx(post);post.render(scene,cam,now/1000)}else{ren.setRenderTarget(null);ren.render(scene,cam)}place();if(vis&&!document.hidden)raf=requestAnimationFrame(frame)}
  function go(){if(!raf&&!dead){last=performance.now();raf=requestAnimationFrame(frame)}}
  const io=new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis)go()});io.observe(stage);
  const onVis=()=>{if(!document.hidden&&vis)go()};document.addEventListener('visibilitychange',onVis);
  function dispose(){if(dead)return;dead=true;if(NARR.owner===api)NARR.stop();io.disconnect();ro.disconnect();orbit.dispose();document.removeEventListener('visibilitychange',onVis);document.removeEventListener('keydown',keyEsc);document.documentElement.classList.remove('l3-lock');
    scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)[].concat(o.material).forEach(m=>{if(m.map)m.map.dispose();m.dispose()})});if(post)post.dispose();ren.dispose();try{ren.forceContextLoss()}catch(_){}}
  host._l3=api;go();return api}

/* ================= PLATELET ================= */
const DISC={xz:1.45,ys:.42,ruf:0,egg:0,flat:0,bump:0},SPH={xz:1.02,ys:1,ruf:0,egg:0,flat:.12,bump:.05},SPREAD={xz:2.45,ys:.2,ruf:.09,egg:.45,flat:.7,bump:0};
const mixS=(a,b,u)=>{const o={};for(const k in a)o[k]=a[k]+(b[k]-a[k])*u;return o};
function surf(d,S,out){const rho=Math.hypot(d.x,d.z),phi=Math.atan2(d.z,d.x);
  const r=S.xz*(1+S.ruf*(.7*Math.sin(6*phi)+.3*Math.sin(11*phi+1.3))*rho*rho*rho*rho);
  const b=1+S.bump*Math.sin(5.1*d.x+1)*Math.sin(4.7*d.y+2)*Math.sin(5.3*d.z);
  let y=d.y*S.ys;if(d.y>0)y+=S.egg*d.y*d.y*d.y;else y*=1-S.flat*.85;
  return out.set(d.x*r*b,y*b,d.z*r*b)}
function snorm(d,S,out){return out.set(d.x/(S.xz*S.xz),d.y/(S.ys*S.ys)*(d.y>0?1:1),d.z/(S.xz*S.xz)).normalize()}
const DIS={
  normal:{name:'Normal',lab:''},
  bss:{name:'Bernard–Soulier',lab:'<b>Lab clues:</b> low count with giant platelets (high MPV). No aggregation with ristocetin, <i>not</i> corrected by normal plasma; other agonists normal. Flow: reduced CD42b. Autosomal recessive (<i>GP1BA</i>, <i>GP1BB</i>, <i>GP9</i>).'},
  vwd:{name:'Von Willebrand disease',lab:'<b>Lab clues:</b> low VWF:Ag and VWF activity (types 1 and 3) or activity:antigen ratio below 0.7 (type 2). Ristocetin response reduced and corrected by normal plasma. FVIII may be low. Platelet count normal, except type 2B.'},
  gt:{name:'Glanzmann',lab:'<b>Lab clues:</b> normal count and size. No aggregation with ADP, collagen, adrenaline or arachidonic acid; ristocetin normal. Flow: absent CD41/CD61. Autosomal recessive (<i>ITGA2B</i>, <i>ITGB3</i>).'},
  spd:{name:'Storage pool (δ)',lab:'<b>Lab clues:</b> normal count. Primary wave without a secondary wave with ADP and adrenaline; weak collagen response; low ATP release on lumi-aggregometry; few dense granules on whole-mount EM. Look for albinism (Hermansky–Pudlak) or giant granules (Chediak–Higashi).'},
  gps:{name:'Grey platelet',lab:'<b>Lab clues:</b> mild thrombocytopenia with large pale grey platelets on the film; EM shows no α granules; <i>NBEAL2</i>. Aggregation is near normal or mildly reduced. Marrow fibrosis may develop.'}};
const STAGES=[['Resting',0,.12],['Adhesion',.12,.3],['Shape change',.3,.5],['Secretion',.5,.7],['Aggregation',.7,1]];
const CAP={
  normal:['Resting platelets are smooth discs, held in shape by a marginal band of microtubules. Healthy endothelium (prostacyclin, nitric oxide) keeps them from sticking.',
    'The injury exposes collagen. vWF bound to collagen uncoils under shear and catches GP Ib-IX-V, so the platelet tethers, rolls and stops. GPVI binds collagen directly and starts activation.',
    'Signals raise cytosolic calcium. The microtubule band contracts, the disc becomes a sphere and filopodia shoot out to grip the surface.',
    'Granules move to the centre and empty their contents. Dense granules release ADP and serotonin; α granules release fibrinogen, vWF and factor V. Thromboxane A2 is made from arachidonic acid by COX-1.',
    'Inside-out signalling switches αIIbβ3 to its high-affinity form. Dimeric fibrinogen bridges neighbouring platelets and the first platelet spreads flat. Thrombin made on the activated surface turns fibrinogen into fibrin strands that hold the plug together.'],
  bss:['Bernard–Soulier syndrome: GP Ib-IX-V is missing and the platelets are giant.','vWF uncoils on the collagen, but without GPIb there is nothing for it to catch. The giant platelet sweeps past the injury.','No adhesion, so activation never starts here.','No adhesion, so no secretion.','No platelet plug forms: mucosal bleeding from early childhood.'],
  vwd:['Von Willebrand disease: the platelets are normal, but there is little or no vWF.','With almost no vWF on the collagen, the platelet cannot tether under high shear and is swept on.','No adhesion, so activation never starts here.','No adhesion, so no secretion.','No plug forms. vWF also carries factor VIII, so FVIII may be low too.'],
  gt:null,spd:null,gps:null};
CAP.gt=CAP.normal.slice(0,4).concat(['Glanzmann thrombasthenia: adhesion, shape change and secretion are normal, but there is no αIIbβ3. Fibrinogen cannot bridge platelets, so the next platelet bounces off.']);
CAP.spd=CAP.normal.slice(0,3).concat(['Dense granules are missing, so very little ADP or serotonin is released. α granules still empty.','The first platelet catches one partner, but without ADP recruitment stalls: the aggregation curve shows a primary wave without a secondary wave.']);
CAP.gps=CAP.normal.slice(0,3).concat(['Grey platelet syndrome: α granules are missing, so the platelets look large and pale grey on the film. Dense granules still release ADP.',CAP.normal[4]]);

function noiseTex(n,seed,dots){const c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),R=rng(seed);x.fillStyle='#808080';x.fillRect(0,0,n,n);
  for(let i=0;i<dots;i++){const r=1+R()*n/40,px=R()*n,py=R()*n,g=x.createRadialGradient(px,py,0,px,py,r);const v=R()<.5?0:255;g.addColorStop(0,'rgba('+v+','+v+','+v+','+(.25+R()*.35)+')');g.addColorStop(1,'rgba(128,128,128,0)');x.fillStyle=g;x.beginPath();x.arc(px,py,r,0,7);x.fill()}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t}
function mergeGeos(list){let nv=0,ni=0;list.forEach(g=>{nv+=g.attributes.position.count;ni+=g.index.count});
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*3),I=new Uint32Array(ni);let o=0,oi=0;
  list.forEach(g=>{const p=g.attributes.position,n=g.attributes.normal,c=g.userData.col;P.set(p.array,o*3);N.set(n.array,o*3);for(let i=0;i<p.count;i++)C.set(c,(o+i)*3);const ix=g.index.array;for(let i=0;i<ix.length;i++)I[oi+i]=ix[i]+o;o+=p.count;oi+=ix.length;g.dispose()});
  const m=new T.BufferGeometry();m.setAttribute('position',new T.BufferAttribute(P,3));m.setAttribute('normal',new T.BufferAttribute(N,3));m.setAttribute('color',new T.BufferAttribute(C,3));m.setIndex(new T.BufferAttribute(I,1));return m}
function envMap(ren){const s=new T.Scene();const box=new T.Mesh(new T.SphereGeometry(20,32,16),new T.MeshBasicMaterial({color:0x1a0a0e,side:T.BackSide}));s.add(box);
  const L=(c,i,p,sc)=>{const m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(i),side:T.DoubleSide}));m.position.set(...p);m.scale.set(...sc);m.lookAt(0,0,0);s.add(m)};
  L(0xfff1e6,6,[4,12,6],[14,8,1]);L(0x9fc4ff,3,[-12,4,-8],[10,10,1]);L(0xff7a5a,2,[0,-10,4],[20,6,1]);L(0xffffff,2.5,[10,2,-10],[6,10,1]);
  const pm=new T.PMREMGenerator(ren),rt=pm.fromScene(s,.04);pm.dispose();s.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});return rt.texture}
const C_REST=new T.Color(0x8299b3),C_GLOW=new T.Color(0xffb54d),C_PALE=new T.Color(0x93a3c4),C_GREY=new T.Color(0xb8b6bd),E_GLOW=new T.Color(0xff8a1e);
function Platelet(scene,M,seed){
  const g=new T.Group();scene.add(g);const W=72,H=48;
  const geo=new T.SphereGeometry(1,W,H),base=geo.attributes.position.array.slice();
  const bodyM=M.body.clone(),body=new T.Mesh(geo,bodyM);body.renderOrder=2;g.add(body);
  const R=rng(seed),tmp=new V3(),tmp2=new V3();
  const gran=[];for(let i=0;i<40;i++){const dense=i>=33;let p;do{p=new V3(R()*2-1,R()*2-1,R()*2-1)}while(p.length()>1);p.multiplyScalar(.8);
    const m=new T.Mesh(M.sph,dense?M.dense:M.alpha);m.userData={p,dense,s:dense?.075:.06+R()*.06};g.add(m);gran.push(m)}
  const band=new T.Mesh(M.torus,M.band.clone());g.add(band);
  const fil=[];for(let i=0;i<14;i++){const a=i*2.399963+seed,y=-.6+(i%6)*.22,r=Math.sqrt(1-y*y);const d=new V3(Math.cos(a)*r,y,Math.sin(a)*r);const m=new T.Mesh(M.filo,bodyM);m.userData.d=d;m.userData.k=.75+R()*.6;g.add(m);fil.push(m)}
  const itgM=M.itg.clone();
  const mk=(n,off,kind)=>{const L=[];for(let i=0;i<n;i++){const d=fib(n,i,off),q=new T.Group();
    if(kind==='gp'){const s=new T.Mesh(M.stalk,M.gp);s.position.y=.13;s.scale.set(1.5,1,1.5);const h=new T.Mesh(M.head,M.gp);h.position.y=.29;h.scale.set(1.35,1.15,1.35);q.add(s,h)}
    else{for(const x of[-.035,.035]){const s=new T.Mesh(M.stalk,itgM);s.position.set(x,.12,0);s.scale.y=.92;q.add(s)}const h=new T.Mesh(M.head,itgM);h.position.y=.27;h.scale.set(1.35,.85,1.1);q.add(h)}
    q.userData.d=d;g.add(q);L.push(q)}return L};
  const gp=mk(13,0,'gp'),itg=mk(15,1.2,'itg');
  let key='';const self={g,body,gran,gp,itg,fil,band,S:DISC};
  self.local=(d,out)=>surf(d,self.S,out);
  self.world=(d,out)=>g.localToWorld(surf(d,self.S,out));
  self.head=(q,out)=>{out.set(0,.29*q.scale.y,0).applyQuaternion(q.quaternion).add(q.position);return g.localToWorld(out)};
  self.update=s=>{
    g.visible=s.vis!==false;if(!g.visible)return;
    g.position.copy(s.pos);g.rotation.set(s.rx||0,0,s.rz||0);g.scale.setScalar(s.scale||1);
    const S=self.S=s.S;const k=[S.xz,S.ys,S.ruf,S.egg,S.flat,S.bump].map(x=>x.toFixed(3)).join();
    if(k!==key){key=k;const p=geo.attributes.position;for(let i=0;i<p.count;i++){tmp.set(base[i*3],base[i*3+1],base[i*3+2]);surf(tmp,S,tmp2);p.setXYZ(i,tmp2.x,tmp2.y,tmp2.z)}
      p.needsUpdate=true;geo.computeVertexNormals();fixSeams(geo,W,H);geo.computeBoundingSphere()}
    const gl=s.glow||0,pa=s.pale||0,pulse=.8+.2*Math.sin((s.now||0)*5);
    bodyM.color.copy(s.grey?C_GREY:C_REST).lerp(C_GLOW,gl).lerp(C_PALE,pa);
    bodyM.emissive.copy(E_GLOW).multiplyScalar(gl*.28*pulse);
    bodyM.opacity=lerp(lerp(.97,.42,Math.max(gl,s.open||0)),.8,pa);bodyM.depthWrite=true;bodyM.sheen=lerp(.6,.2,gl);
    const c=s.central||0,rel=s.rel||0;
    for(const m of gran){const u=m.userData;const show=u.dense?!s.noDense:!s.noAlpha;const sc=u.s*(1-ease(rel)*.85);m.visible=show&&sc>.005;if(!m.visible)continue;
      m.position.set(u.p.x*S.xz*.62*(1-.55*c),u.p.y*S.ys*.55*(1-.4*c)+S.egg*.45,u.p.z*S.xz*.62*(1-.55*c));m.scale.setScalar(sc)}
    const bk=lerp(.9,.42,s.bandC||0);band.scale.set(bk*S.xz,1,bk*S.xz);band.position.y=S.egg*.3;band.material.opacity=.85*(s.bandO===undefined?1:s.bandO)*Math.max(gl,s.open||0,.0);band.visible=band.material.opacity>.02;
    for(const m of fil){const L=(s.fil||0)*m.userData.k;m.visible=L>.03;if(!m.visible)continue;const d=m.userData.d;self.local(d,m.position);tmp.set(d.x,d.y*(1-(s.flat||0)*.9),d.z).normalize();m.quaternion.setFromUnitVectors(UP,tmp);m.scale.set(1,L,1)}
    const place=(q,ys)=>{self.local(q.userData.d,q.position);snorm(q.userData.d,S,tmp);q.quaternion.setFromUnitVectors(UP,tmp);q.scale.set(1,ys,1)};
    for(const q of gp){q.visible=!s.noGP;if(q.visible)place(q,1)}
    const a=s.act||0;itgM.color.setRGB(lerp(.56,.2,a),lerp(.59,.89,a),lerp(.64,.63,a));itgM.emissive.setRGB(0,.35*a,.2*a);
    for(const q of itg){q.visible=!s.noItg;if(q.visible)place(q,lerp(.5,1.05,a))}
  };
  return self}

function buildPlatelet(api){
  const{scene,ren}=api;const BG=0x0b0507;ren.setClearColor(BG);scene.fog=new T.Fog(BG,7.5,21);
  scene.environment=envMap(ren);
  scene.add(new T.HemisphereLight(0xffeee6,0x3a1016,.45));ren.toneMappingExposure=.9;
  const key=new T.DirectionalLight(0xfff0e0,2.4);key.position.set(4,10,6);scene.add(key);
  const rim=new T.DirectionalLight(0x8fb4ff,1.8);rim.position.set(-6,4,-8);scene.add(rim);
  const bump=noiseTex(256,3,900);bump.repeat.set(3,2);
  const M={sph:new T.SphereGeometry(1,16,12),
    body:new T.MeshPhysicalMaterial({color:C_REST,transparent:true,opacity:.97,roughness:.55,sheen:.6,sheenRoughness:.5,sheenColor:new T.Color(0xdbe8ff),clearcoat:.25,clearcoatRoughness:.5,bumpMap:bump,bumpScale:1.2,envMapIntensity:.8}),
    alpha:new T.MeshStandardMaterial({color:0xc77d3a,roughness:.5,emissive:0x5a2a06}),
    dense:new T.MeshStandardMaterial({color:0x2a1b22,roughness:.3,metalness:.2}),
    torus:new T.TorusGeometry(1,.03,8,96).rotateX(Math.PI/2),
    band:new T.MeshStandardMaterial({color:0xfff2dd,emissive:0x664422,transparent:true,opacity:.85}),
    filo:new T.CylinderGeometry(.022,.07,1,8).translate(0,.5,0),
    stalk:new T.CylinderGeometry(.018,.018,.26,6),head:new T.SphereGeometry(.062,14,10),
    gp:new T.MeshStandardMaterial({color:0x4f86d9,emissive:0x0a1f44,roughness:.45}),
    itg:new T.MeshStandardMaterial({color:0x8f96a3,roughness:.35})};
  const R=rng(7),dum=new T.Object3D(),col=new T.Color(),tq=new V3();
  // vessel: curved wall lined with endothelial cells
  const RV=10,CY=RV-.15;
  const wall=new T.Mesh(new T.CylinderGeometry(RV+.25,RV+.25,60,96,1,true,1.5*Math.PI-.82,1.64).rotateZ(Math.PI/2),new T.MeshStandardMaterial({color:0x5a2226,roughness:.85,side:T.DoubleSide}));wall.position.y=CY;scene.add(wall);
  const inj=(x,s)=>(x/3.1)**2+(s/2.6)**2<1;
  const cells=[];for(let x=api.low?-12:-18;x<=(api.low?12:18);x+=1.45)for(let s=-8,r=0;s<=8;s+=.9,r++){const xx=x+(r%2)*.7;if(!inj(xx,s))cells.push([xx+(R()-.5)*.25,s+(R()-.5)*.15])}
  const eg=new T.SphereGeometry(1,api.low?14:22,api.low?8:12);
  const endo=new T.InstancedMesh(eg,new T.MeshStandardMaterial({color:0xffffff,roughness:.62,bumpMap:noiseTex(128,9,300),bumpScale:.6,envMapIntensity:.35}),cells.length),nuc=new T.InstancedMesh(eg,new T.MeshStandardMaterial({color:0xffffff,roughness:.45}),cells.length);
  const onWall=(x,s,lift)=>{const a=s/RV;dum.position.set(x,CY-(RV-lift)*Math.cos(a),(RV-lift)*Math.sin(a));tq.set(0,Math.cos(a),-Math.sin(a));dum.quaternion.setFromUnitVectors(UP,tq)};
  cells.forEach(([x,s],i)=>{onWall(x,s,.05);dum.rotateY((R()-.5)*.35);dum.scale.set(.86,.27,.52);dum.updateMatrix();endo.setMatrixAt(i,dum.matrix);
    col.setHSL(.012+R()*.025,.5,.33+R()*.07);endo.setColorAt(i,col);onWall(x+(R()-.5)*.2,s,.18);dum.scale.set(.32,.13,.2);dum.updateMatrix();nuc.setMatrixAt(i,dum.matrix);col.setHSL(.065,.65,.42);nuc.setColorAt(i,col)});
  scene.add(endo,nuc);
  const sub=new T.Mesh(new T.CircleGeometry(1,64).rotateX(-Math.PI/2),new T.MeshStandardMaterial({color:0x9a7656,roughness:.9}));sub.scale.set(3.4,1,2.9);sub.position.y=-.3;scene.add(sub);
  // collagen meshwork: many fine wavy fibres
  const fibs=[];for(let i=0;i<(api.low?150:240);i++){let x=(R()*2-1)*3.2,z=(R()*2-1)*2.7;if(!inj(x*.95,z*.95)&&R()<.7){i--;continue}const a=R()*Math.PI,L=1.2+R()*2.6,y=-.27+R()*.24,pts=[];
    for(let k=0;k<6;k++){const u=k/5-.5;pts.push(new V3(x+Math.cos(a)*u*L+(R()-.5)*.25,y+(R()-.5)*.08,z+Math.sin(a)*u*L+(R()-.5)*.25))}
    const tg=new T.TubeGeometry(new T.CatmullRomCurve3(pts),22,.018+R()*.03,5);const sh=.8+R()*.25;tg.userData.col=[.93*sh,.82*sh,.64*sh];fibs.push(tg)}
  const colM=new T.MeshStandardMaterial({vertexColors:true,roughness:.6,envMapIntensity:.6});
  const colMesh=new T.Mesh(mergeGeos(fibs),colM);scene.add(colMesh);
  // vWF strands (lavender bead chains, recomputed each frame)
  const AN=[[-1.4,-.6],[-.5,.35],[.4,-.35],[-.1,.95],[1.5,.6],[-2,.9],[1.9,-.7],[.6,1.6],[-1,-1.6],[1.1,-1.5],[-2.4,-.3],[2.3,1.2]].map(([x,z])=>new V3(x,-.08,z));
  const NB=30,beads=new T.InstancedMesh(new T.SphereGeometry(.042,8,6),new T.MeshStandardMaterial({color:0xa799e0,emissive:0x2a2050,roughness:.4}),AN.length*NB);scene.add(beads);
  const P1=Platelet(scene,M,1),P2=Platelet(scene,M,2),P3=Platelet(scene,M,3);
  // fibrinogen bridges
  const fibM=new T.MeshStandardMaterial({color:0xffb347,emissive:0x6a3400,roughness:.35}),rodG=new T.CylinderGeometry(.02,.02,1,6),nodG=new T.SphereGeometry(.055,10,8);
  const mkB=(n,sd)=>{const r=rng(sd),L=[];for(let i=0;i<n;i++){const o=new T.Group(),rod=new T.Mesh(rodG,fibM),a=new T.Mesh(nodG,fibM),m=new T.Mesh(nodG,fibM),b=new T.Mesh(nodG,fibM);m.scale.setScalar(1.25);o.add(rod,a,m,b);scene.add(o);
    L.push({o,rod,a,m,b,off:new V3(r()-.5,r()-.5,r()-.5).multiplyScalar(.9),off2:new V3(r()-.5,r()-.5,r()-.5).multiplyScalar(.9)})}return L};
  const B12=mkB(7,11),B13=mkB(6,12);
  // fibrin mesh (thrombin) that grows over the plug
  const fR=rng(21),FIB=[];const fibrinM=new T.MeshStandardMaterial({color:0xe2552a,emissive:0x5a1204,roughness:.45});
  for(let i=0;i<22;i++){const pts=[];let p=new V3((fR()*2-1)*3.4,.15+fR()*2.6,(fR()*2-1)*2.6);for(let k=0;k<5;k++){pts.push(p.clone());p=p.clone().add(new V3((fR()*2-1)*1.8,(fR()*2-1)*.9,(fR()*2-1)*1.6));p.y=clamp(p.y,.1,3.2)}
    const tg=new T.TubeGeometry(new T.CatmullRomCurve3(pts),60,.028+fR()*.02,5);const m=new T.Mesh(tg,fibrinM);m.userData.n=tg.index.count;m.userData.d=fR()*.4;tg.setDrawRange(0,0);m.frustumCulled=false;scene.add(m);FIB.push(m)}
  // secretion particles: ADP (cyan) and TXA2 (amber), glowing
  const NP=900,pg=new T.BufferGeometry(),pp=new Float32Array(NP*3),pc=new Float32Array(NP*3),PD=[];const pr=rng(5);
  for(let i=0;i<NP;i++){const dense=i%5<2;const c=new T.Color(dense?0x63f0ff:0xffa53a).multiplyScalar(1.6);pc.set([c.r,c.g,c.b],i*3);
    const d=new V3(pr()*2-1,pr()*1.6-.2,pr()*2-1).normalize();d.x+=.4;PD.push({dense,g:dense?33+(i%7):i%33,d,sp:1.4+pr()*3.2,dl:pr()*.08})}
  pg.setAttribute('position',new T.BufferAttribute(pp,3));pg.setAttribute('color',new T.BufferAttribute(pc,3));
  const pts=new T.Points(pg,new T.PointsMaterial({size:.12,map:dot(),vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));pts.frustumCulled=false;scene.add(pts);
  // plasma dust drifting with the flow
  const ND=500,dg=new T.BufferGeometry(),dp=new Float32Array(ND*3),DD=[];const dr=rng(17);
  for(let i=0;i<ND;i++){const a=dr()*6.28,r=Math.sqrt(dr())*(RV-1.2);DD.push({x:dr()*44-22,y:CY+r*Math.cos(a),z:r*Math.sin(a),sp:.5+dr()})}
  dg.setAttribute('position',new T.BufferAttribute(dp,3));
  const dust=new T.Points(dg,new T.PointsMaterial({size:.06,map:dot(),color:0xffd8c8,transparent:true,opacity:.55,depthWrite:false}));dust.frustumCulled=false;scene.add(dust);
  // red cells flowing in the lumen (margination)
  const rbcG=rbcGeo(40,28,'disc'),rbcM=new T.MeshPhysicalMaterial({color:0xa80f1b,roughness:.38,clearcoat:.4,clearcoatRoughness:.35,sheen:.8,sheenColor:new T.Color(0xff6a6a),envMapIntensity:.9});
  const NR=api.low?50:90,rbcI=new T.InstancedMesh(rbcG,rbcM,NR);rbcI.frustumCulled=false;scene.add(rbcI);const RB=[];const rr=rng(23);
  for(let i=0;i<NR;i++){let a,r,y,z;do{a=rr()*6.28;r=2+rr()*(RV-1.5);y=CY+r*Math.cos(a);z=r*Math.sin(a)}while((z>-2.5&&y<9.5)||y<3);RB.push({x:rr()*44-22,y,z,r,sp:2.2*(1-(r/RV)**2)+.5,ph:rr()*6.28,s:.5+rr()*.12})}
  RB.forEach(b=>b.m={position:new V3()});
  // ---- state ----
  let t=0,playing=false,playTo=1,dis='normal',NOW=0;
  const tmp=new V3(),tmpB=new V3(),tmpC=new V3();
  const dTarget=new V3(.25,-.95,.2).normalize();
  const bindGP=P1.gp.map((q,i)=>[i,q.userData.d.dot(dTarget)]).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);
  function bottom(S){return S.ys*(1-S.flat*.85)}
  function p1(t){const s={pos:new V3(),S:DISC,noGP:dis==='bss',noItg:dis==='gt',noDense:dis==='spd',noAlpha:dis==='gps',grey:dis==='gps'};
    if(dis==='bss'||dis==='vwd'){const u=seg(t,0,.55),sc=dis==='bss'?1.6:1;s.scale=sc;s.vis=t<.55;s.pos.set(lerp(-10,11,u),2.2+.35*Math.sin(u*7),.15);s.rz=-u*9;s.rx=.25*Math.sin(u*5);return s}
    const u1=ease(seg(t,.3,.46)),u2=ease(seg(t,.72,.9));const S=s.S=mixS(mixS(DISC,SPH,u1),SPREAD,u2);
    const gap=lerp(lerp(.5,.42,u1),.07,u2),rest=bottom(S)+gap;
    if(t<.12){const u=t/.12;s.pos.set(lerp(-9,-2.8,u),lerp(2.7,1.7,u),.1);s.rz=.35*Math.sin(u*6);s.rx=.2*Math.cos(u*4)}
    else{const u=1-(1-seg(t,.12,.28))**2;s.pos.set(lerp(-2.8,0,u),lerp(1.7,rest,ease(seg(t,.12,.22))),lerp(.1,0,u));s.rz=u<1?-Math.PI*u:0;s.rx=0}
    s.fil=ease(seg(t,.33,.47))*1.7*(1-.45*u2);s.glow=ease(seg(t,.5,.58))*(1-ease(seg(t,.72,.86)));s.pale=ease(seg(t,.74,.9));s.open=ease(seg(t,.3,.46))*.4;s.now=NOW;s.flat=u2;s.bandC=u1;s.bandO=1-u2;s.central=ease(seg(t,.5,.58));s.rel=ease(seg(t,.58,.7));s.act=dis==='gt'?0:ease(seg(t,.6,.74));return s}
  const F2=new V3(1.25,0,.55),F3=new V3(-1.35,0,-.6);
  function pN(t,which){const s={pos:new V3(),S:DISC,noGP:false,noItg:dis==='gt',noDense:dis==='spd',noAlpha:dis==='gps',grey:dis==='gps',vis:false};
    if(dis==='bss'||dis==='vwd')return s;
    const t0=which===2?.7:.79,t1=which===2?.84:.92,F=which===2?F2:F3;if(t<t0)return s;s.vis=true;
    const a=ease(seg(t,t0+.03,t1));s.S=mixS(DISC,SPH,a);s.fil=a*1.5;s.pale=a;s.glow=a*(1-a)*1.2;s.now=NOW;s.act=dis==='gt'?0:a;s.bandC=a;s.bandO=1;s.rel=dis==='spd'?0:a*.6;s.central=a;
    const top=bottom(SPREAD)+.07+SPREAD.ys+SPREAD.egg,fy=top+.3+s.S.ys*(1-s.S.flat*.85);
    const u=1-(1-seg(t,t0,t1))**2;s.pos.set(lerp(-9,F.x,u),lerp(3.6,fy,u),lerp(F.z+.8,F.z,u));s.rz=(1-u)*1.5;
    const away=dis==='gt'||(dis==='spd'&&which===3);
    if(away){const v=ease(seg(t,t1-.02,1));s.pos.x+=v*9;s.pos.y+=v*2.2;s.rz-=v*4;s.act=0}
    return s}
  function bridges(L,A,Bp,u){const dir=tmpC.subVectors(Bp.g.position,A.g.position).normalize();
    L.forEach((b,i)=>{const v=c01(u*L.length-i*.6);b.o.visible=v>0;if(!v)return;
      const da=tmp.copy(dir).add(b.off).normalize();A.g.worldToLocal(da.add(A.g.position));da.normalize();const pa=A.world(da,new V3());
      const db=tmpB.copy(dir).negate().add(b.off2).normalize();Bp.g.worldToLocal(db.add(Bp.g.position));db.normalize();const pb=Bp.world(db,new V3());
      const end=new V3().lerpVectors(pa,pb,ease(v));stretch(b.rod,pa,end);b.a.position.copy(pa);b.b.position.copy(end);b.m.position.lerpVectors(pa,end,.5);b.b.visible=v>.95})}
  const curve=new T.QuadraticBezierCurve3(new V3(),new V3(),new V3());
  function vwf(t){const n=dis==='vwd'?2:AN.length,len=dis==='vwd'?.45:1,un=ease(seg(t,.03,.15)),bind=(dis==='bss'||dis==='vwd')?0:ease(seg(t,.17,.27));
    let k=0;for(let c=0;c<AN.length;c++){const A=AN[c];for(let i=0;i<NB;i++,k++){if(c>=n||(dis==='vwd'&&i>=6)){dum.position.set(0,-50,0);dum.scale.setScalar(0);dum.updateMatrix();beads.setMatrixAt(k,dum.matrix);continue}
      const s=i/(NB-1),f=fib(NB,i,c);const coil=tmp.set(A.x+f.x*.24,A.y+.2+f.y*.16,A.z+f.z*.24);
      const ex=tmpB.set(A.x+s*2.3*len,A.y+.1+s*(.8+.25*(c%3))*len+.1*Math.sin(s*7+c)+.05*Math.sin(s*31+c),A.z+.18*Math.sin(s*5+c)+.05*Math.cos(s*27+c));
      const p=new V3().lerpVectors(coil,ex,un);
      const bi=bindGP.indexOf(c);
      if(bi>=0&&bind>0&&P1.g.visible){const tip=P1.head(P1.gp[bindGP[bi]],new V3());curve.v0.copy(A);curve.v1.set((A.x+tip.x)/2-.35,Math.max(A.y,tip.y)+.15,(A.z+tip.z)/2);curve.v2.copy(tip);p.lerp(curve.getPoint(s),bind)}
      dum.position.copy(p);dum.scale.setScalar(1);dum.updateMatrix();beads.setMatrixAt(k,dum.matrix)}}beads.instanceMatrix.needsUpdate=true}
  function particles(t){const pa=pg.attributes.position;const show=dis!=='bss'&&dis!=='vwd';
    for(let i=0;i<NP;i++){const D=PD[i],tau=(t-.585-D.dl)/.13;let ok=show&&tau>0&&tau<1&&!(D.dense&&dis==='spd')&&!(!D.dense&&dis==='gps');
      if(ok){const gm=P1.gran[D.g];P1.g.localToWorld(tmp.copy(gm.userData.p).multiplyScalar(.25).setY(P1.S.egg*.45+.1));pa.setXYZ(i,tmp.x+D.d.x*D.sp*tau+tau*1.4,tmp.y+D.d.y*D.sp*tau,tmp.z+D.d.z*D.sp*tau)}
      else pa.setXYZ(i,0,-60,0)}pa.needsUpdate=true}
  // ---- UI ----
  api.ctrl.innerHTML='<div class="l3-row"><button class="l3-play" type="button">▶ Play</button><input type="range" min="0" max="1000" value="0" aria-label="Timeline"><span class="l3-pct">0%</span></div>'+
    '<div class="l3-chips" data-k="stage" role="group" aria-label="Stage">'+STAGES.map((s,i)=>'<button type="button" data-i="'+i+'"><b>'+(i+1)+'</b> '+s[0]+'</button>').join('')+'</div>'+
    '<div class="l3-chips l3-dis" data-k="dis" role="group" aria-label="Compare with a disorder"><span>Compare:</span>'+Object.keys(DIS).map(k=>'<button type="button" data-d="'+k+'" aria-pressed="'+(k==='normal')+'">'+DIS[k].name+'</button>').join('')+'</div>';
  const playB=api.ctrl.querySelector('.l3-play'),rg=api.ctrl.querySelector('input'),pct=api.ctrl.querySelector('.l3-pct'),stB=[...api.ctrl.querySelectorAll('[data-k="stage"] button')];
  const setPlay=on=>{playing=on;playB.textContent=on?'❚❚ Pause':'▶ Play'};
  playB.onclick=()=>{if(playing){setPlay(false);return}if(t>=.999)t=0;playTo=1;setPlay(true)};
  rg.oninput=()=>{t=rg.value/1000;setPlay(false)};
  stB.forEach(b=>b.onclick=()=>{const s=STAGES[+b.dataset.i];t=s[1];playTo=s[2];setPlay(true)});
  api.ctrl.querySelector('[data-k="dis"]').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;dis=b.dataset.d;
    api.ctrl.querySelectorAll('[data-d]').forEach(x=>x.setAttribute('aria-pressed',x===b));
    if(dis!=='normal')api.showInfo(DIS[dis].name==='Glanzmann'?'Glanzmann thrombasthenia':DIS[dis].name==='Storage pool (δ)'?'δ-storage pool disease':DIS[dis].name+(dis==='bss'||dis==='gps'?' syndrome':''),'<p>'+DIS[dis].lab+'</p>','Disorder');else api.info.hidden=true;
    api.orbit.reset();api.stage.querySelectorAll('.l3-lb.on').forEach(x=>x.classList.remove('on'));t=0;playTo=1;setPlay(true)});
  let lastStage=-1,lastDis='';
  function caption(){let i=STAGES.findIndex(s=>t<s[2]);if(i<0)i=4;if(i===lastStage&&dis===lastDis)return;lastStage=i;lastDis=dis;
    api.cap.innerHTML='<b>'+(i+1)+' · '+STAGES[i][0]+'.</b> '+CAP[dis][i];stB.forEach((b,j)=>b.setAttribute('aria-pressed',j===i))}
  // ---- labels ----
  const lv=(a,b)=>t>=a&&t<=b;
  const pick=(L,d)=>{const v=new V3(...d).normalize();let bi=0,bd=-2;L.forEach((q,i)=>{const x=q.userData.d.dot(v);if(x>bd){bd=x;bi=i}});return L[bi]};
  const gpL=pick(P1.gp,[.4,-.1,.9]),itL=pick(P1.itg,[.5,.45,.75]);
  api.labels=[
    {title:'Endothelium',r:7,pos:()=>lv(0,.35)?new V3(-5.2,.3,2.2):null,text:'Intact endothelial cells keep blood fluid: they release prostacyclin (PGI<sub>2</sub>) and nitric oxide, and carry thrombomodulin and heparan sulfate. Platelets do not stick to healthy endothelium.'},
    {title:'Exposed collagen',r:6,pos:()=>lv(0,1)?new V3(2.2,-.05,-1.5):null,text:'Injury strips the endothelium and exposes subendothelial collagen. Platelets bind it directly through GPVI (which triggers activation) and integrin α2β1, and indirectly through vWF.'},
    {title:'von Willebrand factor',pos:()=>{if(!lv(.02,.6))return null;const c=4;const k=c*NB+NB-1;if(dis==='vwd')return null;beads.getMatrixAt(k,dum.matrix);return new V3().setFromMatrixPosition(dum.matrix)},text:'Very large multimers made by endothelial cells and megakaryocytes. Under high shear, collagen-bound vWF uncoils and its A1 domain grabs GPIb. Low or abnormal vWF causes von Willebrand disease.'},
    {title:'GP Ib-IX-V',r:4.5,pos:()=>P1.g.visible&&!P1.gp[0].visible?null:(lv(.08,.6)&&P1.g.visible?P1.head(gpL,new V3()):null),text:'The vWF receptor. Its fast on-and-off binding lets the platelet tether and roll under high shear, then stop. Missing in Bernard–Soulier syndrome (giant platelets, low count). Target of ristocetin-induced binding in the lab.'},
    {title:'Microtubule band',r:4.5,pos:()=>lv(0,.44)&&P1.g.visible&&P1.band.visible?P1.g.localToWorld(new V3(-P1.band.scale.x,P1.band.position.y,0)):null,text:'A coil of microtubules under the membrane keeps the resting platelet discoid. On activation it contracts, the cell rounds up and the granules are pushed to the centre.'},
    {title:'α granules',r:4.5,pos:()=>{const g=P1.gran[2];return lv(0,.6)&&P1.g.visible&&g.visible?g.getWorldPosition(new V3()):null},text:'The commonest granules (50–80 per platelet). They hold fibrinogen, vWF, factor V, PF4, PDGF, thrombospondin and P-selectin. Missing in grey platelet syndrome.'},
    {title:'Dense granules',r:4.5,pos:()=>{const g=P1.gran[35];return lv(0,.6)&&P1.g.visible&&g.visible?g.getWorldPosition(new V3()):null},text:'Few (3–8 per platelet) and electron-dense. They hold ADP, ATP, serotonin, calcium and polyphosphate. Released ADP recruits more platelets through P2Y<sub>1</sub> and P2Y<sub>12</sub> (the clopidogrel target). Reduced in storage pool disease and Hermansky–Pudlak syndrome.'},
    {title:'Filopodia',r:4.5,pos:()=>{const m=P1.fil[2];return lv(.37,.86)&&m.visible?m.localToWorld(new V3(0,1,0)):null},text:'Spiky projections that appear within seconds of activation, driven by actin polymerisation. They reach out to grip the surface and neighbouring platelets.'},
    {title:'ADP and TXA₂ released',r:6,pos:()=>lv(.6,.74)&&dis!=='bss'&&dis!=='vwd'?P1.g.position.clone().add(new V3(1.4,1.9,0)):null,text:'Released ADP and thromboxane A<sub>2</sub> (made by COX-1, blocked by aspirin) activate passing platelets and pull them into the growing plug.'},
    {title:'αIIbβ3 (GPIIb/IIIa)',r:4.5,pos:()=>lv(.6,1)&&P1.g.visible&&dis!=='gt'?P1.head(itL,new V3()):null,text:'The most plentiful platelet receptor (about 80,000 copies). Inside-out signalling switches it from bent and low-affinity to extended and high-affinity, so it binds fibrinogen and vWF. Missing in Glanzmann thrombasthenia; blocked by abciximab, eptifibatide and tirofiban.'},
    {title:'Fibrinogen bridge',r:4,pos:()=>{const b=B12[0];return lv(.84,1)&&b.o.visible?b.m.getWorldPosition(new V3()):null},text:'Fibrinogen is dimeric, so one molecule can link αIIbβ3 on two neighbouring platelets. These bridges build the primary plug, which thrombin and fibrin later stabilise.'},
    {title:'Fibrin',r:5,pos:()=>{const m=FIB[3];return m.visible&&lv(.93,1)?m.localToWorld(m.geometry.parameters.path.getPoint(.4)):null},text:'Thrombin generated on the activated platelet surface cleaves fibrinogen into fibrin. Fibrin strands, cross-linked by factor XIIIa, weave through the platelet plug and turn it into a stable clot.'},
    {title:'Red cell',r:9,pos:()=>{let best=null,bd=1e9;for(const b of RB){const p=b.m.position;const d=Math.abs(p.x-3)+Math.abs(p.y-4)*2+Math.abs(p.z+2);if(d<bd&&Math.abs(p.x)<6){bd=d;best=p}}return best?best.clone():null},text:'Red cells travel in the centre of the stream and push platelets towards the wall (margination), which helps platelets reach an injury. A higher haematocrit improves primary haemostasis.'}];
  api.labels.forEach(L=>L.kicker='Structure');
  let first=true;
  return{focus:()=>{const o=api.orbit.st;if(P1.g.visible&&o.tx.distanceTo(P1.g.position)<2.5)return api.cam.position.distanceTo(P1.g.position);return o.r},fx:p=>{p.range=.55;p.bloom=.6},tick(dt,now){
    if(playing){t=holdT(api,t,Math.min(playTo,t+dt/22),STAGES);if(t>=playTo-1e-6)setPlay(false)}
    if(first){first=false;setPlay(true)}
    rg.value=Math.round(t*1000);pct.textContent=Math.round(t*100)+'%';caption();
    P1.update(p1(t));P2.update(pN(t,2));P3.update(pN(t,3));vwf(t);particles(t);
    const okB=dis==='normal'||dis==='gps'||dis==='spd';
    if(okB&&P2.g.visible)bridges(dis==='spd'?B12.slice(0,3):B12,P1,P2,seg(t,.8,.92));B12.forEach((b,i)=>{if(!(okB&&P2.g.visible&&t>=.8)||(dis==='spd'&&i>=3))b.o.visible=false});
    if(okB&&dis!=='spd'&&P3.g.visible)bridges(B13,P1,P3,seg(t,.88,.99));B13.forEach(b=>{if(!(okB&&dis!=='spd'&&P3.g.visible&&t>=.88))b.o.visible=false});
    NOW=now;
    for(let i=0;i<RB.length;i++){const b=RB[i];const x=((b.x+now*b.sp)%44+44)%44-22;b.m.position.set(x,b.y+.25*Math.sin(now*.6+b.ph),b.z);dum.position.copy(b.m.position);dum.rotation.set(.6+now*.35+b.ph,b.ph,.5*Math.sin(now*.4+b.ph));const cd=b.m.position.distanceTo(api.cam.position);dum.scale.setScalar(b.s*c01((cd-3.5)/2.5));dum.updateMatrix();rbcI.setMatrixAt(i,dum.matrix)}rbcI.instanceMatrix.needsUpdate=true;
    {const a=dg.attributes.position;for(let i=0;i<ND;i++){const d=DD[i];a.setXYZ(i,((d.x+now*d.sp*1.6)%44+44)%44-22,d.y,d.z)}a.needsUpdate=true}
    {const ok=dis==='normal'||dis==='gps'||dis==='spd';for(const m of FIB){const u=ok?ease(seg(t,.88+m.userData.d*.2,1)):0;const n=Math.floor(m.userData.n*u/3)*3;m.geometry.setDrawRange(0,n);m.visible=n>0}}
  }}}

/* ================= RED CELL ================= */
const RR=3.91,C0=.207161,C2=2.002558,C4=-1.122762;
const efH=(rho,rd)=>{const q=Math.min(1,rho),d=Math.min(1,rd===undefined?rho:rd);return .5*RR*Math.sqrt(Math.max(0,1-q*q))*(C0+C2*d*d+C4*d*d*d*d)};
const SPIKE_E=Array.from({length:28},(_,i)=>fib(28,i,.3));
const SPIKE_A=(()=>{const r=rng(31),L=[];for(let i=0;i<8;i++){const d=new V3(r()*2-1,(r()*2-1)*.8,r()*2-1).normalize();L.push([d,.8+r()*1.0,.1+r()*.07])}return L})();
const SHAPES={
  disc:d=>{const rho=Math.hypot(d.x,d.z),s=d.y<0?-1:1;return[RR*d.x,s*efH(rho),RR*d.z]},
  sphero:d=>[2.95*d.x,2.95*d.y,2.95*d.z],
  ellipto:d=>{const[x,y,z]=SHAPES.disc(d);return[x*1.4,y*.95,z*.66]},
  target:d=>{const rho=Math.hypot(d.x,d.z),s=d.y<0?-1:1,R2=4.2;return[R2*d.x,s*(efH(rho)*.72+1.05*Math.exp(-((rho/.3)**2))),R2*d.z]},
  stomato:d=>{const rho=Math.hypot(d.x,d.z),s=d.y<0?-1:1,ph=Math.atan2(d.z,d.x),rd=rho*Math.sqrt(Math.cos(ph)**2*.3+Math.sin(ph)**2*2.4);return[3.7*d.x,s*efH(rho,rd)*.95+1.5*(1-rho*rho)-.75,3.7*d.z]},
  sickle:d=>{const u=d.x,tp=Math.pow(Math.max(1e-4,1-u*u),.32),X=5.3*u,Y=.9*d.y*tp,Z=1.6*d.z*tp,Rb=4.4,a=X/Rb;return[(Rb-Z)*Math.sin(a),Y,Rb-(Rb-Z)*Math.cos(a)-1.6]},
  echino:d=>{let e=0;for(const p of SPIKE_E){const c=d.x*p.x+d.y*p.y+d.z*p.z;e+=Math.exp(-2*(1-c)/.017)}const k=1+.17*e;return[3.25*d.x*k,1.95*d.y*k,3.25*d.z*k]},
  acantho:d=>{let e=0;for(const[p,a,w]of SPIKE_A){const c=d.x*p.x+d.y*p.y+d.z*p.z;e+=a*Math.exp(-2*(1-c)/(w*w))}const k=2.75+e;return[d.x*k,d.y*k*.92,d.z*k]},
  dacro:d=>{const[x,y,z]=SHAPES.disc(d),rho=Math.hypot(d.x,d.z),ph=Math.atan2(d.z,d.x),t=Math.pow(Math.max(0,Math.cos(ph)),8)*rho**3;return[.88*(x+4.6*t)-1,.88*y*(1-.72*t),.88*z*(1-.4*t)]}};
function rbcGeo(W,H,k){const g=new T.SphereGeometry(1,W,H),p=g.attributes.position,d=new V3();for(let i=0;i<p.count;i++){d.fromBufferAttribute(p,i);const v=SHAPES[k](d);p.setXYZ(i,v[0],v[1],v[2])}g.computeVertexNormals();fixSeams(g,W,H);return g}
const RBC=[
 ['disc','Discocyte','Normal red cell',"A biconcave disc about 7.8 µm across, 2.5 µm thick at the rim and 1 µm at the centre. The shape gives a large surface for its volume, so the cell can fold through 3 µm slits in the splenic cords. On a film the thin centre shows as central pallor, about one third of the diameter."],
 ['sphero','Spherocyte','Hereditary spherocytosis, warm AIHA, burns, ABO HDN',"Membrane is lost (defects of ankyrin, band 3, spectrin or protein 4.2, or antibody-coated membrane bitten off by macrophages). Surface area falls for the same volume, so the cell becomes a small, dense sphere without central pallor. Rigid spheres are trapped in the spleen. MCHC is high and osmotic fragility is increased."],
 ['ellipto','Elliptocyte','Hereditary elliptocytosis; iron deficiency (pencil cells); myelofibrosis; megaloblastic anaemia',"Horizontal defects of the skeleton (spectrin self-association, protein 4.1) stop the cell from springing back into a disc after it is stretched in the circulation, so it stays oval."],
 ['target','Target cell (codocyte)','Liver disease, thalassaemia, HbC and HbE, after splenectomy, iron deficiency',"There is too much membrane for the cell's volume. The extra membrane bulges in the centre, giving a bull's-eye on the film. These cells resist osmotic lysis."],
 ['stomato','Stomatocyte','Hereditary stomatocytosis, alcohol, liver disease, Rh-null; often an artefact',"A cup-shaped cell. Seen face-on, the curved surface shows as a slit-like or mouth-shaped pallor. Over-hydration of the cell or lipid changes in the inner leaflet bend the membrane inwards."],
 ['sickle','Sickle cell (drepanocyte)','HbSS, HbSC, HbS/β-thalassaemia',"When deoxygenated, HbS polymerises into long rigid fibres that stretch the cell into a crescent. Sickled cells block small vessels (vaso-occlusion) and are destroyed early (haemolysis). Repeated sickling damages the membrane until cells stay sickled."],
 ['echino','Echinocyte (burr cell)','Artefact (slow drying, stored EDTA blood), uraemia, pyruvate kinase deficiency, stored transfused blood',"10 to 30 short, evenly spaced spicules over the whole surface. The outer leaflet expands relative to the inner one. The change is often reversible."],
 ['acantho','Acanthocyte (spur cell)','Severe liver disease (spur cell anaemia), abetalipoproteinaemia, McLeod phenotype, neuroacanthocytosis, after splenectomy',"A dense cell with 2 to 20 irregular spikes of unequal length, often with knobbed tips, and no central pallor. The membrane has abnormal lipids (excess cholesterol or abnormal phospholipids)."],
 ['dacro','Dacrocyte (teardrop cell)','Primary myelofibrosis and marrow infiltration (leucoerythroblastic film), thalassaemia, megaloblastic anaemia',"A cell with a single tail, deformed as it squeezes out of a fibrotic marrow or through the spleen. Many teardrops with nucleated red cells and immature granulocytes point to a marrow problem."]];
function buildRBC(api){
  const{scene,ren,orbit}=api;ren.setClearColor(0x140709);scene.environment=envMap(ren);
  scene.add(new T.HemisphereLight(0xfff0f0,0x2a0a14,.9));
  const bgG=new T.Group();scene.add(bgG);{const n=api.low?26:44,inst=new T.InstancedMesh(rbcGeo(36,24,'disc'),new T.MeshPhysicalMaterial({color:0x9c0f19,roughness:.4,sheen:.8,sheenColor:new T.Color(0xff6a6a),clearcoat:.3}),n),d=new T.Object3D(),r=rng(41);
    for(let i=0;i<n;i++){const v=new V3(r()*2-1,r()*2-1,r()*2-1).normalize().multiplyScalar(30+r()*20);d.position.copy(v);d.rotation.set(r()*6,r()*6,r()*6);d.scale.setScalar(.85+r()*.3);d.updateMatrix();inst.setMatrixAt(i,d.matrix)}bgG.add(inst);
    const ND=400,g=new T.BufferGeometry(),a=new Float32Array(ND*3);for(let i=0;i<ND;i++){const v=new V3(r()*2-1,r()*2-1,r()*2-1).multiplyScalar(26);v.setLength(14+v.length());a.set([v.x,v.y,v.z],i*3)}g.setAttribute('position',new T.BufferAttribute(a,3));
    bgG.add(new T.Points(g,new T.PointsMaterial({size:.12,map:dot(),color:0xffd0c0,transparent:true,opacity:.5,depthWrite:false})))}
  const key=new T.DirectionalLight(0xffffff,2.8);key.position.set(4,7,6);scene.add(key);
  const rim=new T.DirectionalLight(0x9ab8ff,1.8);rim.position.set(-5,2,-7);scene.add(rim);
  const fill=new T.DirectionalLight(0xffc8c8,.8);fill.position.set(0,-6,3);scene.add(fill);
  const W=144,H=112,geo=new T.SphereGeometry(1,W,H),pos=geo.attributes.position,N=pos.count;
  const dirs=new Float32Array(pos.array),cache={};
  const shapeArr=k=>{if(cache[k])return cache[k];const a=new Float32Array(N*3),d=new V3();for(let i=0;i<N;i++){d.set(dirs[i*3],dirs[i*3+1],dirs[i*3+2]);const v=SHAPES[k](d);a[i*3]=v[0];a[i*3+1]=v[1];a[i*3+2]=v[2]}return cache[k]=a};
  const clip=new T.Plane(new V3(0,0,-1),0);
  const mat=new T.MeshPhysicalMaterial({color:0xb8131e,roughness:.36,clearcoat:.45,clearcoatRoughness:.3,sheen:1,sheenRoughness:.45,sheenColor:new T.Color(0xff8080),emissive:0x2a0204,envMapIntensity:1.1,side:T.DoubleSide});
  const mesh=new T.Mesh(geo,mat);scene.add(mesh);
  const capM=new T.MeshStandardMaterial({color:0x7d0d18,roughness:.7,side:T.DoubleSide,emissive:0x1a0004}),cap=new T.Mesh(new T.BufferGeometry(),capM);cap.visible=false;scene.add(cap);
  const capEdge=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:0xffd0d0}));capEdge.visible=false;scene.add(capEdge);
  const ghost=new T.Mesh(rbcGeo(72,48,'disc'),new T.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.09,depthWrite:false}));ghost.visible=false;scene.add(ghost);
  let cur='disc',from=shapeArr('disc'),to=from,u=1,cut=false;
  pos.array.set(from);pos.needsUpdate=true;geo.computeVertexNormals();fixSeams(geo,W,H);
  function buildCap(){const row=W+1,a=pos.array,P=[];for(let iy=0;iy<=H;iy++){const k=(iy*row)*3;P.push(new T.Vector2(a[k],a[k+1]))}for(let iy=H;iy>=0;iy--){const k=(iy*row+W/2)*3;P.push(new T.Vector2(a[k],a[k+1]))}
    cap.geometry.dispose();cap.geometry=new T.ShapeGeometry(new T.Shape(P),1);cap.position.z=.001;
    capEdge.geometry.dispose();capEdge.geometry=new T.BufferGeometry().setFromPoints(P.map(p=>new V3(p.x,p.y,.01)))}
  function setCut(on){cut=on&&cur!=='sickle';mat.clippingPlanes=cut?[clip]:[];mat.needsUpdate=true;cap.visible=capEdge.visible=cut;if(cut){buildCap();orbit.flyTo({th:0,ph:1.42,r:12})}}
  api.ctrl.innerHTML='<div class="l3-chips" data-k="shape" role="group" aria-label="Red cell shape">'+RBC.map(r=>'<button type="button" data-s="'+r[0]+'" aria-pressed="'+(r[0]==='disc')+'">'+r[1].replace(/ \(.*/,'')+'</button>').join('')+'</div>'+
    '<div class="l3-row l3-opts"><label><input type="checkbox" data-o="cut"> Cut in half</label><label><input type="checkbox" data-o="ghost"> Outline of a normal cell</label><label><input type="checkbox" data-o="spin" checked> Turn slowly</label>'+
    '<span class="l3-views"><button type="button" data-v="top">View as on a film</button><button type="button" data-v="side">Side view</button></span></div>';
  const cutB=api.ctrl.querySelector('[data-o="cut"]');
  function cap1(k){const r=RBC.find(x=>x[0]===k);api.cap.innerHTML='<b>'+r[1]+'.</b> '+r[3]+(k==='stomato'?' The model is shown from below so you can see into the cup.':'')+'<span class="l3-seen"><b>Seen in:</b> '+r[2]+'</span>'+(k==='sickle'?'<span class="l3-seen">The cut view is not available for the curved sickle cell.</span>':'')}
  api.ctrl.querySelector('[data-k="shape"]').addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b||b.dataset.s===cur)return;api.ctrl.querySelectorAll('[data-s]').forEach(x=>x.setAttribute('aria-pressed',x===b));
    from=new Float32Array(pos.array);cur=b.dataset.s;to=shapeArr(cur);u=0;if(cur==='stomato'&&!cut)orbit.flyTo({tx:new V3(),ph:2.25,r:12.5});else if(orbit.st.ph>1.6&&!cut)orbit.flyTo({tx:new V3(),ph:1.08});cap1(cur);cutB.disabled=cur==='sickle';if(cur==='sickle'&&cut){cutB.checked=false;setCut(false)}});
  api.ctrl.querySelector('.l3-opts').addEventListener('change',e=>{const o=e.target.dataset.o;if(o==='cut')setCut(e.target.checked);else if(o==='ghost')ghost.visible=e.target.checked;else if(o==='spin')orbit.auto=e.target.checked});
  api.ctrl.querySelector('.l3-views').addEventListener('click',e=>{const v=e.target.dataset.v;if(v==='top')orbit.flyTo({tx:new V3(),ph:.02,r:13});if(v==='side')orbit.flyTo({tx:new V3(),ph:1.5,r:13})});
  cap1('disc');
  return{focus:()=>orbit.st.r,fx:p=>{p.range=1.6;p.bloom=.3},tick(dt,now){bgG.rotation.y=now*.02;bgG.rotation.x=Math.sin(now*.05)*.1;if(u<1){u=Math.min(1,u+dt/.9);const e=ease(u),a=pos.array;for(let i=0;i<a.length;i++)a[i]=from[i]+(to[i]-from[i])*e;pos.needsUpdate=true;geo.computeVertexNormals();fixSeams(geo,W,H);geo.computeBoundingSphere();if(cut)buildCap()}}}}

/* ---------------- shared timeline UI for story scenes ---------------- */
function storyUI(api,o){
  const st={t:0,playing:false,playTo:1,mode:Object.keys(o.modes)[0]};const K=Object.keys(o.modes);
  api.ctrl.innerHTML='<div class="l3-row"><button class="l3-play" type="button">▶ Play</button><input type="range" min="0" max="1000" value="0" aria-label="Timeline"><span class="l3-pct">0%</span></div>'+
    '<div class="l3-chips" data-k="stage" role="group" aria-label="Stage">'+o.stages.map((s,i)=>'<button type="button" data-i="'+i+'"><b>'+(i+1)+'</b> '+s[0]+'</button>').join('')+'</div>'+
    (K.length>1?'<div class="l3-chips l3-dis" data-k="dis" role="group" aria-label="'+(o.modeLabel||'Compare')+'"><span>'+(o.modeLabel||'Compare')+':</span>'+K.map(k=>'<button type="button" data-d="'+k+'" aria-pressed="'+(k===st.mode)+'">'+o.modes[k].name+'</button>').join('')+'</div>':'');
  const playB=api.ctrl.querySelector('.l3-play'),rg=api.ctrl.querySelector('input'),pct=api.ctrl.querySelector('.l3-pct'),stB=[...api.ctrl.querySelectorAll('[data-k="stage"] button')];
  const setPlay=on=>{st.playing=on;playB.textContent=on?'❚❚ Pause':'▶ Play'};
  playB.onclick=()=>{if(st.playing){setPlay(false);return}if(st.t>=.999)st.t=0;st.playTo=1;setPlay(true)};
  rg.oninput=()=>{st.t=rg.value/1000;setPlay(false)};
  stB.forEach(b=>b.onclick=()=>{const s=o.stages[+b.dataset.i];st.t=s[1];st.playTo=s[2];setPlay(true)});
  const dz=api.ctrl.querySelector('[data-k="dis"]');
  if(dz)dz.addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;st.mode=b.dataset.d;dz.querySelectorAll('[data-d]').forEach(x=>x.setAttribute('aria-pressed',x===b));
    const m=o.modes[st.mode];if(m.info)api.showInfo(m.title||m.name,'<p>'+m.info+'</p>',o.modeKicker||'Disorder');else api.info.hidden=true;
    api.orbit.reset();api.stage.querySelectorAll('.l3-lb.on').forEach(x=>x.classList.remove('on'));st.t=0;st.playTo=1;setPlay(true);if(o.onMode)o.onMode(st.mode)});
  let ls=-1,lm='';
  st.update=dt=>{if(st.playing){st.t=holdT(api,st.t,Math.min(st.playTo,st.t+dt/o.dur),o.stages);if(st.t>=st.playTo-1e-6)setPlay(false)}
    rg.value=Math.round(st.t*1000);pct.textContent=Math.round(st.t*100)+'%';
    let i=o.stages.findIndex(s=>st.t<s[2]);if(i<0)i=o.stages.length-1;
    if(i!==ls||st.mode!==lm){ls=i;lm=st.mode;const caps=o.modes[st.mode].caps||o.modes[K[0]].caps;api.cap.innerHTML='<b>'+(i+1)+' · '+o.stages[i][0]+'.</b> '+caps[Math.min(i,caps.length-1)];stB.forEach((b,j)=>b.setAttribute('aria-pressed',j===i))}};
  st.stage=()=>ls;
  setTimeout(()=>setPlay(true),300);
  return st}

/* ================= RED CELL MEMBRANE ================= */
function helixCurve(a,b,ph,turns,rad,droop){const d=new V3().subVectors(b,a),L=d.length();d.normalize();const n1=new V3(0,1,0),n2=new V3().crossVectors(d,n1).normalize();n1.crossVectors(n2,d).normalize();
  const pts=[];const N=Math.max(12,Math.round(L*10));for(let i=0;i<=N;i++){const u=i/N,an=u*turns*Math.PI*2+ph;const p=new V3().lerpVectors(a,b,u);p.y-=droop*Math.sin(Math.PI*u);p.addScaledVector(n1,Math.cos(an)*rad).addScaledVector(n2,Math.sin(an)*rad);pts.push(p)}return new T.CatmullRomCurve3(pts)}
function helixBundle(n,h,R,seed){const r=rng(seed),gs=[];for(let k=0;k<n;k++){const a=k/n*6.283+r()*.3,cx=Math.cos(a)*R,cz=Math.sin(a)*R,pts=[];for(let i=0;i<=40;i++){const u=i/40,an=u*h*9+k;pts.push(new V3(cx+Math.cos(an)*.06,u*h,cz+Math.sin(an)*.06))}
  const g=new T.TubeGeometry(new T.CatmullRomCurve3(pts),80,.04,6);g.userData.col=[.25,.62,.47];gs.push(g)}return mergeGeos(gs)}
function buildMembrane(api){
  const{scene,ren}=api;const BG=0x1a2230;ren.setClearColor(BG);scene.fog=new T.Fog(BG,12,30);scene.environment=envMap(ren);
  scene.add(new T.HemisphereLight(0xe8f0ff,0x302020,.6));const k1=new T.DirectionalLight(0xffffff,2.2);k1.position.set(5,-8,6);scene.add(k1);const k2=new T.DirectionalLight(0xa8c4ff,1.4);k2.position.set(-6,8,-4);scene.add(k2);
  const R=rng(31),dum=new T.Object3D(),root=new T.Group();scene.add(root);
  const X0=-7,X1=7.6,Z0=-4.3,Z1=4.3,SP=.3,TOP=.95,BOT=.05;
  // lattice of junctional complexes
  const NODES=[],EDGES=[];const NR=4,NC=6,dx=2.4,dzz=2.08,x0=-6,z0=-3.12,YS=-1.15;
  for(let r=0;r<NR;r++)for(let c=0;c<NC;c++)NODES.push(new V3(x0+c*dx+(r%2)*dx/2,YS+(R()-.5)*.12,z0+r*dzz));
  const id=(r,c)=>r>=0&&r<NR&&c>=0&&c<NC?r*NC+c:-1;
  for(let r=0;r<NR;r++)for(let c=0;c<NC;c++){const a=id(r,c);const nb=[id(r,c+1)].concat(r%2===0?[id(r+1,c-1),id(r+1,c)]:[id(r+1,c),id(r+1,c+1)]);nb.forEach(b=>{if(b>=0)EDGES.push([a,b])})}
  // proteins anchored on some edges (ankyrin–band 3)
  const ANK=EDGES.map((e,i)=>i).filter(i=>i%2===0);const HSdef=new Set(ANK.filter((_,k)=>k%3===1));const HEbrk=new Set(EDGES.map((e,i)=>i).filter(i=>i%3===0));
  // spectrin strands, as half-edges anchored at their node so they can retract
  const mA=new T.MeshStandardMaterial({color:0xd8493f,roughness:.45,emissive:0x2a0604}),mB=new T.MeshStandardMaterial({color:0x4f78d8,roughness:.45,emissive:0x060f2a});
  const skel=new T.Group();root.add(skel);const HALF=[];const RING=[];
  const ringG=new T.TorusGeometry(.09,.025,8,20),ringM=new T.MeshStandardMaterial({color:0xfff1c4,emissive:0x2a2008,roughness:.4});
  EDGES.forEach(([a,b],ei)=>{const A=NODES[a],B=NODES[b],M=new V3().lerpVectors(A,B,.5);M.y-=.32;
    for(const [P,Q,sgn] of [[A,M,0],[B,M,1]]){const g=new T.Group();g.position.copy(P);skel.add(g);
      for(const [mat,ph] of [[mA,0],[mB,Math.PI]]){const c=helixCurve(new V3(),new V3().subVectors(Q,P),ph+sgn*1.3,3.2,.075,.12);g.add(new T.Mesh(new T.TubeGeometry(c,70,.042,6),mat))}
      HALF.push({g,ei,P,Q})}
    const ring=new T.Mesh(ringG,ringM);ring.position.copy(M);ring.lookAt(B.x,M.y,B.z);skel.add(ring);RING.push(ring)});
  // junctional complexes: actin protofilament (gold beads), protein 4.1 (orange), adducin (cap)
  const nb=NODES.length*14,act=new T.InstancedMesh(new T.SphereGeometry(.07,10,8),new T.MeshStandardMaterial({color:0xe7b347,roughness:.35,emissive:0x2a1800}),nb);skel.add(act);
  const p41=new T.InstancedMesh(new T.SphereGeometry(.17,16,12),new T.MeshStandardMaterial({color:0xf08a3c,roughness:.45}),NODES.length);skel.add(p41);
  const add=new T.InstancedMesh(new T.SphereGeometry(.12,14,10),new T.MeshStandardMaterial({color:0x9b6bd6,roughness:.45}),NODES.length);skel.add(add);
  let k=0;NODES.forEach((N,i)=>{const a=R()*Math.PI;for(let j=0;j<14;j++){const u=(j/13-.5)*1.1;dum.position.set(N.x+Math.cos(a)*u+Math.cos(j*2.2)*.05,N.y+Math.sin(j*2.2)*.05,N.z+Math.sin(a)*u);dum.scale.setScalar(1);dum.updateMatrix();act.setMatrixAt(k++,dum.matrix)}
    dum.position.set(N.x+.25,N.y+.22,N.z+.15);dum.scale.set(1.2,.9,1);dum.updateMatrix();p41.setMatrixAt(i,dum.matrix);dum.position.set(N.x+Math.cos(a)*.62,N.y,N.z+Math.sin(a)*.62);dum.scale.setScalar(1);dum.updateMatrix();add.setMatrixAt(i,dum.matrix)});
  // ankyrin + band 3 + protein 4.2 at selected edges
  const ankM=new T.MeshStandardMaterial({color:0x8e5bd0,roughness:.5,emissive:0x12062a}),b3cM=new T.MeshStandardMaterial({color:0x3aa58a,roughness:.45}),p42M=new T.MeshStandardMaterial({color:0xe77fb0,roughness:.5});
  const bundle=helixBundle(8,1.15,.2,5),bundleM=new T.MeshStandardMaterial({vertexColors:true,roughness:.4,emissive:0x05140e});
  const B3=[];ANK.forEach(ei=>{const[a,b]=EDGES[ei];const A=NODES[a],Bn=NODES[b];const p=new V3().lerpVectors(A,Bn,.4);p.y-=.24;
    const g=new T.Group();root.add(g);const ank=new T.Mesh(new T.SphereGeometry(.22,18,14),ankM);ank.scale.set(1.25,.9,1);ank.position.set(p.x,p.y+.22,p.z);
    const cyto=new T.Mesh(new T.SphereGeometry(.24,18,14),b3cM);cyto.position.set(p.x,-.38,p.z);cyto.scale.set(1.3,.85,1);
    const link=new T.Mesh(new T.CylinderGeometry(.05,.05,1,6),ankM);stretch(link,ank.position,cyto.position);
    const tm=new T.Mesh(bundle,bundleM);tm.position.set(p.x,-.12,p.z);const tm2=new T.Mesh(bundle,bundleM);tm2.position.set(p.x+.5,-.12,p.z+.1);
    const c42=new T.Mesh(new T.SphereGeometry(.14,14,10),p42M);c42.position.set(p.x+.35,-.42,p.z-.18);
    g.add(ank,cyto,link,tm,tm2,c42);B3.push({g,ei,p:new V3(p.x+.25,0,p.z),ank,cyto,tm,c42})});
  // glycophorin C (single helix) above each junction, glycan chains on top
  const gpcM=new T.MeshStandardMaterial({color:0x3fb7c9,roughness:.4}),glyM=new T.MeshStandardMaterial({color:0xf1a3c8,roughness:.5,emissive:0x2a0a18});
  const GP=[];NODES.forEach((N,i)=>{if(i%2)return;const g=new T.Group();root.add(g);const h=new T.Mesh(helixBundle(1,1.15,0,i),gpcM);h.position.set(N.x+.3,-.12,N.z+.2);
    const st=new T.Mesh(new T.CylinderGeometry(.035,.035,1,6),gpcM);stretch(st,new V3(N.x+.25,N.y+.3,N.z+.15),new V3(N.x+.3,-.12,N.z+.2));g.add(h,st);
    const gl=new T.InstancedMesh(new T.SphereGeometry(.06,8,6),glyM,18);let q=0;for(let br=0;br<3;br++){let p=new V3(N.x+.3,1.05,N.z+.2);for(let s=0;s<6;s++){p=p.clone().add(new V3((R()-.5)*.18+(br-1)*.06,.13,(R()-.5)*.18));dum.position.copy(p);dum.scale.setScalar(1);dum.updateMatrix();gl.setMatrixAt(q++,dum.matrix)}}g.add(gl);GP.push({g,tip:new V3(N.x+.3,1.75,N.z+.2)})});
  // lipid bilayer: heads (instanced) and tails
  const LIP=[];for(let x=X0;x<=X1;x+=SP)for(let z=Z0;z<=Z1;z+=SP*.88){const jx=x+(Math.round(z/SP)%2)*SP/2;let ok=true;for(const b of B3){if(Math.hypot(jx-b.p.x,z-b.p.z)<.5){ok=false;break}}for(const g of GP){}if(ok)LIP.push([jx,z])}
  const NL=LIP.length,headG=new T.SphereGeometry(.13,12,9),tailG=new T.CylinderGeometry(.035,.035,.38,5);
  const headM=new T.MeshStandardMaterial({color:0xaeb2bd,roughness:.45,envMapIntensity:.6}),tailM=new T.MeshStandardMaterial({color:0x6d7079,roughness:.6});
  const hO=new T.InstancedMesh(headG,headM,NL),hI=new T.InstancedMesh(headG,headM,NL),tO=new T.InstancedMesh(tailG,tailM,NL*2),tI=new T.InstancedMesh(tailG,tailM,NL*2);root.add(hO,hI,tO,tI);
  // HS microvesicles
  const VES=[...HSdef].slice(0,3).map((ei,i)=>{const b=B3.find(x=>x.ei===ei);const g=new T.Group();root.add(g);const n1=220,n2=140;const o=new T.InstancedMesh(headG,headM,n1+n2);let q=0;
    for(let j=0;j<n1;j++){const d=fib(n1,j,0).multiplyScalar(.95);dum.position.copy(d);dum.scale.setScalar(1);dum.updateMatrix();o.setMatrixAt(q++,dum.matrix)}for(let j=0;j<n2;j++){const d=fib(n2,j,1).multiplyScalar(.58);dum.position.copy(d);dum.updateMatrix();o.setMatrixAt(q++,dum.matrix)}
    const core=new T.Mesh(new T.SphereGeometry(.8,24,16),tailM);g.add(o,core);g.visible=false;return{g,x:b.p.x,z:b.p.z,t0:.3+i*.12}});
  let sx=1,mode='normal';const hole=[0,0,0];
  function layout(t){const pos=new V3();let qi=0;
    for(let i=0;i<NL;i++){const[x0,z0]=LIP[i];let x=x0*sx,z=z0/Math.sqrt(sx);let hide=false;
      if(mode==='hs')for(let v=0;v<VES.length;v++){const V=VES[v];if(hole[v]>0&&Math.hypot(x0-V.x,z0-V.z)<hole[v])hide=true}
      const s=hide?0:1;dum.rotation.set(0,0,0);
      dum.position.set(x,TOP,z);dum.scale.setScalar(s);dum.updateMatrix();hO.setMatrixAt(i,dum.matrix);
      dum.position.set(x,BOT,z);dum.updateMatrix();hI.setMatrixAt(i,dum.matrix);
      for(const o of[-.05,.05]){dum.position.set(x+o,TOP-.24,z);dum.updateMatrix();tO.setMatrixAt(qi,dum.matrix);dum.position.set(x+o,BOT+.24,z);dum.updateMatrix();tI.setMatrixAt(qi,dum.matrix);qi++}}
    for(const m of[hO,hI,tO,tI])m.instanceMatrix.needsUpdate=true}
  // modes
  const MODES={normal:{name:'Normal',caps:[
      'The membrane is a lipid bilayer tied to a protein skeleton underneath. Spectrin tetramers (α red, β blue) form a hexagonal net between junctional complexes of short actin, protein 4.1 and adducin.',
      'Vertical links hold the bilayer onto the net: band 3 binds ankyrin, which binds β-spectrin (with protein 4.2), and glycophorin C binds protein 4.1. Horizontal links hold the net together: spectrin dimers meet head to head at the self-association site, and spectrin binds actin with protein 4.1.',
      'Under shear in the circulation the spectrin coils unfold and the net stretches.',
      'Released, the net springs back, so a 7.8 µm cell can fold through 3 µm splenic slits and recover its biconcave shape.']},
    hs:{name:'Hereditary spherocytosis',title:'Hereditary spherocytosis: vertical defect',info:'Defects of ankyrin (commonest), band 3, β- or α-spectrin, or protein 4.2. Usually autosomal dominant. Film: spherocytes; raised MCHC; EMA binding reduced; osmotic fragility increased (worse after 24 h incubation); DAT negative. Splenectomy corrects the anaemia but not the shape.',caps:[
      'Hereditary spherocytosis is a vertical defect: ankyrin, band 3, spectrin or protein 4.2 is reduced, so patches of bilayer are not tied to the skeleton.',
      'Where the vertical links are missing, the bilayer is free to bulge away from the net.',
      'The loose lipid buds off as microvesicles. Each vesicle carries membrane but almost no volume.',
      'The cell loses surface area for the same volume and rounds up into a spherocyte. Less deformable, it is trapped and removed in the spleen.']},
    he:{name:'Hereditary elliptocytosis',title:'Hereditary elliptocytosis: horizontal defect',info:'Defects of α-spectrin (commonest), β-spectrin or protein 4.1 weaken spectrin self-association or spectrin–actin junctions. Usually autosomal dominant and mild. Film: elliptocytes (more than 25%). Homozygous or compound forms cause hereditary pyropoikilocytosis with fragments and microspherocytes.',caps:[
      'Hereditary elliptocytosis is a horizontal defect: mutant α-spectrin, β-spectrin or protein 4.1 weakens the joints of the net, mostly where dimers meet to form tetramers.',
      'The bilayer is still well anchored, so little membrane is lost.',
      'Under shear, weak tetramers come apart into dimers at the self-association sites.',
      'The broken net cannot spring back, so the cell stays elongated: an elliptocyte. When many joints fail (pyropoikilocytosis), cells fragment.']}};
  const UI=storyUI(api,{dur:16,stages:[['The membrane',0,.18],['Links',.18,.36],['Stress',.36,.62],['Outcome',.62,1]],modes:MODES,modeLabel:'Compare',onMode:m=>{mode=m;if(m==='hs')api.orbit.flyTo({tx:new V3(0,.8,0),r:11,ph:1.05,th:.5})}});
  // labels
  const vis=(a,b)=>UI.t>=a&&UI.t<=b;
  api.labels=[
    {title:'Lipid bilayer',r:7,pos:()=>new V3(-2.2*sx,TOP+.05,Z1/Math.sqrt(sx)),text:'Two leaflets of phospholipid and cholesterol. The outer leaflet is rich in phosphatidylcholine; the inner one holds phosphatidylserine, kept inside by flippase.'},
    {title:'Band 3',r:5,pos:()=>{const b=B3[2];return b.g.visible?new V3(b.p.x*sx-.25,1.1,b.p.z/Math.sqrt(sx)):null},text:'The anion exchanger (chloride for bicarbonate) and the main anchor of the bilayer: its cytoplasmic domain binds ankyrin and protein 4.2. About 25% of HS cases. Southeast Asian ovalocytosis is a band 3 deletion.'},
    {title:'Ankyrin',r:5,pos:()=>{const b=B3[0];return b.ank.visible?b.ank.getWorldPosition(new V3()):null},text:'The bridge between band 3 and β-spectrin. Ankyrin defects are the commonest cause of hereditary spherocytosis (about 50%).'},
    {title:'Protein 4.2',r:5,pos:()=>{const b=B3[4];return b.c42.visible?b.c42.getWorldPosition(new V3()):null},text:'Stabilises the band 3–ankyrin link. Its deficiency causes a recessive form of HS, common in Japan.'},
    {title:'Spectrin tetramer',r:5,pos:()=>{const h=HALF[6];return h.g.getWorldPosition(new V3()).add(new V3(.3,-.1,0))},text:'α- and β-spectrin twist into a dimer; two dimers join head to head into a tetramer, the long elastic strut of the net. α-spectrin mutations are the commonest cause of HE.'},
    {title:'Self-association site',r:4.5,pos:()=>{const r=RING[[...HEbrk][1]];return r.visible&&r.scale.x>.5?r.getWorldPosition(new V3()):null},text:'Where two spectrin dimers meet to form a tetramer. Mutations here weaken the net horizontally and cause hereditary elliptocytosis and pyropoikilocytosis.'},
    {title:'Junctional complex',r:5,pos:()=>{const N=NODES[8];return skel.localToWorld(N.clone())},text:'Short actin filaments capped by adducin and tropomodulin, where six spectrin ends meet. Protein 4.1 strengthens spectrin–actin binding and links to glycophorin C. Protein 4.1 deficiency causes HE.'},
    {title:'Glycophorin C',r:5,pos:()=>GP[1].g.visible?new V3(GP[1].tip.x*sx,1.1,GP[1].tip.z/Math.sqrt(sx)):null,text:'A transmembrane glycoprotein that ties the bilayer to protein 4.1 (a second vertical link). Carries the Gerbich blood group antigens.'},
    {title:'Microvesicle',r:6,pos:()=>{const v=VES[0];return v.g.visible&&v.g.position.y>1.6?v.g.position.clone():null},text:'In HS, bilayer that has lost its anchor buds off. The cell loses surface area but keeps its volume, so it becomes spherical.'}];
  api.labels.forEach(L=>L.kicker='Structure');
  return{focus:()=>api.orbit.st.r,fx:p=>{p.range=.5;p.bloom=.15},tick(dt,now){UI.update(dt);const t=UI.t;
    // stretch profile
    const up=ease(seg(t,.38,.56)),down=ease(seg(t,.66,.86));const peak=1.5,rest=mode==='he'?1.32:1;sx=1+(peak-1)*up-(peak-rest)*down;
    skel.scale.set(sx,1,1/Math.sqrt(sx));
    for(const b of B3){const def=mode==='hs'&&HSdef.has(b.ei);b.ank.visible=b.cyto.visible=b.c42.visible=!def;b.tm.visible=!def;b.g.position.set(b.p.x*(sx-1),0,b.p.z*(1/Math.sqrt(sx)-1))}
    for(const g of GP)g.g.position.set(g.tip.x*(sx-1),0,g.tip.z*(1/Math.sqrt(sx)-1));
    // HE: tetramers break during stretch and retract
    const br=mode==='he'?ease(seg(t,.46,.6)):0;
    for(const h of HALF){const broken=HEbrk.has(h.ei)&&br>0;h.g.scale.setScalar(broken?1-.35*br:1);h.g.rotation.z=broken?(h.Q.x>h.P.x?-1:1)*.25*br:0}
    RING.forEach((r,i)=>{const b=HEbrk.has(i)&&br>0;r.scale.setScalar(b?1-br:1);r.visible=!b||br<.98});
    // HS vesicles
    VES.forEach((V,i)=>{const u=mode==='hs'?seg(t,V.t0,V.t0+.38):0;V.g.visible=u>0;hole[i]=u>0?.95*ease(c01(u*2.2)):0;
      if(u>0){const e=ease(u);V.g.position.set(V.x*sx,lerp(.5,3.4,e),V.z/Math.sqrt(sx)+e*.6);V.g.scale.setScalar(lerp(.35,1,ease(c01(u*2))))}});
    layout(t)}}}
/* ================= HAEMOGLOBIN ================= */
function globinGeo(seed,rgb){const r=rng(seed),gs=[];const H=[];
  for(let i=0;i<8;i++){const c=fib(8,i,seed*.7).multiplyScalar(.6);const d=new V3(r()-.5,r()-.5,r()-.5).normalize();const L=.75+r()*.75;H.push([c.clone().addScaledVector(d,-L/2),c.clone().addScaledVector(d,L/2),L])}
  H.forEach(([a,b,L],i)=>{const g=new T.TubeGeometry(helixCurve(a,b,r()*6,L*2.7,.13,0),Math.round(L*60),.075,7);const sh=.85+r()*.3;g.userData.col=[rgb[0]*sh,rgb[1]*sh,rgb[2]*sh];gs.push(g);
    if(i<7){const n=H[i+1][0],m=new V3().lerpVectors(b,n,.5).multiplyScalar(1.35);const l=new T.TubeGeometry(new T.CatmullRomCurve3([b,m,n]),24,.035,5);l.userData.col=[rgb[0]*.7,rgb[1]*.7,rgb[2]*.7];gs.push(l)}});
  return mergeGeos(gs)}
function buildHb(api){
  const{scene,ren}=api;const BG=0x0d1220;ren.setClearColor(BG);scene.fog=new T.Fog(BG,14,40);scene.environment=envMap(ren);
  scene.add(new T.HemisphereLight(0xe6eeff,0x2a1820,.6));const k1=new T.DirectionalLight(0xffffff,2.3);k1.position.set(5,8,7);scene.add(k1);const k2=new T.DirectionalLight(0x9ab8ff,1.5);k2.position.set(-6,-3,-7);scene.add(k2);
  const R=rng(51),dum=new T.Object3D();
  const COL={a:[.78,.16,.2],b:[.2,.36,.85],g:[.16,.62,.4]};
  const gA=globinGeo(3,COL.a),gB=globinGeo(7,COL.b),gG=globinGeo(7,COL.g);
  const gM=new T.MeshStandardMaterial({vertexColors:true,roughness:.42,envMapIntensity:.8,emissive:0x080808});
  const SUB=[['α1',gA,new V3(-.85,.7,.48)],['α2',gA,new V3(.85,-.7,.48)],['β1',gB,new V3(.85,.7,-.48)],['β2',gB,new V3(-.85,-.7,-.48)]];
  const mol=new T.Group();scene.add(mol);const D1=new T.Group(),D2=new T.Group();mol.add(D1,D2);
  const haemM=new T.MeshStandardMaterial({color:0x7a0d12,roughness:.35,emissive:0x3a0408}),feM=new T.MeshStandardMaterial({color:0xe08a2a,roughness:.3,metalness:.4,emissive:0x3a1a00});
  const o2M=new T.MeshStandardMaterial({color:0xff3b3b,roughness:.3,emissive:0x5a0505});
  const S=SUB.map(([nm,geo,p],i)=>{const g=new T.Group();g.position.copy(p);(i===0||i===2?D1:D2).add(g);const m=new T.Mesh(geo,gM);m.rotation.set(i,i*2,i*.5);g.add(m);
    const out=p.clone().normalize();const hp=out.clone().multiplyScalar(.72);const hm=new T.Group();hm.position.copy(hp);hm.lookAt(hp.clone().add(new V3(out.z,.3,-out.x)));
    const disc=new T.Mesh(new T.CylinderGeometry(.27,.27,.05,24),haemM);disc.rotation.x=Math.PI/2;const ring=new T.Mesh(new T.TorusGeometry(.23,.03,8,24),haemM);
    const fe=new T.Mesh(new T.SphereGeometry(.09,14,10),feM);hm.add(disc,ring,fe);g.add(hm);
    const o2=new T.Group();const a1=new T.Mesh(new T.SphereGeometry(.11,14,10),o2M),a2=a1.clone();a1.position.x=-.09;a2.position.x=.09;o2.add(a1,a2);scene.add(o2);o2.visible=false;
    const st=new T.Vector3(...[[-4,3,2],[4,-3,3],[3,4,-3],[-4,-3,-2]][i]);
    return{nm,g,m,hm,fe,o2,st,out,geoSwap:i>=2}});
  // 2,3-DPG in the central cavity between the beta chains
  const dpg=new T.Group();{const pM=new T.MeshStandardMaterial({color:0xf0d44a,roughness:.35,emissive:0x2a2200}),cM=new T.MeshStandardMaterial({color:0x9aa3ad,roughness:.4});
    for(let i=0;i<5;i++){const s=new T.Mesh(new T.SphereGeometry(i<3?.1:.14,12,9),i<3?cM:pM);s.position.set((i-2)*.15,Math.sin(i)*.1,0);dpg.add(s)}}
  scene.add(dpg);
  // beta-6 valine sticky patch (HbS)
  const val=new T.Mesh(new T.SphereGeometry(.16,16,12),new T.MeshStandardMaterial({color:0x7dff6a,emissive:0x1f6a12,roughness:.3}));S[2].g.add(val);val.position.set(.55,.55,-.35);
  // HbS fibre (low-detail tetramers)
  const blob=(()=>{const gs=[];[[-.5,.4,.3,COL.a],[.5,-.4,.3,COL.a],[.5,.4,-.3,COL.b],[-.5,-.4,-.3,COL.b]].forEach(([x,y,z,c])=>{const g=new T.SphereGeometry(.55,14,10);g.translate(x,y,z);g.userData.col=c;gs.push(g)});return mergeGeos(gs)})();
  const NF=72,fib1=new T.InstancedMesh(blob,new T.MeshStandardMaterial({vertexColors:true,roughness:.5}),NF);fib1.frustumCulled=false;scene.add(fib1);
  const FP=[];const fr=rng(9);for(let i=0;i<NF;i++){const s=i%4,k=Math.floor(i/4);const a=k*.55+s*Math.PI/2;FP.push({to:new V3(-9+k*1.05,Math.cos(a)*1.25+3.4,Math.sin(a)*1.25-3.5),from:new V3((fr()-.5)*24,(fr()-.5)*14+5,(fr()-.5)*14-6),rot:new V3(fr()*6,fr()*6,fr()*6)})}
  // floating O2 / CO2 dust
  const ND=260,dg=new T.BufferGeometry(),da=new Float32Array(ND*3),dc=new Float32Array(ND*3);for(let i=0;i<ND;i++){const v=new V3((R()-.5)*30,(R()-.5)*18,(R()-.5)*20);da.set([v.x,v.y,v.z],i*3);const c=R()<.5?[1,.35,.35]:[.6,.8,1];dc.set(c,i*3)}
  dg.setAttribute('position',new T.BufferAttribute(da,3));dg.setAttribute('color',new T.BufferAttribute(dc,3));const dust=new T.Points(dg,new T.PointsMaterial({size:.09,map:dot(),vertexColors:true,transparent:true,opacity:.7,depthWrite:false}));scene.add(dust);
  let mode='hba';
  const MODES={hba:{name:'HbA (α₂β₂)',caps:[
      'Adult haemoglobin is a tetramer of two α (red) and two β (blue) globin chains. Each chain folds into eight helices around a pocket that holds one haem: a porphyrin ring with ferrous iron (Fe²⁺) at its centre.',
      'Without oxygen the molecule is in the tense (T) state. Salt bridges hold the subunits tight and 2,3-DPG sits in the central cavity between the β chains, keeping oxygen affinity low.',
      'In the lungs the first O₂ binds slowly. Each binding loosens the T state, so the next ones bind faster (cooperativity): the α1β1 pair rotates about 15° against α2β2, the cavity narrows and 2,3-DPG is pushed out. This is the relaxed (R) state and the reason the dissociation curve is sigmoid.',
      'In the tissues, H⁺ and CO₂ (Bohr effect), heat and 2,3-DPG favour the T state again, so oxygen is released where it is needed: the curve shifts right.']},
    hbf:{name:'HbF (α₂γ₂)',title:'Fetal haemoglobin',info:'γ chains carry serine instead of histidine at position 143, so 2,3-DPG binds poorly. HbF therefore has a higher oxygen affinity (left-shifted curve), which lets the fetus take oxygen from maternal blood. HbF is normally under 1% in adults; it is raised in β-thalassaemia, HPFH and with hydroxyurea, and it inhibits HbS polymerisation.',caps:[
      'Fetal haemoglobin has two α and two γ (green) chains.',
      'γ chains bind 2,3-DPG poorly, so the cavity stays empty and the molecule is less held in the T state.',
      'Oxygen binds more easily than to HbA: higher affinity, curve shifted left. This lets the fetus pull oxygen across the placenta.',
      'HbF gives up oxygen less readily. In sickle cell disease it dilutes HbS and blocks polymer contacts, which is why hydroxyurea helps.']},
    hbs:{name:'HbS (β6 Glu→Val)',title:'Sickle haemoglobin',info:'A point mutation in <i>HBB</i> (GAG→GTG) puts valine instead of glutamic acid at β6. Oxygen binding is normal, but deoxygenated HbS molecules stick together through the hydrophobic valine patch and polymerise into long 14-strand fibres. Polymerisation depends on deoxygenation, HbS concentration (MCHC), and the time spent in the microcirculation; HbF inhibits it.',caps:[
      'Sickle haemoglobin has one change: valine replaces glutamic acid at position 6 of each β chain (bright green), leaving a hydrophobic sticky patch on the surface.',
      'Oxygenated HbS behaves normally. The trouble starts when it gives up its oxygen.',
      'Once deoxygenated, the valine patch fits a pocket on a neighbouring molecule, and molecules start to stack.',
      'Chains of deoxy-HbS twist into long, rigid fibres that stretch the red cell into a sickle. Reoxygenation melts them at first, but repeated cycles damage the membrane and cells stay sickled.']}};
  const UI=storyUI(api,{dur:20,stages:[['Structure',0,.2],['Deoxy (T state)',.2,.42],['Oxygen loading (R state)',.42,.72],['In the tissues',.72,1]],modes:MODES,modeLabel:'Haemoglobin',modeKicker:'Variant',onMode:m=>{mode=m;gG.userData.on=m==='hbf'}});
  const lv=(a,b)=>UI.t>=a&&UI.t<=b,tmp=new V3();
  api.labels=[
    {title:'α chain',r:6,pos:()=>S[0].g.getWorldPosition(new V3()).add(new V3(-.6,.7,.3)),text:'141 amino acids, coded by two genes on each chromosome 16 (<i>HBA1</i>, <i>HBA2</i>). Losing α genes causes α-thalassaemia.'},
    {title:'β chain',r:6,pos:()=>mode==='hbf'?null:S[2].g.getWorldPosition(new V3()).add(new V3(.6,.7,-.3)),text:'146 amino acids, coded by <i>HBB</i> on chromosome 11. Reduced output causes β-thalassaemia; the β6 change gives HbS, β26 HbE, and β6 Glu→Lys HbC.'},
    {title:'γ chain',r:6,pos:()=>mode==='hbf'?S[2].g.getWorldPosition(new V3()).add(new V3(.6,.7,-.3)):null,text:'Fetal β-like chain (<i>HBG1</i>, <i>HBG2</i> on chromosome 11). The switch from γ to β happens around birth; BCL11A represses γ in adults.'},
    {title:'Haem',r:4,pos:()=>S[1].hm.getWorldPosition(new V3()),text:'Protoporphyrin IX with iron at its centre, sitting in a pocket between helices E and F. Haem synthesis needs eight enzymes; defects cause porphyrias and sideroblastic anaemia.'},
    {title:'Iron (Fe²⁺)',r:3.5,pos:()=>S[0].fe.getWorldPosition(new V3()),text:'Only ferrous iron binds oxygen. Oxidised to ferric (Fe³⁺) it forms methaemoglobin, which cannot carry oxygen (cyanosis with a normal PaO₂).'},
    {title:'Oxygen',r:4,pos:()=>{const s=S[3];return s.o2.visible?s.o2.position.clone():null},text:'Each haem binds one O₂, so each tetramer carries four. Carbon monoxide binds about 240 times more tightly.'},
    {title:'2,3-DPG',r:4,pos:()=>dpg.visible?dpg.position.clone():null,text:'2,3-bisphosphoglycerate from the Rapoport–Luebering shunt of glycolysis. It binds the β chains in the central cavity and stabilises the T state, shifting the curve right. It rises in anaemia and at altitude; it falls in stored blood.'},
    {title:'β6 valine',r:3.5,pos:()=>mode==='hbs'?val.getWorldPosition(new V3()):null,text:'The single amino acid change of sickle cell disease. In deoxy-HbS it docks into a hydrophobic pocket (β85–β88) of the next molecule, starting polymerisation.'},
    {title:'HbS polymer fibre',r:9,pos:()=>mode==='hbs'&&UI.t>.86?new V3(-1,4.7,-3.5):null,text:'Seven pairs of twisted double strands form a 14-strand fibre about 21 nm wide. Bundles of fibres deform the cell into a sickle and make it rigid.'}];
  api.labels.forEach(L=>L.kicker='Structure');
  const st0=api.orbit;
  return{focus:()=>api.orbit.st.r,fx:p=>{p.range=.55;p.bloom=.12},tick(dt,now){UI.update(dt);const t=UI.t;if(mode==='hbs'&&t>.74&&t<.8&&!this.fl){this.fl=1;api.orbit.flyTo({tx:new V3(0,1.6,-1.5),r:17,ph:1.25},1.6)}if(t<.7)this.fl=0;
    const hbf=mode==='hbf',hbs=mode==='hbs';
    S[2].m.geometry=S[3].m.geometry=hbf?gG:gB;val.visible=hbs;
    // T -> R transition while loading, back to T in tissues
    const load=seg(t,.44,.7),unload=seg(t,.76,.95);const R_=ease(load)*(1-ease(unload));
    D1.rotation.z=R_*.13;D2.rotation.z=-R_*.13;D1.position.set(0,0,R_*.12);D2.position.set(0,0,-R_*.12);
    S.forEach((s,i)=>{s.m.rotation.y=i*2+Math.sin(now*.6+i)*.03});
    mol.rotation.y=now*.08;mol.position.y=Math.sin(now*.5)*.08;
    // oxygen: cooperative binding (each faster), released in tissues
    const order=[0,2,1,3],gaps=[.0,.12,.19,.24];
    S.forEach((s,i)=>{const k=order.indexOf(i),ts=.45+gaps[k],te=ts+(.13-k*.025);let u=ease(seg(t,ts,te));const off=ease(seg(t,.77+k*.04,.9+k*.03));
      const site=s.fe.getWorldPosition(new V3()).add(s.g.getWorldDirection(tmp).set(0,0,0)).add(s.out.clone().applyQuaternion(mol.quaternion).multiplyScalar(.28));
      const away=s.st.clone().applyQuaternion(mol.quaternion);
      s.o2.visible=t>.4&&(u>0||off>0)&&!(off>=1);
      if(off>0)s.o2.position.lerpVectors(site,away.clone().multiplyScalar(1.4),off);else s.o2.position.lerpVectors(away,site,u);
      s.o2.rotation.set(now+i,now*.7,0)});
    // DPG: sits in cavity in T state (not with HbF), expelled in R
    const cav=new V3(0,0,-1.25).applyQuaternion(mol.quaternion).add(mol.position);const outP=new V3(0,.5,-4.5).applyQuaternion(mol.quaternion);
    let din=ease(seg(t,.22,.34));if(hbf)din=din*(1-ease(seg(t,.3,.4)));const dOut=Math.max(ease(seg(t,.5,.62))*(1-ease(seg(t,.8,.93))),hbf?ease(seg(t,.3,.4)):0);
    dpg.visible=t>.2;dpg.position.lerpVectors(new V3(-3,-3,-5),cav,din).lerp(outP,dOut);dpg.rotation.set(now,now*.6,0);
    // HbS fibre forms in the tissues
    const fu=hbs?ease(seg(t,.76,.98)):0;fib1.visible=fu>0;
    if(fu>0){for(let i=0;i<NF;i++){const F=FP[i],u=c01(fu*1.6-i/NF*.6);dum.position.lerpVectors(F.from,F.to,ease(u));dum.rotation.set(F.rot.x*(1-u),F.rot.y*(1-u)+i*.55,F.rot.z*(1-u));dum.scale.setScalar(.42);dum.updateMatrix();fib1.setMatrixAt(i,dum.matrix)}fib1.instanceMatrix.needsUpdate=true}
    dust.rotation.y=now*.01}}}
/* ================= CELL-BASED COAGULATION ================= */
function molGeo(n,seed,rgb,sz){const r=rng(seed),gs=[];let p=new V3();for(let i=0;i<n;i++){const rad=(sz||.2)*(.75+r()*.6);const g=new T.SphereGeometry(rad,14,10);g.translate(p.x,p.y,p.z);const sh=.85+r()*.3;g.userData.col=[rgb[0]*sh,rgb[1]*sh,rgb[2]*sh];gs.push(g);
  p=p.clone().add(new V3(r()-.5,r()-.5,r()-.5).normalize().multiplyScalar((sz||.2)*1.3));}return mergeGeos(gs).center()}
function buildCoag(api){
  const{scene,ren}=api;const BG=0x0c0f1c;ren.setClearColor(BG);scene.fog=new T.Fog(BG,16,42);scene.environment=envMap(ren);
  scene.add(new T.HemisphereLight(0xeef2ff,0x2a1414,.55));const k1=new T.DirectionalLight(0xfff2e6,2.4);k1.position.set(3,10,8);scene.add(k1);const k2=new T.DirectionalLight(0x9ab8ff,1.4);k2.position.set(-6,3,-8);scene.add(k2);
  const R=rng(61),dum=new T.Object3D(),tmp=new V3();
  const RC=8,CL=new V3(-6.6,-7.4,0),CP=new V3(6.6,-7.4,0);
  const onCell=(C,x,z,lift)=>{const dx=x-C.x,dz=z-C.z;const y=C.y+Math.sqrt(Math.max(0,RC*RC-dx*dx-dz*dz));const n=new V3(dx,y-C.y,dz).normalize();return{p:new V3(x,y,z).addScaledVector(n,lift||0),n}};
  const bump=noiseTex(256,5,1200);bump.repeat.set(6,3);
  const tfCell=new T.Mesh(new T.SphereGeometry(RC,96,64),new T.MeshPhysicalMaterial({color:0xc4826a,roughness:.55,sheen:.6,sheenColor:new T.Color(0xffd0b0),bumpMap:bump,bumpScale:1.5}));tfCell.position.copy(CL);scene.add(tfCell);
  const pltM=new T.MeshPhysicalMaterial({color:0x8a84b4,roughness:.55,envMapIntensity:.45,sheen:.3,sheenColor:new T.Color(0xe6e0ff),bumpMap:bump,bumpScale:1.2,emissive:0x000000});
  const plt=new T.Mesh(new T.SphereGeometry(RC,96,64),pltM);plt.position.copy(CP);scene.add(plt);
  // filopodia on the platelet
  const filM=pltM;for(let i=0;i<14;i++){const x=CP.x+(R()-.5)*9,z=(R()-.5)*7;const s=onCell(CP,x,z,0);const m=new T.Mesh(new T.CylinderGeometry(.035,.1,1,8).translate(0,.5,0),filM);m.position.copy(s.p);m.quaternion.setFromUnitVectors(UP,s.n.clone().add(new V3((R()-.5)*.6,0,(R()-.5)*.6)).normalize());m.scale.set(1,1.2+R()*2,1);scene.add(m)}
  const MOL=(n,seed,c,sz)=>{const g=molGeo(n,seed,c,sz);return()=>new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.4,envMapIntensity:.8}))};
  const C={tf:[.25,.72,.45],vii:[.95,.8,.2],x:[.62,.58,.55],xa:[1,.55,.15],ix:[.55,.6,.7],ixa:[.3,.55,1],v:[.6,.5,.6],va:[.85,.35,.85],viii:[.6,.6,.5],viiia:[.2,.85,.85],th:[.95,.15,.18],at:[.55,.3,.9],xi:[.55,.55,.55],xia:[.95,.9,.9],vwf:[.65,.6,.9]};
  const mk={tf:MOL(5,1,C.tf,.2),vii:MOL(5,2,C.vii,.19),x:MOL(6,3,C.x,.21),ix:MOL(6,4,C.ix,.2),v:MOL(7,5,C.v,.22),viii:MOL(7,6,C.viii,.22),th:MOL(4,7,C.th,.17),at:MOL(6,8,C.at,.2),xi:MOL(6,9,C.xi,.2)};
  const recol=(m,c,u)=>{m.material.color.setRGB(1,1,1).lerp(new T.Color(c[0]*1.6,c[1]*1.6,c[2]*1.6),u)};
  const add=(m,p)=>{scene.add(m);m.position.copy(p);m.scale.setScalar(1.5);return m};
  // left (TF-bearing cell)
  const TF=[[-5.2,-.6],[-3.6,.9],[-4.4,-2.2],[-6.8,1.4],[-2.8,-1.2]].map(([x,z])=>{const s=onCell(CL,x,z,.25);const m=add(mk.tf(),s.p);m.scale.set(1.5,2,1.5);return{m,s}});
  const VII=TF.slice(0,2).map((f,i)=>({m:add(mk.vii(),new V3()),from:new V3(-6+i*3,6,3-i*5),to:f.s.p.clone().addScaledVector(f.s.n,.55)}));
  const XL={m:add(mk.x(),new V3()),from:new V3(-9,5,-3),site:TF[0].s.p.clone().addScaledVector(TF[0].s.n,.5).add(new V3(.6,0,.2))};
  const VAL={m:add(mk.v(),new V3()),site:onCell(CL,-4.4,.0,.45).p};
  const IX={m:add(mk.ix(),new V3()),from:new V3(-2,6,4),site:TF[1].s.p.clone().addScaledVector(TF[1].s.n,.55).add(new V3(.5,0,-.3))};
  // right (platelet)
  const PS={tenIX:onCell(CP,3.6,.4,.5).p,tenVIII:onCell(CP,4.3,.95,.5).p,proXa:onCell(CP,5.2,-.6,.5).p,proVa:onCell(CP,5.95,-.05,.5).p,xi:onCell(CP,3.3,-1.8,.5).p};
  const VIII={m:add(mk.viii(),new V3()),from:new V3(2.5,5,-3)};const vwfL=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new V3(1,5.6,-4),new V3(2,5.2,-3.4),new V3(3,5.8,-3),new V3(4,5.3,-2.4),new V3(5,5.9,-2)]),60,.06,6),new T.MeshStandardMaterial({color:0xa799e0,roughness:.5}));scene.add(vwfL);
  const VR={m:add(mk.v(),new V3()),from:new V3(9,5,3)};const XI={m:add(mk.xi(),new V3()),from:new V3(1,5,-5)};
  const IXP={m:add(mk.ix(),new V3()),from:new V3(-1,6,3)};const XP={m:add(mk.x(),new V3()),from:new V3(9,6,-3)};
  // thrombin particles
  const NT=150,thG=molGeo(4,7,C.th,.2),thI=new T.InstancedMesh(thG,new T.MeshStandardMaterial({vertexColors:true,roughness:.35,emissive:0x400406}),NT);thI.frustumCulled=false;scene.add(thI);
  const TP=[];const tr=rng(71);for(let i=0;i<NT;i++){const small=i<10;TP.push({small,te:small?.2+i*.012:.58+tr()*.18,d:new V3(tr()-.5,.6+tr(),tr()-.5).normalize(),sp:2+tr()*4,at:tr()})}
  // antithrombin (heparin mode)
  const ATN=14,ATs=[];for(let i=0;i<ATN;i++){const m=add(mk.at(),new V3());ATs.push({m,base:new V3((tr()-.5)*14,2.5+tr()*4,(tr()-.5)*8),ph:tr()*6})}
  // fibrinogen and fibrin
  const NFg=36,fgG=(()=>{const gs=[];[[-.45,0,0,.17],[0,0,0,.12],[.45,0,0,.17]].forEach(([x,y,z,r])=>{const g=new T.SphereGeometry(r,10,8);g.translate(x,y,z);g.userData.col=[.95,.75,.35];gs.push(g)});const c=new T.CylinderGeometry(.04,.04,.9,6).rotateZ(Math.PI/2);c.userData.col=[.9,.7,.3];gs.push(c);return mergeGeos(gs)})();
  const fgI=new T.InstancedMesh(fgG,new T.MeshStandardMaterial({vertexColors:true,roughness:.45}),NFg);fgI.frustumCulled=false;scene.add(fgI);const FG=[];for(let i=0;i<NFg;i++)FG.push({p:new V3((tr()-.5)*18,3+tr()*5,-1-tr()*6),r:new V3(tr()*6,tr()*6,tr()*6)});
  const fibM=new T.MeshStandardMaterial({color:0xe2552a,emissive:0x4a1004,roughness:.45});const FIB=[];
  for(let i=0;i<34;i++){const pts=[];let p=new V3((tr()-.5)*16,1.2+tr()*4.5,(tr()-.5)*8);for(let k=0;k<6;k++){pts.push(p.clone());p=p.clone().add(new V3((tr()*2-1)*3,(tr()*2-1)*1.2,(tr()*2-1)*2));p.y=clamp(p.y,.9,6.5)}
    const g=new T.TubeGeometry(new T.CatmullRomCurve3(pts),90,.045+tr()*.03,6);g.setDrawRange(0,0);const m=new T.Mesh(g,fibM);m.frustumCulled=false;m.userData={n:g.index.count,d:tr()};scene.add(m);FIB.push(m)}
  let mode='normal';
  const MODES={normal:{name:'Normal',caps:[
      'On a tissue-factor-bearing cell outside the vessel, injury exposes tissue factor (green). Factor VIIa (yellow) binds it, and TF:VIIa activates factor X and factor IX. Xa with a little Va makes a small amount of thrombin.',
      'That small amount of thrombin reaches nearby platelets already stuck at the injury. It activates them (they expose phosphatidylserine), frees factor VIII from vWF and activates it, and activates factors V and XI.',
      'On the activated platelet, IXa with VIIIa (the tenase) makes Xa directly on the platelet surface; Xa with Va (the prothrombinase) produces a burst of thrombin, many times more than in initiation.',
      'Thrombin cuts fibrinopeptides from fibrinogen; fibrin monomers line up and polymerise into strands, cross-linked by factor XIIIa, that bind the platelet plug into a stable clot.']},
    ha:{name:'Haemophilia A',title:'Haemophilia A (factor VIII deficiency)',info:'X-linked; 1 in 5000 males. Initiation is normal, but without VIIIa there is no tenase on the platelet, so the thrombin burst fails. Prolonged APTT, normal PT; low FVIII:C. Severe (&lt;1%) causes joint and muscle bleeds.',caps:[null,'Amplification starts, but there is no factor VIII to release from vWF.','Without VIIIa there is no tenase: little Xa is made on the platelet, and the thrombin burst does not happen.','Only scattered fibrin forms, so the clot is weak and bleeding restarts: joint and muscle bleeds.']},
    hb:{name:'Haemophilia B',title:'Haemophilia B (factor IX deficiency)',info:'X-linked (Christmas disease), about 1 in 30,000 males. Clinically like haemophilia A. Prolonged APTT, normal PT; low FIX. Factor IX is vitamin K dependent.',caps:['Initiation is normal except that there is no factor IX for TF:VIIa to activate.',null,'Without IXa there is no tenase on the platelet, so the thrombin burst fails.','Fibrin formation is poor and the clot is weak.']},
    hep:{name:'Heparin + antithrombin',title:'Heparin and antithrombin',info:'Antithrombin is the main natural inhibitor of thrombin and Xa (also IXa, XIa). Heparin binds antithrombin and speeds it up about 1000-fold. Unfractionated heparin acts on thrombin and Xa (monitor APTT or anti-Xa); LMWH and fondaparinux act mainly on Xa (anti-Xa). Inherited antithrombin deficiency causes thrombosis.',caps:[null,null,'Antithrombin (purple), accelerated by heparin, grabs thrombin and Xa as soon as they form and inactivates them.','With most thrombin neutralised, little fibrin forms.']}};
  MODES.ha.caps=MODES.ha.caps.map((c,i)=>c||MODES.normal.caps[i]);MODES.hb.caps=MODES.hb.caps.map((c,i)=>c||MODES.normal.caps[i]);MODES.hep.caps=MODES.hep.caps.map((c,i)=>c||MODES.normal.caps[i]);
  const UI=storyUI(api,{dur:24,stages:[['Initiation',0,.3],['Amplification',.3,.52],['Propagation',.52,.76],['Fibrin',.76,1]],modes:MODES,modeLabel:'Compare',onMode:m=>{mode=m}});
  const lv=(a,b)=>UI.t>=a&&UI.t<=b;
  api.labels=[
    {title:'Tissue factor',r:6,pos:()=>TF[3].m.position.clone(),text:'A transmembrane receptor on fibroblasts and other cells outside the vessel. It meets plasma only after injury, which starts coagulation. Also expressed by monocytes in sepsis and by some cancers.'},
    {title:'TF:VIIa',r:5,pos:()=>lv(.08,.32)?VII[0].m.position.clone():null,text:'The extrinsic tenase. About 1% of factor VII circulates already active; bound to tissue factor it activates X and IX. Blocked by TFPI once Xa forms. Measured by the PT.'},
    {title:'Factor Xa',r:5,pos:()=>lv(.14,.32)?XL.m.position.clone():null,text:'The point where the old intrinsic and extrinsic pathways meet. Target of rivaroxaban, apixaban, edoxaban and of LMWH via antithrombin.'},
    {title:'Thrombin',r:6,pos:()=>{if(!lv(.22,.95))return null;const i=UI.t<.5?2:40;thI.getMatrixAt(i,dum.matrix);const p=new V3().setFromMatrixPosition(dum.matrix);return p.y>-20?p:null},text:'Factor IIa: the central enzyme. It turns fibrinogen into fibrin, activates platelets (PAR-1, PAR-4), factors V, VIII, XI and XIII, and, bound to thrombomodulin, activates protein C. Target of dabigatran and argatroban.'},
    {title:'Activated platelet',r:8,pos:()=>lv(.32,1)?onCell(CP,8,2.5,.2).p:null,text:'Activation flips phosphatidylserine to the outer leaflet. This negatively charged surface, with calcium, is where the tenase and prothrombinase complexes assemble.'},
    {title:'VIII released from vWF',r:5,pos:()=>lv(.34,.5)&&mode!=='ha'?VIII.m.position.clone():null,text:'vWF carries factor VIII and protects it from breakdown. Thrombin cleaves VIII, freeing VIIIa. Low vWF lowers FVIII too (type 2N vWD looks like mild haemophilia A).'},
    {title:'Tenase (IXa:VIIIa)',r:4.5,pos:()=>lv(.52,.78)&&mode!=='ha'&&mode!=='hb'?PS.tenIX.clone().add(new V3(.3,.5,.3)):null,text:'The intrinsic tenase makes Xa about 50 times faster than TF:VIIa. Missing in haemophilia A (VIII) and B (IX).'},
    {title:'Prothrombinase (Xa:Va)',r:4.5,pos:()=>lv(.52,.8)?PS.proXa.clone().add(new V3(.3,.5,0)):null,text:'Xa with Va, calcium and phospholipid converts prothrombin to thrombin about 300,000 times faster than Xa alone. Factor V Leiden resists inactivation by activated protein C.'},
    {title:'Fibrinogen',r:6,pos:()=>{const p=FG[5].p;return lv(.6,.9)?p.clone():null},text:'Factor I: a dimer of three chains (Aα, Bβ, γ) with a central E domain and two outer D domains. Thrombin releases fibrinopeptides A and B, exposing sites that let monomers assemble.'},
    {title:'Fibrin',r:6,pos:()=>{const m=FIB[4];return lv(.85,1)&&m.visible?m.localToWorld(m.geometry.parameters.path.getPoint(.35)):null},text:'Polymerised fibrin, cross-linked by factor XIIIa. Plasmin later breaks it into fragments including D-dimer.'},
    {title:'Antithrombin',r:5,pos:()=>mode==='hep'?ATs[0].m.position.clone():null,text:'A serpin that traps thrombin and Xa in a 1:1 complex. Heparin makes it work about 1000 times faster.'}];
  api.labels.forEach(L=>L.kicker='Structure');
  const flyP=(m,from,to,a,b,ref)=>{const u=ease(seg(UI.t,a,b));m.position.lerpVectors(from,to,u);return u};
  return{focus:()=>api.orbit.st.r,fx:p=>{p.range=.6;p.bloom=.25},tick(dt,now){UI.update(dt);const t=UI.t;const ha=mode==='ha',hb=mode==='hb',hep=mode==='hep';const bob=x=>Math.sin(now*1.3+x)*.06;
    // initiation
    VII.forEach((v,i)=>{flyP(v.m,v.from,v.to,.02+i*.03,.1+i*.03);v.m.rotation.set(now*.3+i,now*.2,0)});
    {const a=flyP(XL.m,XL.from,XL.site,.08,.16);recol(XL.m,ease(seg(t,.16,.2))>0?C.xa:C.x,1);XL.m.position.lerp(VAL.site.clone().add(new V3(.55,0,.2)),ease(seg(t,.19,.24)))}
    VAL.m.position.copy(VAL.site);recol(VAL.m,C.va,1);VAL.m.visible=true;
    IX.m.visible=!hb;if(!hb){flyP(IX.m,IX.from,IX.site,.1,.18);recol(IX.m,t>.19?C.ixa:C.ix,1);IX.m.position.lerp(PS.tenIX,ease(seg(t,.24,.5)))}
    // amplification on the platelet
    const act=ease(seg(t,.3,.45));pltM.emissive.setRGB(.12*act,.05*act,.01*act);pltM.color.setRGB(lerp(.54,.72,act),lerp(.52,.58,act),lerp(.7,.6,act));
    VIII.m.visible=!ha;vwfL.visible=true;if(!ha){VIII.m.position.lerpVectors(new V3(3,5.8,-3).add(new V3(0,-.35,0)),PS.tenVIII,ease(seg(t,.36,.5)));recol(VIII.m,t>.4?C.viiia:C.viii,1)}
    flyP(VR.m,VR.from,PS.proVa,.32,.48);recol(VR.m,t>.4?C.va:C.v,1);
    flyP(XI.m,XI.from,PS.xi,.34,.5);recol(XI.m,t>.44?C.xia:C.xi,1);
    IXP.m.visible=!hb;if(!hb){flyP(IXP.m,IXP.from,PS.tenIX.clone().add(new V3(-.6,.1,-.5)),.3,.5);recol(IXP.m,C.ixa,1)}
    // tenase makes Xa which joins Va: prothrombinase
    const ten=!(ha||hb);XP.m.visible=true;if(ten){XP.m.position.lerpVectors(XP.from,PS.tenIX.clone().add(new V3(.5,.25,.5)),ease(seg(t,.5,.56)));XP.m.position.lerp(PS.proXa,ease(seg(t,.56,.62)));recol(XP.m,t>.56?C.xa:C.x,1)}else{XP.m.position.lerpVectors(XP.from,XP.from.clone().add(new V3(-2,-1,1)),ease(seg(t,.5,.7)));recol(XP.m,C.x,1)}
    // thrombin: trickle from TF cell, burst from platelet
    let made=0;for(let i=0;i<NT;i++){const P=TP[i];let ok=t>P.te;if(!P.small&&!ten&&i>22)ok=false;let p;
      if(ok){const tau=t-P.te;if(P.small){const s=VAL.site.clone().add(new V3(.5,.4,0));const tgt=onCell(CP,3+P.at*3,(P.at-.5)*3,.5).p;p=s.lerp(tgt,ease(c01(tau/.2)));p.y+=Math.sin(c01(tau/.2)*Math.PI)*2.5}
        else{p=PS.proXa.clone().addScaledVector(P.d,P.sp*c01(tau/.25)*1.6);p.x-=c01(tau/.25)*P.at*6}
        const killed=hep&&P.at<.85&&tau>.04;if(killed&&tau>.1)ok=false;if(ok)made++}
      if(!ok){dum.position.set(0,-50,0);dum.scale.setScalar(0)}else{dum.position.copy(p);dum.scale.setScalar(1);dum.rotation.set(now+i,now*.7+i,0)}dum.updateMatrix();thI.setMatrixAt(i,dum.matrix)}thI.instanceMatrix.needsUpdate=true;
    ATs.forEach((a,i)=>{a.m.visible=hep;if(hep)a.m.position.copy(a.base).add(new V3(Math.sin(now*.4+a.ph)*1.2,Math.cos(now*.3+a.ph)*.6,0))});
    // fibrinogen to fibrin
    const strength=hep?.12:ten?1:.18;
    for(let i=0;i<NFg;i++){const F=FG[i];const gone=t>.78+((i*37)%70)/70*.18*(1/strength)&&i/NFg<strength*1.2;dum.position.copy(F.p).add(new V3(Math.sin(now*.3+i)*.3,Math.cos(now*.25+i)*.2,0));dum.rotation.set(F.r.x+now*.2,F.r.y,F.r.z);dum.scale.setScalar(gone?0:1);dum.updateMatrix();fgI.setMatrixAt(i,dum.matrix)}fgI.instanceMatrix.needsUpdate=true;
    FIB.forEach((m,i)=>{const ok=i/FIB.length<strength;const u=ok?ease(seg(t,.78+m.userData.d*.12,1)):0;const n=Math.floor(m.userData.n*u/3)*3;m.geometry.setDrawRange(0,n);m.visible=n>0});
    [VII[0].m,VII[1].m,XL.m,IX.m,VR.m,XI.m].forEach((m,i)=>{m.position.y+=bob(i)*0})}}}
/* ================= IRON ABSORPTION AND HEPCIDIN ================= */
function superEllipsoid(a,b,c,e,W,H){const g=new T.SphereGeometry(1,W||64,H||48),p=g.attributes.position;const f=x=>Math.sign(x)*Math.pow(Math.abs(x),e);for(let i=0;i<p.count;i++)p.setXYZ(i,a*f(p.getX(i)),b*f(p.getY(i)),c*f(p.getZ(i)));g.computeVertexNormals();return g}
function buildIron(api){
  const{scene,ren}=api;const BG=0x0e0b14;ren.setClearColor(BG);scene.fog=new T.Fog(BG,16,40);scene.environment=envMap(ren);
  scene.add(new T.HemisphereLight(0xfff2ea,0x221420,.6));const k1=new T.DirectionalLight(0xfff2e6,2.2);k1.position.set(4,9,8);scene.add(k1);const k2=new T.DirectionalLight(0x9ab8ff,1.3);k2.position.set(-6,-2,-8);scene.add(k2);
  const R=rng(81),dum=new T.Object3D(),col=new T.Color();
  const HX=1.55,HY=3.2,HZ=1.55;
  const cellG=superEllipsoid(HX,HY,HZ,.38),cellM=new T.MeshPhysicalMaterial({color:0xe7a98f,roughness:.5,transparent:true,opacity:.32,depthWrite:true,side:T.DoubleSide,sheen:.5,sheenColor:new T.Color(0xffd6c4)});
  const sideM=cellM.clone();sideM.opacity=.55;
  [-3.3,0,3.3].forEach(x=>{const m=new T.Mesh(cellG,x?sideM:cellM);m.position.x=x;m.renderOrder=3;scene.add(m)});
  // brush border microvilli
  const NV=3*70,mv=new T.InstancedMesh(new T.CapsuleGeometry(.07,.55,4,8),new T.MeshStandardMaterial({color:0xf0b8a0,roughness:.5}),NV);let q=0;
  for(const cx of[-3.3,0,3.3])for(let i=0;i<70;i++){const x=cx+(R()-.5)*2.6,z=(R()-.5)*2.6;dum.position.set(x,HY+.25,z);dum.rotation.set((R()-.5)*.15,0,(R()-.5)*.15);dum.scale.setScalar(1);dum.updateMatrix();mv.setMatrixAt(q++,dum.matrix)}scene.add(mv);
  // nucleus
  const nuc=new T.Mesh(new T.SphereGeometry(.7,32,24),new T.MeshStandardMaterial({color:0x6a3f8a,roughness:.5}));nuc.scale.set(1,1.4,1);nuc.position.set(0,-1.7,0);scene.add(nuc);
  const MOLM=()=>new T.MeshStandardMaterial({vertexColors:true,roughness:.4,envMapIntensity:.8});
  const DMT1=[[-.6,.3],[.5,-.4],[.2,.7]].map(([x,z],i)=>{const m=new T.Mesh(molGeo(7,20+i,[.25,.5,1],.15),MOLM());m.position.set(x,HY-.05,z);m.scale.set(1,1.8,1);scene.add(m);return m});
  const DCY=[[-1,-.2],[.95,.3]].map(([x,z],i)=>{const m=new T.Mesh(molGeo(5,30+i,[1,.55,.2],.14),MOLM());m.position.set(x,HY+.05,z);scene.add(m);return m});
  const FPN=[[-.8,.3],[.7,-.3],[0,.8],[.1,-.85]].map(([x,z],i)=>{const m=new T.Mesh(molGeo(8,40+i,[.65,.3,.95],.15),MOLM());const p=new V3(x,-HY+.05,z);m.position.copy(p);m.scale.set(1,1.9,1);scene.add(m);return{m,p}});
  const HEPH=FPN.map((f,i)=>{const m=new T.Mesh(molGeo(4,50+i,[.3,.8,.7],.12),MOLM());m.position.copy(f.p).add(new V3(.32,.05,.1));scene.add(m);return m});
  // ferritin cages with iron cores
  const ferM=new T.MeshStandardMaterial({color:0xe9c46a,roughness:.35,flatShading:true,transparent:true,opacity:.55}),coreM=new T.MeshStandardMaterial({color:0x8a3d12,roughness:.5,emissive:0x2a0c02});
  const FER=[[-.7,1.2,.3],[.6,.8,-.4],[-.2,.2,.6],[.7,1.7,.4],[-.6,-.1,-.6]].map(p=>{const g=new T.Group();g.position.set(...p);const sh=new T.Mesh(new T.IcosahedronGeometry(.3,1),ferM),co=new T.Mesh(new T.SphereGeometry(.2,14,10),coreM);g.add(sh,co);scene.add(g);return{g,co}});
  // capillary with transferrin
  const cap=new T.Mesh(new T.CylinderGeometry(1.3,1.3,26,48,1,true).rotateZ(Math.PI/2),new T.MeshPhysicalMaterial({color:0xc0505a,roughness:.5,transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:true}));cap.position.set(0,-5.3,0);scene.add(cap);
  const tfM=new T.MeshStandardMaterial({color:0xe88ab0,roughness:.4}),feM=new T.MeshStandardMaterial({color:0xff8a1e,emissive:0x5a2400,roughness:.3});
  const TF=[];for(let i=0;i<12;i++){const g=new T.Group();const l1=new T.Mesh(new T.SphereGeometry(.24,16,12),tfM),l2=l1.clone();l1.position.x=-.2;l2.position.x=.2;const f1=new T.Mesh(new T.SphereGeometry(.08,10,8),feM),f2=f1.clone();f1.position.set(-.2,.22,0);f2.position.set(.2,.22,0);g.add(l1,l2,f1,f2);scene.add(g);TF.push({g,f1,f2,ph:i*2.17,y:(R()-.5)*1.4,z:(R()-.5)*1.4})}
  const rbcI=new T.InstancedMesh(rbcGeo(32,20,'disc'),new T.MeshPhysicalMaterial({color:0xa80f1b,roughness:.4,sheen:.6,sheenColor:new T.Color(0xff6a6a)}),6);rbcI.frustumCulled=false;scene.add(rbcI);
  // iron atoms
  const NI=110,feI=new T.InstancedMesh(new T.SphereGeometry(.1,12,9),new T.MeshStandardMaterial({color:0xffffff,roughness:.3,emissive:0x111111}),NI);feI.frustumCulled=false;scene.add(feI);
  const FE=[];for(let i=0;i<NI;i++)FE.push({s:R()*.62,x0:(R()-.5)*3,z0:(R()-.5)*3,d:i%DMT1.length,c:i%DCY.length,fpn:i%4,fer:i%FER.length,r:R()});
  const C3=new T.Color(0xc4501a),C2=new T.Color(0x4af0c8);
  // hepcidin
  const NH=10,hepG=new T.TubeGeometry(new T.CatmullRomCurve3([new V3(-.25,0,0),new V3(-.1,.2,0),new V3(.1,.2,0),new V3(.25,0,0),new V3(.1,-.1,0)]),24,.06,6),hepM=new T.MeshStandardMaterial({color:0xffe14a,emissive:0x4a3a00,roughness:.3});
  const HEP=[];for(let i=0;i<NH;i++){const m=new T.Mesh(hepG,hepM);m.scale.setScalar(1.6);scene.add(m);HEP.push({m,f:i%4,from:new V3(-12+R()*3,-5.3+(R()-.5),(R()-.5)),dl:R()*.08})}
  let mode='normal';
  const MD={normal:{store:.35,flux:1,hep:1,sat:.3,core:.6},id:{store:.05,flux:1.6,hep:0,sat:.1,core:.15},acd:{store:1,flux:.7,hep:4,sat:.12,core:1},hh:{store:.05,flux:1.8,hep:0,sat:.85,core:.2}};
  const MODES={normal:{name:'Normal',caps:[
      'Dietary non-haem iron is mostly ferric (Fe³⁺, brown). At the duodenal brush border, duodenal cytochrome b (DCYTB, orange) reduces it to ferrous iron (Fe²⁺, cyan), which enters the cell through DMT1 (blue). Haem iron enters separately and is freed by haem oxygenase.',
      'Inside the enterocyte, iron is either stored in ferritin (gold cages) or passed to the basolateral side. Iron left in ferritin is lost when the cell sheds after 2–3 days.',
      'Ferroportin (purple), the only known iron exporter, pumps Fe²⁺ out; hephaestin oxidises it to Fe³⁺ so it can load onto transferrin (pink) in the blood. Normal transferrin saturation is 20–45%.',
      'Hepcidin (yellow), made by the liver when iron stores or IL-6 are high, binds ferroportin and makes it internalised and degraded. Less iron leaves the gut and macrophages: hepcidin is the master regulator.']},
    id:{name:'Iron deficiency',title:'Iron deficiency',info:'Low iron stores switch hepcidin off (and HIF-2α raises DMT1, DCYTB and ferroportin), so absorption rises up to 3–5 fold. Ferritin low (&lt;30 µg/L), transferrin saturation low (&lt;16–20%), TIBC high. Oral iron is best absorbed on alternate days, because each dose briefly raises hepcidin.',caps:[null,'With hepcidin low, little iron is held back in ferritin.',null,'There is almost no hepcidin, so every ferroportin stays at the surface and absorption is maximal. Transferrin saturation is still low because demand is high.']},
    acd:{name:'Anaemia of inflammation',title:'Anaemia of inflammation (chronic disease)',info:'IL-6 drives hepcidin up. Ferroportin is degraded in enterocytes and macrophages, so iron is trapped: serum iron and transferrin saturation fall while ferritin is normal or high. Oral iron is poorly absorbed; intravenous iron may help.',caps:[null,'With hepcidin high, iron is held in ferritin instead of leaving the cell.','Most ferroportin has already been removed, so very little iron reaches transferrin: low serum iron and saturation.','Inflammation (IL-6) keeps hepcidin high, so ferroportin is degraded: iron is trapped in enterocytes and macrophages despite normal stores.']},
    hh:{name:'Haemochromatosis',title:'HFE haemochromatosis',info:'C282Y homozygosity (about 1 in 200 of northern European descent) blunts hepcidin production. Absorption stays high despite full stores, transferrin saturation exceeds 45% early, and iron builds up in liver, heart, pancreas, joints and skin. Treated by venesection.',caps:[null,null,'Ferroportin runs at full speed and transferrin becomes heavily saturated (above 45%), the first lab sign.','Hepcidin is inappropriately low for the body iron, so absorption never switches off and iron accumulates in the liver, heart and pancreas.']}};
  ['id','acd','hh'].forEach(k=>MODES[k].caps=MODES[k].caps.map((c,i)=>c||MODES.normal.caps[i]));
  const VIEWS=[{tx:new V3(0,3,0),r:8,ph:1.05,th:.35},{tx:new V3(0,.7,0),r:7,ph:1.3,th:.3},{tx:new V3(0,-4,0),r:9,ph:1.35,th:.4},{tx:new V3(0,-.8,0),r:15,ph:1.35,th:.45}];
  const UI=storyUI(api,{dur:28,stages:[['Uptake',0,.25],['Storage',.25,.45],['Export',.45,.7],['Hepcidin',.7,1]],modes:MODES,modeLabel:'Compare',onMode:m=>{mode=m}});
  let lastSt=-1;
  api.labels=[
    {title:'DCYTB',r:4,pos:()=>DCY[0].position.clone().add(new V3(0,.2,0)),text:'Duodenal cytochrome b, a ferrireductase on the brush border. Vitamin C helps by keeping iron ferrous.'},
    {title:'DMT1',r:4,pos:()=>DMT1[1].position.clone().add(new V3(0,.3,0)),text:'Divalent metal transporter 1 carries Fe²⁺ (and other divalent metals such as lead) into the enterocyte. Its expression rises in iron deficiency.'},
    {title:'Ferritin',r:4,pos:()=>FER[0].g.position.clone(),text:'A 24-subunit protein shell that can hold up to 4500 iron atoms. Serum ferritin reflects body stores but rises with inflammation.'},
    {title:'Ferroportin',r:4,pos:()=>FPN[0].m.visible?FPN[0].m.position.clone():null,text:'The only known cellular iron exporter, on enterocytes, macrophages and hepatocytes. Hepcidin binding causes its internalisation. Ferroportin disease is a dominant form of iron overload.'},
    {title:'Hephaestin',r:4,pos:()=>HEPH[1].position.clone(),text:'A copper-dependent ferroxidase that converts Fe²⁺ to Fe³⁺ for loading onto transferrin (ceruloplasmin does the same in plasma). Copper deficiency can cause iron-deficient anaemia.'},
    {title:'Transferrin',r:5,pos:()=>TF[3].g.position.clone(),text:'Carries two Fe³⁺ per molecule to cells with transferrin receptor 1, mainly erythroblasts. TIBC is a measure of transferrin.'},
    {title:'Hepcidin',r:5,pos:()=>{const h=HEP[0];return h.m.visible?h.m.position.clone():null},text:'A 25-amino-acid peptide from the liver. Raised by iron and IL-6; lowered by iron deficiency, hypoxia and erythroferrone from active erythropoiesis (why iron overload develops in thalassaemia).'},
    {title:'Brush border',r:6,pos:()=>new V3(-3.3,HY+.6,.5),text:'Microvilli of the duodenal enterocyte, where nearly all dietary iron is absorbed. Coeliac disease and duodenal surgery reduce absorption.'}];
  api.labels.forEach(L=>L.kicker='Structure');
  return{focus:()=>api.orbit.st.r,fx:p=>{p.range=1.3;p.bloom=.2},tick(dt,now){UI.update(dt);const t=UI.t,M=MD[mode];
    const si=UI.stage();if(si!==lastSt){lastSt=si;if(UI.playing)api.orbit.flyTo(VIEWS[si],1.4)}
    // ferroportin: hepcidin binding removes it
    const hepU=ease(seg(t,.72,.92));const lost=n=>mode==='acd'?(n<3?1:hepU):mode==='normal'?(n===0?hepU:0):0;
    FPN.forEach((f,i)=>{const L=lost(i);f.m.visible=L<.98;f.m.position.copy(f.p).add(new V3(0,L*1.2,0));f.m.scale.set(1-L*.6,1.9*(1-L*.6),1-L*.6);HEPH[i].visible=true});
    HEP.forEach((h,i)=>{const show=M.hep>0&&(mode==='acd'?i<8:i<3);h.m.visible=show&&t>.7;if(!h.m.visible)return;const f=FPN[h.f];const u=ease(seg(t,.7+h.dl,.8+h.dl));h.m.position.lerpVectors(h.from,f.p.clone().add(new V3(.1,-.25,0)),u);if(lost(h.f)>0)h.m.position.y=lerp(h.m.position.y,f.m.position.y-.2,lost(h.f));h.m.rotation.set(now+i,now*.8,0)});
    const expOK=i=>{const open=FPN.filter((f,k)=>lost(k)<.5).length;return open>0};
    // iron atoms
    for(let i=0;i<NI;i++){const F=FE[i];const s=F.s/M.flux,store=F.r<M.store;let p=null,c=C3;const tau=t-s;
      if(tau>0){const d=DMT1[F.d].position,dc=DCY[F.c].position,fer=FER[F.fer].g.position,fp=FPN[F.fpn%4].p;
        if(tau<.05){p=new V3(F.x0,7,F.z0).lerp(dc.clone().add(new V3(0,.3,0)),ease(tau/.05))}
        else if(tau<.08){p=dc.clone().add(new V3(0,.3,0)).lerp(d.clone().add(new V3(0,.4,0)),ease((tau-.05)/.03));c=C2}
        else if(tau<.13){p=d.clone().add(new V3(0,.4,0)).lerp(d.clone().add(new V3(F.r-.5,-1.3,0)),ease((tau-.08)/.05));c=C2}
        else if(store||!expOK(i)){if(tau<.2){p=d.clone().add(new V3(F.r-.5,-1.3,0)).lerp(fer,ease((tau-.13)/.07));c=C2}else p=null}
        else if(tau<.22){p=d.clone().add(new V3(F.r-.5,-1.3,0)).lerp(fp.clone().add(new V3(0,.3,0)),ease((tau-.13)/.09));c=C2}
        else if(tau<.26){p=fp.clone().add(new V3(0,.3,0)).lerp(new V3(fp.x,-4.6,fp.z),ease((tau-.22)/.04));c=tau>.24?C3:C2}
        else if(tau<.5){p=new V3(fp.x+(tau-.26)*30,-4.6-Math.min(.4,(tau-.26)*4),fp.z);c=C3;if(p.x>12)p=null}}
      if(p){dum.position.copy(p);dum.scale.setScalar(1)}else{dum.position.set(0,-80,0);dum.scale.setScalar(0)}dum.updateMatrix();feI.setMatrixAt(i,dum.matrix);feI.setColorAt(i,c)}
    feI.instanceMatrix.needsUpdate=true;if(feI.instanceColor)feI.instanceColor.needsUpdate=true;
    FER.forEach((f,i)=>{const fill=M.core*(.5+.5*ease(seg(t,.15,.5)));f.co.scale.setScalar(Math.max(.15,fill));f.g.rotation.y=now*.2+i});
    TF.forEach((f,i)=>{const x=((now*1.4+f.ph*2)%26)-13;f.g.position.set(x,-5.3+f.y*.6,f.z*.6);f.g.rotation.set(now*.3+i,now*.2,0);f.f1.visible=((i*7)%10)/10<M.sat;f.f2.visible=((i*3+5)%10)/10<M.sat});
    for(let i=0;i<6;i++){const x=((now*1.1+i*4.4)%26)-13;dum.position.set(x,-5.3+Math.sin(i)*.5,Math.cos(i*2)*.5);dum.rotation.set(now*.4+i,i,0);dum.scale.setScalar(.25);dum.updateMatrix();rbcI.setMatrixAt(i,dum.matrix)}rbcI.instanceMatrix.needsUpdate=true}}}

function buildFib(api){
  const{scene,ren}=api;const BG=0x0d0a12;ren.setClearColor(BG);scene.fog=new T.Fog(BG,15,38);scene.environment=envMap(ren);
  scene.add(new T.HemisphereLight(0xfff0ea,0x24141c,.6));const k1=new T.DirectionalLight(0xfff0e0,2.3);k1.position.set(5,9,7);scene.add(k1);const k2=new T.DirectionalLight(0x8fb0ff,1.3);k2.position.set(-7,2,-6);scene.add(k2);
  const R=rng(97),dum=new T.Object3D(),col=new T.Color(),tmp=new V3();
  const EY=-4.6;
  // endothelium: a floor of bulging endothelial cells
  const bump=noiseTex(256,9,1400);bump.repeat.set(5,5);
  const floor=new T.Mesh(new T.PlaneGeometry(60,40,1,1).rotateX(-Math.PI/2),new T.MeshPhysicalMaterial({color:0x8a3c44,roughness:.6,sheen:.5,sheenColor:new T.Color(0xffb0a0),bumpMap:bump,bumpScale:1}));floor.position.y=EY-.25;scene.add(floor);
  const NEC=46,ec=new T.InstancedMesh(new T.SphereGeometry(1,32,16),new T.MeshPhysicalMaterial({color:0xb4606a,roughness:.5,sheen:.6,sheenColor:new T.Color(0xffc4b4),bumpMap:bump,bumpScale:.8}),NEC);
  for(let i=0;i<NEC;i++){const x=(i%9-4)*3.2+(R()-.5)*1.2+((i/9|0)%2)*1.6,z=((i/9|0)-2.5)*2.4+(R()-.5)*.6;dum.position.set(x,EY-.2,z);dum.rotation.set(0,R()*3,0);dum.scale.set(1.9+R()*.4,.38,1.1+R()*.3);dum.updateMatrix();ec.setMatrixAt(i,dum.matrix)}scene.add(ec);
  // fibrin network: nodes and fibres (each fibre = two halves so a cut can recoil)
  const NN=78,nodes=[];while(nodes.length<NN){const p=new V3((R()-.5)*2,(R()-.5)*2,(R()-.5)*2);if(p.lengthSq()>1)continue;p.multiply(new V3(6.6,2.7,3.8));p.y+=.2;nodes.push(p)}
  const E=[],seen=new Set();nodes.forEach((a,i)=>{const d=nodes.map((b,j)=>[a.distanceTo(b),j]).sort((x,y)=>x[0]-y[0]);for(let k=1;k<=3;k++){const j=d[k][1],key=Math.min(i,j)+'_'+Math.max(i,j);if(seen.has(key))continue;seen.add(key);const b=nodes[j];const m=a.clone().lerp(b,.5).add(new V3((R()-.5)*.5,(R()-.5)*.5,(R()-.5)*.5));const dir=b.clone().sub(a).normalize();let nrm=new V3(0,1,0).cross(dir);if(nrm.lengthSq()<.01)nrm.set(1,0,0);nrm.normalize();E.push({a,b,m,nrm,bi:nrm.clone().cross(dir).normalize(),r:R()})}});
  const NE=E.length;
  const fibBump=noiseTex(128,12,500);fibBump.wrapS=fibBump.wrapT=T.RepeatWrapping;fibBump.repeat.set(1,6);
  const fibG=new T.CylinderGeometry(.075,.075,1,10,6,true).translate(0,.5,0);
  const fibM=new T.MeshPhysicalMaterial({color:0xd9c9a8,roughness:.5,sheen:.6,sheenColor:new T.Color(0xfff4dc),bumpMap:fibBump,bumpScale:2.5,envMapIntensity:.7});
  const halves=new T.InstancedMesh(fibG,fibM,NE*2);halves.frustumCulled=false;scene.add(halves);
  const knots=new T.InstancedMesh(new T.IcosahedronGeometry(.13,2),fibM,NN);nodes.forEach((p,i)=>{dum.position.copy(p);dum.rotation.set(0,0,0);dum.scale.setScalar(1+R()*.4);dum.updateMatrix();knots.setMatrixAt(i,dum.matrix)});scene.add(knots);
  // trapped red cells
  const NR=13,rbcI=new T.InstancedMesh(rbcGeo(32,20,'disc'),new T.MeshPhysicalMaterial({color:0xa30f1c,roughness:.4,sheen:.6,sheenColor:new T.Color(0xff6a6a)}),NR);rbcI.frustumCulled=false;scene.add(rbcI);
  const RB=[];for(let i=0;i<NR;i++){const p=new V3((R()-.5)*9,(R()-.5)*3.2,(R()-.5)*4.4);RB.push({p,rot:new T.Euler(R()*3,R()*3,R()*3),v:p.clone().setY(p.y*.3+1.2).normalize()})}
  // molecules (instanced, white vertex colours tinted per instance)
  const IM=(g,c,em)=>{const m=new T.InstancedMesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.35,envMapIntensity:.8,color:c,emissive:em||0x000000}),NE);m.frustumCulled=false;scene.add(m);return m};
  const W=[1,1,1];
  const plgI=IM(molGeo(7,71,W,.17),0x4a86ff),tpaI=IM(molGeo(5,72,W,.16),0x3fdc84),plmI=IM(molGeo(7,71,W,.17),0xff4f9a,0xa0104a),paiI=IM(molGeo(5,73,W,.15),0xffa21e),apI=IM(molGeo(6,74,W,.16),0xb06cff);
  const txaI=new T.InstancedMesh(new T.SphereGeometry(.07,8,6),new T.MeshStandardMaterial({color:0xffffff,emissive:0x9ae8ff,emissiveIntensity:1.6}),NE*2);txaI.frustumCulled=false;scene.add(txaI);
  const ddG=mergeGeos([Object.assign(new T.SphereGeometry(.2,14,10).translate(-.3,0,0),{userData:{col:[1,.85,.5]}}),Object.assign(new T.SphereGeometry(.2,14,10).translate(.3,0,0),{userData:{col:[1,.85,.5]}}),Object.assign(new T.SphereGeometry(.14,12,8),{userData:{col:[.95,.6,.3]}}),Object.assign(new T.CylinderGeometry(.06,.06,.6,8).rotateZ(Math.PI/2),{userData:{col:[1,.8,.5]}})]);
  const ddI=new T.InstancedMesh(ddG,new T.MeshStandardMaterial({vertexColors:true,roughness:.35,emissive:0x3a2008}),NE);ddI.frustumCulled=false;scene.add(ddI);
  // per-fibre schedule
  const order=E.map((e,i)=>i).sort((x,y)=>E[x].r-E[y].r);const rank=new Array(NE);order.forEach((k,i)=>rank[k]=i/NE);
  E.forEach(e=>{const ang=R()*6.28;e.plgFrom=new V3(Math.cos(ang)*14,(R()-.3)*6,Math.sin(ang)*9);e.tpaFrom=new V3((R()-.5)*16,EY+.2,(R()-.5)*10);e.paiFrom=new V3((R()-.5)*18,EY+.3+R()*2,(R()-.5)*12);e.apFrom=new V3(Math.cos(ang+2)*13,(R()-.2)*5,Math.sin(ang+2)*9);e.dv=e.m.clone().normalize().add(new V3((R()-.5)*.6,.3+R()*.4,(R()-.5)*.6)).normalize();e.j=R()});
  let mode='normal';
  const MD={normal:{cut:.45,mol:.22,t0:.45,t1:.78,pai:.12},txa:{cut:.03,mol:.3,t0:.5,t1:.78,pai:.12},tpa:{cut:.92,mol:.4,t0:.28,t1:.62,pai:.05},pai:{cut:.06,mol:.3,t0:.5,t1:.78,pai:.85}};
  const MODES={normal:{name:'Normal',caps:[
      'A fibrin clot: cross-linked fibrin fibres hold red cells in place. Plasminogen and tPA both have binding sites for fibrin, so the clot itself is where fibrinolysis happens.',
      'Endothelium releases tissue plasminogen activator (tPA, green). Plasminogen (blue) binds lysine residues on fibrin through its kringle domains, next to tPA. On fibrin, tPA converts plasminogen to plasmin (pink) hundreds of times faster than in plasma.',
      'Plasmin cuts fibrin. The fibres recoil, red cells are freed, and the cross-linked fragments released include D-dimer (gold): proof that cross-linked fibrin has been broken down.',
      'Free tPA is mopped up by PAI-1 (orange) and free plasmin by α2-antiplasmin (violet), within seconds. So lysis stays local to the clot and circulating fibrinogen is spared.']},
    txa:{name:'Tranexamic acid',title:'Tranexamic acid',info:'Tranexamic acid is a lysine analogue. It fills the lysine-binding sites on plasminogen so it cannot attach to fibrin, and very little plasmin forms on the clot. Used in trauma (within 3 hours), postpartum haemorrhage, menorrhagia, dental bleeding in haemophilia and surgery.',caps:[null,'Tranexamic acid (white dots) occupies the lysine-binding sites of plasminogen, so plasminogen cannot settle on fibrin.','Without plasminogen on the fibre, tPA has nothing to activate: the clot stays intact.',null]},
    tpa:{name:'Thrombolysis (alteplase)',title:'Thrombolytic therapy',info:'Recombinant tPA (alteplase, tenecteplase) floods the clot with activator, so lysis is fast and complete. Used in acute ischaemic stroke, massive pulmonary embolism and, where PCI is unavailable, myocardial infarction. The main risk is bleeding, including intracranial haemorrhage.',caps:[null,'A bolus of alteplase saturates the clot with tPA, so plasmin forms everywhere at once.','Almost every fibre is cut and D-dimer rises steeply; some plasmin escapes and also digests fibrinogen.','There is too much tPA for PAI-1 to neutralise, which is why bleeding is the main complication.']},
    pai:{name:'High PAI-1',title:'Raised PAI-1',info:'PAI-1 rises in obesity and metabolic syndrome, sepsis, pregnancy and with some malignancies. Too much PAI-1 neutralises tPA before it reaches fibrin, so clots resist lysis: a thrombotic tendency. Rare PAI-1 deficiency does the opposite and causes delayed bleeding after trauma or surgery.',caps:[null,'Excess PAI-1 (orange) captures tPA in plasma before it reaches the clot.','Very little plasmin forms and only a few fibres are cut: the clot persists.',null]}};
  ['txa','tpa','pai'].forEach(k=>MODES[k].caps=MODES[k].caps.map((c,i)=>c||MODES.normal.caps[i]));
  const first=order[0];
  const VIEWS=[{tx:new V3(0,0,0),r:14,ph:1.2,th:.5},{tx:E[first].m.clone(),r:5.5,ph:1.15,th:.7},{tx:new V3(0,0,0),r:10.5,ph:1.2,th:.2},{tx:new V3(0,-.5,0),r:15,ph:1.15,th:-.3}];
  const UI=storyUI(api,{dur:26,stages:[['Fibrin clot',0,.2],['Activation',.2,.45],['Lysis',.45,.8],['Control',.8,1]],modes:MODES,modeLabel:'Compare',onMode:m=>{mode=m}});
  let lastSt=-1;
  const cur={plg:[],tpa:[],plm:[],pai:[],ap:[],dd:[]};
  const pick=(arr,i0)=>{for(let k=0;k<NE;k++){const i=order[(k+(i0||0))%NE];if(arr[i])return arr[i].clone()}return null};
  api.labels=[
    {title:'Fibrin',r:6,pos:()=>E[order[NE-1]].m.clone(),text:'Cross-linked by factor XIIIa, fibrin forms the scaffold of the clot. Its lysine residues are the docking sites for plasminogen and tPA.'},
    {title:'tPA',r:4.5,pos:()=>pick(cur.tpa,2),text:'Tissue plasminogen activator, released by endothelium (exercise, stress, venous occlusion, DDAVP). Weak in plasma, highly active on fibrin. Urokinase (uPA) is the other activator, mainly in tissues and urine.'},
    {title:'Plasminogen',r:4.5,pos:()=>pick(cur.plg,1),text:'A liver-made zymogen whose kringle domains bind lysine on fibrin. It is incorporated into the clot as it forms.'},
    {title:'Plasmin',r:4.5,pos:()=>pick(cur.plm),text:'A serine protease that cleaves fibrin (and fibrinogen, factors V and VIII). Bound to fibrin it is shielded from α2-antiplasmin.'},
    {title:'D-dimer',r:5,pos:()=>pick(cur.dd),text:'A fragment with two D domains joined by a factor XIIIa cross-link, so it comes only from cross-linked fibrin. A normal D-dimer helps exclude VTE when pre-test probability is low; it is raised in DIC, pregnancy, malignancy, infection and old age.'},
    {title:'PAI-1',r:4.5,pos:()=>pick(cur.pai),text:'Plasminogen activator inhibitor 1, from endothelium and platelets, is the main brake on tPA. It is an acute-phase reactant.'},
    {title:'α2-antiplasmin',r:4.5,pos:()=>pick(cur.ap),text:'Neutralises free plasmin within a fraction of a second. Factor XIIIa cross-links it into fibrin, protecting the clot. Deficiency causes a bleeding disorder.'},
    {title:'Endothelium',r:7,pos:()=>new V3(-6,EY+.3,2),text:'Endothelial cells release tPA and PAI-1 and regulate the balance between clot formation and removal.'}];
  api.labels.forEach(L=>L.kicker='Fibrinolysis');
  const hide=(I,i)=>{dum.position.set(0,-90,0);dum.scale.setScalar(0);dum.updateMatrix();I.setMatrixAt(i,dum.matrix)};
  const put=(I,i,p,s,rx,ry)=>{dum.position.copy(p);dum.rotation.set(rx||0,ry||0,0);dum.scale.setScalar(s*.8);dum.updateMatrix();I.setMatrixAt(i,dum.matrix)};
  const dir=new V3(),q=new T.Quaternion();
  return{focus:()=>api.orbit.st.r,fx:p=>{p.range=1.25;p.bloom=.14},tick(dt,now){UI.update(dt);const t=UI.t,M=MD[mode];
    const si=UI.stage();if(si!==lastSt){lastSt=si;if(UI.playing)api.orbit.flyTo(VIEWS[si],1.4)}
    let freed=0;
    for(let i=0;i<NE;i++){const e=E[i],cutting=rank[i]<M.cut,tc=cutting?lerp(M.t0,M.t1,rank[i]/Math.max(M.cut,.001)):9;
      const blocked=!cutting&&(mode==='pai'?rank[i]<.8:false);
      const wob=new V3(Math.sin(now*1.3+i),Math.cos(now*1.1+i*1.7),Math.sin(now*.9+i*.6)).multiplyScalar(.06);
      const active=rank[i]<M.mol;
      const ta=(cutting?tc:lerp(M.t0,M.t1,rank[i]))-.22;
      const site=e.m.clone().addScaledVector(e.nrm,.32),site2=e.m.clone().addScaledVector(e.bi,.34);
      // fibre halves
      const rec=ease(seg(t,tc,tc+.06));if(t>=tc)freed++;
      [[e.a,1],[e.b,-1]].forEach(([s,sg],h)=>{const m2=e.m;dir.subVectors(m2,s);const L=dir.length();dir.normalize();q.setFromUnitVectors(UP,dir);dum.position.copy(s);dum.quaternion.copy(q);dum.scale.set(1,L*(1-.62*rec),1);dum.updateMatrix();halves.setMatrixAt(i*2+h,dum.matrix)});
      // plasminogen
      cur.plg[i]=cur.plm[i]=cur.tpa[i]=cur.pai[i]=cur.ap[i]=cur.dd[i]=null;
      if(active&&t>ta){const u=ease(seg(t,ta,ta+.1));let p;
        if(mode==='txa'){const back=seg(t,ta+.1,ta+.3);p=e.plgFrom.clone().lerp(site,u*.82-back*.5);p.add(wob.clone().multiplyScalar(4))}
        else p=e.plgFrom.clone().lerp(site,u).add(wob);
        const conv=cutting?seg(t,tc-.07,tc-.03):0;
        if(conv<1){put(plgI,i,p,1,now*.3+i,i);cur.plg[i]=p}else hide(plgI,i);
        if(conv>0){let pp=p.clone();if(t>tc+.02)pp.addScaledVector(e.dv,Math.min(1.5,(t-tc-.02)*14));const ap0=Math.max(tc+.08,.8+e.j*.06),fade=ease(seg(t,ap0+.06,ap0+.1));
          if(fade<1){put(plmI,i,pp,(.6+.4*conv)*(1+.15*Math.sin(now*9+i))*(1-fade),now*.6+i,i);cur.plm[i]=fade<.5?pp:null}else hide(plmI,i);
          if(t>ap0&&fade<1){const ua=ease(seg(t,ap0,ap0+.06));const ap=e.apFrom.clone().lerp(pp.clone().add(new V3(.35,.1,0)),ua);put(apI,i,ap,1-fade,now*.4,i);cur.ap[i]=fade<.5?ap:null}else hide(apI,i)}
        else{hide(plmI,i);hide(apI,i)}
        // TXA molecules on plasminogen
        if(mode==='txa'&&conv<1){put(txaI,i*2,p.clone().add(new V3(.2,.18,0)),1);put(txaI,i*2+1,p.clone().add(new V3(-.15,.22,.12)),1)}else{hide(txaI,i*2);hide(txaI,i*2+1)}
      }else{hide(plgI,i);hide(plmI,i);hide(apI,i);hide(txaI,i*2);hide(txaI,i*2+1)}
      // tPA (from endothelium) and PAI-1
      const tt=ta+.02,inter=mode==='pai'?!cutting&&active:false;
      if(active&&t>tt){const u=ease(seg(t,tt,tt+.11));let p;
        if(inter){const meet=e.tpaFrom.clone().lerp(site2,.45);p=e.tpaFrom.clone().lerp(site2,.45*u);if(u>=1)p=meet.clone().add(new V3(0,-(t-tt-.11)*6,0));const up=ease(seg(t,tt,tt+.11));const pa=e.paiFrom.clone().lerp(meet.clone().add(new V3(.3,0,0)),up);if(u>=1)pa.y=p.y;put(paiI,i,pa,1,now*.5,i);cur.pai[i]=pa}
        else{p=e.tpaFrom.clone().lerp(site2,u).add(wob);
          // late PAI-1 capture of tPA leaving the clot
          const tl=Math.max(tc+.04,.82+e.j*.06);if(rank[i]<M.pai*3&&t>tl){const ul=ease(seg(t,tl,tl+.06));const pa=e.paiFrom.clone().lerp(p.clone().add(new V3(.3,.05,0)),ul);put(paiI,i,pa,1,now*.5,i);cur.pai[i]=pa;if(ul>=1){p.addScaledVector(new V3(0,1,0),(t-tl-.06)*5);pa.y=p.y;put(paiI,i,pa,1,now*.5,i)}}else hide(paiI,i)}
        if(p.y>9||p.y<EY-1){hide(tpaI,i);hide(paiI,i)}else{put(tpaI,i,p,1,now*.4+i,i*.7);cur.tpa[i]=p}}
      else{hide(tpaI,i);hide(paiI,i)}
      // D-dimer released at the cut
      if(t>tc){const k=t-tc,dp=e.m.clone().addScaledVector(e.dv,k*16);const s=Math.min(1,k*30)*(1-ease(seg(k,.18,.26)));if(s>0){put(ddI,i,dp,s,now*.7+i,now*.5);cur.dd[i]=k<.12?dp:null}else hide(ddI,i)}else hide(ddI,i);
    }
    [halves,plgI,tpaI,plmI,paiI,apI,ddI,txaI].forEach(I=>I.instanceMatrix.needsUpdate=true);
    // red cells drift free when most of the clot is lysed
    const lib=ease(Math.min(1,freed/NE*1.5)),rt=Math.max(0,t-.55);
    RB.forEach((b,i)=>{const p=b.p.clone().addScaledVector(b.v,Math.min(4,lib*rt*12));dum.position.copy(p);dum.rotation.set(b.rot.x+now*.1*lib,b.rot.y,b.rot.z);dum.scale.setScalar(.19);dum.updateMatrix();rbcI.setMatrixAt(i,dum.matrix)});rbcI.instanceMatrix.needsUpdate=true}}}

function buildPnh(api){
  const{scene,ren}=api;const BG=0x0b0c16;ren.setClearColor(BG);scene.fog=new T.Fog(BG,14,44);scene.environment=envMap(ren);
  scene.add(new T.HemisphereLight(0xf2f0ff,0x2a1018,.6));const k1=new T.DirectionalLight(0xfff0e6,2.3);k1.position.set(4,10,6);scene.add(k1);const k2=new T.DirectionalLight(0x90b0ff,1.4);k2.position.set(-6,3,-7);scene.add(k2);
  const R=rng(131),dum=new T.Object3D(),tmp=new V3();
  const RC=11,CC=new V3(0,-RC,0);
  const onS=(x,z,lift)=>{const y=Math.sqrt(Math.max(0,RC*RC-x*x-z*z))-RC;const n=new V3(x,y+RC,z).normalize();return{p:new V3(x,y,z).addScaledVector(n,lift||0),n}};
  const basis=n=>{let a=new V3(1,0,0).cross(n);if(a.lengthSq()<.01)a.set(0,0,1);a.normalize();return[a,n.clone().cross(a).normalize()]};
  const bump=noiseTex(256,17,1600);bump.repeat.set(8,8);
  const memM=new T.MeshPhysicalMaterial({color:0xb4232f,roughness:.45,sheen:.7,sheenColor:new T.Color(0xff8a8a),bumpMap:bump,bumpScale:1.4,clearcoat:.25,clearcoatRoughness:.5});
  const mem=new T.Mesh(new T.SphereGeometry(RC,128,80),memM);mem.position.copy(CC);scene.add(mem);
  {const bg=new T.InstancedMesh(rbcGeo(40,24,'disc'),new T.MeshPhysicalMaterial({color:0x8a1420,roughness:.45,sheen:.6,sheenColor:new T.Color(0xff6a6a)}),9);for(let i=0;i<9;i++){const a=i/9*6.283+R()*.4,el=.15+R()*.7;dum.position.set(Math.cos(a)*Math.cos(el)*24,Math.sin(el)*16-2,Math.sin(a)*Math.cos(el)*24);dum.rotation.set(R()*3,R()*3,R()*3);dum.scale.setScalar(.9+R()*.4);dum.updateMatrix();bg.setMatrixAt(i,dum.matrix)}scene.add(bg)}
  const C_RED=new T.Color(0xb4232f),C_GHOST=new T.Color(0xd9a0a4);
  const MOL=(n,seed,sz,c,em)=>{const g=molGeo(n,seed,[1,1,1],sz);return()=>new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.38,envMapIntensity:.85,color:c,emissive:em||0}))};
  const scatter=(n,rad,minD,avoid)=>{const out=[];let g=0;while(out.length<n&&g++<4000){const a=R()*6.283,r=Math.sqrt(R())*rad;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(out.concat(avoid||[]).some(q=>Math.hypot(q[0]-x,q[1]-z)<minD))continue;out.push([x,z])}return out};
  // MAC pore sites first, so other molecules keep clear of them
  const SITES=[[0,0],[2.6,1.4],[-2.4,1.9],[1.2,-2.8],[-2.8,-1.6]];
  // transmembrane proteins present in every cell (band 3, glycophorins)
  const tmM=MOL(6,140,.17,0x9aa0b4);scatter(16,7,1.2,SITES).forEach(([x,z])=>{const s=onS(x,z,.08);const m=tmM();m.position.copy(s.p);m.quaternion.setFromUnitVectors(UP,s.n);m.scale.set(1,1.4,1);scene.add(m)});
  // GPI-anchored proteins: a glycolipid stalk plus the protein
  const gpiM=new T.MeshStandardMaterial({color:0xffe9a8,emissive:0x2a2000,roughness:.4});
  const stalk=(s,h,seed)=>{const r=rng(seed),[a,b]=basis(s.n),pts=[];for(let i=0;i<=6;i++){const u=i/6;pts.push(s.p.clone().addScaledVector(s.n,u*h).addScaledVector(a,Math.sin(u*5+seed)*.06).addScaledVector(b,Math.cos(u*4+seed)*.06))}return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.035,6),gpiM)};
  const anchorM=new T.MeshStandardMaterial({color:0xffd27a,emissive:0x3a2800,roughness:.35});
  const used=SITES.slice();
  const cd55Pos=scatter(9,6.5,1.1,used);used.push(...cd55Pos);const cd59Pos=scatter(11,6.5,1,used);used.push(...cd59Pos);
  const scrM=new T.MeshStandardMaterial({color:0x2ec4c8,roughness:.35,envMapIntensity:.9});
  const CD55=cd55Pos.map(([x,z],i)=>{const s=onS(x,z,0),g=new T.Group();g.add(stalk(s,.5,i*3));const an=new T.Mesh(new T.SphereGeometry(.07,10,8),anchorM);an.position.copy(s.p);g.add(an);
    let p=s.p.clone().addScaledVector(s.n,.55);const d=s.n.clone().add(new V3((R()-.5)*.5,0,(R()-.5)*.5)).normalize();for(let k=0;k<4;k++){const b=new T.Mesh(new T.SphereGeometry(.15,16,12),scrM);b.scale.set(.85,1.25,.85);b.position.copy(p);b.quaternion.setFromUnitVectors(UP,d);g.add(b);p=p.clone().addScaledVector(d,.32)}
    scene.add(g);return{g,top:p,s}});
  const cd59M=MOL(4,150,.15,0x5fe06a);
  const CD59=cd59Pos.map(([x,z],i)=>{const s=onS(x,z,0),g=new T.Group();g.add(stalk(s,.4,i*5+1));const an=new T.Mesh(new T.SphereGeometry(.07,10,8),anchorM);an.position.copy(s.p);g.add(an);const m=cd59M();m.position.copy(s.p).addScaledVector(s.n,.55);g.add(m);scene.add(g);return{g,m,s,home:m.position.clone()}});
  // C3b deposits
  const NC3=40,c3I=new T.InstancedMesh(molGeo(6,160,[1,1,1],.12),new T.MeshStandardMaterial({vertexColors:true,roughness:.38,color:0xff9a2e,emissive:0x2a1000}),NC3);c3I.frustumCulled=false;scene.add(c3I);
  const C3=scatter(NC3,6.2,.5,SITES.concat(SITES.map(([x,z])=>[x+.6,z+.6]),SITES.map(([x,z])=>[x-.6,z-.6]))).map(([x,z])=>{const s=onS(x,z,.2);const near=CD55.reduce((b,c)=>Math.min(b,Math.hypot(c.s.p.x-x,c.s.p.z-z)),99);return{s,from:s.p.clone().addScaledVector(s.n,9).add(new V3((R()-.5)*6,0,(R()-.5)*6)),t0:.2+R()*.2,near,j:R()}});
  // inhibitor dots for the proximal-inhibitor mode
  const inhI=new T.InstancedMesh(new T.SphereGeometry(.09,8,6),new T.MeshStandardMaterial({color:0xffffff,emissive:0x8ae0ff,emissiveIntensity:1.8}),NC3);inhI.frustumCulled=false;scene.add(inhI);
  // MAC: C5b-8 complex and a ring of C9 at each site
  const C5=[MOL(5,170,.2,0xc46a2a),MOL(4,171,.17,0xd4b04a),MOL(4,172,.17,0x8a6ad8),MOL(5,173,.18,0xd85a8a)];
  const NC9=16,c9I=new T.InstancedMesh(new T.CapsuleGeometry(.085,.62,4,10),new T.MeshPhysicalMaterial({color:0xe8e4ff,roughness:.3,clearcoat:.6,envMapIntensity:1}),SITES.length*NC9);c9I.frustumCulled=false;scene.add(c9I);
  const abG=mergeGeos([Object.assign(new T.CapsuleGeometry(.08,.5,4,8).translate(0,-.25,0),{userData:{col:[.85,.88,1]}}),Object.assign(new T.CapsuleGeometry(.08,.45,4,8).rotateZ(.7).translate(-.17,.17,0),{userData:{col:[.75,.8,1]}}),Object.assign(new T.CapsuleGeometry(.08,.45,4,8).rotateZ(-.7).translate(.17,.17,0),{userData:{col:[.75,.8,1]}})]);
  const abM=new T.MeshStandardMaterial({vertexColors:true,roughness:.3,envMapIntensity:1});
  const MAC=SITES.map(([x,z],k)=>{const s=onS(x,z,0),[a,b]=basis(s.n),g=new T.Group();const parts=C5.map((f,i)=>{const m=f();m.position.set((i%2-.5)*.32,(i>>1)*.3,0);g.add(m);return m});scene.add(g);
    const ab=new T.Mesh(abG,abM);ab.scale.setScalar(1.6);scene.add(ab);
    const from=s.p.clone().addScaledVector(s.n,8).add(new V3((R()-.5)*5,0,(R()-.5)*5));return{s,a,b,g,ab,from,t0:.45+k*.035,cd59:CD59.reduce((best,c)=>c.s.p.distanceTo(s.p)<best.s.p.distanceTo(s.p)?c:best,CD59[0])}});
  // haemoglobin escaping through pores
  const NHB=SITES.length*36,hbI=new T.InstancedMesh(new T.SphereGeometry(.12,12,9),new T.MeshStandardMaterial({color:0xff3040,emissive:0xc0101c,emissiveIntensity:1.4,roughness:.3}),NHB);hbI.frustumCulled=false;scene.add(hbI);
  const HB=[];for(let i=0;i<NHB;i++)HB.push({k:i%SITES.length,ph:R(),dx:(R()-.5)*1.6,dz:(R()-.5)*1.6});
  let mode='normal';
  const MD={normal:{gpi:1,c3:1,c3stay:0,mac:1,ring:0,ecu:0,inh:0},pnh:{gpi:0,c3:1,c3stay:1,mac:1,ring:1,ecu:0,inh:0},ecu:{gpi:0,c3:1,c3stay:1,mac:0,ring:0,ecu:1,inh:0},prox:{gpi:0,c3:0,c3stay:0,mac:0,ring:0,ecu:0,inh:1}};
  const MODES={normal:{name:'Normal red cell',caps:[
      'A normal red cell carries two complement regulators on glycosylphosphatidylinositol (GPI) anchors: CD55 (decay-accelerating factor, teal) and CD59 (membrane inhibitor of reactive lysis, green). Ordinary transmembrane proteins (grey) do not need the anchor.',
      'The alternative pathway ticks over all the time and drops C3b (orange) on every surface. On a normal cell, CD55 breaks up the C3 convertase, so C3b does not build up.',
      'If C5b-8 does insert, CD59 binds it and stops C9 from polymerising: no pore forms.',
      'The membrane stays intact and the cell survives its normal 120 days.']},
    pnh:{name:'PNH',title:'Paroxysmal nocturnal haemoglobinuria',info:'An acquired, somatic PIGA mutation in a haematopoietic stem cell blocks GPI-anchor synthesis, so all its progeny lack CD55 and CD59. Complement lyses the red cells inside vessels: haemoglobinuria, high LDH, absent haptoglobin, a negative DAT, thrombosis, and often marrow failure. Diagnosis is by flow cytometry (FLAER, CD59 on red cells, CD24/CD14 on neutrophils and monocytes).',caps:[
      'A PNH (type III) red cell: the PIGA mutation means no GPI anchor, so CD55 and CD59 are missing. The transmembrane proteins are still there.',
      'With no CD55, C3b keeps landing and amplifying on the surface.',
      'C5 is cleaved, C5b-8 inserts and 12 to 18 C9 molecules polymerise into a ring: the membrane attack complex (MAC), a pore about 10 nm wide.',
      'Haemoglobin pours out through the pores: intravascular haemolysis, haemoglobinuria and free haemoglobin that mops up nitric oxide (dysphagia, abdominal pain, erectile dysfunction, thrombosis).']},
    ecu:{name:'PNH + eculizumab',title:'C5 inhibition (eculizumab, ravulizumab)',info:'A humanised antibody binds C5 and prevents its cleavage, so no MAC forms: intravascular haemolysis and thrombosis fall dramatically. C3b still coats the PNH cells, so some patients keep extravascular haemolysis in the spleen and liver (DAT positive for C3d). Meningococcal vaccination is essential.',caps:[null,'C3b still builds up on the PNH cell, because C5 inhibitors act downstream.','The antibody (Y shape) grips C5 in plasma, so C5b-8 never reaches the membrane.','No pores and no haemoglobin leak. The C3b-coated cells may still be removed in the spleen: extravascular haemolysis.']},
    prox:{name:'PNH + proximal inhibitor',title:'Proximal complement inhibition',info:'Pegcetacoplan (C3 inhibitor), iptacopan (factor B inhibitor) and danicopan (factor D inhibitor) act at the C3 step. They block both C3b coating and the MAC, so they control intravascular and extravascular haemolysis. Breakthrough haemolysis can occur with infection or missed doses.',caps:[null,'The inhibitor (white dots) blocks the C3 step, so C3b does not settle on the membrane.','With no C3 convertase, C5 is not activated and no MAC forms.','The PNH cell survives despite lacking CD55 and CD59.']}};
  ['ecu','prox'].forEach(k=>MODES[k].caps=MODES[k].caps.map((c,i)=>c||MODES.pnh.caps[i]));
  const VIEWS=[{tx:CD55[0].s.p.clone(),r:7.5,ph:1.05,th:.5},{tx:new V3(0,0,0),r:11,ph:.9,th:.3},{tx:MAC[0].s.p.clone().add(new V3(0,.6,0)),r:6.8,ph:.8,th:.6},{tx:new V3(0,1,0),r:11.5,ph:.85,th:.2}];
  const UI=storyUI(api,{dur:26,stages:[['GPI anchors',0,.2],['C3 attack',.2,.45],['Attack complex',.45,.75],['Outcome',.75,1]],modes:MODES,modeLabel:'Compare',onMode:m=>{mode=m}});
  let lastSt=-1;
  api.labels=[
    {title:'CD55 (DAF)',r:4,pos:()=>MD[mode].gpi?CD55[1].top.clone():null,text:'Decay-accelerating factor: four short consensus repeats on a GPI anchor. It dissociates C3 and C5 convertases. Its absence causes the Cromer-null phenotype and CHAPLE disease.'},
    {title:'CD59 (MIRL)',r:4,pos:()=>MD[mode].gpi?CD59[2].m.position.clone():null,text:'Membrane inhibitor of reactive lysis binds C8 and C9 and blocks MAC assembly. It is the more important regulator: inherited CD59 deficiency alone causes a PNH-like illness.'},
    {title:'GPI anchor',r:3.5,pos:()=>MD[mode].gpi?CD59[0].s.p.clone():null,text:'A glycolipid built in the endoplasmic reticulum; PIGA catalyses the first step. More than 20 proteins use it, including CD14, CD16, CD24, CD48 and the FLAER binding site, which is why flow cytometry can detect PNH clones.'},
    {title:'C3b',r:4,pos:()=>{const c=C3.find(c=>c.vis);return c?c.cur.clone():null},text:'Generated continuously by the alternative pathway. It tags surfaces for macrophages (opsonisation) and forms the C3 and C5 convertases.'},
    {title:'MAC (C5b-9)',r:3.8,pos:()=>MAC[0].vis?MAC[0].s.p.clone().addScaledVector(MAC[0].s.n,.5):null,text:'C5b, C6, C7 and C8 insert into the lipid bilayer and recruit a ring of C9 that punches a pore through the membrane.'},
    {title:'Eculizumab',r:4,pos:()=>mode==='ecu'&&MAC[1].ab.visible?MAC[1].ab.position.clone():null,text:'A humanised monoclonal antibody against C5. Ravulizumab is a longer-acting version given every 8 weeks. Both raise the risk of Neisseria infection.'},
    {title:'Haemoglobin',r:5,pos:()=>MAC[0].hb?MAC[0].s.p.clone().addScaledVector(MAC[0].s.n,1.5):null,text:'Free haemoglobin is filtered into urine (dark morning urine), deposits iron in the kidneys (haemosiderinuria) and scavenges nitric oxide.'},
    {title:'Red cell membrane',r:7,pos:()=>onS(-5,4.5,.1).p,text:'The outer leaflet of the red cell. In PNH the cell looks normal on the film; the defect is only seen with flow cytometry.'}];
  api.labels.forEach(L=>L.kicker='Complement');
  const hide=(I,i)=>{dum.position.set(0,-90,0);dum.scale.setScalar(0);dum.updateMatrix();I.setMatrixAt(i,dum.matrix)};
  return{focus:()=>api.orbit.st.r,fx:p=>{p.range=1.2;p.bloom=.16},tick(dt,now){UI.update(dt);const t=UI.t,M=MD[mode];
    const si=UI.stage();if(si!==lastSt){lastSt=si;if(UI.playing)api.orbit.flyTo(VIEWS[si],1.4)}
    CD55.forEach(c=>c.g.visible=!!M.gpi);CD59.forEach(c=>c.g.visible=!!M.gpi);
    // C3b
    C3.forEach((c,i)=>{c.vis=false;const t0=c.t0;if(t<t0){hide(c3I,i);hide(inhI,i);return}
      const u=ease(seg(t,t0,t0+.08));let p,s=1;
      if(!M.c3){p=c.from.clone().lerp(c.s.p,.72*u);p.y+=Math.sin(now*1.2+i)*.15;dum.position.copy(p).add(new V3(.18,.15,0));dum.scale.setScalar(1);dum.updateMatrix();inhI.setMatrixAt(i,dum.matrix)}
      else{p=c.from.clone().lerp(c.s.p,u);hide(inhI,i);
        if(!M.c3stay){const d=seg(t,t0+.09,t0+.16);p.addScaledVector(c.s.n,d*3);s=1-ease(d)}}
      if(s<=.01){hide(c3I,i);return}
      dum.position.copy(p);dum.quaternion.setFromUnitVectors(UP,c.s.n);dum.rotateY(i);dum.scale.setScalar(s);dum.updateMatrix();c3I.setMatrixAt(i,dum.matrix);c.cur=p;c.vis=u>=1&&s>.9});
    c3I.instanceMatrix.needsUpdate=true;inhI.instanceMatrix.needsUpdate=true;
    // MAC
    let leak=0;
    MAC.forEach((m,k)=>{m.vis=false;m.hb=false;const t0=m.t0;
      // C5 complex travelling to the membrane (or caught by antibody)
      const u=ease(seg(t,t0,t0+.08));
      if(M.ecu){m.g.visible=t>t0-.05;const hold=m.from.clone().lerp(m.s.p,.7*u);hold.y+=Math.sin(now+k)*.2;m.g.position.copy(hold);m.g.rotation.set(now*.3+k,now*.2,0);m.g.scale.setScalar(.8);m.ab.visible=m.g.visible;m.ab.position.copy(hold).add(new V3(0,.55,0));m.ab.rotation.set(Math.PI,now*.3,0)}
      else{m.ab.visible=false;const show=!!M.mac&&t>t0;m.g.visible=show;if(show){const p=m.from.clone().lerp(m.s.p.clone().addScaledVector(m.s.n,.3).addScaledVector(m.a,.75),u);m.g.position.copy(p);m.g.quaternion.setFromUnitVectors(UP,m.s.n);m.g.scale.setScalar(.75);m.vis=u>=1}}
      // CD59 grabs the complex on a normal cell
      if(mode==='normal'){const c=m.cd59,g=ease(seg(t,t0+.08,t0+.13));c.m.position.copy(c.home).lerp(m.s.p.clone().addScaledVector(m.s.n,.75),g*.85)}
      // C9 ring
      const n9=!M.mac?0:M.ring?Math.floor(NC9*ease(seg(t,t0+.09,t0+.24))):(t>t0+.09?1:0);
      for(let j=0;j<NC9;j++){const id=k*NC9+j;if(j>=n9){hide(c9I,id);continue}const a=j/NC9*6.283,rr=M.ring?.62:.5;const base=m.s.p.clone().addScaledVector(m.a,Math.cos(a)*rr).addScaledVector(m.b,Math.sin(a)*rr);const dn=m.s.n.clone().addScaledVector(m.a,Math.cos(a)*.12).addScaledVector(m.b,Math.sin(a)*.12).normalize();dum.position.copy(base).addScaledVector(m.s.n,.12);dum.quaternion.setFromUnitVectors(UP,dn);const fd=M.ring?1:1-seg(t,t0+.16,t0+.22);dum.scale.setScalar(Math.max(.001,fd));dum.updateMatrix();c9I.setMatrixAt(id,dum.matrix)}
      if(M.ring&&t>t0+.24){m.hb=true;leak+=1}});
    c9I.instanceMatrix.needsUpdate=true;
    // haemoglobin streaming out of pores
    HB.forEach((h,i)=>{const m=MAC[h.k];if(!m.hb){hide(hbI,i);return}const st=t-(m.t0+.24);const u=((st*5+h.ph)%1);if(st*5<h.ph){hide(hbI,i);return}const p=m.s.p.clone().addScaledVector(m.s.n,.2+u*4.5).addScaledVector(m.a,h.dx*u*1.6).addScaledVector(m.b,h.dz*u*1.6);dum.position.copy(p);dum.scale.setScalar(1-u*.5);dum.updateMatrix();hbI.setMatrixAt(i,dum.matrix)});hbI.instanceMatrix.needsUpdate=true;
    // the lysing cell pales
    const pale=M.ring?ease(seg(t,.72,.98))*.7:0;memM.color.copy(C_RED).lerp(C_GHOST,pale);memM.sheenColor.setRGB(1,.54+pale*.3,.54+pale*.3)}}}

/* ================= ENDOTHELIUM ================= */
const ENDO={
 full:{dur:98,stages:[['Barrier',0,.11],['Vasodilators',.11,.26],['Anticoagulant surface',.26,.52],['Fibrinolysis',.52,.63],['Injury',.63,.83],['Procoagulant switch',.83,1]],
  acts:{bar:[0,.11],dil:[.11,.26],at:[.26,.33],tfpi:[.33,.4],tm:[.4,.46,.52],apc:[.46,.52],lys:[.52,.63],inj:[.63,.83,1.01],sw:[.83,1,1.01]},injury:true,
  modes:{normal:{name:'Normal',caps:[
   'Healthy endothelium is a smooth, unbroken lining. It hides the collagen beneath it from the blood. Its glycocalyx carries a negative charge, like platelets, so platelets that drift to the wall are pushed away again.',
   'Endothelial cells release prostacyclin (cyan) and nitric oxide (green). In platelets, prostacyclin raises cyclic AMP and nitric oxide raises cyclic GMP, so calcium stays low and the platelets stay at rest. In smooth muscle the same signals relax the vessel. On the surface, the enzyme CD39 (violet) breaks down ADP (orange) and removes a platelet activator.',
   'The surface is also anticoagulant. Heparan sulphate holds antithrombin (blue), which traps thrombin (red). TFPI (teal) captures factor Xa (yellow) and then shuts down tissue factor with factor VIIa. Thrombin that lands on thrombomodulin (violet) changes its job: it activates protein C, and activated protein C (gold) with protein S destroys factors Va and VIIIa.',
   'Endothelium releases tissue plasminogen activator (green). On fibrin it turns plasminogen into plasmin, which cuts the fibres, so stray fibrin is cleared from the healthy wall. Endothelium also makes PAI-1 (orange), which switches tPA off again.',
   'Now the lining is breached and collagen is exposed. Neighbouring cells release endothelin (red) and the smooth muscle contracts to narrow the vessel. Weibel–Palade bodies empty von Willebrand factor (lilac strings) and P-selectin onto the surface. Von Willebrand factor binds the collagen and catches passing platelets, which stick, activate and pile up. Thrombospondin from the same stores helps them spread and aggregate.',
   'Cells under the breach carry tissue factor (magenta), which starts coagulation: thrombin forms and fibrin (cream) binds the plug together. Activated endothelium shows selectins and other adhesion molecules, so a white cell rolls in and stops. Just beyond the injury, intact cells still make prostacyclin, nitric oxide and thrombomodulin, and that keeps the clot from spreading.']}}},
 ac:{dur:48,stages:[['Antithrombin',0,.25],['TFPI',.25,.5],['Thrombomodulin',.5,.75],['Activated protein C',.75,1]],
  acts:{at:[0,.25],tfpi:[.25,.5],tm:[.5,.75,1.01],apc:[.75,1,1.01]},
  modes:{normal:{name:'Normal',caps:[
   'Heparan sulphate on the glycocalyx works like natural heparin. It holds antithrombin (blue) and speeds it up. Antithrombin traps thrombin (red) and factor Xa in a one-to-one complex, which is carried away and cleared.',
   'Tissue factor pathway inhibitor (teal) sits on the endothelial surface. First it binds factor Xa (yellow). The pair then locks onto tissue factor with factor VIIa, shown here on a microparticle, and the first step of coagulation is shut down.',
   'Thrombomodulin (violet) captures thrombin. Bound thrombin can no longer clot fibrinogen or activate platelets. Instead it activates protein C (white), which the endothelial protein C receptor holds beside it. Activated protein C glows gold.',
   'Activated protein C leaves the wall and joins its cofactor, protein S (pink), on a platelet surface. Together they cut factors Va and VIIIa, and thrombin generation slows down.']},
   fvl:{name:'Factor V Leiden',title:'Factor V Leiden',info:'Factor V Leiden (arginine 506 to glutamine) is the commonest inherited thrombophilia in Europeans. Heterozygotes have about 5 times, and homozygotes 50 times or more, the usual risk of venous thrombosis. Screen with the APC resistance test and confirm by DNA analysis.',caps:[null,null,null,
   'Factor V Leiden: activated protein C cannot cut factor Va at its main site, arginine 506. Factor VIIIa is still destroyed, but factor Va survives and thrombin generation goes on for longer.']},
   pcd:{name:'Protein C deficiency',title:'Protein C deficiency',info:'Heterozygous protein C deficiency causes venous thrombosis and warfarin-induced skin necrosis: protein C has a half-life of only about 8 hours, so it falls before the clotting factors do. Homozygous deficiency causes neonatal purpura fulminans.',caps:[null,null,
   'Protein C deficiency: the receptor beside thrombomodulin is empty. Thrombin still binds thrombomodulin, but there is little protein C to activate.',
   'With no activated protein C, factors Va and VIIIa are not switched off, and thrombin generation continues.']}}},
 vwf:{dur:44,stages:[['Stored',0,.15],['Release',.15,.45],['Platelet capture',.45,.7],['ADAMTS13',.7,1]],acts:{},glass:true,
  modes:{normal:{name:'Normal',caps:[
   'Endothelial cells store von Willebrand factor as very large multimers inside rod-shaped Weibel–Palade bodies (lilac), together with P-selectin.',
   'Thrombin, histamine, adrenaline or desmopressin (red signal) make the bodies fuse with the cell membrane. Ultra-large von Willebrand factor strings unroll into the flowing blood but stay anchored to the cell.',
   'Shear stretches the strings and exposes their A1 domains. Platelets bind through glycoprotein Ib and line up like beads on a string.',
   'ADAMTS13 (green) cuts the stretched strings in the A2 domain. The smaller multimers float away, the platelets are released, and the surface is clean again.']},
   ttp:{name:'TTP (no ADAMTS13)',title:'Thrombotic thrombocytopenic purpura',info:'ADAMTS13 activity is below 10%, from an autoantibody (immune TTP) or an inherited deficiency (Upshaw–Schulman syndrome). The result is thrombocytopenia with microangiopathic haemolysis and organ ischaemia. Treat urgently with plasma exchange, steroids, rituximab and caplacizumab.',caps:[null,null,null,
   'In TTP an antibody (white) blocks ADAMTS13, so the ultra-large strings are not cut. Platelets keep piling onto them and form microthrombi that block small vessels and shear passing red cells into fragments.']}}}};
Object.values(ENDO).forEach(P=>{const n=P.modes.normal.caps;Object.keys(P.modes).forEach(k=>{P.modes[k].caps=P.modes[k].caps.map((c,i)=>c||n[i])})});
function buildEndo(api,pk){
  const PR=ENDO[pk],{scene,ren}=api;const BG=0x0d0a12;ren.setClearColor(BG);scene.fog=new T.Fog(BG,22,50);scene.environment=envMap(ren);
  scene.add(new T.HemisphereLight(0xfff0ea,0x24141c,.65));const k1=new T.DirectionalLight(0xfff0e0,2.3);k1.position.set(5,10,8);scene.add(k1);const k2=new T.DirectionalLight(0x8fb0ff,1.2);k2.position.set(-8,3,-6);scene.add(k2);
  const R=rng(211),dum=new T.Object3D(),col=new T.Color(),c2=new T.Color(),OFF=new V3(0,-90,0),dyn=[];
  const inst=(g,m,n,isDyn)=>{const I=new T.InstancedMesh(g,m,n);I.frustumCulled=false;scene.add(I);if(isDyn!==false)dyn.push(I);return I};
  const put=(I,i,p,s,rx,ry,rz)=>{dum.position.copy(p);dum.rotation.set(rx||0,ry||0,rz||0);if(typeof s==='number')dum.scale.setScalar(s);else dum.scale.copy(s);dum.updateMatrix();I.setMatrixAt(i,dum.matrix)};
  const std=(c,em,ei,rough)=>new T.MeshStandardMaterial({color:c,roughness:rough||.35,envMapIntensity:.8,emissive:em||0,emissiveIntensity:ei===undefined?1:ei});
  const mol=(n,seed,sz,c,em,cnt)=>inst(molGeo(n,seed,[1,1,1],sz),new T.MeshStandardMaterial({vertexColors:true,roughness:.35,envMapIntensity:.8,color:c,emissive:em||0}),cnt);
  const dotI=(r,c,em,ei,cnt)=>inst(new T.SphereGeometry(r,10,8),std(c,em,ei),cnt);
  const frac=x=>x-Math.floor(x),v=(x,y,z)=>new V3(x,y,z);
  /* ---- wall: cut-away of endothelium, collagen and smooth muscle ---- */
  const bump=noiseTex(256,9,1400);bump.repeat.set(2,2);
  const CELLS=[];for(let r=0;r<4;r++)for(let c=0;c<9;c++)CELLS.push({p:v((c-4)*3.1+(r%2)*1.55,0,-6+r*2.2),ry:(R()-.5)*.3,sx:1.72+R()*.12,sz:1.22+R()*.1,row:r,used:false,hurt:false});
  const GAP0=v(.6,0,-1.6);let GAP=GAP0.clone();
  if(PR.injury){const h=CELLS.map((c,i)=>[c.p.distanceTo(GAP0),i]).sort((a,b)=>a[0]-b[0]).slice(0,3).map(x=>CELLS[x[1]]);GAP.set(0,0,0);h.forEach(c=>{c.hurt=true;GAP.add(c.p)});GAP.multiplyScalar(1/3)}
  const NEC=CELLS.length;
  const cellM=new T.MeshPhysicalMaterial({color:0xa04c5c,roughness:.55,sheen:.35,sheenColor:new T.Color(0xffc4b4),bumpMap:bump,bumpScale:.6,transparent:!!PR.glass,opacity:PR.glass?.3:1,depthWrite:!PR.glass});
  const cellI=inst(new T.SphereGeometry(1,36,18),cellM,NEC,false),nucI=inst(new T.SphereGeometry(1,20,12),new T.MeshPhysicalMaterial({color:0x7e3a66,roughness:.45,sheen:.5,sheenColor:new T.Color(0xffb0e0)}),NEC,false);
  const top=(c,dx,dz)=>{dx=dx||0;dz=dz||0;return v(c.p.x+dx,.36*Math.sqrt(Math.max(.15,1-dx*dx/(c.sx*c.sx)-dz*dz/(c.sz*c.sz))),c.p.z+dz)};
  const pick=(x,z,reuse)=>{let b=null,bd=1e9;CELLS.forEach(c=>{if(c.hurt||(c.used&&!reuse))return;if(PR.injury&&c.p.distanceTo(GAP)<3.3&&!reuse)return;const d=Math.hypot(c.p.x-x,c.p.z-z);if(d<bd){bd=d;b=c}});b.used=true;return b};
  // glycocalyx
  const HAIR=[];CELLS.forEach((c,ci)=>{for(let k=0;k<11;k++){let dx,dz;do{dx=(R()*2-1)*c.sx;dz=(R()*2-1)*c.sz}while(dx*dx/(c.sx*c.sx)+dz*dz/(c.sz*c.sz)>.72);HAIR.push({c,p:top(c,dx,dz),rx:(R()-.5)*.5,rz:(R()-.5)*.5,h:.8+R()*.5})}});
  const hairI=inst(new T.CylinderGeometry(.016,.022,.34,5).translate(0,.17,0),std(0xa9dcff,0x2a6a9a,.7),HAIR.length,false);
  // subendothelium
  const slab=(w,h,d,x,y,z,c)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshPhysicalMaterial({color:c,roughness:.75}));m.position.set(x,y,z);scene.add(m);return m};
  slab(28.4,.34,11.6,0,-.78,-1.5,0x6e3646);slab(28.4,.5,13.8,0,-1.95,-.4,0x24121c);
  const NCO=PR.injury?98:80,colI=inst(new T.CylinderGeometry(.06,.06,1,7).rotateZ(Math.PI/2),new T.MeshPhysicalMaterial({color:0xe8dcc0,roughness:.55,sheen:.5,sheenColor:new T.Color(0xfff4dc)}),NCO,false);
  for(let i=0;i<NCO;i++){if(PR.glass)put(colI,i,OFF,0);else if(i<80)put(colI,i,v((R()-.5)*26,-.5+(R()-.5)*.14,-7+R()*11),v(3+R()*3,1,1),0,(R()-.5)*1.2,0);else put(colI,i,v(GAP.x+(R()-.5)*2.2,-.46+(R()-.5)*.1,GAP.z+(R()-.5)*2.6),v(2.2+R()*1.6,1.25,1.25),0,(R()-.5)*2.4,0)}
    const MUS=[];for(let i=0;i<27;i++)for(let k=0;k<3;k++)MUS.push({p:v(-13+i*1.0,-1.38,-5.6+k*4.4+(i%2)*2.2-1),j:R()});
  const musI=inst(new T.SphereGeometry(1,16,10),new T.MeshPhysicalMaterial({color:0xffffff,roughness:.55,sheen:.5,sheenColor:new T.Color(0xffb0a0)}),MUS.length,false);
  const C_MUS=new T.Color(0xb0485a),C_RELAX=new T.Color(0x5f8fe8),C_TIGHT=new T.Color(0xff5a2c);
  /* ---- blood ---- */
  const NR=34,rbcI=inst(rbcGeo(28,18,'disc'),new T.MeshPhysicalMaterial({color:0xa30f1c,roughness:.4,sheen:.6,sheenColor:new T.Color(0xff6a6a)}),NR,false);
  const RB=[];for(let i=0;i<NR;i++)RB.push({x0:R()*28,y:3.3+R()*4.6,z:-7+R()*9.5,sp:1.3+R()*.9,ph:R()*6,rot:[R()*3,R()*3,R()*3]});
  const NP=18,pltI=inst(new T.SphereGeometry(1,20,12),new T.MeshPhysicalMaterial({color:0xffffff,roughness:.4,sheen:.5,sheenColor:new T.Color(0xffffff)}),NP,false);
  const PL=[];for(let i=0;i<NP;i++)PL.push({x0:R()*28,y:1.35+R()*1.5,z:-6.4+R()*7.2,sp:.9+R()*.6,ph:R()*6,j:R()});
  const flow=(o,now)=>v(((o.x0+now*o.sp)%28+28)%28-14,o.y+Math.sin(now*.7+o.ph)*.14,o.z);
  const C_PLT=new T.Color(0xc9b8a6),C_CALM=new T.Color(0x7fb4ff),C_ACT=new T.Color(0xffa63a);
  /* ---- actors ---- */
  const front=CELLS.filter(c=>c.row===3&&!c.hurt),srcUp=CELLS.filter((c,i)=>!c.hurt&&c.row<3&&i%2===0);
  const NPG=44,NNO=44,pgI=dotI(.12,0x58e6ff,0x1fb5ff,1.8,NPG),noI=dotI(.085,0xb8ffb0,0x4dff7a,2,NNO);
  const EM=[];for(let i=0;i<NPG;i++){const down=i%3===0,c=down?front[i%front.length]:srcUp[i%srcUp.length];EM.push({c,down,ph:R(),dx:(R()-.5)*1.8,dz:(R()-.5)*1.2,far:c.p.distanceTo(GAP)>6.5})}
  const cd39C=[[-1.5,-3.8],[4.6,-6],[-4.6,-6],[7.7,-3.8]].map(q=>pick(q[0],q[1],true));
  const knobG=mergeGeos([Object.assign(new T.CylinderGeometry(.035,.035,.3,6).translate(0,.15,0),{userData:{col:[.75,.75,.8]}}),Object.assign(new T.SphereGeometry(.13,12,10).translate(0,.36,0),{userData:{col:[1,1,1]}})]);
  const knobM=(c,em)=>new T.MeshStandardMaterial({vertexColors:true,color:c,emissive:em,emissiveIntensity:.6,roughness:.35});
  const cdI=inst(knobG,knobM(0xb884ff,0x5a2ad0),cd39C.length),adpI=dotI(.1,0xffa040,0xff6a00,1.4,12);
  const ADP=[];for(let i=0;i<12;i++)ADP.push({k:i%cd39C.length,ph:R(),o:v((R()-.5)*3,1.6+R()*1.2,(R()-.5)*2)});
  // antithrombin
  const atC=[[-9,-3.8],[-7.5,-1.6],[-6,-3.8],[-9.1,.6]].map(q=>pick(q[0],q[1]));
  const AT=[];atC.forEach(c=>{AT.push(top(c,-.5,.2).add(v(0,.4,0)));AT.push(top(c,.6,-.3).add(v(0,.4,0)))});
  const atI=mol(6,81,.13,0x4a86ff,0x0a1a60,AT.length),thrI=mol(5,82,.14,0xff3b30,0x7a0a08,12),deadI=mol(5,82,.14,0x8d8790,0,8);
  // TFPI
  const tfC=[[-3,.6],[-4.6,-1.6]].map(q=>pick(q[0],q[1]));const TF=tfC.map(c=>top(c,.1,.1).add(v(0,.34,0)));
  const tfpiI=mol(6,83,.12,0x1fd1b4,0x064a40,2),xaI=mol(4,84,.13,0xffd84a,0x6a4a00,2),mpI=inst(new T.SphereGeometry(.3,18,12),std(0xc98a94,0x200408,1,.6),2),tfkI=dotI(.11,0xff3fb4,0xb00a70,1.2,12),ringI=inst(new T.TorusGeometry(.62,.03,8,36),std(0xffffff,0xbfefff,1.6),2);
  // thrombomodulin, EPCR, protein C
  const tmC=[[6.2,-1.6],[7.7,-3.8],[9.3,-1.6],[7.7,.6]].map(q=>pick(q[0],q[1]));
  const TM=tmC.map(c=>top(c,-.25,0)),EP=tmC.map(c=>top(c,.45,.25));
  const tmI=inst(knobG,knobM(0xa56cff,0x4a1ac0),4),epI=inst(knobG,knobM(0xe8c070,0x6a4a10),4),pcI=mol(4,85,.11,0xf4f4f8,0x303038,4),apcI=mol(4,85,.11,0xffc832,0xd08a00,4),psI=mol(4,86,.11,0xff8ac0,0x7a1a48,4);
  const SUBP=v(6.6,3.0,-2),SUB=[v(-.55,-.36,-.3),v(.5,-.36,.35),v(-.1,-.36,.5),v(.3,-.36,-.5)].map(o=>o.add(SUBP));
  const actPltI=inst(new T.SphereGeometry(1,28,16),new T.MeshPhysicalMaterial({color:0xe6973a,roughness:.45,sheen:.5,sheenColor:new T.Color(0xffe0a0)}),1);
  const vaI=dotI(.17,0xc79bff,0x3a1a80,.8,8),v8I=dotI(.17,0x6fe0e8,0x0a4a58,.8,8);
  // fibrinolysis
  const LC=v(-6.5,2.3,-1.6),FB=[];for(let i=0;i<10;i++){const a=v((R()-.5)*4.6,(R()-.5)*1.5,(R()-.5)*3).add(LC),b=v((R()-.5)*4.6,(R()-.5)*1.5,(R()-.5)*3).add(LC);FB.push({a,b,m:a.clone().lerp(b,.5)})}
  const fibM=new T.MeshPhysicalMaterial({color:0xd9c9a8,roughness:.5,sheen:.6,sheenColor:new T.Color(0xfff4dc)});
  const fibI=inst(new T.CylinderGeometry(.06,.06,1,8).translate(0,.5,0),fibM,20+16),tpaI=mol(5,72,.13,0x3fdc84,0x0a5a2a,8),paiI=mol(5,73,.12,0xffa21e,0x6a3a00,6),plmI=dotI(.1,0xff4f9a,0xa0104a,1.6,10);
  const tpaC=[0,1,2,3,4,5].map(i=>pick(LC.x-3+i*1.3,(i%2?-3.8:-1.6),true));
  // injury
  const etI=dotI(.12,0xff3030,0xff0808,1.8,24),ET=[];for(let i=0;i<24;i++){const c=front[(i*2+1)%front.length];ET.push({c,ph:R(),dx:(R()-.5)*1.6})}
  const near=CELLS.filter(c=>!c.hurt).sort((a,b)=>a.p.distanceTo(GAP)-b.p.distanceTo(GAP));
  const pselC=PR.glass?[]:near.slice(0,6),pselI=inst(knobG,knobM(0xffd0e4,0xff5a9a),14);
  const PSEL=[];pselC.forEach(c=>{PSEL.push(top(c,-.4,.3));PSEL.push(top(c,.5,-.3))});
  const NS=6,NSEG=26,strI=inst(new T.SphereGeometry(.085,10,8),std(0xc9a2ff,0x6a35d0,.9),NS*NSEG);
  const ancC=PR.glass?[[-5,-1.6],[-4.6,-3.8],[-3.3,.6]].map(q=>pick(q[0],q[1])):near.filter(c=>c.p.x<GAP.x-.5).slice(0,3);
  const STR=[];for(let s=0;s<NS;s++){const c=ancC[s%ancC.length];STR.push({c,a:top(c,(s<3?.5:-.3),(s<3?-.35:.4)),ph:R()*6,kc:5+(s%3),zs:(R()-.5)*.5})}
  const strP=(s,k,now,g,cut,out)=>{const S=STR[s],u=k/NSEG;out.copy(S.a);out.x+=k*.26;
    if(PR.injury){const d=ease(c01(k/7));out.y=lerp(S.a.y+.06,-.28+(s%3)*.07,d);out.z+=(GAP.z-S.a.z)*d*.75+S.zs*u*3}else{out.y+=.1+1.5*u*(1-.35*u)+.1*Math.sin(now*1.7+k*.45+S.ph)*u*3;out.z+=S.zs*u*3+.14*Math.sin(now*1.3+k*.4+S.ph)*u*3}
    if(cut>0&&k>S.kc){out.x+=cut*7;out.y+=cut*2.2}return out};
  const wpbI=inst(new T.CapsuleGeometry(.1,.5,4,10).rotateZ(Math.PI/2),std(0xb48cff,0x7a3cf0,1.7),PR.glass?26:1);
  const WPB=[];if(PR.glass){CELLS.forEach((c,ci)=>{const anc=ancC.indexOf(c);const n=anc>=0?4:(ci%3===0?2:0);for(let k=0;k<n;k++)WPB.push({c,anc,o:v((R()<.5?-1:1)*(.55+R()*.35)*c.sx*.75,-.02+(R()-.5)*.1,(R()-.5)*c.sz*1.0),ry:R()*3,j:R()})})}
  const adI=mol(5,91,.13,0x3fdc84,0x0a5a2a,NS),igI=mol(3,92,.1,0xf0f0f4,0x404048,NS),sigI=mol(4,82,.12,0xff3b30,0x7a0a08,6);
  // gap contents
  const SITE=[];for(let i=0;i<9;i++)SITE.push(v(GAP.x+(R()-.5)*2.6,-.12+(i>4?.26:0)+R()*.08,GAP.z+(R()-.5)*2.3));
  const TFK=[];for(let i=0;i<8;i++)TFK.push(v(GAP.x+(R()-.5)*2.8,-.36,GAP.z+(R()-.5)*2.5));
  const F2=[];for(let i=0;i<16;i++){const a=v(GAP.x+(R()-.5)*3.4,-.3+R()*.3,GAP.z+(R()-.5)*3),b=v(GAP.x+(R()-.5)*3.4,.25+R()*.8,GAP.z+(R()-.5)*3);F2.push({a,b})}
  const thpI=dotI(.09,0xff4a3a,0xff1a10,1.8,16),THP=[];for(let i=0;i<16;i++)THP.push({ph:R(),d:v((R()-.5)*2.6,1.4+R()*1.4,(R()-.5)*2.4)});
  const wbcI=inst(new T.SphereGeometry(.72,32,20),new T.MeshPhysicalMaterial({color:0xf2ead8,roughness:.6,sheen:.6,sheenColor:new T.Color(0xffffff),bumpMap:bump,bumpScale:1.2}),1);
  /* ---- story ---- */
  let mode='normal';
  const UI=storyUI(api,{dur:PR.dur,stages:PR.stages,modes:PR.modes,modeLabel:'Compare',onMode:m=>{mode=m}});
  const VIEWS={full:[[0,{tx:v(0,.8,-.5),r:21,ph:1.12,th:.3}],[.11,{tx:v(0,.4,1),r:15,ph:1.2,th:.15}],[.26,{tx:v(-7.6,.9,-2),r:9.5,ph:1.18,th:.3}],[.33,{tx:v(-3.8,.8,-.5),r:7.5,ph:1.2,th:.25}],[.4,{tx:v(7.7,.7,-1.6),r:8.5,ph:1.15,th:.2}],[.46,{tx:v(7.2,1.7,-1.8),r:9.5,ph:1.3,th:.35}],[.52,{tx:v(-6.5,1.3,-1.6),r:9.5,ph:1.2,th:.35}],[.63,{tx:v(GAP.x,-.2,GAP.z+1.6),r:14,ph:1.08,th:.2}],[.83,{tx:v(GAP.x-1,.4,GAP.z),r:14,ph:1.12,th:-.25}]],
    ac:[[0,{tx:v(-7.8,.9,-2.2),r:8.5,ph:1.2,th:.3}],[.25,{tx:v(-3.8,.8,-.5),r:6.5,ph:1.2,th:.25}],[.5,{tx:v(7.7,.7,-1.6),r:8,ph:1.15,th:.2}],[.75,{tx:v(7.2,1.7,-1.8),r:9,ph:1.3,th:.35}]],
    vwf:[[0,{tx:v(-4,.2,-1.6),r:8.5,ph:1.0,th:.3}],[.15,{tx:v(-2.5,.9,-1.6),r:11,ph:1.2,th:.25}],[.45,{tx:v(-1,1.2,-1.6),r:11.5,ph:1.25,th:.15}],[.7,{tx:v(0,1.3,-1.6),r:13.5,ph:1.2,th:.2}]]}[pk];
  const cur={};const L=(title,key,r,text)=>({title,r,pos:()=>cur[key]?cur[key].clone():null,text});
  const LBL={
    cell:L('Endothelial cell','cell',7,'One flat layer of cells lines every blood vessel. At rest it is antiplatelet, anticoagulant and profibrinolytic. When injured or inflamed it switches to the opposite.'),
    gly:L('Glycocalyx','gly',5,'A negatively charged coat of proteoglycans rich in heparan sulphate. It repels platelets and holds antithrombin and TFPI on the surface.'),
    col:L('Subendothelial collagen','col',7,'Hidden by intact endothelium. Once exposed it binds von Willebrand factor and activates platelets through GPVI and α2β1, and it activates the contact system.'),
    mus:L('Smooth muscle','mus',8,'Relaxes with nitric oxide and prostacyclin. Contracts with endothelin, with thromboxane A2 and serotonin from platelets, and by a nerve reflex after injury.'),
    plt:L('Platelet','plt',5,'Resting platelets circulate as discs close to the wall. Prostacyclin and nitric oxide keep them quiet.'),
    pg:L('Prostacyclin (PGI2)','pg',5,'Made from arachidonic acid by endothelial cyclo-oxygenase. Acts on the platelet IP receptor to raise cyclic AMP. Half-life is a few minutes.'),
    no:L('Nitric oxide','no',5,'Made from arginine by endothelial nitric oxide synthase. Raises cyclic GMP in platelets and smooth muscle. Half-life is 3 to 5 seconds.'),
    cd:L('CD39 (ecto-ADPase)','cd',4.5,'A surface enzyme that breaks ATP and ADP down to AMP, so ADP released by platelets cannot recruit more platelets.'),
    at:L('Antithrombin on heparan sulphate','at',4.5,'A serpin that inhibits thrombin and factors Xa, IXa, XIa and XIIa. Heparan sulphate, like heparin, speeds it up about a thousand times.'),
    thr:L('Thrombin','thr',4.5,'The central enzyme of coagulation. On intact endothelium it is trapped by antithrombin or captured by thrombomodulin.'),
    tfpi:L('TFPI','tfpi',4.5,'Tissue factor pathway inhibitor. It binds factor Xa, and the pair then inhibits the tissue factor–VIIa complex. Heparin releases it from the endothelial surface.'),
    tm:L('Thrombomodulin','tm',4.5,'An endothelial receptor for thrombin. The complex activates protein C, and also TAFI. It is lost from the surface in sepsis and inflammation.'),
    epcr:L('EPCR and protein C','epcr',4.5,'The endothelial protein C receptor presents protein C to the thrombin–thrombomodulin complex and speeds its activation about twenty times.'),
    apc:L('Activated protein C','apc',4.5,'A vitamin K dependent serine protease. With protein S it inactivates factors Va and VIIIa on phospholipid surfaces.'),
    sub:L('Factors Va and VIIIa','sub',5,'The cofactors of prothrombinase and tenase. Cutting them is how the protein C system slows thrombin generation.'),
    tpa:L('tPA','tpa',4.5,'Tissue plasminogen activator, released by endothelium in response to thrombin, venous occlusion, exercise and desmopressin.'),
    pai:L('PAI-1','pai',4.5,'Plasminogen activator inhibitor 1, from endothelium and platelets. It rises in inflammation and makes the surface antifibrinolytic.'),
    fib:L('Fibrin','fib',5.5,'Fibrin is both the product of coagulation and the surface on which tPA activates plasminogen.'),
    et:L('Endothelin','et',6,'A 21 amino acid peptide and the most potent vasoconstrictor known. It also promotes platelet aggregation and attracts leucocytes.'),
    vwf:L('Von Willebrand factor','vwf',5.5,'Released from Weibel–Palade bodies as ultra-large multimers. It bridges collagen to platelet GP Ib, and it carries factor VIII in plasma.'),
    psel:L('P-selectin','psel',4.5,'Stored in Weibel–Palade bodies and platelet α granules. On the surface it makes leucocytes and platelets roll and stick.'),
    plug:L('Platelet plug','plug',5.5,'Platelets adhere through von Willebrand factor and collagen, activate, release ADP and thromboxane A2, and aggregate through fibrinogen and αIIbβ3.'),
    tf:L('Tissue factor','tf',5,'Constitutive on cells beneath the endothelium, and induced on endothelium and monocytes by endotoxin, interleukin 1 and TNF. With factor VIIa it starts coagulation.'),
    wbc:L('Leucocyte','wbc',5,'Selectins make it roll, and then ICAM-1 and VCAM-1 hold it firmly. This is how haemostasis and inflammation are linked.'),
    wpb:L('Weibel–Palade body','wpb',4.5,'A rod-shaped storage granule unique to endothelium. It holds von Willebrand factor, P-selectin, thrombospondin, interleukin 8 and endothelin.'),
    ad:L('ADAMTS13','ad',4.5,'A plasma metalloprotease made by hepatic stellate cells. It cuts von Willebrand factor between tyrosine 1605 and methionine 1606 in the A2 domain when shear unfolds it.')};
  api.labels={full:['cell','gly','col','mus','plt','pg','no','cd','at','thr','tfpi','tm','apc','tpa','pai','fib','et','vwf','psel','plug','tf','wbc'],ac:['cell','gly','at','thr','tfpi','tm','epcr','apc','sub'],vwf:['cell','wpb','vwf','plt','psel','ad']}[pk].map(k=>LBL[k]);
  api.labels.forEach(l=>l.kicker='Endothelium');
  const q=new T.Quaternion(),dir=new V3(),tp=new V3();
  const fibre=(i,a,b,g)=>{dir.subVectors(b,a);const Ln=dir.length();dir.normalize();q.setFromUnitVectors(UP,dir);dum.position.copy(a);dum.quaternion.copy(q);dum.scale.set(1,Math.max(.001,Ln*g),1);dum.updateMatrix();fibI.setMatrixAt(i,dum.matrix)};
  let lastSt=-1;
  // static instances
  HAIR.forEach((h,i)=>put(hairI,i,h.p,v(1,h.h,1),h.rx,0,h.rz));
  return{focus:()=>api.orbit.st.r,fx:p=>{p.range=1.3;p.bloom=.15},tick(dt,now){UI.update(dt);const t=UI.t;
    let si=0;for(let i=0;i<VIEWS.length;i++)if(t>=VIEWS[i][0]-1e-6)si=i;if(si!==lastSt){if(lastSt>=0||si>0)api.orbit.flyTo(VIEWS[si][1],1.6);lastSt=si}
    const P={},on={};for(const k in PR.acts){const a=PR.acts[k];P[k]=seg(t,a[0],a[1]);on[k]=t>=a[0]&&t<(a[2]||a[1])}
    for(const k in cur)cur[k]=null;
    dyn.forEach(I=>{for(let i=0;i<I.count;i++)put(I,i,OFF,0)});
    const inj=on.inj?P.inj:0,sw=on.sw?P.sw:0,relax=on.dil?ease(seg(P.dil,.15,.6)):0,tight=inj?ease(seg(inj,.12,.45)):0;
    // wall
    const gone=inj?ease(seg(inj,0,.14)):0;
    CELLS.forEach((c,i)=>{const s=c.hurt?1-gone:1;tp.copy(c.p);if(c.hurt)tp.y-=gone*.4;put(cellI,i,tp,v(c.sx*s,.36*s,c.sz*s),0,c.ry,0);tp.y+=.2;put(nucI,i,tp,v(.6*s,.24*s,.44*s),0,c.ry,0)});
    if(PR.injury)HAIR.forEach((h,i)=>{if(h.c.hurt)put(hairI,i,h.p,v(1,h.h*(1-gone),1),h.rx,0,h.rz)});
    MUS.forEach((m,i)=>{const pulse=1+.02*Math.sin(now*1.2+m.j*6);put(musI,i,m.p,v(.42*(1-.07*relax+.2*tight)*pulse,.3*(1-.07*relax+.2*tight),2.1*(1+.1*relax-.2*tight)),0,0,0);col.copy(C_MUS).lerp(C_RELAX,relax*.75).lerp(C_TIGHT,tight*.6);musI.setColorAt(i,col)});
    cur.cell=top(CELLS[8]);cur.gly=HAIR[40].p.clone().add(v(0,.3,0));cur.col=v(-9,-.45,3.6);cur.mus=v(6,-1.2,5.6);
    // red cells
    RB.forEach((b,i)=>{put(rbcI,i,flow(b,now),.2,b.rot[0]+now*.3,b.rot[1],b.rot[2]+now*.2)});
    // strings (needed by platelets)
    let g=0,cut=0,capU=0;
    if(pk==='vwf'){g=ease(seg(t,.3,.47));capU=seg(t,.45,.7);cut=mode==='ttp'?0:ease(seg(t,.8,.97))}else if(inj)g=ease(seg(inj,.22,.5));
    const fadeS=cut?1-seg(cut,.75,1):1;
    if(g>0)for(let s=0;s<NS;s++)for(let k=0;k<NSEG;k++){if(k>=g*NSEG)break;strP(s,k,now,g,cut,tp);const far=cut>0&&k>STR[s].kc;put(strI,s*NSEG+k,tp,v(1.75,1,1).multiplyScalar(far?fadeS:1),0,0,.25)}
    if(g>.3)cur.vwf=strP(1,Math.min(8,Math.floor(g*NSEG)-1),now,g,0,v(0,0,0)).clone();
    // platelets
    const calm=on.dil?ease(seg(P.dil,.3,.7)):0;let plugN=0;
    PL.forEach((o,j)=>{const p=flow(o,now);let sc=1,act=0,rz=Math.sin(now*.5+o.ph)*.5,rx=Math.cos(now*.4+o.ph)*.4;
      if(on.bar&&j<5){const d=Math.pow(Math.sin(Math.PI*seg(P.bar,.08+.14*j,.5+.14*j)),.7);p.y=lerp(p.y,.82,d);p.z=lerp(p.z,-1.6+(j-2)*1.2,d)}
      if(inj&&j>=5&&j<14){const k=j-5,u=ease(seg(inj,.42+.05*k,.68+.05*k));if(u>0){p.lerp(SITE[k],u);act=u;sc=1+.3*u;rz*=1-u;rx*=1-u;if(u>.9)plugN++}}
      if(pk==='vwf'&&capU>0){const nA=mode==='ttp'?NP:12;if(j<nA){const s=j%NS,k=Math.min(NSEG-2,3+((j*5)%(NSEG-6))),late=j>=12?seg(t,.72+.02*(j-12),.9+.02*(j-12)):1,u=ease(seg(capU,.08+.06*j,.4+.06*j))*ease(late);
        if(u>0){strP(s,k,now,g,cut,tp);tp.y+=.16;const rel=cut>0&&k>STR[s].kc?ease(seg(cut,.45,1)):0;p.lerp(tp,u*(1-rel));act=u*.5*(1-rel);rz*=1-u;rx*=1-u}}}
      put(pltI,j,p,v(.3*sc,.11*sc,.3*sc),rx,0,rz);col.copy(C_PLT).lerp(C_CALM,calm*.8).lerp(C_ACT,act);pltI.setColorAt(j,col)});
    cur.plt=flow(PL[15],now);if(plugN>2)cur.plug=SITE[6].clone().add(v(0,.3,0));
    // prostacyclin, nitric oxide, CD39
    const dilA=on.dil?ease(seg(P.dil,0,.12)):0,limit=sw?ease(seg(sw,.5,.7)):0;
    if(dilA>0||limit>0)EM.forEach((e,i)=>{const a=Math.max(dilA,e.far&&!e.down?limit:0);if(a<=0)return;const st0=top(e.c,e.dx*.3,e.down?1:e.dz*.3);
      let l=frac(now*.16+e.ph);const end=e.down?v(e.c.p.x+e.dx,-1.15,4.9+e.dz):v(e.c.p.x+e.dx*1.6,2.9+e.dz,e.c.p.z+e.dz*1.4);
      tp.copy(st0).lerp(end,l);if(e.down)tp.y+=Math.sin(l*Math.PI)*.9;put(pgI,i,tp,Math.sin(l*Math.PI)*a*1.2);if(i===4)cur.pg=tp.clone();
      l=frac(now*.3+e.ph*1.7+.4);tp.copy(st0).lerp(end,l*.7);tp.x+=Math.sin(now*3+i)*.12;if(e.down)tp.y+=Math.sin(l*.7*Math.PI)*.9;put(noI,i,tp,Math.sin(l*Math.PI)*a*1.2);if(i===7)cur.no=tp.clone()});
    if(dilA>0){cd39C.forEach((c,i)=>{put(cdI,i,top(c,.2,.2).add(v(0,-.03,0)),dilA)});cur.cd=top(cd39C[0],.2,.2).add(v(0,.36,0));
      ADP.forEach((a,i)=>{const kp=top(cd39C[a.k],.2,.2).add(v(0,.36,0)),l=frac(now*.14+a.ph);tp.copy(kp).add(a.o).lerp(kp,ease(l));put(adpI,i,tp,dilA*(1-seg(l,.85,1))*Math.min(1,l*8))})}
    // antithrombin
    if(on.at){const u=P.at,a=ease(seg(u,0,.08));AT.forEach((p,i)=>{const k=i/2,bound=i%2===0&&k<4;let pp=p.clone();
        if(bound){const ua=ease(seg(u,.08+.13*k,.4+.13*k)),ud=ease(seg(u,.6+.09*k,1));const from=p.clone().add(v(-5-k,4.2+k*.6,2));const th=from.lerp(p.clone().add(v(.24,.1,0)),ua);
          const drift=v(ud*6,ud*3,0);pp.add(drift);th.add(drift);const fs=1-seg(ud,.75,1);
          if(ua<1)put(thrI,k,th.add(v(Math.sin(now*2+k)*.06,Math.cos(now*1.7+k)*.06,0)),1,now*.5+k,k);else put(deadI,k,th,fs*(1+.08*Math.sin(now*6+k)),k,k);
          if(k===1)cur.thr=th.clone();put(atI,i,pp,a*fs,i,now*.2+i)}
        else put(atI,i,pp.add(v(0,Math.sin(now*1.5+i)*.03,0)),a,i,now*.2+i)});cur.at=AT[1].clone()}
    // TFPI
    if(on.tfpi){const u=P.tfpi,a=ease(seg(u,0,.08));TF.forEach((p,k)=>{put(tfpiI,k,p,a,k,now*.2);const ua=ease(seg(u,.06+.1*k,.36+.1*k)),ub=ease(seg(u,.42+.1*k,.74+.1*k));
        tp.copy(p).add(v(-4.5,3.6+k,1.5)).lerp(v(p.x+.26,p.y+.12,p.z),ua);put(xaI,k,tp,1,now*.4*(1-ua),k);
        if(ub>0){const m=v(p.x-6,p.y+3,p.z+1.2).lerp(v(p.x-.5,p.y+.22,p.z+.08),ub);put(mpI,k,m,1);put(tfkI,k,m.clone().add(v(.24,.16,0)),1);put(tfkI,k+2,m.clone().add(v(.1,-.2,.2)),.8)}
        const lk=ease(seg(u,.78+.08*k,.9+.08*k));if(lk>0)put(ringI,k,v(p.x-.1,p.y+.12,p.z),lk*(1+.05*Math.sin(now*5)),Math.PI/2+.3,now*.6,0)});cur.tfpi=TF[0].clone()}
    // thrombomodulin and protein C
    const tmOn=on.tm||on.apc;
    if(tmOn){const u=on.apc?Math.max(P.tm,1):P.tm,a=ease(seg(u,0,.08)),ul=on.apc?P.apc:0;
      TM.forEach((p,k)=>{put(tmI,k,p.clone().add(v(0,-.03,0)),v(1.25,1.5,1.25).multiplyScalar(a));put(epI,k,EP[k].clone().add(v(0,-.03,0)),a);
        const ua=ease(seg(u,.06+.1*k,.4+.1*k));tp.copy(p).add(v(-4-k,4,2)).lerp(v(p.x,p.y+.74,p.z),ua);put(thrI,4+k,tp,1,ua<1?now*.5+k:k,k);if(k===0&&!on.at)cur.thr=tp.clone();
        if(mode==='pcd')return;const uc=ease(seg(u,.52+.09*k,.68+.09*k)),home=v(EP[k].x,EP[k].y+.5,EP[k].z);
        if(uc<1)put(pcI,k,home,a*(1-uc),k,now*.2);
        if(uc>0){const lv=ease(seg(ul,.04+.08*k,.42+.08*k)),tgt=SUB[k].clone().add(v(0,-.3,0));const stuck=mode==='fvl'&&k<2;const back=stuck?ease(seg(ul,.5+.08*k,.8+.08*k)):0;
          tp.copy(home).lerp(tgt,lv*(1-.45*back));tp.y+=Math.sin(lv*Math.PI)*.5;put(apcI,k,tp,uc*(1+.14*Math.sin(now*7+k)),now*.4,k);if(k===0)cur.apc=tp.clone();
          if(lv>.5)put(psI,k,v(tp.x+.24,tp.y+.05,tp.z+.1),ease(seg(lv,.5,.8)),k,now*.3)}});
      cur.tm=v(TM[0].x,TM[0].y+.5,TM[0].z);cur.epcr=v(EP[1].x,EP[1].y+.45,EP[1].z);
      if(on.apc){const ap=ease(seg(ul,0,.1));put(actPltI,0,SUBP,v(1.25*ap,.3*ap,1.1*ap),0,0,.05);
        SUB.forEach((p,k)=>{const I=k<2?vaI:v8I,survive=mode==='pcd'||(mode==='fvl'&&k<2);const us=survive?0:ease(seg(ul,.44+.08*k,.6+.08*k)),fs=survive?1:1-seg(ul,.72+.06*k,.95);
          const w=survive?1+.1*Math.sin(now*5+k):1;put(I,k*2,v(p.x-.15-us*.7,p.y-us*.5,p.z),ap*fs*w);put(I,k*2+1,v(p.x+.15+us*.7,p.y-us*.25,p.z+us*.3),ap*fs*w)});cur.sub=SUB[0].clone()}
      if(pk!=='ac'&&!on.apc){/* resting pose only */}}
    // fibrinolysis
    if(on.lys){const u=P.lys,a=ease(seg(u,0,.08));FB.forEach((f,i)=>{const tc=.44+.045*i,rec=ease(seg(u,tc,tc+.1)),fs=1-seg(u,tc+.12,tc+.3);fibre(i*2,f.a,f.m,a*(1-.8*rec)*(fs>0?1:0));fibre(i*2+1,f.b,f.m,a*(1-.8*rec)*(fs>0?1:0));
        if(u>tc-.08&&u<tc+.08)put(plmI,i,f.m,1+.3*Math.sin(now*10+i))});
      tpaC.forEach((c,k)=>{const f=FB[k],ua=ease(seg(u,.05+.05*k,.36+.05*k)),tl=.74+.035*k,ul=ease(seg(u,tl,tl+.12));tp.copy(top(c)).lerp(f.m.clone().add(v(.15,.15,0)),ua);if(ul>=1)tp.add(v((u-tl-.12)*14,(u-tl-.12)*8,0));
        put(tpaI,k,tp,1,now*.4+k,k);if(k===2)cur.tpa=tp.clone();if(k<5&&u>tl){const pa=top(tpaC[(k+2)%6]).lerp(tp.clone().add(v(.26,.05,0)),ul);if(ul>=1)pa.copy(tp).add(v(.26,.05,0));put(paiI,k,pa,1,now*.5,k);if(k===1)cur.pai=pa.clone()}});
      if(u<.6)cur.fib=FB[3].m.clone()}
    // injury
    if(inj>0){const ea=ease(seg(inj,.08,.2))*(1-.6*sw);ET.forEach((e,i)=>{const l=frac(now*.17+e.ph);tp.copy(top(e.c,e.dx*.3,1)).lerp(v(e.c.p.x+e.dx,-1.15,4.6+e.ph*1.6),l);tp.y+=Math.sin(l*Math.PI)*.8;put(etI,i,tp,Math.sin(l*Math.PI)*ea*1.2);if(i===3&&ea>.3)cur.et=tp.clone()});
      const pa=ease(seg(inj,.2,.36));PSEL.forEach((p,i)=>put(pselI,i,p.clone().add(v(0,-.03,0)),pa));if(pa>.5)cur.psel=PSEL[2].clone().add(v(0,.36,0))}
    if(sw>0){const a=ease(seg(sw,0,.14));TFK.forEach((p,i)=>put(tfkI,4+i,p,a*1.5*(1+.12*Math.sin(now*4+i))));cur.tf=TFK[1].clone();
      const ta=ease(seg(sw,.12,.25));THP.forEach((h,i)=>{const l=frac(now*.22+h.ph);tp.copy(GAP).add(v(h.d.x*.4,-.2,h.d.z*.4)).lerp(v(GAP.x+h.d.x,h.d.y,GAP.z+h.d.z),l);put(thpI,i,tp,Math.sin(l*Math.PI)*ta*1.3)});
      F2.forEach((f,i)=>{const gg=ease(seg(sw,.28+.03*i,.5+.03*i));if(gg>0)fibre(20+i,f.a,f.b,gg)});if(sw>.6)cur.fib=F2[2].b.clone();
      const wu=ease(seg(sw,.18,.8)),x=lerp(-14,GAP.x-4.4,wu),zz=PSEL.length?PSEL[2].z:GAP.z;put(wbcI,0,v(x,.36+.66,zz),v(1,1-.12*seg(sw,.8,1),1),0,0,-x/.72);cur.wbc=v(x,1.6,zz)}
    // Weibel-Palade bodies and ADAMTS13 (close-up scene)
    if(pk==='vwf'){const rel=seg(t,.15,.45);WPB.forEach((w,i)=>{if(i>=wpbI.count)return;tp.copy(w.c.p).add(w.o);let s=1,ry=w.ry+Math.sin(now*.6+w.j*6)*.15;
        if(w.anc>=0){const ur=ease(seg(rel,.18+.05*(i%4),.5+.05*(i%4)));const S=STR[(w.anc+(i%2)*3)%NS];tp.lerp(v(S.a.x,S.a.y-.04,S.a.z),ur);s=1-ease(seg(rel,.5+.05*(i%4),.75+.05*(i%4)))}
        put(wpbI,i,tp,s,0,ry,0)});{const w=t<.4?WPB.find(w=>w.anc>=0):(WPB.find(w=>w.anc<0&&Math.abs(w.c.p.x)<4&&w.c.row>1)||WPB[0]);cur.wpb=w.c.p.clone().add(w.o)}
      const sg=seg(t,.15,.34);if(sg>0&&sg<1)ancC.forEach((c,i)=>{for(let k=0;k<2;k++){const ua=ease(seg(sg,.05+.1*k,.6+.1*k));tp.copy(top(c)).add(v(-5,4+k,2-i)).lerp(top(c,(k-.5)*.8,.2).add(v(0,.18,0)),ua);put(sigI,i*2+k,tp,1-seg(sg,.85,1),now*.5,k)}});
      const pa=ease(seg(t,.32,.45));PSEL.length||ancC.forEach((c,i)=>{put(pselI,i*2,top(c,-.7,.5).add(v(0,-.03,0)),pa);put(pselI,i*2+1,top(c,.2,.7).add(v(0,-.03,0)),pa)});if(pa>.5)cur.psel=top(ancC[0],-.7,.5).add(v(0,.36,0));
      const ua0=seg(t,.7,.85);if(ua0>0)for(let s=0;s<NS;s++){const ua=ease(seg(ua0,.05+.1*s,.6+.1*s));strP(s,STR[s].kc,now,g,0,tp);const tgt=tp.clone().add(v(0,.22,0));const from=tgt.clone().add(v(-6,4+s*.4,2));
        const stop=mode==='ttp'?.62:1;from.lerp(tgt,ua*stop);const fs=cut?1-seg(cut,.6,1):1;if(mode==='ttp')from.y+=Math.sin(now*2+s)*.08;put(adI,s,from,fs,now*.3+s,s);if(s===1)cur.ad=from.clone();
        if(mode==='ttp')put(igI,s,from.clone().add(v(.2,.16,.05)),1,s,now*.2)}}
    [cellI,nucI,hairI,musI,rbcI,pltI].concat(dyn).forEach(I=>{I.instanceMatrix.needsUpdate=true;if(I.instanceColor)I.instanceColor.needsUpdate=true})}}}
const SCENES={
  endo:{aria:'3D model of the roles of endothelium in haemostasis',build:a=>buildEndo(a,'full'),labels:true,cam:{target:new V3(0,.8,-.5),r:21,th:.3,ph:1.12,phMin:.15,phMax:1.5,rMin:3,rMax:34}},
  endoac:{aria:'3D model of the natural anticoagulants on endothelium',build:a=>buildEndo(a,'ac'),labels:true,cam:{target:new V3(-7.8,.9,-2.2),r:8.5,th:.3,ph:1.2,phMin:.15,phMax:1.5,rMin:2.5,rMax:30}},
  endovwf:{aria:'3D model of von Willebrand factor release and ADAMTS13',build:a=>buildEndo(a,'vwf'),labels:true,cam:{target:new V3(-4,.2,-1.6),r:8.5,th:.3,ph:1.0,phMin:.15,phMax:1.5,rMin:2.5,rMax:30}},
  pnh:{aria:'3D model of complement attack in PNH',build:buildPnh,labels:true,cam:{target:new V3(0,.6,0),r:12,th:.4,ph:1.05,phMin:.1,phMax:1.45,rMin:2.5,rMax:26}},
  fib:{aria:'3D model of fibrinolysis',build:buildFib,labels:true,cam:{target:new V3(0,0,0),r:14,th:.5,ph:1.2,phMin:.15,phMax:1.6,rMin:3,rMax:28}},
  iron:{aria:'3D model of iron absorption and hepcidin',build:buildIron,labels:true,cam:{target:new V3(0,-.8,0),r:15,th:.45,ph:1.35,phMin:.1,phMax:2.6,rMin:3,rMax:28}},
  coag:{aria:'3D model of the cell-based model of coagulation',build:buildCoag,labels:true,cam:{target:new V3(0,1.4,0),r:19,th:0,ph:1.18,phMin:.2,phMax:1.5,rMin:4,rMax:28}},
  hb:{aria:'3D model of the haemoglobin molecule',build:buildHb,labels:true,cam:{target:new V3(0,0,0),r:9,th:.4,ph:1.2,phMin:.1,phMax:3,rMin:3.5,rMax:24}},
  membrane:{aria:'3D model of the red cell membrane skeleton',build:buildMembrane,labels:true,cam:{target:new V3(0,-.2,0),r:10.5,th:.45,ph:1.95,phMin:.2,phMax:2.95,rMin:3,rMax:20}},
  platelet:{aria:'3D model of platelet adhesion, activation and aggregation',build:buildPlatelet,labels:true,cam:{target:new V3(0,1,0),r:8.2,th:.55,ph:1.2,phMin:.2,phMax:1.25,rMin:3,rMax:16}},
  rbc:{aria:'3D model of red cell shapes',build:buildRBC,labels:false,cam:{target:new V3(0,0,0),r:13.5,th:.55,ph:1.08,phMin:.02,phMax:Math.PI-.02,rMin:6,rMax:28,auto:true}}};
window.Lab3D={mount};
})();
