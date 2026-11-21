<script lang="ts">
    import { computeHand, HandOutcome, RoundState } from "./game/blackjack";
    import { GameSession, GameSessionPhase } from "./game/casino";
    import Card from "./lib/Card.svelte";

    let gameSession = new GameSession(100);
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
            betRange: gameSession.betRange(),
            unlocks: gameSession.unlocks
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

    function surrender() {
        gameSession.surrender();
        refresh();
    }

    function double() {
        gameSession.double();
        refresh();
    }

    let betInput: number | null = $state(gameSession.betRange()[0]);
    let lastBet: number = gameSession.betRange()[0];
    let canDouble: boolean = $state(false);
    let canSurrender: boolean = $state(false);
    let canSplit: boolean = $state(false);
    let canInsurance: boolean = $state(false);
    let betLimit: number = $state(0);
    let dealerLevel: number = $state(0);

    let errorMessage = $state("");

    function restoreBet() {
        const [min, max] = gameSession.betRange();
        betInput = Math.min(Math.max(lastBet, min), max);
    }

    function newRound() {
        gameSession.nextRound();
        restoreBet();
        refresh();
    }

    function deal() {
        try {
            gameSession.placingBet(betInput!);
            lastBet = betInput!;
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

    /**
     * FOR DEBUG PURPOSES ONLY, DELETE THIS WHEN GOING PROD
     */
    function changeDouble() {
        gameSession.unlocks.double = canDouble;
        refresh();
    }

    /**
     * FOR DEBUG PURPOSES ONLY, DELETE THIS WHEN GOING PROD
     */
    function changeSplit() {
        gameSession.unlocks.split = canSplit;
        refresh();
    }

    /**
     * FOR DEBUG PURPOSES ONLY, DELETE THIS WHEN GOING PROD
     */
    function changeInsurance() {
        gameSession.unlocks.insurance = canInsurance;
        refresh();
    }

    /**
     * FOR DEBUG PURPOSES ONLY, DELETE THIS WHEN GOING PROD
     */
    function changeSurrender() {
        gameSession.unlocks.surrender = canSurrender;
        refresh();
    }

    /**
     * FOR DEBUG PURPOSES ONLY, DELETE THIS WHEN GOING PROD
     */
    function changeBetLimit() {
        gameSession.unlocks.betLimitLevel = betLimit;
        refresh();
    }

    /**
     * FOR DEBUG PURPOSES ONLY, DELETE THIS WHEN GOING PROD
     */
    function changeDealerLevel() {
        gameSession.unlocks.dealerLevel = dealerLevel;
        refresh();
    }

    /**
     * FOR DEBUG PURPOSES ONLY, DELETE THIS WHEN GOING PROD
     */
    function debug() {
        changeBetLimit();
        changeDealerLevel();
        changeDouble();
        changeSplit();
        changeSurrender();
        changeInsurance();
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
        [HandOutcome.SURRENDERED]: "You surrendered.",
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
            <input type="number" bind:value={betInput} min={gameState.betRange[0]} max={gameState.betRange[1]}>
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
            <button onclick={surrender} disabled={gameState.unlocks.surrender == false || gameState.phase != GameSessionPhase.PLAYING}>Surrender</button>
            <button onclick={double} disabled={gameState.playerHands[gameSession.round!.activeHandIndex].cards.length > 2 || gameState.unlocks.double == false || gameState.phase != GameSessionPhase.PLAYING}>Double</button>
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
        <div>
            Double:
            <input type="checkbox" bind:checked={canDouble}>
            <br/>
            Split:
            <input type="checkbox" bind:checked={canSplit}>
            <br/>
            Surrender:
            <input type="checkbox" bind:checked={canSurrender}>
            <br/>
            Insurance:
            <input type="checkbox" bind:checked={canInsurance}>
            <br/>
            Bet limit level:
            <select bind:value={betLimit}>
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
            </select>
            <br/>
            Dealer level (4 = 17 hit on soft):
            <select bind:value={dealerLevel}>
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
            </select>
            <br/>
            <button onclick={debug}>Save debug</button>
        </div>
        <div>
            <p>Double: {gameState.unlocks.double}</p>
            <p>Split: {gameState.unlocks.split}</p>
            <p>Surrender: {gameState.unlocks.surrender}</p>
            <p>Insurance: {gameState.unlocks.insurance}</p>
            <p>Bet limit level: {gameState.unlocks.betLimitLevel}</p>
            <p>Dealer level: {gameState.unlocks.dealerLevel}</p>
        </div>
    {/if}
</div>

<style>
    .hand {
        display: flex;
    }
</style>