const APPWRITE_ENDPOINT="https://sgp.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID="6ab36b1c001036f515ab";
const DATABASE_ID="christmas-2026";
const TABLES={members:"members",targetFiles:"target_files",assignments:"assignments",settings:"settings"};
const client=new Appwrite.Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
const account=new Appwrite.Account(client);
const tablesDB=new Appwrite.TablesDB(client);
let currentUser=null,currentMemberId="",authMode="login",redAnswers={};

const wait=ms=>new Promise(r=>setTimeout(r,ms));
const memberEmail=id=>id.toLowerCase()+"@christmas.example";
const validMemberId=v=>/^[A-Za-z0-9_-]{3,20}$/.test(v);
function setMessage(id,text,type="error"){const e=document.getElementById(id);if(!e)return;e.className="message "+type;e.innerHTML=text}
function showOnly(id){
  document.querySelectorAll("main.page").forEach(p=>p.classList.add("hidden"));
  document.getElementById(id)?.classList.remove("hidden");
  const memberPages=["myFilePage","lodgingPage","targetPage","redLockedPage"];
  document.getElementById("folderTabs")?.classList.toggle("hidden",!currentUser||!memberPages.includes(id));
  window.scrollTo({top:0,behavior:"instant"});
}
function showAuthMode(mode){
  authMode=mode;
  loginTab.classList.toggle("active",mode==="login");registerTab.classList.toggle("active",mode==="register");
  registerOnly.classList.toggle("hidden",mode!=="register");
  authTitle.textContent=mode==="register"?"CREATE MEMBER ID":"IDENTITY VERIFICATION";
  authDescription.textContent=mode==="register"?"第一次進入請建立 MEMBER ID、密碼並填寫真實姓名。":"輸入你設定的 MEMBER ID 與密碼。";
  authButton.textContent=mode==="register"?"建立帳號":"登入系統";
  memberPassword.autocomplete=mode==="register"?"new-password":"current-password";
  authMessage.textContent="";
}
async function submitAuth(){
  const id=memberId.value.trim(),pw=memberPassword.value,name=realName.value.trim();
  if(!validMemberId(id))return setMessage("authMessage","MEMBER ID 請使用 3–20 位英文、數字、_ 或 -。");
  if(pw.length<8)return setMessage("authMessage","密碼至少需要 8 個字元。");
  if(authMode==="register"&&!name)return setMessage("authMessage","請輸入真實姓名。");
  authButton.disabled=true;authButton.textContent="CONNECTING...";
  try{
    // 防止殘留 session 造成 createEmailPasswordSession 衝突
    try{await account.deleteSession({sessionId:"current"})}catch(e){}
    if(authMode==="register"){
      currentUser=await account.create({userId:Appwrite.ID.unique(),email:memberEmail(id),password:pw,name:id});
      await account.createEmailPasswordSession({email:memberEmail(id),password:pw});
      currentUser=await account.get();
      await tablesDB.createRow({databaseId:DATABASE_ID,tableId:TABLES.members,rowId:currentUser.$id,
        data:{username:id,real_name:name,target_file_complete:false},
        permissions:[Appwrite.Permission.read(Appwrite.Role.user(currentUser.$id)),Appwrite.Permission.update(Appwrite.Role.user(currentUser.$id))]});
      currentMemberId=id;showOnly("redFilePage");
    }else{
      await account.createEmailPasswordSession({email:memberEmail(id),password:pw});
      currentUser=await account.get();currentMemberId=id;await routeAfterLogin();
    }
  }catch(error){
    console.error(error);
    let msg="登入／註冊失敗，請確認資料後再試一次。";
    if(error.code===409)msg="這個 MEMBER ID 已經被使用，請改用 LOGIN。";
    if(error.code===401)msg="MEMBER ID 或密碼不正確。";
    setMessage("authMessage","<strong>ACCESS DENIED</strong><br>"+msg);
  }finally{authButton.disabled=false;authButton.textContent=authMode==="register"?"建立帳號":"登入系統"}
}
async function routeAfterLogin(){
  try{
    const m=await tablesDB.getRow({databaseId:DATABASE_ID,tableId:TABLES.members,rowId:currentUser.$id});
    currentMemberId=m.username||currentMemberId;
    if(m.target_file_complete)await openFileTab("myFile");else showOnly("redFilePage");
  }catch(e){console.error(e);await logoutMember();setMessage("authMessage","會員資料讀取失敗，請聯絡總召。")}
}
async function logoutMember(){
  try{await account.deleteSession({sessionId:"current"})}catch(e){}
  currentUser=null;currentMemberId="";folderTabs?.classList.add("hidden");showOnly("loginPage");
}
async function submitRedFile(event){
  event.preventDefault();
  for(const k of ["gender","smoked","has_pet","alcohol_frequency","lifestyle","sweet_preference"])
    if(!redAnswers[k])return setMessage("redFileMessage","尚有選擇題未完成。");
  redFileSubmit.disabled=true;redFileSubmit.textContent="TRANSMITTING...";
  const data={user_id:currentUser.$id,wish:wish.value.trim(),preference:preference.value.trim(),message:giftMessage.value.trim(),
    gender:redAnswers.gender,birthday_range:birthdayRange.value,height_range:heightRange.value,smoked:redAnswers.smoked,
    has_pet:redAnswers.has_pet,alcohol_frequency:redAnswers.alcohol_frequency,lifestyle:redAnswers.lifestyle,sweet_preference:redAnswers.sweet_preference};
  try{
    await tablesDB.createRow({databaseId:DATABASE_ID,tableId:TABLES.targetFiles,rowId:currentUser.$id,data,
      permissions:[Appwrite.Permission.read(Appwrite.Role.user(currentUser.$id)),Appwrite.Permission.update(Appwrite.Role.user(currentUser.$id))]});
    await tablesDB.updateRow({databaseId:DATABASE_ID,tableId:TABLES.members,rowId:currentUser.$id,data:{target_file_complete:true}});
    setMessage("redFileMessage","<strong>FILE ACCEPTED</strong><br>情報檔案已完成。","success");await wait(500);await openFileTab("myFile");
  }catch(e){console.error(e);setMessage("redFileMessage","資料傳送失敗。若你已填過檔案，請重新登入。")}
  finally{redFileSubmit.disabled=false;redFileSubmit.textContent="SUBMIT FILE"}
}
document.addEventListener("click",e=>{
  const b=e.target.closest(".choices button[data-value]");if(!b)return;
  const g=b.closest(".choices");g.querySelectorAll("button").forEach(x=>x.classList.remove("selected"));
  b.classList.add("selected");redAnswers[g.dataset.field]=b.dataset.value;
});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&!loginPage.classList.contains("hidden"))submitAuth()});

function setActiveFileTab(tab){document.querySelectorAll("#folderTabs [data-file-tab]").forEach(b=>b.classList.toggle("active",b.dataset.fileTab===tab))}
async function loadMyFile(){
  const [m,f]=await Promise.all([
    tablesDB.getRow({databaseId:DATABASE_ID,tableId:TABLES.members,rowId:currentUser.$id}),
    tablesDB.getRow({databaseId:DATABASE_ID,tableId:TABLES.targetFiles,rowId:currentUser.$id})
  ]);
  const v={myFileNo:(m.username||"---").toUpperCase(),myRealName:m.real_name||"---",myMemberId:m.username||"---",
    myWish:f.wish||"---",myPreference:f.preference||"---",myGiftMessage:f.message||"---",myGender:f.gender||"---",
    myBirthday:f.birthday_range||"---",myHeight:f.height_range||"---",mySmoked:f.smoked||"---",myPet:f.has_pet||"---",
    myAlcohol:f.alcohol_frequency||"---",myLifestyle:f.lifestyle||"---",mySweet:f.sweet_preference||"---"};
  Object.entries(v).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=val});
}
async function openFileTab(tab){
  if(!currentUser)return showOnly("loginPage");
  setActiveFileTab(tab);
  if(tab==="myFile"){showOnly("myFilePage");try{await loadMyFile()}catch(e){console.error(e)}}
  else if(tab==="lodging")showOnly("lodgingPage");
  else if(tab==="target")showOnly("targetPage");
  else if(tab==="red")showOnly("redLockedPage");
}
function createSnow(){
  const s=document.getElementById("snow");if(!s)return;
  for(let i=0;i<24;i++){const f=document.createElement("span");f.textContent="•";f.style.left=Math.random()*100+"%";
    f.style.fontSize=(Math.random()*12+6)+"px";f.style.animationDuration=(Math.random()*8+8)+"s";f.style.animationDelay=(Math.random()*-15)+"s";s.appendChild(f)}
}

/* IMPORTANT: every load/refresh requires login again. */
window.addEventListener("DOMContentLoaded",async()=>{
  createSnow();
  try{await account.deleteSession({sessionId:"current"})}catch(e){}
  currentUser=null;currentMemberId="";document.getElementById("folderTabs")?.classList.add("hidden");showOnly("loginPage");
});
