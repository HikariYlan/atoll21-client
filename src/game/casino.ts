import { determineBetLimit, determineInsurancePayout, determinePayout } from "./bankroll";
import { BlackJackRound, HandState, RoundState } from "./blackjack";

const dealerHitLimits: number[] = [10, 12, 14, 17];

export type Unlocks = {
    double: boolean;
    split: boolean;
    insurance: boolean;
    surrender: boolean;
    dealerLevel: number;
    betLimitLevel: number;
}

export enum GameSessionPhase {
    BETTING = "betting",
    PLAYING = "playing",
    FINISHED = "finished",
    BROKE = "broke"
}

export class GameSession {
    startingBankroll: number;
    currentBankroll: number;
    currentBet: number = 0;
    unlocks: Unlocks;
    gameSessionPhase: GameSessionPhase;
    round: BlackJackRound | null = null;
    lastNet: number = 0;

    constructor (startingBankroll: number) {
        this.startingBankroll = this.currentBankroll = startingBankroll;
        this.unlocks = {
            double: false,
            insurance: false,
            surrender: false,
            split: false,
            dealerLevel: 0,
            betLimitLevel: 0
        };
        this.gameSessionPhase = GameSessionPhase.BETTING;
    }

    public betRange(): number[] {
        let [min, max] = determineBetLimit(this.startingBankroll, this.unlocks.betLimitLevel);
        return [min, Math.min(max, this.currentBankroll)];
    }

    public placingBet(amount: number): void {
        if (this.gameSessionPhase != GameSessionPhase.BETTING) return;
        let [min, max] = determineBetLimit(this.startingBankroll, this.unlocks.betLimitLevel);

        if (amount < min || amount > max || amount > this.currentBankroll || !Number.isInteger(amount)) {
            throw Error("GameSession.placingBet(): amount is invalid");
        }

        this.currentBankroll -= amount;
        this.currentBet = amount;

        let [dealerHitLimit, hitOnSoft] = this.determineDealerHitLimit(this.unlocks.dealerLevel);

        this.round = new BlackJackRound(amount, dealerHitLimit, hitOnSoft);
        this.gameSessionPhase = GameSessionPhase.PLAYING;
        this.settle();
    }

    private determineDealerHitLimit(dealerLevel: number): [number, boolean] {
        let hitOnSoft: boolean = false;

        if (dealerLevel == 4) {
            hitOnSoft = true;
            return [dealerHitLimits[dealerLevel - 1], hitOnSoft];
        }

        return [dealerHitLimits[dealerLevel], hitOnSoft];
    }

    public hit(): void {
        if (this.gameSessionPhase != GameSessionPhase.PLAYING) return;
        this.round!.hit();
        this.settle();
    }

    public stand(): void {
        if (this.gameSessionPhase != GameSessionPhase.PLAYING) return;
        this.round!.stand();
        this.settle();
    }

    public canSurrender(): boolean {
        if (this.gameSessionPhase != GameSessionPhase.PLAYING) return false;
        if (!this.unlocks.surrender) return false;
        return true;
    }

    public surrender(): void {
        if (!this.canSurrender()) return;
        this.round!.surrender();
        this.settle();
    }

    public canDouble(): boolean {
        if (this.gameSessionPhase != GameSessionPhase.PLAYING) return false;
        if (!this.unlocks.double) return false;
        if (this.currentBankroll < this.round!.activeHand().bet) return false;
        if (this.round!.activeHand().cards.length > 2) return false;
        return true;
    }

    public double(): void  {
        if (!this.canDouble()) return;
        this.currentBankroll -= this.round!.activeHand().bet;
        this.round!.double();
        this.settle();
    }

    public canInsurance(): boolean {
        if (this.gameSessionPhase != GameSessionPhase.PLAYING) return false;
        if (!this.unlocks.insurance) return false;
        if (this.currentBankroll < this.round!.activeHand().bet / 2) return false;
        if (this.round!.activeHand().cards.length > 2) return false;
        if (this.round!.playerHands.length > 1) return false;
        if (this.round!.dealerHand.cards[0].rank != "Ace") return false;
        if (this.round!.insuranceAmount > 0) return false;
        return true;
    }

    public insurance(): void {
        if (!this.canInsurance()) return;
        let insuranceAmount = Math.floor(this.round!.activeHand().bet / 2);
        this.currentBankroll -= insuranceAmount;
        this.round!.insurance(insuranceAmount);
    }

    public canSplit(): boolean {
        if (this.gameSessionPhase != GameSessionPhase.PLAYING) return false;
        if (!this.unlocks.split) return false;
        if (this.currentBankroll < this.round!.activeHand().bet) return false;
        if (this.round!.playerHands.length >= 4) return false;
        if (this.round!.activeHand().cards.length > 2) return false;
        if (this.round!.activeHand().cards[0].rank != this.round!.activeHand().cards[1].rank) return false;
        if (this.round!.activeHand().isDone) return false;
        if (this.round!.activeHand().isSurrendered) return false;
        return true;
    }

    public split(): void {
        if (!this.canSplit()) return;
        this.currentBankroll -= this.round!.activeHand().bet;
        this.round!.split();
        this.settle();
    }

    private settle(): void {
        if (this.gameSessionPhase != GameSessionPhase.PLAYING) return;
        if (this.round === null || this.round.roundState != RoundState.FINISHED) return;
        let payout: number = 0;
        let stake: number = 0;
        this.round.playerHands.forEach(hand => {
            payout += determinePayout(hand.outcome, hand.bet);
            stake += hand.bet;
        });
        let dealerHasBlackjack: boolean = this.round!.dealerHand.state == HandState.BLACKJACK;
        payout += determineInsurancePayout(this.round!.insuranceAmount, dealerHasBlackjack);
        stake += this.round!.insuranceAmount;
        this.currentBankroll += payout;
        this.currentBet = stake;
        this.gameSessionPhase = GameSessionPhase.FINISHED;
        
        this.lastNet = payout - this.currentBet;
    }

    public nextRound(): void {
        if (this.gameSessionPhase != GameSessionPhase.FINISHED) return;
        this.round = null;
        this.currentBet = this.lastNet = 0;
        this.gameSessionPhase = GameSessionPhase.BETTING;

        if (this.currentBankroll < determineBetLimit(this.startingBankroll, this.unlocks.betLimitLevel)[0]) {
            this.gameSessionPhase = GameSessionPhase.BROKE;
        }
    }
}