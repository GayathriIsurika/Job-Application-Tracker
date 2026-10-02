const jobList = document.getElementById("jobList");
const jobForm = document.getElementById("jobForm");
const themeToggle = document.getElementById("themeToggle");

const API_URL = "http://localhost:3000/api/jobs";
const THEME_STORAGE_KEY = "job-tracker-theme";

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    themeToggle.innerHTML = isDark ? "☀️ <span>Light mode</span>" : "🌙 <span>Dark mode</span>";
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.title = isDark ? "Switch to light mode" : "Switch to dark mode";
}

function loadTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        applyTheme(savedTheme === "dark" ? "dark" : "light");
    } catch (error) {
        console.error("Unable to load saved theme:", error);
        applyTheme("light");
    }
}

themeToggle.addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.error("Unable to save theme preference:", error);
    }
});

function showError(message) {
    let error = jobList.querySelector(".job-error");
    if (!error) {
        error = document.createElement("p");
        error.className = "job-error";
        jobList.prepend(error);
    }
    error.textContent = message;
}

function clearError() {
    jobList.querySelector(".job-error")?.remove();
}

async function fetchJobs() {
    jobList.innerHTML = "";
    try {
        const res = await fetch(API_URL);
        if (!res.ok) {
            throw new Error(`Server returned ${res.status}`);
        }
        const jobs = await res.json();
        if (!Array.isArray(jobs)) {
            throw new Error("The server returned an invalid jobs list");
        }
        jobs.forEach(renderJob);
    } catch (error) {
        console.error("Unable to load jobs:", error);
        showError("Could not load jobs. Check that the backend and its tunnel are running, then refresh.");
    }
}

function renderJob(job) {
    const item = document.createElement("div");
    item.className = "job-item";

    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `
        <p><strong>${job.company}</strong> — ${job.role}</p>
        <p class="date">Applied: ${job.date || "N/A"}</p>
    `;

    const controls = document.createElement("div");
    controls.className = "controls";

    // Status input
    const statusInput = document.createElement("input");
    statusInput.type = "text";
    statusInput.value = job.status || "";
    statusInput.className = "status-input";
    statusInput.addEventListener("blur", async () => {
        try {
            const res = await fetch(`${API_URL}/${job.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: statusInput.value }),
            });
            if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
            }
            clearError();
        } catch (error) {
            console.error("Unable to update job:", error);
            showError("Could not update this job. Check the backend connection and try again.");
        }
    });

    // Favorite toggle
    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "fav-btn";
    favBtn.addEventListener("click", async () => {
        favBtn.disabled = true;
        try {
            const res = await fetch(`${API_URL}/${job.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ favorite: !job.favorite }),
            });
            if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
            }
            const updated = await res.json();
            job.favorite = Boolean(updated.favorite);
            updateFavoriteButton(favBtn, job.favorite);
            clearError();
        } catch (error) {
            console.error("Unable to update favorite:", error);
            showError("Could not update this favorite. Check the backend connection and try again.");
        } finally {
            favBtn.disabled = false;
        }
    });
    updateFavoriteButton(favBtn, job.favorite);

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.className = "del-btn";
    delBtn.title = "Delete job";
    delBtn.addEventListener("click", async () => {
        try {
            const res = await fetch(`${API_URL}/${job.id}`, { method: "DELETE" });
            if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
            }
            item.remove();
            clearError();
        } catch (error) {
            console.error("Unable to delete job:", error);
            showError("Could not delete this job. Check the backend connection and try again.");
        }
    });

    controls.appendChild(statusInput);
    controls.appendChild(favBtn);
    controls.appendChild(delBtn);

    item.appendChild(info);
    item.appendChild(controls);

    jobList.appendChild(item);
}

function updateFavoriteButton(button, isFavorite) {
    button.textContent = isFavorite ? "★" : "☆";
    button.classList.toggle("is-favorite", isFavorite);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute("aria-label", isFavorite ? "Remove from favorites" : "Add to favorites");
    button.title = isFavorite ? "Remove from favorites" : "Add to favorites";
}

jobForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const company = document.getElementById("companyInput").value;
    const role = document.getElementById("roleInput").value;
    const date = document.getElementById("dateInput").value;

    try {
        const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, date }),
        });
        if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
        }

        const newJob = await res.json();
        renderJob(newJob);
        jobForm.reset();
        clearError();
    } catch (error) {
        console.error("Unable to add job:", error);
        showError("Could not add this job. Check that the backend and its tunnel are running, then try again.");
    }
});

loadTheme();
fetchJobs();