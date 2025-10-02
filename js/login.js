const API_BASE = "http://127.0.0.1:5000";
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (onsubmit) => {
    onsubmit.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await fetch(`${API_BASE}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("userName", data.name);
            alert("Login successful!");
            loginForm.reset();

            window.location.href = "dashboard.html";
        }   else {
            alert(data.error || "Login failed");
        }
    } catch (err) {
    alert("Error: Could not connect to server.");
    }

});
