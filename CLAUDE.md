# CLAUDE.md

Projektkontekst og regler for Claude Code.

## Formål

Teamkalender er en lille webapp (PWA) til lærerteamet på 0. årgang på ejerens datters skole. Den deles af nogle få lærere og må ikke indeholde følsomme personoplysninger (GDPR): kun fornavne eller initialer på børn, aldrig helbred, trivsel, CPR o.l.

Faner: To do · Skema (0.A, 0.B, 0. årgang med plan, voksne og holddeling) · Lærerkalender (kun LM, AM og kursus) · Hold (DSA, årgangsholddeling) · Teammøde.

Adresse, når GitHub Pages er slået til: https://pbo-dot.github.io/kalender/

## Opbygning

Almindelige statiske filer, intet byggetrin (som pbo-dot/db). GitHub Pages fra `main`, rodmappen.

- `index.html` – appens skal og faner.
- `css/style.css` – al styling, farver som tokens med lys og mørk tilstand.
- `js/config.js` – klasser, skemaets tider og pauser, fagforslag, mødetyper og Supabase-nøgler.
- `js/store.js` – data. Uden Supabase-nøgler gemmes alt i browseren (prøve-tilstand).
- `js/app.js` – navigation og login. `js/ui.js` – dialoger, formularer, beskeder.
- `js/views/` – én fil pr. fane. `holddeling.js` åbner i egen fane fra skemaet.
- `supabase/setup.sql` – tabeller og adgangsregler til delt data.

**Undtagelse fra "ingen server":** Lærerne skal se de samme data, så delingen kræver en server. Vi bruger Supabase (gratis, EU/Frankfurt) med login via link på mail, og kun mails på en godkendt liste får adgang. Alt andet kører i browseren.

## Arbejdsform med ejeren

- Skriv på dansk, kort og i almindeligt sprog. Ejeren er ikke programmør.
- Nye funktioner drøftes og godkendes, før de bygges. Fejlrettelser må laves med det samme.
- Vis altid et visuelt forslag (billede), før nye skærme eller større ændringer bygges.
- Læg ændringer direkte på `main`, hold øje med byggeriet (GitHub Pages), og sig til med link, når det er ude.
- Vær ærlig om, hvad der er testet, og hvad kun kan testes på ejerens telefon (Google Pixel, Android).
- Kommentarer og tekster i appen på dansk.

## Design (top-design anno 2026)

Alt nyt og alt, der ændres, skal leve op til top-design anno 2026.

- Moderne 2026-design, der virker lige godt på **iPhone/iPad (Safari)**, **Android** og **Windows-computer** (Edge/Chrome). Lærerne bruger forskellige enheder.
- Fælles, neutral stil i stedet for at efterligne én platform. Ånden fra Material 3 Expressive må gerne bruges, men det skal også føles naturligt på Apple.
- Stor, letlæselig skrift og stærk kontrast. Både lys og mørk tilstand skal se godt ud.
- Store trykflader (mindst 44–48 px) og runde knapper. Tre slags knapper: fyldt (hovedhandling), tonal (almindelig) og tekst (mindre vigtig).
- Kort uden kanter, store runde hjørner og god luft. Ensartede streg-ikoner.
- Telefon: faner i bunden med en farvet "pille" om den valgte fane, og plads til iPhonens hjemmelinje. Computer: brug den ekstra bredde, f.eks. faner i siden og hele ugeskemaet på én gang.
- Skal kunne bruges med mus og tastatur på computer, ikke kun touch.
- Korte tekster. Ingen lange hjælpetekster.
- Bløde, diskrete overgange (respektér "reducer bevægelse").

Valgt stil (godkendt af ejeren): koboltblå hovedfarve, kølig lys baggrund med svag farveglød, svævende "glas"-fanebjælke (bund på telefon, venstre side på computer ≥ 840 px), otte faste farvepar til fag. Skrift: Bricolage Grotesque (overskrifter) og Figtree (tekst). Skolens Aula-farver bruges ikke.

## Teknik i ejerens andre apps

- Webapp: PWA på GitHub Pages, enten React + Vite (som pbo-dot/dagbog) eller enkle filer (som pbo-dot/db). Personlige data gemmes på telefonen, krypteret.
- Android-app: Kotlin, bygges kun af GitHub Actions og udgives som .apk under udgivelsen "seneste" (som pbo-dot/Lukker og pbo-dot/RO). Signeres med en fast nøgle i repoet, som aldrig må skiftes.
- Ingen server, medmindre det er nødvendigt.
