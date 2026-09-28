# Orbit colour schemes

Seven candidate palettes for Orbit, each with a dark and a light token set using the existing token names (`paper, white, soft, line, ink, muted, green, sage, sageDeep, coral, blue, yellow`). All contrast ratios are computed with the WCAG 2.x relative-luminance formula. Every required text pair passes AA (4.5:1) in both modes. Data-viz colours are checked at 3:1 against the surface (WCAG 1.4.11, non-text).

See `index.html` for swatches, full contrast tables and product mocks. Tokens are in `schemes.json`.

## Recommendation

**Top pick: Evergreen** (Jade `#6BD6A0` on `#0B110E`; light: `#1E7A4C` on `#F5F8F5`)

- Green reads as "healthy" for both money and wellbeing, which is the whole span of Orbit (bills to fitness), and a desaturated jade is calm rather than neon fintech.
- It is genuinely good in both dark and light, so the app can follow the system setting. Families and daytime users get a proper light mode, not an afterthought.
- It separates brand from danger: jade accent vs. warm coral alerts are far apart in hue, so "Pay now" and "Overdue" can never be confused, which matters in a money product.
- Every required pair passes AA in both modes with no adjustments, and the accent clears 10:1 as text on dark paper.

**Runner-up: Afterglow** (`#F2587F` on `#0C0A11`)

- Keeps the equity of the current rose/violet waitlist site, so early sign-ups will recognise the product at launch.
- Has the most personality of the "safe" options.
- Held back because rose-plus-red is a real semantic risk for bills and alerts, and pink-on-black reads more "nightlife" than "trusted with your finances". If you want to keep the current brand, ship Afterglow.

Ready-to-paste tokens for Evergreen: `recommended-tokens.css`.

## Current palette (baseline)

| Pair | Ratio | AA |
|---|---|---|
| Ink on paper | 18.37 | Pass |
| Muted on paper | 7.52 | Pass |
| Muted on surface | 6.95 | Pass |
| Accent text on paper | 6.19 | Pass |
| Button text (paper) on accent | 6.19 | Pass |
| sageDeep on sage | 10.11 | Pass |
| Coral on paper | 6.41 | Pass |
| Yellow on paper | 9.88 | Pass |

## Afterglow (runner-up)

*Evolution of current · Dark-first. Primary mode: dark.*

The current Orbit look, grown up. The rose is a touch softer and warmer, the violet is quieter, and the near-black has a faint plum cast so it reads as evening rather than sci-fi. Danger (coral) is pushed toward orange-red so it no longer sits next to the rose accent. It keeps the brand equity and the personality, and it will appeal to early adopters and design-literate professionals who already like the waitlist site. Risks: pink-on-black still reads as "consumer tech / nightlife" more than "your money is safe", rose and red are close enough that a "Pay now" button and an "Overdue" alert can blur together, and dark-only palettes feel heavier for families in daylight.

| Mode | paper | white | ink | muted | green (accent) | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|
| dark | `#0C0A11` | `#15131C` | `#F6F3FA` | `#A69FB4` | `#F2587F` | `#2B1522` / `#FFB3C6` | `#FF6E4A` | `#A48BF5` | `#F5B14C` |
| light | `#FBF8FB` | `#FFFFFF` | `#1A1520` | `#635A6E` | `#C8285A` | `#FCE8EE` / `#8E1A40` | `#C2361A` | `#6D4ED8` | `#9A5B00` |

Data viz: dark `#F2587F` `#A48BF5` `#4FC3D9` `#F5B14C` `#7FD6A6` · light `#C8285A` `#6D4ED8` `#0E7C94` `#A35F00` `#2E8A5A`

| Pair | Dark | Light |
|---|---|---|
| Ink on paper | 17.92 Pass | 17.00 Pass |
| Muted on paper | 7.72 Pass | 6.19 Pass |
| Muted on surface | 7.22 Pass | 6.53 Pass |
| Accent text on paper | 6.07 Pass | 5.10 Pass |
| Button text (paper) on accent | 6.07 Pass | 5.10 Pass |
| sageDeep on sage | 10.15 Pass | 7.55 Pass |
| Coral on paper | 7.10 Pass | 5.19 Pass |
| Yellow on paper | 10.57 Pass | 5.15 Pass |

## Iris

*Evolution of current · Dark-first. Primary mode: dark.*

The other way to evolve the current palette: promote the violet to primary and demote the rose to a secondary accent. Violet is calmer than rose, carries "intelligence / AI" connotations without being neon, and it leaves red free to mean danger. It appeals to the same tech-forward audience as today, with a slightly more serious, product-led feel. Risks: violet is now common for AI products (it may look like "yet another AI app"), and it is less warm than rose, so the brand leans cooler and slightly less human.

| Mode | paper | white | ink | muted | green (accent) | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|
| dark | `#0D0B14` | `#161320` | `#F7F5FC` | `#A7A0BA` | `#9D86FF` | `#1F1838` / `#CFC2FF` | `#FF6B6B` | `#FF7EA6` | `#FFB057` |
| light | `#FAF9FE` | `#FFFFFF` | `#17132A` | `#5F5873` | `#5B3FD6` | `#ECE7FD` / `#3F28A6` | `#C23434` | `#B8235A` | `#9A5500` |

Data viz: dark `#9D86FF` `#FF7EA6` `#5CC8E0` `#FFB057` `#7BD8A8` · light `#5B3FD6` `#B8235A` `#0B7892` `#A35A00` `#24855A`

| Pair | Dark | Light |
|---|---|---|
| Ink on paper | 18.07 Pass | 17.24 Pass |
| Muted on paper | 7.80 Pass | 6.40 Pass |
| Muted on surface | 7.30 Pass | 6.71 Pass |
| Accent text on paper | 6.78 Pass | 6.41 Pass |
| Button text (paper) on accent | 6.78 Pass | 6.41 Pass |
| sageDeep on sage | 10.28 Pass | 8.43 Pass |
| Coral on paper | 7.04 Pass | 5.23 Pass |
| Yellow on paper | 10.79 Pass | 5.46 Pass |

## Harbor

*Trust-first · Light-first · Finance-grade. Primary mode: light.*

Finance-grade calm. Cool white paper, deep navy ink, one confident blue accent and a teal secondary. This is the language of banks, brokerages and password managers, so it quietly says "your money and data are safe here". It appeals to cautious, older or finance-minded users and to families who want the app to feel like a utility they can rely on. Risks: it is the least distinctive option. Blue-on-white is what every bank already looks like, so the brand needs to find its personality in type, illustration and copy rather than colour.

| Mode | paper | white | ink | muted | green (accent) | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|
| dark | `#0A0F17` | `#111823` | `#F2F5F9` | `#9AA6B6` | `#5AA9F0` | `#10263A` / `#A9D4FF` | `#F2685B` | `#6FCFC3` | `#F0B44C` |
| light | `#F6F8FB` | `#FFFFFF` | `#0E1A2B` | `#56657A` | `#1F5FD1` | `#E6EEFB` / `#16448F` | `#C0392B` | `#0E7C74` | `#8A5A00` |

Data viz: dark `#5AA9F0` `#6FCFC3` `#B89CF2` `#F0B44C` `#F28FA8` · light `#1F5FD1` `#0E7C74` `#7C4DBA` `#A66400` `#C23A6B`

| Pair | Dark | Light |
|---|---|---|
| Ink on paper | 17.56 Pass | 16.43 Pass |
| Muted on paper | 7.78 Pass | 5.58 Pass |
| Muted on surface | 7.21 Pass | 5.94 Pass |
| Accent text on paper | 7.65 Pass | 5.46 Pass |
| Button text (paper) on accent | 7.65 Pass | 5.46 Pass |
| sageDeep on sage | 9.96 Pass | 7.97 Pass |
| Coral on paper | 6.32 Pass | 5.11 Pass |
| Yellow on paper | 10.37 Pass | 5.57 Pass |

## Linen

*Light-first · Warm & human. Primary mode: light.*

Warm paper, espresso ink and a terracotta "clay" accent: a calm, tactile, editorial feel closer to a good notebook or a boutique hotel than a tech dashboard. It suits families and people who are tired of screens shouting at them, and it signals "premium lifestyle" without being cold. Risks: warm neutrals can look beige or dated if type and spacing are not sharp, orange-brown sits near the amber warning so the warning colour has to stay distinctly yellow-brown, and it is less obviously "AI-powered" (which may be a feature).

| Mode | paper | white | ink | muted | green (accent) | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|
| dark | `#14120F` | `#1C1915` | `#F4EFE7` | `#ABA293` | `#E58A5F` | `#2E1D14` / `#F5C2A6` | `#F2735F` | `#8DB4D1` | `#E3B25A` |
| light | `#F7F4EE` | `#FFFFFF` | `#1F1B16` | `#6B6358` | `#AC4E27` | `#F6E6DC` / `#7A3417` | `#B3261E` | `#3D6B8C` | `#8C5E00` |

Data viz: dark `#E58A5F` `#8DB4D1` `#A9C28A` `#D9B56A` `#C99AC4` · light `#AC4E27` `#3D6B8C` `#5E7F3A` `#9A6A00` `#8A4F86`

| Pair | Dark | Light |
|---|---|---|
| Ink on paper | 16.34 Pass | 15.60 Pass |
| Muted on paper | 7.41 Pass | 5.39 Pass |
| Muted on surface | 6.94 Pass | 5.91 Pass |
| Accent text on paper | 7.24 Pass | 4.94 Pass |
| Button text (paper) on accent | 7.24 Pass | 4.94 Pass |
| sageDeep on sage | 10.10 Pass | 7.41 Pass |
| Coral on paper | 6.58 Pass | 5.95 Pass |
| Yellow on paper | 9.60 Pass | 5.15 Pass |

## Evergreen (recommended)

*Calm · Trust-first · Dark + light. Primary mode: dark.*

Deep forest-black with a soft jade accent (the "green" token finally means green). Green carries both "money is healthy" and "wellbeing", which is exactly Orbit's span from bills to fitness, and a desaturated jade feels calm rather than neon-fintech. It works equally well in dark and light, so it can follow the system setting. It appeals to busy professionals and families alike: serious enough for finances, soft enough for a daily companion. Risks: green is common in fintech (Robinhood, Revolut accents, banking "paid" states), so success states and the brand colour need a small separation, and a too-saturated green can slide into "crypto".

| Mode | paper | white | ink | muted | green (accent) | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|
| dark | `#0B110E` | `#121A16` | `#EEF4F0` | `#98A89E` | `#6BD6A0` | `#12281D` / `#A8E8C6` | `#F0705F` | `#8AB4F8` | `#E8B84E` |
| light | `#F5F8F5` | `#FFFFFF` | `#0F1C15` | `#56665C` | `#1E7A4C` | `#E3F2E8` / `#155C38` | `#B93A2B` | `#2F5FB3` | `#8A5D00` |

Data viz: dark `#6BD6A0` `#8AB4F8` `#E8B84E` `#F28B82` `#C3A6F2` · light `#1E7A4C` `#2F5FB3` `#9A6500` `#BF4A3F` `#7A55C2`

| Pair | Dark | Light |
|---|---|---|
| Ink on paper | 17.11 Pass | 16.39 Pass |
| Muted on paper | 7.66 Pass | 5.69 Pass |
| Muted on surface | 7.11 Pass | 6.09 Pass |
| Accent text on paper | 10.68 Pass | 4.98 Pass |
| Button text (paper) on accent | 10.68 Pass | 4.98 Pass |
| sageDeep on sage | 11.15 Pass | 6.92 Pass |
| Coral on paper | 6.53 Pass | 5.30 Pass |
| Yellow on paper | 10.35 Pass | 5.38 Pass |

## Nocturne

*Premium · Dark-first. Primary mode: dark.*

Midnight indigo with a champagne-gold accent and periwinkle secondary. It borrows from private banking, premium cards and luxury travel: discreet, expensive, evening-quiet. It appeals to high-earning professionals and anyone who wants Orbit to feel like a concierge rather than a to-do app. Risks: gold on navy can tip into "crypto exchange" or "hotel loyalty programme" if overused, it is less friendly for families and children, and gold is close to the amber warning colour, so warnings are pushed toward orange.

| Mode | paper | white | ink | muted | green (accent) | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|
| dark | `#0B0C16` | `#141626` | `#F3F2F8` | `#A3A5BD` | `#E8C27A` | `#2A2414` / `#F3DDB0` | `#F37266` | `#8EA2FF` | `#FF9F5A` |
| light | `#F8F7F3` | `#FFFFFF` | `#14162A` | `#5A5C72` | `#8A6412` | `#F6EDD8` / `#6B4B0A` | `#B8362A` | `#3D4FC4` | `#A34A00` |

Data viz: dark `#E8C27A` `#8EA2FF` `#6FD3C1` `#F0918A` `#C7A8F0` · light `#8A6412` `#3D4FC4` `#0F7A6C` `#B5433A` `#7A4FB8`

| Pair | Dark | Light |
|---|---|---|
| Ink on paper | 17.50 Pass | 16.63 Pass |
| Muted on paper | 8.04 Pass | 6.11 Pass |
| Muted on surface | 7.40 Pass | 6.54 Pass |
| Accent text on paper | 11.53 Pass | 5.01 Pass |
| Button text (paper) on accent | 11.53 Pass | 5.01 Pass |
| sageDeep on sage | 11.60 Pass | 6.84 Pass |
| Coral on paper | 6.87 Pass | 5.44 Pass |
| Yellow on paper | 9.61 Pass | 5.54 Pass |

## Volt

*Bold · Distinctive. Primary mode: dark.*

The loud one. Warm carbon black with an electric lime accent and sky-blue secondary. Nothing else in the personal-finance or assistant space looks like this, so it is instantly memorable on a launch page, in a social feed or on a billboard. It appeals to younger professionals and early adopters and signals energy and optimism. Risks: lime is the hardest colour to keep calm and is the opposite of "quiet"; it cannot be used as text on light backgrounds at all, so the light mode swaps to a dark olive accent and loses much of its identity; and it may feel too playful for people trusting it with money.

| Mode | paper | white | ink | muted | green (accent) | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|
| dark | `#0E0E0C` | `#181815` | `#F7F7F0` | `#A7A79A` | `#D6FF4A` | `#232B0E` / `#E6FF99` | `#FF6A55` | `#7DD3FC` | `#FFC23D` |
| light | `#FAFAF5` | `#FFFFFF` | `#151512` | `#5F5F52` | `#4D7000` | `#EEF7D2` / `#3A5400` | `#C0301F` | `#0369A1` | `#9A5800` |

Data viz: dark `#D6FF4A` `#7DD3FC` `#FF8FB1` `#FFC23D` `#B69CFF` · light `#4D7000` `#0369A1` `#BE185D` `#A15C00` `#6D28D9`

| Pair | Dark | Light |
|---|---|---|
| Ink on paper | 17.96 Pass | 17.47 Pass |
| Muted on paper | 7.95 Pass | 6.18 Pass |
| Muted on surface | 7.32 Pass | 6.47 Pass |
| Accent text on paper | 16.80 Pass | 5.52 Pass |
| Button text (paper) on accent | 16.80 Pass | 5.52 Pass |
| sageDeep on sage | 13.44 Pass | 7.71 Pass |
| Coral on paper | 6.85 Pass | 5.44 Pass |
| Yellow on paper | 11.99 Pass | 5.32 Pass |

## Contrast adjustments

Linen light accent (green) was first drafted as #B4532A, which passed at only 4.54:1 on paper; it was darkened to #AC4E27 (4.94:1) for headroom. Status pills and the alert tint in light mode first used 14% and 12% tints, which pulled coral, yellow and blue pill text to 4.19 to 4.47:1 in Afterglow, Iris, Harbor and Evergreen; light-mode tints were reduced to 7% and 6% so all pill and alert text now clears 4.5:1. No other colour needed changing.
