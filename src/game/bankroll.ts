import { Outcome } from "./blackjack"

export function determineBetLimit(startingBankroll: number, betLimitLevel: number): object {
    let min: number = startingBankroll * 0.1;
    let max: number = 0;
    switch (betLimitLevel) {
        case 0:
            max = startingBankroll * 0.5;
            break;
        case 1:
            max = startingBankroll;
            break;
        case 2:
            max = startingBankroll * 1.25;
            break;
        case 3:
            max = startingBankroll * 1.50;
            break;
    }

    return {min, max};
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
            return bet + (bet * 1.5);
        default:
            return bet;
    }
}