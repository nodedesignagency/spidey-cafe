# Media

These four files are **not in the repo** and must be dropped in here:

| file | what it is |
| --- | --- |
| `cup-empty.jpg` | empty cup in the web — the `idle` hero and the pour's start keyframe |
| `cup-filled.jpg` | the finished drink — the `ready` hero and the pour's end keyframe |
| `pour.mp4` | 5s 1080p 9:16 pour clip (H.264) |
| `pour.webm` | smaller VP9 fallback for browsers built without H.264 |

The app runs without them: the pour has a fallback timer, so the
`idle -> pouring -> ready` flow still completes, just with empty hero frames.

## Why they are missing

The session that built this had read-only git credentials, so the commits were
pushed through the GitHub API instead. That API path takes file content as text
and cannot carry binary safely.

## How they were made

All three were generated with Magnific:

1. `cup-empty.jpg` — Seedream 5 Pro, 9:16, prompting for an empty domed-lid cup
   cradled in a spider web on a warm cream plaster wall with diagonal sunlight.
2. `cup-filled.jpg` — Seedream 5 Pro again, **with the empty cup passed as an
   image reference**, changing only the cup contents. This is what keeps the
   web, wall, lighting and framing identical between the two ends.
3. `pour.mp4` — Kling 2.5, 1080p, 9:16, 5s, with those two stills locked as
   `keyframes.start` and `keyframes.end`. Because the clip ends on the same
   frame the `ready` state shows, there is no visible seam when it stops.
4. `pour.webm` — `ffmpeg -c:v libvpx-vp9 -crf 40 -vf scale=540:-2 -an`.

Giving each drink its own real pour means one more clip per drink: same
generation, different prompt and end frame.
