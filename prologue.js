'use strict';
(()=>{
  const el=id=>document.getElementById(id);
  const scenes=[
    {chapter:'PROLOGUE 01 / ANONYMOUS INVITATION',title:'一封沒有寄件人的邀請',image:'invitation',alt:'深色桌面上，一封帶著雪花封蠟的聖誕邀請函',text:['一封沒有寄件人的聖誕邀請函，悄悄出現在你的收件匣。','裡面只有集合資訊，以及一句話：','「請帶上一份禮物。別讓任何人知道，那是你準備的。」']},
    {chapter:'PROLOGUE 02 / IDENTITY VERIFIED',title:'北極情報局',image:'verification',alt:'神祕辦公室的終端機亮起雪花徽記',text:['當你輸入通行密碼，邀請函上的雪花忽然停住。畫面逐漸暗下，一段加密訊息緩緩浮現。','「身分確認。歡迎加入本次行動，特務。」','訊息末端，一枚雪花徽記亮起。','北極情報局。']},
    {chapter:'PROLOGUE 03 / NEW RENDEZVOUS',title:'新的據點，重新集結',image:'rendezvous',alt:'聖誕夜裡亮著暖光的秘密集合據點',text:['去年，情報局曾以聖誕聚會為掩護，完成一次秘密交接。','今年，新的據點已就緒，召集名單也已重新編組。熟悉的面孔與新加入的特務，將共同參與代號「CHRISTMAS II」的秘密行動。']},
    {chapter:'PROLOGUE 04 / EYES ONLY',title:'第一項指令，現在送達',image:'dossier',alt:'繫著紅緞帶的機密文件與包裝好的聖誕禮物',text:['十二名特務，十二份禮物。','你們將以朋友的身分見面、聊天、交換祝福。沒有人會知道，一份看似普通的聖誕禮物，會把誰帶進什麼樣的任務。','畫面上的雪花再次飄落。','一份標示「僅限本人閱覽」的檔案，出現在你面前。','你的第一項指令，現在送達。']}
  ];
  const INTRO_DURATION=6500, TYPE_SPEED=62, TRANSITION=1100;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentUser=null,page=-1,showing=false,paused=false,elapsed=0,last=0,frame=0,typed=-1;
  let paragraphs=[],characters=[],resumeFocus=null;
  const seen=new Set();
  let preloaded=false;
  function preload(){if(preloaded||!window.Image)return;preloaded=true;scenes.forEach(data=>{const image=new window.Image();image.src=`assets/prologue-${data.image}.png`;});}
  const key=()=>`christmas-prologue-v1:${currentUser}`;
  function hasRead(){if(seen.has(currentUser))return true;try{return localStorage.getItem(key())==='read';}catch{return false;}}
  function pause(value){paused=value;el('prologuePause').textContent=paused?'繼續播放':'暫停播放';el('prologuePause').setAttribute('aria-pressed',String(paused));el('prologue').dataset.paused=String(paused);}
  function duration(){return reduced?0:characters.length*TYPE_SPEED;}
  function hold(){return page===3?7000:5500;}
  function paintText(count){
    if(typed===count)return;typed=count;let offset=0;const story=el('prologueStory'),follow=story.scrollHeight-story.scrollTop-story.clientHeight<50;
    paragraphs.forEach((p,i)=>{const length=Array.from(scenes[page].text[i]).length;p.textContent=characters.slice(offset,offset+Math.max(0,Math.min(length,count-offset))).join('');offset+=length;});
    paragraphs.forEach(p=>p.classList.remove('typingLine'));
    (paragraphs.filter(p=>p.textContent).pop()||paragraphs[0])?.classList.add('typingLine');
    el('prologueText').classList.toggle('isTyping',count<characters.length);
    if(follow)story.scrollTop=story.scrollHeight;
  }
  function scene(index,focus=false){
    page=index;elapsed=0;typed=-1;
    const shell=el('prologue');shell.dataset.mode=index<0?'intro':'story';
    el('prologueIntro').hidden=index>=0;el('prologueStory').hidden=index<0;
    el('prologuePrev').disabled=index<=0;
    el('prologueNext').textContent=index<0?'開始閱覽':index===3?'開啟第一項指令':'下一幕';
    el('prologuePage').textContent=index<0?'PROLOGUE / 序章':`${String(index+1).padStart(2,'0')} / 04`;
    el('prologueProgress').style.width='0%';
    if(index>=0){
      const data=scenes[index];
      // Two layers crossfade without blanking the current image while loading.
      const previous=el('prologueImagePrevious'),img=el('prologueImage');
      previous.src=img.getAttribute('src')||`assets/prologue-${data.image}.png`;
      img.src=`assets/prologue-${data.image}.png`;img.alt=data.alt;
      el('prologueChapter').textContent=data.chapter;el('prologueTitle').textContent=data.title;
      characters=Array.from(data.text.join(''));paragraphs=data.text.map(()=>document.createElement('p'));
      el('prologueText').replaceChildren(...paragraphs);el('prologueAccessibleText').textContent=data.text.join('\n');
      paintText(reduced?characters.length:0);el('prologueStory').scrollTop=0;
      shell.classList.remove('sceneEntering');void shell.offsetWidth;shell.classList.add('sceneEntering');
      if(focus)el('prologueTitle').focus({preventScroll:true});
    }else{shell.classList.remove('introEntering');void shell.offsetWidth;shell.classList.add('introEntering');}
  }
  function tick(now){
    if(!showing)return;
    // Background tabs and paused playback never consume reading time.
    const delta=last?Math.min(now-last,100):0;last=now;
    if(!paused&&!document.hidden){
      elapsed+=delta;
      if(page<0){el('prologueProgress').style.width=`${Math.min(100,elapsed/INTRO_DURATION*100)}%`;if(elapsed>=INTRO_DURATION)scene(0);}
      else{
        paintText(reduced?characters.length:Math.min(characters.length,Math.floor(Math.max(0,elapsed-TRANSITION)/TYPE_SPEED)));
        const total=TRANSITION+duration()+hold();el('prologueProgress').style.width=`${Math.min(100,elapsed/total*100)}%`;
        if(elapsed>=total){if(page<3)scene(page+1);else finish();}
      }
    }
    if(showing)frame=requestAnimationFrame(tick);
  }
  function open(){
    preload();cancelAnimationFrame(frame);resumeFocus=document.activeElement;showing=true;last=0;
    el('prologue').hidden=false;el('operationContent').hidden=true;
    document.body.classList.add('prologue-playing');el('prologue').setAttribute('aria-modal','true');
    pause(false);scene(-1);el('prologuePause').focus({preventScroll:true});frame=requestAnimationFrame(tick);
  }
  function close(){showing=false;cancelAnimationFrame(frame);document.body.classList.remove('prologue-playing');el('prologue').hidden=true;el('operationContent').hidden=false;}
  function finish(){
    seen.add(currentUser);try{localStorage.setItem(key(),'read');}catch{}
    close();
    // Presentation only: no API writes or gift/game state changes.
    const input=document.querySelector('#giftForm input:not(:disabled)');
    if(input){el('memberTab').click();el('giftForm').scrollIntoView({behavior:'auto',block:'start'});input.focus({preventScroll:true});}
    else if(resumeFocus?.isConnected)resumeFocus.focus({preventScroll:true});
  }
  el('prologuePrev').addEventListener('click',()=>{if(page>0)scene(page-1,true);});
  el('prologueNext').addEventListener('click',()=>{
    if(page<0){scene(0,true);return;}
    if(typed<characters.length){elapsed=TRANSITION+duration();paintText(characters.length);return;}
    if(page<3)scene(page+1,true);else finish();
  });
  el('prologuePause').addEventListener('click',()=>pause(!paused));
  el('prologueSkip').addEventListener('click',finish);
  el('replayPrologue').addEventListener('click',open);
  el('prologue').addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();finish();return;}
    if(event.key==='Tab'){
      const buttons=Array.from(el('prologue').querySelectorAll('button:not(:disabled)'));
      const first=buttons[0],lastButton=buttons[buttons.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastButton.focus();}
      else if(!event.shiftKey&&document.activeElement===lastButton){event.preventDefault();first.focus();}
    }
  });
  window.Prologue={update(user,state){
    const id=user.$id;
    if(currentUser!==id){close();currentUser=id;if(!hasRead()&&!state.ownGift)open();}
    else if(showing){el('prologue').hidden=false;el('operationContent').hidden=true;}
  }};
})();
