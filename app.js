/* =========================
   APPWRITE
========================= */
const APPWRITE_ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "6ab36b1c001036f515ab";
const DATABASE_ID = "christmas-2026";
const TABLES = {
  members: "members",
  targetFiles: "target_files",
  assignments: "assignments",
  settings: "settings",
  rsvp: "rsvp"
};

const client = new Appwrite.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);
const account = new Appwrite.Account(client);
const tablesDB = new Appwrite.TablesDB(client);

let currentUser = null;
let currentMemberId = "";
let authMode = "login";
let redAnswers = {};

function wait(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
function memberEmail(memberId){ return memberId.toLowerCase() + "@christmas.example"; }
function validMemberId(value){ return /^[A-Za-z0-9_-]{3,20}$/.test(value); }
function setMessage(id, text, type="error"){
  const el=document.getElementById(id); if(!el) return;
  el.className="message " + type; el.innerHTML=text;
}
function showOnly(pageId){
  document.querySelectorAll("main.page").forEach(p=>p.classList.add("hidden"));
  document.getElementById(pageId)?.classList.remove("hidden");
  window.scrollTo({top:0,behavior:"instant"});
}

function showAuthMode(mode){
  authMode=mode;
  document.getElementById("loginTab").classList.toggle("active",mode==="login");
  document.getElementById("registerTab").classList.toggle("active",mode==="register");
  document.getElementById("registerOnly").classList.toggle("hidden",mode!=="register");
  document.getElementById("authTitle").textContent=mode==="register"?"CREATE MEMBER ID":"IDENTITY VERIFICATION";
  document.getElementById("authDescription").textContent=mode==="register"?"第一次進入請建立 MEMBER ID、密碼並填寫真實姓名。":"輸入你設定的 MEMBER ID 與密碼。";
  document.getElementById("authButton").textContent=mode==="register"?"建立帳號":"登入系統";
  document.getElementById("memberPassword").autocomplete=mode==="register"?"new-password":"current-password";
  document.getElementById("authMessage").className="message";
  document.getElementById("authMessage").innerHTML="";
}

async function submitAuth(){
  const memberId=document.getElementById("memberId").value.trim();
  const password=document.getElementById("memberPassword").value;
  const realName=document.getElementById("realName").value.trim();
  const button=document.getElementById("authButton");
  if(!validMemberId(memberId)) return setMessage("authMessage","<strong>INVALID MEMBER ID</strong><br>請使用 3–20 位英文、數字、_ 或 -。 ");
  if(password.length<8) return setMessage("authMessage","<strong>INVALID PASSWORD</strong><br>密碼至少需要 8 個字元。");
  if(authMode==="register" && !realName) return setMessage("authMessage","請輸入真實姓名。");
  button.disabled=true; button.textContent="CONNECTING...";
  try{
    if(authMode==="register"){
      currentUser=await account.create({userId:Appwrite.ID.unique(),email:memberEmail(memberId),password,name:memberId});
      await account.createEmailPasswordSession({email:memberEmail(memberId),password});
      currentUser=await account.get();
      await tablesDB.createRow({
        databaseId:DATABASE_ID,tableId:TABLES.members,rowId:currentUser.$id,
        data:{username:memberId,real_name:realName,target_file_complete:false},
        permissions:[
          Appwrite.Permission.read(Appwrite.Role.user(currentUser.$id)),
          Appwrite.Permission.update(Appwrite.Role.user(currentUser.$id))
        ]
      });
      currentMemberId=memberId;
      showOnly("redFilePage");
    }else{
      await account.createEmailPasswordSession({email:memberEmail(memberId),password});
      currentUser=await account.get(); currentMemberId=memberId;
      await routeAfterLogin();
    }
  }catch(error){
    console.error(error);
    let msg="登入／註冊失敗，請確認資料後再試一次。";
    if(error.code===409) msg="這個 MEMBER ID 已經被使用，請改用 LOGIN。";
    if(error.code===401) msg="MEMBER ID 或密碼不正確。";
    setMessage("authMessage","<strong>ACCESS DENIED</strong><br>"+msg);
  }finally{
    button.disabled=false; button.textContent=authMode==="register"?"建立帳號":"登入系統";
  }
}

async function routeAfterLogin(){
  try{
    const member=await tablesDB.getRow({databaseId:DATABASE_ID,tableId:TABLES.members,rowId:currentUser.$id});
    currentMemberId=member.username || currentMemberId;
    if(member.target_file_complete){ await decryptMissionFile(); }
    else showOnly("redFilePage");
  }catch(error){
    console.error(error); await logoutMember();
    setMessage("authMessage","會員資料讀取失敗，請聯絡總召。");
  }
}

async function logoutMember(){
  try{ await account.deleteSession({sessionId:"current"}); }catch(e){}
  currentUser=null; currentMemberId=""; showOnly("loginPage");
}

async function submitRedFile(event){
  event.preventDefault();
  const required=["gender","smoked","has_pet","alcohol_frequency","lifestyle","sweet_preference"];
  for(const key of required){ if(!redAnswers[key]) return setMessage("redFileMessage","尚有選擇題未完成。","error"); }
  const button=document.getElementById("redFileSubmit"); button.disabled=true; button.textContent="TRANSMITTING...";
  const data={
    user_id:currentUser.$id,
    wish:document.getElementById("wish").value.trim(),
    preference:document.getElementById("preference").value.trim(),
    message:document.getElementById("giftMessage").value.trim(),
    gender:redAnswers.gender,
    birthday_range:document.getElementById("birthdayRange").value,
    height_range:document.getElementById("heightRange").value,
    smoked:redAnswers.smoked,
    has_pet:redAnswers.has_pet,
    alcohol_frequency:redAnswers.alcohol_frequency,
    lifestyle:redAnswers.lifestyle,
    sweet_preference:redAnswers.sweet_preference
  };
  try{
    await tablesDB.createRow({
      databaseId:DATABASE_ID,tableId:TABLES.targetFiles,rowId:currentUser.$id,data,
      permissions:[
        Appwrite.Permission.read(Appwrite.Role.user(currentUser.$id)),
        Appwrite.Permission.update(Appwrite.Role.user(currentUser.$id))
      ]
    });
    await tablesDB.updateRow({databaseId:DATABASE_ID,tableId:TABLES.members,rowId:currentUser.$id,data:{target_file_complete:true}});
    setMessage("redFileMessage","<strong>RED FILE ACCEPTED</strong><br>情報檔案已完成。","success");
    await wait(700); await decryptMissionFile();
  }catch(error){
    console.error(error);
    setMessage("redFileMessage","資料傳送失敗。若你已填過 RED FILE，請重新登入。","error");
  }finally{button.disabled=false;button.textContent="SUBMIT RED FILE";}
}

document.addEventListener("click",event=>{
  const button=event.target.closest(".choice-grid button[data-value]");
  if(!button) return;
  const grid=button.closest(".choice-grid");
  grid.querySelectorAll("button").forEach(b=>b.classList.remove("selected"));
  button.classList.add("selected"); redAnswers[grid.dataset.field]=button.dataset.value;
});

document.addEventListener("keydown",event=>{
  if(event.key==="Enter" && !document.getElementById("loginPage").classList.contains("hidden")) submitAuth();
});

window.addEventListener("DOMContentLoaded",async()=>{
  try{
    currentUser=await account.get();
    const member=await tablesDB.getRow({databaseId:DATABASE_ID,tableId:TABLES.members,rowId:currentUser.$id});
    currentMemberId=member.username;
    if(member.target_file_complete) showOnly("missionPage"); else showOnly("redFilePage");
  }catch(e){ showOnly("loginPage"); }
});

/* =========================
   ORIGINAL MISSION FLOW
========================= */
async function decryptMissionFile() {

  const overlay =
    document.getElementById("decryptOverlay");

  const status =
    document.getElementById("decryptStatus");

  const bar =
    document.getElementById("decryptProgressBar");

  const percent =
    document.getElementById("decryptPercent");

  overlay.classList.add("active");

  bar.style.width = "0%";
  percent.textContent = "0%";

  status.textContent =
    "AUTHORIZATION TOKEN ACCEPTED";

  await wait(350);

  bar.style.width = "22%";
  percent.textContent = "22%";

  status.textContent =
    "LOCATING ENCRYPTED MISSION FILE...";

  await wait(350);

  bar.style.width = "47%";
  percent.textContent = "47%";

  status.textContent =
    "DECRYPTING LOCATION DATA...";

  await wait(400);

  bar.style.width = "73%";
  percent.textContent = "73%";

  status.textContent =
    "RECONSTRUCTING CLASSIFIED DOCUMENT...";

  await wait(400);

  bar.style.width = "100%";
  percent.textContent = "100%";

  status.textContent =
    "MISSION FILE DECRYPTED.";

  await wait(550);

  document.querySelectorAll("main.page").forEach(function(page) {
    page.classList.add("hidden");
  });

  document.getElementById("missionPage").classList.remove("hidden");

  const missionFile =
    document.getElementById("missionFile");

  missionFile.classList.remove(
    "mission-reveal"
  );

  void missionFile.offsetWidth;

  missionFile.classList.add(
    "mission-reveal"
  );

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

  overlay.classList.remove("active");

}


/* =========================
   FINAL CONFIRMATION
========================= */

function startFinalConfirmation() {

  document
    .getElementById("missionPage")
    .classList.add("hidden");

  document
    .getElementById("rsvpPage")
    .classList.remove("hidden");

  document
    .getElementById("rsvpAgentCode")
    .textContent =
      currentMemberId;

  populateRoommateOptions();

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

}




/* =========================
   DECLINE MISSION
========================= */

function declineMission() {

  const confirmed = confirm(
    "確定無法參與 PROJECT : CHRISTMAS II？"
  );

  if (!confirmed) return;

  document
    .getElementById("missionPage")
    .classList.add("hidden");

  document
    .getElementById("declinedPage")
    .classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

}


/* =========================
   SNOW
========================= */

const snow =
  document.getElementById("snow");

for (let i = 0; i < 28; i++) {

  const flake =
    document.createElement("span");

  flake.textContent = "•";

  flake.style.left =
    Math.random() * 100 + "%";

  flake.style.fontSize =
    (Math.random() * 14 + 7) + "px";

  flake.style.animationDuration =
    (Math.random() * 8 + 8) + "s";

  flake.style.animationDelay =
    (Math.random() * -15) + "s";

  snow.appendChild(flake);

}

/* =========================
   RSVP STATE
========================= */

const missionResponse = {
  transport: "",
  seats: "",
  lodging: "",
  roommate: "",
  notes: ""
};


/* =========================
   RSVP CHOICES
========================= */

document.addEventListener("click", function(event) {

  const button = event.target.closest(".choice-button");

  if (!button) return;

  const group = button.dataset.group;
  const value = button.dataset.value;

  document
    .querySelectorAll(
      '.choice-button[data-group="' + group + '"]'
    )
    .forEach(function(item) {
      item.classList.remove("selected");
    });

  button.classList.add("selected");

  if (group === "transport") {

    missionResponse.transport = value;

    const seatsBox =
      document.getElementById("driverSeatsBox");

    if (value === "自己開車") {
      seatsBox.classList.remove("hidden");
    }
    else {
      seatsBox.classList.add("hidden");
      document.getElementById("driverSeats").value = "";
      missionResponse.seats = "";
    }

  }

  if (group === "lodging") {

    missionResponse.lodging = value;

    const roommateBox =
      document.getElementById("roommateBox");

    if (value === "希望睡雙人床") {
      roommateBox.classList.remove("hidden");
    }
    else {
      roommateBox.classList.add("hidden");
      document.getElementById("roommateCode").value = "";
      missionResponse.roommate = "";
    }

  }

});


/* =========================
   ROOMMATE OPTIONS
========================= */

function populateRoommateOptions() {
  const input = document.getElementById("roommateCode");
  if (input) input.value = "";
}


/* =========================
   REVIEW RESPONSE
========================= */

function reviewMissionResponse() {

  const message =
    document.getElementById("rsvpMessage");

  missionResponse.seats =
    document.getElementById("driverSeats").value;

  missionResponse.roommate =
    document.getElementById("roommateCode").value;

  missionResponse.notes =
    document.getElementById("notes").value.trim();

  if (!missionResponse.transport) {
    showRsvpError("請先選擇交通方式。");
    return;
  }

  if (
    missionResponse.transport === "自己開車" &&
    missionResponse.seats === ""
  ) {
    showRsvpError("請選擇你可以額外載幾位。");
    return;
  }

  if (!missionResponse.lodging) {
    showRsvpError("請先選擇住宿偏好。");
    return;
  }

  if (
    missionResponse.lodging === "希望睡雙人床" &&
    !missionResponse.roommate
  ) {
    showRsvpError("請選擇希望共用雙人床的行動成員。");
    return;
  }

  message.classList.add("hidden");

  const agent =
    currentMemberId;

  document.getElementById("reviewAgent")
    .textContent = agent;

  document.getElementById("reviewTransport")
    .textContent = missionResponse.transport;

  const seatsRow =
    document.getElementById("reviewSeatsRow");

  if (missionResponse.transport === "自己開車") {
    seatsRow.classList.remove("hidden");
    document.getElementById("reviewSeats")
      .textContent =
        missionResponse.seats === "5"
          ? "5 位以上"
          : missionResponse.seats + " 位";
  }
  else {
    seatsRow.classList.add("hidden");
  }

  document.getElementById("reviewLodging")
    .textContent = missionResponse.lodging;

  const roommateRow =
    document.getElementById("reviewRoommateRow");

  if (missionResponse.lodging === "希望睡雙人床") {
    roommateRow.classList.remove("hidden");
    document.getElementById("reviewRoommate")
      .textContent = missionResponse.roommate;
  }
  else {
    roommateRow.classList.add("hidden");
  }

  document.getElementById("reviewNotes")
    .textContent =
      missionResponse.notes || "無";

  document.getElementById("rsvpPage")
    .classList.add("hidden");

  document.getElementById("reviewPage")
    .classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

}


function showRsvpError(text) {

  const message =
    document.getElementById("rsvpMessage");

  message.textContent = text;
  message.classList.remove("hidden");

  message.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}


/* =========================
   BACK TO RSVP
========================= */

function backToRsvp() {

  document.getElementById("reviewPage")
    .classList.add("hidden");

  document.getElementById("rsvpPage")
    .classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

}


/* =========================
   SUBMIT RESPONSE
========================= */

let submittingMissionResponse = false;

async function submitMissionResponse() {
  if (submittingMissionResponse) return;

  const agent = currentMemberId;
  const submitButton = document.querySelector(
    '#reviewPage button[onclick="submitMissionResponse()"]'
  );

  submittingMissionResponse = true;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.dataset.originalText = submitButton.textContent;
    submitButton.textContent = "TRANSMITTING...";
  }

  const payload = {
    name: agent,
    travel: missionResponse.transport,
    people: missionResponse.transport === "自己開車"
      ? Number(missionResponse.seats)
      : null,
    stay_pref: missionResponse.lodging,
    roommate: missionResponse.lodging === "希望睡雙人床"
      ? missionResponse.roommate
      : null,
    note: missionResponse.notes || null
  };

  try {
    await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.rsvp,
      rowId: Appwrite.ID.unique(),
      data: payload,
      permissions: [
        Appwrite.Permission.read(Appwrite.Role.user(currentUser.$id)),
        Appwrite.Permission.update(Appwrite.Role.user(currentUser.$id))
      ]
    });

    document.getElementById("successAgent").textContent = agent;
    document.getElementById("reviewPage").classList.add("hidden");
    document.getElementById("successPage").classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "instant" });
  }
  catch (error) {
    console.error("RSVP submission failed:", error);
    alert("資料傳送失敗，請確認網路連線後再試一次。");
  }
  finally {
    submittingMissionResponse = false;

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent =
        submitButton.dataset.originalText || "確認提交";
    }
  }
}
