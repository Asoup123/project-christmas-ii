/* =========================
   SUPABASE
========================= */

const SUPABASE_URL = "https://sdkgiedglmhmchiietru.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ofwe1YigppMHJjcWu_VjUA_XF7wNzEm";

/* =========================
   AUTHORIZED AGENTS
========================= */

const allowedAgents = [
  "ㄊㄔㄒ",
  "ㄈㄒㄒ",
  "ㄓㄧㄧ",
  "ㄌㄨㄩ",
  "ㄌㄕㄨ",
  "ㄏㄩㄉ",
  "ㄧㄑㄏ",
  "ㄘㄅㄎ",
  "ㄍㄒㄩ",
  "ㄏㄆㄐ",
  "ㄨㄔㄩ",
  "ㄔㄧㄊ",
  "ㄌㄓㄩ"
];

let verifying = false;


/* =========================
   WAIT
========================= */

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* =========================
   TYPEWRITER
========================= */

async function typeText(
  element,
  text,
  speed = 35
) {

  for (const character of text) {

    element.innerHTML += character;

    await wait(speed);

  }

}


/* =========================
   TERMINAL LINE
========================= */

async function terminalLine(
  english,
  chinese
) {

  const output =
    document.getElementById("terminalOutput");

  output.innerHTML = "";

  const englishLine =
    document.createElement("div");

  output.appendChild(englishLine);

  await typeText(
    englishLine,
    "> " + english,
    30
  );

  const cursor =
    document.createElement("span");

  cursor.className = "cursor";

  englishLine.appendChild(cursor);

  await wait(250);

  cursor.remove();

  const chineseLine =
    document.createElement("div");

  chineseLine.className = "zh";

  output.appendChild(chineseLine);

  await typeText(
    chineseLine,
    "  " + chinese,
    55
  );

}


/* =========================
   VERIFICATION PROGRESS
========================= */

function setProgress(value) {

  document
    .getElementById("progressBar")
    .style.width = value + "%";

  document
    .getElementById("percentage")
    .textContent = value + "%";

}


/* =========================
   VERIFY AGENT
========================= */

async function verifyAgent() {

  if (verifying) return;

  const input =
    document.getElementById("agentCode");

  const button =
    document.getElementById("verifyButton");

  const terminal =
    document.getElementById("terminal");

  const output =
    document.getElementById("terminalOutput");

  const agentRead =
    document.getElementById("agentRead");

  const agentValue =
    document.getElementById("agentValue");

  const message =
    document.getElementById("message");

  const flash =
    document.getElementById("screenFlash");

  const code =
    input.value.trim();


  /* EMPTY */

  if (!code) {

    message.className =
      "message error";

    message.innerHTML =
      "<strong>INPUT REQUIRED</strong><br>" +
      "請先輸入行動代號。";

    return;

  }


  verifying = true;

  input.disabled = true;
  button.disabled = true;

  message.className = "message";
  message.innerHTML = "";

  terminal.classList.add("active");

  output.innerHTML = "";

  agentRead.classList.remove("show");

  agentValue.innerHTML = "";

  setProgress(0);


  /* =========================
     STEP 01
  ========================= */

  await terminalLine(
    "INITIALIZING SECURITY TERMINAL...",
    "正在啟動身分驗證系統..."
  );

  setProgress(8);

  await wait(400);


  /* =========================
     STEP 02
  ========================= */

  await terminalLine(
    "SCANNING IDENTITY...",
    "正在讀取行動代號..."
  );

  setProgress(20);

  await wait(350);


  /* =========================
     READ AGENT CODE
  ========================= */

  agentRead.classList.add("show");

  for (const character of code) {

    agentValue.innerHTML += character;

    await wait(420);

  }

  await wait(550);

  setProgress(34);


  /* =========================
     STEP 03
  ========================= */

  await terminalLine(
    "ACCESSING CLASSIFIED DATABASE...",
    "正在存取 PROJECT : CHRISTMAS II 受邀名單..."
  );

  setProgress(51);

  await wait(500);


  /* =========================
     STEP 04
  ========================= */

  await terminalLine(
    "MATCHING AUTHORIZED PERSONNEL...",
    "正在比對授權成員資料..."
  );

  setProgress(68);

  await wait(650);


  /* =========================
     STEP 05
  ========================= */

  await terminalLine(
    "VERIFYING SECURITY CLEARANCE...",
    "正在確認本次行動存取權限..."
  );

  setProgress(84);

  await wait(750);


  /* =========================
     STEP 06
  ========================= */

  await terminalLine(
    "RUNNING FINAL IDENTITY CHECK...",
    "正在執行最終身分確認..."
  );

  setProgress(96);

  await wait(900);


  /* =========================
     CHECK
  ========================= */

  const isAllowed =
    allowedAgents.includes(code);

  setProgress(100);

  await wait(650);


  /* =========================
     SUCCESS
  ========================= */

  if (isAllowed) {

    await terminalLine(
      "IDENTITY MATCH FOUND.",
      "身分比對成功。"
    );

    await wait(800);

    terminal.classList.remove("active");

    message.className =
      "message success";

    message.innerHTML =
      "<strong>ACCESS GRANTED</strong><br>" +
      "AGENT " +
      code +
      " VERIFIED<br>" +
      "身分確認完成。" +
      "<span class='hint'>" +
      "正在解密 PROJECT : CHRISTMAS II 行動資料……" +
      "</span>";

    flash.classList.remove("show");

    void flash.offsetWidth;

    flash.classList.add("show");


    /*
      讓 ACCESS GRANTED
      留在畫面一下
    */

    await wait(1400);


    /* 開始解密第二頁 */

    await decryptMissionFile();

  }


  /* =========================
     FAILED
  ========================= */

  else {

    await terminalLine(
      "IDENTITY MATCH FAILED.",
      "授權名單中查無此代號。"
    );

    await wait(850);

    terminal.classList.remove("active");

    message.className =
      "message error";

    message.innerHTML =
      "<strong>ACCESS DENIED</strong><br>" +
      "查無此行動代號。" +

      "<span class='hint'>" +
      "提示：你的行動代號已記載於先前發送的 " +
      "<strong>PROJECT : CHRISTMAS II 邀請函</strong> 中。<br>" +
      "請確認邀請函上的代號後重新驗證。" +
      "</span>";

    input.disabled = false;
    button.disabled = false;

    verifying = false;

  }

}


/* =========================
   DECRYPT MISSION
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

  document
    .getElementById("loginPage")
    .classList.add("hidden");

  document
    .getElementById("missionPage")
    .classList.remove("hidden");

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
      document.getElementById("agentCode").value.trim();

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
   ENTER
========================= */

document
  .getElementById("agentCode")
  .addEventListener(
    "keydown",
    function(event) {

      if (event.key === "Enter") {

        verifyAgent();

      }

    }
  );


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

    if (value === "雙人床") {
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

  const select =
    document.getElementById("roommateCode");

  const currentAgent =
    document.getElementById("agentCode")
      .value
      .trim();

  select.innerHTML =
    '<option value="">請選擇行動代號</option>';

  allowedAgents.forEach(function(agent) {

    if (agent === currentAgent) return;

    const option =
      document.createElement("option");

    option.value = agent;
    option.textContent = agent;

    select.appendChild(option);

  });

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
    missionResponse.lodging === "雙人床" &&
    !missionResponse.roommate
  ) {
    showRsvpError("請選擇希望共用雙人床的行動成員。");
    return;
  }

  message.classList.add("hidden");

  const agent =
    document.getElementById("agentCode")
      .value
      .trim();

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

  if (missionResponse.lodging === "雙人床") {
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

  const agent = document.getElementById("agentCode").value.trim();
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
    roommate: missionResponse.lodging === "雙人床"
      ? missionResponse.roommate
      : null,
    note: missionResponse.notes || null
  };

  try {
    const response = await fetch(
      SUPABASE_URL + "/rest/v1/christmas_2026_rsvp",
      {
        method: "POST",
        headers: {
          "apikey": SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error("Supabase " + response.status + ": " + await response.text());
    }

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
