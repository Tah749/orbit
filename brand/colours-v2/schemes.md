# Orbit colour schemes v2

Ten new schemes (five light-first, five dark-first), none repeating round one (Afterglow, Iris, Harbor, Linen, Evergreen, Nocturne, Volt). Each has both modes in the existing token names, a 5-colour data-viz palette per mode, and contrast computed with the WCAG 2.x relative-luminance formula. Open `index.html` for mocks, swatches and full tables.

**Result:** every required text pair clears 4.5:1 in both modes for all ten schemes. Every data-viz colour clears 3:1 on the card (`white`) surface. Ink clears 7:1 (AAA) everywhere.

## Recommendations

### Best light-first: Oat
Accent `#0C6B66` on `#F5F3EF` (light); counterpart `#5CC9BC` on `#151412`. Tokens: `oat-tokens.css`.
- Warm grey paper reads calm and premium in daylight without looking like a bank or a wellness app.
- Petrol teal is far from coral (danger) and amber (warning), so 'Pay now' and 'Overdue' never blur.
- The dark counterpart is just as strong: button text 9.2:1, accent text 8.6:1 on the card.
- Broadest audience fit of the ten: parents, professionals, anyone who wants life to feel handled.

### Best dark-first: Nightbloom
Accent `#FF4D7A` on `#060B1C` (dark); counterpart `#D11E55` on `#F3F6FC`. Tokens: `nightbloom-tokens.css`.
- Built on the midnight blue, cyan and rose direction you already like on the 3D story page, so the site and product feel like one world.
- Cyan does the everyday data work and rose is kept for brand moments, which keeps it calm rather than loud.
- Danger moves to orange-red (#FF6B4A) so it no longer sits on top of the rose, which fixes the old palette's weak spot.
- Midnight blue feels deeper and more trustworthy than pure black, and the light mode keeps the same rose-and-cyan logic.

### Best all-rounder: Porcelain
Accent `#2941CC` on `#F4F5F7` (light); counterpart `#8C9DFF` on `#0E1014`. Tokens: `porcelain-tokens.css`.
- The most even pair of modes: accent text stays above 7:1 on paper and card in both modes, and neither mode feels like an afterthought.
- Cobalt on cool grey is the most 'safe with your money' signal here, and it works for bills, investments and travel alike.
- Its neutrality lets product content (photos, charts, fitness rings) lead, and it scales to a full app UI easily.
- Lowest-risk choice if Orbit wants to add personality through type, motion and illustration instead of colour.

## At a glance

| Scheme | Primary | Mood | Light accent / paper | Dark accent / paper |
|---|---|---|---|---|
| Porcelain | light | Cool, quiet, engineered | `#2941CC` / `#F4F5F7` | `#8C9DFF` / `#0E1014` |
| Oat | light | Warm, unhurried, grown-up | `#0C6B66` / `#F5F3EF` | `#5CC9BC` / `#151412` |
| Broadsheet | light | Black ink, white stock, one red | `#D63816` / `#FAFAF7` | `#FF5A36` / `#0A0A0A` |
| Sorbet | light | Soft, friendly, a little playful | `#7A3AA0` / `#F8F5FD` | `#D2A6F5` / `#17141F` |
| Riso | light | Loud and joyful, like a two-colour risograph zine | `#DA1787` / `#FFFBF3` | `#FF5CB0` / `#110E14` |
| Nightbloom | dark | The 3D story world made into a system | `#D11E55` / `#F3F6FC` | `#FF4D7A` / `#060B1C` |
| Graphite | dark | Pure charcoal and one signal orange, like well-made hardware | `#C24A00` / `#F6F6F6` | `#FF8A3D` / `#0F0F10` |
| Ember | dark | Espresso browns and a honey glow, like a lamp-lit study at night | `#955A00` / `#FAF6F0` | `#F2A93B` / `#14100C` |
| Ultra | dark | Deep ultramarine instead of black, with an electric mint that pops like a highlighter | `#0A7A55` / `#F2F4FF` | `#3EF0B0` / `#0A1150` |
| Bramble | dark | Blackberry plum darks with a soft pistachio green | `#3F6B1F` / `#F7F4F6` | `#B5D99C` / `#120C14` |

## Contrast adjustments

The script nudged HSL lightness (hue and saturation kept) until each failing colour cleared its target:

- **Broadsheet**, light `green`: `#E8401C` → `#D63816` (3.88 → 4.53 against paper/white)
- **Sorbet**, light `blue`: `#2E7D8C` → `#2D7A89` (4.4 → 4.57 against paper/white)
- **Riso**, light `green`: `#E0188A` → `#DA1787` (4.36 → 4.57 against paper/white)
- **Riso**, light `viz3`: `#E09A00` → `#C58800` (2.39 → 3.05 against white)

Data-viz palettes were also run through a colour-blind (protan/deutan) and chroma validator. Orders and a few hues were re-tuned so adjacent series stay distinguishable. Broadsheet uses black and grey series on purpose, so it is the one intentional chroma exception. Dark-mode data colours are brighter than that validator's conservative lightness band. This is deliberate, so they glow on dark cards, and they still clear 3:1.

## Schemes

### Porcelain (light-first · Neutral, Cool grey)
*Cobalt + Slate blue.* Cool, quiet, engineered. Pale cool greys with one confident cobalt. Feels like a well-made bank app that got a design budget.

- **Suits:** Money-first positioning, privacy-conscious professionals, anyone who distrusts 'lifestyle' branding. Easiest to extend into a full product UI.
- **Risks:** Can read as generic SaaS or 'another fintech blue'. Personality has to come from type, motion and copy, not colour.

| Mode | paper | white | soft | line | ink | muted | green | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|---|---|
| light | `#F4F5F7` | `#FFFFFF` | `#EBEDF1` | `#DADDE3` | `#111318` | `#5B616E` | `#2941CC` | `#E8EBFB` / `#1C2E99` | `#C8322B` | `#3E6A8A` | `#8F5F00` |
| dark | `#0E1014` | `#16181D` | `#1F2228` | `#2B2F37` | `#F2F3F5` | `#9CA2AE` | `#8C9DFF` | `#1B2146` / `#C3CCFF` | `#FF7A70` | `#86B8D9` | `#F2BE55` |

Data viz: light `#2941CC` `#2F8F5B` `#8A4FC0` `#D0672B` `#00879E` · dark `#8C9DFF` `#6FCB8F` `#C39BF0` `#F29A5E` `#4FC9DC`

Button text: light mode **light** `#FFFFFF`, dark mode **dark** `#0E1014`.

| Pair | Light | Dark |
|---|---|---|
| Ink on paper | 17.03 Pass | 17.15 Pass |
| Muted on paper | 5.70 Pass | 7.43 Pass |
| Muted on card | 6.21 Pass | 6.93 Pass |
| Accent text on paper | 7.07 Pass | 7.60 Pass |
| Button text on accent | 7.71 Pass | 7.60 Pass |
| sageDeep on sage | 9.32 Pass | 9.91 Pass |
| Coral on paper | 4.88 Pass | 7.50 Pass |
| Yellow on paper | 5.06 Pass | 11.13 Pass |
| Data viz on card (lowest, 3:1) | 3.71 Pass | 7.09 Pass |

### Oat (light-first · Neutral, Warm grey)
*Petrol + Heather.* Warm, unhurried, grown-up. Oatmeal greys like linen paper, with a deep petrol teal that feels steady rather than techy.

- **Suits:** The broadest audience: busy parents, 30-55 professionals, people who want their life to feel handled. Good in daylight and in print.
- **Risks:** Warm grey plus teal is a familiar 'calm wellness' combination, so it may feel too quiet for a launch that needs to be noticed.

| Mode | paper | white | soft | line | ink | muted | green | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|---|---|
| light | `#F5F3EF` | `#FFFFFF` | `#ECE8E1` | `#DDD7CD` | `#1D1B18` | `#67625A` | `#0C6B66` | `#E1EFEC` / `#084B47` | `#B8382A` | `#6B4F8F` | `#8C5C00` |
| dark | `#151412` | `#1D1B19` | `#272522` | `#35322D` | `#F2EFEA` | `#A9A399` | `#5CC9BC` | `#12302D` / `#A8E3DA` | `#F07A68` | `#BBA3DD` | `#E4B458` |

Data viz: light `#00836C` `#C0652B` `#6B4F8F` `#A07A12` `#2F6DB5` · dark `#5CC9BC` `#EE9A62` `#B99AF0` `#D9B85A` `#7AAEF5`

Button text: light mode **light** `#FFFFFF`, dark mode **dark** `#151412`.

| Pair | Light | Dark |
|---|---|---|
| Ink on paper | 15.50 Pass | 16.05 Pass |
| Muted on paper | 5.46 Pass | 7.35 Pass |
| Muted on card | 6.05 Pass | 6.86 Pass |
| Accent text on paper | 5.72 Pass | 9.24 Pass |
| Button text on accent | 6.34 Pass | 9.24 Pass |
| sageDeep on sage | 8.43 Pass | 9.87 Pass |
| Coral on paper | 5.21 Pass | 6.74 Pass |
| Yellow on paper | 5.20 Pass | 9.62 Pass |
| Data viz on card (lowest, 3:1) | 3.97 Pass | 7.31 Pass |

### Broadsheet (light-first · Editorial, High contrast)
*Vermilion + Press blue.* Black ink, white stock, one red. Confident and editorial, like a well-set newspaper front page. Says 'we have nothing to hide'.

- **Suits:** Brand-led launch, press and investor pages, a design-literate audience. Also the most legible option for older users.
- **Risks:** A red-orange accent sits near 'danger', so alerts need icons and labels. Can feel stark or cold across a whole app, and heavy black is tiring in dark rooms.

| Mode | paper | white | soft | line | ink | muted | green | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|---|---|
| light | `#FAFAF7` | `#FFFFFF` | `#F0F0EC` | `#D4D4CF` | `#0A0A0A` | `#555552` | `#D63816` | `#FDEBE5` / `#A3260B` | `#A5103F` | `#1F3FBF` | `#8A6100` |
| dark | `#0A0A0A` | `#141414` | `#1E1E1E` | `#2E2E2E` | `#FFFFFF` | `#A3A3A0` | `#FF5A36` | `#2B1109` / `#FFB3A0` | `#FF6B8E` | `#8FA5FF` | `#F5C451` |

Data viz: light `#0A0A0A` `#D63816` `#8C8C87` `#1F3FBF` `#B8860B` · dark `#F2F2F2` `#FF5A36` `#8F8F8B` `#8FA5FF` `#F5C451`

Button text: light mode **light** `#FFFFFF`, dark mode **dark** `#0A0A0A`.

| Pair | Light | Dark |
|---|---|---|
| Ink on paper | 18.93 Pass | 19.80 Pass |
| Muted on paper | 7.15 Pass | 7.83 Pass |
| Muted on card | 7.48 Pass | 7.28 Pass |
| Accent text on paper | 4.53 Pass | 6.38 Pass |
| Button text on accent | 4.73 Pass | 6.38 Pass |
| sageDeep on sage | 6.41 Pass | 10.29 Pass |
| Coral on paper | 7.31 Pass | 7.30 Pass |
| Yellow on paper | 5.30 Pass | 12.16 Pass |
| Data viz on card (lowest, 3:1) | 3.25 Pass | 5.68 Pass |

### Sorbet (light-first · Pastel, Soft)
*Grape + Lagoon.* Soft, friendly, a little playful. Lavender mist with peach and mint tints, anchored by a ripe grape accent so it never goes limp.

- **Suits:** Wellbeing and family angles, a younger or more female-skewing audience, social and app-store assets.
- **Risks:** Pastels can undersell the 'we handle your money' seriousness. Pale tints wash out on cheap screens, and the dark mode is the weaker half.

| Mode | paper | white | soft | line | ink | muted | green | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|---|---|
| light | `#F8F5FD` | `#FFFFFF` | `#FDEEE6` | `#E6DDF0` | `#231D33` | `#6A6180` | `#7A3AA0` | `#F2E6FA` / `#5A2380` | `#C0394E` | `#2D7A89` | `#8E6000` |
| dark | `#17141F` | `#201C2B` | `#2A2538` | `#3A3449` | `#F6F2FC` | `#B0A7C4` | `#D2A6F5` | `#33224A` / `#E7CDFB` | `#FF8A98` | `#86D3DE` | `#F5CB77` |

Data viz: light `#7A3AA0` `#DF7565` `#008CA8` `#BB8D1A` `#5A74D6` · dark `#D2A6F5` `#FF9E7A` `#5FCFE3` `#F5CB77` `#A9B8FF`

Button text: light mode **light** `#FFFFFF`, dark mode **dark** `#17141F`.

| Pair | Light | Dark |
|---|---|---|
| Ink on paper | 15.04 Pass | 16.45 Pass |
| Muted on paper | 5.36 Pass | 7.93 Pass |
| Muted on card | 5.78 Pass | 7.26 Pass |
| Accent text on paper | 6.62 Pass | 9.09 Pass |
| Button text on accent | 7.14 Pass | 9.09 Pass |
| sageDeep on sage | 8.80 Pass | 9.89 Pass |
| Coral on paper | 4.95 Pass | 8.08 Pass |
| Yellow on paper | 5.09 Pass | 11.84 Pass |
| Data viz on card (lowest, 3:1) | 3.03 Pass | 8.26 Pass |

### Riso (light-first · Bold, Print)
*Fluoro magenta + Riso blue.* Loud and joyful, like a two-colour risograph zine. Warm uncoated-paper white, fluorescent magenta and a hard riso blue.

- **Suits:** A launch that needs to stand out on social, a creative early-adopter crowd, and marketing pages more than the daily app.
- **Risks:** The least 'bank-like' option. Magenta across bills and investments may feel unserious, and it tires quickly at full app scale.

| Mode | paper | white | soft | line | ink | muted | green | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|---|---|
| light | `#FFFBF3` | `#FFFFFF` | `#FFF1E0` | `#EADFCC` | `#14110F` | `#5F574D` | `#DA1787` | `#FFE3F0` / `#99095A` | `#C22A1D` | `#1646C8` | `#8A5B00` |
| dark | `#110E14` | `#1B1720` | `#25202C` | `#362F3F` | `#FFF8F0` | `#B3A9B8` | `#FF5CB0` | `#3A1029` / `#FFB6DB` | `#FF7355` | `#7AA2FF` | `#FFD15C` |

Data viz: light `#E0188A` `#1646C8` `#C58800` `#0F9D8A` `#6A3FB8` · dark `#FF5CB0` `#7AA2FF` `#FFD15C` `#3FD9BE` `#FF8A4C`

Button text: light mode **light** `#FFFFFF`, dark mode **dark** `#110E14`.

| Pair | Light | Dark |
|---|---|---|
| Ink on paper | 18.22 Pass | 18.18 Pass |
| Muted on paper | 6.88 Pass | 8.47 Pass |
| Muted on card | 7.10 Pass | 7.80 Pass |
| Accent text on paper | 4.57 Pass | 6.76 Pass |
| Button text on accent | 4.72 Pass | 6.76 Pass |
| sageDeep on sage | 6.89 Pass | 10.08 Pass |
| Coral on paper | 5.59 Pass | 7.14 Pass |
| Yellow on paper | 5.69 Pass | 13.25 Pass |
| Data viz on card (lowest, 3:1) | 3.05 Pass | 6.23 Pass |

### Nightbloom (dark-first · Midnight, Current direction)
*Rose + Cyan.* The 3D story world made into a system. Deep midnight blue, cyan light and a single rose bloom. Cinematic, calm, with a pulse.

- **Suits:** Continuity with the story page and waitlist, evening use, tech-forward early adopters. The strongest 'personality with trust' balance of the dark set.
- **Risks:** Rose and red sit close, so danger is pushed to orange-red and needs an icon. Midnight blue is popular in AI products, so the rose has to do the distinguishing.

| Mode | paper | white | soft | line | ink | muted | green | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|---|---|
| light | `#F3F6FC` | `#FFFFFF` | `#E8EEF9` | `#D5DEEE` | `#0A1330` | `#52607E` | `#D11E55` | `#FDE6ED` / `#9B1340` | `#C2410C` | `#0A7A99` | `#8F5E00` |
| dark | `#060B1C` | `#0D1530` | `#14203F` | `#1F2D52` | `#EEF4FF` | `#93A3C4` | `#FF4D7A` | `#2A1030` / `#FFB1C6` | `#FF6B4A` | `#3DD6F5` | `#FFC24D` |

Data viz: light `#D11E55` `#00799F` `#6D4ED8` `#B7791F` `#0F8A6E` · dark `#FF4D7A` `#3DD6F5` `#A78BFA` `#FFC24D` `#5EEAD4`

Button text: light mode **light** `#FFFFFF`, dark mode **dark** `#060B1C`.

| Pair | Light | Dark |
|---|---|---|
| Ink on paper | 16.89 Pass | 17.74 Pass |
| Muted on paper | 5.82 Pass | 7.72 Pass |
| Muted on card | 6.30 Pass | 7.09 Pass |
| Accent text on paper | 4.82 Pass | 6.15 Pass |
| Button text on accent | 5.21 Pass | 6.15 Pass |
| sageDeep on sage | 6.92 Pass | 10.17 Pass |
| Coral on paper | 4.78 Pass | 6.95 Pass |
| Yellow on paper | 5.15 Pass | 12.19 Pass |
| Data viz on card (lowest, 3:1) | 3.64 Pass | 5.65 Pass |

### Graphite (dark-first · Neutral, Charcoal)
*Signal orange + Steel.* Pure charcoal and one signal orange, like well-made hardware. Precise, confident, zero decoration.

- **Suits:** Power users, people who live in dark mode, anyone who likes Teenage Engineering or Braun. Very good for dense data views.
- **Risks:** Orange next to red danger and amber warning is a crowded warm corner, so status colours lean on icons. Colder than the brief's 'calm' in light mode.

| Mode | paper | white | soft | line | ink | muted | green | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|---|---|
| light | `#F6F6F6` | `#FFFFFF` | `#EDEDEE` | `#DDDDE0` | `#111113` | `#5E5E66` | `#C24A00` | `#FCEBDD` / `#8A3500` | `#C62828` | `#4A6480` | `#8C5E00` |
| dark | `#0F0F10` | `#18181A` | `#212124` | `#2E2E32` | `#F4F4F5` | `#A1A1A8` | `#FF8A3D` | `#2E1A0C` / `#FFC49C` | `#FF5C5C` | `#9BB4CF` | `#F5CF4F` |

Data viz: light `#C24A00` `#3D6FA8` `#B8860B` `#1E8F76` `#8A5AB8` · dark `#FF8A3D` `#7FA8F0` `#E8C547` `#4FC9A8` `#C09CF0`

Button text: light mode **light** `#FFFFFF`, dark mode **dark** `#0F0F10`.

| Pair | Light | Dark |
|---|---|---|
| Ink on paper | 17.45 Pass | 17.43 Pass |
| Muted on paper | 5.94 Pass | 7.46 Pass |
| Muted on card | 6.42 Pass | 6.91 Pass |
| Accent text on paper | 4.55 Pass | 8.17 Pass |
| Button text on accent | 4.91 Pass | 8.17 Pass |
| sageDeep on sage | 6.98 Pass | 10.74 Pass |
| Coral on paper | 5.20 Pass | 6.33 Pass |
| Yellow on paper | 5.23 Pass | 12.70 Pass |
| Data viz on card (lowest, 3:1) | 3.25 Pass | 7.40 Pass |

### Ember (dark-first · Warm, Espresso)
*Honey + Dusty sky.* Espresso browns and a honey glow, like a lamp-lit study at night. Warm, reassuring, quietly luxurious.

- **Suits:** Evening 'wind-down' positioning, a premium or older audience, anyone who finds blue-black UIs cold.
- **Risks:** Honey accent and amber warning are neighbours, so warning is pushed to orange and must carry an icon. Brown-black can look muddy on poor displays.

| Mode | paper | white | soft | line | ink | muted | green | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|---|---|
| light | `#FAF6F0` | `#FFFFFF` | `#F2EBE0` | `#E4D9C9` | `#231A12` | `#6E6154` | `#955A00` | `#FBEBCF` / `#6B3F00` | `#B8322A` | `#3F6A8E` | `#B04A0C` |
| dark | `#14100C` | `#1D1813` | `#28211A` | `#3A3027` | `#F6EEE4` | `#B0A392` | `#F2A93B` | `#33230E` / `#FFD59A` | `#FF6B5E` | `#8FB5D6` | `#FF9152` |

Data viz: light `#955A00` `#336FA8` `#A8483A` `#7A5A9A` `#3F8545` · dark `#F2A93B` `#72AAF2` `#F08A74` `#C29BF2` `#8FD07A`

Button text: light mode **light** `#FFFFFF`, dark mode **dark** `#14100C`.

| Pair | Light | Dark |
|---|---|---|
| Ink on paper | 15.88 Pass | 16.47 Pass |
| Muted on paper | 5.57 Pass | 7.66 Pass |
| Muted on card | 6.00 Pass | 7.13 Pass |
| Accent text on paper | 5.21 Pass | 9.48 Pass |
| Button text on accent | 5.61 Pass | 9.48 Pass |
| sageDeep on sage | 7.66 Pass | 10.98 Pass |
| Coral on paper | 5.53 Pass | 6.78 Pass |
| Yellow on paper | 5.09 Pass | 8.50 Pass |
| Data viz on card (lowest, 3:1) | 4.51 Pass | 7.21 Pass |

### Ultra (dark-first · Bold, Saturated)
*Electric mint + Lilac.* Deep ultramarine instead of black, with an electric mint that pops like a highlighter. Unmistakable and optimistic.

- **Suits:** A launch that wants a signature colour people remember, app icon and social presence, a younger confident audience.
- **Risks:** Saturated blue fatigues over long sessions and dominates photography. Mint accent sits close to 'success green', so paid/success states need a different treatment.

| Mode | paper | white | soft | line | ink | muted | green | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|---|---|
| light | `#F2F4FF` | `#FFFFFF` | `#E6EAFF` | `#D2D8F5` | `#0B1466` | `#4A548C` | `#0A7A55` | `#DDF7EC` / `#065A3E` | `#C8283A` | `#4B3FD1` | `#8A5C00` |
| dark | `#0A1150` | `#111A63` | `#1A2575` | `#28348A` | `#F2F4FF` | `#AEB6E8` | `#3EF0B0` | `#0E3A52` / `#B5FFE2` | `#FF7A88` | `#C4B5FF` | `#FFD166` |

Data viz: light `#0A7A55` `#4B3FD1` `#D9486A` `#C28A00` `#1E88C8` · dark `#3EF0B0` `#C4B5FF` `#FF8FA3` `#FFD166` `#6CC8FF`

Button text: light mode **light** `#FFFFFF`, dark mode **dark** `#0A1150`.

| Pair | Light | Dark |
|---|---|---|
| Ink on paper | 14.67 Pass | 15.85 Pass |
| Muted on paper | 6.52 Pass | 8.81 Pass |
| Muted on card | 7.15 Pass | 7.88 Pass |
| Accent text on paper | 4.88 Pass | 11.83 Pass |
| Button text on accent | 5.35 Pass | 11.83 Pass |
| sageDeep on sage | 7.32 Pass | 10.52 Pass |
| Coral on paper | 5.01 Pass | 6.94 Pass |
| Yellow on paper | 5.31 Pass | 12.05 Pass |
| Data viz on card (lowest, 3:1) | 3.03 Pass | 7.18 Pass |

### Bramble (dark-first · Moody, Plum)
*Pistachio + Blush.* Blackberry plum darks with a soft pistachio green. Unexpected, gentle and a little botanical. Premium without gold.

- **Suits:** Wellbeing and fitness crossover, a design-literate audience that wants something nobody else has, lifestyle press.
- **Risks:** Plum plus green is an acquired taste. Pistachio reads as 'success', so it must be kept for brand and 'paid' only. The light mode is less distinctive.

| Mode | paper | white | soft | line | ink | muted | green | sage / sageDeep | coral | blue | yellow |
|---|---|---|---|---|---|---|---|---|---|---|---|
| light | `#F7F4F6` | `#FFFFFF` | `#EEE8EC` | `#DED4DB` | `#1E1520` | `#66596A` | `#3F6B1F` | `#E7F1DC` / `#2C4D14` | `#C0303F` | `#9A3F6B` | `#8A5B00` |
| dark | `#120C14` | `#1B141E` | `#251C29` | `#352A3A` | `#F4EEF5` | `#AFA2B4` | `#B5D99C` | `#22301A` / `#D8F0C6` | `#FF7A85` | `#F2A6C4` | `#F0C267` |

Data viz: light `#3F6B1F` `#9A3F6B` `#B07A12` `#1F7BA8` `#C25E1F` · dark `#A8DC88` `#F59CC0` `#F0C267` `#6CC0EA` `#F29A6A`

Button text: light mode **light** `#FFFFFF`, dark mode **dark** `#120C14`.

| Pair | Light | Dark |
|---|---|---|
| Ink on paper | 16.25 Pass | 16.90 Pass |
| Muted on paper | 6.00 Pass | 7.95 Pass |
| Muted on card | 6.56 Pass | 7.42 Pass |
| Accent text on paper | 5.77 Pass | 12.28 Pass |
| Button text on accent | 6.30 Pass | 12.28 Pass |
| sageDeep on sage | 8.27 Pass | 11.42 Pass |
| Coral on paper | 5.15 Pass | 7.69 Pass |
| Yellow on paper | 5.37 Pass | 11.59 Pass |
| Data viz on card (lowest, 3:1) | 3.72 Pass | 8.24 Pass |
