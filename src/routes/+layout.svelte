<script>
    import PinPromptPopUp from '$lib/components/popups/PinPromptPopUp.svelte';
    import NotificationContainer from '$lib/components/ui/notification-container/NotificationContainer.svelte';
    import { browser } from '$app/environment';
    import '../app.css';
    import RoomPopUp from '$lib/components/popups/RoomPopUp.svelte';
    import BrandStamp from '$lib/components/ui/brand-stamp/BrandStamp.svelte';
    import BrandStampPopUp from '$lib/components/popups/BrandStampPopUp.svelte';
</script>

<NotificationContainer />

<slot />

<BrandStamp text="Powered by " position="fixed" bottom="14px" right="14px" />
{#if browser}
    <PinPromptPopUp />
    <RoomPopUp />
    <BrandStampPopUp />
{/if}
