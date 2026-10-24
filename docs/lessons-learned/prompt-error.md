# AI Reliability — Unsupported Claims in Generated Replies

## Issue discovered

While testing Context AI's AI Support Copilot using GroqCloud (`openai/gpt-oss-120b`), I noticed that the model sometimes generated customer replies claiming actions had already been completed.

For example, when testing a payment system outage, the AI generated:

> "Our team has escalated this as a high-priority incident and is actively investigating the cause."

However, Context AI had not actually escalated the ticket or initiated an investigation. The model was presenting recommended actions as completed actions.

## Attempted fix

I updated the system prompt to explicitly instruct the model to:

- Assume no support agent has taken action yet.
- Avoid claiming that an issue has already been escalated or investigated.
- Distinguish between recommended actions and completed actions.
- Avoid promising updates or resolution times without confirmation.

## Retesting

After updating the prompt, I ran the classifier again using the same payment outage scenario.

The issue persisted. The generated reply still included:

> "Our team is actively investigating the issue and has escalated it to the appropriate specialists."

This demonstrated that **prompt instructions alone were insufficient to reliably prevent unsupported claims**.

## What I learned

Zod successfully validates the structure of the AI's JSON response, but it cannot determine whether the generated content is factually accurate.

A response can pass schema validation while still containing misleading information.

## Next steps

- Keep suggested replies as drafts requiring human review.
- Add safeguards to detect potentially unsupported claims about completed actions.
- Consider separating response generation from verified ticket state, so the model only references actions confirmed by the application.
- Create test cases for common failure scenarios, including invented escalations, refunds and resolution promises.

**Status:** Issue reproduced after prompt revision. Further safeguards not yet implemented.