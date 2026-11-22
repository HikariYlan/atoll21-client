import { describe, expect, it } from "vitest";
import { HandOutcome, RoundState } from "../game/blackjack";
import { GameSession, GameSessionPhase } from "../game/casino";
import { determinePayout } from "../game/bankroll";
import { deckOf, sessionWith } from "./testHelpers";

describe("betting", () => {
    it("takes the bet out of the bankroll", () => {
        const session = new GameSession(100);
        session.placingBet(10, deckOf("Ten", "Six", "Seven"));
        expect(session.currentBankroll).toBe(90);
        expect(session.gameSessionPhase).toBe(GameSessionPhase.PLAYING);
    });

    it("refuses a bet outside the limits, a fraction, or more than the bankroll", () => {
        const session = new GameSession(100);
        expect(() => session.placingBet(9)).toThrow();
        expect(() => session.placingBet(31)).toThrow();
        expect(() => session.placingBet(10.5)).toThrow();
        session.currentBankroll = 5;
        expect(() => session.placingBet(10)).toThrow();
        expect(session.currentBankroll).toBe(5);
    });

    it("widens the bet range with the bet limit level", () => {
        const session = new GameSession(100);
        expect(session.betRange()).toEqual([10, 30]);
        session.unlocks.betLimitLevel = 3;
        expect(session.betRange()).toEqual([10, 100]);
        session.currentBankroll = 40;
        expect(session.betRange()).toEqual([10, 40]);
    });

    it("goes broke when the bankroll is under the minimum bet", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Seven", "Ten"), { bet: 30, betLimitLevel: 0 });
        session.currentBankroll = 5;
        session.stand();
        session.currentBankroll = 5;
        session.nextRound();
        expect(session.gameSessionPhase).toBe(GameSessionPhase.BROKE);
    });
});

describe("results", () => {
    it("pays a win", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Nine", "Ten"));
        session.stand();
        expect(session.currentBankroll).toBe(110);
        expect(session.lastNet).toBe(10);
        expect(session.gameSessionPhase).toBe(GameSessionPhase.FINISHED);
    });

    it("pays a blackjack 3 to 2", () => {
        const session = sessionWith(deckOf("Ace", "Six", "King", "Ten"));
        expect(session.gameSessionPhase).toBe(GameSessionPhase.FINISHED);
        expect(session.currentBankroll).toBe(115);
        expect(session.lastNet).toBe(15);
    });

    it("gives the bet back on a push", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Seven", "Four", "Seven"), { dealerLevel: 3 });
        session.stand();
        expect(session.currentBankroll).toBe(100);
        expect(session.lastNet).toBe(0);
    });

    it("loses the bet", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Seven", "Ten", "Two"), { dealerLevel: 3 });
        session.stand();
        expect(session.lastNet).toBe(-10);
        expect(session.currentBankroll).toBe(90);
    });

    it("starts the next round from the finished one only", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Seven", "Ten"));
        session.nextRound();
        expect(session.gameSessionPhase).toBe(GameSessionPhase.PLAYING);
        session.stand();
        session.nextRound();
        expect(session.gameSessionPhase).toBe(GameSessionPhase.BETTING);
        expect(session.round).toBeNull();
    });
});

describe("dealer levels", () => {
    const cases: [number, string[], number][] = [
        [0, ["Four"], 2],
        [1, ["Four", "Two"], 3],
        [2, ["Four", "Two", "Two"], 4],
        [3, ["Four", "Two", "Two", "Three"], 5],
    ];

    for (const [level, draws, cards] of cases) {
        it(`level ${level} stops after ${cards} cards`, () => {
            const session = sessionWith(deckOf("Ten", "Six", "Seven", ...draws, "Ten"), { dealerLevel: level });
            session.stand();
            expect(session.round!.dealerHand.cards.length).toBe(cards);
        });
    }

    it("stands on a soft 17 at level 3 and hits it at level 4", () => {
        const stands = sessionWith(deckOf("Ten", "Ace", "Seven", "Six", "Four"), { dealerLevel: 3 });
        stands.stand();
        expect(stands.round!.dealerHand.cards.length).toBe(2);

        const hits = sessionWith(deckOf("Ten", "Ace", "Seven", "Six", "Four"), { dealerLevel: 4 });
        hits.stand();
        expect(hits.round!.dealerHand.cards.length).toBe(3);
    });

    it("keeps the level a round started with", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Seven", "Four", "Two", "Ten"), { dealerLevel: 0 });
        session.unlocks.dealerLevel = 3;
        session.stand();
        expect(session.round!.dealerHand.cards.length).toBe(2);
    });
});

describe("surrender", () => {
    it("does nothing while it is locked", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Seven", "Ten"), { surrender: false });
        session.surrender();
        expect(session.gameSessionPhase).toBe(GameSessionPhase.PLAYING);
    });

    it("gives back half the bet and the dealer does not draw", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Six", "Ten"));
        session.surrender();
        expect(session.gameSessionPhase).toBe(GameSessionPhase.FINISHED);
        expect(session.currentBankroll).toBe(95);
        expect(session.lastNet).toBe(-5);
        expect(session.round!.playerHands[0].outcome).toBe(HandOutcome.SURRENDERED);
        expect(session.round!.dealerHand.cards.length).toBe(1);
    });

    it("rounds an odd bet down in the casino's favor", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Six", "Ten"), { bet: 11 });
        session.surrender();
        expect(session.lastNet).toBe(-6);
    });

    it("works after a hit", () => {
        const session = sessionWith(deckOf("Two", "Six", "Three", "Two"));
        session.hit();
        session.surrender();
        expect(session.round!.playerHands[0].outcome).toBe(HandOutcome.SURRENDERED);
    });
});

describe("double", () => {
    it("takes a second stake and pays on the doubled bet", () => {
        const session = sessionWith(deckOf("Five", "Six", "Six", "Ten", "Ten"));
        session.double();
        expect(session.round!.playerHands[0].bet).toBe(20);
        expect(session.currentBankroll).toBe(120);
        expect(session.lastNet).toBe(20);
        expect(session.currentBet).toBe(20);
    });

    it("loses the doubled bet on a bust and the dealer does not draw", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Six", "Ten"));
        session.double();
        expect(session.currentBankroll).toBe(80);
        expect(session.lastNet).toBe(-20);
        expect(session.round!.dealerHand.cards.length).toBe(1);
    });

    it("is refused after a hit without touching the bankroll", () => {
        const session = sessionWith(deckOf("Two", "Six", "Three", "Two", "Ten"));
        session.hit();
        const before = session.currentBankroll;
        session.double();
        expect(session.currentBankroll).toBe(before);
        expect(session.gameSessionPhase).toBe(GameSessionPhase.PLAYING);
    });

    it("is refused when the bankroll cannot cover the second stake", () => {
        const session = sessionWith(deckOf("Five", "Six", "Six", "Ten", "Ten"), { bankroll: 5 });
        session.double();
        expect(session.currentBankroll).toBe(5);
        expect(session.gameSessionPhase).toBe(GameSessionPhase.PLAYING);
    });
});

describe("insurance", () => {
    it("breaks even on a dealer blackjack", () => {
        const session = sessionWith(deckOf("Ten", "Ace", "Seven", "King"));
        session.insurance();
        expect(session.currentBankroll).toBe(85);
        session.stand();
        expect(session.currentBankroll).toBe(100);
        expect(session.lastNet).toBe(0);
    });

    it("is lost when the dealer has no blackjack", () => {
        const session = sessionWith(deckOf("Ten", "Ace", "Seven", "Five"));
        session.insurance();
        session.stand();
        expect(session.currentBankroll).toBe(105);
        expect(session.lastNet).toBe(5);
    });

    it("pays on a dealer blackjack after a surrender", () => {
        const session = sessionWith(deckOf("Ten", "Ace", "Seven", "King"));
        session.insurance();
        session.surrender();
        expect(session.currentBankroll).toBe(105);
        expect(session.lastNet).toBe(5);
    });

    it("can only be taken once", () => {
        const session = sessionWith(deckOf("Ten", "Ace", "Seven", "King"));
        session.insurance();
        session.insurance();
        expect(session.currentBankroll).toBe(85);
        session.stand();
        expect(session.currentBankroll).toBe(100);
    });

    it("still lets the dealer reveal a blackjack after a bust", () => {
        const session = sessionWith(deckOf("Ten", "Ace", "Six", "Ten", "King"));
        session.insurance();
        session.hit();
        expect(session.gameSessionPhase).toBe(GameSessionPhase.FINISHED);
        expect(session.round!.dealerHand.cards.length).toBe(2);
        expect(session.currentBankroll).toBe(100);
        expect(session.lastNet).toBe(0);
    });

    it("floors the insurance on an odd bet", () => {
        const session = sessionWith(deckOf("Ten", "Ace", "Seven", "King"), { bet: 11 });
        session.insurance();
        expect(session.round!.insuranceAmount).toBe(5);
        session.stand();
        expect(session.currentBankroll).toBe(99);
        expect(session.lastNet).toBe(-1);
    });

    it("is refused after a hit", () => {
        const session = sessionWith(deckOf("Two", "Ace", "Three", "Two"));
        session.hit();
        const before = session.currentBankroll;
        session.insurance();
        expect(session.currentBankroll).toBe(before);
        expect(session.round!.insuranceAmount).toBe(0);
    });

    it("is not offered when the dealer shows no Ace", () => {
        const session = sessionWith(deckOf("Ten", "Six", "Seven", "Ten"));
        expect(session.canInsurance()).toBe(false);
    });
});

describe("split and the bankroll", () => {
    it("takes one more bet per split", () => {
        const session = sessionWith(deckOf("Eight", "Six", "Eight", "Three", "Four", "Ten"));
        session.split();
        expect(session.currentBankroll).toBe(80);
        expect(session.round!.playerHands.length).toBe(2);
    });

    it("takes three bets for four hands and refuses a fifth", () => {
        const session = sessionWith(deckOf("Eight", "Six", "Eight", "Eight", "Three", "Eight", "Three", "Eight", "Three", "Two", "Two", "Two", "Two", "Ten"));
        session.split();
        session.split();
        session.split();
        expect(session.currentBankroll).toBe(60);
        session.split();
        expect(session.currentBankroll).toBe(60);
        expect(session.round!.playerHands.length).toBe(4);
    });

    it("settles every hand and counts every stake", () => {
        const session = sessionWith(deckOf("Eight", "Six", "Eight", "Eight", "Three", "Eight", "Three", "Eight", "Three", "Two", "Two", "Two", "Two", "Ten"));
        session.split();
        session.split();
        session.split();
        for (let i = 0; i < 10 && session.gameSessionPhase == GameSessionPhase.PLAYING; i++) {
            session.stand();
        }
        expect(session.round!.roundState).toBe(RoundState.FINISHED);
        const payout = session.round!.playerHands.reduce((sum, hand) => sum + determinePayout(hand.outcome, hand.bet), 0);
        expect(session.currentBankroll).toBe(60 + payout);
        expect(session.currentBet).toBe(40);
        expect(session.lastNet).toBe(payout - 40);
    });

    it("lets a split hand double and counts the stakes", () => {
        const session = sessionWith(deckOf("Five", "Six", "Five", "Six", "Seven", "Ten", "Two", "Ten"));
        session.split();
        session.double();
        session.stand();
        const hands = session.round!.playerHands;
        const payout = hands.reduce((sum, hand) => sum + determinePayout(hand.outcome, hand.bet), 0);
        expect(hands.map(hand => hand.bet)).toEqual([20, 10]);
        expect(session.currentBankroll).toBe(70 + payout);
        expect(session.lastNet).toBe(payout - 30);
    });

    it("pays two split blackjacks", () => {
        const session = sessionWith(deckOf("Ace", "Six", "Ace", "Ten", "King", "Ten"));
        session.split();
        expect(session.gameSessionPhase).toBe(GameSessionPhase.FINISHED);
        expect(session.currentBankroll).toBe(130);
        expect(session.lastNet).toBe(30);
    });

    it("is refused for two different ranks or a bankroll that is too low", () => {
        const different = sessionWith(deckOf("Ten", "Six", "Nine", "Ten"));
        different.split();
        expect(different.round!.playerHands.length).toBe(1);
        expect(different.currentBankroll).toBe(90);

        const poor = sessionWith(deckOf("Eight", "Six", "Eight", "Three", "Four"), { bankroll: 5 });
        poor.split();
        expect(poor.round!.playerHands.length).toBe(1);
        expect(poor.currentBankroll).toBe(5);
    });
});

describe("what each button can do", () => {
    function flags(session: GameSession): string {
        return [session.canSurrender(), session.canDouble(), session.canInsurance(), session.canSplit()]
            .map(flag => flag ? "Y" : "-")
            .join("");
    }

    it("pair of 8s against a 6", () => {
        expect(flags(sessionWith(deckOf("Eight", "Six", "Eight", "Two")))).toBe("YY-Y");
    });

    it("pair of Aces against an Ace", () => {
        expect(flags(sessionWith(deckOf("Ace", "Ace", "Ace", "Two")))).toBe("YYYY");
    });

    it("10 and 7 against an Ace", () => {
        expect(flags(sessionWith(deckOf("Ten", "Ace", "Seven", "Two")))).toBe("YYY-");
    });

    it("three cards leave only surrender", () => {
        const session = sessionWith(deckOf("Two", "Ace", "Three", "Two", "Two"));
        session.hit();
        expect(flags(session)).toBe("Y---");
    });

    it("a bet of 1 cannot be insured", () => {
        expect(flags(sessionWith(deckOf("Ten", "Ace", "Seven", "Two"), { start: 10, bet: 1 }))).toBe("YY--");
    });

    it("an empty bankroll leaves only surrender", () => {
        expect(flags(sessionWith(deckOf("Eight", "Ace", "Eight", "Two"), { bankroll: 0 }))).toBe("Y---");
    });

    it("insurance only needs half the bet", () => {
        expect(flags(sessionWith(deckOf("Ten", "Ace", "Seven", "Two"), { bankroll: 5 }))).toBe("Y-Y-");
    });

    it("insurance already taken", () => {
        const session = sessionWith(deckOf("Ten", "Ace", "Seven", "Two"));
        session.insurance();
        expect(flags(session)).toBe("YY--");
    });

    it("everything locked", () => {
        const session = sessionWith(deckOf("Eight", "Ace", "Eight", "Two"), { double: false, split: false, insurance: false, surrender: false });
        expect(flags(session)).toBe("----");
    });

    it("nothing during betting or after the round", () => {
        expect(flags(new GameSession(100))).toBe("----");
        const session = sessionWith(deckOf("Ten", "Six", "Seven", "Ten"));
        session.stand();
        expect(flags(session)).toBe("----");
    });
});
