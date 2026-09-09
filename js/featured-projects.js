document.addEventListener("DOMContentLoaded", loadFeaturedProjects);

console.log("FEATURED PROJECTS JS FUNGUJE");

async function loadFeaturedProjects() {

    console.log("NAČÍTÁM ZAKÁZKY");

    const container =
        document.getElementById("featured-projects");

    console.log("CONTAINER:", container);

    if (!container) {
        return;
    }

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
    )
    .limit(3);

console.log("SUPABASE DATA:", data);
console.log("SUPABASE ERROR:", error);

if (error) {
    throw error;
}

        if (!data?.length) {
            container.innerHTML = `
                <div class="featured-projects-empty">
                    <h3>
                        Zatím nemáme žádné aktuální nabídky.
                    </h3>

                    <p>
                        Jakmile zveřejníme novou zakázku,
                        objeví se zde.
                    </p>
                </div>
            `;

            return;
        }
console.log("VYKRESLUJI:", data);
        container.innerHTML = data.map(project => {

            const dates = project.end_date
                ? `${formatDate(project.start_date)} – ${formatDate(project.end_date)}`
                : `${formatDate(project.start_date)} – dosud`;

            const image = project.image_url
                ? `
                    <img
                        src="${escapeHtml(project.image_url)}"
                        alt="${escapeHtml(project.title)}"
                        loading="lazy"
                    >
                `
                : `
                    <div class="featured-project-placeholder">
                        <span>DP MONTBAU</span>
                    </div>
                `;

            return `
                <article class="featured-project-card">

                    <a
                        href="projekt.html?id=${encodeURIComponent(project.id)}"
                        aria-label="Zobrazit nabídku ${escapeHtml(project.title)}"
                    >

                        <div class="featured-project-image">
                            ${image}
                        </div>

                        <div class="featured-project-content">

                            <span class="featured-project-category">
                                ${escapeHtml(
                                    project.work_type || "Zakázka"
                                )}
                            </span>

                            <h3>
                                ${escapeHtml(project.title)}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    project.excerpt || ""
                                )}
                            </p>

                            <div class="featured-project-meta">

                                <span>
                                    <strong>Termín</strong>
                                    ${escapeHtml(dates)}
                                </span>

                                <span>
                                    <strong>Tým</strong>
                                    ${escapeHtml(
                                        String(
                                            project.workers || 0
                                        )
                                    )}
                                    pracovníků
                                </span>

                            </div>

                            <div class="featured-project-bottom">

                                <span class="featured-project-status">
                                    ${escapeHtml(
                                        statusLabel(project.status)
                                    )}
                                </span>

                                <span class="featured-project-link">
                                    Zobrazit nabídku
                                    <span>→</span>
                                </span>

                            </div>

                        </div>

                    </a>

                </article>
            `;

        }).join("");
console.log("HTML VYKRESLENO:", container.innerHTML);
    } catch (error) {

        console.error(
            "Chyba při načítání aktuálních zakázek:",
            error
        );

        container.innerHTML = `
            <div class="featured-projects-empty">

                <h3>
                    Nabídky se nepodařilo načíst.
                </h3>

                <p>
                    Zkus to prosím později.
                </p>

            </div>
        `;
    }
}