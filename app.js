'use strict';
const $=id=>document.getElementById(id);
let account,functions,user,state,busy=false,photoData=null;
const blobs=new Map();
function notice(message,error=false){$('message').hidden=false;$('message').classList.toggle('error',error);$('message').textContent=message;}
async function api(path,body){
  const execution=await functions.createExecution({
    functionId:window.CHRISTMAS_CONFIG.functionId,
    body:JSON.stringify({action:path,data:body??{}}),async:false
  });
  if(execution.status!=='completed')throw new Error('雲端函式尚未完成，請更新狀態確認；必要時再重試。');
  let data;try{data=JSON.parse(execution.responseBody);}catch{throw new Error('雲端函式回應不正確，請管理員檢查部署。');}
  if(execution.responseStatusCode>=400||data.error){const error=new Error(data.error||'操作失敗');error.status=execution.responseStatusCode;throw error;}return data;
}
async function action(fn){if(busy)return;busy=true;document.body.setAttribute('aria-busy','true');try{await fn();}catch(error){notice(error.message||'操作失敗，請稍後再試',true);}finally{busy=false;document.body.removeAttribute('aria-busy');}}
let imageGeneration=0;
const pendingImages=new Map();
function clearImages(){imageGeneration++;for(const url of blobs.values())URL.revokeObjectURL(url);blobs.clear();pendingImages.clear();}
async function loadPhoto(img,path){
  const generation=imageGeneration;
  try{
    if(!blobs.has(path)&&!pendingImages.has(path)){
      const pending=(async()=>{
        const result=await api(path);const blob=await (await fetch(result.image)).blob();if(generation!==imageGeneration)return null;
        const url=URL.createObjectURL(blob);blobs.set(path,url);return url;
      })();
      pendingImages.set(path,pending);
      pending.finally(()=>{if(pendingImages.get(path)===pending)pendingImages.delete(path);}).catch(()=>{});
    }
    const url=blobs.get(path)||await pendingImages.get(path);if(url&&generation===imageGeneration)img.src=url;
  }catch{img.alt='照片載入失敗，請按更新狀態重試';}
}
function image(gift,className=''){const img=document.createElement('img');img.alt='包裝好的匿名禮物照片';img.className=className;loadPhoto(img,gift.image);return img;}
function node(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function card(gift,{admin=false}={}){
  const article=node('article',undefined,'card');const fileTag=node('div','CLASSIFIED FILE / '+gift.id.slice(-4).toUpperCase(),'giftFileTag');article.append(fileTag,image(gift));const body=node('div',undefined,'cardBody');
  if(admin)body.append(node('p',`提供者：${gift.owner}`, 'small'));
  const chips=node('div',undefined,'chips');gift.hints.forEach(h=>chips.append(node('span',h,'chip')));body.append(chips);
  if(!admin){const button=node('button',gift.isOwn?'本人提交 · 不可選取':state.choice?(state.choice.giftId===gift.id?'目標已鎖定 · 密令已接收':'已接收其他目標'):'選定目標 · 確認接收');button.disabled=gift.isOwn||!!state.choice;button.addEventListener('click',()=>confirmGift(gift.id));body.append(button);}
  article.append(body);return article;
}
function view(admin){$('adminView').hidden=!admin;$('memberView').hidden=admin;$('adminTab').classList.toggle('quiet',!admin);$('memberTab').classList.toggle('quiet',admin);}
function render(fillForms=false){
  $('login').hidden=true;$('game').hidden=false;$('session').hidden=false;
  $('who').textContent=`${user.name||'活動成員'}${state.isAdmin?' · 管理員':''}`;
  const phase=state.phase,prepare=phase==='prepare',published=phase==='published';
  $('phaseText').textContent={prepare:'情報收集中｜提交照片與三個提示詞，等待指揮官開放密令抽取。',drawing:'密令配發中｜抽取後只顯示編號。保持身分隱密，等待指揮官公開匿名情報。',published:'匿名情報已解封｜根據照片與提示詞選定禮物。確認鎖定後，才可接收對應的任務。'}[phase];
  ['step1','step2','step3'].forEach((id,i)=>$(id).classList.toggle('active',i===({prepare:0,drawing:1,published:2}[phase])));
  $('ownPreview').replaceChildren();if(state.ownGift)$('ownPreview').append(image(state.ownGift,'ownImage'));
  for(const input of $('giftForm').elements)input.disabled=!prepare;
  $('giftNote').textContent=prepare?'抽取開放前可修訂情報。按下提交才會儲存，目前僅本人與指揮官可查閱。':'密令抽取已開放，禮物情報已封存，不能再修改。';
  if(fillForms&&state.ownGift)state.ownGift.hints.forEach((h,i)=>$(`hint${i+1}`).value=h);
  $('drawStatus').textContent=state.draw?`任務 ${state.draw} · 密令封存中`:'密令尚未配發';
  $('drawButton').disabled=phase!=='drawing'||!!state.draw||!state.ownGift;
  $('drawButton').textContent=state.draw?'密令已配發 · 內容封存':'抽取密令 · 保持封存';
  $('galleryTitle').textContent=published?(state.choice?'匿名禮物情報庫':'選一份禮物，接下秘密任務。'):'匿名禮物，等待公開。';
  $('heroMissionTitle').textContent=state.choice?'你的秘密任務，已送達。':'你的秘密任務，等待揭曉。';
  $('galleryNote').textContent=published?(state.choice?'你已鎖定禮物。仍可瀏覽照片與提示詞，但無法更換選擇。':'根據照片與三個提示詞，挑選你喜歡的禮物。不能選自己的禮物，同一份可被多人選擇；確認鎖定後，才會揭曉任務，且不能更換。'):'禮物情報尚未公開。等指揮官開放後，就能查看大家的照片與三個提示詞，挑選你喜歡的禮物。';
  $('gifts').replaceChildren(...state.gifts.map(g=>card(g)));
  $('locked').hidden=!state.choice;
  if(state.choice){$('missionNumber').textContent=`密令 ${state.choice.number} / 行動內容`;$('missionContent').textContent=state.choice.content;$('lockedGift').replaceChildren(card(state.gifts.find(g=>g.id===state.choice.giftId)));}
  $('adminTab').hidden=!state.isAdmin;
  window.Prologue?.update(user,state);
  if(!state.isAdmin){$('adminView').hidden=true;return;}
  const a=state.admin,submitted=a.members.filter(m=>m.giftId).length,drawn=a.members.filter(m=>m.draw).length,locked=a.members.filter(m=>m.choice).length;
  $('counts').replaceChildren(...[`成員 ${a.members.length}/12`,`禮物 ${submitted}/12`,`任務 ${drawn}/12`,`鎖定 ${locked}/12`].map(t=>node('span',t)));
  $('openDraw').disabled=!prepare||a.members.length!==12||submitted!==12||a.tasks.length!==12;
  $('publish').disabled=phase!=='drawing'||drawn!==12;
  if(!$('taskInputs').children.length){for(let i=1;i<=12;i++){const label=node('label',`密令 ${String(i).padStart(2,'0')}`),area=node('textarea');area.id=`task${i}`;area.required=true;area.maxLength=2000;label.append(area);$('taskInputs').append(label);}}
  for(let i=1;i<=12;i++){const field=$(`task${i}`);field.disabled=!prepare;if(fillForms)field.value=a.tasks.find(t=>t.number===i)?.content??'';}$('saveTasks').disabled=!prepare;
  const giftMap=new Map(a.gifts.map((g,i)=>[g.id,`禮物 ${i+1}（${g.owner}）`]));
  $('members').replaceChildren(...a.members.map(m=>{const tr=node('tr');[m.account?`${m.label||m.id}（${m.account}）`:m.label||m.id,m.giftId?'已登錄':'未登錄',m.draw?`任務 ${m.draw}`:'未抽取',m.choice?giftMap.get(m.choice):'未鎖定'].forEach(t=>tr.append(node('td',t)));return tr;}));
  $('adminGifts').replaceChildren(...a.gifts.map(g=>card(g,{admin:true})));
}
async function refresh(fill=false){state=await api('state');render(fill);}
async function confirmGift(giftId){
  if(busy||state.choice)return;
  const dialog=$('confirmLock');dialog.returnValue='';dialog.showModal();
  dialog.addEventListener('close',()=>{if(dialog.returnValue==='lock')action(async()=>{await api('lock',{giftId});await refresh();notice('目標已鎖定。密令已交付，請詳閱行動內容。');$('locked').scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});window.AgentFX?.reveal('MISSION UNSEALED','接收確認 · 密令交付完成');});},{once:true});
}
$('memberTab').addEventListener('click',()=>view(false));$('adminTab').addEventListener('click',()=>view(true));
$('refresh').addEventListener('click',()=>action(async()=>{clearImages();if(!state)await enterActivity();else await refresh();notice('情報同步完成。');}));
function showAuth(register){
  if(busy)return;
  $('loginForm').hidden=register;$('registerForm').hidden=!register;
  $('loginTab').classList.toggle('quiet',register);$('registerTab').classList.toggle('quiet',!register);
  $('loginTab').setAttribute('aria-pressed',String(!register));$('registerTab').setAttribute('aria-pressed',String(register));
  $('password').value='';$('registerPassword').value='';$('registerConfirm').value='';
}
$('loginTab').addEventListener('click',()=>showAuth(false));$('registerTab').addEventListener('click',()=>showAuth(true));
function validUsername(value){if(!/^[A-Za-z0-9_-]{3,20}$/.test(value))throw new Error('請輸入 3–20 位英文、數字、_ 或 - 的帳號');}
function clearPasswords(){for(const id of ['password','registerPassword','registerConfirm'])$(id).value='';}
async function enterActivity(fill=true){
  await api('join',{});await refresh(fill);clearPasswords();window.AgentFX?.access();
}
function showSignedInRecovery(){
  $('login').hidden=false;$('game').hidden=true;$('session').hidden=false;
  $('who').textContent=user?.name||'目前登入的帳號';
}
$('loginForm').addEventListener('submit',e=>{e.preventDefault();action(async()=>{
  const name=$('username').value.trim();validUsername(name);const email=`${name.toLowerCase()}@christmas.example`;
  try{await account.createEmailPasswordSession({email,password:$('password').value});}
  catch(error){
    const existing=await account.get().catch(()=>null);
    if(!existing||existing.email?.toLowerCase()!==email)throw new Error(existing?'請先登出目前的帳號，再登入另一個帳號。':'登入失敗，請確認帳號密碼。');
  }
  user=await account.get();
  try{await enterActivity();$('message').hidden=true;}catch(error){showSignedInRecovery();clearPasswords();throw error;}
});});
$('registerForm').addEventListener('submit',e=>{e.preventDefault();action(async()=>{
  const name=$('registerUsername').value.trim();validUsername(name);
  const nickname=$('registerName').value.trim(),password=$('registerPassword').value;
  if(!nickname||nickname.length>30)throw new Error('請填寫 1–30 字的姓名或暱稱');
  if(password.length<8||password.length>256)throw new Error('密碼需為 8–256 個字元');
  if(password!==$('registerConfirm').value)throw new Error('兩次密碼不同，請重新確認');
  const email=`${name.toLowerCase()}@christmas.example`;
  let created=false;
  try{
    const active=await account.get().catch(()=>null);
    if(active){user=active;showSignedInRecovery();throw new Error('目前已有登入的帳號，請先登出再建立新帳號。');}
    await account.create({userId:Appwrite.ID.unique(),email,password,name:nickname});created=true;
    await account.createEmailPasswordSession({email,password});user=await account.get();
    await enterActivity();notice('特務檔案建立完成。歡迎加入行動，請提交你的禮物情報。');
  }catch(error){
    if(created){
      clearPasswords();$('username').value=name;
      if(user)showSignedInRecovery();
      throw new Error(`帳號已建立。${error.message} 若尚未加入，之後請用剛設定的帳號密碼登入重試，不必重新註冊。`);
    }
    if(error.code===409)throw new Error('這個帳號已被使用，請換一個帳號，或切換「登入」。');
    if(error.type==='user_count_exceeded'||error.type==='user_limit_exceeded')throw new Error('註冊名額已滿，請聯絡管理員。');
    if(error.code===429)throw new Error('註冊操作太頻繁，請稍後再試。');
    throw error;
  }finally{if(created)clearPasswords();}
});});
$('logout').addEventListener('click',()=>action(async()=>{await account.deleteSession({sessionId:'current'});user=null;state=null;photoData=null;clearImages();location.assign('./');}));
$('photo').addEventListener('change',()=>action(async()=>{
  photoData=null;const file=$('photo').files[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024){$('photo').value='';throw new Error('請選擇 12 MB 以下的 JPG、PNG 或 WebP 照片');}
  const bitmap=await createImageBitmap(file);try{
    const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    for(const quality of [.85,.75,.65,.5]){photoData=canvas.toDataURL('image/jpeg',quality);if(photoData.length<=790000)break;}
    if(photoData.length>790000){photoData=null;throw new Error('照片壓縮後仍過大，請換一張較小的照片');}
    $('ownPreview').replaceChildren();const preview=node('img');preview.src=photoData;preview.alt='尚未儲存的禮物照片預覽';preview.className='ownImage';$('ownPreview').append(preview);notice('照片已準備好，請填寫提示詞並按儲存。');
  }finally{bitmap.close();}
}));
$('giftForm').addEventListener('submit',e=>{e.preventDefault();action(async()=>{
  if(!photoData&&!state.ownGift)throw new Error('請先選擇包裝好的禮物照片');
  await api('gift',{...(photoData?{image:photoData}:{}),hints:[1,2,3].map(i=>$(`hint${i}`).value.trim())});photoData=null;$('photo').value='';clearImages();await refresh();notice('情報提交成功。影像與三個線索已封存。');
});});
$('drawButton').addEventListener('click',()=>action(async()=>{await api('draw',{});await refresh();notice('密令抽取完成。請保守祕密，內容持續封存。');window.AgentFX?.reveal('MISSION ASSIGNED','密令配發完畢 · 內容保持機密');}));
$('tasksForm').addEventListener('submit',e=>{e.preventDefault();action(async()=>{await api('admin/tasks',{tasks:Array.from({length:12},(_,i)=>$(`task${i+1}`).value.trim())});await refresh();notice('十二道密令已封存，等待指揮官下達抽取指令。');});});
$('openDraw').addEventListener('click',()=>{if(confirm('確定開放抽任務？開放後，禮物資料與任務內容將不能修改。'))action(async()=>{await api('admin/open',{});await refresh();notice('指令已下達，特務可以開始抽取密令。');});});
$('publish').addEventListener('click',()=>{if(confirm('確定公開全部禮物的照片與提示詞，並開放鎖定選擇？'))action(async()=>{await api('admin/publish',{});await refresh();notice('封鎖已解除，匿名情報庫開放查閱。');});});
async function init(){
  try{
    const config=window.CHRISTMAS_CONFIG;
    if(!config?.endpoint||!config.project||!config.functionId)throw new Error('請先完成 config.js 的 Appwrite 設定');
    if(!window.Appwrite)throw new Error('登入元件載入失敗，請確認網路後重新整理');
    const client=new Appwrite.Client().setEndpoint(config.endpoint).setProject(config.project);
    account=new Appwrite.Account(client);functions=new Appwrite.Functions(client);
    user=await account.get().catch(()=>null);
    if(user){try{await enterActivity();if(location.pathname.endsWith('/admin.html')&&state.isAdmin)view(true);}catch(error){showSignedInRecovery();throw error;}}
  }catch(error){notice(error.message,true);}
}
init();
