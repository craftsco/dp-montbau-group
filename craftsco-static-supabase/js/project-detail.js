document.addEventListener("DOMContentLoaded", loadProject);


async function loadProject() {

    const c = document.getElementById("project-detail");

    const id = new URLSearchParams(location.search).get("id");


    if (!id) {

        c.innerHTML = `
            <div class="projects-empty">

                <h3>
                    Nabídka nebyla nalezena.
                </h3>

                <p>
                    Požadovaná pracovní nabídka neexistuje
                    nebo nebyl zadán správný odkaz.
                </p>

                <a
                    class="btn btn-red"
                    href="projekty.html"
                >
                    Zpět na aktuální zakázky
                    <span>→</span>
                </a>

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

            <!-- ==========================================
                 HEADER NABÍDKY
            =========================================== -->

            <div class="project-detail-header">

                <p class="eyebrow">
                    AKTUÁLNÍ ZAKÁZKA
                </p>


                <h1>
                    ${escapeHtml(p.title)}
                </h1>


                ${
                    p.excerpt
                        ? `
                            <p class="detail-lead detail-lead-top">
                                ${escapeHtml(p.excerpt)}
                            </p>
                        `
                        : ""
                }


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
                            Termín zakázky
                        </strong>

                        ${escapeHtml(dates)}

                    </span>


                    <span class="detail-meta-item">

                        <strong>
                            Počet pracovníků
                        </strong>

                        ${escapeHtml(
                            String(p.workers || 0)
                        )}

                    </span>

                </div>

            </div>



            <!-- ==========================================
                 HLAVNÍ FOTO
            =========================================== -->

            ${image}



            <!-- ==========================================
                 PODROBNOSTI NABÍDKY
            =========================================== -->

            <div class="detail-description">

                <div class="detail-section-heading">

                    <p class="eyebrow">
                        PODROBNOSTI ZAKÁZKY
                    </p>

                    <h2>
                        Informace k nabídce
                    </h2>

                </div>


                ${
                    p.description
                        ? `
                            <div class="detail-text">
                                ${escapeHtml(p.description)}
                            </div>
                        `
                        : `
                            <div class="detail-text">
                                Podrobnosti k této zakázce
                                momentálně nejsou k dispozici.
                            </div>
                        `
                }

            </div>



            <!-- ==========================================
                 KONTAKT
            =========================================== -->

            <div class="detail-contact-box">

                <div>

                    <p class="eyebrow">
                        MÁTE ZÁJEM?
                    </p>

                    <h2>
                        Chcete se přidat
                        k této zakázce?
                    </h2>

                    <p>
                        Ozvěte se nám a domluvíme
                        další podrobnosti spolupráce.
                    </p>

                </div>


                <a
                    class="btn btn-red"
                    href="index.html#kontakt"
                >
                    Kontaktujte nás
                    <span>→</span>
                </a>

            </div>

        `;


    } catch (e) {

        console.error(e);

        c.innerHTML = `
            <div class="projects-empty">

                <h3>
                    Nabídku nebylo možné načíst.
                </h3>

                <p>
                    Zkontroluj odkaz na nabídku
                    a nastavení Supabase.
                </p>

                <a
                    class="btn btn-red"
                    href="projekty.html"
                >
                    Zpět na aktuální zakázky
                    <span>→</span>
                </a>

            </div>
        `;
    }
}