import { describe, expect, it } from "vitest";
import { BlackJackRound, checkWinner, computeHand, dealerTurn, HandOutcome, HandState, RoundState } from "../game/blackjack";
import { deckOf, handOf, ranksOf } from "./testHelpers";

function round(...ranks: string[]): BlackJackRound {
    return new BlackJackRound(10, 10, false, deckOf(...ranks));
}

describe("computeHand", () => {
    it("counts a soft hand", () => {
        expect(computeHand(handOf("Five", "Four", "Ace").cards)).toEqual([20, true]);
    });

    it("turns an Ace into a 1 when needed", () => {
        expect(computeHand(handOf("Ace", "Ace").cards)).toEqual([12, true]);
        expect(computeHand(handOf("Ten", "Six", "Ace").cards)).toEqual([17, false]);
        expect(computeHand(handOf("Ace", "Ace", "Nine").cards)).toEqual([21, true]);
    });

    it("counts face cards as 10", () => {
        expect(computeHand(handOf("King", "Queen").cards)).toEqual([20, false]);
    });
});

describe("dealerTurn", () => {
    it("stands at 10 with the weakest dealer", () => {
        const hand = handOf("Six");
        dealerTurn(deckOf("Four"), hand, 10, false);
        expect(computeHand(hand.cards)[0]).toBe(10);
        expect(hand.cards.length).toBe(2);
    });

    it("keeps drawing below 12", () => {
        const hand = handOf("Six");
        dealerTurn(deckOf("Five", "Two"), hand, 12, false);
        expect(computeHand(hand.cards)[0]).toBe(13);
        expect(hand.cards.length).toBe(3);
    });

    it("stands on exactly 12 at level 12", () => {
        const hand = handOf("Six");
        dealerTurn(deckOf("Six"), hand, 12, false);
        expect(hand.cards.length).toBe(2);
    });

    it("keeps drawing below 14", () => {
        const hand = handOf("Six");
        dealerTurn(deckOf("Seven", "Ace"), hand, 14, false);
        expect(computeHand(hand.cards)[0]).toBe(14);
        expect(hand.cards.length).toBe(3);
    });

    it("stands on a soft 17 unless it hits soft", () => {
        const stands = handOf("Ace");
        dealerTurn(deckOf("Six"), stands, 17, false);
        expect(stands.cards.length).toBe(2);

        const hits = handOf("Ace");
        dealerTurn(deckOf("Six", "Four"), hits, 17, true);
        expect(hits.cards.length).toBe(3);
        expect(computeHand(hits.cards)[0]).toBe(21);
    });

    it("stands on a hard 17 even when it hits soft", () => {
        const hand = handOf("Ten");
        dealerTurn(deckOf("Seven"), hand, 17, true);
        expect(hand.cards.length).toBe(2);
    });

    it("always draws its second card", () => {
        const hand = handOf("Ace");
        dealerTurn(deckOf("Two"), hand, 0, false);
        expect(hand.cards.length).toBe(2);
    });
});

describe("checkWinner", () => {
    const cases: [string, string[], string[], HandOutcome][] = [
        ["both bust is a player bust", ["Ten", "Six", "Ten"], ["Ten", "Six", "Ten"], HandOutcome.PLAYER_BUST],
        ["dealer bust", ["Ten", "Eight"], ["Ten", "Six", "Ten"], HandOutcome.DEALER_BUST],
        ["both blackjack", ["Ace", "King"], ["Ace", "Queen"], HandOutcome.PUSH_BLACKJACK],
        ["player blackjack", ["Ace", "King"], ["Ten", "Nine"], HandOutcome.PLAYER_BLACKJACK],
        ["player blackjack over a three-card 21", ["Ace", "King"], ["Seven", "Seven", "Seven"], HandOutcome.PLAYER_BLACKJACK],
        ["dealer blackjack over a three-card 21", ["Seven", "Seven", "Seven"], ["Ace", "King"], HandOutcome.DEALER_BLACKJACK],
        ["equal totals", ["Ten", "Eight"], ["Nine", "Nine"], HandOutcome.PUSH],
        ["higher total", ["Ten", "Nine"], ["Ten", "Eight"], HandOutcome.PLAYER_WIN],
        ["lower total", ["Ten", "Seven"], ["Ten", "Eight"], HandOutcome.DEALER_WIN],
    ];

    for (const [name, player, dealer, expected] of cases) {
        it(name, () => {
            expect(checkWinner(handOf(...player), handOf(...dealer))).toBe(expected);
        });
    }
});

describe("BlackJackRound", () => {
    it("deals player, dealer, player", () => {
        const r = round("Ten", "Six", "Seven");
        expect(ranksOf(r.playerHands[0])).toEqual(["Ten", "Seven"]);
        expect(ranksOf(r.dealerHand)).toEqual(["Six"]);
        expect(r.roundState).toBe(RoundState.PLAYER_ROUND);
    });

    it("finishes at once on a player blackjack and lets the dealer play", () => {
        const r = round("Ace", "Six", "King", "Ten");
        expect(r.roundState).toBe(RoundState.FINISHED);
        expect(r.playerHands[0].outcome).toBe(HandOutcome.PLAYER_BLACKJACK);
        expect(r.dealerHand.cards.length).toBe(2);
    });

    it("ends the hand by itself at 21", () => {
        const r = round("Ten", "Six", "Five", "Six", "Ten");
        r.hit();
        expect(r.roundState).toBe(RoundState.FINISHED);
        expect(r.playerHands[0].outcome).toBe(HandOutcome.PLAYER_WIN);
    });

    it("does not let the dealer draw after a bust", () => {
        const r = round("Ten", "Six", "Six", "King");
        r.hit();
        expect(r.roundState).toBe(RoundState.FINISHED);
        expect(r.playerHands[0].outcome).toBe(HandOutcome.PLAYER_BUST);
        expect(r.dealerHand.cards.length).toBe(1);
    });

    it("refuses actions once the round is over", () => {
        const r = round("Ten", "Six", "Seven", "Ten");
        r.stand();
        expect(() => r.hit()).toThrow();
        expect(() => r.stand()).toThrow();
    });
});

describe("split", () => {
    it("splits a pair into two hands with one new card each", () => {
        const r = round("Eight", "Six", "Eight", "Three", "Four");
        r.split();
        expect(r.playerHands.map(ranksOf)).toEqual([["Eight", "Three"], ["Eight", "Four"]]);
        expect(r.playerHands.map(hand => hand.bet)).toEqual([10, 10]);
        expect(r.activeHandIndex).toBe(0);
    });

    it("refuses a split of two different ranks", () => {
        const r = round("Ten", "Six", "King", "Two", "Two");
        expect(() => r.split()).toThrow();
    });

    it("plays the hands one after the other and lets the dealer play once", () => {
        const r = round("Eight", "Six", "Eight", "Three", "Four", "Ten");
        r.split();
        r.stand();
        expect(r.activeHandIndex).toBe(1);
        expect(r.roundState).toBe(RoundState.PLAYER_ROUND);
        r.stand();
        expect(r.roundState).toBe(RoundState.FINISHED);
        expect(r.dealerHand.cards.length).toBe(2);
        expect(r.activeHandIndex).toBe(1);
    });

    it("pays two blackjacks when two Aces both draw a ten", () => {
        const r = round("Ace", "Six", "Ace", "Ten", "King", "Ten");
        r.split();
        expect(r.roundState).toBe(RoundState.FINISHED);
        expect(r.playerHands.map(hand => hand.outcome)).toEqual([HandOutcome.PLAYER_BLACKJACK, HandOutcome.PLAYER_BLACKJACK]);
        expect(r.dealerHand.cards.length).toBe(2);
    });

    it("skips a first hand that is already a blackjack", () => {
        const r = round("Ace", "Six", "Ace", "Ten", "Four");
        r.split();
        expect(r.roundState).toBe(RoundState.PLAYER_ROUND);
        expect(r.activeHandIndex).toBe(1);
        expect(r.playerHands[0].isDone).toBe(true);
    });

    it("skips a second hand that is a blackjack", () => {
        const r = round("Ace", "Six", "Ace", "Four", "Ten", "Ten");
        r.split();
        expect(r.activeHandIndex).toBe(0);
        r.stand();
        expect(r.roundState).toBe(RoundState.FINISHED);
        expect(r.playerHands.map(hand => hand.outcome)).toEqual([HandOutcome.DEALER_WIN, HandOutcome.PLAYER_BLACKJACK]);
    });

    it("inserts a re-split hand right after the active one", () => {
        const r = round("Eight", "Six", "Eight", "Eight", "Three", "Five", "Two");
        r.split();
        r.split();
        expect(r.playerHands.map(ranksOf)).toEqual([
            ["Eight", "Five"],
            ["Eight", "Two"],
            ["Eight", "Three"],
        ]);
        expect(r.activeHandIndex).toBe(0);
    });

    it("stops at four hands", () => {
        const r = round("Eight", "Six", "Eight", "Eight", "Three", "Eight", "Three", "Eight", "Three");
        r.split();
        r.split();
        r.split();
        expect(r.playerHands.length).toBe(4);
        expect(() => r.split()).toThrow();
        expect(r.playerHands.length).toBe(4);
    });

    it("lets a split hand double", () => {
        const r = round("Five", "Six", "Five", "Six", "Seven", "Ten");
        r.split();
        r.double();
        expect(r.playerHands.map(hand => hand.bet)).toEqual([20, 10]);
        expect(r.playerHands[0].isDone).toBe(true);
        expect(r.activeHandIndex).toBe(1);
    });

    it("lets the second hand surrender while the dealer still plays", () => {
        const r = round("Eight", "Six", "Eight", "Three", "Four", "Ten");
        r.split();
        r.stand();
        r.surrender();
        expect(r.roundState).toBe(RoundState.FINISHED);
        expect(r.playerHands.map(hand => hand.outcome)).toEqual([HandOutcome.DEALER_WIN, HandOutcome.SURRENDERED]);
        expect(r.dealerHand.cards.length).toBe(2);
    });

    it("does not let the dealer draw when every split hand busts", () => {
        const r = round("Ten", "Six", "Ten", "Five", "Five", "Ten", "Ten");
        r.split();
        r.hit();
        r.hit();
        expect(r.roundState).toBe(RoundState.FINISHED);
        expect(r.playerHands.map(hand => hand.outcome)).toEqual([HandOutcome.PLAYER_BUST, HandOutcome.PLAYER_BUST]);
        expect(r.dealerHand.cards.length).toBe(1);
    });

    it("pushes two split blackjacks against a dealer blackjack", () => {
        const r = round("Ace", "Ace", "Ace", "Ten", "King", "King");
        r.split();
        expect(r.roundState).toBe(RoundState.FINISHED);
        expect(r.playerHands.map(hand => hand.outcome)).toEqual([HandOutcome.PUSH_BLACKJACK, HandOutcome.PUSH_BLACKJACK]);
        expect(r.dealerHand.state).toBe(HandState.BLACKJACK);
    });
});
