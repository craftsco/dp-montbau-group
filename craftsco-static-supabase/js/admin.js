let client;
let currentUser;

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
    try {
        client = getSupabase();

        const {
            data: { session }
        } = await client.auth.getSession();

        if (session) {
            currentUser = session.user;
            showDashboard();
        } else {
            showLogin();
        }

        client.auth.onAuthStateChange((_event, session) => {
            currentUser = session?.user || null;

            if (currentUser) {
                showDashboard();
            } else {
                showLogin();
            }
        });
    } catch (error) {
        document.getElementById("login-message").textContent = error.message;
        return;
    }

    document.getElementById("login-form").addEventListener("submit", login);
    document.getElementById("logout").addEventListener("click", () => client.auth.signOut());
    document.getElementById("new-project").addEventListener("click", () => openForm());
    document.getElementById("cancel-edit").addEventListener("click", closeForm);
    document.getElementById("cancel-edit-2").addEventListener("click", closeForm);
    document.getElementById("project-form").addEventListener("submit", saveProject);
}

function showLogin() {
    document.getElementById("login-panel").hidden = false;
    document.getElementById("dashboard").hidden = true;
}

async function login(event) {
    event.preventDefault();

    const message = document.getElementById("login-message");
    message.textContent = "Přihlašuji…";

    const { error } = await client.auth.signInWithPassword({
        email: document.getElementById("login-email").value.trim(),
        password: document.getElementById("login-password").value
    });

    if (error) {
        message.textContent = "Přihlášení se nepodařilo: " + error.message;
    } else {
        message.textContent = "";
    }
}

function showDashboard() {
    document.getElementById("login-panel").hidden = true;
    document.getElementById("dashboard").hidden = false;
    document.getElementById("logged-user").textContent = currentUser.email;

    loadAdminProjects();
}

async function loadAdminProjects() {
    const container = document.getElementById("admin-projects");

    container.innerHTML = '<div class="loading">Načítám…</div>';

    const { data, error } = await client
        .from("projects")
        .select("*")
        .order("start_date", { ascending: false });

    if (error) {
        container.innerHTML = `
            <div class="error">
                ${escapeHtml(error.message)}
            </div>
        `;
        return;
    }

    if (!data.length) {
        container.innerHTML = `
            <div class="admin-card">
                <p>Zatím zde nejsou žádné projekty.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = data
        .map(
            (project) => `
                <article class="admin-project">

                    ${
                        project.image_url
                            ? `<img
                                class="admin-project-thumb"
                                src="${escapeHtml(project.image_url)}"
                                alt=""
                              >`
                            : `<div class="admin-project-thumb"></div>`
                    }

                    <div>
                        <h3>${escapeHtml(project.title)}</h3>

                        <div class="admin-project-meta">
                            ${escapeHtml(formatDate(project.start_date))}
                            · ${escapeHtml(project.work_type)}
                            · ${escapeHtml(String(project.workers || 0))} pracovníků
                            · ${escapeHtml(statusLabel(project.status))}
                        </div>
                    </div>

                    <div class="admin-project-actions">
                        <button data-edit="${project.id}">
                            Upravit
                        </button>

                        <button class="danger" data-delete="${project.id}">
                            Smazat
                        </button>
                    </div>

                </article>
            `
        )
        .join("");

    container.querySelectorAll("[data-edit]").forEach((button) => {
        button.onclick = () => editProject(button.dataset.edit);
    });

    container.querySelectorAll("[data-delete]").forEach((button) => {
        button.onclick = () => deleteProject(button.dataset.delete);
    });
}

async function editProject(id) {
    const { data: project, error } = await client
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        showAdminMessage(error.message, true);
        return;
    }

    document.getElementById("form-title").textContent = "Upravit projekt";
    document.getElementById("project-id").value = project.id;

    const fields = [
        "title",
        "work_type",
        "start_date",
        "end_date",
        "workers",
        "status",
        "excerpt",
        "description"
    ];

    fields.forEach((field) => {
        document.getElementById(field).value = project[field] ?? "";
    });

    document.getElementById("image").value = "";
    document.getElementById("remove-image").checked = false;

    const currentImage = document.getElementById("current-image");

    if (project.image_url) {
        document.getElementById("current-image-preview").src = project.image_url;
        currentImage.hidden = false;
    } else {
        currentImage.hidden = true;
    }

    openForm(true);
}

function openForm(editing = false) {
    const formWrap = document.getElementById("project-form-wrap");

    formWrap.hidden = false;

    if (!editing) {
        document.getElementById("project-form").reset();
        document.getElementById("project-id").value = "";
        document.getElementById("workers").value = 1;
        document.getElementById("status").value = "done";
        document.getElementById("current-image").hidden = true;
    }

    formWrap.scrollIntoView({
        behavior: "smooth"
    });
}

function closeForm() {
    document.getElementById("project-form-wrap").hidden = true;
}

async function saveProject(event) {
    event.preventDefault();

    const button = document.getElementById("save-project");
    const message = document.getElementById("form-message");

    button.disabled = true;
    message.textContent = "Ukládám…";

    try {
        const id = document.getElementById("project-id").value || null;

        const title = document.getElementById("title").value.trim();
        const work_type = document.getElementById("work_type").value.trim();
        const start_date = document.getElementById("start_date").value;
        const end_date = document.getElementById("end_date").value || null;
        const workers = Number(document.getElementById("workers").value || 0);
        const status = document.getElementById("status").value;
        const excerpt = document.getElementById("excerpt").value.trim();
        const description = document.getElementById("description").value.trim();

        const file = document.getElementById("image").files[0];
        const removeImage = document.getElementById("remove-image").checked;

        if (end_date && end_date < start_date) {
            throw new Error(
                "Datum konce nemůže být před datem začátku."
            );
        }

        let oldImageUrl = null;
        let imageUrl = null;

        /*
         * Při úpravě projektu si nejdříve zjistíme
         * aktuální obrázek.
         */
        if (id) {
            const { data, error } = await client
                .from("projects")
                .select("image_url")
                .eq("id", id)
                .single();

            if (error) {
                throw error;
            }

            oldImageUrl = data.image_url;
            imageUrl = data.image_url;
        }

        /*
         * Pokud uživatel zaškrtl "Odebrat aktuální fotografii",
         * odstraníme ji ze Storage.
         */
        if (removeImage && imageUrl) {
            await removeStorageFile(imageUrl);
            imageUrl = null;
        }

        /*
         * Pokud byla vybrána nová fotografie,
         * nahrajeme ji do Storage.
         */
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                throw new Error(
                    "Fotografie je větší než 2 MB."
                );
            }

            const extension = file.name
                .split(".")
                .pop()
                .toLowerCase();

            const path = `${crypto.randomUUID()}.${extension}`;

            const { error } = await client
                .storage
                .from("project-images")
                .upload(path, file, {
                    cacheControl: "31536000",
                    upsert: false
                });

            if (error) {
                throw error;
            }

            imageUrl = client
                .storage
                .from("project-images")
                .getPublicUrl(path)
                .data
                .publicUrl;
        }

        const payload = {
            title,
            work_type,
            start_date,
            end_date,
            workers,
            status,
            excerpt,
            description,
            image_url: imageUrl
        };

        let result;

        if (id) {
            result = await client
                .from("projects")
                .update(payload)
                .eq("id", id);
        } else {
            result = await client
                .from("projects")
                .insert(payload);
        }

        if (result.error) {
            throw result.error;
        }

        /*
         * Pokud jsme nahráli NOVÝ obrázek,
         * starý už nepotřebujeme.
         */
        if (
            id &&
            file &&
            oldImageUrl &&
            oldImageUrl !== imageUrl
        ) {
            await removeStorageFile(oldImageUrl);
        }

        message.textContent = "Projekt uložen.";

        closeForm();

        showAdminMessage(
            "Projekt byl úspěšně uložen."
        );

        await loadAdminProjects();

    } catch (error) {
        console.error(error);

        message.textContent =
            error.message || "Něco se pokazilo.";

    } finally {
        button.disabled = false;
    }
}

async function deleteProject(id) {
    if (
        !confirm(
            "Opravdu chcete tento projekt smazat?"
        )
    ) {
        return;
    }

    const { data: project, error: fetchError } =
        await client
            .from("projects")
            .select("image_url")
            .eq("id", id)
            .single();

    if (fetchError) {
        showAdminMessage(fetchError.message, true);
        return;
    }

    /*
     * Nejprve smažeme obrázek ze Storage.
     */
    if (project?.image_url) {
        await removeStorageFile(project.image_url);
    }

    /*
     * Potom smažeme projekt z databáze.
     */
    const { error } = await client
        .from("projects")
        .delete()
        .eq("id", id);

    if (error) {
        showAdminMessage(error.message, true);
        return;
    }

    showAdminMessage("Projekt byl smazán.");

    await loadAdminProjects();
}

async function removeStorageFile(url) {
    if (!url) {
        return;
    }

    const marker =
        "/storage/v1/object/public/project-images/";

    const index = url.indexOf(marker);

    if (index === -1) {
        return;
    }

    const path = decodeURIComponent(
        url.slice(index + marker.length)
    );

    const { error } = await client
        .storage
        .from("project-images")
        .remove([path]);

    if (error) {
        console.error(
            "Nepodařilo se odstranit obrázek:",
            error
        );
    }
}

function showAdminMessage(text, error = false) {
    const element =
        document.getElementById("admin-message");

    element.textContent = text;

    element.className =
        "form-message " +
        (error ? "error" : "success");

    setTimeout(() => {
        element.textContent = "";
        element.className = "form-message";
    }, 4000);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(value) {
    if (!value) {
        return "";
    }

    return new Date(value).toLocaleDateString("cs-CZ");
}

function statusLabel(status) {
    const labels = {
        done: "Dokončeno",
        progress: "Probíhá",
        planned: "Plánováno"
    };

    return labels[status] || status || "";
}