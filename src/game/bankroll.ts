import { Outcome } from "./blackjack"

export function determineBetLimit(startingBankroll: number, betLimitLevel: number): number[] {
    let min: number = startingBankroll * 0.1;
    let max: number = 0;
    switch (betLimitLevel) {
        case 0:
            max = Math.floor(startingBankroll * 0.5) >= 1 ? Math.floor(startingBankroll * 0.5) : 1;
            break;
        case 1:
            max = startingBankroll;
            break;
        case 2:

            max = Math.floor(startingBankroll * 1.25) >= 1 ? Math.floor(startingBankroll * 1.25) : 1;
            break;
        case 3:
            max = Math.floor(startingBankroll * 1.50) >= 1 ? Math.floor(startingBankroll * 1.50) : 1;
            break;
    }

    return [min, max];
}

export function determinePayout(outcome: Outcome, bet: number): number {
    switch (outcome) {
        case Outcome.PLAYER_BUST, Outcome.DEALER_BLACKJACK, Outcome.DEALER_WIN:
            return 0;
        case Outcome.PUSH, Outcome.PUSH_BLACKJACK:
            return bet;
        case Outcome.PLAYER_WIN, Outcome.DEALER_BUST:
            return bet * 2;
        case Outcome.PLAYER_BLACKJACK:
            return Math.floor(bet + (bet * 1.5));
        default:
            return bet;
    }
}