'use strict';
(()=>{
  const el=id=>document.getElementById(id);
  const scenes=[
    {chapter:'PROLOGUE 01 / ANONYMOUS INVITATION',title:'一封沒有寄件人的邀請',image:'invitation',alt:'深色桌面上，一封帶著雪花封蠟的聖誕邀請函',text:['一封沒有寄件人的聖誕邀請函，悄悄出現在你的收件匣。','裡面只有集合資訊，以及一句話：','「請帶上一份禮物。別讓任何人知道，那是你準備的。」']},
    {chapter:'PROLOGUE 02 / IDENTITY VERIFIED',title:'北極情報局',image:'verification',alt:'神祕辦公室的終端機亮起雪花徽記',text:['當你輸入通行密碼，邀請函上的雪花忽然停住。畫面逐漸暗下，一段加密訊息緩緩浮現。','「身分確認。歡迎加入本次行動，特務。」','訊息末端，一枚雪花徽記亮起。','北極情報局。']},
    {chapter:'PROLOGUE 03 / NEW RENDEZVOUS',title:'新的據點，重新集結',image:'rendezvous',alt:'聖誕夜裡亮著暖光的秘密集合據點',text:['去年，情報局曾以聖誕聚會為掩護，完成一次秘密交接。','今年，新的據點已就緒，召集名單也已重新編組。熟悉的面孔與新加入的特務，將共同參與代號「CHRISTMAS II」的秘密行動。']},
    {chapter:'PROLOGUE 04 / EYES ONLY',title:'第一項指令，現在送達',image:'dossier',alt:'繫著紅緞帶的機密文件與包裝好的聖誕禮物',text:['十二名特務，十二份禮物。','你們將以朋友的身分見面、聊天、交換祝福。沒有人會知道，一份看似普通的聖誕禮物，會把誰帶進什麼樣的任務。','畫面上的雪花再次飄落。','一份標示「僅限本人閱覽」的檔案，出現在你面前。','你的第一項指令，現在送達。']}
  ];
  const INTRO_DURATION=6500, TRANSITION=1400, CHARACTER_MS=125, ACCEPT_MS=1800;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen=new Set();
  let currentUser=null,page=-1,showing=false,started=false,manualPause=false,paused=false;
  let elapsed=0,last=0,frame=0,textElapsed=0,textStarted=false,characters=[],typed=0,charTimes=[],typingDuration=0;
  let sound=true,audioContext=null,keyBuffer=null,resumeFocus=null,preloaded=false;
  let music=null,musicRequest=0,soundBlocked=false,musicBlocked=false,musicFailed=false;
  let accepting=false,sealOpened=false,accepted=false,acceptHeld=null,acceptElapsed=0,acceptedElapsed=0;
  const key=()=>`christmas-prologue-v1:${currentUser}`;
  function hasRead(){if(seen.has(currentUser))return true;try{return localStorage.getItem(key())==='read';}catch{return false;}}
  function preload(){if(preloaded||!window.Image)return;preloaded=true;scenes.forEach(data=>{const image=new window.Image();image.src=`assets/prologue-${data.image}.png`;});}
  function ensureMusic(){
    if(music||!window.Audio)return;
    music=new window.Audio('assets/prologue-christmas.wav');music.loop=true;music.preload='auto';music.volume=.28;
  }
  function pauseMusic(reset=false){musicRequest++;music?.pause();if(reset&&music)try{music.currentTime=0;}catch{}}
  function playMusic(){
    if(!showing||!started||paused||!sound)return;ensureMusic();if(!music)return;
    const request=++musicRequest;
    try{
      const playing=music.play();
      playing?.then(()=>{if(request!==musicRequest)return;musicBlocked=false;musicFailed=false;status();}).catch(error=>{
        if(request!==musicRequest||error.name==='AbortError')return;
        if(error.name==='NotAllowedError')musicBlocked=true;else musicFailed=true;status();
      });
    }catch{musicFailed=true;status();}
  }
  function unlockAudio(){
    if(!showing||!started||!sound||paused)return;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio&&!audioContext)audioContext=new Audio();
      if(audioContext?.state==='suspended')soundBlocked=true;
      audioContext?.resume()?.then(()=>{if(showing)status();}).catch(()=>status());
    }catch{}
    playMusic();
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
  function typeKey(){
    if(!sound||paused||!audioContext||audioContext.state!=='running')return;
    try{
      if(!keyBuffer){
        const length=Math.floor(audioContext.sampleRate*.055);keyBuffer=audioContext.createBuffer(1,length,audioContext.sampleRate);const samples=keyBuffer.getChannelData(0);
        for(let i=0;i<length;i++){const t=i/audioContext.sampleRate;const strike=Math.exp(-t*220),body=t>.009?Math.exp(-(t-.009)*140)*.5:0;samples[i]=(Math.random()*2-1)*(strike+body);}
      }
      const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();
      source.buffer=keyBuffer;if(source.playbackRate)source.playbackRate.value=.94+Math.random()*.12;filter.type='bandpass';filter.frequency.value=1600;filter.Q.value=.55;gain.gain.value=.14;
      source.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();source.stop(audioContext.currentTime+.07);
    }catch{}
  }
  function status(){
    soundBlocked=!!(musicBlocked||(audioContext&&audioContext.state==='suspended'&&!paused));
    el('prologuePlayback').textContent=!started?'等待開啟':accepting?'等待接取任務':paused?'已暫停':'檔案閱覽中';
    el('prologue').dataset.paused=String(paused);el('prologue').dataset.sound=String(sound);
    el('prologuePause').textContent=manualPause?'繼續播放':'暫停播放';el('prologuePause').setAttribute('aria-pressed',String(manualPause));el('prologuePause').disabled=!started||accepting;
    el('prologueSound').textContent=!sound?'聲音：關':soundBlocked&&!paused?'開啟聲音':'聲音：開';el('prologueSound').setAttribute('aria-pressed',String(sound));
  }
  function syncPause(){
    const value=manualPause||document.hidden||!started;
    if(paused!==value){paused=value;try{if(paused){audioContext?.suspend()?.catch(()=>{});pauseMusic();}else if(sound)unlockAudio();}catch{}}
    status();
  }
  function prepareText(data){
    textElapsed=0;typed=0;textStarted=false;characters=Array.from(data.text.join('\n\n'));charTimes=[];let time=100;
    for(const char of characters){time+=CHARACTER_MS+(/[，、：；]/u.test(char)?180:/[。！？]/u.test(char)?360:0);charTimes.push(time);}typingDuration=time;
    const current=document.createElement('p');current.className='subtitleFull';current.textContent='';el('prologueText').replaceChildren(current);
  }
  function paintText(count){
    const story=el('prologueStory'),follow=story.scrollHeight-story.scrollTop-story.clientHeight<45;
    const current=el('prologueText').lastElementChild;current.textContent=characters.slice(0,count).join('');current.classList.toggle('typing',count<characters.length);
    if(follow)story.scrollTop=story.scrollHeight;
  }
  function scene(index,focus=false){
    accepting=false;page=index;elapsed=0;textElapsed=0;textStarted=false;
    const shell=el('prologue');shell.dataset.mode=index<0?'intro':'story';
    el('prologueAccept').hidden=true;el('prologueIntro').hidden=index>=0;el('prologueStory').hidden=index<0;
    el('prologuePrev').disabled=index<=0;el('prologueNext').hidden=false;el('prologueNext').disabled=false;
    el('prologueNext').textContent=index<0?'開始閱覽':index===3?'拆閱第一項指令':'下一幕';
    el('prologuePage').textContent=index<0?'PROLOGUE / 序章':`${String(index+1).padStart(2,'0')} / 04`;el('prologueProgress').style.width='0%';
    if(index>=0){
      flip();const data=scenes[index],previous=el('prologueImagePrevious'),image=el('prologueImage');previous.src=image.getAttribute('src')||`assets/prologue-${data.image}.png`;image.src=`assets/prologue-${data.image}.png`;image.alt=data.alt;
      el('prologueChapter').textContent=data.chapter;el('prologueTitle').textContent=data.title;prepareText(data);el('prologueAccessibleText').textContent=data.text.join('\n');el('prologueStory').scrollTop=0;
      shell.classList.remove('sceneEntering');void shell.offsetWidth;shell.classList.add('sceneEntering');if(focus)el('prologueTitle').focus({preventScroll:true});
    }else{shell.classList.remove('introEntering');void shell.offsetWidth;shell.classList.add('introEntering');}
    status();
  }
  function showAcceptance(){
    accepting=true;started=true;manualPause=false;sealOpened=false;accepted=false;acceptHeld=null;acceptElapsed=0;acceptedElapsed=0;
    el('prologue').dataset.mode='accept';el('prologue').dataset.accept='sealed';
    for(const id of ['prologueIntro','prologueStory'])el(id).hidden=true;
    el('prologueAccept').hidden=false;el('acceptDetails').hidden=true;el('acceptSeal').hidden=false;el('acceptHold').disabled=false;
    el('acceptLabel').textContent='長按指紋 · 接受任務';el('acceptStatus').textContent='僅限本人閱覽 · 點擊封蠟拆封';el('acceptHold').style.setProperty('--accept-progress','0deg');
    el('prologuePrev').disabled=true;el('prologueNext').hidden=true;el('prologuePage').textContent='MISSION 01 / 待接收';el('prologueProgress').style.width='100%';
    el('prologueSkip').textContent='重看故事';syncPause();el('acceptSeal').focus({preventScroll:true});
  }
  function openSeal(){
    if(!accepting||sealOpened)return;sealOpened=true;flip();el('prologue').dataset.accept='opened';el('acceptSeal').hidden=true;el('acceptDetails').hidden=false;el('acceptStatus').textContent='指令已拆封 · 請確認接收';el('acceptHold').focus({preventScroll:true});
  }
  function cancelHold(){if(accepted)return;acceptHeld=null;acceptElapsed=0;el('acceptHold').style.setProperty('--accept-progress','0deg');el('acceptLabel').textContent='長按指紋 · 接受任務';}
  function completeAcceptance(){
    if(!accepting||!sealOpened||accepted)return;accepted=true;acceptHeld=null;acceptedElapsed=0;flip();el('prologue').dataset.accept='accepted';el('acceptLabel').textContent='身分確認 · 任務已接收';el('acceptStatus').textContent='授權完成。正在開啟你的行動檔案。';el('acceptHold').disabled=true;el('acceptHold').style.setProperty('--accept-progress','360deg');
  }
  function tick(now){
    if(!showing)return;const delta=last?Math.min(now-last,100):0;last=now;
    if(started&&!paused){
      if(accepting){
        if(accepted){acceptedElapsed+=delta;if(acceptedElapsed>=1400)finish();}
        else if(acceptHeld!==null){acceptElapsed+=delta;el('acceptHold').style.setProperty('--accept-progress',`${Math.min(360,acceptElapsed/ACCEPT_MS*360)}deg`);if(acceptElapsed>=ACCEPT_MS)completeAcceptance();}
      }else{
        elapsed+=delta;
        if(page<0){el('prologueProgress').style.width=`${Math.min(100,elapsed/INTRO_DURATION*100)}%`;if(elapsed>=INTRO_DURATION)scene(0);}
        else if(elapsed>=TRANSITION){
          if(!textStarted){textStarted=true;if(reduced){typed=characters.length;typingDuration=0;paintText(typed);}}
          textElapsed+=delta;let next=typed;while(next<characters.length&&textElapsed>=charTimes[next])next++;
          if(!reduced&&next!==typed){
            paintText(next);if(characters.slice(typed,next).some(char=>/[\p{L}\p{N}]/u.test(char)))typeKey();typed=next;
          }
          const total=typingDuration+(page===3?7500:6500);
          el('prologueProgress').style.width=`${Math.min(100,textElapsed/total*100)}%`;
          if(textElapsed>=total){if(page<3)scene(page+1);else showAcceptance();}
        }
      }
    }
    if(showing)frame=requestAnimationFrame(tick);
  }
  function open(){
    preload();cancelAnimationFrame(frame);pauseMusic(true);resumeFocus=document.activeElement;showing=true;started=true;manualPause=false;paused=false;accepting=false;last=0;acceptHeld=null;
    el('prologue').hidden=false;el('operationContent').hidden=true;document.body.classList.add('prologue-playing');
    el('prologueSkip').textContent='跳過故事';syncPause();scene(-1);unlockAudio();el('prologuePause').focus({preventScroll:true});frame=requestAnimationFrame(tick);
  }
  function close(){showing=false;started=false;acceptHeld=null;cancelAnimationFrame(frame);pauseMusic(true);try{audioContext?.suspend()?.catch(()=>{});}catch{}document.body.classList.remove('prologue-playing');el('prologue').hidden=true;el('operationContent').hidden=false;}
  function finish(){
    seen.add(currentUser);try{localStorage.setItem(key(),'read');}catch{}close();
    // Accepting the story never draws a secret mission or changes game data.
    const input=document.querySelector('#giftForm input:not(:disabled)');if(input){el('memberTab').click();el('giftForm').scrollIntoView({behavior:'auto',block:'start'});input.focus({preventScroll:true});}else if(resumeFocus?.isConnected)resumeFocus.focus({preventScroll:true});
  }
  el('prologuePause').addEventListener('click',()=>{if(!started||accepting)return;manualPause=!manualPause;syncPause();});
  el('prologuePrev').addEventListener('click',()=>{if(page>0&&!accepting)scene(page-1,true);});
  el('prologueNext').addEventListener('click',()=>{if(started&&!accepting){if(page<3)scene(page+1,true);else showAcceptance();}});
  el('prologueSound').addEventListener('click',()=>{
    if(sound&&soundBlocked&&!paused){unlockAudio();return;}
    sound=!sound;if(sound)unlockAudio();else{pauseMusic();audioContext?.suspend()?.catch(()=>{});}status();
  });
  // Autoplay policies can block sound, but never block the opening animation.
  // Retry only after an actual gesture; background clicks no longer pause playback.
  el('prologue').addEventListener('pointerdown',event=>{if(sound&&soundBlocked&&!event.target.closest('#prologueSound'))unlockAudio();});
  el('prologueSkip').addEventListener('click',()=>{if(accepting){open();return;}unlockAudio();showAcceptance();});
  el('replayPrologue').addEventListener('click',open);
  el('acceptSeal').addEventListener('click',openSeal);
  el('acceptHold').addEventListener('pointerdown',event=>{
    if(!accepting||!sealOpened||accepted||event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0))return;
    event.preventDefault();acceptHeld=event.pointerId;acceptElapsed=0;el('acceptLabel').textContent='正在核驗身分…';try{el('acceptHold').setPointerCapture(event.pointerId);}catch{}
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture'])el('acceptHold').addEventListener(name,event=>{if(event.pointerId===acceptHeld)cancelHold();});
  el('acceptHold').addEventListener('keydown',event=>{if((event.key===' '||event.key==='Enter')&&!event.repeat&&sealOpened&&!accepted){event.preventDefault();acceptHeld='keyboard';acceptElapsed=0;el('acceptLabel').textContent='正在核驗身分…';}});
  el('acceptHold').addEventListener('keyup',event=>{if((event.key===' '||event.key==='Enter')&&acceptHeld==='keyboard'){event.preventDefault();cancelHold();}});
  el('acceptHold').addEventListener('blur',cancelHold);
  el('acceptHold').addEventListener('contextmenu',event=>event.preventDefault());
  document.addEventListener('visibilitychange',()=>{if(showing){if(document.hidden)cancelHold();syncPause();}});
  window.addEventListener('blur',cancelHold);
  el('prologue').addEventListener('keydown',event=>{
    if(sound&&soundBlocked&&event.key!=='Escape'&&event.key!=='Tab')unlockAudio();
    if(event.key==='Escape'){event.preventDefault();close();if(resumeFocus?.isConnected)resumeFocus.focus({preventScroll:true});return;}
    if(event.key==='Tab'){
      const buttons=Array.from(el('prologue').querySelectorAll('button:not(:disabled)')).filter(button=>!button.closest('[hidden]'));const first=buttons[0],lastButton=buttons[buttons.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastButton.focus();}else if(!event.shiftKey&&document.activeElement===lastButton){event.preventDefault();first.focus();}
    }
  });
  window.Prologue={update(user,state){const id=user.$id;if(currentUser!==id){close();currentUser=id;if(!hasRead()&&!state.ownGift)open();}else if(showing){el('prologue').hidden=false;el('operationContent').hidden=true;}}};
})();
