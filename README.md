# Reaction Timer

A browser-based reaction time game with immersive 3D visuals and real-time performance feedback. Test your reflexes across multiple attempts and track your best and average times for the session.

![Single HTML file](https://img.shields.io/badge/deployment-single%20HTML%20file-blue) ![No build step](https://img.shields.io/badge/build-none-green) ![Mobile ready](https://img.shields.io/badge/mobile-ready-brightgreen)

---

## How to Play

1. Open `index.html` in any modern browser — no server or build step needed.
2. Click the card, press **Space**, or tap on mobile to start a round.
3. Wait for the 3D object and background to turn **green**.
4. React as fast as you can — click, press Space/Enter, or tap.
5. Your reaction time in milliseconds is displayed with a performance rating.
6. Click **Play Again** for another attempt. **Reset** clears session stats.

> Clicking too early triggers a **false start** — wait for green!

---

## Performance Ratings

| Rating | Time |
|---|---|
| Superhuman | < 150 ms |
| Amazing | 150 – 200 ms |
| Very Good | 200 – 250 ms |
| Good | 250 – 300 ms |
| Average | 300 – 400 ms |
| Below Average | 400 – 600 ms |
| Keep Practicing | 600 ms+ |

---

## Features

- **3D visuals** — animated TorusKnot rendered with Three.js; colors shift with each game state
- **Audio feedback** — Web Audio API tones: pitch maps to your reaction speed
- **Session stats** — tracks attempts, best time, and rolling average
- **False start detection** — penalizes early clicks with an error state
- **Keyboard support** — Space or Enter work anywhere in the game
- **Full mobile support** — touch-optimized, viewport-safe, iOS home screen capable
- **Zero dependencies** — one HTML file; Three.js loaded from CDN

---

## Game States

| State | Color | Description |
|---|---|---|
| Idle | — | Instructions overlay shown |
| Waiting | Orange | Random 1–5 second delay before ready |
| Ready | Green | React now — timer is running |
| Result | Blue | Your time and rating are displayed |
| False Start | Red | Clicked too early — try again |

---

## Tech

- **Three.js r128** — WebGL 3D rendering, particle system, dynamic lighting
- **Web Audio API** — synthesized sound effects, no audio files
- **CSS custom properties** — 8 semantic color tokens, easy to retheme
- **Vanilla JS** — no framework, no bundler

---

## Deployment

This is a static site. Drop `index.html` anywhere:

- Open locally with `file://`
- GitHub Pages, Netlify, Vercel
- Any web server or CDN
- AWS S3 static hosting

---

## Mobile

Fully optimized for phones and tablets:

- Responsive breakpoints at 540 px, 400 px width and 680 px, 480 px height
- Reduced 3D geometry complexity on touch devices
- Safe area insets for notched screens
- iOS home screen web app support (`apple-mobile-web-app-capable`)
- Minimum 44 px touch targets on all interactive elements
