let client;
let currentUser;

document.addEventListener("DOMContentLoaded", initAdmin);


// =====================================================
// INIT
// =====================================================

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

        console.error(error);

        const message = document.getElementById("login-message");

        if (message) {
            message.textContent = error.message;
        }

        return;
    }


    // Login
    document
        .getElementById("login-form")
        .addEventListener("submit", login);


    // Logout
    document
        .getElementById("logout")
        .addEventListener("click", () => {
            client.auth.signOut();
        });


    // New project
    document
        .getElementById("new-project")
        .addEventListener("click", () => {
            openForm();
        });


    // Cancel buttons
    document
        .getElementById("cancel-edit")
        .addEventListener("click", closeForm);

    document
        .getElementById("cancel-edit-2")
        .addEventListener("click", closeForm);


    // Project form
    document
        .getElementById("project-form")
        .addEventListener("submit", saveProject);

}



// =====================================================
// LOGIN
// =====================================================

function showLogin() {

    document.getElementById("login-panel").hidden = false;

    document.getElementById("dashboard").hidden = true;

}



async function login(event) {

    event.preventDefault();

    const message =
        document.getElementById("login-message");

    message.textContent = "Přihlašuji…";


    const {
        error
    } = await client.auth.signInWithPassword({

        email:
            document
                .getElementById("login-email")
                .value
                .trim(),

        password:
            document
                .getElementById("login-password")
                .value

    });


    if (error) {

        message.textContent =
            "Přihlášení se nepodařilo: " +
            error.message;

    } else {

        message.textContent = "";

    }

}



// =====================================================
// DASHBOARD
// =====================================================

function showDashboard() {

    document.getElementById("login-panel").hidden = true;

    document.getElementById("dashboard").hidden = false;


    document.getElementById("logged-user").textContent =
        currentUser.email;


    loadAdminProjects();

}



// =====================================================
// LOAD PROJECTS
// =====================================================

async function loadAdminProjects() {

    const container =
        document.getElementById("admin-projects");


    container.innerHTML = `
        <div class="loading">
            Načítám projekty…
        </div>
    `;


    try {

        const {
            data,
            error
        } = await client
            .from("projects")
            .select("*")
            .order(
                "start_date",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        if (!data?.length) {

            container.innerHTML = `
                <div class="projects-empty">

                    <h3>
                        Zatím nejsou žádné projekty.
                    </h3>

                    <p>
                        Přidej první projekt pomocí
                        tlačítka „Nový projekt“.
                    </p>

                </div>
            `;

            return;
        }


        container.innerHTML = data
            .map((project) => {

                const dates = project.end_date
                    ? `${formatDate(project.start_date)} – ${formatDate(project.end_date)}`
                    : `${formatDate(project.start_date)} – dosud`;


                return `
                    <article class="admin-project">


                        <div class="admin-project-image">

                            ${
                                project.image_url
                                    ? `
                                        <img
                                            src="${escapeHtml(project.image_url)}"
                                            alt="${escapeHtml(project.title)}"
                                            loading="lazy"
                                        >
                                    `
                                    : `
                                        <div class="admin-project-placeholder">
                                            DP MONTBAU
                                        </div>
                                    `
                            }

                        </div>



                        <div class="admin-project-content">


                            <div class="admin-project-heading">

                                <div>

                                    <span class="admin-project-category">
                                        ${escapeHtml(
                                            project.work_type ||
                                            "Realizace"
                                        )}
                                    </span>


                                    <h3>
                                        ${escapeHtml(
                                            project.title
                                        )}
                                    </h3>

                                </div>


                                <span class="admin-project-status">
                                    ${escapeHtml(
                                        statusLabel(
                                            project.status
                                        )
                                    )}
                                </span>

                            </div>



                            <div class="admin-project-meta">

                                <span>

                                    <strong>
                                        Termín
                                    </strong>

                                    ${escapeHtml(dates)}

                                </span>


                                <span>

                                    <strong>
                                        Tým
                                    </strong>

                                    ${escapeHtml(
                                        String(
                                            project.workers || 0
                                        )
                                    )}

                                    pracovníků

                                </span>

                            </div>



                            <div class="admin-project-actions">


                                <button
                                    class="admin-action-edit"
                                    type="button"
                                    data-edit="${project.id}"
                                >

                                    Upravit

                                    <span>
                                        →
                                    </span>

                                </button>



                                <button
                                    class="admin-action-delete"
                                    type="button"
                                    data-delete="${project.id}"
                                >

                                    Smazat

                                </button>


                            </div>


                        </div>


                    </article>
                `;

            })
            .join("");


        // Edit buttons

        container
            .querySelectorAll("[data-edit]")
            .forEach((button) => {

                button.onclick = () => {

                    editProject(
                        button.dataset.edit
                    );

                };

            });


        // Delete buttons

        container
            .querySelectorAll("[data-delete]")
            .forEach((button) => {

                button.onclick = () => {

                    deleteProject(
                        button.dataset.delete
                    );

                };

            });


    } catch (error) {

        console.error(error);


        container.innerHTML = `
            <div class="projects-empty">

                <h3>
                    Projekty se nepodařilo načíst.
                </h3>

                <p>
                    ${escapeHtml(
                        error.message ||
                        "Zkontroluj Supabase a RLS."
                    )}
                </p>

            </div>
        `;

    }

}



// =====================================================
// EDIT PROJECT
// =====================================================

async function editProject(id) {

    try {

        const {
            data,
            error
        } = await client
            .from("projects")
            .select("*")
            .eq("id", id)
            .single();


        if (error) {
            throw error;
        }


        document.getElementById("project-id").value =
            data.id;


        document.getElementById("title").value =
            data.title || "";


        document.getElementById("work_type").value =
            data.work_type || "";


        document.getElementById("start_date").value =
            data.start_date || "";


        document.getElementById("end_date").value =
            data.end_date || "";


        document.getElementById("workers").value =
            data.workers || 1;


        document.getElementById("status").value =
            data.status || "done";


        document.getElementById("excerpt").value =
            data.excerpt || "";


        document.getElementById("description").value =
            data.description || "";


        // Current image

        const currentImage =
            document.getElementById("current-image");

        const preview =
            document.getElementById(
                "current-image-preview"
            );


        if (data.image_url) {

            preview.innerHTML = `
                <img
                    src="${escapeHtml(data.image_url)}"
                    alt="${escapeHtml(data.title)}"
                >
            `;

            currentImage.hidden = false;

        } else {

            preview.innerHTML = "";

            currentImage.hidden = true;

        }


        document.getElementById("remove-image").checked =
            false;


        document.getElementById("form-title").textContent =
            "Upravit projekt";


        openForm(true);


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


    } catch (error) {

        console.error(error);

        showAdminMessage(
            "Projekt se nepodařilo načíst.",
            "error"
        );

    }

}



// =====================================================
// OPEN FORM
// =====================================================

function openForm(editing = false) {

    const formWrap =
        document.getElementById(
            "project-form-wrap"
        );


    formWrap.hidden = false;


    if (!editing) {

        document
            .getElementById("project-form")
            .reset();


        document.getElementById("project-id").value =
            "";


        document.getElementById("workers").value =
            "1";


        document.getElementById("status").value =
            "done";


        document.getElementById("current-image").hidden =
            true;


        document.getElementById(
            "current-image-preview"
        ).innerHTML = "";


        document.getElementById(
            "remove-image"
        ).checked = false;


        document.getElementById(
            "form-title"
        ).textContent = "Nový projekt";

    }


    document.getElementById(
        "form-message"
    ).textContent = "";

}



// =====================================================
// CLOSE FORM
// =====================================================

function closeForm() {

    document.getElementById(
        "project-form-wrap"
    ).hidden = true;


    document
        .getElementById("project-form")
        .reset();


    document.getElementById(
        "project-id"
    ).value = "";


    document.getElementById(
        "current-image"
    ).hidden = true;


    document.getElementById(
        "current-image-preview"
    ).innerHTML = "";


    document.getElementById(
        "form-message"
    ).textContent = "";

}



// =====================================================
// SAVE PROJECT
// =====================================================

async function saveProject(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "form-message"
        );


    const saveButton =
        document.getElementById(
            "save-project"
        );


    message.textContent =
        "Ukládám projekt…";

    message.className =
        "form-message";


    saveButton.disabled = true;


    try {

        const id =
            document
                .getElementById("project-id")
                .value
                .trim();


        const title =
            document
                .getElementById("title")
                .value
                .trim();


        const workType =
            document
                .getElementById("work_type")
                .value
                .trim();


        const startDate =
            document
                .getElementById("start_date")
                .value;


        const endDate =
            document
                .getElementById("end_date")
                .value;


        const workers =
            parseInt(
                document
                    .getElementById("workers")
                    .value,
                10
            ) || 0;


        const status =
            document
                .getElementById("status")
                .value;


        const excerpt =
            document
                .getElementById("excerpt")
                .value
                .trim();


        const description =
            document
                .getElementById("description")
                .value
                .trim();


        const imageInput =
            document.getElementById(
                "image"
            );


        const removeImage =
            document.getElementById(
                "remove-image"
            ).checked;



        // Basic validation

        if (!title) {

            throw new Error(
                "Vyplň název projektu."
            );

        }


        if (!startDate) {

            throw new Error(
                "Vyplň datum začátku."
            );

        }


        if (
            endDate &&
            endDate < startDate
        ) {

            throw new Error(
                "Datum dokončení nemůže být před datem začátku."
            );

        }



        // =================================================
        // Get existing project
        // =================================================

        let oldProject = null;


        if (id) {

            const {
                data,
                error
            } = await client
                .from("projects")
                .select("*")
                .eq("id", id)
                .single();


            if (error) {
                throw error;
            }


            oldProject = data;

        }



        // =================================================
        // IMAGE
        // =================================================

        let imageUrl =
            oldProject?.image_url || null;



        // Remove existing image

        if (removeImage) {

            if (imageUrl) {

                await removeStorageFile(
                    imageUrl
                );

            }

            imageUrl = null;

        }



        // Upload new image

        if (
            imageInput.files &&
            imageInput.files.length > 0
        ) {

            const file =
                imageInput.files[0];


            const extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();


            const fileName =
                `${crypto.randomUUID()}.${extension}`;


            const filePath =
                `projects/${fileName}`;


            const {
                error: uploadError
            } = await client.storage
                .from("project-images")
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


            if (uploadError) {
                throw uploadError;
            }


            const {
                data: publicData
            } = client.storage
                .from("project-images")
                .getPublicUrl(
                    filePath
                );


            imageUrl =
                publicData.publicUrl;



            // Delete old image after
            // successful upload

            if (
                oldProject?.image_url &&
                oldProject.image_url !== imageUrl
            ) {

                await removeStorageFile(
                    oldProject.image_url
                );

            }

        }



        // =================================================
        // PROJECT DATA
        // =================================================

        const projectData = {

            title: title,

            work_type:
                workType || null,

            start_date:
                startDate,

            end_date:
                endDate || null,

            workers:
                workers,

            status:
                status || "done",

            excerpt:
                excerpt || null,

            description:
                description || null,

            image_url:
                imageUrl

        };



        // =================================================
        // UPDATE
        // =================================================

        if (id) {

            const {
                error
            } = await client
                .from("projects")
                .update(projectData)
                .eq("id", id);


            if (error) {
                throw error;
            }


            message.textContent =
                "Projekt byl úspěšně upraven.";

            message.className =
                "form-message success";

        }



        // =================================================
        // INSERT
        // =================================================

        else {

            const {
                error
            } = await client
                .from("projects")
                .insert(
                    projectData
                );


            if (error) {
                throw error;
            }


            message.textContent =
                "Projekt byl úspěšně přidán.";

            message.className =
                "form-message success";

        }



        // Refresh list

        await loadAdminProjects();


        // Close form after short delay

        setTimeout(() => {

            closeForm();

        }, 700);



    } catch (error) {

        console.error(error);


        message.textContent =
            "Projekt se nepodařilo uložit: " +
            (
                error.message ||
                "Neznámá chyba."
            );


        message.className =
            "form-message error";


    } finally {

        saveButton.disabled = false;

    }

}



// =====================================================
// DELETE PROJECT
// =====================================================

async function deleteProject(id) {

    const confirmed =
        confirm(
            "Opravdu chceš tento projekt smazat?\n\nTato akce je nevratná."
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            data: project,
            error: loadError
        } = await client
            .from("projects")
            .select("*")
            .eq("id", id)
            .single();


        if (loadError) {
            throw loadError;
        }



        // Remove image

        if (project.image_url) {

            await removeStorageFile(
                project.image_url
            );

        }



        // Delete database row

        const {
            error
        } = await client
            .from("projects")
            .delete()
            .eq("id", id);


        if (error) {
            throw error;
        }


        showAdminMessage(
            "Projekt byl smazán.",
            "success"
        );


        await loadAdminProjects();


    } catch (error) {

        console.error(error);


        showAdminMessage(
            "Projekt se nepodařilo smazat: " +
            (
                error.message ||
                "Neznámá chyba."
            ),
            "error"
        );

    }

}



// =====================================================
// REMOVE STORAGE FILE
// =====================================================

async function removeStorageFile(url) {

    try {

        const marker =
            "/storage/v1/object/public/project-images/";


        const index =
            url.indexOf(marker);


        if (index === -1) {
            return;
        }


        const path =
            decodeURIComponent(
                url.substring(
                    index + marker.length
                )
            );


        if (!path) {
            return;
        }


        const {
            error
        } = await client.storage
            .from("project-images")
            .remove([
                path
            ]);


        if (error) {

            console.warn(
                "Obrázek se nepodařilo odstranit:",
                error
            );

        }

    } catch (error) {

        console.warn(
            "Chyba při mazání obrázku:",
            error
        );

    }

}



// =====================================================
// ADMIN MESSAGE
// =====================================================

function showAdminMessage(
    text,
    type = ""
) {

    const message =
        document.getElementById(
            "admin-message"
        );


    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        "admin-message";


    if (type) {

        message.classList.add(
            type
        );

    }


    setTimeout(() => {

        message.textContent = "";

        message.className =
            "admin-message";

    }, 4000);

}



// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}



// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return new Intl.DateTimeFormat(
        "cs-CZ"
    ).format(date);

}



// =====================================================
// STATUS LABEL
// =====================================================

function statusLabel(status) {

    const labels = {

        done:
            "Dokončeno",

        progress:
            "Probíhá",

        planned:
            "Plánováno"

    };


    return (
        labels[status] ||
        status ||
        "Neurčeno"
    );

}