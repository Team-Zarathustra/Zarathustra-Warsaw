/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
		fontFamily: {
			sans: ['Inter', 'system-ui', 'sans-serif'],
		},
		keyframes: {
			fadeIn: {
				from: { 
					opacity: '0',
					transform: 'translateY(-8px)'
				},
				to: { 
					opacity: '1',
					transform: 'translateY(0)'
				},
			},
            // New animations
            fadeUp: {
                from: { 
                    opacity: '0',
                    transform: 'translateY(20px)'
                },
                to: { 
                    opacity: '1',
                    transform: 'translateY(0)'
                },
            },
            fadeLeft: {
                from: { 
                    opacity: '0',
                    transform: 'translateX(20px)'
                },
                to: { 
                    opacity: '1',
                    transform: 'translateX(0)'
                },
            },
            fadeScale: {
                from: { 
                    opacity: '0',
                    transform: 'scale(0.95)'
                },
                to: { 
                    opacity: '1',
                    transform: 'scale(1)'
                },
            },
		},
		animation: {
            fadeIn: 'fadeIn 0.3s ease-out forwards',
            // New animation variants
            fadeUp: 'fadeUp 0.5s ease-out forwards',
            fadeUpSlow: 'fadeUp 0.7s ease-out forwards',
            fadeUpDelay1: 'fadeUp 0.6s 0.2s ease-out forwards',
            fadeUpDelay2: 'fadeUp 0.6s 0.4s ease-out forwards',
            fadeUpDelay3: 'fadeUp 0.6s 0.6s ease-out forwards',
            fadeLeft: 'fadeLeft 0.5s ease-out forwards',
            fadeScale: 'fadeScale 0.5s ease-out forwards',
        },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {   			
			background: 'hsl(var(--background))',   			
			foreground: 'hsl(var(--foreground))',   			
			card: {   				
			  DEFAULT: 'hsl(var(--card))',   				
			  foreground: 'hsl(var(--card-foreground))'   			
			},   	
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

