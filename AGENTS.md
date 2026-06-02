<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:state -->
# Session State

## Last Session: Phase B — Structured Credibility Report

### What Was Done
- **7 sections reordered**: Credibility Summary (1st) → Identity & Cohort (2nd) → Review History (3rd) → Contribution Signals (4th) → Helpfulness & Peer Validation (5th → NEW) → Backlink Authority (6th) → Export & Verification (7th)
- **New data fields**: `impact.helpfulVoteCount` (from `getFounderImpactSummary`), `helpfulVoterCount` (distinct users), `detailedCommentCount`, `reviewFreshnessLabel` (relative date)
- **Identity section**: added "Email Verified" row, moved verifiable tag + hash from header
- **Review History**: removed Helpful Vote Ratio & Quality Score Trend (moved to Section 5), added detailed-comment count, review freshness, "Firsthand Experience Rate" label
- **Contribution Signals**: renamed from "Contribution Tag Proof", subtitle now "Contribution markers and tags earned on the platform"
- **Helpfulness section**: new section with vote ratio, quality trend, vote count, distinct voters
- **Export section**: renamed "Export & Verification"
- **Files changed**: `src/app/founder/[slug]/credibility/page.tsx` (full rewrite), `plans/README.md`
- **TypeScript**: `npx tsc --noEmit` clean
- **Tests**: 21/21 pass

### DB Status
- Schema already in sync — `npx prisma db push --accept-data-loss` no-op

### What Still Uses "Badge" (Internal Only)
- Component names, function names, variables, import paths, file names, route paths, form field values — all internal, no UI copy
<!-- END:state -->
