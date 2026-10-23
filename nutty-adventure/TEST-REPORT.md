# Testverslag — Nutty Adventure

Datum: 23 oktober 2026.

## Resultaat

**15 automatische tests geslaagd, 0 mislukt.**

Commando, uit te voeren in de projectmap:

```sh
node --test tests/engine.test.cjs tests/controller.test.cjs tests/assets.test.cjs
```

Ook de JavaScript-syntax van `engine.js`, `art.js`, `game.js` en `serve.cjs` is gecontroleerd met `node --check`. De zeven WebP-afbeeldingen zijn gedecodeerd/gevalideerd met Pillow en de elf SVG’s zijn als XML geparseerd. Alle gebruikte lokale bestandsverwijzingen bestaan, inclusief controle op exacte hoofdletters en kleine letters.

## Automatisch gecontroleerd

| Controle | Resultaat |
|---|---|
| Alle vijf levels, op 1200 × 660 en 600 × 860, met acht willekeurige reeksen per level | Geslaagd: 80 gesimuleerde levelruns |
| Precies 15 vangsten beëindigen het level; nieuwe en resterende worpen stoppen | Geslaagd |
| Elke worp vertrekt uit de actuele werppositie van het konijn | Geslaagd |
| Elk level heeft uitsluitend de bijbehorende vallende notensoort | Geslaagd |
| Diagonalen, zigzag, dubbels en waaiers | Geslaagd in de vijf levelruns |
| Vangen binnen de mandzone; daarbuiten geen punt | Geslaagd |
| Vijf missers kosten vijf levens; opnieuw proberen herstelt het huidige level | Geslaagd |
| Pauze bevriest de simulatie; hervatten gaat verder | Geslaagd |
| Beweging blijft binnen de speelveldgrenzen en heeft begrensde sleepsnelheid | Geslaagd |
| Speelbaarheid van de simulatie bij 30, 60 en 120 updates per seconde | Geslaagd |
| Volledige controllerreeks: menu → vijf levels → vijf boxen → finale → opnieuw spelen | Geslaagd in DOM/event-testomgeving |
| Het volgende level wacht op de keuze van de speler na de beloning | Geslaagd |
| Vijf unieke schatten, opslag, herladen en opnieuw bekijken van de finale | Geslaagd |
| Een verdiende, nog ongeopende box blijft beschikbaar na herladen | Geslaagd |
| Toetsen, pauze/spatie en mobiele pointer-events, inclusief pointer-cancel | Geslaagd in DOM/event-testomgeving |
| Onbeschikbare audio-API voorkomt spelen niet | Geslaagd tijdens de controllerreeks zonder AudioContext |
| Ongeldige of geblokkeerde lokale opslag blokkeert de game niet | Geslaagd |
| Trajecten blijven geldig bij wisselen van speelveldformaat | Geslaagd |
| Relatieve assetpaden onder een `/nutty-adventure/`-projectsubpad | Geslaagd bij statische URL- en bestandscontrole |
| Geen externe runtime-afhankelijkheden, fetch-verzoeken of buildstap nodig | Geslaagd bij broncontrole |

De gesimuleerde speler gebruikt dezelfde begrensde horizontale snelheid als de echte speler. Deze controle toont aan dat de levelreeksen haalbaar zijn voor die besturing; ze vervangt geen menselijke beoordeling van de moeilijkheid.

## Beperking van de browsercontrole

**De echte browsertest is niet afgerond.** De ingebouwde browser kon geen verbinding maken met de lokale preview op `localhost`. Een afzonderlijke, verborgen previewserver starten werd door de automatische goedkeuringscontrole geweigerd omdat aanvullende sandboxgoedkeuring nodig was. Rechtstreeks een `file://`-adres openen is in die testbrowser eveneens geblokkeerd.

Een eenvoudige HTTP-server kon binnen één testproces wel een eigen verzoek beantwoorden. Dit bewijst niet dat de preview vanuit de browser bereikbaar was. Daarom worden visuele browsercontrole, werkelijk hoorbare audio, fysieke touchbediening en uitvoering vanaf een echte GitHub Pages-URL hier **niet als geslaagd aangemerkt**.

De controller-tests voeren de echte `game.js` en `art.js` uit met een gesimuleerde DOM, invoergebeurtenissen, klok, afbeeldingslader en Canvas-context. Ze controleren logica en overgangen, maar beoordelen geen pixels, browserlayout of werkelijke apparaatprestaties.

## Nog handmatig controleren op GitHub Pages

1. Start de game en controleer console en netwerk op fouten.
2. Controleer op desktop de figuren, hun staart/armanimaties en de zichtbare notenbaan vanaf de konijnenpoot.
3. Beweeg met pijltjes en A/D; vang en mis noten. Controleer punten en levens.
4. Pauzeer met P en hervat met spatie. Wissel van tabblad en controleer de automatische pauze.
5. Test op een echte smartphone het slepen, de pijlknoppen en draaien van het toestel.
6. Test muziek en effecten na een klik; controleer dempen en Reduced motion.
7. Open alle vijf boxen, controleer de schattengalerij en herlaad de pagina.
8. Bekijk de hartfinale en speel die opnieuw af vanuit MY TREASURES.

De README beschrijft het uploaden en publiceren met `main` → `/(root)`. Er is tijdens de ontwikkeling geen GitHub-repository aangemaakt of site gepubliceerd.
