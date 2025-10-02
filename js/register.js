const API_BASE = "http://127.0.0.1:5000"
const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (onsubmit) => {
    onsubmit.preventDefault();

    const first_name = document.getElementById("first_name").value;
    const last_name = document.getElementById("last_name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_BASE}/user/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, email, password})
        });

        const data = await res.json();

        if (!res.ok){
            throw new Error(data.error || "Signup failed");
        }

        
        alert("Registration successful! You can now login.");
        registerForm.reset();
        window.location.href = "login.html";
        } catch (err) {
        alert(err.message);
    }


});
