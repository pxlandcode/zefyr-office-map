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
        MIN_BOOKING_MINUTES,
    } from '$lib/utils/helpers/bookingHelpers';
    import { formatTimeInHoursAndMinutes } from '$lib/utils/helpers/calendarHelpers';
    import OptionsButton from '../ui/options-button/OptionsButton.svelte';

    export let room: MeetingRoom | null = null;
    export let extraClasses: string = '';

    const dispatch = createEventDispatcher();

    const timeFormatter = new Intl.DateTimeFormat('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    let selectedBookingOption: number = 30;
    let selectedExtendOption: number = 30;
    let selectedStartOffset: number = 0;

    let previousExtendMaxTime: number | null = null;
    let previousRemainingTime: number | null = null;

    let bookingOptions = generateTimeBookingOptions(24 * 60);
    let extendOptions = generateTimeBookingOptions(24 * 60);
    let startTimeOptions: Array<{ value: number; label: string }> = [{ value: 0, label: 'Nu' }];

    $: minutesUntilNextMeeting = room?.minutesUntilNextMeeting ?? null;

    $: startTimeOptions = (() => {
        const now = new Date();
        const options: Array<{ value: number; label: string }> = [];
        const base = minutesUntilNextMeeting ?? Number.POSITIVE_INFINITY;

        if (minutesUntilNextMeeting !== null && base < MIN_BOOKING_MINUTES) {
            return options;
        }

        options.push({ value: 0, label: 'Nu' });

        const remainder = now.getMinutes() % 15;
        const firstOffset = remainder === 0 ? 15 : 15 - remainder;
        const offsets = [firstOffset, firstOffset + 15];

        for (const offset of offsets) {
            if (offset >= base) continue;
            if (base - offset < MIN_BOOKING_MINUTES) continue;
            const futureDate = new Date(now.getTime() + offset * 60 * 1000);
            options.push({ value: offset, label: timeFormatter.format(futureDate) });
        }

        return options;
    })();

    $: if (!startTimeOptions.find((option) => option.value === selectedStartOffset)) {
        selectedStartOffset = startTimeOptions[0]?.value ?? 0;
    }

    $: availableMinutesForBooking = (() => {
        const base = minutesUntilNextMeeting ?? 24 * 60;
        const remaining = base - selectedStartOffset;
        return remaining >= MIN_BOOKING_MINUTES ? remaining : 0;
    })();

    $: bookingOptions = generateTimeBookingOptions(
        availableMinutesForBooking,
        null,
        minutesUntilNextMeeting != null &&
            minutesUntilNextMeeting - selectedStartOffset >= MIN_BOOKING_MINUTES
            ? minutesUntilNextMeeting - selectedStartOffset
            : null
    );

    $: if (!bookingOptions.find((option) => option.value === selectedBookingOption)) {
        selectedBookingOption = bookingOptions[0]?.value ?? 0;
    }

    $: selectedBookingOptionItem = bookingOptions.find(
        (option) => option.value === selectedBookingOption
    );

    $: selectedStartOption = startTimeOptions.find(
        (option) => option.value === selectedStartOffset
    );

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

    $: canBook =
        (room?.minutesUntilNextMeeting == null ||
            room?.minutesUntilNextMeeting >= MIN_BOOKING_MINUTES) &&
        startTimeOptions.length > 0 &&
        bookingOptions.length > 0;

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
                                    selectedOption={selectedBookingOptionItem ?? bookingOptions[0]}
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
                            <label for="startTime" class="text-sm text-gray-600 font-medium">
                                Välj starttid:
                            </label>

                            <OptionsButton
                                options={startTimeOptions}
                                selectedOption={selectedStartOption ?? startTimeOptions[0]}
                                on:select={(e) => (selectedStartOffset = e.detail)}
                            />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="bookingTime" class="text-sm text-gray-600 font-medium">
                                Välj bokningstid:
                            </label>

                            <OptionsButton
                                options={bookingOptions}
                                selectedOption={selectedBookingOptionItem ?? bookingOptions[0]}
                                on:select={(e) => (selectedBookingOption = e.detail)}
                            />
                        </div>

                        <Button
                            type="primary"
                            fullWidth
                            on:click={() =>
                                handleBooking(
                                    room,
                                    selectedBookingOption,
                                    selectedStartOffset,
                                    dispatch
                                )}
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
