const API_BASE = "";

const phoneInput = document.getElementById("phone");
const generateBtn = document.getElementById("generateBtn");
const result = document.getElementById("result");
const codeBox = document.getElementById("codeBox");
const copyBtn = document.getElementById("copyBtn");
const statusText = document.getElementById("status");

function showStatus(message, type = "") {
    if (!statusText) return;

    statusText.textContent = message;
    statusText.className = `status ${type}`;
}

function showError(message) {
    if (result) {
        result.style.display = "block";
    }

    if (codeBox) {
        codeBox.textContent = "ERROR";
    }

    showStatus(message, "error");
}

function normalizePhone(value) {
    return value.replace(/\D/g, "");
}

if (generateBtn) {
    generateBtn.addEventListener("click", async () => {

        const phone = normalizePhone(phoneInput.value);

        if (!phone) {
            showError("Enter your WhatsApp number.");
            return;
        }

        if (phone.length < 10) {
            showError("Enter a valid international WhatsApp number.");
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = "GENERATING...";
        
        if (result) {
            result.style.display = "block";
        }

        if (codeBox) {
            codeBox.textContent = "••••••••";
        }

        showStatus("Connecting to ZCORP-MD...", "");

        try {

            const response = await fetch(
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

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(
                    data.error ||
                    "Pairing request failed."
                );
            }

            if (!data.code) {
                throw new Error(
                    "The ZCORP-MD server did not return a pairing code."
                );
            }

            /*
             * REAL BAILEYS CODE
             */
            codeBox.textContent = data.code;

            showStatus(
                "REAL BAILEYS PAIRING CODE GENERATED ✓",
                "success"
            );

            if (data.id) {
                pollStatus(data.id);
            }

        } catch (error) {

            console.error(error);

            showError(
                error.message ||
                "Unable to connect to ZCORP-MD."
            );

        } finally {

            generateBtn.disabled = false;
            generateBtn.textContent = "Get Real Pairing Code";

        }
    });
}


async function pollStatus(id) {

    let attempts = 0;

    const interval = setInterval(async () => {

        attempts++;

        try {

            const response = await fetch(
                `${API_BASE}/api/pair/status?id=${encodeURIComponent(id)}`
            );

            const data = await response.json();

            if (data.code && codeBox) {
                codeBox.textContent = data.code;
            }

            if (
                data.status === "connected" ||
                data.status === "success"
            ) {

                showStatus(
                    "WhatsApp connected successfully ✓",
                    "success"
                );

                clearInterval(interval);
            }

            if (attempts >= 60) {
                clearInterval(interval);
            }

        } catch (error) {

            console.log(
                "Pairing status check:",
                error.message
            );

        }

    }, 2000);
}


if (copyBtn) {

    copyBtn.addEventListener("click", async () => {

        const code =
            codeBox?.textContent?.trim();

        if (
            !code ||
            code === "••••••••" ||
            code === "ERROR"
        ) {
            return;
        }

        try {

            await navigator.clipboard.writeText(code);

            copyBtn.textContent = "COPIED ✓";

            setTimeout(() => {
                copyBtn.textContent = "COPY CODE";
            }, 2000);

        } catch (error) {

            alert(
                "Copy failed. Please copy the code manually."
            );

        }

    });

}
