# Founder-As-Vendor Future Plan

Status: Deferred product direction. Do not implement without a focused design pass.

## Product Question

Some founders may also provide services to other founders. It is reasonable to let a founder opt into being discoverable as a vendor/service provider, but this must not collapse founder credibility and vendor trust into the same score.

## Design Principle

Keep two separate ledgers:

```text
Founder credibility = what the founder contributes to the cohort
Vendor trust = how other founders evaluate the founder's service/company
```

Reviews a founder writes for other vendors can build that founder's contributor credibility. Reviews other founders write about the founder's service can build the vendor/service listing's trust. Received vendor reviews should not directly increase the founder's contributor credibility.

## Why Separate The Ledgers?

- Prevent circular incentives where a founder becomes more credible simply by being reviewed as a service provider.
- Preserve the meaning of verified founder credibility: useful contribution, not popularity as a vendor.
- Let founder-service providers benefit from vendor trust without weakening peer-review credibility.
- Make conflicts of interest legible to users and admins.

## Future Scope

- Add an explicit relationship between `User` and `Vendor`, such as `Vendor.ownerUserId`.
- Let a founder opt into service-provider mode from profile settings.
- Show a separate "Also provides services" section on public founder profiles.
- Link owned vendor listings back to the founder profile.
- Block founders from reviewing their own vendor listing.
- Keep reviews received as a vendor out of founder credibility factor calculations.
- Add admin review/approval for founder-owned vendor listings before they appear in the cohort directory.
- Add disclosure copy wherever founder identity and vendor identity meet.

## Non-Goals

- Do not treat received vendor reviews as verified founder contribution.
- Do not auto-create vendor records for every founder.
- Do not merge public profile completeness with vendor rating.
- Do not add this to the current credibility score without a separate policy decision.

## Suggested Implementation Slice

1. Schema and policy: add owner relationship, self-review guard, and tests.
2. Admin workflow: approve or create founder-owned vendor listing.
3. Profile UX: show "provides services" separately from contributor credibility.
4. Vendor UX: show owner/founder link and conflict-of-interest disclosure.
5. Credibility audit: verify received vendor reviews do not affect founder credibility factors.
