# Assets

Alle benodigde productie-assets staan in deze map. Er worden tijdens het spelen geen externe bestanden gedownload.

## Gegenereerde renders

De ingebouwde OpenAI imagegen-tool maakte voor dit project:

- `characters/squirrel.webp`: vrolijke oranje eekhoorn met mand.
- `characters/tail.webp`: losse pluizige S-staart, onafhankelijk geanimeerd.
- `characters/rabbit.webp`: grijs-wit konijn; de oren worden apart bewogen in de renderer.
- `characters/rabbit-arm.webp`: losse werparm, zichtbaar vóór de truck getekend.
- `characters/squirrel-victory.webp`: overwinningspose zonder mand, gebaseerd op dezelfde personagereferentie.
- `characters/truck.webp`: gele laadtruck met een notenvoorraad.
- `backgrounds/enchanted-forest.webp`: gelaagd bos met warme zonnestralen en turquoise schaduwen.

De eerste vier figuuronderdelen zijn uit één transparante character-atlas uitgesneden. De renders zijn vervolgens bijgesneden en geoptimaliseerd naar WebP met behoud van alpha. De achtergrond is geoptimaliseerd naar WebP. De gebruikte prompts staan volledig in `ASSET_PROMPTS.json`. De gegenereerde beelden zijn geen beelden van een externe stockbibliotheek.

## Geprogrammeerde illustraties

De vijf notensoorten en de vijf schatten plus mysterybox zijn lokale SVG’s met eigen paden, kleurverlopen en schaduwen. Ze zijn meegeleverd met de broncode onder de MIT-licentie. De grote hartbeloning, zwevende deeltjes, grondschaduwen, het verhoogde platform en de kleine gele boormachine worden met Canvas getekend.

## Audio

Zie `audio/README.md`. Er zijn geen ontbrekende MP3’s of optionele audio-downloads: alle muziek en effecten worden door Web Audio gemaakt nadat de speler interactie heeft gehad.
