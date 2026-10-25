# Teamkalender – 0. årgang

En lille webapp til lærerteamet på 0. årgang. Den virker på telefon, iPad og computer og kan lægges på hjemmeskærmen som en app.

**Faner**

1. **To do** – fælles opgaveliste med hvem og frist.
2. **Skema** – 0.A, 0.B og 0. årgang.
   - Hver lektion har en overskrift (f.eks. Dansk) og tre "piller": **Plan**, **Voksne** og **Holddeling**.
   - Holddeling åbner i en ny fane, hvor man skriver hvilke børn der er på hvilket hold den dag.
   - En lektion kan ligge i én uge eller fast i en periode (f.eks. uge 5–20). Ændringer kan gælde én uge eller hele perioden.
   - Det man lægger ind under **0. årgang**, kommer i både 0.A og 0.B. Ligger der noget i forvejen, spørger appen om det skal erstattes, eller om begge ting skal stå.
3. **Lærerkalender** – årsoversigt august–juni med kun lærermøder (LM), afdelingsmøder (AM) og kurser.
4. **Hold** – DSA og årgangsholddeling.
5. **Teammøde** – dagsorden og referat.

## GDPR

Appen er lavet til planlægning, ikke til elevoplysninger. Skriv kun fornavne eller initialer på børn, og aldrig noget om helbred, trivsel, diagnoser, CPR-nummer eller familieforhold. Data ligger i EU (Supabase, Frankfurt), og kun lærere på listen kan logge ind.

## Prøv den

Åbn `index.html` via en lille webserver, f.eks. `python3 -m http.server`, og gå til http://localhost:8000.
Uden opsætning kører appen i **prøve-tilstand**, hvor data kun gemmes i den browser man bruger.

## Del den med lærerne (ca. 15 minutter)

1. **Opret Supabase** (gratis): gå til https://supabase.com, opret et projekt og vælg region **Central EU (Frankfurt)**.
2. **Opret tabellerne**: åbn *SQL Editor*, indsæt indholdet af `supabase/setup.sql` og tryk *Run*. Tilføj derefter lærernes mails:
   ```sql
   insert into public.allowed_emails (email) values ('caroline@skole.dk'), ('kollega@skole.dk');
   ```
3. **Udfyld nøglerne**: kopiér *Project URL* og *anon public key* fra *Project Settings → API* ind i `js/config.js`. Anon-nøglen må gerne være offentlig; adgangen styres af listen over mails.
4. **Læg appen online**: slå GitHub Pages til under *Settings → Pages* på repoet (branch `main`, mappe `/`).
5. **Login-link**: indsæt GitHub Pages-adressen under *Authentication → URL Configuration → Site URL* i Supabase.

Lærerne logger ind med deres mail og får et link tilsendt. Der er ingen adgangskoder.

## Tilpasning

Klasser, skemaets tider og pauser, fagforslag og mødetyper står i `js/config.js`.
