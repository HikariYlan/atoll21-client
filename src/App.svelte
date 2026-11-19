<script lang="ts">
    import { computeHand, Outcome, RoundState } from "./game/blackjack";
    import { GameSession, GameSessionPhase } from "./game/casino";
    import Card from "./lib/Card.svelte";

    let gameSession = new GameSession(100, 0);
    function snapshot() {
        const round = gameSession.round;
        return {
            playerHand: round ? round.playerHand : null,
            dealerHand: round ? round.dealerHand : null,
            playerTotal: round ? computeHand(round.playerHand.cards) : null,
            dealerTotal: round ? computeHand(round.dealerHand.cards) : null,
            roundOutcome: round ? round.roundOutcome : Outcome.NOT_DECIDED,
            bankroll: gameSession.currentBankroll,
            bet: gameSession.currentBet,
            phase: gameSession.gameSessionPhase,
            lastNet: gameSession.lastNet,
            betRange: gameSession.betRange()
        };
    }

    let gameState = $state(snapshot());

    function refresh() {
        gameState = snapshot();
    }

    function hit() {
        gameSession.hit();
        refresh();
    }

    function stand() {
        gameSession.stand();
        refresh();
    }

    function newRound() {
        gameSession.nextRound();
        betInput = gameSession.betRange()[0];
        refresh();
    }

    let betInput: number | null = $state(gameSession.betRange()[0]);
    let errorMessage = $state("");

    function deal() {
        try {
            gameSession.placingBet(betInput!);
            errorMessage = "";
        } catch (error) {
            errorMessage = (error as Error).message;
        }
        refresh();
    }

    /**
     * FOR DEBUG PURPOSES ONLY, DELETE THIS WHEN GOING PROD
     */
    function debroke() {
        gameSession.currentBankroll = 100;
        gameSession.gameSessionPhase = GameSessionPhase.BETTING;
        newRound();
        refresh();
    }

    const outcomeTexts: Record<Outcome, string> = {
        [Outcome.PLAYER_BUST]: "Player busted!",
        [Outcome.PLAYER_BLACKJACK]: "Player hit a blackjack!",
        [Outcome.DEALER_BUST]: "Dealer Busted!",
        [Outcome.DEALER_BLACKJACK]: "Dealer hit a blackjack!",
        [Outcome.PUSH_BLACKJACK]: "Both hit a blackjack!",
        [Outcome.PUSH]: "It's a push!",
        [Outcome.PLAYER_WIN]: "Player wins!",
        [Outcome.DEALER_WIN]: "Dealer wins!",
        [Outcome.NOT_DECIDED]: ""
    };
</script>

<div>
    {#if gameState.phase == GameSessionPhase.BROKE}
        <h1>You're broke, homie!</h1>
        <button onclick={debroke}>Refill bankroll</button>
    {/if}
    {#if gameState.phase == GameSessionPhase.BETTING}
        <div>
            <p>Current bankroll: {gameState.bankroll}</p>
            <input type="number" bind:value={betInput}>
            <button onclick={deal} disabled={
                !Number.isInteger(betInput) || 
                betInput! < gameState.betRange[0] || 
                betInput! > gameState.betRange[1]
            }>Deal!</button>
        </div>
    {/if}
    {#if gameState.playerHand && gameState.dealerHand}
        <p>Current bankroll: {gameState.bankroll}</p>
        <p>Current bet: {gameState.bet}</p>
        <div>
            <div class="hand">
                {#each gameState.dealerHand.cards as card}
                    <Card suit={card.suit} rank={card.rank}/>
                {/each}
            </div>
            <p>{gameState.dealerTotal![0]}</p>
        </div>
        <br><br>
        <div>
            <div class="hand">
                {#each gameState.playerHand.cards as card}
                    <Card suit={card.suit} rank={card.rank}/>
                {/each}
            </div>
            <p>{#if gameState.playerTotal![1]}Soft{/if} {gameState.playerTotal![0]}</p>
        </div>
        <div>
            <button onclick={hit} disabled={gameState.phase != GameSessionPhase.PLAYING}>Hit</button>
            <button onclick={stand} disabled={gameState.phase != GameSessionPhase.PLAYING}>Stand</button>
            <button onclick={newRound} disabled={gameState.phase == GameSessionPhase.PLAYING}>New round</button>
        </div>
        {#if gameState.phase == GameSessionPhase.FINISHED}
            <div>
                <h1>{outcomeTexts[gameState.roundOutcome]} {#if gameState.lastNet > 0}+{/if}{gameState.lastNet}</h1>
            </div>
        {/if}
    {/if}
</div>

<style>
    .hand {
        display: flex;
    }
</style>