# CRAFTS CO. – HTML/CSS/JS + Supabase + GitHub Pages

Toto je čistá statická verze bez Node, Nunjucks, Eleventy nebo vlastního backendu.

## Architektura
- GitHub = repo + Git historie + GitHub Pages hosting
- HTML/CSS/JS = frontend
- Supabase PostgreSQL = projekty
- Supabase Auth = přihlášení administrátora
- Supabase Storage = fotografie

Klient může projekty měnit několikrát denně. Změna jde přímo do Supabase, takže se kvůli ní nedělá Git commit ani nový deploy.

## Supabase
1. Vytvoř projekt na https://supabase.com/
2. SQL Editor -> New query.
3. Vlož celý `supabase.sql` -> Run.
4. Authentication -> Users -> Add user. Vytvoř klientovi účet. Nepovoluj veřejnou registraci.
5. Project Settings -> API -> vezmi Project URL a Publishable key (u starších projektů anon key).
6. Vlož je do `js/config.js`.
7. Nikdy nepoužívej service_role/secret key ve frontendu.

## Lokální test
Ve složce projektu spusť například:
`python -m http.server 8000`
Pak otevři `http://localhost:8000/` a `http://localhost:8000/admin.html`.

## GitHub Pages
1. Vytvoř GitHub repository, například `craftsco-web`.
2. Nahraj všechny soubory do rootu repa.
3. Settings -> Pages -> Deploy from a branch -> `main` -> `/ (root)` -> Save.
4. Web bude na GitHub Pages URL.
5. Administrace je `/admin.html`.

## Supabase Auth URL
V Authentication -> URL Configuration nastav Site URL na URL webu, například:
`https://UZIVATEL.github.io/craftsco-web/`
Při přechodu na vlastní doménu ji změň.

## Důležité
RLS policies v `supabase.sql` jsou bezpečnostní vrstva. Veřejnost může projekty číst, ale jen přihlášený uživatel může insert/update/delete. Frontendový publishable/anon key není serverové heslo.

## Fotografie
Bucket `project-images` je veřejný pro zobrazení obrázků. Upload/delete/update je jen pro authenticated uživatele. Admin omezuje upload na 2 MB na soubor.
