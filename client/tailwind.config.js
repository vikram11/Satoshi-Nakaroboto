/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#050505",
                surface: "#111111",
                primary: "#F7931A", // Bitcoin Orange
                secondary: "#00FF41", // Matrix Green
                accent: "#333333",
                text: "#E0E0E0",
                muted: "#888888"
            },
            fontFamily: {
                mono: ['"Fira Code"', '"Courier New"', 'monospace'],
                display: ['"Inter"', 'sans-serif'],
            },
            animation: {
                'cursor-blink': 'blink 1s step-end infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
            },
            keyframes: {
                blink: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGlow: {
                    '0%, 100%': {
                        textShadow: '0 0 10px rgba(0, 255, 65, 0.5), 0 0 20px rgba(0, 255, 65, 0.3), 0 0 30px rgba(0, 255, 65, 0.2)'
                    },
                    '50%': {
                        textShadow: '0 0 20px rgba(0, 255, 65, 0.8), 0 0 30px rgba(0, 255, 65, 0.5), 0 0 40px rgba(0, 255, 65, 0.3)'
                    },
                }
            }
        },
    },
    plugins: [],
}
