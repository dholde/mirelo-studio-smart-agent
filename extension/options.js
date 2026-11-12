const KEY = "openaiApiKey";
const keyInput = document.querySelector("#key");
const rememberInput = document.querySelector("#remember");
const status = document.querySelector("[data-status]");

async function lockStorage() {
  await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  await chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
}

async function load() {
  await lockStorage();
  const [session, local] = await Promise.all([
    chrome.storage.session.get(KEY),
    chrome.storage.local.get(KEY),
  ]);
  const sessionKey = typeof session[KEY] === "string" ? session[KEY] : "";
  const localKey = typeof local[KEY] === "string" ? local[KEY] : "";
  keyInput.value = sessionKey || localKey;
  rememberInput.checked = Boolean(localKey);
  status.textContent = sessionKey || localKey ? "A key is saved in this browser." : "No key saved.";
}

document.querySelector("form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const key = keyInput.value.trim();
  if (!key) {
    status.textContent = "Enter an API key.";
    return;
  }
  await lockStorage();
  await chrome.storage.session.set({ [KEY]: key });
  if (rememberInput.checked) await chrome.storage.local.set({ [KEY]: key });
  else await chrome.storage.local.remove(KEY);
  status.textContent = rememberInput.checked
    ? "Saved on this device. The key is stored unencrypted in your Chrome profile."
    : "Saved for this browser session. It clears when the browser quits.";
});

document.querySelector("[data-delete]").addEventListener("click", async () => {
  await lockStorage();
  await chrome.storage.session.remove(KEY);
  await chrome.storage.local.remove(KEY);
  keyInput.value = "";
  rememberInput.checked = false;
  status.textContent = "Key deleted.";
});

load();
