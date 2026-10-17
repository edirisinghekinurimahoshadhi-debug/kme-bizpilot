
const message = document.getElementById("message");

function showWelcome() {
  document.getElementById("welcome").scrollIntoView({
    behavior: "smooth"
  });

  message.textContent = "Welcome to KME BizPilot. Choose your path below.";
}

function selectRole(role) {
  if (role === "owner") {
    message.textContent =
      "Business Owner selected! Account creation is our next step.";
  } else {
    message.textContent =
      "Customer selected! Shop discovery is coming in our next step.";
  }
}

function showSignIn() {
  message.textContent =
    "Sign In will be connected after we build secure authentication.";
}
