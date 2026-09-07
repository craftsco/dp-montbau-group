document.addEventListener("DOMContentLoaded", loadProject);


async function loadProject() {

    const c = document.getElementById("project-detail");

    const id = new URLSearchParams(location.search).get("id");


    if (!id) {

        c.innerHTML = `
            <div class="projects-empty">

                <h3>
                    Projekt nebyl nalezen.
                </h3>

                <p>
                    Požadovaný projekt neexistuje
                    nebo nebyl zadán správný odkaz.
                </p>

            </div>
        `;

        return;
    }


    try {

        const {
            data: p,
            error
        } = await getSupabase()
            .from("projects")
            .select("*")
            .eq("id", id)
            .single();


        if (error) {
            throw error;
        }


        document.title =
            `${p.title} | DP Montbau Group s.r.o.`;


        const dates = p.end_date
            ? `${formatDate(p.start_date)} – ${formatDate(p.end_date)}`
            : `${formatDate(p.start_date)} – dosud`;


        const image = p.image_url
            ? `
                <div class="detail-image">

                    <img
                        src="${escapeHtml(p.image_url)}"
                        alt="${escapeHtml(p.title)}"
                    >

                </div>
            `
            : `
                <div class="detail-image detail-image-placeholder">
                    <span>
                        DP MONTBAU
                    </span>
                </div>
            `;


        c.innerHTML = `

            <div class="project-detail-header">

                <p class="eyebrow">
                    REALIZACE
                </p>


                <h1>
                    ${escapeHtml(p.title)}
                </h1>


                <div class="detail-meta">

                    <span class="detail-badge">
                        ${escapeHtml(
                            statusLabel(p.status)
                        )}
                    </span>


                    <span class="detail-meta-item">

                        <strong>
                            Typ práce
                        </strong>

                        ${escapeHtml(
                            p.work_type || "—"
                        )}

                    </span>


                    <span class="detail-meta-item">

                        <strong>
                            Termín
                        </strong>

                        ${escapeHtml(dates)}

                    </span>


                    <span class="detail-meta-item">

                        <strong>
                            Tým
                        </strong>

                        ${escapeHtml(
                            String(p.workers || 0)
                        )}
                        pracovníků

                    </span>

                </div>

            </div>


            ${image}


            <div class="detail-description">

                ${
                    p.excerpt
                        ? `
                            <p class="detail-lead">
                                ${escapeHtml(p.excerpt)}
                            </p>
                        `
                        : ""
                }


                ${
                    p.description
                        ? `
                            <div class="detail-text">
                                ${escapeHtml(p.description)}
                            </div>
                        `
                        : ""
                }

            </div>

        `;


    } catch (e) {

        console.error(e);

        c.innerHTML = `
            <div class="projects-empty">

                <h3>
                    Projekt nebylo možné načíst.
                </h3>

                <p>
                    Zkontroluj odkaz na projekt
                    a nastavení Supabase.
                </p>

            </div>
        `;
    }
}