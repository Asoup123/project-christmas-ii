/* Presentation only: no API calls, hidden-task access, or gameplay state. */
'use strict';
(()=>{
  const button=document.getElementById('effectsToggle');
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let enabled=!reduced?.matches,accessShown=false,overlay=null,overlayTimer=null;
  try{const preference=localStorage.getItem('christmas-agent-effects');if(preference!==null)enabled=preference==='on'&&!reduced?.matches;}catch{}
  const active=()=>enabled&&!reduced?.matches;
  function sync(){
    document.body.classList.toggle('effects-on',active());
    if(button){button.textContent=active()?'特效：開':'特效：關';button.setAttribute('aria-pressed',String(active()));}
    if(!active()){overlay?.remove();overlay=null;clearTimeout(overlayTimer);document.querySelectorAll('.fxEnter').forEach(el=>el.classList.remove('fxEnter'));}
  }
  button?.addEventListener('click',()=>{enabled=!active();try{localStorage.setItem('christmas-agent-effects',enabled?'on':'off');}catch{}sync();});
  reduced?.addEventListener?.('change',sync);
  function reveal(code,caption){
    if(!active())return;
    overlay?.remove();clearTimeout(overlayTimer);
    overlay=document.createElement('div');overlay.className='fxReveal';overlay.setAttribute('aria-hidden','true');
    const title=document.createElement('div');title.className='fxCode';title.textContent=code;
    const text=document.createElement('div');text.className='fxCaption';text.textContent=caption;
    const bar=document.createElement('div');bar.className='fxProgress';overlay.append(title,text,bar);document.body.append(overlay);
    overlayTimer=setTimeout(()=>{overlay?.remove();overlay=null;},1000);
  }
  window.AgentFX={reveal,access(){if(!accessShown){accessShown=true;reveal('ACCESS GRANTED','特務身分確認 · 歡迎進入任務中心');}}};
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
