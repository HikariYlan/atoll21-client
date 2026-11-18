# /// Atoll 21 \\\\\\
## Made by Hikari / Ylan

This is the browser client for **Atoll 21**, a blackjack game for [Archipelago](https://archipelago.gg) set in a run-down casino on a tropical atoll. You play blackjack, your received items unlock new rules, and your checks are sent to the multiworld.

The game itself needs the **APWorld**, which lives in a separate repository. The client talks to an Archipelago server directly from the browser, so there is no backend of its own.

> **Status:** very early. The blackjack engine and a small test screen exist. There is no betting, no bankroll and no Archipelago connection yet, so there is nothing to play. Version 1.0.0 will be the first full release of both the client and the APWorld.

## What it will do

- Play blackjack with the French rule: the dealer shows one card and draws the rest after you are done.
- Unlock Double, Split, Insurance and Surrender as you receive them, and make the dealer and your bet limits grow with your items.
- Send a check when you hit a milestone, a streak, a lucky hand, and more.
- Support DeathLink, in a gentle way: when someone else dies you lose the hand in play, never your money.
- Save your progress on the Archipelago server, so you can pick it up from any device.
- Offer a 2D view, and later a 3D one, that you can switch between at any time.
- Include a computer in the casino for achievements, hints and the full log.

## Built with

TypeScript, Svelte 5, Vite and [archipelago.js](https://github.com/ArchipelagoMW/archipelago.js).

The game logic is plain TypeScript with no Svelte in it (`src/game/blackjack.ts`). The screen only reads a snapshot of the game after each action, which is what will let the 2D and 3D views share the same game later.

## Running it locally

You need Node.js and npm.

```bash
npm install
```

```bash
npm run dev
```

Other scripts:

```bash
npm run check
```

```bash
npm run build
```

`check` runs the Svelte and TypeScript checks, and `build` makes a static site in `dist/`.

## AI disclosure

The game design and most of the code are mine. I used Claude as a helper for **bug fixing**: it reviewed the blackjack engine, found bugs in it, rewrote the winner check and tested the engine. It also wrote a first draft of this README. The decisions about the game are mine.

## License

MIT, see [LICENSE](LICENSE).