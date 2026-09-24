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
    return String(value).replace(/\D/g, "");
}

if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
        const phone = normalizePhone(
            phoneInput?.value || ""
        );

        if (!phone) {
            showError("Enter your WhatsApp number.");
            return;
        }

        if (phone.length < 10) {
            showError(
                "Enter a valid international WhatsApp number."
            );
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

        showStatus(
            "Connecting to ZCORP-MD...",
            ""
        );

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

            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    `Server returned HTTP ${response.status}`
                );
            }

            if (!response.ok || !data.ok) {
                throw new Error(
                    data.error ||
                    "Pairing request failed."
                );
            }

            if (!data.id) {
                throw new Error(
                    "Pairing server did not return an ID."
                );
            }

            showStatus(
                "Waiting for real Baileys pairing code..."
            );

            await waitForCode(data.id);

        } catch (error) {
            console.error(
                "[ZCORP-MD PAIRING]",
                error
            );

            showError(
                error.message ||
                "Unable to connect to ZCORP-MD."
            );

        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent =
                "Get Real Pairing Code";
        }
    });
}

async function waitForCode(id) {
    const maxAttempts = 60;

    for (
        let attempt = 0;
        attempt < maxAttempts;
        attempt++
    ) {
        try {
            const response = await fetch(
                `${API_BASE}/api/pair/status?id=${encodeURIComponent(id)}`
            );

            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    `Status server returned HTTP ${response.status}`
                );
            }

            if (data.code) {
                if (codeBox) {
                    codeBox.textContent = data.code;
                }

                showStatus(
                    "REAL BAILEYS PAIRING CODE READY ✓",
                    "success"
                );

                return;
            }

            if (data.status === "error") {
                throw new Error(
                    data.error ||
                    "WhatsApp pairing failed."
                );
            }

            if (data.status === "connected") {
                showStatus(
                    "WhatsApp connected successfully ✓",
                    "success"
                );

                return;
            }

            showStatus(
                `Waiting for pairing code... ${attempt + 1}/60`
            );

        } catch (error) {
            throw error;
        }

        await new Promise(
            resolve => setTimeout(resolve, 2000)
        );
    }

    throw new Error(
        "Pairing code request timed out."
    );
}

if (copyBtn) {
    copyBtn.addEventListener(
        "click",
        async () => {
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
                await navigator.clipboard.writeText(
                    code
                );

                copyBtn.textContent =
                    "COPIED ✓";

                setTimeout(() => {
                    copyBtn.textContent =
                        "COPY CODE";
                }, 2000);

            } catch {
                alert(
                    "Copy failed. Please copy the code manually."
                );
            }
        }
    );
}
