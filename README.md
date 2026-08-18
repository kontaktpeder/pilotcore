# Sicily Pilot

---

Bygg **Pilot Core** — Gold of Sicilys første kjerneprodukt for piloten hos Oslo Bar og Bowling.

Dette er **ikke** en markedsnettside og **ikke** en AI-app. Det er loggføring, automatiske beregninger og enkle varsler. Kontrakten definerer databehovet; appen gjør registreringen rask og bygger ukesrapporten automatisk.

## Produkt og merkevare

- Navn: Pilot Core

- Brand: Gold of Sicily (goldofsicily.no)

- Farger: blush/cream bakgrunn, espresso tekst, tomato aksent, golden CTA, olive

- Font: Fraunces til titler, Inter til UI

- Wordmark: Gold of Sicily

- Språk: norsk bokmål

- Mobil-først PWA, som Work Core og Dagen Vår: document lock, `100dvh`, safe-area, store tap-targets, `surface-card`, nested bottom sheets med grabber og sticky footer. Ingen sidebar. Ingen bottom nav.

To visninger, bytt i header: **Sted** og **Leverandør**.

## Fire handlinger (sted)

1. **Jeg tar ut varer fra fryseren** (~10 sek)  

   Når varene tas ut, ikke ved stengetid: variant, antall, batch (FIFO forhåndsvalgt), dato/klokkeslett automatisk, beregnet frist for tilberedning/kassering.

2. **Dagens status** (under ett minutt, ved stengetid)  

   Solgt per variant, kassert, tint men ikke solgt, valgfri prisendring/rabatt, «Hvordan fungerte arbeidsflyten?» (enkelt/greit/vanskelig), valgfri kommentar.  

   Appen beregner omsetning, gjenværende fryselager, gjenværende tint, svinnprosent, salgsgrad, produkter nær frist.  

   Prisen ligger ferdig (89 kr). De registrerer bare avvik.

3. **Ukentlig oppsummering** (~2 min)  

   Vis ukens tall automatisk. Still seks spørsmål med svaralternativer + valgfri kommentar: drikkesalg/matomsetning, vs pizza/eksisterende mat, ansattes erfaring (lagring/tining/tilberedning/servering), anonymiserte gjestetilbakemeldinger, salgsinnvendinger (pris/størrelse/smak), leveranser, pluss valgfritt felt for forbedrings- og markedsføringsideer.  

   Dette er **ikke** en ny rapportplikt. Daglig logging erstatter manuell ukesrapport etter punkt 10.

4. **Rapporter avvik** — alltid synlig rød knapp  

   Frysekjede, emballasje/levering, merking, allergenmistanke, produktfeil, airfryer. Batch, berørt antall, gjenværende beholdning, beskrivelse, valgfritt bilde. Varsle Gold of Sicily med en gang. Ikke vent på dagens status.

## Leverandørvisning

Flyt:

```

Levert → På fryselager → Tint → Solgt

                           ↘ Kassert

```

Vis: levert/tint/solgt/kassert/gjenværende, beholdning per variant og batch, må brukes snart, omsetning og svinn per dag og uke, gjestenes vanligste reaksjoner og innvendinger, arbeidsflyt- og leveringsproblemer, automatisk ukesrapport og sluttevaluering-utkast.

## Data og regler

Varianter: **'Nduja** og **Trøffel og sopp**.  

Pilot: Oslo Bar og Bowling, **100 stk/uke** kontraktsfestet, 4 uker / 400 totalt.

1. Daglig registrering er en enkel metode som **erstatter** separat ukesrapport — ikke en ny omfattende plikt. Fallback: e-post.

2. Holdbarhet etter uttak: nettsiden sier 24 t, kontrakten 48 t. Gjør det til innstilling. Default **48 t** til det er avklart skriftlig. Varsler følger valgt verdi.

3. Appen kan **anbefale** endret leveransemengde, men må aldri endre 100/uke automatisk uten skriftlig avtale.

4. Ingen avansert AI eller salgsprognoser. Fire uker og 400 produkter er for lite.

Vedlegg 4-tekst i innstillinger:

> Pilotkunden benytter leverandørens enkle pilotapp til registrering av uttak fra fryser, salg, svinn, beholdning og korte driftsobservasjoner. Registreringene danner automatisk den ukentlige statusen etter punkt 10 og erstatter separat rapportering. Dersom løsningen er utilgjengelig, kan opplysningene deles på e-post. Bruken utvider ikke pilotkundens opplysningsplikt utover avtalen.

## Arkitektur (nytt core, som Work/Control)

- TanStack Start, filruter, org-skall

- Domenelag: batches, thaw lots, day status, weekly observations, deviations

- FIFO ved tining og trekk mot solgt/kassert

- Module Contract v1: `/api/public/v1/module/{health,info,organization,widgets}`

- `module_slug`: `pilot`, key prefix `gos_live_`

- v0: localStorage + demodata for Oslo Bar og Bowling er greit. Strukturert så det kan flyttes til Supabase senere.

- Start på `/` (sted) og `/leverandor`. Ikke bygg en markedsforside.

Seed uken som i gang, så leverandørvisningen har tall.

Ikke lag landing, CMS, nyhetsbrev eller «AI-prognoser». Bare appen over.

---

Etter første bygg: **Project settings → Git → Connect GitHub**. Send meg repo-navnet, så kan jeg rydde `/pilot` ut av nettsiden og la dette prosjektet eie koden.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pilotcore.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f9cf12e6-d8ff-441f-879b-386c5364532e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
