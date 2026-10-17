
const message = document.getElementById("message");
const authPanel = document.getElementById("auth-panel");
const authForm = document.getElementById("auth-form");
const authMessage = document.getElementById("auth-message");
const authTitle = document.getElementById("auth-title");
const authDescription = document.getElementById("auth-description");
const authSubmit = document.getElementById("auth-submit");
const authSwitch = document.getElementById("auth-switch");
const authSwitchText = document.getElementById("auth-switch-text");
const authBack = document.getElementById("auth-back");
const nameField = document.getElementById("name-field");
const passwordField = document.getElementById("auth-password");

let selectedRole = "owner";
let authMode = "register";

// Change this to your running backend's public Codespaces URL.
// Example: https://YOUR-CODESPACE-3000.app.github.dev
const API_BASE_URL = "https://jubilant-robot-p7r9wwvpp4j92xr-3000.app.github.dev";

function showWelcome() {
  document.getElementById("welcome").scrollIntoView({
    behavior: "smooth"
  });
  message.textContent = "Choose your path to get started.";
}

function selectRole(role) {
  if (!["owner", "customer"].includes(role)) return;

  selectedRole = role;
  authMode = "register";
  updateAuthForm();

  authPanel.hidden = false;
  authPanel.scrollIntoView({ behavior: "smooth" });
  authMessage.textContent = "";
}

function showSignIn() {
  authMode = "login";
  updateAuthForm();

  authPanel.hidden = false;
  authPanel.scrollIntoView({ behavior: "smooth" });
  authMessage.textContent = "";
}

function updateAuthForm() {
  const isRegister = authMode === "register";

  authTitle.textContent = isRegister
    ? "Create Your Account"
    : "Welcome Back";

  authDescription.textContent = isRegister
    ? `Create your ${selectedRole === "owner" ? "Business Owner" : "Customer"} account.`
    : "Sign in to your KME BizPilot account.";

  authSubmit.textContent = isRegister
    ? "Create Account ↗"
    : "Sign In ↗";

  authSwitchText.textContent = isRegister
    ? "Already registered?"
    : "New to KME BizPilot?";

  authSwitch.textContent = isRegister
    ? "Sign In"
    : "Create Account";

  nameField.hidden = !isRegister;
  document.getElementById("auth-name").required = isRegister;

  passwordField.autocomplete = isRegister
    ? "new-password"
    : "current-password";

  authMessage.textContent = "";
}

authSwitch.addEventListener("click", () => {
  authMode = authMode === "register" ? "login" : "register";
  updateAuthForm();
});

authBack.addEventListener("click", () => {
  authPanel.hidden = true;
  document.getElementById("welcome").scrollIntoView({
    behavior: "smooth"
  });
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  authSubmit.disabled = true;
  authMessage.textContent = "Please wait...";

  const email = document.getElementById("auth-email").value.trim();
  const password = passwordField.value;

  const payload = authMode === "register"
    ? {
        name: document.getElementById("auth-name").value.trim(),
        email,
        password,
        role: selectedRole
      }
    : { email, password };

  const endpoint = authMode === "register"
    ? "/api/auth/register"
    : "/api/auth/login";

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong.");
    }

    if (authMode === "register") {
      authMessage.textContent =
        "Account created successfully! You can now sign in.";
      authForm.reset();
      authMode = "login";
      updateAuthForm();
      authMessage.textContent =
        "Account created successfully! Please sign in.";
    } else {
      // Keep the token in memory only for this demo.
      // Do not put authentication tokens in localStorage.
      window.kmeBizPilotSession = {
        token: result.token,
        user: result.user
      };

      authMessage.textContent =
        `Welcome, ${result.user.name}! You are signed in as ${result.user.role}.`;
      authForm.reset();
    }
  } catch (error) {
    authMessage.textContent =
      error instanceof TypeError
        ? "Cannot connect to the backend. Check its URL and whether it is running."
        : error.message;
  } finally {
    authSubmit.disabled = false;
  }
});

updateAuthForm();

