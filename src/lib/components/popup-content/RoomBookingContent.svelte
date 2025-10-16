<script lang="ts">
    import type { MeetingRoom } from '$lib/types/roomTypes';
    import { createEventDispatcher } from 'svelte';
    import Button from '../ui/button/Button.svelte';
    import DailyCalendar from '../ui/daily-calendar/DailyCalendar.svelte';
    import Tag from '../ui/tag/Tag.svelte';
    import Icon from '../ui/icon-component/Icon.svelte';
    import HourglassIcon from '../ui/hourglass-icon/HourglassIcon.svelte';

    import {
        generateTimeBookingOptions,
        handleBooking,
        handleCancel,
        handleExtend,
    } from '$lib/utils/helpers/bookingHelpers';
    import { formatTimeInHoursAndMinutes } from '$lib/utils/helpers/calendarHelpers';
    import OptionsButton from '../ui/options-button/OptionsButton.svelte';

    export let room: MeetingRoom | null = null;
    export let extraClasses: string = '';

    const dispatch = createEventDispatcher();

    let selectedBookingOption: number = 30;
    let selectedExtendOption: number = 30;

    let previousBookingMaxTime: number | null = null;
    let previousExtendMaxTime: number | null = null;
    let previousRemainingTime: number | null = null;

    let bookingOptions = generateTimeBookingOptions(24 * 60);
    let extendOptions = generateTimeBookingOptions(24 * 60);

    $: if (room && room?.minutesUntilNextMeeting !== previousBookingMaxTime) {
        previousBookingMaxTime = room?.minutesUntilNextMeeting;
        bookingOptions = generateTimeBookingOptions(
            previousBookingMaxTime ?? 24 * 60,
            null,
            room?.minutesUntilNextMeeting
        );
    }

    $: if (
        room &&
        (room?.minutesUntilNextMeeting !== previousExtendMaxTime ||
            room?.currentMeetingEndsIn !== previousRemainingTime)
    ) {
        previousExtendMaxTime = room?.minutesUntilNextMeeting;
        previousRemainingTime = room?.currentMeetingEndsIn;
        extendOptions = generateTimeBookingOptions(
            previousExtendMaxTime ?? 24 * 60,
            previousRemainingTime ?? null,
            room?.minutesUntilNextMeeting
        );
    }
    $: nextMeeting = room?.todaysMeetings?.find(
        (meeting) => new Date(meeting.startDate) > new Date()
    );

    $: canBook = room?.minutesUntilNextMeeting == null || room?.minutesUntilNextMeeting >= 15;

    $: canExtend =
        room?.currentMeetingEndsIn != null &&
        room.currentMeetingEndsIn <= 15 &&
        selectedExtendOption <= (room.minutesUntilNextMeeting ?? 24 * 60);

    $: classString = `${extraClasses}`;
</script>

{#if room}
    <div class="wrapper gap-4 text-text">
        <div class="flex flex-row {extraClasses} gap-4">
            <div class="flex flex-col gap-4 w-[400px]">
                {#if room.status === 'Upptagen'}
                    <Tag color="red" text={room.status}></Tag>
                {:else}
                    <div class="flex flex-row justify-between items-center">
                        <Tag color="green" text={room.status}></Tag>
                        {#if room.minutesUntilNextMeeting && nextMeeting}
                            <p class="text-sm text-gray-500">
                                {formatTimeInHoursAndMinutes(room.minutesUntilNextMeeting)} till nästa
                                möte
                            </p>
                        {:else}
                            <p class="text-sm text-gray-500">Tillgänglig resten av dagen</p>
                        {/if}
                    </div>
                {/if}

                {#if room.status === 'Upptagen'}
                    <div class="flex items-center gap-1">
                        <Icon icon="Person" size="14px" />
                        <p><strong>Mötesbokare:</strong> {room.currentMeetingOrganizer}</p>
                    </div>
                    <div class="flex items-center gap-1">
                        <HourglassIcon size="14px" minutes={room.currentMeetingEndsIn} />
                        <p><strong>Klart om:</strong> {room.currentMeetingEndsIn} minuter</p>
                    </div>

                    <div class="mt-auto space-y-4">
                        {#if canExtend}
                            <div class="flex flex-col gap-2">
                                <label for="bookingTime" class="text-sm text-gray-600 font-medium">
                                    Välj bokningstid:
                                </label>

                                <OptionsButton
                                    options={bookingOptions}
                                    selectedOption={bookingOptions[0]}
                                    on:select={(e) => (selectedBookingOption = e.detail)}
                                    type="secondary"
                                />
                            </div>
                            <Button
                                type="secondary"
                                fullWidth
                                on:click={() => handleExtend(room, selectedExtendOption, dispatch)}
                                >Förläng</Button
                            >
                        {/if}
                        <Button
                            type="cancel"
                            fullWidth
                            on:click={() => handleCancel(room, dispatch)}>Avboka</Button
                        >
                    </div>
                {/if}

                {#if room.status === 'Ledig'}
                    {#if canBook}
                        <div class="flex flex-col gap-2 mt-auto">
                            <label for="bookingTime" class="text-sm text-gray-600 font-medium">
                                Välj bokningstid:
                            </label>

                            <OptionsButton
                                options={bookingOptions}
                                selectedOption={bookingOptions[0]}
                                on:select={(e) => (selectedBookingOption = e.detail)}
                            />
                        </div>

                        <Button
                            type="primary"
                            fullWidth
                            on:click={() => handleBooking(room, selectedBookingOption, dispatch)}
                            >Boka</Button
                        >
                    {/if}
                {/if}
            </div>

            {#if room.todaysMeetings && room.todaysMeetings.length > 0}
                <div class="w-[400px]">
                    <DailyCalendar meetings={room.todaysMeetings}></DailyCalendar>
                </div>
            {/if}
        </div>
    </div>
{/if}
