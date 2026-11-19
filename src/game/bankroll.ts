import { Outcome } from "./blackjack"

export function determineBetLimit(startingBankroll: number, betLimitLevel: number): number[] {
    let min: number = Math.max(1, Math.floor(startingBankroll * 0.1));
    let max: number = 0;
    switch (betLimitLevel) {
        case 0:
            max = Math.max(1, Math.floor(startingBankroll * 0.5));
            break;
        case 1:
            max = startingBankroll;
            break;
        case 2:

            max = Math.max(1, Math.floor(startingBankroll * 1.25));
            break;
        case 3:
            max = Math.max(1, Math.floor(startingBankroll * 1.5));
            break;
    }

    return [min, max];
}

export function determinePayout(outcome: Outcome, bet: number): number {
    switch (outcome) {
        case Outcome.PLAYER_BUST:
        case Outcome.DEALER_BLACKJACK:
        case Outcome.DEALER_WIN:
            return 0;
        case Outcome.PUSH:
        case Outcome.PUSH_BLACKJACK:
            return bet;
        case Outcome.PLAYER_WIN:
        case Outcome.DEALER_BUST:
            return bet * 2;
        case Outcome.PLAYER_BLACKJACK:
            return Math.floor(bet + (bet * 1.5));
        default:
            throw Error("determinePayout(): outcome is invalid");
    }
}