import { apiFetch } from "../core/api.js";
import { loadCurrentUser, getCurrentUser } from "../core/auth.js";
import { showMessage, initModals, openModal } from "../core/ui.js";
import { initHeader, updateHeaderUI } from "../layout/header.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1️⃣ Initialize shared header (hamburger + auth UI)
    initHeader();
    initModals();
    // 2️⃣ Load logged-in user (if any)
    const user = await loadCurrentUser();

    if (user?.role === "admin") {
      window.location.replace("admin.html");
      return;
    }

    // 3️⃣ Update header buttons (Sign In / Sign Out / Admin link)
    updateHeaderUI();

    // 4️⃣ Load newspapers
    await loadNewspapers("All");

    // 5️⃣ Setup language filters
    setupFilters();

    // 6️⃣ Setup download handler
    setupDownloadHandler();
  } catch (error) {
    console.error("Home initialization error:", error);
  }
});

// ===============================
// 🔹 FILTERS
// ===============================

function setupFilters() {
  document.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", async () => {
      document
        .querySelectorAll(".filter-button")
        .forEach((btn) => btn.classList.remove("active"));

      button.classList.add("active");

      await loadNewspapers(button.dataset.language);
    });
  });
}

// ===============================
// 🔹 DOWNLOAD HANDLER
// ===============================

function setupDownloadHandler() {
  const grid = document.getElementById("newspaperGrid");
  if (!grid) return;

  grid.addEventListener("click", async (e) => {
    const button = e.target.closest(".download-button");
    if (!button) return;

    const user = getCurrentUser();

    // 🚫 Not logged in
    if (!user) {
      showMessage("✨ Please sign in to download ✨", "newspaperMessage");
      openModal("signIn");
      return;
    }

    // 🚫 No active subscription or expired
    if (!user.subscription?.active) {
      showMessage("⚠ Active subscription required", "newspaperMessage");
      return;
    }

    if (user.subscription.endDate && new Date(user.subscription.endDate) < new Date()) {
      showMessage("❌ Subscription expired", "newspaperMessage");
      return;
    }

    // ✅ Download
    await downloadNewspaper(button.dataset.id, button.dataset.name);
  });
}

// ===============================
// 🔹 LOAD NEWSPAPERS
// ===============================

async function loadNewspapers(language) {
  const grid = document.getElementById("newspaperGrid");
  if (!grid) return;

  const query =
    language && language !== "All"
      ? `?language=${encodeURIComponent(language)}`
      : "";

  const response = await apiFetch(`/api/newspapers${query}`);

  grid.innerHTML = "";

  if (!response.ok) {
    showMessage("Failed to load newspapers", "newspaperMessage");
    return;
  }

  const data = await response.json();

  if (!data.newspapers || data.newspapers.length === 0) {
    grid.innerHTML = `<p class="muted-text">No newspapers available.</p>`;
    return;
  }

  data.newspapers.forEach((paper) => {
    const card = document.createElement("div");
    card.className = "newspaper-card";

    card.innerHTML = `
      <img src="${paper.coverImage}" alt="${paper.name}">
      <div class="newspaper-info">
        <h3>${paper.name}</h3>
        <p>${paper.language}</p>
        <button 
          class="download-button btn btn-primary"
          data-id="${paper.downloadId}" 
          data-name="${paper.name}">
          Download
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ===============================
// 🔹 DOWNLOAD FUNCTION
// ===============================

async function downloadNewspaper(id, name) {
  try {
    const response = await apiFetch(`/api/downloads/${id}`);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showMessage(data.message || "Download failed", "newspaperMessage");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download error:", error);
    showMessage("Download failed", "newspaperMessage");
  }
}
