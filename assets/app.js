/* Seer — One Signal · shared helpers */
(function(){
'use strict';
var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.SEER_RM = RM;
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
/* Number ticker: tween textContent between numeric values */
window.tweenNumber = function(el, from, to, dur, fmt){
  fmt = fmt || function(v){return Math.round(v).toLocaleString('en-US');};
  if(RM || !dur){ el.textContent = fmt(to); return; }
  var t0 = performance.now();
  function frame(now){
    var p = Math.min(1,(now-t0)/dur);
    el.textContent = fmt(from + (to-from)*ease(p));
    if(p<1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
/* Count-up when scrolled into view */
window.initCounters = function(){
  var els = document.querySelectorAll('[data-count]');
  if(!('IntersectionObserver' in window)){ els.forEach(function(el){ el.textContent = el.dataset.fmt ? window['fmt_'+el.dataset.fmt](+el.dataset.count) : (+el.dataset.count).toLocaleString('en-US'); }); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return; io.unobserve(e.target);
      var el=e.target, target=parseFloat(el.dataset.count), dec=parseInt(el.dataset.dec||'0',10), pre=el.dataset.pre||'', suf=el.dataset.suf||'';
      window.tweenNumber(el,0,target,1200,function(v){ return pre+v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g,',')+suf; });
    });
  },{threshold:.35});
  els.forEach(function(el){ io.observe(el); });
};
/* Mobile nav */
document.addEventListener('DOMContentLoaded',function(){
  var t=document.querySelector('.navtoggle'), n=document.querySelector('.navlinks');
  if(t&&n){ t.addEventListener('click',function(){ var open=n.classList.toggle('open'); t.setAttribute('aria-expanded',String(open)); }); }
  document.querySelectorAll('[data-wallet]').forEach(function(b){ b.addEventListener('click',function(){ toast('Demo only — no wallet connects in this design concept.'); }); });
  /* Desktop-experience note, small screens only, dismissible */
  try{
    if(window.innerWidth<860 && !sessionStorage.getItem('seerDesktopNote')){
      var note=document.createElement('div'); note.className='desktopnote'; note.setAttribute('role','note');
      note.innerHTML='Best experienced on desktop — for the full interactive experience, open this demo on a computer. You can also explore the mobile version.<button type="button" aria-label="Dismiss note">✕</button>';
      note.querySelector('button').addEventListener('click',function(){ note.remove(); try{sessionStorage.setItem('seerDesktopNote','1');}catch(e){} });
      document.body.insertBefore(note, document.body.firstChild);
    }
  }catch(e){}
});
/* Toast */
window.toast=function(msg){ var t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; t.setAttribute('role','status'); document.body.appendChild(t);} t.textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(function(){t.classList.remove('show');},2400); };
/* Sparkline / wave strip on a canvas */
window.drawSpark=function(cv, data, opts){
  opts=opts||{}; var dpr=Math.min(window.devicePixelRatio||1,2);
  var w=cv.clientWidth||300, h=cv.clientHeight||48; cv.width=w*dpr; cv.height=h*dpr;
  var c=cv.getContext('2d'); c.scale(dpr,dpr); c.clearRect(0,0,w,h);
  var min=Math.min.apply(null,data), max=Math.max.apply(null,data); if(max===min){max=min+1;}
  var pad=4; min-= (max-min)*.15; max+= (max-min)*.2;
  function X(i){return pad+i*(w-2*pad)/(data.length-1);} function Y(v){return h-pad-((v-min)/(max-min))*(h-2*pad);}
  if(opts.fill){ c.beginPath(); data.forEach(function(v,i){ i?c.lineTo(X(i),Y(v)):c.moveTo(X(i),Y(v)); }); c.lineTo(X(data.length-1),h); c.lineTo(X(0),h); c.closePath(); c.fillStyle='rgba(125,51,255,.18)'; c.fill(); }
  c.beginPath(); data.forEach(function(v,i){ i?c.lineTo(X(i),Y(v)):c.moveTo(X(i),Y(v)); });
  c.strokeStyle= opts.dashed? '#8E8E99':'#7D33FF'; c.lineWidth=2; if(opts.dashed)c.setLineDash([5,4]); c.stroke(); c.setLineDash([]);
  if(opts.dot){ var lx=X(data.length-1), ly=Y(data[data.length-1]); c.beginPath(); c.arc(lx,ly,3.2,0,7); c.fillStyle='#EFE9FC'; c.fill(); }
};
/* Distribution wave strip (scalar markets): draws a bell-ish probability wave, no donut */
window.drawWave=function(cv, peak){
  var data=[], i, x; for(i=0;i<=40;i++){ x=i/40; data.push(Math.exp(-Math.pow(x-peak,2)/0.012)*100 + Math.exp(-Math.pow(x-peak-.16,2)/0.03)*22); }
  window.drawSpark(cv,data,{fill:true,dot:true});
};
/* Text scramble — single signature use */
window.scramble=function(el){
  var final=el.textContent, chars='ABCDEF0123456789#/', frame=0, total=Math.max(10,final.length*1.4);
  if(RM) return;
  var iv=setInterval(function(){
    frame++; var done=Math.floor(final.length*frame/total), out=final.slice(0,done);
    for(var i=done;i<final.length;i++){ out+= final[i]===' '?' ':chars[Math.floor(Math.random()*chars.length)]; }
    el.textContent=out; if(frame>=total){ el.textContent=final; clearInterval(iv); }
  },34);
};
/* Download text as file */
window.downloadText=function(name, text){
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){URL.revokeObjectURL(a.href); a.remove();},400);
};
/* Duplicate marquee tracks for seamless loop */
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.marquee .track').forEach(function(tr){
    if(RM) return; var kids=Array.prototype.slice.call(tr.children);
    kids.forEach(function(k){ var c=k.cloneNode(true); c.setAttribute('aria-hidden','true'); tr.appendChild(c); });
  });
});
})();
