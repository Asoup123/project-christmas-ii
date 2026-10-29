'use strict';
(()=>{
  const el=id=>document.getElementById(id);
  const scenes=[
    {chapter:'PROLOGUE 01 / ANONYMOUS INVITATION',title:'一封沒有寄件人的邀請',image:'invitation',alt:'深色桌面上，一封帶著雪花封蠟的聖誕邀請函',text:['一封沒有寄件人的聖誕邀請函，悄悄出現在你的收件匣。','裡面只有集合資訊，以及一句話：','「請帶上一份禮物。別讓任何人知道，那是你準備的。」']},
    {chapter:'PROLOGUE 02 / IDENTITY VERIFIED',title:'北極情報局',image:'verification',alt:'神祕辦公室的終端機亮起雪花徽記',text:['當你輸入通行密碼，邀請函上的雪花忽然停住。畫面逐漸暗下，一段加密訊息緩緩浮現。','「身分確認。歡迎加入本次行動，特務。」','訊息末端，一枚雪花徽記亮起。','北極情報局。']},
    {chapter:'PROLOGUE 03 / NEW RENDEZVOUS',title:'新的據點，重新集結',image:'rendezvous',alt:'聖誕夜裡亮著暖光的秘密集合據點',text:['去年，情報局曾以聖誕聚會為掩護，完成一次秘密交接。','今年，新的據點已就緒，召集名單也已重新編組。熟悉的面孔與新加入的特務，將共同參與代號「CHRISTMAS II」的秘密行動。']},
    {chapter:'PROLOGUE 04 / EYES ONLY',title:'第一項指令，現在送達',image:'dossier',alt:'繫著紅緞帶的機密文件與包裝好的聖誕禮物',text:['十二名特務，十二份禮物。','你們將以朋友的身分見面、聊天、交換祝福。沒有人會知道，一份看似普通的聖誕禮物，會把誰帶進什麼樣的任務。','畫面上的雪花再次飄落。','一份標示「僅限本人閱覽」的檔案，出現在你面前。','你的第一項指令，現在送達。']}
  ];
  const INTRO_DURATION=6500, TRANSITION=1400;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const synth=window.speechSynthesis;
  const seen=new Set();
  let currentUser=null,page=-1,showing=false,started=false,manualPause=false,touchHeld=null,paused=false;
  let elapsed=0,last=0,frame=0,cues=[],cueIndex=-1,cueElapsed=0,spokenDone=true,endedAt=0;
  let voice=null,voiceChosen=false,narrationOK=!!(synth&&window.SpeechSynthesisUtterance),sound=true,audioContext=null;
  let speechToken=0,resumeFocus=null,preloaded=false,currentUtterance=null,recoveryAttempted=false,lastTouchAt=0;
  const key=()=>`christmas-prologue-v1:${currentUser}`;
  function hasRead(){if(seen.has(currentUser))return true;try{return localStorage.getItem(key())==='read';}catch{return false;}}
  function preload(){if(preloaded||!window.Image)return;preloaded=true;scenes.forEach(data=>{const image=new window.Image();image.src=`assets/prologue-${data.image}.png`;});}
  function chooseVoice(){
    if(voiceChosen)return;voiceChosen=true;
    const voices=synth?.getVoices()||[];
    // One voice is selected for the entire playback. Never switch at a scene cut.
    voice=voices.find(v=>/^zh[-_]TW$/i.test(v.lang))||voices.find(v=>/^zh[-_]CN$/i.test(v.lang))||voices.find(v=>/^zh/i.test(v.lang))||null;
  }
  function unlockAudio(){
    chooseVoice();
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio&&!audioContext)audioContext=new Audio();audioContext?.resume()?.catch(()=>{});}catch{}
  }
  function flip(){
    if(!sound||paused||!audioContext||audioContext.state!=='running')return;
    try{
      const length=Math.floor(audioContext.sampleRate*.27),buffer=audioContext.createBuffer(1,length,audioContext.sampleRate),samples=buffer.getChannelData(0);
      for(let i=0;i<length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/length,1.7);
      const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain(),t=audioContext.currentTime;
      source.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(1800,t);filter.frequency.exponentialRampToValueAtTime(650,t+.25);filter.Q.value=.65;
      gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.11,t+.025);gain.gain.exponentialRampToValueAtTime(.001,t+.26);
      source.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(t);source.stop(t+.27);
    }catch{}
  }
  function stopSpeech(){speechToken++;currentUtterance=null;try{synth?.cancel();}catch{}}
  function status(){
    const holding=touchHeld!==null;
    el('prologuePlayback').textContent=!started?'等待接通':paused?(holding?'已暫停 · 放開繼續':'已暫停'):'通訊播放中';
    el('prologue').dataset.paused=String(paused);el('prologue').dataset.sound=String(sound);
    el('prologueSound').textContent=sound?'聲音：開':'聲音：關';el('prologueSound').setAttribute('aria-pressed',String(sound));
    el('prologueInteraction').textContent=paused?'畫面與旁白已暫停':'手機按住暫停 · 電腦點畫面暫停';
    el('prologueVoiceNote').textContent=!narrationOK?'此裝置暫無可用旁白，以字幕播放':!sound?'旁白與音效已關閉':'中文旁白 · 固定聲線';
  }
  function syncPause(){
    const value=manualPause||touchHeld!==null||document.hidden||!started;
    if(paused!==value){paused=value;
      try{if(paused){synth?.pause();audioContext?.suspend()?.catch(()=>{});}else{if(sound)audioContext?.resume()?.catch(()=>{});synth?.resume();}}catch{}
    }
    status();
  }
  function speak(text){
    stopSpeech();spokenDone=true;endedAt=cueElapsed;recoveryAttempted=false;
    if(!sound||!narrationOK||!showing||!started)return;
    const token=speechToken;
    try{
      const utterance=new window.SpeechSynthesisUtterance(text);currentUtterance=utterance;
      utterance.lang=voice?.lang||'zh-TW';if(voice)utterance.voice=voice;utterance.rate=.9;utterance.pitch=.92;utterance.volume=.9;
      spokenDone=false;endedAt=null;
      const complete=()=>{if(token!==speechToken)return;spokenDone=true;endedAt=cueElapsed;currentUtterance=null;};
      utterance.onend=complete;
      utterance.onerror=event=>{if(token!==speechToken)return;if(event.error!=='interrupted'&&event.error!=='canceled'){narrationOK=false;status();}complete();};
      synth.speak(utterance);if(paused)synth.pause();
    }catch{narrationOK=false;spokenDone=true;endedAt=cueElapsed;status();}
  }
  function lines(text){
    // Keep complete phrases on screen. Break at punctuation, never reveal characters individually.
    const output=[];
    for(const paragraph of text){
      const clauses=paragraph.match(/[^，。！？；：]+[，。！？；：」』]?|[」』]/gu)||[paragraph];
      let pending='';
      for(const clause of clauses){
        if(pending&&Array.from(pending+clause).length>24){output.push(pending);pending='';}
        pending+=clause;
        while(Array.from(pending).length>28){const chars=Array.from(pending);output.push(chars.slice(0,24).join(''));pending=chars.slice(24).join('');}
        if(/[。！？：][」』]?$/.test(pending)){output.push(pending);pending='';}
      }
      if(pending)output.push(pending);
    }
    return output;
  }
  function cue(index){
    cueIndex=index;cueElapsed=0;
    const nodes=[];
    if(index>0){const previous=document.createElement('p');previous.textContent=cues[index-1];previous.className='subtitlePrevious';nodes.push(previous);}
    const current=document.createElement('p');current.textContent=cues[index];current.className='subtitleCurrent';nodes.push(current);
    el('prologueText').replaceChildren(...nodes);speak(cues[index]);
  }
  function scene(index,focus=false){
    stopSpeech();page=index;elapsed=0;cueElapsed=0;cueIndex=-1;spokenDone=true;endedAt=0;
    const shell=el('prologue');shell.dataset.mode=index<0?'intro':'story';
    el('prologueReady').hidden=true;el('prologueIntro').hidden=index>=0;el('prologueStory').hidden=index<0;
    el('prologuePrev').disabled=index<=0;el('prologueNext').disabled=false;
    el('prologueNext').textContent=index<0?'開始閱覽':index===3?'開啟第一項指令':'下一幕';
    el('prologuePage').textContent=index<0?'PROLOGUE / 序章':`${String(index+1).padStart(2,'0')} / 04`;
    el('prologueProgress').style.width='0%';
    if(index>=0){
      flip();const data=scenes[index],previous=el('prologueImagePrevious'),image=el('prologueImage');
      previous.src=image.getAttribute('src')||`assets/prologue-${data.image}.png`;image.src=`assets/prologue-${data.image}.png`;image.alt=data.alt;
      el('prologueChapter').textContent=data.chapter;el('prologueTitle').textContent=data.title;
      cues=lines(data.text);el('prologueText').replaceChildren();el('prologueAccessibleText').textContent=data.text.join('\n');el('prologueStory').scrollTop=0;
      shell.classList.remove('sceneEntering');void shell.offsetWidth;shell.classList.add('sceneEntering');
      if(focus)el('prologueTitle').focus({preventScroll:true});
    }else{
      shell.classList.remove('introEntering');void shell.offsetWidth;shell.classList.add('introEntering');
      speak('北極情報局。序章，重新集結。');
    }
  }
  function nextScene(){if(page<3)scene(page+1);else finish();}
  function tick(now){
    if(!showing)return;
    const delta=last?Math.min(now-last,100):0;last=now;
    if(started&&!paused){
      elapsed+=delta;cueElapsed+=delta;
      if(page<0){
        // A failed browser voice must never trap the viewer at the opening.
        if(!spokenDone&&elapsed>20000){stopSpeech();spokenDone=true;narrationOK=false;status();}
        el('prologueProgress').style.width=`${Math.min(98,elapsed/INTRO_DURATION*100)}%`;
        if(elapsed>=INTRO_DURATION&&spokenDone)scene(0);
      }else if(cueIndex<0){if(elapsed>=TRANSITION)cue(0);}
      else{
        const text=cues[cueIndex],silent=!sound||!narrationOK;
        const readTime=Math.max(3200,Array.from(text).length*(reduced?200:175));
        // Recover once if an engine silently dropped an utterance after pausing.
        if(!silent&&!spokenDone&&cueElapsed>1800&&!synth.speaking&&!synth.pending&&!recoveryAttempted){
          recoveryAttempted=true;try{synth.resume();if(currentUtterance)synth.speak(currentUtterance);}catch{}
        }
        if(!spokenDone&&cueElapsed>Math.max(16000,text.length*500)){
          stopSpeech();spokenDone=true;endedAt=cueElapsed;narrationOK=false;status();
        }
        const complete=silent?cueElapsed>=readTime:spokenDone&&cueElapsed>=Math.max(2500,(endedAt||0)+1250);
        const fraction=silent?Math.min(1,cueElapsed/readTime):complete?1:Math.min(.9,cueElapsed/readTime);
        el('prologueProgress').style.width=`${(cueIndex+fraction)/cues.length*100}%`;
        if(complete){if(cueIndex<cues.length-1)cue(cueIndex+1);else nextScene();}
      }
    }
    if(showing)frame=requestAnimationFrame(tick);
  }
  function begin(){
    if(started)return;started=true;manualPause=false;touchHeld=null;unlockAudio();syncPause();scene(-1);el('prologueSound').focus({preventScroll:true});
  }
  function open(){
    preload();cancelAnimationFrame(frame);stopSpeech();resumeFocus=document.activeElement;showing=true;started=false;manualPause=false;touchHeld=null;paused=false;last=0;voiceChosen=false;voice=null;narrationOK=!!(synth&&window.SpeechSynthesisUtterance);
    el('prologue').hidden=false;el('operationContent').hidden=true;document.body.classList.add('prologue-playing');
    el('prologue').dataset.mode='ready';el('prologueReady').hidden=false;el('prologueIntro').hidden=true;el('prologueStory').hidden=true;
    el('prologuePrev').disabled=true;el('prologueNext').disabled=true;el('prologuePage').textContent='INCOMING / 機密通訊';el('prologueProgress').style.width='0%';
    syncPause();el('prologueStart').focus({preventScroll:true});frame=requestAnimationFrame(tick);
  }
  function close(){
    showing=false;started=false;touchHeld=null;cancelAnimationFrame(frame);stopSpeech();try{audioContext?.suspend()?.catch(()=>{});}catch{}
    document.body.classList.remove('prologue-playing');el('prologue').hidden=true;el('operationContent').hidden=false;
  }
  function finish(){
    seen.add(currentUser);try{localStorage.setItem(key(),'read');}catch{}close();
    // Story controls never write game state or change gift selections.
    const input=document.querySelector('#giftForm input:not(:disabled)');
    if(input){el('memberTab').click();el('giftForm').scrollIntoView({behavior:'auto',block:'start'});input.focus({preventScroll:true});}
    else if(resumeFocus?.isConnected)resumeFocus.focus({preventScroll:true});
  }
  const controls=target=>!!target.closest('button,a,input,select,textarea');
  el('prologue').addEventListener('pointerdown',event=>{
    if(!started||controls(event.target)||event.pointerType==='mouse'||event.isPrimary===false)return;
    lastTouchAt=Date.now();touchHeld=event.pointerId;try{el('prologue').setPointerCapture(event.pointerId);}catch{}syncPause();
  });
  function release(event){if(event.pointerId!==touchHeld)return;touchHeld=null;syncPause();}
  el('prologue').addEventListener('pointerup',release);el('prologue').addEventListener('pointercancel',release);el('prologue').addEventListener('lostpointercapture',release);
  el('prologue').addEventListener('click',event=>{
    if(!started||controls(event.target))return;
    // Touch-generated clicks are ignored. Real mouse clicks and keyboard activation toggle.
    if(event.pointerType==='touch'||event.pointerType==='pen'||event.sourceCapabilities?.firesTouchEvents||Date.now()-lastTouchAt<700)return;
    if(window.matchMedia('(hover: hover) and (pointer: fine)').matches||event.pointerType==='mouse'){manualPause=!manualPause;syncPause();}
  });
  el('prologue').addEventListener('contextmenu',event=>{if(!controls(event.target))event.preventDefault();});
  document.addEventListener('visibilitychange',()=>{if(showing)syncPause();});
  window.addEventListener('blur',()=>{if(touchHeld!==null){touchHeld=null;syncPause();}});
  el('prologueStart').addEventListener('click',begin);
  el('prologuePrev').addEventListener('click',()=>{if(page>0)scene(page-1,true);});
  el('prologueNext').addEventListener('click',()=>{if(started){if(page<3)scene(page+1,true);else finish();}});
  el('prologueSound').addEventListener('click',()=>{
    sound=!sound;
    if(!sound){stopSpeech();spokenDone=true;endedAt=cueElapsed;}
    else if(started){unlockAudio();if(page<0)speak('序章，重新集結。');else if(cueIndex>=0)speak(cues[cueIndex]);if(paused)try{synth?.pause();}catch{}}
    status();
  });
  el('prologueSkip').addEventListener('click',finish);el('replayPrologue').addEventListener('click',open);
  el('prologue').addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();finish();return;}
    if((event.key?.toLowerCase()==='p'||((event.code==='Space'||event.key===' ')&&!controls(event.target)))&&started){event.preventDefault();manualPause=!manualPause;syncPause();}
    if(event.key==='Tab'){
      const buttons=Array.from(el('prologue').querySelectorAll('button:not(:disabled)')).filter(button=>!button.closest('[hidden]'));
      const first=buttons[0],lastButton=buttons[buttons.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastButton.focus();}
      else if(!event.shiftKey&&document.activeElement===lastButton){event.preventDefault();first.focus();}
    }
  });
  window.Prologue={update(user,state){const id=user.$id;if(currentUser!==id){close();currentUser=id;if(!hasRead()&&!state.ownGift)open();}else if(showing){el('prologue').hidden=false;el('operationContent').hidden=true;}}};
})();
