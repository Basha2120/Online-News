import { requireAuth, loadCurrentUser } from "../core/auth.js";
import { apiFetch } from "../core/api.js";
import { showMessage } from "../core/ui.js";
import { initHeader, updateHeaderUI } from "../layout/header.js";

document.addEventListener("DOMContentLoaded", async () => {

  // 1️⃣ Initialize shared header
  initHeader();

  // 2️⃣ Require authentication
  if (!requireAuth("index.html")) return;

  const user = await loadCurrentUser();

  if (!user || user.role !== "admin") {
    window.location.href = "index.html";
    return;
  }
  updateHeaderUI();

  // 3️⃣ Show dashboard
  document.getElementById("adminDashboard").style.display = "block";

  await loadMetrics();
  await loadUsers();
});


async function loadMetrics() {
  const response = await apiFetch("/api/admin/metrics");

  if (!response.ok) return;

  const data = await response.json();
  document.getElementById("revenueTotal").textContent =
    `₹${data.totalRevenue}`;
}


async function loadUsers() {
  const response = await apiFetch("/api/admin/users");

  if (!response.ok) return;

  const data = await response.json();
  const rows = document.getElementById("adminUserRows");

  rows.innerHTML = "";

  data.users.forEach(user => {
    const tr = document.createElement("tr");

    const plan = user.subscription?.plan || "-";
    const isExpired = user.subscription?.endDate && new Date(user.subscription.endDate) < new Date();
    const statusText = isExpired ? "Expired" : (user.subscription?.active ? "Active" : "Inactive");

    tr.innerHTML = `
      <td>${user.name || "-"}</td>
      <td>${user.email}</td>
      <td>${plan}</td>
      <td>${statusText}</td>
      <td>
        <button class="admin-toggle btn btn-primary"
          data-id="${user.id}"
          data-active="${user.subscription?.active ? "1" : "0"}">
          ${user.subscription?.active ? "Deactivate" : "Activate"}
        </button>
      </td>
    `;
    rows.appendChild(tr);
  });

  attachToggleEvents();
}


function attachToggleEvents() {
  document.querySelectorAll(".admin-toggle").forEach(button => {
    button.addEventListener("click", async () => {

      const userId = button.dataset.id;
      const active = button.dataset.active !== "1";

      const response = await apiFetch(
        `/api/admin/users/${userId}/subscription`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active })
        }
      );

      if (!response.ok) {
        showMessage("Failed to update subscription", "adminMessage");
        return;
      }

      await loadUsers();
    });
  });
}
