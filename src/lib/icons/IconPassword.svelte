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
    <g clip-path="url(#clip0_234_344)">
        <path
            d="M2.64728 31.3485V27.7121H39.0109V31.3485H2.64728ZM4.73819 20.3485L2.37456 18.9848L3.92001 16.2575H0.829102V13.5303H3.92001L2.37456 10.8939L4.73819 9.53027L6.28365 12.1666L7.8291 9.53027L10.1927 10.8939L8.64728 13.5303H11.7382V16.2575H8.64728L10.1927 18.9848L7.8291 20.3485L6.28365 17.6212L4.73819 20.3485ZM19.2836 20.3485L16.92 18.9848L18.4655 16.2575H15.3746V13.5303H18.4655L16.92 10.8939L19.2836 9.53027L20.8291 12.1666L22.3746 9.53027L24.7382 10.8939L23.1927 13.5303H26.2836V16.2575H23.1927L24.7382 18.9848L22.3746 20.3485L20.8291 17.6212L19.2836 20.3485ZM33.8291 20.3485L31.4655 18.9848L33.0109 16.2575H29.92V13.5303H33.0109L31.4655 10.8939L33.8291 9.53027L35.3746 12.1666L36.92 9.53027L39.2836 10.8939L37.7382 13.5303H40.8291V16.2575H37.7382L39.2836 18.9848L36.92 20.3485L35.3746 17.6212L33.8291 20.3485Z"
            fill="currentColor"
        />
    </g>
    <defs>
        <clipPath id="clip0_234_344">
            <rect width="40" height="40" transform="translate(0.829102 0.439453)" />
        </clipPath>
    </defs>
</svg>

<style>
    @import './_icons.scss';
</style>
