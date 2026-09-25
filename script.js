/*
  ZCORP-MD
  Godwin Emmanuel (Zeus)

  Real Baileys pairing frontend.

  If the website is served by the Node bot:
      /api

  If the website is hosted separately on GitHub Pages:
  the page must point to the public Node/Baileys backend.
*/

const API_BASE =
  (window.ZCORP_API_BASE || "/api")
    .replace(/\/$/, "");

const form =
  document.getElementById("pairForm");

const phoneInput =
  document.getElementById("phone");

const pairButton =
  document.getElementById("pairButton");

const result =
  document.getElementById("result");

const codeEl =
  document.getElementById("pairingCode");

const statusEl =
  document.getElementById("status");

const copyButton =
  document.getElementById("copyButton");

let pollTimer = null;


function setStatus(text, kind = "") {

  statusEl.textContent = text;

  statusEl.className =
    `status ${kind}`.trim();
}


function normalizePhone(value) {

  return String(value || "")
    .replace(/\D/g, "");
}


function showCode(code) {

  const raw =
    String(code || "")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();

  if (raw.length !== 8) {

    setStatus(
      "❌ Baileys did not return a valid 8-character pairing code. No fake code was shown.",
      "err"
    );

    return false;
  }

  codeEl.textContent = raw;

  result.classList.remove("hidden");

  return true;
}


async function poll(sessionId) {

  clearTimeout(pollTimer);

  try {

    const res =
      await fetch(
        `${API_BASE}/status/${encodeURIComponent(sessionId)}`,
        {
          cache: "no-store"
        }
      );

    const data =
      await res.json();

    if (!res.ok || !data.ok) {

      throw new Error(
        data.error ||
        "Unable to read pairing status"
      );
    }


    if (data.code) {

      showCode(data.code);

    }


    if (
      data.status === "connected" ||
      data.connected
    ) {

      setStatus(
        "🟢 WhatsApp connected successfully.",
        "ok"
      );

      pairButton.disabled = false;

      return;
    }


    if (
      data.status === "pairing_failed"
    ) {

      setStatus(
        `❌ ${
          data.error ||
          "WhatsApp rejected the pairing request."
        }`,
        "err"
      );

      pairButton.disabled = false;

      return;
    }


    if (
      data.status === "pairing_expired"
    ) {

      setStatus(
        "⌛ Pairing code expired. Request a fresh code.",
        "err"
      );

      pairButton.disabled = false;

      return;
    }


    setStatus(
      data.code
        ? "🔐 Real Baileys code generated. Enter it on your phone now."
        : "📡 Connecting to WhatsApp…"
    );


    pollTimer =
      setTimeout(
        () => poll(sessionId),
        1500
      );


  } catch (err) {

    setStatus(
      `⚠️ ${
        err.message ||
        "Connection error"
      }`,
      "err"
    );

    pairButton.disabled = false;
  }
}


form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    clearTimeout(pollTimer);


    const phone =
      normalizePhone(
        phoneInput.value
      );


    if (
      phone.length < 8 ||
      phone.length > 15
    ) {

      result.classList.remove(
        "hidden"
      );

      setStatus(
        "❌ Enter a valid international WhatsApp number.",
        "err"
      );

      return;
    }


    pairButton.disabled = true;

    result.classList.remove(
      "hidden"
    );

    codeEl.textContent =
      "--------";


    setStatus(
      "📡 Starting a real Baileys pairing session…"
    );


    try {

      const res =
        await fetch(
          `${API_BASE}/pair`,
          {
            method: "POST",

            headers: {
              "content-type":
                "application/json"
            },

            body: JSON.stringify({
              phone
            })
          }
        );


      const data =
        await res.json();


      if (!res.ok || !data.ok) {

        throw new Error(
          data.error ||
          "Pairing request failed"
        );
      }


      const returnedCode =
        String(data.code || "")
          .replace(
            /[^A-Za-z0-9]/g,
            ""
          );


      if (
        returnedCode.length !== 8
      ) {

        throw new Error(
          "Backend did not return a real 8-character Baileys pairing code."
        );
      }


      showCode(data.code);


      setStatus(
        "🔐 Real code generated. Enter it on your phone immediately."
      );


      poll(data.sessionId);


    } catch (err) {

      setStatus(
        `❌ ${
          err.message ||
          "Pairing request failed"
        }`,
        "err"
      );

      pairButton.disabled = false;
    }

  }
);


copyButton.addEventListener(
  "click",
  async () => {

    const code =
      codeEl.textContent.trim();


    if (
      !/^[A-Z0-9]{8}$/.test(code)
    ) {

      return;
    }


    try {

      await navigator.clipboard
        .writeText(code);

      setStatus(
        "✅ Pairing code copied."
      );

    } catch {

      setStatus(
        "⚠️ Copy failed. Press and hold the code to copy it.",
        "err"
      );

    }

  }
);
