async function loadProfile() {
  try {
    const response = await fetch("/api/profile");
    if (!response.ok) {
      window.location.href = "/login";
      return;
    }
    const { user } = await response.json();

    document.getElementById("profilePic").src = user.imageUrl || "/images/default-profile.svg";
    document.getElementById("fullName").textContent = user.fullName;
    document.getElementById("position").textContent = user.position;

    document.getElementById("infoFullName").textContent = user.fullName;
    document.getElementById("infoEmployeeId").textContent = user.employeeId;
    document.getElementById("infoEmail").textContent = user.email;
    document.getElementById("infoPhone").textContent = user.phone;

    document.getElementById("infoDepartment").textContent = user.department;
    document.getElementById("infoPosition").textContent = user.position;
  } catch (err) {
    window.location.href = "/login";
  }
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/login";
});

loadProfile();
