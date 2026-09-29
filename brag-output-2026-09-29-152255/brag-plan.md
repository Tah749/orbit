# Orbit vertical launch video plan

## What it is
Orbit is a personal AI assistant that pulls email, calendar, bills, bookings and plans from the apps you
already use into one place, and answers plain-English questions about all of it.

- **For:** busy people running a life, a job and a household from one phone.
- **Sets it apart:** one place for everything, and you can just ask it. The answers come from your own
  mail, calendar and bills, with the source shown.
- **Most impressive moment:** the slot machine of real app icons landing on the Orbit jackpot. Then the
  real app answering "Which bills are due this week?" with the actual bills and where each one came from.
- **Visual hook:** a phone drowning in notifications, punching in on every beat.
- **Real UI shown:**
  - The story page's 3D phone, slot machine, sphere network and product panels.
  - The app's private-preview unlock, then Ask, Today, Money and Plans, captured from the running app.
  - The waitlist form going through to "You're on the list."
- **Tone:** cinematic hype. Big serif type, beat-locked cuts and flashes, a driving soundtrack.
- **Share caption:** see share-copy.txt.

## Angle
Life is a gamble across too many apps. Orbit hits the jackpot: everything in one place, and you just ask.
The film ends on the call to action, "Join the waitlist now."

## Format
Vertical 1080×1920, 30fps, 20.0s. Music is 120 BPM in D minor (0.5s per beat), and every cut lands on a
beat.

## Storyboard

| # | Time | Scene | On screen | Sound |
|---|---|---|---|---|
| 1 | 0.0–2.5 | Hook | The story phone piles up notifications and punches in on each beat. "One phone. Too many moving parts." | A sub pulse and notification pings in key, with a riser. |
| 2 | 2.5–5.5 | Jackpot | The slot machine of real app icons spins under "Every day, a gamble." It lands on the Orbit payline, then a flash and "Jackpot." | Lever clunk, slowing reel ticks and a snare roll. The beat drops at 4.5. |
| 3 | 5.5–8.0 | Connect | The Orbit sphere with the apps orbiting it, then the flat product panels. "Everything. One place." | Whoosh, then the full groove. |
| 4 | 8.0–11.5 | Unlock, ask | The app's private-preview gate: the password is typed and it unlocks. Then Ask: "Which bills are due this week?" is typed and the real answer appears with its sources. "Unlock it." then "Just ask." | Key ticks, an unlock chime and a pluck per source. |
| 5 | 11.5–14.5 | Day, money | Today, with a task ticked off, under "Nothing slips." Money, with spending and budgets, under "Every bill." | Groove with an arpeggio, and a snare fill. |
| 6 | 14.5–17.0 | Plans | The Edinburgh trip: flights, hotel and dinner, with references. "Handled." | A riser, then a one-beat breath. |
| 7 | 17.0–20.0 | Waitlist | The story's join section: an email is typed, and "You're on the list." appears. The end card shows the app icon, "Join the waitlist now." and the wordmark. | Final hit and a D major lift, with typing ticks, a success chime and the ring-out. |

**Poster / frame 0:** scene 4 settled at 11.3s, "Just ask." with the real answer.

## Sound
The soundtrack is synthesised from scratch as one piece: kick, sidechained sub bass, detuned pad, hats, and
an arpeggio from 8.5s. The sound effects are tuned to the same key and sit under the music: pings, reel ticks,
key ticks, chimes and plucks. Everything shares one reverb and goes through a soft limiter to about -13 LUFS.

## Build
Footage was captured with Playwright from the production build at phone size (390×693 at 2.77x). The 3D
scenes were rendered with swiftshader. A canvas composer draws each frame as a pure function of time, and
the frames are piped to ffmpeg. The scripts are in `work/`, which is not committed.
