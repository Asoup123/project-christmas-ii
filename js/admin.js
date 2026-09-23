/* =========================================================
   PROJECT : CHRISTMAS II
   ADMIN CONTROL CENTER
========================================================= */


/* =========================================================
   APPWRITE
========================================================= */

const APPWRITE_ENDPOINT =
  "https://sgp.cloud.appwrite.io/v1";


const APPWRITE_PROJECT_ID =
  "6ab36b1c001036f515ab";


const DATABASE_ID =
  "christmas-2026";


const COLLECTIONS = {

  members:
    "members",

  targetFiles:
    "target_files",

  assignments:
    "assignments",

  settings:
    "settings"

};


/* =========================================================
   舊 RSVP / SUPABASE
========================================================= */

const RSVP_SUPABASE_URL =
  "https://sdkgiedglmhmchiietru.supabase.co";


const RSVP_SUPABASE_KEY =
  "sb_publishable_ofwe1YigppMHJjcWu_VjUA_XF7wNzEm";


const RSVP_TABLE =
  "christmas_2026_rsvp";


/* =========================================================
   APPWRITE 初始化
========================================================= */

const client =
  new Appwrite.Client()
    .setEndpoint(
      APPWRITE_ENDPOINT
    )
    .setProject(
      APPWRITE_PROJECT_ID
    );


const account =
  new Appwrite.Account(
    client
  );


const databases =
  new Appwrite.Databases(
    client
  );


/* =========================================================
   狀態
========================================================= */

let adminUser =
  null;


let members =
  [];


let targetFiles =
  [];


let rsvpRows =
  [];

let assignments = [];
let assignmentPreview = [];
let targetMissionActive = false;


/* =========================================================
   DOM
========================================================= */

const $ =
  id =>
    document.getElementById(
      id
    );


/* =========================================================
   HTML 安全處理
========================================================= */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* =========================================================
   檔案編號
========================================================= */

function fileNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "--";
  }


  return String(
    value
  ).padStart(
    2,
    "0"
  );
}


/* =========================================================
   日期
========================================================= */

function formatTime(value) {

  if (!value) {

    return "—";
  }


  try {

    return new Intl.DateTimeFormat(
      "zh-TW",
      {

        timeZone:
          "Asia/Taipei",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false

      }
    ).format(
      new Date(value)
    );

  } catch (error) {

    return "—";
  }
}


/* =========================================================
   訊息
========================================================= */

function showMessage(
  id,
  text,
  success = false
) {

  const element =
    $(id);


  if (!element) {

    return;
  }


  element.textContent =
    text;


  element.style.color =
    success
      ? "#216246"
      : "#8f1d24";
}


/* =========================================================
   登入畫面
========================================================= */

function showAdminLogin() {

  $("commandCenter")
    .classList
    .add(
      "hidden"
    );


  $("adminLogin")
    .classList
    .remove(
      "hidden"
    );
}


/* =========================================================
   管理中心
========================================================= */

function showCommandCenter() {

  $("adminLogin")
    .classList
    .add(
      "hidden"
    );


  $("commandCenter")
    .classList
    .remove(
      "hidden"
    );
}


/* =========================================================
   管理員登入
========================================================= */

async function adminLogin() {

  const email =
    $("adminEmail")
      .value
      .trim();


  const password =
    $("adminPassword")
      .value;


  if (
    !email ||
    !password
  ) {

    showMessage(
      "loginMessage",
      "請輸入管理員 Email 與密碼。"
    );

    return;
  }


  const button =
    $("adminLoginButton");


  button.disabled =
    true;


  button.textContent =
    "登入中...";


  showMessage(
    "loginMessage",
    ""
  );


  try {


    /*
      清除目前可能存在的前台 Session
    */

    try {

      await account
        .deleteSession(
          "current"
        );

    } catch (error) {

      // 沒有 Session 時不用處理
    }


    /*
      登入
    */

    await account
      .createEmailPasswordSession(
        email,
        password
      );


    /*
      取得登入使用者
    */

    adminUser =
      await account.get();


    /*
      顯示後台
    */

    showCommandCenter();


    openAdminPage(
      "dashboard"
    );


    /*
      讀取 Appwrite
    */

    await loadDatabase();


    /*
      同時讀取舊 RSVP
    */

    await loadRsvp();


  } catch (error) {


    console.error(
      "管理員登入錯誤：",
      error
    );


    showMessage(
      "loginMessage",
      "登入失敗，請確認 Email 與密碼。"
    );


    try {

      await account
        .deleteSession(
          "current"
        );

    } catch (sessionError) {

      // ignore
    }


    adminUser =
      null;


    showAdminLogin();


  } finally {


    button.disabled =
      false;


    button.textContent =
      "登入管理中心";

  }
}


/* =========================================================
   登出
========================================================= */

async function adminLogout() {

  try {

    await account
      .deleteSession(
        "current"
      );

  } catch (error) {

    console.log(
      error
    );
  }


  adminUser =
    null;


  members =
    [];


  targetFiles =
    [];


  rsvpRows =
    [];

  assignments = [];
  assignmentPreview = [];


  $("adminEmail")
    .value =
    "";


  $("adminPassword")
    .value =
    "";


  showAdminLogin();
}


/* =========================================================
   後台頁面切換
========================================================= */

function openAdminPage(page) {


  document
    .querySelectorAll(
      ".admin-page"
    )
    .forEach(
      element => {

        element
          .classList
          .add(
            "hidden"
          );

      }
    );


  document
    .querySelectorAll(
      "[data-admin-page]"
    )
    .forEach(
      button => {

        button
          .classList
          .toggle(
            "active",
            button.dataset.adminPage === page
          );

      }
    );


  const target =
    $(
      `${page}Page`
    );


  if (target) {

    target
      .classList
      .remove(
        "hidden"
      );
  }


  if (
    page === "members"
  ) {

    renderMembers();
  }


  if (
    page === "rsvp"
  ) {

    renderRsvp();
  }


  if (
    page === "intelligence"
  ) {

    renderSubjects();
  }

  if (
    page === "assignment"
  ) {

    renderAssignments(
      assignmentPreview.length ? assignmentPreview : assignments,
      assignmentPreview.length > 0
    );
  }
}


/* =========================================================
   APPWRITE 資料
========================================================= */

async function loadDatabase() {


  if (
    $("databaseStatus")
  ) {

    $("databaseStatus")
      .textContent =
      "連線中...";
  }


  try {


    /* ===============================
       MEMBERS
    =============================== */

    const memberResponse =
      await databases
        .listDocuments(

          DATABASE_ID,

          COLLECTIONS.members,

          [
            Appwrite.Query.limit(
              100
            )
          ]

        );


    members =
      [
        ...memberResponse.documents
      ]
        .sort(
          (a, b) =>

            new Date(
              a.$createdAt
            ) -

            new Date(
              b.$createdAt
            )
        );


    /* ===============================
       TARGET FILES
    =============================== */

    const targetResponse =
      await databases
        .listDocuments(

          DATABASE_ID,

          COLLECTIONS.targetFiles,

          [
            Appwrite.Query.limit(
              100
            )
          ]

        );


    targetFiles =
      targetResponse.documents;


    const assignmentResponse =
      await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.assignments,
        [Appwrite.Query.limit(100)]
      );

    assignments =
      assignmentResponse.documents.filter(
        row => row.active !== false
      );

    const settingsDocument = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.settings,
      "main"
    );

    targetMissionActive = settingsDocument.target_mission_active === true;

    assignmentPreview = [];


    $("databaseStatus")
      .textContent =
      "資料庫連線正常";


    renderDashboard();

    renderMembers();

    renderSubjects();
    renderAssignments(assignments, false);
    renderTargetMissionControl();


  } catch (error) {


    console.error(
      "Appwrite 資料庫錯誤：",
      error
    );


    $("databaseStatus")
      .textContent =
      "資料庫讀取失敗";


    $("dashboardSummary")
      .innerHTML = `

        <strong
          style="color:#8f1d24"
        >
          無法讀取管理資料
        </strong>

        <br><br>

        請確認 Asoup0529
        已加入 Christmas Admin Team，

        <br>

        並確認 Members 與 Target Files
        已設定管理員讀取權限。

      `;

  }
}


/* =========================================================
   總覽
========================================================= */

function renderDashboard() {


  const total =
    members.length;


  const complete =
    members.filter(
      member =>

        member
          .target_file_complete === true

    ).length;


  const numbered =
    members.filter(
      member =>

        member.file_no !== null &&

        member.file_no !== undefined &&

        member.file_no !== ""

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

      已註冊成員：
      <strong>
        ${total}
      </strong>

      <br>

      已完成情報檔案：
      <strong>
        ${complete}
      </strong>

      <br>

      尚未完成情報檔案：
      <strong>
        ${pending}
      </strong>

      <br>

      已建立檔案編號：
      <strong>
        ${numbered}
      </strong>

      <br>

      RSVP 已回覆：
      <strong>
        ${rsvpRows.length}
      </strong>

    `;
}


/* =========================================================
   成員管理
========================================================= */

function renderMembers() {


  const body =
    $("membersTableBody");


  if (!body) {

    return;
  }


  if (
    !members.length
  ) {


    body.innerHTML = `

      <tr>

        <td
          colspan="6"
          class="empty-cell"
        >
          目前沒有成員資料
        </td>

      </tr>

    `;


    return;
  }


  body.innerHTML =
    members
      .map(
        member => {


          const complete =
            member
              .target_file_complete === true;


          return `

            <tr>


              <td
                class="file-number"
              >

                ${fileNumber(
                  member.file_no
                )}

              </td>


              <td
                class="member-name"
              >

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


              <td
                class="${
                  complete
                    ? "status-complete"
                    : "status-pending"
                }"
              >

                ${
                  complete
                    ? "已完成"
                    : "尚未完成"
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

        }
      )
      .join("");
}


/* =========================================================
   重新編號
========================================================= */

async function renumberMembers() {


  if (
    !members.length
  ) {

    showMessage(
      "memberMessage",
      "目前沒有會員資料。"
    );

    return;
  }


  const confirmed =
    confirm(

      "確定要依照註冊時間重新編號嗎？\n\n" +

      "最早註冊 = 01\n" +

      "第二位 = 02\n" +

      "第三位 = 03\n\n" +

      "這會更新所有會員的檔案編號。"

    );


  if (
    !confirmed
  ) {

    return;
  }


  const button =
    $("renumberMembers");


  button.disabled =
    true;


  button.textContent =
    "編號中...";


  showMessage(
    "memberMessage",
    "正在依照註冊時間重新編號..."
  );


  try {


    const ordered =
      [
        ...members
      ]
        .sort(
          (a, b) =>

            new Date(
              a.$createdAt
            ) -

            new Date(
              b.$createdAt
            )
        );


    for (
      let index = 0;
      index < ordered.length;
      index++
    ) {


      const member =
        ordered[index];


      const newNumber =
        index + 1;


      await databases
        .updateDocument(

          DATABASE_ID,

          COLLECTIONS.members,

          member.$id,

          {
            file_no:
              newNumber
          }

        );

    }


    showMessage(
      "memberMessage",
      "檔案編號更新完成。",
      true
    );


    await loadDatabase();


  } catch (error) {


    console.error(
      "重新編號失敗：",
      error
    );


    showMessage(
      "memberMessage",
      "編號失敗，請確認 Christmas Admin 的 UPDATE 權限。"
    );


  } finally {


    button.disabled =
      false;


    button.textContent =
      "依註冊順序重新編號";

  }
}


/* =========================================================
   RSVP
========================================================= */

async function loadRsvp() {


  const body =
    $("rsvpTableBody");


  if (body) {

    body.innerHTML = `

      <tr>

        <td
          colspan="7"
          class="empty-cell"
        >
          正在讀取 RSVP 資料...
        </td>

      </tr>

    `;
  }


  if (
    $("rsvpStatus")
  ) {

    $("rsvpStatus")
      .textContent =
      "讀取中...";
  }


  try {


    const response =
      await fetch(

        RSVP_SUPABASE_URL +

        "/rest/v1/" +

        RSVP_TABLE +

        "?select=id,created_at,name,travel,people,stay_pref,roommate,note" +

        "&order=created_at.desc",

        {

          headers: {

            apikey:
              RSVP_SUPABASE_KEY

          }

        }

      );


    if (
      !response.ok
    ) {

      throw new Error(
        await response.text()
      );
    }


    rsvpRows =
      await response.json();


    if (
      $("rsvpStatus")
    ) {

      $("rsvpStatus")
        .textContent =
        "連線正常";
    }


    renderRsvp();

    renderDashboard();


  } catch (error) {


    console.error(
      "RSVP 讀取失敗：",
      error
    );


    rsvpRows =
      [];


    if (
      $("rsvpStatus")
    ) {

      $("rsvpStatus")
        .textContent =
        "讀取失敗";
    }


    if (
      body
    ) {

      body.innerHTML = `

        <tr>

          <td
            colspan="7"
            class="empty-cell"
          >
            RSVP 資料讀取失敗
          </td>

        </tr>

      `;
    }


    showMessage(
      "rsvpMessage",
      "無法讀取舊 RSVP 資料。"
    );

  }
}


/* =========================================================
   顯示 RSVP
========================================================= */

function renderRsvp() {


  const body =
    $("rsvpTableBody");


  if (!body) {

    return;
  }


  const count =
    rsvpRows.length;


  const drivers =
    rsvpRows.filter(

      row =>
        row.travel ===
        "自己開車"

    ).length;


  const doubleBeds =
    rsvpRows.filter(

      row =>

        row.stay_pref ===
          "雙人床" ||

        row.stay_pref ===
          "希望睡雙人床"

    ).length;


  $("rsvpCount")
    .textContent =
    count;


  $("rsvpDrivers")
    .textContent =
    drivers;


  $("rsvpDouble")
    .textContent =
    doubleBeds;


  if (
    !rsvpRows.length
  ) {


    body.innerHTML = `

      <tr>

        <td
          colspan="7"
          class="empty-cell"
        >
          目前尚無 RSVP 回覆
        </td>

      </tr>

    `;


    return;
  }


  body.innerHTML =
    "";


  rsvpRows
    .forEach(
      row => {


        const tr =
          document
            .createElement(
              "tr"
            );


        const values = [

          row.name ||
            "—",

          row.travel ||
            "—",

          row.travel ===
            "自己開車" &&

          row.people !==
            null

            ? `${row.people} 位`

            : "—",

          row.stay_pref ||
            "—",

          row.roommate ||
            "—",

          row.note ||
            "—",

          formatTime(
            row.created_at
          )

        ];


        values
          .forEach(
            (
              value,
              index
            ) => {


              const td =
                document
                  .createElement(
                    "td"
                  );


              td.textContent =
                value;


              if (
                index === 0
              ) {

                td.className =
                  "member-name";
              }


              tr.appendChild(
                td
              );

            }
          );


        body.appendChild(
          tr
        );

      }
    );
}


/* =========================================================
   情報檔案名單
========================================================= */

function renderSubjects() {


  const container =
    $("subjectList");


  if (
    !container
  ) {

    return;
  }


  if (
    !members.length
  ) {


    container.innerHTML = `

      <div
        class="empty-subject"
      >
        目前沒有成員
      </div>

    `;


    return;
  }


  container.innerHTML =
    members
      .map(
        member => `

          <button
            class="subject-button"
            data-subject-id="${escapeHTML(
              member.$id
            )}"
          >

            <small>

              檔案編號 //
              ${fileNumber(
                member.file_no
              )}

            </small>


            <strong>

              ${escapeHTML(

                member.real_name ||

                member.username ||

                "未知成員"

              )}

            </strong>

          </button>

        `
      )
      .join("");
}


/* =========================================================
   查看情報檔案
========================================================= */

function openIntelligence(
  userId
) {


  const member =
    members.find(

      item =>
        item.$id ===
        userId

    );


  const file =
    targetFiles.find(

      item =>

        item.user_id ===
          userId ||

        item.$id ===
          userId

    );


  if (
    !member
  ) {

    return;
  }


  document
    .querySelectorAll(
      ".subject-button"
    )
    .forEach(
      button => {


        button
          .classList
          .toggle(

            "active",

            button
              .dataset
              .subjectId ===
              userId

          );

      }
    );


  if (
    !file
  ) {


    $("intelDocument")
      .innerHTML = `

        <div
          class="empty-intelligence"
        >

          尚未完成

          <small>
            此成員尚未填寫情報檔案
          </small>

        </div>

      `;


    return;
  }


  const field =
    (
      title,
      value,
      full = false
    ) => `

      <article
        class="intel-field ${
          full
            ? "full"
            : ""
        }"
      >

        <small>
          ${escapeHTML(
            title
          )}
        </small>

        <p>

          ${escapeHTML(
            value ||
            "—"
          )}

        </p>

      </article>

    `;


  $("intelDocument")
    .innerHTML = `


      <div
        class="intel-header"
      >


        <div>


          <small>
            成員情報檔案
          </small>


          <h3>

            ${escapeHTML(

              member.real_name ||

              "未知成員"

            )}

          </h3>


        </div>


        <div
          class="intel-file-number"
        >

          檔案 //
          ${fileNumber(
            member.file_no
          )}

        </div>


      </div>



      <div
        class="intel-grid"
      >


        ${field(
          "會員帳號",
          member.username
        )}


        ${field(
          "性別",
          file.gender
        )}


        ${field(
          "生日區間",
          file.birthday_range
        )}


        ${field(
          "身高區間",
          file.height_range
        )}


        ${field(
          "是否抽菸",
          file.smoked
        )}


        ${field(
          "是否有寵物",
          file.has_pet
        )}


        ${field(
          "飲酒頻率",
          file.alcohol_frequency
        )}


        ${field(
          "生活型態",
          file.lifestyle
        )}


        ${field(
          "甜食偏好",
          file.sweet_preference
        )}


        ${field(
          "想要的禮物 / 願望",
          file.wish,
          true
        )}


        ${field(
          "喜好",
          file.preference,
          true
        )}


        ${field(
          "給送禮者的留言",
          file.message,
          true
        )}


      </div>

    `;
}



/* =========================================================
   禮物配對
========================================================= */

function getAssignmentMember(userId) {
  return members.find(member => member.$id === userId);
}

function shuffleArray(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const random = Math.floor(Math.random() * (i + 1));
    [result[i], result[random]] = [result[random], result[i]];
  }

  return result;
}

function createRandomAssignments() {
  if (members.length < 2) {
    showMessage("assignmentMessage", "至少需要 2 位成員才能進行配對。");
    return;
  }

  const shuffled = shuffleArray(members);

  assignmentPreview = shuffled.map((member, index) => {
    const target = shuffled[(index + 1) % shuffled.length];

    return {
      agent_id: member.$id,
      target_id: target.$id,
      active: true
    };
  });

  renderAssignments(assignmentPreview, true);

  $("regenerateAssignments").disabled = false;
  $("saveAssignments").disabled = false;

  showMessage(
    "assignmentMessage",
    "已產生配對預覽，目前尚未寫入資料庫。",
    true
  );
}

function renderAssignments(rows = assignments, preview = false) {
  const body = $("assignmentTableBody");

  if (!body) return;

  $("assignmentMemberCount").textContent = members.length;

  if (!rows || !rows.length) {
    body.innerHTML = `
      <tr>
        <td colspan="6" class="empty-cell">
          尚未建立交換禮物配對
        </td>
      </tr>
    `;

    $("assignmentCount").textContent = "0";
    $("assignmentStatus").textContent = "尚未建立";
    $("regenerateAssignments").disabled = false;
    $("saveAssignments").disabled = true;
    $("clearAssignments").disabled = true;
    return;
  }

  body.innerHTML = rows.map(row => {
    const agent = getAssignmentMember(row.agent_id);
    const target = getAssignmentMember(row.target_id);

    const agentName = agent
      ? (agent.real_name || agent.username || "未知成員")
      : "未知成員";

    const targetName = target
      ? (target.real_name || target.username || "未知成員")
      : "未知成員";

    return `
      <tr>
        <td class="file-number">
          ${agent ? fileNumber(agent.file_no) : "--"}
        </td>

        <td class="member-name">
          ${escapeHTML(agentName)}
        </td>

        <td style="text-align:center;font-weight:700;">→</td>

        <td class="file-number">
          ${target ? fileNumber(target.file_no) : "--"}
        </td>

        <td class="member-name">
          ${escapeHTML(targetName)}
        </td>

        <td class="${preview ? "status-pending" : "status-complete"}">
          ${preview ? "預覽" : "已確認"}
        </td>
      </tr>
    `;
  }).join("");

  $("assignmentCount").textContent = rows.length;
  $("assignmentStatus").textContent = preview ? "預覽中" : "已完成";
  $("clearAssignments").disabled = preview || !assignments.length;
}

async function loadAssignments() {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.assignments,
      [Appwrite.Query.limit(100)]
    );

    assignments = response.documents.filter(
      row => row.active !== false
    );

    assignmentPreview = [];

    renderAssignments(assignments, false);

    $("saveAssignments").disabled = true;
    $("clearAssignments").disabled = assignments.length === 0;

    showMessage(
      "assignmentMessage",
      assignments.length
        ? `已讀取 ${assignments.length} 筆正式配對。`
        : "目前尚未建立正式配對。",
      assignments.length > 0
    );
  } catch (error) {
    console.error("讀取配對失敗：", error);
    showMessage(
      "assignmentMessage",
      "無法讀取配對資料，請確認 Assignments 權限。"
    );
  }
}

async function saveAssignments() {
  if (!assignmentPreview.length) {
    showMessage(
      "assignmentMessage",
      "目前沒有可以儲存的配對預覽。"
    );
    return;
  }

  const confirmed = confirm(
    "確定要將目前的配對正式儲存嗎？\n\n儲存後會寫入 Assignments 資料表。"
  );

  if (!confirmed) return;

  const button = $("saveAssignments");
  button.disabled = true;
  button.textContent = "儲存中...";

  try {
    const agents = new Set(
      assignmentPreview.map(row => row.agent_id)
    );

    const targets = new Set(
      assignmentPreview.map(row => row.target_id)
    );

    const hasSelfAssignment = assignmentPreview.some(
      row => row.agent_id === row.target_id
    );

    if (
      agents.size !== members.length ||
      targets.size !== members.length ||
      hasSelfAssignment
    ) {
      throw new Error("配對完整性檢查失敗");
    }

    const oldResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.assignments,
      [Appwrite.Query.limit(100)]
    );

    for (const oldRow of oldResponse.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.assignments,
        oldRow.$id
      );
    }

    for (const row of assignmentPreview) {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.assignments,
        Appwrite.ID.unique(),
        {
          agent_id: row.agent_id,
          target_id: row.target_id,
          active: true
        },
        [
          Appwrite.Permission.read(Appwrite.Role.user(row.agent_id))
        ]
      );

      // 讓送禮者只能讀取自己 TARGET 的成員資料與情報檔案。
      // 管理員仍透過 Christmas Admin 的資料表權限管理全部資料。
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.members,
        row.target_id,
        {},
        [
          Appwrite.Permission.read(Appwrite.Role.user(row.target_id)),
          Appwrite.Permission.update(Appwrite.Role.user(row.target_id)),
          Appwrite.Permission.read(Appwrite.Role.user(row.agent_id))
        ]
      );

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.targetFiles,
        row.target_id,
        {},
        [
          Appwrite.Permission.read(Appwrite.Role.user(row.target_id)),
          Appwrite.Permission.update(Appwrite.Role.user(row.target_id)),
          Appwrite.Permission.read(Appwrite.Role.user(row.agent_id))
        ]
      );
    }

    assignmentPreview = [];

    showMessage(
      "assignmentMessage",
      "交換禮物配對已正式儲存。",
      true
    );

    await loadAssignments();
  } catch (error) {
    console.error("儲存配對失敗：", error);
    showMessage(
      "assignmentMessage",
      "配對儲存失敗，請重新整理後確認資料。"
    );
  } finally {
    button.disabled = false;
    button.textContent = "確認並儲存配對";
  }
}

async function clearAssignments() {
  if (!assignments.length) return;

  if (!confirm("確定要清除目前的正式配對嗎？")) return;

  if (!confirm(
    "再次確認：清除後，所有人的交換禮物配對都會被刪除。"
  )) return;

  const button = $("clearAssignments");
  button.disabled = true;
  button.textContent = "清除中...";

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.assignments,
      [Appwrite.Query.limit(100)]
    );

    for (const row of response.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.assignments,
        row.$id
      );
    }

    assignments = [];
    assignmentPreview = [];

    renderAssignments([], false);

    showMessage(
      "assignmentMessage",
      "正式配對已清除。",
      true
    );
  } catch (error) {
    console.error("清除配對失敗：", error);
    showMessage(
      "assignmentMessage",
      "清除配對失敗，請確認管理員刪除權限。"
    );
  } finally {
    button.disabled = assignments.length === 0;
    button.textContent = "清除正式配對";
  }
}


/* =========================================================
   EVENT
========================================================= */

$("adminLoginButton")
  .addEventListener(
    "click",
    adminLogin
  );


$("adminPassword")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        adminLogin();
      }

    }
  );


$("adminEmail")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        $("adminPassword")
          .focus();
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
    async () => {

      await loadDatabase();

      await loadRsvp();

    }
  );


$("refreshMembers")
  .addEventListener(
    "click",
    loadDatabase
  );


$("refreshRsvp")
  .addEventListener(
    "click",
    loadRsvp
  );


$("renumberMembers")
  .addEventListener(
    "click",
    renumberMembers
  );

$("generateAssignments").addEventListener(
  "click",
  createRandomAssignments
);

$("regenerateAssignments").addEventListener(
  "click",
  createRandomAssignments
);

$("saveAssignments").addEventListener(
  "click",
  saveAssignments
);

$("clearAssignments").addEventListener(
  "click",
  clearAssignments
);

$("refreshAssignments").addEventListener(
  "click",
  loadAssignments
);

$("toggleTargetMission")?.addEventListener(
  "click",
  toggleTargetMission
);


document
  .addEventListener(
    "click",
    event => {


      const navButton =
        event.target.closest(
          "[data-admin-page]"
        );


      if (
        navButton
      ) {

        openAdminPage(
          navButton
            .dataset
            .adminPage
        );

        return;
      }


      const subjectButton =
        event.target.closest(
          "[data-subject-id]"
        );


      if (
        subjectButton
      ) {

        openIntelligence(
          subjectButton
            .dataset
            .subjectId
        );
      }

    }
  );


/* =========================================================
   TARGET 活動控制
========================================================= */

function renderTargetMissionControl() {
  const status = $("targetControlStatus");
  const button = $("toggleTargetMission");

  if (status) {
    status.textContent = targetMissionActive ? "已開放" : "尚未開放";
    status.classList.toggle("locked", !targetMissionActive);
    status.classList.toggle("active", targetMissionActive);
  }

  if (button) {
    button.textContent = targetMissionActive ? "關閉 TARGET" : "開放 TARGET";
  }
}

async function toggleTargetMission() {
  const nextValue = !targetMissionActive;
  const actionText = nextValue ? "開放" : "關閉";

  if (!confirm(`確定要${actionText} TARGET 嗎？`)) return;

  const button = $("toggleTargetMission");
  if (button) {
    button.disabled = true;
    button.textContent = "更新中...";
  }

  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.settings,
      "main",
      { target_mission_active: nextValue }
    );

    targetMissionActive = nextValue;
    renderTargetMissionControl();
  } catch (error) {
    console.error("TARGET 狀態更新失敗：", error);
    alert("TARGET 狀態更新失敗，請確認 Settings 權限。");
  } finally {
    if (button) button.disabled = false;
  }
}

/* =========================================================
   初始化
========================================================= */

window
  .addEventListener(
    "DOMContentLoaded",
    async () => {


      /*
        後台重新整理後
        強制重新登入
      */

      try {

        await account
          .deleteSession(
            "current"
          );

      } catch (error) {

        // 沒有 Session 不處理
      }


      adminUser =
        null;


      members =
        [];


      targetFiles =
        [];


      rsvpRows =
        [];

      assignments = [];
      assignmentPreview = [];


      showAdminLogin();

    }
  );
