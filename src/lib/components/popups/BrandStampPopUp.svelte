<script lang="ts">
    import { brandStampPopup, closeBrandStampPopup } from '$lib/stores/brandStampPopupStore';
    import PopupWrapper from '$lib/components/ui/popup-wrapper/PopupWrapper.svelte';
    import { onDestroy } from 'svelte';

    let open = false;
    let title = 'Pixel&Code_';
    let icon = 'PixelCode';

    const unsub = brandStampPopup.subscribe((s) => {
        open = s.open;
    });

    function handleClose() {
        closeBrandStampPopup();
    }

    onDestroy(unsub);
</script>

<PopupWrapper bind:open on:close={handleClose} width="420px" z={60} header={title} {icon}>
    <div class="space-y-2">
        <p class="text-sm font-semibold">
            Detta är ett proof of concept och ett sidoprojekt utvecklat av Pixel&Code_.
        </p>
        <p class="text-sm">Har du ett projekt du vill ha hjälp med?</p>
        <p class="text-sm">
            Fyll upp din kaffekopp och kom och slå dig ned i vår soffa, så snackar vi!
        </p>
    </div>
</PopupWrapper>
