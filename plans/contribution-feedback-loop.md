# Contribution Feedback Loop

## Status

Implemented. Reference only; do not execute.

## Implemented

- Slice A: `src/lib/contribution-feedback.ts` summarizes recent helpful votes, targeted questions, reviews written, cohort activity, and suggested next action.
- Slice B: `/grow` includes a "Recent contribution impact" recap with a privacy-safe empty state.
- Slice C: helpful-vote and targeted-request notifications use outcome-oriented language and links where appropriate.
- Slice D: weekly digest language now includes contribution impact and founders-helped framing.

## Product Direction Preserved

The loop answers: "What happened because I shared useful vendor knowledge?"

Use lightweight feedback moments on existing surfaces:

- `/grow`: personal impact recap.
- Notifications: immediate "your review helped" moments.
- Activity: cohort-visible contribution movement with aggregate/privacy-safe language.
- Weekly digest: slower summary of contribution outcomes.

## Guardrails

- Do not create a new top-level route for this loop.
- Do not expose private review text.
- Avoid raw point/rank language.
- Keep contribution tags secondary to actual contribution outcomes.
