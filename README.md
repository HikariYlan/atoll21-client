# /// Atoll 21 \\\\\\
## Made by Hikari / Ylan

This is the browser client for **Atoll 21**, a blackjack game for [Archipelago](https://archipelago.gg) set in a run-down casino on a tropical atoll. You play blackjack, your received items unlock new rules, and your checks are sent to the multiworld.

The game itself needs the **APWorld**, which lives in a separate repository. The client talks to an Archipelago server directly from the browser, so there is no backend of its own.

> **Status:** early. The blackjack engine, betting, the bankroll and the four abilities work, with a test screen and a debug panel to unlock things by hand. There is no Archipelago connection yet, so there is nothing to play in a multiworld. Version 1.0.0 will be the first full release of both the client and the APWorld.

## What works now

- Blackjack with the French rule: the dealer shows one card and draws the rest after you are done.
- A bankroll, bet limits that grow in four steps (30%, 50%, 80% and 100% of the starting bankroll), and four dealer levels (he stands on 10, 12, 14 and 17).
- **Double, Split (up to four hands), Insurance and Surrender**, each unlockable on its own, with the right payouts.
- Buttons that enable and disable themselves from the game rules.
- A test suite for the rules.

## What is coming

- Unlock the abilities from received items, and make the dealer and your bet limits grow with them.
- Send a check when you hit a milestone, a streak, a lucky hand, and more.
- Support DeathLink, in a gentle way: when someone else dies you lose the hand in play, never your money.
- Save your progress on the Archipelago server, so you can pick it up from any device.
- Offer a 2D view, and later a 3D one, that you can switch between at any time.
- Include a computer in the casino for achievements, hints and the full log.

## Built with

TypeScript, Svelte 5, Vite, [Vitest](https://vitest.dev) and [archipelago.js](https://github.com/ArchipelagoMW/archipelago.js).

The game logic is plain TypeScript with no Svelte in it (`src/game/`: `blackjack.ts` for cards, hands and the round, `casino.ts` for the session, the bankroll and the abilities, `bankroll.ts` for bet limits and payouts). The screen only reads a snapshot of the game after each action, which is what will let the 2D and 3D views share the same game later. The tests are in `src/tests/`.

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
npm test
```

```bash
npm run build
```

`check` runs the Svelte and TypeScript checks, `test` runs the game rules tests, and `build` makes a static site in `dist/`. The tests give the dealer exact decks, so every rule can be checked card by card.

## AI disclosure

The game design and 99% of the code are mine. I used Claude as a helper for **bug fixing**: it reviewed the blackjack engine, the betting and the abilities and found bugs that I fixed myself. It just rewrote the winner check. It also **wrote the test suite** and this README. That's the 1%. The decisions about the game are mine.

## License

MIT, see [LICENSE](LICENSE).