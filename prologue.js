'use strict';
(()=>{
  const el=id=>document.getElementById(id);
  const scenes=[
    {chapter:'PROLOGUE 01 / ANONYMOUS INVITATION',title:'一封沒有寄件人的邀請',image:'invitation',alt:'深色桌面上，一封帶著雪花封蠟的聖誕邀請函',text:['一封沒有寄件人的聖誕邀請函，悄悄出現在你的收件匣。','裡面只有集合資訊，以及一句話：','「請帶上一份禮物。別讓任何人知道，那是你準備的。」']},
    {chapter:'PROLOGUE 02 / IDENTITY VERIFIED',title:'北極情報局',image:'verification',alt:'神祕辦公室的終端機亮起雪花徽記',text:['當你輸入通行密碼，邀請函上的雪花忽然停住。畫面逐漸暗下，一段加密訊息緩緩浮現。','「身分確認。歡迎加入本次行動，特務。」','訊息末端，一枚雪花徽記亮起。','北極情報局。']},
    {chapter:'PROLOGUE 03 / NEW RENDEZVOUS',title:'新的據點，重新集結',image:'rendezvous',alt:'聖誕夜裡亮著暖光的秘密集合據點',text:['去年，情報局曾以聖誕聚會為掩護，完成一次秘密交接。','今年，新的據點已就緒，召集名單也已重新編組。熟悉的面孔與新加入的特務，將共同參與代號「CHRISTMAS II」的秘密行動。']},
    {chapter:'PROLOGUE 04 / EYES ONLY',title:'第一項指令，現在送達',image:'dossier',alt:'繫著紅緞帶的機密文件與包裝好的聖誕禮物',text:['十二名特務，十二份禮物。','你們將以朋友的身分見面、聊天、交換祝福。沒有人會知道，一份看似普通的聖誕禮物，會把誰帶進什麼樣的任務。','畫面上的雪花再次飄落。','一份標示「僅限本人閱覽」的檔案，出現在你面前。','你的第一項指令，現在送達。']}
  ];
  let currentUser=null,page=0,showing=false;
  const seen=new Set();
  const key=()=>`christmas-prologue-v1:${currentUser}`;
  function hasRead(){if(seen.has(currentUser))return true;try{return localStorage.getItem(key())==='read';}catch{return false;}}
  function render(focus=false){
    const scene=scenes[page];
    el('prologueChapter').textContent=scene.chapter;el('prologueTitle').textContent=scene.title;
    const img=el('prologueImage');img.src=`assets/prologue-${scene.image}.png`;img.alt=scene.alt;
    el('prologueText').replaceChildren(...scene.text.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));
    el('prologuePage').textContent=`${String(page+1).padStart(2,'0')} / 04`;
    el('prologuePrev').disabled=page===0;el('prologueNext').textContent=page===3?'開啟第一項指令':'繼續閱覽';
    if(focus)el('prologueTitle').focus({preventScroll:true});
    el('prologue').classList.remove('sceneEntering');void el('prologue').offsetWidth;el('prologue').classList.add('sceneEntering');
  }
  function open(){page=0;showing=true;el('prologue').hidden=false;el('operationContent').hidden=true;render();}
  function finish(){seen.add(currentUser);try{localStorage.setItem(key(),'read');}catch{}showing=false;el('prologue').hidden=true;el('operationContent').hidden=false;
    // The story only gates presentation. No API writes, progress resets, or
    // automatic gift selections occur when finishing/replaying the prologue.
    document.getElementById('giftForm')?.scrollIntoView({behavior:'auto',block:'start'});
    document.querySelector('#giftForm input:not(:disabled)')?.focus({preventScroll:true});
  }
  el('prologuePrev').addEventListener('click',()=>{if(page>0){page--;render(true);}});
  el('prologueNext').addEventListener('click',()=>{if(page<3){page++;render(true);}else finish();});
  el('replayPrologue').addEventListener('click',open);
  window.Prologue={update(user,state){const id=user.$id;if(currentUser!==id){currentUser=id;showing=false;if(!hasRead()&&!state.ownGift)open();else{el('prologue').hidden=true;el('operationContent').hidden=false;}}else if(showing){el('prologue').hidden=false;el('operationContent').hidden=true;}}};
})();
