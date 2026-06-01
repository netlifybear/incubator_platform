# Plans

This folder contains implementation proposals and product direction notes. It is not a single execution queue.

## Recommended Execution Order

| Plan | Status | Next Agent Guidance |
|------|--------|---------------------|
| `ai-seo-geo-reviews.md` | Ready for a narrow implementation pass | Implement public vendor review JSON-LD first. Treat `llms.txt` as optional/experimental, not required. |
| `reciprocity-pipeline.md` | Roadmap | Extract one scoped task before coding. Current best next task is still public vendor JSON-LD. |
| `gamification-rethink.md` | Product direction | Needs UX/product design before implementation. |
| `founder-credit-report.md` | Concept/spec | Needs privacy/scope decisions before implementation. |
| `nav-regroup-hubs.md` | Implemented | Reference only. Do not execute. |

## Current Recommendation

The next executable task is:

1. Add `Product`, `AggregateRating`, and `Review` JSON-LD to public vendor pages.
2. Use only public consumer reviews in anonymous/public structured data.
3. Keep founder reviews private unless there is an explicit product decision to expose selected founder review content publicly.
4. Defer `llms.txt` unless it is a very low-cost experiment after JSON-LD is complete.

## Notes For Agents

- Check the current code before following any plan. Some plans intentionally document completed or deferred work.
- Prefer `docs/product.md`, `docs/traceability.md`, `README.md`, and `OPERATING.md` for durable project truth.
- Do not implement roadmap-scale items from a plan without first extracting a small, verifiable task.
