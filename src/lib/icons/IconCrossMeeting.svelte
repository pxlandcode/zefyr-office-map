<script>
    export let size = '40px';
    export let color = 'black';
    export let extraClasses = '';
    export let extraStyle = '';

    $: classString = `text-${color} ${extraClasses}`;
    $: styleString = `${extraStyle}`;
</script>

<svg
    width={size}
    height={size}
    class={classString}
    style={styleString}
    fill="currentColor"
    viewBox="0 0 40 40"
    xmlns="http://www.w3.org/2000/svg"
>
    <g clip-path="url(#clip0_233_331)">
        <path
            d="M15.8141 33.8395L13.0141 31.0395L17.6141 26.4395L13.0141 21.8395L15.8141 19.0395L20.4141 23.6395L25.0141 19.0395L27.8141 21.8395L23.2141 26.4395L27.8141 31.0395L25.0141 33.8395L20.4141 29.2395L15.8141 33.8395ZM6.41406 40.4395C5.31406 40.4395 4.3724 40.0478 3.58906 39.2645C2.80573 38.4811 2.41406 37.5395 2.41406 36.4395V8.43945C2.41406 7.33945 2.80573 6.39779 3.58906 5.61445C4.3724 4.83112 5.31406 4.43945 6.41406 4.43945H8.41406V0.439453H12.4141V4.43945H28.4141V0.439453H32.4141V4.43945H34.4141C35.5141 4.43945 36.4557 4.83112 37.2391 5.61445C38.0224 6.39779 38.4141 7.33945 38.4141 8.43945V36.4395C38.4141 37.5395 38.0224 38.4811 37.2391 39.2645C36.4557 40.0478 35.5141 40.4395 34.4141 40.4395H6.41406ZM6.41406 36.4395H34.4141V16.4395H6.41406V36.4395ZM6.41406 12.4395H34.4141V8.43945H6.41406V12.4395Z"
            fill="currentColor"
        />
    </g>
    <defs>
        <clipPath id="clip0_233_331">
            <rect width="40" height="40" transform="translate(0.414062 0.439453)" />
        </clipPath>
    </defs>
</svg>

<style>
    @import './_icons.scss';
</style>
