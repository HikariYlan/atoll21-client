import { determineBetLimit, determinePayout } from "./bankroll";
import { BlackJackRound, RoundState } from "./blackjack";

export enum GameSessionPhase {
    BETTING = "betting",
    PLAYING = "playing",
    FINISHED = "finished"
}

export class GameSession {
    startingBankroll: number;
    currentBankroll: number;
    currentBet: number;
    betLimitLevel: number;
    gameSessionPhase: GameSessionPhase;
    round: BlackJackRound | null = null;

    constructor (startingBankroll: number, betLimitLevel: number) {
        this.startingBankroll = this.currentBankroll = startingBankroll;
        this.currentBet = 0;
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
        this.round = new BlackJackRound;
        this.gameSessionPhase = GameSessionPhase.PLAYING;
        this.settle();
    }

    private settle(): void {
        if (this.gameSessionPhase != GameSessionPhase.PLAYING) return;
        if (this.round === null || this.round.roundState != RoundState.FINISHED) return;
        this.currentBankroll += determinePayout(this.round.roundOutcome, this.currentBet);
        this.gameSessionPhase = GameSessionPhase.FINISHED;
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
        this.currentBet = 0;
        this.gameSessionPhase = GameSessionPhase.BETTING;
    }
}