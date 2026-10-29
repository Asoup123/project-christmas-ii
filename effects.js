/* Presentation only: no API calls, hidden-task access, or gameplay state. */
'use strict';
(()=>{
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let accessShown=false,overlay=null,overlayTimer=null,codeTimer=null;
  // Always on. Only the device's accessibility preference suppresses motion.
  const active=()=>!reduced?.matches;
  function sync(){
    document.body.classList.toggle('effects-on',active());
    if(!active()){overlay?.remove();overlay=null;clearTimeout(overlayTimer);clearTimeout(codeTimer);}
  }
  reduced?.addEventListener?.('change',sync);
  function reveal(code,caption){
    if(!active())return;
    overlay?.remove();clearTimeout(overlayTimer);clearTimeout(codeTimer);
    overlay=document.createElement('div');overlay.className='fxReveal';overlay.setAttribute('aria-hidden','true');
    const title=document.createElement('div');title.className='fxCode';title.textContent='DECRYPTING TRANSMISSION';
    const text=document.createElement('div');text.className='fxCaption';text.textContent=caption;
    const bar=document.createElement('div');bar.className='fxProgress';const seal=document.createElement('div');seal.className='fxSeal';seal.textContent='CLASSIFIED / EYES ONLY';overlay.append(seal,title,text,bar);document.body.append(overlay);
    codeTimer=setTimeout(()=>{if(overlay)title.textContent=code;},650);
    overlayTimer=setTimeout(()=>{overlay?.remove();overlay=null;},1700);
  }
  window.AgentFX={reveal,access(){if(!accessShown){accessShown=true;reveal('ACCESS GRANTED','身分驗證通過 · 安全通道已建立');}}};
  sync();
  // Only watch section containers, never create per-card scroll listeners.
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('fxVisible');observer.unobserve(entry.target);}},{threshold:.06});
    document.querySelectorAll('main .panel,.gallery').forEach(el=>{el.classList.add('fxWatched');observer.observe(el);});
  }
  document.addEventListener('click',event=>{
    if(!active())return;
    const target=event.target.closest('button');if(!target||target.disabled||!event.detail)return;
    const rect=target.getBoundingClientRect(),ripple=document.createElement('span');ripple.className='fxRipple';ripple.setAttribute('aria-hidden','true');ripple.style.left=`${event.clientX-rect.left}px`;ripple.style.top=`${event.clientY-rect.top}px`;target.append(ripple);setTimeout(()=>ripple.remove(),650);
  });
  const terminal=document.getElementById('terminalText');
  // A single short typing effect, not an endless animation loop.
  if(terminal&&active()){
    const text=terminal.textContent;terminal.textContent='';let index=0;
    const type=()=>{if(!active()){terminal.textContent=text;return;}terminal.textContent=text.slice(0,++index);if(index<text.length)setTimeout(type,22);};type();
  }
  const clock=document.getElementById('agentClock');
  if(clock){const formatter=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Taipei'});const update=()=>{if(!document.hidden)clock.textContent=`TAIPEI ${formatter.format(new Date())} / FIELD OPERATIONS`;};update();setInterval(update,60000);document.addEventListener('visibilitychange',update);}
})();
