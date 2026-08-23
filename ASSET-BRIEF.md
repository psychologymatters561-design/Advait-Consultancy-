# Corridor Drive — Asset Brief

The homepage renders its corridor **procedurally** — no footage required, and it
is complete and shippable as it stands. This brief is for replacing that render
with your own material. Nothing here is a prerequisite for launch.

Everything drops into `media/corridor/`. No code changes are needed.

---

## 1. The shot

One continuous forward drive down an expressway, shot from a vehicle or drone,
travelling *toward* infrastructure — an interchange, a flyover, a skyline, ideally
the Jewar / Yamuna Expressway or Dwarka Expressway corridor.

The page is a journey from night to daylight to dusk. Two ways to get there:

| Option | What to shoot | Effort |
|---|---|---|
| **A — one golden-hour pass** *(recommended)* | A single unbroken drive at sunrise, ~60–90 seconds. Natural light change does the work. | One morning |
| **B — three passes** | Same stretch at pre-dawn, mid-morning, and dusk. I cross-dissolve them across the scroll. | Three sessions |

### Framing
- **Camera dead-centre in the lane**, horizon on the upper third, road filling
  the lower two-thirds. The vanishing point must sit near the centre of frame —
  the headlines are laid over it and the composition depends on that symmetry.
- **Locked orientation.** No pans, no whip turns, no handheld drift. A gimbal or
  a windscreen mount is essential; the page scrubs frame-by-frame, so any shake
  becomes very obvious under a slow scroll.
- **Straight sections only.** Gentle curves are fine; sharp bends break the
  illusion of a single continuous corridor.
- **Wide lens**, roughly 24–35 mm full-frame equivalent. Avoid fisheye.

### Movement
- Constant speed, **60–80 km/h**. Slower reads as stately; faster strobes when
  scrubbed.
- No braking, no lane changes, no overtaking within the take.

### What to avoid
- Number plates, faces, and identifiable branding — this page has no model
  releases behind it.
- Heavy traffic. An empty or near-empty road is the point: the corridor should
  feel like it is waiting for what is coming.
- Rain on the windscreen, wiper sweeps, dashboard reflections.

---

## 2. Delivery

Give me **either** and I will do the rest:

- the original clip — `.mov` / `.mp4`, highest quality available, or
- a pre-extracted frame sequence per the spec below.

### Frame sequence spec

| Property | Value |
|---|---|
| Format | WebP, quality 82 (AVIF also fine) |
| Dimensions | 1920 × 1080, or 2560 × 1440 for very large displays |
| Count | **160–200 frames** for the whole page |
| Naming | `frame-0001.webp` … `frame-0200.webp`, zero-padded to 4 digits |
| Location | `media/corridor/` |
| Total budget | **under 6 MB** for the whole sequence |

200 frames is the ceiling, not a target. Below ~120 the scrub starts to judder;
above ~200 you are paying bandwidth for frames nobody perceives.

Extraction from a 60-second clip, if you want to do it yourself:

```bash
ffmpeg -i drive.mov -vf "fps=3,scale=1920:-2" -q:v 82 media/corridor/frame-%04d.webp
```

Then set `count` in `media/corridor/manifest.json` to the number of files
produced. That single number is the switch — the page picks up the sequence on
the next load and falls back to the procedural corridor if anything is missing.

---

## 3. Stills (optional, separate)

If you would rather add photography than footage, the useful shots are:

1. **One corridor landscape** — land with infrastructure crossing it, shot at
   golden hour. Wide, horizon-led, no people.
2. **One interior** — the New Delhi office or a meeting setting, shot dark and
   quiet, available light only. Used nowhere yet; would support a future
   "practice" chapter.
3. **A replacement `og.png`** — 1200 × 630, the share card.

Do not send stock-looking interiors or handshake photography. The page's whole
argument is that Advait is not a brokerage, and the imagery has to hold that line.

---

## 4. What happens if you send nothing

The page ships exactly as it is: a corridor drawn in code, roughly 40 KB, sharp
at every resolution, that costs no bandwidth and cannot go out of date. The
footage path exists because you asked for it — it is an upgrade, not a debt.
