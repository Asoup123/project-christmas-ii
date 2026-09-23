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


/* =========================
   STATE
========================= */

let currentUser = null;
let currentMemberId = "";
let authMode = "login";
let redAnswers = {};


/* =========================
   BASIC HELPERS
========================= */

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function memberEmail(memberId) {
  return memberId.toLowerCase() + "@christmas.example";
}

function validMemberId(value) {
  return /^[A-Za-z0-9_-]{3,20}$/.test(value);
}

function setMessage(id, text, type = "error") {

  const el = document.getElementById(id);

  if (!el) return;

  el.className = "message " + type;
  el.innerHTML = text;
}


/* =========================
   PAGE CONTROL
========================= */

function showOnly(pageId) {

  document
    .querySelectorAll("main.page")
    .forEach(page => {
      page.classList.add("hidden");
    });

  const targetPage = document.getElementById(pageId);

  if (targetPage) {
    targetPage.classList.remove("hidden");
  }

  /*
    只有登入後的四個檔案頁
    才能顯示上方書籤
  */

  const memberPages = [
    "myFilePage",
    "missionPage",
    "targetPage",
    "redLockedPage"
  ];

  const tabs = document.getElementById("folderTabs");

  if (tabs) {
    tabs.classList.toggle(
      "hidden",
      !currentUser || !memberPages.includes(pageId)
    );
  }

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}


/* =========================
   LOGIN / REGISTER UI
========================= */

function showAuthMode(mode) {

  authMode = mode;

  document
    .getElementById("loginTab")
    ?.classList.toggle("active", mode === "login");

  document
    .getElementById("registerTab")
    ?.classList.toggle("active", mode === "register");

  document
    .getElementById("registerOnly")
    ?.classList.toggle("hidden", mode !== "register");

  const title = document.getElementById("authTitle");

  if (title) {
    title.textContent =
      mode === "register"
        ? "CREATE MEMBER ID"
        : "IDENTITY VERIFICATION";
  }

  const description =
    document.getElementById("authDescription");

  if (description) {
    description.textContent =
      mode === "register"
        ? "第一次進入請建立 MEMBER ID、密碼並填寫真實姓名。"
        : "輸入你設定的 MEMBER ID 與密碼。";
  }

  const button =
    document.getElementById("authButton");

  if (button) {
    button.textContent =
      mode === "register"
        ? "建立帳號"
        : "登入系統";
  }

  const password =
    document.getElementById("memberPassword");

  if (password) {
    password.autocomplete =
      mode === "register"
        ? "new-password"
        : "current-password";
  }

  const message =
    document.getElementById("authMessage");

  if (message) {
    message.className = "message";
    message.innerHTML = "";
  }
}


/* =========================
   LOGIN / REGISTER
========================= */

async function submitAuth() {

  const memberId =
    document.getElementById("memberId").value.trim();

  const password =
    document.getElementById("memberPassword").value;

  const realName =
    document.getElementById("realName").value.trim();

  const button =
    document.getElementById("authButton");

  if (!validMemberId(memberId)) {

    return setMessage(
      "authMessage",
      "<strong>INVALID MEMBER ID</strong><br>請使用 3–20 位英文、數字、_ 或 -。"
    );
  }

  if (password.length < 8) {

    return setMessage(
      "authMessage",
      "<strong>INVALID PASSWORD</strong><br>密碼至少需要 8 個字元。"
    );
  }

  if (authMode === "register" && !realName) {

    return setMessage(
      "authMessage",
      "請輸入真實姓名。"
    );
  }

  button.disabled = true;
  button.textContent = "CONNECTING...";

  try {

    /* =====================
       CREATE ACCOUNT
    ===================== */

    if (authMode === "register") {

      currentUser =
        await account.create({
          userId: Appwrite.ID.unique(),
          email: memberEmail(memberId),
          password: password,
          name: memberId
        });

      await account.createEmailPasswordSession({
        email: memberEmail(memberId),
        password: password
      });

      currentUser =
        await account.get();

      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.members,
        rowId: currentUser.$id,

        data: {
          username: memberId,
          real_name: realName,
          target_file_complete: false
        },

        permissions: [
          Appwrite.Permission.read(
            Appwrite.Role.user(currentUser.$id)
          ),

          Appwrite.Permission.update(
            Appwrite.Role.user(currentUser.$id)
          )
        ]
      });

      currentMemberId = memberId;

      /*
        新帳號第一次一定要填個人檔案
      */

      showOnly("redFilePage");
    }

    /* =====================
       LOGIN
    ===================== */

    else {

      await account.createEmailPasswordSession({
        email: memberEmail(memberId),
        password: password
      });

      currentUser =
        await account.get();

      currentMemberId = memberId;

      await routeAfterLogin();
    }
  }

  catch (error) {

    console.error(error);

    let msg =
      "登入／註冊失敗，請確認資料後再試一次。";

    if (error.code === 409) {
      msg =
        "這個 MEMBER ID 已經被使用，請改用 LOGIN。";
    }

    if (error.code === 401) {
      msg =
        "MEMBER ID 或密碼不正確。";
    }

    setMessage(
      "authMessage",
      "<strong>ACCESS DENIED</strong><br>" + msg
    );
  }

  finally {

    button.disabled = false;

    button.textContent =
      authMode === "register"
        ? "建立帳號"
        : "登入系統";
  }
}


/* =========================
   AFTER LOGIN
========================= */

async function routeAfterLogin() {

  /*
    這裡再次確認真的有 Appwrite Session。
    沒有登入就不准進任何會員頁。
  */

  if (!currentUser) {

    showOnly("loginPage");

    return;
  }

  try {

    const member =
      await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.members,
        rowId: currentUser.$id
      });

    currentMemberId =
      member.username || currentMemberId;

    /*
      已填完個人檔案
      → MY FILE

      尚未完成
      → 填寫個人情報
    */

    if (member.target_file_complete) {

      await openFileTab("myFile");
    }

    else {

      showOnly("redFilePage");
    }
  }

  catch (error) {

    console.error(error);

    await logoutMember();

    setMessage(
      "authMessage",
      "會員資料讀取失敗，請聯絡總召。"
    );
  }
}


/* =========================
   LOGOUT
========================= */

async function logoutMember() {

  try {

    await account.deleteSession({
      sessionId: "current"
    });

  }

  catch (error) {
    console.log("No active session.");
  }

  currentUser = null;
  currentMemberId = "";

  document
    .getElementById("folderTabs")
    ?.classList.add("hidden");

  showOnly("loginPage");
}


/* =========================
   CREATE PERSONAL FILE
========================= */

async function submitRedFile(event) {

  event.preventDefault();

  /*
    沒登入不允許送出
  */

  if (!currentUser) {

    showOnly("loginPage");

    return;
  }

  const required = [
    "gender",
    "smoked",
    "has_pet",
    "alcohol_frequency",
    "lifestyle",
    "sweet_preference"
  ];

  for (const key of required) {

    if (!redAnswers[key]) {

      return setMessage(
        "redFileMessage",
        "尚有選擇題未完成。",
        "error"
      );
    }
  }

  const button =
    document.getElementById("redFileSubmit");

  button.disabled = true;
  button.textContent = "TRANSMITTING...";

  const data = {

    user_id: currentUser.$id,

    wish:
      document.getElementById("wish")
        .value.trim(),

    preference:
      document.getElementById("preference")
        .value.trim(),

    message:
      document.getElementById("giftMessage")
        .value.trim(),

    gender:
      redAnswers.gender,

    birthday_range:
      document.getElementById("birthdayRange")
        .value,

    height_range:
      document.getElementById("heightRange")
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

  try {

    await tablesDB.createRow({

      databaseId: DATABASE_ID,
      tableId: TABLES.targetFiles,
      rowId: currentUser.$id,

      data: data,

      permissions: [

        Appwrite.Permission.read(
          Appwrite.Role.user(currentUser.$id)
        ),

        Appwrite.Permission.update(
          Appwrite.Role.user(currentUser.$id)
        )
      ]
    });

    await tablesDB.updateRow({

      databaseId: DATABASE_ID,
      tableId: TABLES.members,
      rowId: currentUser.$id,

      data: {
        target_file_complete: true
      }
    });

    setMessage(
      "redFileMessage",
      "<strong>FILE ACCEPTED</strong><br>個人情報檔案已完成。",
      "success"
    );

    await wait(700);

    await openFileTab("myFile");
  }

  catch (error) {

    console.error(error);

    setMessage(
      "redFileMessage",
      "資料傳送失敗。若你已填過個人檔案，請重新登入。",
      "error"
    );
  }

  finally {

    button.disabled = false;

    button.textContent =
      "SUBMIT RED FILE";
  }
}


/* =========================
   CHOICE BUTTONS
========================= */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".choice-grid button[data-value]"
      );

    if (!button) return;

    const grid =
      button.closest(".choice-grid");

    grid
      .querySelectorAll("button")
      .forEach(item => {
        item.classList.remove("selected");
      });

    button.classList.add("selected");

    redAnswers[grid.dataset.field] =
      button.dataset.value;
  }
);


/* =========================
   ENTER LOGIN
========================= */

document.addEventListener(
  "keydown",
  event => {

    const loginPage =
      document.getElementById("loginPage");

    if (
      event.key === "Enter" &&
      loginPage &&
      !loginPage.classList.contains("hidden")
    ) {

      submitAuth();
    }
  }
);


/* =========================
   FOLDER TABS
========================= */

function setActiveFileTab(tab) {

  document
    .querySelectorAll(".folder-tab")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.fileTab === tab
      );
    });
}


/* =========================
   LOAD MY FILE
========================= */

async function loadMyFile() {

  if (!currentUser) {

    showOnly("loginPage");

    return;
  }

  const [member, file] =
    await Promise.all([

      tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.members,
        rowId: currentUser.$id
      }),

      tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.targetFiles,
        rowId: currentUser.$id
      })

    ]);

  const values = {

    myFileNo:
      (member.username || "---")
        .toUpperCase(),

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

  Object.entries(values)
    .forEach(([id, value]) => {

      const el =
        document.getElementById(id);

      if (el) {
        el.textContent = value;
      }
    });
}


/* =========================
   OPEN FILE TAB
========================= */

async function openFileTab(tab) {

  /*
    最重要：
    未登入不能透過按鈕或 Console
    直接開會員頁。
  */

  if (!currentUser) {

    document
      .getElementById("folderTabs")
      ?.classList.add("hidden");

    showOnly("loginPage");

    return;
  }

  setActiveFileTab(tab);


  /* =====================
     MY FILE
  ===================== */

  if (tab === "myFile") {

    showOnly("myFilePage");

    try {

      await loadMyFile();

    }

    catch (error) {

      console.error(error);

      await logoutMember();
    }

    return;
  }


  /* =====================
     LODGING
  ===================== */

  if (tab === "lodging") {

    showOnly("missionPage");

    return;
  }


  /* =====================
     TARGET
  ===================== */

  if (tab === "target") {

    showOnly("targetPage");

    return;
  }


  /* =====================
     RED FILE
  ===================== */

  if (tab === "red") {

    showOnly("redLockedPage");

    return;
  }


  /*
    任何不存在的書籤
    一律回 MY FILE
  */

  await openFileTab("myFile");
}


/* =========================
   SNOW
========================= */

function createSnow() {

  const snow =
    document.getElementById("snow");

  if (!snow) return;

  snow.innerHTML = "";

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
}


/* =========================
   INITIALIZE
   每次進入網站都必須重新登入
========================= */

window.addEventListener(
  "DOMContentLoaded",
  async () => {

    createSnow();

    /*
      每次重新開啟 / 重新整理網站，
      都清除之前留下的登入 Session。
    */

    try {

      await account.deleteSession({
        sessionId: "current"
      });

    } catch (error) {

      /*
        沒有 Session 時會進這裡，
        不需要做任何處理。
      */

      console.log("No previous session.");

    }

    /*
      清除前端登入狀態
    */

    currentUser = null;
    currentMemberId = "";

    /*
      隱藏會員檔案書籤
    */

    document
      .getElementById("folderTabs")
      ?.classList.add("hidden");

    /*
      每次一律回 LOGIN
    */

    showOnly("loginPage");

  }
);
