<script lang="ts">
    import { computeHand, HandOutcome, RoundState } from "./game/blackjack";
    import { GameSession, GameSessionPhase } from "./game/casino";
    import Card from "./lib/Card.svelte";

    let gameSession = new GameSession(100, 0);
    function snapshot() {
        const round = gameSession.round;
        return {
            playerHands: round ? round.playerHands.map((hand, index) => {
                const [total, isSoft] = computeHand(hand.cards);
                return {
                    cards: [...hand.cards],
                    total,
                    isSoft,
                    bet: hand.bet,
                    outcome: hand.outcome,
                    isActive: index == round.activeHandIndex && round.roundState == RoundState.PLAYER_ROUND
                };
            }) : [],
            dealerHand: round ? round.dealerHand : null,
            dealerTotal: round ? computeHand(round.dealerHand.cards) : null,
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
        betInput = gameState.bet;
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

    const outcomeTexts: Record<HandOutcome, string> = {
        [HandOutcome.PLAYER_BUST]: "Player busted!",
        [HandOutcome.PLAYER_BLACKJACK]: "Player hit a blackjack!",
        [HandOutcome.DEALER_BUST]: "Dealer Busted!",
        [HandOutcome.DEALER_BLACKJACK]: "Dealer hit a blackjack!",
        [HandOutcome.PUSH_BLACKJACK]: "Both hit a blackjack!",
        [HandOutcome.PUSH]: "It's a push!",
        [HandOutcome.PLAYER_WIN]: "Player wins!",
        [HandOutcome.DEALER_WIN]: "Dealer wins!",
        [HandOutcome.NOT_DECIDED]: ""
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
    {#if gameState.playerHands && gameState.dealerHand}
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
        {#each gameState.playerHands as hand}
            <div class="hand">
                {#each hand.cards as card}
                    <Card suit={card.suit} rank={card.rank}/>
                {/each}
            </div>
            <p>{#if hand.isSoft}Soft{/if} {hand.total} (bet {hand.bet})</p>
            {#if hand.outcome != HandOutcome.NOT_DECIDED}
                <p>{outcomeTexts[hand.outcome]}</p>
            {/if}
        {/each}
        </div>
        <div>
            <button onclick={hit} disabled={gameState.phase != GameSessionPhase.PLAYING}>Hit</button>
            <button onclick={stand} disabled={gameState.phase != GameSessionPhase.PLAYING}>Stand</button>
            <button onclick={newRound} disabled={gameState.phase == GameSessionPhase.PLAYING}>New round</button>
        </div>
        {#if gameState.phase == GameSessionPhase.FINISHED}
            <div>
                <h1>
                    {#if gameState.lastNet > 0}
                        Well done! +{gameState.lastNet}
                    {:else if gameState.lastNet == 0}
                        No gain, no loss.
                    {:else}
                        Better luck next time... {gameState.lastNet}
                    {/if}</h1>
            </div>
        {/if}
    {/if}
</div>

<style>
    .hand {
        display: flex;
    }
</style>