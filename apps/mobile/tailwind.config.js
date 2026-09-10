module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./hooks/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: '#090d16',
        surface: '#131b2e',
        divider: '#1c2842',
        indigo: '#6366f1',
        violet: '#8b5cf6',
        primary: '#f8fafc',
        secondary: '#94a3b8',
        muted: '#64748b',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      borderRadius: {
        '2xl': '24px',
        glass: '20px',
        pill: '9999px'
      },
      spacing: {
        safe: '16px',
        'tap': '48px'
      },
      boxShadow: {
        card: '0 8px 28px rgba(0,0,0,0.24)',
        glow: '0 6px 32px rgba(139,92,246,0.38)'
      }
    }
  },
  plugins: []
};
