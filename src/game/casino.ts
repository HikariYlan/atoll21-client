import { determineBetLimit, determinePayout } from "./bankroll";
import { BlackJackRound, RoundState } from "./blackjack";

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
    betLimitLevel: number;
    gameSessionPhase: GameSessionPhase;
    round: BlackJackRound | null = null;
    lastNet: number = 0;

    constructor (startingBankroll: number, betLimitLevel: number) {
        this.startingBankroll = this.currentBankroll = startingBankroll;
        this.betLimitLevel = betLimitLevel;
        this.gameSessionPhase = GameSessionPhase.BETTING;
    }

    public placingBet(amount: number): void {
        if (this.gameSessionPhase != GameSessionPhase.BETTING) return;
        let [min, max] = determineBetLimit(this.startingBankroll, this.betLimitLevel);

        if (amount < min || amount > max || amount > this.currentBankroll || !Number.isInteger(amount)) {
            throw Error("GameSession.placingBet(): amount is invalid");
        }

        this.currentBankroll -= amount;
        this.currentBet = amount;
        this.round = new BlackJackRound(amount);
        this.gameSessionPhase = GameSessionPhase.PLAYING;
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
        this.currentBankroll += payout;
        this.currentBet = stake;
        this.gameSessionPhase = GameSessionPhase.FINISHED;
        
        this.lastNet = payout - this.currentBet;
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

    public nextRound(): void {
        if (this.gameSessionPhase != GameSessionPhase.FINISHED) return;
        this.round = null;
        this.currentBet = this.lastNet = 0;
        this.gameSessionPhase = GameSessionPhase.BETTING;

        if (this.currentBankroll < determineBetLimit(this.startingBankroll, this.betLimitLevel)[0]) {
            this.gameSessionPhase = GameSessionPhase.BROKE;
        }
    }

    public betRange(): number[] {
        let [min, max] = determineBetLimit(this.startingBankroll, this.betLimitLevel);
        return [min, Math.min(max, this.currentBankroll)];
    }
}