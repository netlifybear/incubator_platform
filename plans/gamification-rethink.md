# Gamification Rethink: Impact Over Points

## Status

Product direction. The first impact-over-points implementation pass is complete; remaining work needs UX/product design before code changes.

## Implemented Direction

- `/grow` leads with personal impact metrics from `getFounderImpactSummary()`.
- `/leaderboard` is framed as a private cohort contribution dashboard without visible point totals or rank positions.
- `/rewards` explains credibility ingredients such as review detail, contribution signals, and peer validation.
- Points remain internal for ordering, reputation export, credibility APIs, and compatibility.
- Auto-badges run through the badge computation engine on review submit, profile update, and cron.

## Product Frame

The platform should answer: "Can I trust this founder's review?"

| Hub | Signal | What It Measures |
|-----|--------|------------------|
| Write | Experience and detail | Did they use the vendor, and is the review substantive? |
| Connect | Social proof | Did peers find the contribution useful? |
| Grow | Track record | What has this founder contributed over time? |

## Remaining Product Work

- Badge/contribution-signal taxonomy: consider presenting badges as descriptive contribution tags instead of achievement trophies.
- Streak milestones: scope separately after observing real use.
- Connect inline answering: design the workflow before implementation.
- Grow SEO alignment: revisit after Grow's data model settles.
- Credit report verification polish: optional; keep separate from the impact dashboard.

## Guardrails

- Avoid visible points, rank, and level-up language as primary motivation.
- Keep point computation available internally.
- Prefer contribution outcomes over game mechanics.
- Do not execute taxonomy or streak changes without a focused UX plan.
