<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import Icon from '$lib/components/ui/icon-component/Icon.svelte';
  import MeetingProgressIndicator from '$lib/components/ui/meeting-progress-indicator/MeetingProgressIndicator.svelte';
  import type { Meeting } from '$lib/types/roomTypes';

  const UPCOMING_MIN = 6;
  const INACTIVITY_MS = 30_000;

  export let ongoingMeetings: Meeting[] = [];
  export let upcomingMeetings: Meeting[] = [];

  let showAllUpcoming = false;
  let inactivityTimer: ReturnType<typeof setTimeout> | undefined;
  let sidebarEl: HTMLElement;

  const sortOngoing = (a: Meeting, b: Meeting) =>
    new Date(a.endDate).getTime() - new Date(b.endDate).getTime();

  const sortUpcoming = (a: Meeting, b: Meeting) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime();

  $: filteredUpcoming = upcomingMeetings
    .filter((meeting) => new Date(meeting.startDate).getTime() > Date.now())
    .sort(sortUpcoming);

  $: visibleUpcoming = showAllUpcoming
    ? filteredUpcoming
    : filteredUpcoming.slice(0, UPCOMING_MIN);

  $: hasHidden = filteredUpcoming.length > visibleUpcoming.length;

  function expandUpcoming() {
    showAllUpcoming = true;
    resetInactivity();
  }

  function resetInactivity() {
    if (inactivityTimer) clearTimeout(inactivityTimer);

    if (showAllUpcoming) {
      inactivityTimer = setTimeout(() => {
        showAllUpcoming = false;
      }, INACTIVITY_MS);
    }
  }

  onMount(() => {
    const events = ['mousemove', 'keydown', 'wheel', 'touchstart', 'click'] as const;
    const handler = () => resetInactivity();

    events.forEach((event) => sidebarEl?.addEventListener(event, handler, { passive: true }));

    return () => {
      events.forEach((event) => sidebarEl?.removeEventListener(event, handler));
    };
  });

  onDestroy(() => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
  });
</script>

<aside bind:this={sidebarEl} class="flex h-full flex-col gap-4 overflow-hidden px-4">
  <section class="flex flex-col gap-2">
    <h3 class="font-semibold">Pågående</h3>

    {#if ongoingMeetings.length === 0}
      <p class="text-gray-500">Inga pågående möten.</p>
    {:else}
      {#each [...ongoingMeetings].sort(sortOngoing) as meeting (meeting.id ?? meeting.startDate + (meeting.roomName ?? ''))}
        <div class="meeting-item">
          <div class="flex flex-row justify-between">
            <div class="flex items-center gap-2">
              <Icon icon="MeetingRoom" size="14px" />
              <p class="font-semibold">{meeting.roomName ?? 'Okänt rum'}</p>
            </div>
            <div class="flex items-center gap-2">
              <p>{meeting.organizer}</p>
            </div>
          </div>

          <MeetingProgressIndicator startDate={meeting.startDate} endDate={meeting.endDate} showProgress />
        </div>
      {/each}
    {/if}
  </section>

  <section class="flex flex-col gap-2">
    <h3 class="font-semibold">Kommande</h3>

    {#if filteredUpcoming.length === 0}
      <p class="text-gray-500">Inga kommande möten.</p>
    {:else}
      <div
        class="transition-all duration-200 ease-in-out"
        style="max-height: {showAllUpcoming ? '100vh' : '14rem'}; overflow: hidden;"
      >
        {#each visibleUpcoming as meeting (meeting.id ?? meeting.startDate + (meeting.roomName ?? ''))}
          <div class="meeting-item">
            <div class="flex flex-row justify-between">
              <div class="flex items-center gap-2">
                <Icon icon="MeetingRoom" size="14px" />
                <p class="font-semibold">{meeting.roomName ?? 'Okänt rum'}</p>
              </div>
              <div class="flex items-center gap-2">
                <p>{meeting.organizer}</p>
              </div>
            </div>

            <MeetingProgressIndicator
              startDate={meeting.startDate}
              endDate={meeting.endDate}
              showProgress={false}
            />
          </div>
        {/each}
      </div>

      {#if hasHidden && !showAllUpcoming}
        <button class="mt-2 self-start text-sm font-medium text-blue-600" on:click={expandUpcoming}>
          Visa fler
        </button>
      {/if}
    {/if}
  </section>
</aside>
