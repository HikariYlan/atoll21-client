<script lang="ts">
    let { suit, rank }: { suit: string, rank: string } = $props();
</script>

<div class="card {suit}">
    <span class="rank">{rank}</span>
    <br>
    <span>{suit}</span>
</div>

<style>
    .card {
        border-radius: 10px;
        padding: 0.9em;
        margin: 0.5em;
        width: 70px;
        text-align: center;
    }

    .Club, .Spade {
        border: solid 1px black;
    }

    .Diamond, .Heart {
        border: solid 1px red;
        color: red;
    }

    .rank {
        font-size: 1.1em;
    }
</style>