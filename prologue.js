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
  let elapsed=0,last=0,frame=0,cues=[],cueIndex=-1,cueElapsed=0,characters=[],typed=0,charTimes=[],typingDuration=0;
  let sound=true,audioContext=null,keyBuffer=null,resumeFocus=null,preloaded=false;
  let accepting=false,sealOpened=false,accepted=false,acceptHeld=null,acceptElapsed=0,acceptedElapsed=0;
  const key=()=>`christmas-prologue-v1:${currentUser}`;
  function hasRead(){if(seen.has(currentUser))return true;try{return localStorage.getItem(key())==='read';}catch{return false;}}
  function preload(){if(preloaded||!window.Image)return;preloaded=true;scenes.forEach(data=>{const image=new window.Image();image.src=`assets/prologue-${data.image}.png`;});}
  function unlockAudio(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio&&!audioContext)audioContext=new Audio();audioContext?.resume()?.catch(()=>{});}catch{}}
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
    el('prologuePlayback').textContent=!started?'等待開啟':accepting?'等待接取任務':paused?'已暫停':'檔案閱覽中';
    el('prologue').dataset.paused=String(paused);el('prologue').dataset.sound=String(sound);
    el('prologuePause').textContent=manualPause?'繼續播放':'暫停播放';el('prologuePause').setAttribute('aria-pressed',String(manualPause));el('prologuePause').disabled=!started||accepting;
    el('prologueSound').textContent=sound?'音效：開':'音效：關';el('prologueSound').setAttribute('aria-pressed',String(sound));
    el('prologueInteraction').textContent=accepting?'拆開封蠟，接收第一項指令':paused?'已暫停 · 按「繼續播放」繼續':'可按「暫停播放」停留閱讀';
    el('prologueSoundNote').textContent=sound?'打字機敲擊 · 翻頁音效':'音效已關閉';
  }
  function syncPause(){
    const value=manualPause||document.hidden||!started;
    if(paused!==value){paused=value;try{if(paused)audioContext?.suspend()?.catch(()=>{});else if(sound)audioContext?.resume()?.catch(()=>{});}catch{}}
    status();
  }
  function lines(text){
    // Short phrases keep the slower typewriter readable on mobile.
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
    cueIndex=index;cueElapsed=0;typed=0;characters=Array.from(cues[index]);charTimes=[];let time=100;
    for(const char of characters){time+=CHARACTER_MS+(/[，、：；]/u.test(char)?180:/[。！？]/u.test(char)?360:0);charTimes.push(time);}typingDuration=time;
    const nodes=[];
    if(index>0){const previous=document.createElement('p');previous.textContent=cues[index-1];previous.className='subtitlePrevious';nodes.push(previous);}
    const current=document.createElement('p');current.className='subtitleCurrent typing';current.textContent=reduced?cues[index]:'';nodes.push(current);
    if(reduced){typed=characters.length;typingDuration=0;current.classList.remove('typing');}
    el('prologueText').replaceChildren(...nodes);
  }
  function scene(index,focus=false){
    accepting=false;page=index;elapsed=0;cueElapsed=0;cueIndex=-1;
    const shell=el('prologue');shell.dataset.mode=index<0?'intro':'story';
    el('prologueReady').hidden=true;el('prologueAccept').hidden=true;el('prologueIntro').hidden=index>=0;el('prologueStory').hidden=index<0;
    el('prologuePrev').disabled=index<=0;el('prologueNext').hidden=false;el('prologueNext').disabled=false;
    el('prologueNext').textContent=index<0?'開始閱覽':index===3?'拆閱第一項指令':'下一幕';
    el('prologuePage').textContent=index<0?'PROLOGUE / 序章':`${String(index+1).padStart(2,'0')} / 04`;el('prologueProgress').style.width='0%';
    if(index>=0){
      flip();const data=scenes[index],previous=el('prologueImagePrevious'),image=el('prologueImage');previous.src=image.getAttribute('src')||`assets/prologue-${data.image}.png`;image.src=`assets/prologue-${data.image}.png`;image.alt=data.alt;
      el('prologueChapter').textContent=data.chapter;el('prologueTitle').textContent=data.title;cues=lines(data.text);el('prologueText').replaceChildren();el('prologueAccessibleText').textContent=data.text.join('\n');el('prologueStory').scrollTop=0;
      shell.classList.remove('sceneEntering');void shell.offsetWidth;shell.classList.add('sceneEntering');if(focus)el('prologueTitle').focus({preventScroll:true});
    }else{shell.classList.remove('introEntering');void shell.offsetWidth;shell.classList.add('introEntering');}
    status();
  }
  function showAcceptance(){
    accepting=true;started=true;manualPause=false;sealOpened=false;accepted=false;acceptHeld=null;acceptElapsed=0;acceptedElapsed=0;
    el('prologue').dataset.mode='accept';el('prologue').dataset.accept='sealed';
    for(const id of ['prologueReady','prologueIntro','prologueStory'])el(id).hidden=true;
    el('prologueAccept').hidden=false;el('acceptDetails').hidden=true;el('acceptSeal').hidden=false;el('acceptHold').disabled=false;el('acceptClickConfirm').hidden=true;el('acceptAlternative').hidden=false;
    el('acceptLabel').textContent='長按指紋 · 接受任務';el('acceptStatus').textContent='僅限本人閱覽 · 點擊封蠟拆封';el('acceptHold').style.setProperty('--accept-progress','0deg');
    el('prologuePrev').disabled=true;el('prologueNext').hidden=true;el('prologuePage').textContent='MISSION 01 / 待接收';el('prologueProgress').style.width='100%';
    el('prologueSkip').textContent='重看故事';syncPause();el('acceptSeal').focus({preventScroll:true});
  }
  function openSeal(){
    if(!accepting||sealOpened)return;sealOpened=true;flip();el('prologue').dataset.accept='opened';el('acceptSeal').hidden=true;el('acceptDetails').hidden=false;el('acceptStatus').textContent='指令已拆封 · 請確認接收';el('acceptHold').focus({preventScroll:true});
  }
  function cancelHold(){if(accepted)return;acceptHeld=null;acceptElapsed=0;el('acceptHold').style.setProperty('--accept-progress','0deg');el('acceptLabel').textContent='長按指紋 · 接受任務';}
  function completeAcceptance(){
    if(!accepting||!sealOpened||accepted)return;accepted=true;acceptHeld=null;acceptedElapsed=0;flip();el('prologue').dataset.accept='accepted';el('acceptLabel').textContent='身分確認 · 任務已接收';el('acceptStatus').textContent='授權完成。正在開啟你的行動檔案。';el('acceptHold').disabled=true;el('acceptAlternative').hidden=true;el('acceptClickConfirm').hidden=true;el('acceptHold').style.setProperty('--accept-progress','360deg');
  }
  function tick(now){
    if(!showing)return;const delta=last?Math.min(now-last,100):0;last=now;
    if(started&&!paused){
      if(accepting){
        if(accepted){acceptedElapsed+=delta;if(acceptedElapsed>=1400)finish();}
        else if(acceptHeld!==null){acceptElapsed+=delta;el('acceptHold').style.setProperty('--accept-progress',`${Math.min(360,acceptElapsed/ACCEPT_MS*360)}deg`);if(acceptElapsed>=ACCEPT_MS)completeAcceptance();}
      }else{
        elapsed+=delta;cueElapsed+=delta;
        if(page<0){el('prologueProgress').style.width=`${Math.min(100,elapsed/INTRO_DURATION*100)}%`;if(elapsed>=INTRO_DURATION)scene(0);}
        else if(cueIndex<0){if(elapsed>=TRANSITION)cue(0);}
        else{
          let next=typed;while(next<characters.length&&cueElapsed>=charTimes[next])next++;
          if(!reduced&&next!==typed){
            const current=el('prologueText').lastElementChild;current.textContent=characters.slice(0,next).join('');current.classList.toggle('typing',next<characters.length);
            if(characters.slice(typed,next).some(char=>/[\p{L}\p{N}]/u.test(char)))typeKey();typed=next;
          }
          const hold=cueIndex===cues.length-1?3500:2400,total=typingDuration+hold;
          el('prologueProgress').style.width=`${(cueIndex+Math.min(1,cueElapsed/total))/cues.length*100}%`;
          if(cueElapsed>=total){if(cueIndex<cues.length-1)cue(cueIndex+1);else if(page<3)scene(page+1);else showAcceptance();}
        }
      }
    }
    if(showing)frame=requestAnimationFrame(tick);
  }
  function begin(){if(started)return;started=true;manualPause=false;unlockAudio();syncPause();scene(-1);el('prologuePause').focus({preventScroll:true});}
  function open(){
    preload();cancelAnimationFrame(frame);resumeFocus=document.activeElement;showing=true;started=false;manualPause=false;paused=false;accepting=false;last=0;acceptHeld=null;
    el('prologue').hidden=false;el('operationContent').hidden=true;document.body.classList.add('prologue-playing');el('prologue').dataset.mode='ready';el('prologueReady').hidden=false;
    for(const id of ['prologueIntro','prologueStory','prologueAccept'])el(id).hidden=true;
    el('prologuePrev').disabled=true;el('prologueNext').hidden=false;el('prologueNext').disabled=true;el('prologueSkip').textContent='跳過故事';el('prologuePage').textContent='INCOMING / 機密檔案';el('prologueProgress').style.width='0%';
    syncPause();el('prologueStart').focus({preventScroll:true});frame=requestAnimationFrame(tick);
  }
  function close(){showing=false;started=false;acceptHeld=null;cancelAnimationFrame(frame);try{audioContext?.suspend()?.catch(()=>{});}catch{}document.body.classList.remove('prologue-playing');el('prologue').hidden=true;el('operationContent').hidden=false;}
  function finish(){
    seen.add(currentUser);try{localStorage.setItem(key(),'read');}catch{}close();
    // Accepting the story never draws a secret mission or changes game data.
    const input=document.querySelector('#giftForm input:not(:disabled)');if(input){el('memberTab').click();el('giftForm').scrollIntoView({behavior:'auto',block:'start'});input.focus({preventScroll:true});}else if(resumeFocus?.isConnected)resumeFocus.focus({preventScroll:true});
  }
  el('prologueStart').addEventListener('click',begin);
  el('prologuePause').addEventListener('click',()=>{if(!started||accepting)return;manualPause=!manualPause;syncPause();});
  el('prologuePrev').addEventListener('click',()=>{if(page>0&&!accepting)scene(page-1,true);});
  el('prologueNext').addEventListener('click',()=>{if(started&&!accepting){if(page<3)scene(page+1,true);else showAcceptance();}});
  el('prologueSound').addEventListener('click',()=>{sound=!sound;if(sound&&started){unlockAudio();if(paused)audioContext?.suspend()?.catch(()=>{});}else if(!sound)audioContext?.suspend()?.catch(()=>{});status();});
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
  el('acceptAlternative').addEventListener('click',()=>{cancelHold();el('acceptClickConfirm').hidden=false;el('acceptAlternative').hidden=true;el('acceptClickConfirm').focus({preventScroll:true});});
  el('acceptClickConfirm').addEventListener('click',completeAcceptance);
  document.addEventListener('visibilitychange',()=>{if(showing){if(document.hidden)cancelHold();syncPause();}});
  window.addEventListener('blur',cancelHold);
  el('prologue').addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close();if(resumeFocus?.isConnected)resumeFocus.focus({preventScroll:true});return;}
    if(event.key==='Tab'){
      const buttons=Array.from(el('prologue').querySelectorAll('button:not(:disabled)')).filter(button=>!button.closest('[hidden]'));const first=buttons[0],lastButton=buttons[buttons.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastButton.focus();}else if(!event.shiftKey&&document.activeElement===lastButton){event.preventDefault();first.focus();}
    }
  });
  window.Prologue={update(user,state){const id=user.$id;if(currentUser!==id){close();currentUser=id;if(!hasRead()&&!state.ownGift)open();}else if(showing){el('prologue').hidden=false;el('operationContent').hidden=true;}}};
})();
