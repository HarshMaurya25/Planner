/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        // App surfaces
        'app-bg':      '#F5F9FF',
        'app-card':    '#FFFFFF',
        'app-border':  '#E3E8F0',
        'app-heading': '#1E293B',
        'app-body':    '#334155',
        'app-muted':   '#94A3B8',

        // Primary accent
        'accent':        '#3B82F6',
        'accent-hover':  '#2563EB',

        // Task/folder highlight colors (soft)
        'task-blue':   '#BFDBFE',
        'task-green':  '#BBF7D0',
        'task-yellow': '#FEF3C7',
        'task-red':    '#FECACA',
        'task-purple': '#E9D5FF',
      },
      boxShadow: {
        'card':       '0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px #E3E8F0',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06), 0 0 0 1px #E3E8F0',
      },
    },
  },
  plugins: [],
}
