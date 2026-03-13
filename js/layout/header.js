import {
  login,
  logout,
  loadCurrentUser,
  getCurrentUser,
} from "../core/auth.js";
import { apiFetch, setToken } from "../core/api.js";
import { showMessage, openModal } from "../core/ui.js";

export function initHeader() {
  initHamburger();
  initModals();
  initAuthForms();
  updateHeaderUI();
  highlightActivePage();
}

/* ============================= */
/* 🔹 HAMBURGER MENU */
/* ============================= */

function initHamburger() {
  const menuToggle = document.getElementById("menuToggle");

  if (menuToggle) {
    const drawer = document.getElementById("sideDrawer");
    const overlay = document.getElementById("navOverlay");

    menuToggle.addEventListener("click", () => {
      drawer.classList.toggle("active");
      overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
      drawer.classList.remove("active");
      overlay.classList.remove("active");
    });
  }
}

/* ============================= */
/* 🔹 MODALS */
/* ============================= */

function initModals() {
  const openSignIn = document.getElementById("openSignIn");
  const openSignUp = document.getElementById("openSignUp");
  const closeSignIn = document.getElementById("closeSignIn");
  const closeSignUp = document.getElementById("closeSignUp");
  const signInModal = document.getElementById("signIn");
  const signUpModal = document.getElementById("signup");

  if (openSignIn) {
    openSignIn.addEventListener("click", () => {
      openModal("signIn");
    });
  }

  if (openSignUp) {
    openSignUp.addEventListener("click", () => {
      openModal("signup");
    });
  }

  if (closeSignIn) {
    closeSignIn.addEventListener("click", () => {
      if (signInModal) signInModal.style.display = "none";
    });
  }

  if (closeSignUp) {
    closeSignUp.addEventListener("click", () => {
      if (signUpModal) signUpModal.style.display = "none";
    });
  }
}


/* ============================= */
/* 🔹 AUTH FORMS */
/* ============================= */

function initAuthForms() {
  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");
  const signOutBtn = document.getElementById("signOut");
  const signOutDrawer = document.getElementById("signOutDrawer");

  /* LOGIN */
  if (signInForm) {
    signInForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      const user = await login(email, password);

      if (user?.role === "admin") {
        window.location.replace("admin.html");
      } else {
        window.location.reload();
      }

      if (!user) {
        showMessage("Invalid credentials", "signInMessage");
        return;
      }

      document.getElementById("signIn").style.display = "none";

      await loadCurrentUser();
      updateHeaderUI();
    });
  }

  /* REGISTER */
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const firstName = document.getElementById("fName").value.trim();
      const lastName = document.getElementById("lName").value.trim();
      const email = document.getElementById("rEmail").value.trim();
      const password = document.getElementById("rPassword").value;

      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      if (!response.ok) {
        showMessage("Registration failed", "signUpMessage");
        return;
      }

      const data = await response.json();
      setToken(data.token);

      document.getElementById("signup").style.display = "none";

      await loadCurrentUser();
      updateHeaderUI();
    });
  }

  /* LOGOUT */
  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => {
      logout();
      window.location.reload();
    });
  }

  if (signOutDrawer) {
    signOutDrawer.addEventListener("click", () => {
      logout();
      window.location.reload();
    });
  }
}

/* ============================= */
/* 🔹 UPDATE HEADER UI */
/* ============================= */

export function updateHeaderUI() {
  const user = getCurrentUser();
  const path = window.location.pathname;
  let currentPage = "home";

  if (path.includes("profile.html")) currentPage = "profile";
  else if (path.includes("subscription.html")) currentPage = "subscription";
  else if (path.includes("admin.html")) currentPage = "admin";

  const signOutBtn = document.getElementById("signOut");
  const signOutDrawer = document.getElementById("signOutDrawer");
  const openSignIn = document.getElementById("openSignIn");
  const openSignUp = document.getElementById("openSignUp");

  // Logic for Auth buttons
  if (!user) {
    if (signOutBtn) signOutBtn.style.display = "none";
    if (signOutDrawer) signOutDrawer.style.display = "none";
    if (openSignIn) openSignIn.style.display = "inline-block";
    if (openSignUp) openSignUp.style.display = "inline-block";
  } else {
    if (signOutBtn) signOutBtn.style.display = "inline-block";
    if (signOutDrawer) signOutDrawer.style.display = "inline-block";
    if (openSignIn) openSignIn.style.display = "none";
    if (openSignUp) openSignUp.style.display = "none";
  }

  // Logic for Nav Links (Laptop and Drawer)
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    const page = link.dataset.page;

    // Highlights
    if (page === currentPage) link.classList.add("active");
    else link.classList.remove("active");

    // Visibility based on Role
    if (!user) {
      if (page === "admin") link.style.display = "none";
      else link.style.display = "inline-block";
    } else if (user.role === "admin") {
      if (page === "admin") link.style.display = "inline-block";
      else link.style.display = "none";
    } else {
      if (page === "admin") link.style.display = "none";
      else link.style.display = "inline-block";
    }
  });

  // Drawer User Section
  const drawerUserSection = document.getElementById("drawerUserSection");
  if (drawerUserSection) {
    if (user) {
      drawerUserSection.style.display = "flex";
      const nameEl = document.getElementById("drawerUserName");
      const roleEl = document.getElementById("drawerUserRole");
      if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
      if (roleEl) roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    } else {
      drawerUserSection.style.display = "none";
    }
  }
}

function highlightActivePage() {
  // Logic merged into updateHeaderUI above
}
