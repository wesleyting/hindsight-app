# Changes ready for GitHub

## Suggested commit

```text
feat: add plain-language takeaways and evidence-backed research topics

Separate the quick takeaway and future risk from the full explanation.
Expand details in place and replace long question labels with short topics.
Add targeted deeper research and disable unreliable social-media retrieval.
```

## Changes

- Add structured, source-linked takeaways and conditional future-risk text.
- Remove clipped summaries; show complete sentences and expand detail in place.
- Suggest short topics only when retrieved article text supports an answer.
- Add a clearly labeled action for fresh, deeper research on a selected topic.
- Disable Reddit/social sources with provider exclusions and local URL filters.
- Require company identity in search-result titles and invalidate older research context.
- Preserve history and export the new takeaway/risk alongside detailed answers.
- Add regression coverage for source relevance, disabled Reddit calls and topic validation.

No commit or push performed. Secrets and local research remain ignored by Git.

## Validation

TypeScript, production build and DeepSeek/source-filter regression tests passed. Live TE catch-up produced the separate takeaway/risk and three supported topics; repeated catch-up reused the saved result. Browser checks verified inline detail expansion, topic selection and successful targeted deeper research. No social sources entered the live catch-up. Relevance filtering and citations are not a guarantee of factual accuracy.
