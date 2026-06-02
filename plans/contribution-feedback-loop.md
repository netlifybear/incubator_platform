# Contribution Feedback Loop

## Status

Slice A+B implemented. Later notification and digest work remains deferred and should be planned as separate small slices.

## Implemented

- `src/lib/contribution-feedback.ts` summarizes recent helpful votes, targeted questions, reviews written, cohort activity, and suggested next action.
- `/grow` includes a "Recent contribution impact" recap with a privacy-safe empty state.
- Existing tests cover recent feedback summary behavior.

## Product Direction

The loop should answer: "What happened because I shared useful vendor knowledge?"

Use lightweight feedback moments on existing surfaces:

- `/grow`: personal impact recap, already implemented.
- Notifications: immediate "your review helped" copy, deferred.
- Activity: cohort-visible contribution movement, using aggregate/privacy-safe language.
- Weekly digest: slower summary of contribution outcomes, deferred.

## Deferred Slices

### Slice C: Notification Copy And Links

- Audit helpful-vote and request notifications.
- Use outcome language such as "Your review helped another founder evaluate a vendor."
- Link to vendor or review context when available and privacy-safe.
- Add tests only where notification creation behavior changes.

### Slice D: Weekly Digest Language

- Update `generateDigestForFounder()` and digest email copy toward outcomes.
- Keep HTML simple and email-client compatible.
- Do not add a new email template system.

## Guardrails

- Do not re-run Slice A+B.
- Do not create a new top-level route.
- Do not expose private review text.
- Avoid raw point/rank language.
- Keep badges secondary to actual contribution outcomes.
