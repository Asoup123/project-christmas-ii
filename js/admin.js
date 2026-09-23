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


/* =========================================
   APPWRITE
========================================= */

const client =
  new Appwrite.Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const account =
  new Appwrite.Account(client);

const tablesDB =
  new Appwrite.TablesDB(client);


/* =========================================
   STATE
========================================= */

let adminUser = null;

let members = [];
let targetFiles = [];


/* =========================================
   HELPERS
========================================= */

const $ =
  id => document.getElementById(id);


function escapeHTML(value){

  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}


function fileNumber(value){

  if(
    value === null ||
    value === undefined ||
    value === ""
  ){
    return "--";
  }

  return String(value)
    .padStart(2,"0");
}


function formatTime(value){

  if(!value){
    return "—";
  }

  return new Intl.DateTimeFormat(
    "zh-TW",
    {
      timeZone:"Asia/Taipei",
      year:"numeric",
      month:"2-digit",
      day:"2-digit",
      hour:"2-digit",
      minute:"2-digit",
      hour12:false
    }
  ).format(
    new Date(value)
  );
}


function showMessage(
  id,
  text,
  success=false
){

  const element = $(id);

  if(!element){
    return;
  }

  element.textContent = text;

  element.style.color =
    success
      ? "#216246"
      : "#8f1d24";
}


/* =========================================
   LOGIN VIEW
========================================= */

function showAdminLogin(){

  $("commandCenter")
    .classList.add("hidden");

  $("adminLogin")
    .classList.remove("hidden");
}


function showCommandCenter(){

  $("adminLogin")
    .classList.add("hidden");

  $("commandCenter")
    .classList.remove("hidden");
}


/* =========================================
   ADMIN LOGIN
========================================= */

async function adminLogin(){

  const email =
    $("adminEmail")
      .value
      .trim();

  const password =
    $("adminPassword")
      .value;

  if(
    !email ||
    !password
  ){

    showMessage(
      "loginMessage",
      "請輸入管理員 Email 與密碼。"
    );

    return;
  }


  const button =
    $("adminLoginButton");

  button.disabled = true;

  button.textContent =
    "VERIFYING...";


  try{

    /*
      清掉可能存在的會員登入 Session
    */

    try{

      await account.deleteSession({
        sessionId:"current"
      });

    }catch(error){
      // 沒有 session 時忽略
    }


    await account
      .createEmailPasswordSession({
        email,
        password
      });


    adminUser =
      await account.get();


    /*
      注意：
      真正的 ADMIN 權限會由
      Appwrite 權限決定。

      不是靠前端 Email 判斷。
    */


    showCommandCenter();

    openAdminPage(
      "dashboard"
    );

    await loadDatabase();


  }catch(error){

    console.error(error);

    showMessage(
      "loginMessage",
      "ACCESS DENIED // 管理員帳號或權限驗證失敗"
    );

  }finally{

    button.disabled = false;

    button.textContent =
      "VERIFY ADMINISTRATOR";
  }
}


/* =========================================
   LOGOUT
========================================= */

async function adminLogout(){

  try{

    await account.deleteSession({
      sessionId:"current"
    });

  }catch(error){
    console.log(error);
  }


  adminUser = null;

  members = [];
  targetFiles = [];


  $("adminEmail").value = "";
  $("adminPassword").value = "";

  showAdminLogin();
}


/* =========================================
   NAVIGATION
========================================= */

function openAdminPage(page){

  document
    .querySelectorAll(
      ".admin-page"
    )
    .forEach(element=>{

      element.classList.add(
        "hidden"
      );

    });


  document
    .querySelectorAll(
      "[data-admin-page]"
    )
    .forEach(button=>{

      button.classList.toggle(
        "active",
        button.dataset.adminPage === page
      );

    });


  const target =
    $(`${page}Page`);

  if(target){
    target.classList.remove(
      "hidden"
    );
  }


  if(page === "members"){
    renderMembers();
  }

  if(page === "intelligence"){
    renderSubjects();
  }
}


/* =========================================
   LOAD DATABASE
========================================= */

async function loadDatabase(){

  $("databaseStatus")
    .textContent =
      "CONNECTING...";


  try{

    /*
      管理員必須有權限 LIST members。
    */

    const memberResponse =
      await tablesDB.listRows({
        databaseId:DATABASE_ID,
        tableId:TABLES.members,
        queries:[
          Appwrite.Query.limit(100)
        ]
      });


    members =
      [...memberResponse.rows]
        .sort(
          (a,b)=>
            new Date(a.$createdAt) -
            new Date(b.$createdAt)
        );


    /*
      管理員必須有權限 LIST target_files。
    */

    const targetResponse =
      await tablesDB.listRows({
        databaseId:DATABASE_ID,
        tableId:TABLES.targetFiles,
        queries:[
          Appwrite.Query.limit(100)
        ]
      });


    targetFiles =
      targetResponse.rows;


    $("databaseStatus")
      .textContent =
        "DATABASE ONLINE";


    renderDashboard();
    renderMembers();
    renderSubjects();


  }catch(error){

    console.error(error);

    $("databaseStatus")
      .textContent =
        "PERMISSION DENIED / DATABASE ERROR";


    $("dashboardSummary")
      .innerHTML = `
        <strong style="color:#8f1d24">
          ADMIN DATABASE ACCESS DENIED
        </strong>
        <br><br>
        管理員帳號目前尚未取得讀取所有
        members / target_files 的 Appwrite 權限。
      `;
  }
}


/* =========================================
   DASHBOARD
========================================= */

function renderDashboard(){

  const total =
    members.length;

  const complete =
    members.filter(
      member =>
        member.target_file_complete
    ).length;

  const numbered =
    members.filter(
      member =>
        member.file_no !== null &&
        member.file_no !== undefined
    ).length;


  $("registeredCount")
    .textContent =
      total;


  $("completeCount")
    .textContent =
      `${complete} / ${total}`;


  $("numberedCount")
    .textContent =
      `${numbered} / ${total}`;


  const pending =
    total - complete;


  $("dashboardSummary")
    .innerHTML = `

      REGISTERED PERSONNEL:
      <strong>${total}</strong>

      <br>

      COMPLETED INTELLIGENCE FILES:
      <strong>${complete}</strong>

      <br>

      PENDING INTELLIGENCE FILES:
      <strong>${pending}</strong>

      <br>

      FILE NUMBERS ASSIGNED:
      <strong>${numbered}</strong>

    `;
}


/* =========================================
   MEMBERS TABLE
========================================= */

function renderMembers(){

  const body =
    $("membersTableBody");

  if(!body){
    return;
  }


  if(!members.length){

    body.innerHTML = `

      <tr>

        <td
          colspan="6"
          class="empty-cell"
        >
          NO PERSONNEL RECORDS
        </td>

      </tr>

    `;

    return;
  }


  body.innerHTML =
    members.map(member=>{

      const complete =
        member.target_file_complete;

      return `

        <tr>

          <td class="file-number">

            ${fileNumber(
              member.file_no
            )}

          </td>


          <td class="member-name">

            ${escapeHTML(
              member.username ||
              "—"
            )}

          </td>


          <td>

            ${escapeHTML(
              member.real_name ||
              "—"
            )}

          </td>


          <td class="${
            complete
              ? "status-complete"
              : "status-pending"
          }">

            ${
              complete
                ? "COMPLETE"
                : "PENDING"
            }

          </td>


          <td>

            ${formatTime(
              member.$createdAt
            )}

          </td>


          <td
            class="user-id"
            title="${escapeHTML(
              member.$id
            )}"
          >

            ${escapeHTML(
              member.$id
            )}

          </td>

        </tr>

      `;

    }).join("");
}


/* =========================================
   RENUMBER
========================================= */

async function renumberMembers(){

  if(!members.length){
    return;
  }


  const confirmed =
    confirm(
      "確定要依照註冊時間重新編號嗎？\n\n最早註冊 = 01\n第二位 = 02\n第三位 = 03..."
    );


  if(!confirmed){
    return;
  }


  const button =
    $("renumberMembers");


  button.disabled = true;

  button.textContent =
    "NUMBERING...";


  showMessage(
    "memberMessage",
    "正在重新編號..."
  );


  try{

    /*
      先再次按照註冊時間排序。
    */

    const ordered =
      [...members].sort(
        (a,b)=>
          new Date(a.$createdAt) -
          new Date(b.$createdAt)
      );


    /*
      一筆一筆更新。

      01 -> 儲存 Integer 1
      02 -> 儲存 Integer 2
      ...
    */

    for(
      let index=0;
      index<ordered.length;
      index++
    ){

      const member =
        ordered[index];

      const newNumber =
        index + 1;


      await tablesDB.updateRow({

        databaseId:
          DATABASE_ID,

        tableId:
          TABLES.members,

        rowId:
          member.$id,

        data:{
          file_no:newNumber
        }

      });

    }


    showMessage(
      "memberMessage",
      "FILE NUMBERING COMPLETE // 編號完成",
      true
    );


    await loadDatabase();


  }catch(error){

    console.error(error);

    showMessage(
      "memberMessage",
      "編號失敗。請確認 ADMIN 是否具有更新所有 members Row 的權限。"
    );


  }finally{

    button.disabled = false;

    button.textContent =
      "RENUMBER FILES";
  }
}


/* =========================================
   INTELLIGENCE SUBJECTS
========================================= */

function renderSubjects(){

  const container =
    $("subjectList");

  if(!container){
    return;
  }


  if(!members.length){

    container.innerHTML = `

      <div class="empty-subject">
        NO PERSONNEL
      </div>

    `;

    return;
  }


  container.innerHTML =
    members.map(member=>`

      <button
        class="subject-button"
        data-subject-id="${escapeHTML(
          member.$id
        )}"
      >

        <small>

          FILE //
          ${fileNumber(
            member.file_no
          )}

        </small>

        <strong>

          ${escapeHTML(
            member.real_name ||
            member.username ||
            "UNKNOWN"
          )}

        </strong>

      </button>

    `).join("");
}


/* =========================================
   OPEN INTELLIGENCE FILE
========================================= */

function openIntelligence(
  userId
){

  const member =
    members.find(
      item =>
        item.$id === userId
    );


  const file =
    targetFiles.find(
      item =>
        item.user_id === userId ||
        item.$id === userId
    );


  if(!member){
    return;
  }


  document
    .querySelectorAll(
      ".subject-button"
    )
    .forEach(button=>{

      button.classList.toggle(
        "active",
        button.dataset.subjectId === userId
      );

    });


  if(!file){

    $("intelDocument")
      .innerHTML = `

        <div class="empty-intelligence">

          FILE INCOMPLETE

          <small>
            此成員尚未完成 RED FILE
          </small>

        </div>

      `;

    return;
  }


  const field =
    (
      title,
      value,
      full=false
    ) => `

      <article
        class="intel-field ${
          full
            ? "full"
            : ""
        }"
      >

        <small>
          ${escapeHTML(title)}
        </small>

        <p>
          ${escapeHTML(
            value || "—"
          )}
        </p>

      </article>

    `;


  $("intelDocument")
    .innerHTML = `

      <div class="intel-header">

        <div>

          <small>
            CLASSIFIED PERSONNEL FILE
          </small>

          <h3>

            ${escapeHTML(
              member.real_name ||
              "UNKNOWN"
            )}

          </h3>

        </div>


        <div class="intel-file-number">

          FILE //
          ${fileNumber(
            member.file_no
          )}

        </div>

      </div>


      <div class="intel-grid">

        ${field(
          "MEMBER ID",
          member.username
        )}

        ${field(
          "GENDER",
          file.gender
        )}

        ${field(
          "BIRTHDAY RANGE",
          file.birthday_range
        )}

        ${field(
          "HEIGHT RANGE",
          file.height_range
        )}

        ${field(
          "SMOKED",
          file.smoked
        )}

        ${field(
          "HAS PET",
          file.has_pet
        )}

        ${field(
          "ALCOHOL FREQUENCY",
          file.alcohol_frequency
        )}

        ${field(
          "LIFESTYLE",
          file.lifestyle
        )}

        ${field(
          "SWEET PREFERENCE",
          file.sweet_preference
        )}

        ${field(
          "WISH",
          file.wish,
          true
        )}

        ${field(
          "PREFERENCE",
          file.preference,
          true
        )}

        ${field(
          "MESSAGE",
          file.message,
          true
        )}

      </div>

    `;
}


/* =========================================
   EVENTS
========================================= */

$("adminLoginButton")
  .addEventListener(
    "click",
    adminLogin
  );


$("adminPassword")
  .addEventListener(
    "keydown",
    event=>{

      if(event.key === "Enter"){
        adminLogin();
      }

    }
  );


$("adminLogoutButton")
  .addEventListener(
    "click",
    adminLogout
  );


$("refreshDashboard")
  .addEventListener(
    "click",
    loadDatabase
  );


$("refreshMembers")
  .addEventListener(
    "click",
    loadDatabase
  );


$("renumberMembers")
  .addEventListener(
    "click",
    renumberMembers
  );


document.addEventListener(
  "click",
  event=>{

    const navButton =
      event.target.closest(
        "[data-admin-page]"
      );

    if(navButton){

      openAdminPage(
        navButton.dataset.adminPage
      );

      return;
    }


    const subjectButton =
      event.target.closest(
        "[data-subject-id]"
      );

    if(subjectButton){

      openIntelligence(
        subjectButton.dataset.subjectId
      );
    }

  }
);


/* =========================================
   INITIALIZE
========================================= */

window.addEventListener(
  "DOMContentLoaded",
  async()=>{

    /*
      後台每次重新整理，
      同樣要求重新登入。
    */

    try{

      await account.deleteSession({
        sessionId:"current"
      });

    }catch(error){
      // 沒有 session 就忽略
    }


    adminUser = null;

    showAdminLogin();

  }
);
