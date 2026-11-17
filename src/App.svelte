<script lang="ts">
    import { BlackJackRound, computeHand, Outcome, RoundState } from "./game/blackjack";
    import Card from "./lib/Card.svelte";

    let blackjackRound = new BlackJackRound;
    let view = $state(
        {
            playerHand: blackjackRound.playerHand, 
            dealerHand: blackjackRound.dealerHand,
            playerTotal: computeHand(blackjackRound.playerHand.cards),
            dealerTotal: computeHand(blackjackRound.dealerHand.cards),
            roundState: blackjackRound.roundState,
            roundOutcome: blackjackRound.roundOutcome
        }
    );

    function refresh() {
        view = {
            playerHand: blackjackRound.playerHand, 
            dealerHand: blackjackRound.dealerHand,
            playerTotal: computeHand(blackjackRound.playerHand.cards),
            dealerTotal: computeHand(blackjackRound.dealerHand.cards),
            roundState: blackjackRound.roundState,
            roundOutcome: blackjackRound.roundOutcome
        };
    }

    function hit() {
        blackjackRound.hit();
        refresh();
    }

    function stand() {
        blackjackRound.stand();
        refresh();
    }

    function newRound() {
        blackjackRound = new BlackJackRound;
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
    <div>
        <div class="hand">
            {#each view.dealerHand.cards as card}
                <Card suit={card.suit} rank={card.rank}/>
            {/each}
        </div>
        <p>{view.dealerTotal[0]}</p>
    </div>
    <br><br>
    <div>
        <div class="hand">
            {#each view.playerHand.cards as card}
                <Card suit={card.suit} rank={card.rank}/>
            {/each}
        </div>
        <p>{view.playerTotal[0]}</p>
    </div>
    <div>
        <button onclick={hit} disabled={view.roundState == RoundState.FINISHED}>Hit</button>
        <button onclick={stand} disabled={view.roundState == RoundState.FINISHED}>Stand</button>
        <button onclick={newRound} disabled={view.roundState != RoundState.FINISHED}>New round</button>
    </div>
    <div>
        <h1>{outcomeTexts[view.roundOutcome]}</h1>
    </div>
</div>

<style>
    .hand {
        display: flex;
    }
</style>