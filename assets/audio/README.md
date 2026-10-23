# Procedural forest audio

`ForestSound` in `game.js` creates original soft melodies and catch, miss, completion, unwrapping and victory sounds with the browser's Web Audio API. There are no external audio files, samples, libraries or licenses to fetch.

Audio starts only after interaction. It can be muted with the speaker button. If the audio API or output device is unavailable, the game continues without sound. Music pauses while the game is paused or the document is hidden.
