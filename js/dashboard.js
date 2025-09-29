    document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://127.0.0.1:5000";

    const token = localStorage.getItem("token");
    if (!token) {
        alert("No token found. Please log in.");
        window.location.href = "login.html";
        return;
    }

    const toggleBtns = document.querySelectorAll(".toggle-btn");
    const sections = document.querySelectorAll("form, #expensesList, #totalExpenses, #expenseSearch, #actionBox");
    const searchBox = document.getElementById("expenseSearch");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const expensesList = document.getElementById("expensesList");
    const totalExpenses = document.getElementById("totalExpenses");

    const addExpenseForm = document.getElementById("addExpenseForm");
    const updateExpenseForm = document.getElementById("updateExpenseForm");
    const deleteExpenseForm = document.getElementById("deleteExpenseForm");
    const settingsForm = document.getElementById("settingsForm");
    const fundBalanceForm = document.getElementById("fundBalanceForm");

    const actionBox = document.getElementById("actionBox");
    const actionMessage = document.getElementById("actionMessage");
    const updateBtn = document.getElementById("updateBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    const notifyBox = document.getElementById("notifyBox");

    function notify(msg, type = "success") {
        const el = document.createElement("div");
        el.className = `notify ${type}`;
        el.textContent = msg;
        notifyBox.appendChild(el);
        setTimeout(() => { el.remove(); }, 3000);
    }

    function escapeHtml(str) {
        return String(str === null || str === undefined ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    toggleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        sections.forEach(s => s.classList.add("hidden"));

        const target = document.getElementById(targetId);
        if (target) target.classList.remove("hidden");

        if (targetId === "expensesList") {
            searchBox.classList.remove("hidden");
            fetchExpenses();
        } else {
            searchBox.classList.add("hidden");
        }

        // total
        if (targetId === "totalExpenses") fetchTotalExpenses();
        });
    });

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async () => {
        try {
        await fetch(`${API_BASE}/user/logout`, { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
        } catch (err) {
        console.error("Logout error:", err);
        }
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    // Add expense 
    addExpenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(addExpenseForm).entries());
        try {
        const res = await fetch(`${API_BASE}/expense/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (res.ok) {
            notify(`Expense added (ID: ${json.expense_id})`);
            addExpenseForm.reset();
            fetchExpenses();
        } else {
            notify(json.error || "Failed to add expense", "error");
        }
        } catch (err) {
        console.error(err);
        notify("Server error adding expense", "error");
        }
    });

    // Fund balance
    fundBalanceForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(fundBalanceForm).entries());
        try {
        const res = await fetch(`${API_BASE}/user/balance`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (res.ok) {
            notify("Balance funded");
            fundBalanceForm.reset();
        } else {
            notify(json.error || "Failed to fund balance", "error");
        }
        } catch (err) {
        console.error(err);
        notify("Server error funding balance", "error");
        }
    });

    // Settings (update user)
    settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(settingsForm).entries());
        try {
        const res = await fetch(`${API_BASE}/user/update`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (res.ok) {
            notify("Profile updated");
            settingsForm.reset();
        } else {
            notify(json.error || "Failed to update profile", "error");
        }
        } catch (err) {
        console.error(err);
        notify("Server error updating profile", "error");
        }
    });

    // Update expense 
    updateExpenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(updateExpenseForm).entries());
        const expenseId = data.expense_id;
        delete data.expense_id;
        try {
        const res = await fetch(`${API_BASE}/expense/update/${encodeURIComponent(expenseId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (res.ok) {
            notify("Expense updated");
            updateExpenseForm.reset();
            updateExpenseForm.classList.add("hidden");
            fetchExpenses();
        } else {
            notify(json.error || "Failed to update expense", "error");
        }
        } catch (err) {
        console.error(err);
        notify("Server error updating expense", "error");
        }
    });

    // Delete expense 
    deleteExpenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(deleteExpenseForm).entries());
        const expenseId = data.expense_id;
        try {
        const res = await fetch(`${API_BASE}/expense/delete/${encodeURIComponent(expenseId)}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok) {
            notify("Expense deleted");
            deleteExpenseForm.reset();
            deleteExpenseForm.classList.add("hidden");
            fetchExpenses();
        } else {
            notify(json.message || "Failed to delete expense", "error");
        }
        } catch (err) {
        console.error(err);
        notify("Server error deleting expense", "error");
        }
    });

    // open  box for a selected expense
    function openActionBox(expenseId, expense) {
        // hide other sections
        document.querySelectorAll("form, #expensesList, #totalExpenses").forEach(el => el.classList.add("hidden"));
        // hidden fields in forms (so user can press update/delete after)
        const updHidden = updateExpenseForm.querySelector("input[name='expense_id']");
        const delHidden = deleteExpenseForm.querySelector("input[name='expense_id']");
        if (updHidden) updHidden.value = expenseId;
        if (delHidden) delHidden.value = expenseId;

        // message & action box
        if (actionMessage) actionMessage.textContent = `Expense: ${expense.title} — ₦${expense.amount}`;
        actionBox.classList.remove("hidden");

        // update button 
        updateBtn.onclick = () => {
        actionBox.classList.add("hidden");
        updateExpenseForm.classList.remove("hidden");
        };

        // delete button  
        deleteBtn.onclick = () => {
        actionBox.classList.add("hidden");
        deleteExpenseForm.classList.remove("hidden");
        };

    async function fetchExpenses() {
        try {
        const res = await fetch(`${API_BASE}/expense/all`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            // try to extract message
            let err = {};
            try { err = await res.json(); } catch {}
            expensesList.innerHTML = "<h2>Expenses</h2><p>No expenses found.</p>";
            expensesList.classList.remove("hidden");
            return;
        }
        const expenses = await res.json();
        expensesList.innerHTML = "<h2>Expenses</h2>";

        if (!Array.isArray(expenses) || expenses.length === 0) {
            expensesList.innerHTML += "<p>No expenses found.</p>";
            expensesList.classList.remove("hidden");
            return;
        }

        expenses.forEach(exp => {
            const id = exp.id || exp.expense_id || exp._id || "";
            const item = document.createElement("div");
            item.className = "expense-item";
            item.innerHTML = `
            <strong>${escapeHtml(exp.title || "Untitled")}</strong> - ₦${escapeHtml(String(exp.amount || 0))}<br>
            ${escapeHtml(exp.description || "No description")}<br>
            <small>${escapeHtml(String(exp.date_added || ""))}</small>
            `;
            item.style.cursor = "pointer";
            item.addEventListener("click", () => openActionBox(id, exp));
            expensesList.appendChild(item);
        });

        expensesList.classList.remove("hidden");
        } catch (err) {
        console.error("fetchExpenses error:", err);
        expensesList.innerHTML = "<h2>Expenses</h2><p>Error fetching expenses.</p>";
        expensesList.classList.remove("hidden");
        }
    }

    async function fetchTotalExpenses() {
        try {
        const res = await fetch(`${API_BASE}/expense/total`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            totalExpenses.textContent = "Total Expenses: 0";
            totalExpenses.classList.remove("hidden");
            return;
        }
        const data = await res.json();
        const totalVal = (typeof data === "number") ? data : (data.total ?? 0);
        totalExpenses.textContent = `Total Expenses: ₦${totalVal}`;
        totalExpenses.classList.remove("hidden");
        } catch (err) {
        console.error("fetchTotalExpenses error:", err);
        totalExpenses.textContent = "Total Expenses: 0";
        totalExpenses.classList.remove("hidden");
        }
    }

    // search
    searchBtn.addEventListener("click", async () => {
        const term = (searchInput.value || "").trim().toLowerCase();
        if (!term) {
        fetchExpenses();
        return;
        }
        try {
        const res = await fetch(`${API_BASE}/expense/all`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            notify("Failed to fetch expenses for search", "error");
            return;
        }
        const expenses = await res.json();
        const filtered = (Array.isArray(expenses) ? expenses : []).filter(exp =>
            (exp.title && exp.title.toLowerCase().includes(term)) ||
            (exp.description && exp.description.toLowerCase().includes(term))
        );

        expensesList.innerHTML = "<h2>Expenses</h2>";
        if (filtered.length === 0) {
            expensesList.innerHTML += "<p>No matching expenses found.</p>";
        } else {
            filtered.forEach(exp => {
            const id = exp.id || exp.expense_id || exp._id || "";
            const item = document.createElement("div");
            item.className = "expense-item";
            item.innerHTML = `
                <strong>${escapeHtml(exp.title || "Untitled")}</strong> - ₦${escapeHtml(String(exp.amount || 0))}<br>
                ${escapeHtml(exp.description || "No description")}<br>
                <small>${escapeHtml(String(exp.date_added || ""))}</small>
            `;
            item.style.cursor = "pointer";
            item.addEventListener("click", () => openActionBox(id, exp));
            expensesList.appendChild(item);
            });
        }
        expensesList.classList.remove("hidden");
        } catch (err) {
        console.error("Search error:", err);
        notify("Search failed", "error");
        }
    });

    searchBox.classList.add("hidden");

    });
