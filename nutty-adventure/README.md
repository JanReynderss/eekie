# NUTTY ADVENTURE
## The Squirrel & Rabbit Challenge

Een complete, zelfstandige HTML5-arcadegame: vang met de oranje eekhoorn de noten die zijn konijnenvriend uit een gele truck gooit. Speel vijf levels, open vijf mysteryboxen en verzamel de grote hartbeloning.

De interface is in het Engels. De game gebruikt HTML, CSS, JavaScript en Canvas, met gegenereerde pluchefiguren in een gelaagd 2.5D-bos. Er zijn geen npm-pakketten, CDN’s, accounts, API-sleutels of betaalde diensten nodig om te spelen of te hosten. Alle afbeeldingen zijn meegeleverd. Muziek en geluidseffecten worden in de browser zelf gesynthetiseerd.

## Snel starten, ook offline

1. Pak de ZIP volledig uit.
2. Open `index.html` in een gewone browser, bijvoorbeeld Edge, Chrome, Firefox of Safari.
3. Klik op **PLAY GAME**.

De game gebruikt gewone scripts en relatieve afbeeldingspaden, dus een buildstap is niet nodig. Bewaar alle bestanden en de map `assets` bij elkaar. Voortgang wordt opgeslagen in de lokale browseropslag; bij geblokkeerde opslag kun je verder spelen tijdens de huidige sessie. Opslag via een `file://`-adres kan per browser verschillen. Via GitHub Pages gebruikt de game een normaal HTTPS-adres.

### Optioneel: lokaal testen via HTTP

Heb je Node.js geïnstalleerd, open dan een terminal in deze projectmap:

```sh
node serve.cjs
```

Open het adres dat verschijnt: `http://localhost:4173/`.

Voor controle van een GitHub-projectsubpad werkt dezelfde server ook met `http://localhost:4173/nutty-adventure/`. Stop de server met Ctrl+C. De server is alleen bedoeld voor lokaal testen; GitHub Pages heeft hem niet nodig.

Een alternatief met Python is:

```sh
python -m http.server 4173
```

## Besturing

| Actie | Besturing |
|---|---|
| Links / rechts | Pijltjestoetsen of A / D |
| Starten / hervatten | Spatie, waar passend, of de knop op het scherm |
| Pauzeren | P of de pauzeknop |
| Touch | Sleep op het speelveld of houd een pijlknop ingedrukt |
| Geluid | Luidspreker rechtsboven of Motion & settings |
| Minder beweging | Motion & settings → Reduced motion |

Bij het verlaten van het venster of wisselen van tabblad pauzeert een lopend level automatisch. De game respecteert de systeemvoorkeur voor minder beweging, tenzij je een eigen voorkeur opslaat.

## Vijf levels

| Level | Noten | Patroon |
|---|---|---|
| 1. Almond Meadow | Amandelen | Rustige, vrijwel verticale worpen |
| 2. Acorn Alley | Eikels | Het konijn beweegt en wisselt van werppositie |
| 3. Chestnut Chaos | Kastanjes | Afwisselende diagonalen met lichte zigzag |
| 4. Hazelnut Havoc | Hazelnoten | Snellere worpen, variabele pauzes en korte dubbels |
| 5. Walnut Wonderland | Walnoten | Snelle worpen, kleine waaiers en verrassende richtingen |

- Vang **15 noten** om een level te voltooien.
- Je begint elk level met **5 levens**. Een gemiste noot kost één leven.
- Bij nul levens kun je hetzelfde level opnieuw proberen. Je verzameling blijft behouden.
- Na ieder level open je zelf een mysterybox. Het volgende level wacht op je keuze.
- De vijf vaste, unieke schatten zijn Golden Acorn, Moonlit Mushroom, Starlight Diamond, Glowflower en Friendship Star.
- Ook na level 5 open je eerst de box. Daarna kies je **ONE LAST SURPRISE** voor de hartfinale.
- **MY TREASURES** toont je verzameling en laat je na voltooiing de finale opnieuw bekijken.
- **PLAY AGAIN** begint opnieuw bij level 1 met een verse score en vijf levens, en bewaart je eerder verdiende schatten en vrijgespeelde levels.

Voortgang wordt per browser en websiteadres opgeslagen onder `nutty-adventure.v1`. Een nog ongeopende verdiende box blijft bij herladen beschikbaar. Een onvoltooid level begint opnieuw; een lopende score wordt niet tussentijds opgeslagen. Lokale voortgang verhuist niet automatisch naar je GitHub Pages-adres.

## Uploaden naar GitHub en publiceren

**Upload de inhoud van deze map naar de hoofdmap van de repository.** `index.html` moet meteen zichtbaar zijn wanneer je de repository opent. Upload niet alleen het ZIP-bestand en maak niet nog een extra map `nutty-adventure` binnen de repository.

1. Maak op GitHub zelf een nieuwe repository, bijvoorbeeld `nutty-adventure`.
2. Kies de gewenste zichtbaarheid. Voor GitHub Pages met GitHub Free gebruik je een publieke repository.
3. Kies **Add file → Upload files**.
4. Sleep de uitgepakte bestanden en de volledige map `assets` naar het uploadvak. Je mag ook de meegeleverde `tests` uploaden.
5. Controleer dat `index.html`, `style.css`, `engine.js`, `art.js`, `game.js` en `assets/` rechtstreeks in de hoofdmap komen.
6. Commit de bestanden naar de branch **main**. De meegeleverde lege `.nojekyll` schakelt de Jekyll-verwerking uit. Als je verkenner dit bestand verbergt, neem het via Git mee of maak het op GitHub aan.
7. Open **Settings → Pages** in de repository.
8. Kies bij **Build and deployment → Source**: **Deploy from a branch**.
9. Kies branch **main** en map **/(root)**. Klik **Save**.
10. Wacht tot GitHub de publicatie afrondt. De Pages-instellingen tonen daarna de link naar je game.

Het adres wordt doorgaans:

```text
https://JOUW-GEBRUIKERSNAAM.github.io/nutty-adventure/
```

Deze branch/root-instellingen volgen de [officiële GitHub Pages-instructies](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). De eisen aan het entrybestand staan bij [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

### Uploaden met Git als alternatief

Voer in deze map uit en vervang de URL door die van jouw lege repository:

```sh
git init
git add .
git commit -m "Add Nutty Adventure game"
git branch -M main
git remote add origin https://github.com/JOUW-GEBRUIKERSNAAM/nutty-adventure.git
git push -u origin main
```

Activeer daarna Pages zoals hierboven beschreven. Er zijn geen GitHub Actions-build, configuratiebestanden of omgevingsvariabelen nodig.

### Eerste controle na publicatie

Open de gepubliceerde URL met de afsluitende `/` en doorloop deze controles:

- Start level 1, beweeg met de pijltjes en controleer de mand bij een vangst.
- Laat een noot vallen, pauzeer en probeer een verloren level opnieuw.
- Open een mysterybox, ververs de pagina en controleer de bewaarde schat.
- Controleer op een telefoon het slepen en de aanraakknoppen.
- Controleer geluid aan/uit en Reduced motion.
- Speel de vijf levels uit, open de laatste box en bekijk de hartfinale.

Bij een 404: controleer dat `index.html` in de root van `main` staat en Pages diezelfde root publiceert. Controleer bij ontbrekende afbeeldingen dat de volledige `assets`-map is geüpload en de hoofdletters in bestandsnamen niet zijn gewijzigd.

## Projectindeling

```text
nutty-adventure/
├── index.html              # Menu, HUD, toegankelijke knoppen en dialogen
├── style.css               # Responsieve opmaak en bewegingsvoorkeuren
├── engine.js               # Levelconfiguratie, fysica, botsingen en opslag
├── art.js                  # 2.5D-renderer, voertuigen en personageanimatie
├── game.js                 # Spelstaten, invoer, beloningen, audio en finale
├── assets/
│   ├── characters/         # Geoptimaliseerde transparante WebP-renders
│   ├── backgrounds/        # Bosachtergrond
│   ├── nuts/               # Vijf herkenbare SVG-noten
│   ├── rewards/            # Mysterybox en vijf unieke SVG-schatten
│   ├── audio/              # Uitleg over gesynthetiseerde audio
│   ├── README.md           # Herkomst en gebruik van assets
│   └── ASSET_PROMPTS.json  # Gebruikte beeldgeneratieprompts
├── tests/                  # Tests met de ingebouwde Node-test runner
├── serve.cjs               # Optionele lokale ontwikkelserver
├── TEST-REPORT.md
├── LICENSE
├── README.md
└── .nojekyll
```

## Aanpassen

De vijf configuratieobjecten staan bovenaan `engine.js`, in `LEVELS`. `interval` is de gemiddelde tijd tussen worpen en `flight` is de valtijd tot de mand, in seconden. De patronen staan in `chooseTarget`, `launch` en `update`. Alle spelbeweging gebruikt verstreken tijd in seconden.

De renderer staat los van de simulatie. Je kunt illustraties vervangen met behoud van de bestandsnamen en alpha-transparantie. De Engelse centrale labels staan in `TEXT.en` in `game.js`; overige schermteksten staan bij hun schermfuncties en kunnen op dezelfde manier in een vertaalbestand worden ondergebracht.

## Tests

Met Node.js kun je de meegeleverde tests uitvoeren zonder installatie van pakketten:

```sh
node --test tests/engine.test.cjs tests/controller.test.cjs tests/assets.test.cjs
```

De tests controleren onder meer alle levels op twee speelveldformaten, drie updatefrequenties, botsingen, levens, pauze, opslag, invoerafhandeling en de volledige controllerovergang van menu tot hartfinale. De controller gebruikt daarbij een gesimuleerde DOM en Canvas-context: dit is geen echte browsertest. Zie `TEST-REPORT.md` voor resultaten en de beperking van de lokale browsercontrole in de ontwikkelomgeving.

## Assets en licentie

De figuren, het bos, de truck en de overwinningspose zijn voor dit project gemaakt met de ingebouwde imagegen-tool. De SVG-noten, schatten, voertuigdecoratie en alle geluiden zijn voor dit project geprogrammeerd. Er zijn geen gedownloade commerciële muziekbestanden of externe dierenfoto’s gebruikt. Zie `assets/README.md` en `assets/ASSET_PROMPTS.json` voor de herkomst.

De broncode en handgeschreven SVG’s worden meegeleverd onder de MIT-licentie in `LICENSE`. De AI-gegenereerde beelden zijn afzonderlijk vermeld in de assetdocumentatie.
