const orange = '#dd890b';

//gray
const brightGray = '#F9F9F9';
const gray = '#D6D6D6';

//green
const brightGreen = '#33c759';
const green = '#29793D';
const darkGreen = '#061B15';

//red
const red = '#c04c3d';
const darkRed = '#8D2517';

//blue
const blue = '#3b82f6';

//Almost black
const dark = '#363636';

module.exports = {
    content: [
        './src/**/*.{html,js,svelte,ts}',
        './src/routes/**/*.{svelte,ts,js}',
        './src/lib/**/*.{svelte,ts,js}',
    ],
    theme: {
        extend: {
            fontFamily: {
                hahmlet: ['Hahmlet', 'serif'],
            },
            colors: {
                room: {
                    DEFAULT: brightGray,
                    free: brightGreen,
                    almostfree: orange,
                    occupied: red,
                },
                green: {
                    DEFAULT: green,
                    bright: brightGreen,
                    dark: darkGreen,
                },
                gray: {
                    DEFAULT: gray,
                    bright: brightGray,
                },
                red: {
                    DEFAULT: red,
                    dark: darkRed,
                },
                blue: {
                    DEFAULT: blue,
                },
                text: {
                    DEFAULT: dark,
                },
                walls: darkGreen,
                windows: gray,
                doors: gray,
                closedDoor: darkRed,
                mapIcon: darkGreen,
            },
        },
    },
    plugins: [],
};
