document.addEventListener("DOMContentLoaded", loadProjects);


async function loadProjects() {

    const g = document.getElementById("projects-grid");

    try {

        const {
            data,
            error
        } = await getSupabase()
            .from("projects")
            .select(
                "id,title,start_date,end_date,work_type,workers,status,excerpt,image_url"
            )
            .order(
                "start_date",
                { ascending: false }
            );


        if (error) {
            throw error;
        }


        if (!data?.length) {

            g.innerHTML = `
                <div class="projects-empty">

                    <h3>
                        Zatím nejsou zveřejněny žádné projekty.
                    </h3>

                    <p>
                        Projekty se zde zobrazí po jejich přidání
                        v administraci.
                    </p>

                </div>
            `;

            return;
        }


        g.innerHTML = data.map(p => {

            const image = p.image_url
                ? `
                    <img
                        src="${escapeHtml(p.image_url)}"
                        alt="${escapeHtml(p.title)}"
                        loading="lazy"
                    >
                `
                : `
                    <div class="project-placeholder">
                        DP MONTBAU
                    </div>
                `;


            const dates = p.end_date
                ? `${formatDate(p.start_date)} – ${formatDate(p.end_date)}`
                : `${formatDate(p.start_date)} – dosud`;


            return `
                <article class="project-card">

                    <a
                        href="projekt.html?id=${encodeURIComponent(p.id)}"
                        aria-label="Zobrazit projekt ${escapeHtml(p.title)}"
                    >

                        <div class="project-card-image">

                            ${image}

                        </div>


                        <div class="project-card-content">

                            <span class="project-card-category">
                                ${escapeHtml(
                                    p.work_type || "Realizace"
                                )}
                            </span>


                            <h3>
                                ${escapeHtml(p.title)}
                            </h3>


                            <p>
                                ${escapeHtml(
                                    p.excerpt || ""
                                )}
                            </p>


                            <div class="project-card-meta">

                                <span>
                                    ${escapeHtml(dates)}
                                </span>

                                <span>
                                    ${escapeHtml(
                                        String(p.workers || 0)
                                    )}
                                    pracovníků
                                </span>

                            </div>


                            <div class="project-card-bottom">

                                <span class="badge">
                                    ${escapeHtml(
                                        statusLabel(p.status)
                                    )}
                                </span>


                                <span class="project-card-link">

                                    Zobrazit projekt

                                    <span>
                                        →
                                    </span>

                                </span>

                            </div>

                        </div>

                    </a>

                </article>
            `;

        }).join("");


    } catch (e) {

        console.error(e);

        g.innerHTML = `
            <div class="projects-empty">

                <h3>
                    Nepodařilo se načíst projekty.
                </h3>

                <p>
                    Zkontroluj nastavení Supabase a RLS.
                </p>

            </div>
        `;
    }
}