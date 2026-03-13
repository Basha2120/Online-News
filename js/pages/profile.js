import { requireAuth, loadCurrentUser } from "../core/auth.js";
import { initHeader, updateHeaderUI } from "../layout/header.js";

document.addEventListener("DOMContentLoaded", async () => {

  // 1️⃣ Protect page
  if (!requireAuth("index.html")) return;

  // 2️⃣ Load user first
  const user = await loadCurrentUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // 3️⃣ Initialize header AFTER user is loaded
  initHeader();
  updateHeaderUI();

  // 4️⃣ Fill profile data
  document.getElementById("profileName").textContent =
    `${user.firstName} ${user.lastName}`;

  document.getElementById("profileEmail").textContent = user.email;

  if (user.subscription?.active) {
    const endDate = user.subscription.endDate ? new Date(user.subscription.endDate) : null;
    const isExpired = endDate && endDate < new Date();

    if (isExpired) {
      document.getElementById("profileSubscription").textContent = "Plan Status: Expired";
    } else {
      const dateStr = endDate ? endDate.toDateString() : "";
      document.getElementById("profileSubscription").textContent =
        `Plan: ${user.subscription.plan} ${dateStr ? `(until ${dateStr})` : ""}`;
    }
  } else {
    document.getElementById("profileSubscription").textContent = "Active plan: None";
  }
});
