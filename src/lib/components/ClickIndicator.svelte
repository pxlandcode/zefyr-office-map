<script lang="ts">
    export let count = 0;
    export let total = 5;

    const BASE_OPACITY = 0.18;
    const MAX_OPACITY = 1;

    $: normalizedTotal = Math.max(1, total);
    $: clampedCount = Math.max(0, Math.min(count, normalizedTotal));
    $: progress = clampedCount === 0 ? 0 : clampedCount / normalizedTotal;
    $: opacity =
        clampedCount === 0
            ? 0
            : Math.min(MAX_OPACITY, BASE_OPACITY + progress * (MAX_OPACITY - BASE_OPACITY));
</script>

{#if clampedCount > 0}
    <div class="click-indicator" role="status" aria-live="polite" style={`opacity: ${opacity}`}>
        {#each Array(normalizedTotal) as _, index (index)}
            <span class="click-indicator-dot" class:filled={index < clampedCount} aria-hidden="true"
            ></span>
        {/each}
    </div>
{/if}

<style>
    .click-indicator {
        position: fixed;
        top: 1.25rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.6rem;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        pointer-events: none;
        transition: opacity 200ms ease;
    }

    .click-indicator-dot {
        width: 0.65rem;
        height: 0.65rem;
        border-radius: 9999px;
        border: 2px solid rgba(17, 24, 39, 0.35);
        background: transparent;
        transition:
            background 150ms ease,
            border-color 150ms ease;
    }

    .click-indicator-dot.filled {
        background: rgba(37, 99, 235, 0.9);
        border-color: rgba(37, 99, 235, 0.9);
    }

    :global(.dark) .click-indicator-dot {
        border-color: rgba(249, 250, 251, 0.4);
    }

    :global(.dark) .click-indicator-dot.filled {
        background: rgba(96, 165, 250, 0.95);
        border-color: rgba(96, 165, 250, 0.95);
    }
</style>
