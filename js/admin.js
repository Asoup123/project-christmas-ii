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


    $("databaseStatus")
      .textContent =
      "資料庫連線正常";


    renderDashboard();

    renderMembers();

    renderSubjects();


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


      showAdminLogin();

    }
  );
