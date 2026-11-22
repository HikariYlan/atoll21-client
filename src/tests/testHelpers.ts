import { Card, Hand } from "../game/blackjack";
import { GameSession } from "../game/casino";

export function deckOf(...ranks: string[]): Card[] {
    return ranks.map(rank => new Card(rank, "Heart")).reverse();
}

export function handOf(...ranks: string[]): Hand {
    const hand = new Hand(10);
    hand.cards = ranks.map(rank => new Card(rank, "Heart"));
    return hand;
}

export function ranksOf(hand: Hand): string[] {
    return hand.cards.map(card => card.rank);
}

export type SessionOptions = {
    start?: number;
    bet?: number;
    bankroll?: number;
    dealerLevel?: number;
    betLimitLevel?: number;
    double?: boolean;
    split?: boolean;
    insurance?: boolean;
    surrender?: boolean;
}

export function sessionWith(deck: Card[], options: SessionOptions = {}): GameSession {
    const session = new GameSession(options.start ?? 100);
    session.unlocks.double = options.double ?? true;
    session.unlocks.split = options.split ?? true;
    session.unlocks.insurance = options.insurance ?? true;
    session.unlocks.surrender = options.surrender ?? true;
    session.unlocks.dealerLevel = options.dealerLevel ?? 0;
    session.unlocks.betLimitLevel = options.betLimitLevel ?? 3;
    session.placingBet(options.bet ?? 10, deck);
    if (options.bankroll !== undefined) {
        session.currentBankroll = options.bankroll;
    }
    return session;
}
