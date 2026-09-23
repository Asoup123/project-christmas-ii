const APPWRITE_ENDPOINT =
  "https://sgp.cloud.appwrite.io/v1";

const APPWRITE_PROJECT_ID =
  "6ab36b1c001036f515ab";

const DATABASE_ID =
  "christmas-2026";

const TABLES = {
  members:"members",
  targetFiles:"target_files",
  assignments:"assignments",
  settings:"settings"
};

const client =
  new Appwrite.Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const account =
  new Appwrite.Account(client);

const tablesDB =
  new Appwrite.TablesDB(client);


/* =====================================================
   STATE
===================================================== */

let currentUser = null;
let currentMemberId = "";
let authMode = "login";
let redAnswers = {};
let switchingDocument = false;


/* =====================================================
   HELPERS
===================================================== */

const wait = ms =>
  new Promise(resolve =>
    setTimeout(resolve,ms)
  );

function memberEmail(id){
  return (
    id.toLowerCase() +
    "@christmas.example"
  );
}

function validMemberId(value){
  return /^[A-Za-z0-9_-]{3,20}$/
    .test(value);
}

function setMessage(
  id,
  text,
  type="error"
){
  const element =
    document.getElementById(id);

  if(!element){
    return;
  }

  element.className =
    "message " + type;

  element.innerHTML =
    text;
}


/* =====================================================
   TOP LEVEL VIEW
===================================================== */

function hideStandalonePages(){

  document
    .querySelectorAll(".standalone-page")
    .forEach(page=>{
      page.classList.add("hidden");
    });
}

function showStandalonePage(id){

  hideStandalonePages();

  document
    .getElementById("fileCabinet")
    ?.classList.add("hidden");

  const page =
    document.getElementById(id);

  if(page){
    page.classList.remove("hidden");
  }

  window.scrollTo({
    top:0,
    behavior:"instant"
  });
}

function showCabinet(){

  hideStandalonePages();

  document
    .getElementById("fileCabinet")
    ?.classList.remove("hidden");
}


/* =====================================================
   AUTH MODE
===================================================== */

function showAuthMode(mode){

  authMode = mode;

  const loginTab =
    document.getElementById("loginTab");

  const registerTab =
    document.getElementById("registerTab");

  const registerOnly =
    document.getElementById("registerOnly");

  const authTitle =
    document.getElementById("authTitle");

  const authDescription =
    document.getElementById("authDescription");

  const authButton =
    document.getElementById("authButton");

  const password =
    document.getElementById("memberPassword");

  loginTab?.classList.toggle(
    "active",
    mode === "login"
  );

  registerTab?.classList.toggle(
    "active",
    mode === "register"
  );

  registerOnly?.classList.toggle(
    "hidden",
    mode !== "register"
  );

  if(authTitle){
    authTitle.textContent =
      mode === "register"
        ? "CREATE MEMBER ID"
        : "IDENTITY VERIFICATION";
  }

  if(authDescription){
    authDescription.textContent =
      mode === "register"
        ? "第一次進入請建立 MEMBER ID、密碼並填寫真實姓名。"
        : "輸入你設定的 MEMBER ID 與密碼。";
  }

  if(authButton){
    authButton.textContent =
      mode === "register"
        ? "建立帳號"
        : "登入系統";
  }

  if(password){
    password.autocomplete =
      mode === "register"
        ? "new-password"
        : "current-password";
  }

  const message =
    document.getElementById("authMessage");

  if(message){
    message.className = "message";
    message.innerHTML = "";
  }
}


/* =====================================================
   AUTH
===================================================== */

async function submitAuth(){

  const memberIdInput =
    document.getElementById("memberId");

  const passwordInput =
    document.getElementById("memberPassword");

  const realNameInput =
    document.getElementById("realName");

  const button =
    document.getElementById("authButton");

  const id =
    memberIdInput?.value.trim() || "";

  const password =
    passwordInput?.value || "";

  const realName =
    realNameInput?.value.trim() || "";

  if(!validMemberId(id)){

    setMessage(
      "authMessage",
      "MEMBER ID 請使用 3–20 位英文、數字、_ 或 -。"
    );

    return;
  }

  if(password.length < 8){

    setMessage(
      "authMessage",
      "密碼至少需要 8 個字元。"
    );

    return;
  }

  if(
    authMode === "register" &&
    !realName
  ){

    setMessage(
      "authMessage",
      "請輸入真實姓名。"
    );

    return;
  }

  button.disabled = true;
  button.textContent = "VERIFYING...";

  try{

    if(authMode === "register"){

      currentUser =
        await account.create({
          userId:Appwrite.ID.unique(),
          email:memberEmail(id),
          password:password,
          name:id
        });

      await account
        .createEmailPasswordSession({
          email:memberEmail(id),
          password:password
        });

      currentUser =
        await account.get();

      await tablesDB.createRow({
        databaseId:DATABASE_ID,
        tableId:TABLES.members,
        rowId:currentUser.$id,

        data:{
          username:id,
          real_name:realName,
          target_file_complete:false
        },

        permissions:[
          Appwrite.Permission.read(
            Appwrite.Role.user(
              currentUser.$id
            )
          ),

          Appwrite.Permission.update(
            Appwrite.Role.user(
              currentUser.$id
            )
          )
        ]
      });

      currentMemberId = id;

      showStandalonePage(
        "redFilePage"
      );

    }else{

      await account
        .createEmailPasswordSession({
          email:memberEmail(id),
          password:password
        });

      currentUser =
        await account.get();

      currentMemberId = id;

      await routeAfterLogin();
    }

  }catch(error){

    console.error(error);

    let message =
      "登入／註冊失敗，請確認資料後再試一次。";

    if(error.code === 409){
      message =
        "這個 MEMBER ID 已經被使用，請改用 LOGIN。";
    }

    if(error.code === 401){
      message =
        "MEMBER ID 或密碼不正確。";
    }

    setMessage(
      "authMessage",
      "<strong>ACCESS DENIED</strong><br>" +
      message
    );

  }finally{

    button.disabled = false;

    button.textContent =
      authMode === "register"
        ? "建立帳號"
        : "登入系統";
  }
}


/* =====================================================
   ROUTE AFTER LOGIN
===================================================== */

async function routeAfterLogin(){

  try{

    const member =
      await tablesDB.getRow({
        databaseId:DATABASE_ID,
        tableId:TABLES.members,
        rowId:currentUser.$id
      });

    currentMemberId =
      member.username ||
      currentMemberId;

    if(member.target_file_complete){

      await runDecryptSequence();

      await openFileTab(
        "myFile",
        true
      );

    }else{

      showStandalonePage(
        "redFilePage"
      );
    }

  }catch(error){

    console.error(error);

    await logoutMember();

    setMessage(
      "authMessage",
      "會員資料讀取失敗，請聯絡總召。"
    );
  }
}


/* =====================================================
   LOGOUT
===================================================== */

async function logoutMember(){

  try{

    await account.deleteSession({
      sessionId:"current"
    });

  }catch(error){
    console.log("No active session.");
  }

  currentUser = null;
  currentMemberId = "";

  document
    .getElementById("fileCabinet")
    ?.classList.add("hidden");

  showStandalonePage(
    "loginPage"
  );
}


/* =====================================================
   RED FILE FORM
===================================================== */

async function submitRedFile(event){

  event.preventDefault();

  const required = [
    "gender",
    "smoked",
    "has_pet",
    "alcohol_frequency",
    "lifestyle",
    "sweet_preference"
  ];

  for(const key of required){

    if(!redAnswers[key]){

      setMessage(
        "redFileMessage",
        "尚有選擇題未完成。"
      );

      return;
    }
  }

  const button =
    document.getElementById(
      "redFileSubmit"
    );

  button.disabled = true;
  button.textContent =
    "TRANSMITTING...";

  const data = {

    user_id:
      currentUser.$id,

    wish:
      document
        .getElementById("wish")
        .value
        .trim(),

    preference:
      document
        .getElementById("preference")
        .value
        .trim(),

    message:
      document
        .getElementById("giftMessage")
        .value
        .trim(),

    gender:
      redAnswers.gender,

    birthday_range:
      document
        .getElementById("birthdayRange")
        .value,

    height_range:
      document
        .getElementById("heightRange")
        .value,

    smoked:
      redAnswers.smoked,

    has_pet:
      redAnswers.has_pet,

    alcohol_frequency:
      redAnswers.alcohol_frequency,

    lifestyle:
      redAnswers.lifestyle,

    sweet_preference:
      redAnswers.sweet_preference
  };

  try{

    await tablesDB.createRow({
      databaseId:DATABASE_ID,
      tableId:TABLES.targetFiles,
      rowId:currentUser.$id,
      data:data,

      permissions:[
        Appwrite.Permission.read(
          Appwrite.Role.user(
            currentUser.$id
          )
        ),

        Appwrite.Permission.update(
          Appwrite.Role.user(
            currentUser.$id
          )
        )
      ]
    });

    await tablesDB.updateRow({
      databaseId:DATABASE_ID,
      tableId:TABLES.members,
      rowId:currentUser.$id,

      data:{
        target_file_complete:true
      }
    });

    setMessage(
      "redFileMessage",
      "<strong>FILE ACCEPTED</strong><br>情報檔案已完成。",
      "success"
    );

    await wait(650);

    await runDecryptSequence();

    await openFileTab(
      "myFile",
      true
    );

  }catch(error){

    console.error(error);

    setMessage(
      "redFileMessage",
      "資料傳送失敗。若你已填過檔案，請重新登入。"
    );

  }finally{

    button.disabled = false;
    button.textContent =
      "SUBMIT FILE";
  }
}


/* =====================================================
   CHOICE BUTTON
===================================================== */

document.addEventListener(
  "click",
  event=>{

    const button =
      event.target.closest(
        ".choices button[data-value]"
      );

    if(!button){
      return;
    }

    const group =
      button.closest(".choices");

    group
      .querySelectorAll("button")
      .forEach(item=>{
        item.classList.remove(
          "selected"
        );
      });

    button.classList.add(
      "selected"
    );

    redAnswers[
      group.dataset.field
    ] =
      button.dataset.value;
  }
);


/* =====================================================
   ENTER LOGIN
===================================================== */

document.addEventListener(
  "keydown",
  event=>{

    if(event.key !== "Enter"){
      return;
    }

    const loginPage =
      document.getElementById(
        "loginPage"
      );

    if(
      loginPage &&
      !loginPage.classList.contains(
        "hidden"
      )
    ){
      submitAuth();
    }
  }
);


/* =====================================================
   MY FILE DATA
===================================================== */

async function loadMyFile(){

  const [
    member,
    file
  ] =
    await Promise.all([

      tablesDB.getRow({
        databaseId:DATABASE_ID,
        tableId:TABLES.members,
        rowId:currentUser.$id
      }),

      tablesDB.getRow({
        databaseId:DATABASE_ID,
        tableId:TABLES.targetFiles,
        rowId:currentUser.$id
      })

    ]);


  /*
    FILE NO.

    Appwrite：
    1 -> 01
    2 -> 02
    10 -> 10
  */

  const fileNumber =
    member.file_no !== null &&
    member.file_no !== undefined

      ? String(
          member.file_no
        ).padStart(2,"0")

      : "--";


  const values = {

    myFileNo:
      fileNumber,

    myRealName:
      member.real_name || "---",

    myMemberId:
      member.username || "---",

    myWish:
      file.wish || "---",

    myPreference:
      file.preference || "---",

    myGiftMessage:
      file.message || "---",

    myGender:
      file.gender || "---",

    myBirthday:
      file.birthday_range || "---",

    myHeight:
      file.height_range || "---",

    mySmoked:
      file.smoked || "---",

    myPet:
      file.has_pet || "---",

    myAlcohol:
      file.alcohol_frequency || "---",

    myLifestyle:
      file.lifestyle || "---",

    mySweet:
      file.sweet_preference || "---"
  };


  Object
    .entries(values)
    .forEach(
      ([id,value])=>{

        const element =
          document.getElementById(id);

        if(element){
          element.textContent =
            value;
        }
      }
    );
}


/* =====================================================
   TARGET MISSION
===================================================== */

function escapeTargetHTML(value){
  return String(value ?? "---")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderTargetLocked(){
  const page = document.getElementById("targetPage");
  if(!page) return;

  page.innerHTML = `
    <section class="file mission-file folder-sheet restricted-sheet">
      <div class="christmas-mark">✦</div>
      <div class="top-secret">RESTRICTED</div>
      <div class="mission-code">TARGET ASSIGNMENT / CONTROLLED INTELLIGENCE</div>
      <div class="restricted-center">
        <div class="restricted-stamp">SEALED</div>
        <div class="eyebrow">TARGET ASSIGNMENT</div>
        <h1 class="folder-page-title">AWAITING AUTHORIZATION</h1>
        <p>COMMAND CENTER 尚未發布 TARGET 任務。</p>
        <div class="classified-bars"><i></i><i></i><i></i></div>
        <small>STATUS // PENDING</small>
      </div>
    </section>`;
}

function renderTargetError(message){
  const page = document.getElementById("targetPage");
  if(!page) return;

  page.innerHTML = `
    <section class="file mission-file folder-sheet restricted-sheet">
      <div class="christmas-mark">✦</div>
      <div class="top-secret">TARGET</div>
      <div class="mission-code">TARGET ASSIGNMENT / CONTROLLED INTELLIGENCE</div>
      <div class="restricted-center">
        <div class="restricted-stamp">HOLD</div>
        <div class="eyebrow">TARGET ASSIGNMENT</div>
        <h1 class="folder-page-title">FILE NOT AVAILABLE</h1>
        <p>${escapeTargetHTML(message)}</p>
        <small>STATUS // CONTACT COMMAND CENTER</small>
      </div>
    </section>`;
}

function renderTargetFile(member,file){
  const page = document.getElementById("targetPage");
  if(!page) return;

  const fileNumber =
    member.file_no !== null && member.file_no !== undefined
      ? String(member.file_no).padStart(2,"0")
      : "--";

  const rows = [
    ["願望 / 想收到的東西", file.wish],
    ["偏好 / 喜歡的類型", file.preference],
    ["給送禮者的訊息", file.message],
    ["性別", file.gender],
    ["生日區間", file.birthday_range],
    ["身高區間", file.height_range],
    ["是否抽過菸", file.smoked],
    ["目前有沒有養寵物", file.has_pet],
    ["喝酒頻率", file.alcohol_frequency],
    ["平常比較喜歡", file.lifestyle],
    ["甜食接受度", file.sweet_preference]
  ];

  page.innerHTML = `
    <section class="file folder-sheet">
      <div class="christmas-mark">✦</div>
      <div class="top-secret">DECLASSIFIED</div>
      <div class="mission-code">TARGET ASSIGNMENT / EYES ONLY</div>

      <div class="eyebrow">ASSIGNED TARGET</div>
      <h1 class="folder-page-title">TARGET FILE // ${escapeTargetHTML(fileNumber)}</h1>

      <div class="identity-grid">
        <div><span>檔案編號</span><strong>${escapeTargetHTML(fileNumber)}</strong></div>
        <div><span>姓名</span><strong>${escapeTargetHTML(member.real_name || "---")}</strong></div>
      </div>

      <div class="identity-grid">
        ${rows.map(([label,value]) => `
          <div>
            <span>${escapeTargetHTML(label)}</span>
            <strong>${escapeTargetHTML(value || "---")}</strong>
          </div>`).join("")}
      </div>

      <div class="folder-footer">EYES ONLY // DO NOT DISCLOSE TARGET // PROJECT : CHRISTMAS II</div>
    </section>`;
}

async function loadTargetMission(){
  try{
    const settings = await tablesDB.getRow({
      databaseId:DATABASE_ID,
      tableId:TABLES.settings,
      rowId:"main"
    });

    if(settings.target_mission_active !== true){
      renderTargetLocked();
      return;
    }

    const assignmentResponse = await tablesDB.listRows({
      databaseId:DATABASE_ID,
      tableId:TABLES.assignments,
      queries:[
        Appwrite.Query.equal("agent_id", currentUser.$id),
        Appwrite.Query.equal("active", true),
        Appwrite.Query.limit(1)
      ]
    });

    const assignment = assignmentResponse.rows?.[0];

    if(!assignment){
      renderTargetError("尚未找到你的 TARGET 配對，請聯絡總召。");
      return;
    }

    const [targetMember,targetFile] = await Promise.all([
      tablesDB.getRow({
        databaseId:DATABASE_ID,
        tableId:TABLES.members,
        rowId:assignment.target_id
      }),
      tablesDB.getRow({
        databaseId:DATABASE_ID,
        tableId:TABLES.targetFiles,
        rowId:assignment.target_id
      })
    ]);

    renderTargetFile(targetMember,targetFile);

  }catch(error){
    console.error("TARGET 讀取失敗：",error);

    if(error.code === 401 || error.code === 403){
      renderTargetError("TARGET 權限尚未完成設定，請聯絡總召。");
    }else{
      renderTargetError("TARGET 情報讀取失敗，請稍後再試。");
    }
  }
}


/* =====================================================
   ACTIVE TAB
===================================================== */

function setActiveFileTab(tab){

  document
    .querySelectorAll(
      "#folderTabs [data-file-tab]"
    )
    .forEach(button=>{

      button.classList.toggle(
        "active",
        button.dataset.fileTab === tab
      );
    });
}


/* =====================================================
   DOCUMENT SWITCH
===================================================== */

async function openFileTab(
  tab,
  instant=false
){

  if(!currentUser){

    showStandalonePage(
      "loginPage"
    );

    return;
  }


  if(switchingDocument){
    return;
  }


  switchingDocument = true;


  showCabinet();

  setActiveFileTab(tab);


  let pageId = "";


  if(tab === "myFile"){

    pageId =
      "myFilePage";

    try{
      await loadMyFile();
    }catch(error){
      console.error(error);
    }

  }else if(tab === "lodging"){

    pageId =
      "lodgingPage";

  }else if(tab === "target"){

    pageId =
      "targetPage";

    await loadTargetMission();

  }else if(tab === "red"){

    pageId =
      "redLockedPage";
  }


  /*
    找出目前正在顯示的文件
  */

  const oldPage =
    document.querySelector(
      ".document-page:not(.hidden)"
    );


  const newPage =
    document.getElementById(
      pageId
    );


  if(!newPage){

    switchingDocument = false;
    return;
  }


  /*
    如果第一次進入，
    不需要舊頁淡出。
  */

  if(
    oldPage &&
    oldPage !== newPage &&
    !instant
  ){

    /*
      只淡內容。
      不移動紙張。
    */

    oldPage
      .querySelectorAll(
        ".file > *"
      )
      .forEach(element=>{

        element.style.transition =
          "opacity .13s ease";

        element.style.opacity =
          "0";
      });


    await wait(135);
  }


  /*
    隱藏所有文件
  */

  document
    .querySelectorAll(
      ".document-page"
    )
    .forEach(page=>{

      page.classList.add(
        "hidden"
      );

      page.classList.remove(
        "document-enter"
      );


      page
        .querySelectorAll(
          ".file > *"
        )
        .forEach(element=>{

          element.style.transition =
            "";

          element.style.opacity =
            "";

        });

    });


  /*
    顯示新文件
  */

  newPage.classList.remove(
    "hidden"
  );


  /*
    重新觸發動畫
  */

  void newPage.offsetWidth;


  newPage.classList.add(
    "document-enter"
  );


  /*
    不再 smooth scroll。
    避免整個檔案看起來跟書籤分開。
  */

  window.scrollTo({
    top:0,
    behavior:"instant"
  });


  await wait(
    instant
      ? 80
      : 430
  );


  switchingDocument = false;
}


/* =====================================================
   DECRYPT LOGIN
===================================================== */

async function runDecryptSequence(){

  const overlay =
    document.getElementById(
      "decryptOverlay"
    );

  const title =
    document.getElementById(
      "decryptTitle"
    );

  const status =
    document.getElementById(
      "decryptStatus"
    );

  const bar =
    document.getElementById(
      "decryptBar"
    );

  const percent =
    document.getElementById(
      "decryptPercent"
    );

  if(
    !overlay ||
    !status ||
    !bar ||
    !percent
  ){
    return;
  }


  overlay.classList.remove(
    "hidden"
  );

  title.textContent =
    "AUTHORIZATION VERIFIED";

  bar.style.width = "0%";
  percent.textContent = "0%";

  status.textContent =
    "VERIFYING MEMBER CREDENTIALS...";

  await wait(280);


  bar.style.width = "24%";
  percent.textContent = "24%";

  status.textContent =
    "ACCESSING PERSONNEL DATABASE...";

  await wait(330);


  bar.style.width = "51%";
  percent.textContent = "51%";

  status.textContent =
    "DECRYPTING CLASSIFIED RECORD...";

  await wait(360);


  bar.style.width = "78%";
  percent.textContent = "78%";

  status.textContent =
    "VERIFYING SECURITY CLEARANCE...";

  await wait(330);


  bar.style.width = "100%";
  percent.textContent = "100%";

  status.textContent =
    "FILE DECRYPTED";

  await wait(420);


  overlay.classList.add(
    "hidden"
  );
}


/* =====================================================
   SNOW
===================================================== */

function createSnow(){

  const snow =
    document.getElementById(
      "snow"
    );

  if(!snow){
    return;
  }

  snow.innerHTML = "";

  for(
    let i=0;
    i<24;
    i++
  ){

    const flake =
      document.createElement(
        "span"
      );

    flake.textContent = "•";

    flake.style.left =
      Math.random() * 100 + "%";

    flake.style.fontSize =
      (
        Math.random() * 12 + 6
      ) + "px";

    flake.style.animationDuration =
      (
        Math.random() * 8 + 8
      ) + "s";

    flake.style.animationDelay =
      (
        Math.random() * -15
      ) + "s";

    snow.appendChild(flake);
  }
}


/* =====================================================
   INITIALIZE
===================================================== */

window.addEventListener(
  "DOMContentLoaded",
  async()=>{

    createSnow();


    /*
      每次重新整理網站
      都要求重新登入。
    */

    try{

      await account.deleteSession({
        sessionId:"current"
      });

    }catch(error){
      /*
        沒有登入狀態時忽略。
      */
    }


    currentUser = null;
    currentMemberId = "";


    document
      .getElementById("fileCabinet")
      ?.classList.add("hidden");


    showStandalonePage(
      "loginPage"
    );
  }
);
