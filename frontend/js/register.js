const form = document.getElementById("registerForm");
const formMessage = document.getElementById("formMessage");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function clearErrors() {
  form.querySelectorAll(".error-text").forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });
  form.querySelectorAll("input").forEach((el) => el.classList.remove("border-red-500"));
}

function showFieldError(name, message) {
  const input = form.querySelector(`[name="${name}"]`);
  if (!input) return;
  input.classList.add("border-red-500");
  const errorEl = input.closest("div").querySelector(".error-text");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }
}

function showFormMessage(message, isError = true) {
  formMessage.textContent = message;
  formMessage.classList.remove("hidden", "bg-red-50", "text-red-700", "bg-green-50", "text-green-700");
  formMessage.classList.add(isError ? "bg-red-50" : "bg-green-50", isError ? "text-red-700" : "text-green-700");
}

function validate(data, profilePictureFile) {
  let valid = true;

  const requiredFields = ["fullName", "email", "phone", "employeeId", "department", "position", "password", "confirmPassword"];
  requiredFields.forEach((field) => {
    if (!data[field] || !data[field].trim()) {
      showFieldError(field, "This field is required");
      valid = false;
    }
  });

  if (data.email && !EMAIL_REGEX.test(data.email)) {
    showFieldError("email", "Enter a valid email address");
    valid = false;
  }

  if (data.password && data.password.length < 6) {
    showFieldError("password", "Password must be at least 6 characters");
    valid = false;
  }

  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    showFieldError("confirmPassword", "Passwords do not match");
    valid = false;
  }

  if (profilePictureFile && !ALLOWED_IMAGE_TYPES.includes(profilePictureFile.type)) {
    showFieldError("profilePicture", "Please select a valid image file (jpg, png, webp)");
    valid = false;
  }

  return valid;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  formMessage.classList.add("hidden");

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const profilePictureFile = formData.get("profilePicture");

  if (!validate(data, profilePictureFile && profilePictureFile.size > 0 ? profilePictureFile : null)) {
    return;
  }

  // Drop the empty file input entirely when no picture was chosen, so the
  // server sees no file rather than a zero-byte one.
  if (!profilePictureFile || profilePictureFile.size === 0) {
    formData.delete("profilePicture");
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      showFormMessage(result.error || "Registration failed. Please try again.");
      return;
    }

    showFormMessage("Account created successfully! Redirecting to login...", false);
    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  } catch (err) {
    showFormMessage("Something went wrong. Please try again.");
  }
});
