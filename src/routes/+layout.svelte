<script>
    import PinPromptPopUp from '$lib/components/popups/PinPromptPopUp.svelte';
    import NotificationContainer from '$lib/components/ui/notification-container/NotificationContainer.svelte';
    import { browser } from '$app/environment';
    import '../app.css';
    import RoomPopUp from '$lib/components/popups/RoomPopUp.svelte';
    import OfficeRoomPopUp from '$lib/components/popups/OfficeRoomPopUp.svelte';
    import BrandStamp from '$lib/components/ui/brand-stamp/BrandStamp.svelte';
    import BrandStampPopUp from '$lib/components/popups/BrandStampPopUp.svelte';
    import ClickIndicator from '$lib/components/ClickIndicator.svelte';
    import { clickIndicatorStore } from '../stores/clickIndicatorStore';
</script>

<NotificationContainer />

{#if $clickIndicatorStore.show}
    <ClickIndicator count={$clickIndicatorStore.count} total={$clickIndicatorStore.total} />
{/if}

<slot />

<BrandStamp text="Powered by " position="fixed" bottom="14px" right="14px" />
{#if browser}
    <PinPromptPopUp />
    <RoomPopUp />
    <OfficeRoomPopUp />
    <BrandStampPopUp />
{/if}
