const jobList = document.getElementById("jobList");
const jobForm = document.getElementById("jobForm");

const API_URL = "https://d07p0w7l-3000.inc1.devtunnels.ms/api/jobs";

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
    controls.appendChild(delBtn);

    item.appendChild(info);
    item.appendChild(controls);

    jobList.appendChild(item);
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

fetchJobs();