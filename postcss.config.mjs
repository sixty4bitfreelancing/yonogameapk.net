const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Older Android WebViews and browsers (Chrome < 99, Samsung Internet < 18, Safari < 15.4) drop @layer blocks entirely.
    "@csstools/postcss-cascade-layers": {},
  },
};

export default config;
