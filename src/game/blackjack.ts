const ranks: {[key: string]: number} = {"Ace": 11, "Two": 2, "Three": 3, "Four": 4, "Five": 5, "Six": 6, "Seven": 7, "Eight": 8, "Nine": 9, "Ten": 10, "Jack": 10, "Queen": 10, "King": 10}
const suits: string[] = ["Heart", "Spade", "Diamond", "Club"];

export class Card {
    rank: string;
    suit: string;

    constructor(rank: string, suit: string) {
        this.rank = rank;
        this.suit = suit;
    }
}

export enum HandState {
    BUSTED = "busted",
    BLACKJACK = "blackjack",
    NORMAL = "normal"
}

export enum Outcome {
    PLAYER_BUST = "player_bust",
    PLAYER_BLACKJACK = "player_blackjack",
    DEALER_BUST = "dealer_bust",
    DEALER_BLACKJACK = "dealer_blackjack",
    PUSH_BLACKJACK = "push_blackjack",
    PUSH = "push",
    PLAYER_WIN = "player_win",
    DEALER_WIN = "dealer_win",
    NOT_DECIDED = "not_decided"
}

export class Hand {
    cards: Card[];
    state: HandState;

    constructor() {
        this.cards = [];
        this.state = HandState.NORMAL;
    }
     
    public decideHandState() {
        const [total, _] = computeHand(this.cards);
        if (total > 21) {
            this.state = HandState.BUSTED;
        } else if (this.cards.length == 2 && total == 21) {
            this.state = HandState.BLACKJACK;
        } else {
            this.state = HandState.NORMAL;
        }
    }

    public drawCard(deck: Card[]) {
        let card = drawCard(deck);
        this.cards.push(card);
    }
}

export function createDeck(): Card[] {
    let cards: Card[] = [];

    suits.forEach(suit => {
        for (let rank in ranks) {
            cards.push(new Card(rank, suit));
        }
    });

    return cards;
}

export function shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function drawCard(deck: Card[]): Card {
    if (deck.length > 0) {
        let card: Card|undefined = deck.pop();
        if (card != undefined) {
            return card;
        }
    }

    throw Error("deck is empty");
}

export function computeHand(hand: Card[]): [number, boolean] {
    let total: number = 0;
    let softAces: number = 0;
    hand.forEach(card => {
        if (card.rank == "Ace") {
            softAces += 1;
        }
        total += ranks[card.rank];
    })
    while (total > 21 && softAces > 0) {
        total -= 10;
        softAces -= 1;
    }

    return [total, softAces > 0];
}

export function dealerTurn(deck:Card[], hand: Hand, hitLimit: number, hitOnSoft: boolean): HandState {
    let [total, isSoft] = computeHand(hand.cards);
    while (hand.cards.length < 2 || total < hitLimit || (total == hitLimit && isSoft && hitOnSoft)) {
        hand.drawCard(deck);
        [total, isSoft] = computeHand(hand.cards);
    }

    hand.decideHandState();

    return hand.state;
}

export function checkWinner(playerHand: Hand, dealerHand: Hand): Outcome {
    playerHand.decideHandState();
    dealerHand.decideHandState();

    const playerHandState = playerHand.state;
    const dealerHandState = dealerHand.state;

    if (playerHandState == HandState.BUSTED) {
        return Outcome.PLAYER_BUST;
    }

    if (dealerHandState == HandState.BUSTED) {
        if (playerHandState == HandState.BLACKJACK) {
            return Outcome.PLAYER_BLACKJACK;
        }
        return Outcome.DEALER_BUST;
    }

    if (dealerHandState == HandState.BLACKJACK && playerHandState == HandState.BLACKJACK) {
        return Outcome.PUSH_BLACKJACK;
    }

    if (playerHandState == HandState.BLACKJACK) {
        return Outcome.PLAYER_BLACKJACK;
    }

    if (dealerHandState == HandState.BLACKJACK) {
        return Outcome.DEALER_BLACKJACK;
    }

    const [playerTotal] = computeHand(playerHand.cards);
    const [dealerTotal] = computeHand(dealerHand.cards);

    if (dealerTotal == playerTotal) {
        return Outcome.PUSH;
    }

    if (playerTotal > dealerTotal) {
        return Outcome.PLAYER_WIN;
    }
    return Outcome.DEALER_WIN;
}

export enum RoundState {
    PLAYER_ROUND = "player_turn",
    FINISHED = "finished"
}

export class BlackJackRound {
    deck: Card[];
    playerHand: Hand;
    dealerHand: Hand;
    roundState: RoundState;
    roundOutcome: Outcome = Outcome.NOT_DECIDED;
    dealerHitLimit: number = 0;
    dealerHitOnSoft: boolean = false;

    constructor() {
        this.deck = shuffleDeck(createDeck());
        this.playerHand = new Hand;
        this.dealerHand = new Hand;
        this.playerHand.drawCard(this.deck);
        this.playerHand.drawCard(this.deck);
        this.dealerHand.drawCard(this.deck);
        this.roundState = RoundState.PLAYER_ROUND;
        this.playerHand.decideHandState();
        if (this.playerHand.state == HandState.BLACKJACK) {
            this.stand();
        }
    }

    public hit() {
        if (this.roundState != RoundState.PLAYER_ROUND) {
            throw Error("BlackJackRound.hit(): it is not player's turn");
        }
        this.playerHand.drawCard(this.deck);
        this.playerHand.decideHandState();
        let [total, _] = computeHand(this.playerHand.cards);
        if (this.playerHand.state == HandState.BUSTED) {
            this.finish();
        } else if (total == 21) {
            this.stand();
        }
    }

    public stand() {
        if (this.roundState != RoundState.PLAYER_ROUND) {
            throw Error("BlackJackRound.stand(): it is not player's turn");
        }
        dealerTurn(this.deck, this.dealerHand, this.dealerHitLimit, this.dealerHitOnSoft);
        this.finish();
    }

    private finish() {
        this.roundOutcome = checkWinner(this.playerHand, this.dealerHand);
        this.roundState = RoundState.FINISHED;
    }
}