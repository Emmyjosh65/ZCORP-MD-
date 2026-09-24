/*
  IMPORTANT:

  Put the PUBLIC HTTPS URL of your Pterodactyl ZCORP-MD server here.

  Example:

  const API_BASE = "https://zcorp-bot.example.com";

  The API must be the server running the actual Baileys bot.
*/

const API_BASE =
  (window.ZCORP_API_BASE ||
    "https://YOUR-PTERODACTYL-DOMAIN")
  .replace(/\/$/, "");


const form = document.getElementById("pairForm");

const phoneInput =
  document.getElementById("phone");

const pairButton =
  document.getElementById("pairButton");

const btnText =
  document.getElementById("btnText");

const result =
  document.getElementById("result");

const pairCode =
  document.getElementById("pairCode");

const copyBtn =
  document.getElementById("copyBtn");

const resultText =
  document.getElementById("resultText");

const statusPill =
  document.getElementById("statusPill");

const statusText =
  statusPill.querySelector("span");

const message =
  document.getElementById("message");


let pollTimer = null;

let currentSession = null;


/* =========================================
   PHONE CLEANER
========================================= */

function cleanPhone(value) {

  return String(value || "")
    .replace(/\D/g, "");

}


/* =========================================
   BUTTON STATE
========================================= */

function setBusy(busy) {

  pairButton.disabled = busy;

  btnText.textContent =
    busy
      ? "Connecting to WhatsApp…"
      : "Get Real Pairing Code";

}


/* =========================================
   MESSAGE
========================================= */

function showMessage(text = "") {

  message.textContent = text;

}


/* =========================================
   STATUS
========================================= */

function setStatus(kind, text) {

  statusPill.className =
    `status-pill ${kind}`;

  statusText.textContent = text;

}


/* =========================================
   SHOW REAL CODE
========================================= */

function showCode(code) {

  /*
    IMPORTANT:

    This value comes directly from:

    sock.requestPairingCode(phone)

    We do NOT generate it here.
  */

  pairCode.textContent =
    code || "--------";

  result.hidden = false;

  resultText.textContent =
    "Open WhatsApp → Settings → Linked Devices → " +
    "Link a device → Link with phone number instead, " +
    "then enter this exact code.";

  setStatus(
    "waiting",
    "Waiting for WhatsApp to accept the code"
  );

}


/* =========================================
   REQUEST REAL BAILEYS CODE
========================================= */

async function requestPairing(phone) {

  const response =
    await fetch(
      `${API_BASE}/api/pair`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          phone: phone
        })
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok || !data.ok) {

    throw new Error(
      data.error ||
      `Pairing server returned ${response.status}`
    );

  }


  return data;

}


/* =========================================
   CHECK SESSION STATUS
========================================= */

async function pollStatus(sessionId) {

  clearTimeout(pollTimer);


  try {

    const response =
      await fetch(
        `${API_BASE}/api/pair/status?id=${encodeURIComponent(sessionId)}`,
        {
          cache: "no-store"
        }
      );


    const data =
      await response
        .json()
        .catch(() => ({}));


    if (data.status === "connected") {

      setStatus(
        "connected",
        "WhatsApp connected successfully"
      );


      resultText.textContent =
        "✅ Your WhatsApp session is now connected " +
        "to ZCORP-MD. You can send .menu on WhatsApp.";


      setBusy(false);

      return;

    }


    if (
      data.status === "pairing_failed" ||
      data.status === "logged_out"
    ) {

      setStatus(
        "error",
        "Pairing was rejected — request a fresh code"
      );


      resultText.textContent =
        "WhatsApp rejected this pairing attempt. " +
        "Tap Get Real Pairing Code and use the new code immediately.";

      return;

    }


    setStatus(
      "waiting",
      "Waiting for WhatsApp to accept the code"
    );


    pollTimer =
      setTimeout(
        () => pollStatus(sessionId),
        2500
      );

  }

  catch {

    pollTimer =
      setTimeout(
        () => pollStatus(sessionId),
        4000
      );

  }

}


/* =========================================
   PAIR FORM
========================================= */

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    clearTimeout(pollTimer);

    showMessage("");

    result.hidden = true;


    const phone =
      cleanPhone(phoneInput.value);


    if (
      phone.length < 8 ||
      phone.length > 15
    ) {

      showMessage(
        "Enter a valid international WhatsApp number, " +
        "for example 2349066760078."
      );

      phoneInput.focus();

      return;

    }


    /*
      Prevent accidental deployment while
      API_BASE still contains the placeholder.
    */

    if (
      API_BASE.includes(
        "YOUR-PTERODACTYL-DOMAIN"
      )
    ) {

      showMessage(
        "Set API_BASE in script.js to your public " +
        "Pterodactyl HTTPS URL first."
      );

      return;

    }


    setBusy(true);

    btnText.textContent =
      "Requesting real Baileys code…";


    try {

      const data =
        await requestPairing(phone);


      currentSession =
        data.id;


      /*
        data.code is the ACTUAL code returned
        by Baileys.
      */

      showCode(data.code);


      pollStatus(data.id);

    }

    catch (error) {

      showMessage(
        error.message ||
        "Unable to generate a pairing code."
      );

      setBusy(false);

    }

  }
);


/* =========================================
   COPY CODE
========================================= */

copyBtn.addEventListener(
  "click",
  async () => {

    const code =
      pairCode.textContent.trim();


    if (
      !code ||
      code === "--------"
    ) {
      return;
    }


    try {

      await navigator.clipboard.writeText(code);

      copyBtn.textContent = "✓";


      setTimeout(
        () => {
          copyBtn.textContent = "⧉";
        },
        1200
      );

    }

    catch {

      showMessage(
        "Copy failed. Long-press the code and copy it manually."
      );

    }

  }
);


/* =========================================
   NUMBER INPUT
========================================= */

phoneInput.addEventListener(
  "input",
  () => {

    phoneInput.value =
      cleanPhone(phoneInput.value)
        .slice(0, 15);

  }
);
