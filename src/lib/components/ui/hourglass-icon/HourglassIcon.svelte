<script lang="ts">
    export let size = '40px';
    export let minutes: number = 0;
    export let extraClasses = '';

    $: visibleClassTop =
        minutes >= 60
            ? '60'
            : minutes >= 55
              ? '55'
              : minutes >= 50
                ? '50'
                : minutes >= 45
                  ? '45'
                  : minutes >= 40
                    ? '40'
                    : minutes >= 35
                      ? '35'
                      : minutes >= 30
                        ? '30'
                        : minutes >= 25
                          ? '25'
                          : minutes >= 20
                            ? '20'
                            : minutes >= 15
                              ? '15'
                              : minutes >= 10
                                ? '10'
                                : '5';

    $: classString = `${extraClasses}`;
</script>

<svg
    width={size}
    height={size}
    class={classString}
    viewBox="0 0 40 40"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
>
    <g id="Hourglass">
        <g id="Hourglass_2">
            <g id="BottomHourglass">
                <rect
                    class:hidden={visibleClassTop !== '60'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="14.0377"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '55'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="12.8697"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '50'}
                    x="11.8145"
                    y="32.5039"
                    width="16.3711"
                    height="3.51855"
                />
                <rect
                    class:hidden={visibleClassTop !== '45'}
                    x="11.8145"
                    y="31.3301"
                    width="16.3711"
                    height="4.69238"
                />
                <rect
                    class:hidden={visibleClassTop !== '40'}
                    x="11.8145"
                    y="30.1582"
                    width="16.3711"
                    height="5.86426"
                />
                <rect
                    class:hidden={visibleClassTop !== '35'}
                    x="11.8145"
                    y="28.9844"
                    width="16.3711"
                    height="7.03809"
                />
                <rect
                    class:hidden={visibleClassTop !== '30'}
                    x="11.8145"
                    y="27.8125"
                    width="16.3711"
                    height="8.20996"
                />
                <rect
                    class:hidden={visibleClassTop !== '25'}
                    x="11.8145"
                    y="26.6406"
                    width="16.3711"
                    height="9.38184"
                />
                <rect
                    class:hidden={visibleClassTop !== '20'}
                    x="11.8145"
                    y="25.4668"
                    width="16.3711"
                    height="10.5557"
                />
                <rect
                    class:hidden={visibleClassTop !== '15'}
                    x="11.8145"
                    y="24.2949"
                    width="16.3711"
                    height="11.7275"
                />
                <rect
                    class:hidden={visibleClassTop !== '10'}
                    x="12.8008"
                    y="23.1211"
                    width="13.8906"
                    height="12.9014"
                />
                <rect
                    class:hidden={visibleClassTop !== '5'}
                    x="13.8867"
                    y="21.9492"
                    width="12.2266"
                    height="14.0732"
                />
            </g>
            <g id="TopHourglass">
                <rect
                    class:hidden={visibleClassTop !== '60'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="14.0377"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '55'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="12.8697"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '50'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="11.6978"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '45'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="10.5299"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '40'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="9.35995"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '35'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="8.19002"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '30'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="7.0201"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '25'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="5.85018"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '20'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="4.68026"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '15'}
                    x="28.1855"
                    y="18.0273"
                    width="16.3711"
                    height="3.51034"
                    transform="rotate(-180 28.1855 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '10'}
                    x="27.1992"
                    y="18.0273"
                    width="13.8906"
                    height="2.34041"
                    transform="rotate(-180 27.1992 18.0273)"
                />
                <rect
                    class:hidden={visibleClassTop !== '5'}
                    x="26.1133"
                    y="18.0273"
                    width="12.2266"
                    height="1.17049"
                    transform="rotate(-180 26.1133 18.0273)"
                />
            </g>
            <path
                id="Vector"
                d="M12 36H28V30C28 27.8 27.2167 25.9167 25.65 24.35C24.0833 22.7833 22.2 22 20 22C17.8 22 15.9167 22.7833 14.35 24.35C12.7833 25.9167 12 27.8 12 30V36ZM20 18C22.2 18 24.0833 17.2167 25.65 15.65C27.2167 14.0833 28 12.2 28 10V4H12V10C12 12.2 12.7833 14.0833 14.35 15.65C15.9167 17.2167 17.8 18 20 18ZM4 40V36H8V30C8 27.9667 8.475 26.0583 9.425 24.275C10.375 22.4917 11.7 21.0667 13.4 20C11.7 18.9333 10.375 17.5083 9.425 15.725C8.475 13.9417 8 12.0333 8 10V4H4V0H36V4H32V10C32 12.0333 31.525 13.9417 30.575 15.725C29.625 17.5083 28.3 18.9333 26.6 20C28.3 21.0667 29.625 22.4917 30.575 24.275C31.525 26.0583 32 27.9667 32 30V36H36V40H4Z"
            />
        </g>
    </g>
</svg>

<style>
    .hidden {
        opacity: 0;
    }
    .visible {
        opacity: 1;
    }
</style>
