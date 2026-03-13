import { requireAuth, loadCurrentUser } from "../core/auth.js";
import { apiFetch } from "../core/api.js";
import { showMessage } from "../core/ui.js";
import { initHeader, updateHeaderUI } from "../layout/header.js";

document.addEventListener("DOMContentLoaded", async () => {

  // 1️⃣ Protect page
  if (!requireAuth("index.html")) return;

  // 2️⃣ Load user
  const user = await loadCurrentUser();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // 3️⃣ Initialize shared header
  initHeader();
  updateHeaderUI();

  // 4️⃣ Render subscription info
  renderSubscriptionInfo(user);

  // 5️⃣ Plan card selection UI
  document.querySelectorAll(".plan-card").forEach(card => {
    card.addEventListener("click", () => {
      document
        .querySelectorAll(".plan-card")
        .forEach(c => c.classList.remove("active"));
      card.classList.add("active");
    });
  });

  // 6️⃣ Demo activation buttons
  document
    .getElementById("weeklyDemo")
    .addEventListener("click", () => activateDemo("Weekly"));

  document
    .getElementById("monthlyDemo")
    .addEventListener("click", () => activateDemo("Monthly"));

  // 7️⃣ Stripe return messages
  const params = new URLSearchParams(window.location.search);
  if (params.get("success"))
    showMessage("Payment successful. Subscription activated.", "subscriptionMessage");

  if (params.get("cancel"))
    showMessage("Payment canceled.", "subscriptionMessage");
});


async function activateDemo(plan) {
  const response = await apiFetch("/api/subscriptions/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan })
  });

  if (!response.ok) {
    showMessage("Activation failed", "subscriptionMessage");
    return;
  }

  showMessage("Subscription activated successfully!", "subscriptionMessage");

  const updatedUser = await loadCurrentUser();
  renderSubscriptionInfo(updatedUser);
}


async function cancelSubscription() {
  if (!confirm("Are you sure you want to cancel your current subscription?")) return;

  const response = await apiFetch("/api/subscriptions/cancel", {
    method: "POST"
  });

  if (!response.ok) {
    showMessage("Cancellation failed", "subscriptionMessage");
    return;
  }

  showMessage("Subscription canceled successfully", "subscriptionMessage");
  const updatedUser = await loadCurrentUser();
  renderSubscriptionInfo(updatedUser);
}

function renderSubscriptionInfo(user) {
  const info = document.getElementById("subscriptionInfo");
  const weeklyBtn = document.getElementById("weeklyDemo");
  const monthlyBtn = document.getElementById("monthlyDemo");

  // Clear previous cancel button if any
  const oldCancel = document.getElementById("cancelSubscriptionBtn");
  if (oldCancel) oldCancel.remove();

  const isActive = user.subscription?.active;
  const endDate = user.subscription?.endDate ? new Date(user.subscription.endDate) : null;
  const isExpired = endDate && endDate < new Date();

  if (isActive && !isExpired) {
    const dateStr = endDate ? endDate.toDateString() : "";
    info.textContent = `Active plan: ${user.subscription.plan} (until ${dateStr})`;

    // Disable purchase buttons
    weeklyBtn.disabled = true;
    monthlyBtn.disabled = true;
    weeklyBtn.title = "Cancel current plan to switch";
    monthlyBtn.title = "Cancel current plan to switch";
    weeklyBtn.style.opacity = "0.6";
    monthlyBtn.style.opacity = "0.6";
    weeklyBtn.style.cursor = "not-allowed";
    monthlyBtn.style.cursor = "not-allowed";

    // Add cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.id = "cancelSubscriptionBtn";
    cancelBtn.className = "btn btn-danger";
    cancelBtn.style.marginTop = "15px";
    cancelBtn.textContent = "Cancel Current Subscription";
    cancelBtn.onclick = cancelSubscription;
    info.parentElement.appendChild(cancelBtn);

  } else {
    info.textContent = isExpired ? "Active plan: Expired" : "Active plan: None";
    weeklyBtn.disabled = false;
    monthlyBtn.disabled = false;
    weeklyBtn.title = "";
    monthlyBtn.title = "";
    weeklyBtn.style.opacity = "1";
    monthlyBtn.style.opacity = "1";
    weeklyBtn.style.cursor = "pointer";
    monthlyBtn.style.cursor = "pointer";
  }

  info.style.display = "block";
}
