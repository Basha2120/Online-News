export function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (!messageDiv) return;

  messageDiv.style.display = "block";
  messageDiv.textContent = message;
  messageDiv.style.opacity = 1;

  setTimeout(() => {
    messageDiv.style.opacity = 0;
    setTimeout(() => {
      messageDiv.style.display = "none";
    }, 500);
  }, 3000);
}

export function openModal(id) {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
  const el = document.getElementById(id);
  if (el) el.style.display = "flex";
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

export function initModals() {

  const signUpBtn = document.getElementById("signUpButton");
  const signInBtn = document.getElementById("signInButton");

  const closeSignIn = document.getElementById("closeSignIn");
  const closeSignUp = document.getElementById("closeSignUp");

  // Switch from SignIn → SignUp
  if (signUpBtn) {
    signUpBtn.addEventListener("click", () => {
      closeModal("signIn");
      openModal("signup");
    });
  }

  // Switch from SignUp → SignIn
  if (signInBtn) {
    signInBtn.addEventListener("click", () => {
      closeModal("signup");
      openModal("signIn");
    });
  }

  // Close buttons
  if (closeSignIn) {
    closeSignIn.addEventListener("click", () => closeModal("signIn"));
  }

  if (closeSignUp) {
    closeSignUp.addEventListener("click", () => closeModal("signup"));
  }
}