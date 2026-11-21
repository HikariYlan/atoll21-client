import { HandOutcome } from "./blackjack"

export function determineBetLimit(startingBankroll: number, betLimitLevel: number): number[] {
    let min: number = Math.max(1, Math.floor(startingBankroll * 0.1));
    let max: number = 0;
    switch (betLimitLevel) {
        case 0:
            max = Math.max(1, Math.floor(startingBankroll * 0.3));
            break;
        case 1:
            max = Math.max(1, Math.floor(startingBankroll * 0.5));
            break;
        case 2:
            max = Math.max(1, Math.floor(startingBankroll * 0.8));
            break;
        case 3:
            max = Math.max(1, Math.floor(startingBankroll * 1));
            break;
    }

    return [min, max];
}

export function determinePayout(outcome: HandOutcome, bet: number): number {
    switch (outcome) {
        case HandOutcome.PLAYER_BUST:
        case HandOutcome.DEALER_BLACKJACK:
        case HandOutcome.DEALER_WIN:
            return 0;
        case HandOutcome.PUSH:
        case HandOutcome.PUSH_BLACKJACK:
            return bet;
        case HandOutcome.PLAYER_WIN:
        case HandOutcome.DEALER_BUST:
            return bet * 2;
        case HandOutcome.PLAYER_BLACKJACK:
            return Math.floor(bet + (bet * 1.5));
        case HandOutcome.SURRENDERED:
            return Math.floor(bet / 2);
        default:
            throw Error("determinePayout(): outcome is invalid");
    }
}