const ranks: {[key: string]: number} = {"Ace": 11, "Two": 2, "Three": 3, "Four": 4, "Five": 5, "Six": 6, "Seven": 7, "Eight": 8, "Nine": 9, "Ten": 10, "Jack": 10, "Queen": 10, "King": 10}
const suits: string[] = ["Heart", "Spade", "Diamond", "Club"];

export enum HandState {
    BUSTED = "busted",
    BLACKJACK = "blackjack",
    NORMAL = "normal"
}

export enum HandOutcome {
    PLAYER_BUST = "player_bust",
    PLAYER_BLACKJACK = "player_blackjack",
    DEALER_BUST = "dealer_bust",
    DEALER_BLACKJACK = "dealer_blackjack",
    PUSH_BLACKJACK = "push_blackjack",
    PUSH = "push",
    PLAYER_WIN = "player_win",
    DEALER_WIN = "dealer_win",
    SURRENDERED = "surrendered",
    NOT_DECIDED = "not_decided"
}

export enum RoundState {
    PLAYER_ROUND = "player_turn",
    FINISHED = "finished"
}

export class Card {
    rank: string;
    suit: string;

    constructor(rank: string, suit: string) {
        this.rank = rank;
        this.suit = suit;
    }
}

export class Hand {
    cards: Card[];
    state: HandState;
    bet: number;
    outcome: HandOutcome;
    isDone: boolean;
    isSurrendered: boolean;

    constructor(bet: number) {
        this.cards = [];
        this.state = HandState.NORMAL;
        this.bet = bet;
        this.outcome = HandOutcome.NOT_DECIDED;
        this.isDone = false;
        this.isSurrendered = false;
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

export class BlackJackRound {
    deck: Card[];
    playerHands: Hand[];
    dealerHand: Hand;
    roundState: RoundState;
    dealerHitLimit: number;
    dealerHitOnSoft: boolean;
    activeHandIndex: number;
    insuranceAmount: number;

    constructor(bet: number, dealerHitLimit: number, hitOnSoft: boolean) {
        this.deck = shuffleDeck(createDeck());
        this.playerHands = [new Hand(bet)];
        this.dealerHand = new Hand(0);
        this.activeHandIndex = 0;
        this.playerHands[0].drawCard(this.deck);
        this.dealerHand.drawCard(this.deck);
        this.playerHands[0].drawCard(this.deck);
        this.roundState = RoundState.PLAYER_ROUND;
        this.dealerHitLimit = dealerHitLimit;
        this.dealerHitOnSoft = hitOnSoft;
        this.playerHands[0].decideHandState();
        this.insuranceAmount = 0;
        if (this.playerHands[0].state == HandState.BLACKJACK) {
            this.stand();
        }
    }

    public hit() {
        if (this.roundState != RoundState.PLAYER_ROUND) {
            throw Error("BlackJackRound.hit(): it is not player's turn");
        }
        this.playerHands[this.activeHandIndex].drawCard(this.deck);
        this.playerHands[this.activeHandIndex].decideHandState();
        let [total, _] = computeHand(this.playerHands[this.activeHandIndex].cards);
        if (this.playerHands[this.activeHandIndex].state == HandState.BUSTED) {
            this.endActiveHand();
        } else if (total == 21) {
            this.stand();
        }
    }

    public stand() {
        if (this.roundState != RoundState.PLAYER_ROUND) {
            throw Error("BlackJackRound.stand(): it is not player's turn");
        }
        this.endActiveHand();
    }

    public surrender() {
        if (this.roundState != RoundState.PLAYER_ROUND) {
            throw Error("BlackJackRound.surrender(): it is not player's turn");
        }
        this.playerHands[this.activeHandIndex].isSurrendered = true;
        this.endActiveHand(); 
    }

    public double() {
        if (this.roundState != RoundState.PLAYER_ROUND) {
            throw Error("BlackJackRound.double(): it is not player's turn");
        }
        if (this.playerHands[this.activeHandIndex].cards.length > 2) {
            throw Error("BlackjackRound.double(): hand has more than 2 cards");
        }
        this.playerHands[this.activeHandIndex].bet *= 2;
        this.playerHands[this.activeHandIndex].drawCard(this.deck);
        this.playerHands[this.activeHandIndex].decideHandState();
        this.endActiveHand();
    }

    public insurance(bet: number) {
        if (this.roundState != RoundState.PLAYER_ROUND) {
            throw Error("BlackJackRound.insurance(): it is not player's turn");
        }
        if (this.playerHands[this.activeHandIndex].cards.length > 2) {
            throw Error("BlackjackRound.insurance(): hand has more than 2 cards");
        }
        if (this.playerHands.length > 1) {
            throw Error("BlackJackRound.insurance(): there is more than one hand");
        }
        if (this.playerHands[this.activeHandIndex].isSurrendered) {
            throw Error("BlackjackRound.insurance(): hand has been surrendered");
        }
        if (this.playerHands[this.activeHandIndex].isDone) {
            throw Error("BlackjackRound.insurance(): hand is done");
        }
        if (this.dealerHand.cards[0].rank != "Ace") {
            throw Error("BlackjackRound.insurance(): dealer hand first card is not an Ace");
        }
        if (this.insuranceAmount > 0) {
            throw Error("BlackjackRound.insurance(): insurance has already been taken");
        }

        this.insuranceAmount = bet;
    }

    public split() {
        if (this.roundState != RoundState.PLAYER_ROUND) {
            throw Error("BlackjackRound.split(): it is not player's turn");
        }
        if (this.playerHands[this.activeHandIndex].cards.length > 2) {
            throw Error("BlackjackRound.split(): your hand has more than 2 cards");
        }
        if (this.playerHands[this.activeHandIndex].cards[0].rank != this.playerHands[this.activeHandIndex].cards[1].rank) {
            throw Error("BlackjackRound.split(): your cards do not have the same rank");
        }
        if (this.playerHands.length >= 4) {
            throw Error("BlackjackRound.split(): there is already 4 hands");
        }
        if (this.playerHands[this.activeHandIndex].isDone ) {
            throw Error("BlackjackRound.split(): your hand is done");
        }
        if (this.playerHands[this.activeHandIndex].isSurrendered) {
            throw Error("BlackJackRound.split(): your hand is surrendered");
        }

        let newHand: Hand = new Hand(this.playerHands[this.activeHandIndex].bet);

        if (this.playerHands[this.activeHandIndex].cards.length > 0) {
            let secondCard: Card = this.playerHands[this.activeHandIndex].cards.pop() as Card;
            newHand.cards.push(secondCard);

            this.playerHands.splice(this.activeHandIndex+1, 0, newHand);

            this.playerHands[this.activeHandIndex].drawCard(this.deck);
            this.playerHands[this.activeHandIndex].decideHandState();
            this.playerHands[this.activeHandIndex+1].drawCard(this.deck);
            this.playerHands[this.activeHandIndex+1].decideHandState();

            if (this.playerHands[this.activeHandIndex].state == HandState.BLACKJACK || computeHand(this.playerHands[this.activeHandIndex].cards)[0] == 21) {
                this.stand();
            }

        }
    }

    private endActiveHand() {
        this.playerHands[this.activeHandIndex].isDone = true;
        this.activeHandIndex += 1;
        while (this.activeHandIndex < this.playerHands.length && (this.playerHands[this.activeHandIndex].state == HandState.BLACKJACK || computeHand(this.playerHands[this.activeHandIndex].cards)[0] == 21)) {
            this.playerHands[this.activeHandIndex].isDone = true;
            this.activeHandIndex += 1;
        }
        if (this.activeHandIndex >= this.playerHands.length) {
            if (this.playerHands.every((hand) => (hand.state == HandState.BUSTED || hand.isSurrendered) && this.insuranceAmount == 0 )) {
                this.activeHandIndex = this.playerHands.length - 1;
                this.finish();
            } else {
                dealerTurn(this.deck, this.dealerHand, this.dealerHitLimit, this.dealerHitOnSoft);
                this.activeHandIndex = this.playerHands.length - 1;
                this.finish();
            }
        }
    }

    private finish() {
        this.playerHands.forEach(hand => {
            if (hand.isSurrendered) {
                hand.outcome = HandOutcome.SURRENDERED;
            } else {
                hand.outcome = checkWinner(hand, this.dealerHand);
            }
        });
        this.roundState = RoundState.FINISHED;
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

export function checkWinner(playerHand: Hand, dealerHand: Hand): HandOutcome {
    playerHand.decideHandState();
    dealerHand.decideHandState();

    const playerHandState = playerHand.state;
    const dealerHandState = dealerHand.state;

    if (playerHandState == HandState.BUSTED) {
        return HandOutcome.PLAYER_BUST;
    }

    if (dealerHandState == HandState.BUSTED) {
        if (playerHandState == HandState.BLACKJACK) {
            return HandOutcome.PLAYER_BLACKJACK;
        }
        return HandOutcome.DEALER_BUST;
    }

    if (dealerHandState == HandState.BLACKJACK && playerHandState == HandState.BLACKJACK) {
        return HandOutcome.PUSH_BLACKJACK;
    }

    if (playerHandState == HandState.BLACKJACK) {
        return HandOutcome.PLAYER_BLACKJACK;
    }

    if (dealerHandState == HandState.BLACKJACK) {
        return HandOutcome.DEALER_BLACKJACK;
    }

    const [playerTotal] = computeHand(playerHand.cards);
    const [dealerTotal] = computeHand(dealerHand.cards);

    if (dealerTotal == playerTotal) {
        return HandOutcome.PUSH;
    }

    if (playerTotal > dealerTotal) {
        return HandOutcome.PLAYER_WIN;
    }
    return HandOutcome.DEALER_WIN;
}