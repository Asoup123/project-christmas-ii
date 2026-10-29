'use strict';
(()=>{
  const el=id=>document.getElementById(id);
  const prologueScenes=[
    {chapter:'PROLOGUE 01 / ANONYMOUS INVITATION',title:'一封沒有寄件人的邀請',image:'invitation',alt:'深色桌面上，一封帶著雪花封蠟的聖誕邀請函',text:['一封沒有寄件人的聖誕邀請函，悄悄出現在你的收件匣。','裡面只有集合資訊，以及一句話：','「請帶上一份禮物。別讓任何人知道，那是你準備的。」']},
    {chapter:'PROLOGUE 02 / IDENTITY VERIFIED',title:'北極情報局',image:'verification',alt:'神祕辦公室的終端機亮起雪花徽記',text:['當你輸入通行密碼，邀請函上的雪花忽然停住。畫面逐漸暗下，一段加密訊息緩緩浮現。','「身分確認。歡迎加入本次行動，特務。」','訊息末端，一枚雪花徽記亮起。','北極情報局。']},
    {chapter:'PROLOGUE 03 / NEW RENDEZVOUS',title:'新的據點，重新集結',image:'rendezvous',alt:'聖誕夜裡亮著暖光的秘密集合據點',text:['去年，情報局曾以聖誕聚會為掩護，完成一次秘密交接。','今年，新的據點已就緒，召集名單也已重新編組。熟悉的面孔與新加入的特務，將共同參與代號「CHRISTMAS II」的秘密行動。']},
    {chapter:'PROLOGUE 04 / EYES ONLY',title:'第一項指令，現在送達',image:'dossier',alt:'繫著紅緞帶的機密文件與包裝好的聖誕禮物',text:['十二名特務，十二份禮物。','你們將以朋友的身分見面、聊天、交換祝福。沒有人會知道，一份看似普通的聖誕禮物，會把誰帶進什麼樣的任務。','畫面上的雪花再次飄落。','一份標示「僅限本人閱覽」的檔案，出現在你面前。','你的第一項指令，現在送達。']}
  ];
  const secondScenes=[
  {
    "chapter": "CHAPTER II / INCOMING TRANSMISSION",
    "title": "別離開，特務",
    "image": "chapter2-transmission",
    "alt": "終端機在照片傳送完成後，亮起新的機密通訊",
    "text": [
      "照片傳送完成，畫面上的進度停在了百分之百。",
      "你正準備關閉頁面，終端機卻傳來一聲輕響。",
      "「情報已接收。請稍候，別離開。」",
      "螢幕上的禮物照片被收進一只資料夾。三個提示詞依序歸檔，你的名字則從檔案上消失了。"
    ]
  },
  {
    "chapter": "CHAPTER II / A CHRISTMAS SECRET",
    "title": "一份尚未署名的秘密",
    "image": "chapter2-letter",
    "alt": "帶著北極情報局雪花封蠟的聖誕來信",
    "text": [
      "幾秒後，一封帶著紅色封蠟的信件出現在畫面中央。封面上，只有北極情報局的雪花徽記。",
      "你拆開信封，裡面是一張尚未填上編號的標籤，以及一段留言：",
      "「聖誕老人習慣在禮物上寫下收件人的名字。」",
      "「但我們的禮物，還不知道自己會遇見誰。所以今年，我們先替它準備了一個秘密。」"
    ]
  },
  {
    "chapter": "CHAPTER II / SEALED DIRECTIVE",
    "title": "交給選中它的人",
    "image": "chapter2-directives",
    "alt": "一疊內容封存的機密文件，等待為禮物配發編號",
    "text": [
      "信紙下方，露出一疊封好的密令。內容看不見，每封信上只印著一個編號。",
      "你將從中抽取一封。它會跟著你的禮物，交到另一名特務手裡。在那之前，連你也不能知道裡面寫了什麼。",
      "終端機再次亮起。",
      "「抽取你的密令，把編號留在禮物上。」",
      "「剩下的，交給那個選中它的人。」"
    ]
  }
];
  const thirdScenes=[
  {
    "chapter": "CHAPTER III / THE SEALED NUMBER",
    "title": "編號已落定",
    "image": "chapter3-tag",
    "alt": "戴著手套的手，將空白標籤繫在匿名聖誕禮物旁",
    "text": [
      "抽取結束，轉動的編號緩緩停下。",
      "密令 {code}。",
      "編號下方的文件，仍被雪花封蠟牢牢封住。畫面上浮現一張標籤，與一句提醒：",
      "「把這個編號留在禮物上。內容，留給收下它的人。」"
    ]
  },
  {
    "chapter": "CHAPTER III / BEFORE THE RENDEZVOUS",
    "title": "下一位接收者，就是你",
    "image": "chapter3-rendezvous",
    "alt": "聖誕樹與壁爐照亮新的秘密據點，長桌等待特務抵達",
    "text": [
      "你將視線移回螢幕，一張據點照片取代了文件。暖黃燈光從窗內透出，聖誕樹旁的長桌，還留著等待填滿的位置。",
      "「你的準備已完成。接下來，換你成為接收者。」",
      "聚會那天，你會以朋友的身分入席。但在交換祝福之前，另一份禮物正帶著尚未揭曉的密令，等待你的選擇。"
    ]
  },
  {
    "chapter": "CHAPTER III / CROSSING CLUES",
    "title": "讓你停下來的線索",
    "image": "chapter3-clues",
    "alt": "匿名禮物照片與三張線索紙條，讓特務的手停在其中一份檔案上",
    "text": [
      "終端機上的雪花徽記，再次亮起。最後一段訊息，緩緩浮現。",
      "「你留下的三個提示詞，會引來某個人的目光。」",
      "「而另一名特務留下的線索，也會讓你停下來。」"
    ]
  }
];
  const books={
    prologue:{scenes:prologueScenes,label:'序章',title:'重新集結',tagline:'一封邀請，讓沉寂的行動再次啟動。',ordinal:'第一',number:'01',missionTitle:'準備你的交接物資',description:'準備一份包裝完成的禮物，\n上傳照片，並留下三個提示詞。',note:'別留下你的身分線索。\n完成提交後，等待下一項指令。',target:'giftForm'},
    chapter2:{scenes:secondScenes,label:'第二章',title:'封存密令',tagline:'情報已入庫。最後一道封印，等待你親手完成。',ordinal:'第二',number:'02',missionTitle:'替禮物封存密令',description:'抽取一個密令編號，\n將編號寫在或貼在自己的禮物包裝上。',note:'你只會看到編號，不會看到密令內容。\n別拆封，也別留下自己的名字。',target:'drawTaskPanel'},
    chapter3:{scenes:thirdScenes,label:'第三章',title:'交接前夜',tagline:'禮物已封存。下一個秘密，正等著交到你手上。',ordinal:'第三',number:'03',missionTitle:'選定你的交接目標',description:'匿名情報庫公開後，\n根據照片與三個提示詞，選擇一份禮物並確認接收。',note:'不能選擇自己的禮物。\n確認接收後，密令才會解封，且不能更換目標。',target:'giftGallery'}
  };
  const sceneMusic={prologue:['p01','p02','p03','p04'],chapter2:['c201','c202','c203'],chapter3:['c301','c302','c303']};
  Object.entries(books).forEach(([id,book],index)=>{
    book.introMusic=`assets/prologue-music-intro-${index+1}.mp3`;book.acceptMusic=`assets/prologue-music-accept-${index+1}.mp3`;
    book.scenes.forEach((scene,i)=>{scene.music=`assets/prologue-music-${sceneMusic[id][i]}.mp3`;});
  });
  let bookId='prologue',scenes=books.prologue.scenes,latestState=null,onAccepted=null;
  const INTRO_DURATION=6500, TRANSITION=1400, CHARACTER_MS=125, ACCEPT_MS=1800;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen=new Set();
  let currentUser=null,page=-1,showing=false,started=false,manualPause=false,paused=false;
  let elapsed=0,last=0,frame=0,textElapsed=0,textStarted=false,characters=[],typed=0,charTimes=[],typingDuration=0;
  let sound=true,audioContext=null,keyBuffer=null,resumeFocus=null;
  const preloaded=new Set();
  let music=null,musicRequest=0,soundBlocked=false,musicBlocked=false,musicFailed=false;
  const musicPlayers=new Set(),MUSIC_VOLUME=.28,MUSIC_FADE_MS=1400;
  let musicSource='',outgoingMusic=null,musicFade=null;
  let accepting=false,sealOpened=false,accepted=false,acceptHeld=null,acceptElapsed=0,acceptedElapsed=0;
  const key=(book=bookId,id=currentUser)=>book==='prologue'?`christmas-prologue-v1:${id}`:`christmas-${book}-v1:${id}`;
  function hasRead(book=bookId,id=currentUser){if(seen.has(`${book}:${id}`))return true;try{return localStorage.getItem(key(book,id))==='read';}catch{return false;}}
  function preload(){if(preloaded.has(bookId)||!window.Image)return;preloaded.add(bookId);scenes.forEach(data=>{const image=new window.Image();image.src=`assets/prologue-${data.image}.png`;});}
  function desiredMusic(){return accepting?books[bookId].acceptMusic:page<0?books[bookId].introMusic:scenes[page].music;}
  function retireMusic(player){if(!player)return;player.pause();try{player.currentTime=0;}catch{}musicPlayers.delete(player);}
  function ensureMusic(){
    if(!window.Audio)return;
    const source=desiredMusic();if(music&&musicSource===source)return;
    musicRequest++;
    // Keep the loudest outgoing cue during rapid navigation; at most two play at once.
    outgoingMusic=[...musicPlayers].filter(player=>!player.paused).sort((a,b)=>b.volume-a.volume)[0]||music;
    for(const player of [...musicPlayers])if(player!==outgoingMusic)retireMusic(player);
    musicFade=null;music=new window.Audio(source);music.loop=true;music.preload='auto';music.volume=0;musicSource=source;musicPlayers.add(music);
  }
  function pauseMusic(reset=false){
    musicRequest++;for(const player of musicPlayers)player.pause();
    if(reset){for(const player of [...musicPlayers])retireMusic(player);music=null;musicSource='';outgoingMusic=null;musicFade=null;}
  }
  function advanceMusic(delta){
    if(!musicFade)return;const fade=musicFade;fade.elapsed=Math.min(MUSIC_FADE_MS,fade.elapsed+delta);const t=fade.elapsed/MUSIC_FADE_MS;
    fade.to.volume=fade.toVolume+(MUSIC_VOLUME-fade.toVolume)*t;
    if(fade.from)fade.from.volume=fade.fromVolume*(1-t);
    if(t>=1){retireMusic(fade.from);outgoingMusic=null;musicFade=null;}
  }
  function playMusic(){
    if(!showing||!started||paused||!sound)return;ensureMusic();if(!music)return;
    const request=++musicRequest,target=music;
    const ready=()=>{
      if(request!==musicRequest)return;musicBlocked=false;musicFailed=false;
      if(!musicFade||musicFade.to!==target)musicFade={to:target,toVolume:target.volume,from:outgoingMusic,fromVolume:outgoingMusic?.volume||0,elapsed:0};
      status();
    };
    const failed=error=>{
      if(request!==musicRequest||error.name==='AbortError')return;
      if(error.name==='NotAllowedError')musicBlocked=true;else musicFailed=true;status();
    };
    try{
      for(const player of musicPlayers)if(player!==target)player.play()?.catch(()=>{retireMusic(player);if(outgoingMusic===player)outgoingMusic=null;});
      const playing=target.play();if(playing?.then)playing.then(ready).catch(failed);else ready();
    }catch(error){failed(error);}
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
    el('prologueNext').textContent=index<0?'開始閱覽':index===scenes.length-1?`拆閱${books[bookId].ordinal}項指令`:'下一幕';
    el('prologuePage').textContent=index<0?`${bookId==='prologue'?'PROLOGUE':bookId==='chapter2'?'CHAPTER II':'CHAPTER III'} / ${books[bookId].label}`:`${String(index+1).padStart(2,'0')} / ${String(scenes.length).padStart(2,'0')}`;el('prologueProgress').style.width='0%';
    if(index>=0){
      flip();const source=scenes[index],data={...source,text:source.text.map(text=>text.replaceAll('{code}',String(latestState?.draw??'').padStart(2,'0')))},previous=el('prologueImagePrevious'),image=el('prologueImage');previous.src=image.getAttribute('src')||`assets/prologue-${data.image}.png`;image.src=`assets/prologue-${data.image}.png`;image.alt=data.alt;
      el('prologueChapter').textContent=data.chapter;el('prologueTitle').textContent=data.title;prepareText(data);el('prologueAccessibleText').textContent=data.text.join('\n');el('prologueStory').scrollTop=0;
      shell.classList.remove('sceneEntering');void shell.offsetWidth;shell.classList.add('sceneEntering');if(focus)el('prologueTitle').focus({preventScroll:true});
    }else{shell.classList.remove('introEntering');void shell.offsetWidth;shell.classList.add('introEntering');}
    playMusic();status();
  }
  function showAcceptance(){
    accepting=true;started=true;manualPause=false;sealOpened=false;accepted=false;acceptHeld=null;acceptElapsed=0;acceptedElapsed=0;
    el('prologue').dataset.mode='accept';el('prologue').dataset.accept='sealed';
    for(const id of ['prologueIntro','prologueStory'])el(id).hidden=true;
    el('prologueAccept').hidden=false;el('acceptDetails').hidden=true;el('acceptSeal').hidden=false;el('acceptHold').disabled=false;
    el('acceptLabel').textContent='長按指紋 · 接受任務';el('acceptStatus').textContent='僅限本人閱覽 · 點擊封蠟拆封';el('acceptHold').style.setProperty('--accept-progress','0deg');
    el('prologuePrev').disabled=true;el('prologueNext').hidden=true;el('prologuePage').textContent=`MISSION ${books[bookId].number} / 待接收`;el('prologueProgress').style.width='100%';
    el('prologueSkip').textContent='重看故事';syncPause();playMusic();el('acceptSeal').focus({preventScroll:true});
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
      advanceMusic(delta);
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
          const total=typingDuration+(page===scenes.length-1?7500:6500);
          el('prologueProgress').style.width=`${Math.min(100,textElapsed/total*100)}%`;
          if(textElapsed>=total){if(page<scenes.length-1)scene(page+1);else showAcceptance();}
        }
      }
    }
    if(showing)frame=requestAnimationFrame(tick);
  }
  function open(id='prologue'){
    bookId=typeof id==='string'&&books[id]?id:'prologue';scenes=books[bookId].scenes;const book=books[bookId];
    el('storyIntroLabel').textContent=book.label;el('storyIntroTitle').textContent=book.title;el('storyIntroTagline').textContent=book.tagline;
    el('prologue').setAttribute('aria-label',`${book.label}：${book.title}`);
    el('assignmentEyebrow').textContent=`MISSION ASSIGNMENT / ${book.ordinal}項指令`;el('assignmentNumber').textContent=book.number;el('assignmentTitle').textContent=book.missionTitle;el('assignmentDescription').textContent=book.description;el('assignmentNote').textContent=book.note;
    preload();cancelAnimationFrame(frame);pauseMusic(true);resumeFocus=document.activeElement;showing=true;started=true;manualPause=false;paused=false;accepting=false;last=0;acceptHeld=null;
    el('prologue').hidden=false;el('operationContent').hidden=true;document.body.classList.add('prologue-playing');
    el('prologueSkip').textContent='跳過故事';syncPause();scene(-1);unlockAudio();el('prologuePause').focus({preventScroll:true});frame=requestAnimationFrame(tick);
  }
  function close(){showing=false;started=false;acceptHeld=null;cancelAnimationFrame(frame);pauseMusic(true);try{audioContext?.suspend()?.catch(()=>{});}catch{}document.body.classList.remove('prologue-playing');el('prologue').hidden=true;el('operationContent').hidden=false;}
  function finish(){
    const completedBook=bookId;seen.add(`${completedBook}:${currentUser}`);try{localStorage.setItem(key(completedBook),'read');}catch{}close();
    // Accepting a story unlocks its presentation only. No gift draw or selection is made.
    onAccepted?.();if(showing)return;
    el('memberTab').click();const target=el(books[completedBook].target);target?.scrollIntoView({behavior:'auto',block:'start'});
    if(completedBook==='chapter2'){
      const button=el('drawButton');if(!button.disabled)button.focus({preventScroll:true});else el('drawTaskHeading').focus({preventScroll:true});
    }else if(completedBook==='chapter3')el('galleryTitle').focus({preventScroll:true});
    else document.querySelector('#giftForm input:not(:disabled)')?.focus({preventScroll:true});
  }
  el('prologuePause').addEventListener('click',()=>{if(!started||accepting)return;manualPause=!manualPause;syncPause();});
  el('prologuePrev').addEventListener('click',()=>{if(page>0&&!accepting)scene(page-1,true);});
  el('prologueNext').addEventListener('click',()=>{if(started&&!accepting){if(page<scenes.length-1)scene(page+1,true);else showAcceptance();}});
  el('prologueSound').addEventListener('click',()=>{
    if(sound&&soundBlocked&&!paused){unlockAudio();return;}
    sound=!sound;if(sound)unlockAudio();else{pauseMusic();audioContext?.suspend()?.catch(()=>{});}status();
  });
  // Autoplay policies can block sound, but never block the opening animation.
  // Retry only after an actual gesture; background clicks no longer pause playback.
  el('prologue').addEventListener('pointerdown',event=>{if(sound&&soundBlocked&&!event.target.closest('#prologueSound'))unlockAudio();});
  el('prologueSkip').addEventListener('click',()=>{if(accepting){open(bookId);return;}unlockAudio();showAcceptance();});
  el('replayPrologue').addEventListener('click',()=>open('prologue'));
  el('replayChapterTwo').addEventListener('click',()=>{if(latestState?.ownGift)open('chapter2');});
  el('replayChapterThree').addEventListener('click',()=>{if(latestState?.draw)open('chapter3');});
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
  window.Prologue={
    hasSecondInstruction:id=>hasRead('chapter2',id),
    hasThirdInstruction:id=>hasRead('chapter3',id),
    update(user,state,acceptedCallback){
      const changed=currentUser!==user.$id;if(changed){close();currentUser=user.$id;}
      latestState=state;onAccepted=acceptedCallback;
      if(showing){el('prologue').hidden=false;el('operationContent').hidden=true;return;}
      if(state.draw&&!state.choice&&!hasRead('chapter3'))open('chapter3');
      else if(state.ownGift&&!state.draw&&!state.choice&&!hasRead('chapter2'))open('chapter2');
      else if(changed&&!state.ownGift&&!hasRead('prologue'))open('prologue');
    }
  };
})();
