import { describe, expect, it } from "vitest";
import { determineBetLimit, determineInsurancePayout, determinePayout } from "../game/bankroll";
import { HandOutcome } from "../game/blackjack";

describe("determineBetLimit", () => {
    const table: [number, number, number[]][] = [
        [10, 1, [3, 5, 8, 10]],
        [15, 1, [4, 7, 12, 15]],
        [100, 10, [30, 50, 80, 100]],
        [999, 99, [299, 499, 799, 999]],
    ];

    for (const [start, min, maxes] of table) {
        it(`start ${start}: min ${min}, max ${maxes.join(", ")}`, () => {
            maxes.forEach((max, level) => {
                expect(determineBetLimit(start, level)).toEqual([min, max]);
            });
        });
    }

    it("never goes below 1", () => {
        for (let level = 0; level < 4; level++) {
            const [min, max] = determineBetLimit(1, level);
            expect(min).toBeGreaterThanOrEqual(1);
            expect(max).toBeGreaterThanOrEqual(1);
        }
    });
});

describe("determinePayout", () => {
    it("pays nothing on a loss", () => {
        expect(determinePayout(HandOutcome.PLAYER_BUST, 10)).toBe(0);
        expect(determinePayout(HandOutcome.DEALER_WIN, 10)).toBe(0);
        expect(determinePayout(HandOutcome.DEALER_BLACKJACK, 10)).toBe(0);
    });

    it("gives the bet back on a push", () => {
        expect(determinePayout(HandOutcome.PUSH, 10)).toBe(10);
        expect(determinePayout(HandOutcome.PUSH_BLACKJACK, 10)).toBe(10);
    });

    it("pays double on a win", () => {
        expect(determinePayout(HandOutcome.PLAYER_WIN, 10)).toBe(20);
        expect(determinePayout(HandOutcome.DEALER_BUST, 10)).toBe(20);
    });

    it("pays 3 to 2 on a blackjack and rounds down", () => {
        expect(determinePayout(HandOutcome.PLAYER_BLACKJACK, 10)).toBe(25);
        expect(determinePayout(HandOutcome.PLAYER_BLACKJACK, 11)).toBe(27);
    });

    it("gives back half the bet on a surrender, rounded down", () => {
        expect(determinePayout(HandOutcome.SURRENDERED, 10)).toBe(5);
        expect(determinePayout(HandOutcome.SURRENDERED, 11)).toBe(5);
    });

    it("refuses an undecided hand", () => {
        expect(() => determinePayout(HandOutcome.NOT_DECIDED, 10)).toThrow();
    });
});

describe("determineInsurancePayout", () => {
    it("pays the stake plus double on a dealer blackjack", () => {
        expect(determineInsurancePayout(5, true)).toBe(15);
    });

    it("pays nothing otherwise", () => {
        expect(determineInsurancePayout(5, false)).toBe(0);
    });
});
