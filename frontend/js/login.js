const form = document.getElementById("loginForm");
const formMessage = document.getElementById("formMessage");

function showFormMessage(message, isError = true) {
  formMessage.textContent = message;
  formMessage.classList.remove("hidden", "bg-red-50", "text-red-700", "bg-green-50", "text-green-700");
  formMessage.classList.add(isError ? "bg-red-50" : "bg-green-50", isError ? "text-red-700" : "text-green-700");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.classList.add("hidden");

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (!data.email || !data.password) {
    showFormMessage("Email and password are required.");
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      showFormMessage(result.error || "Login failed. Please try again.");
      return;
    }

    window.location.href = "/home";
  } catch (err) {
    showFormMessage("Something went wrong. Please try again.");
  }
});
