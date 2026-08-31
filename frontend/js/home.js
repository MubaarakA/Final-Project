async function loadUser() {
  try {
    const response = await fetch("/api/user");
    if (!response.ok) {
      window.location.href = "/login";
      return;
    }
    const { user } = await response.json();

    document.getElementById("welcomeMsg").textContent = `Welcome back, ${user.fullName.split(" ")[0]} 👋`;
    document.getElementById("profilePic").src = user.imageUrl || "/images/default-profile.svg";
    document.getElementById("fullName").textContent = user.fullName;
    document.getElementById("position").textContent = user.position;
    document.getElementById("department").textContent = `${user.department} Department`;
    document.getElementById("employeeId").textContent = user.employeeId;
    document.getElementById("email").textContent = user.email;
  } catch (err) {
    window.location.href = "/login";
  }
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/login";
});

loadUser();
