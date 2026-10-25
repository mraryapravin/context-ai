# Planned Feature: Intelligent Ticket Prioritisation

## The idea

Currently, Context AI displays customer support tickets in the order they were submitted, with the newest tickets appearing first.

The problem with this is that the newest ticket isn't necessarily the most important one.

For example, a customer asking a general question shouldn't necessarily appear above someone reporting that their payment system has stopped working, even if the general question was submitted more recently.

I want to improve this by introducing a priority scoring system that helps support staff identify which tickets need attention first.

## How I plan to approach it

My idea is to give each ticket a score between 0 and 100, calculated using a few different factors:

- **AI urgency:** How serious or time-sensitive the actual issue is.
- **Escalation risk:** How likely the issue is to require further attention.
- **Customer priority:** How important the customer considers their issue.
- **Ticket age:** How long the ticket has been waiting.

Each factor would have a different weighting. For example, AI urgency would probably have the biggest influence because a serious outage should take priority over a minor complaint.

However, I don't want to rely entirely on the AI's assessment. Customer priority and waiting time should also matter.

One thing I particularly want to avoid is older, lower-priority tickets being ignored indefinitely just because newer, more urgent tickets keep arriving.

## How I might implement it

I'll start by writing a function that calculates a score based on these factors.

The AI classification is already being saved to PostgreSQL, so I can use the urgency and escalation risk values that Context AI currently generates.

I'll then update the ticket inbox so staff can sort tickets by their calculated priority rather than only by submission date.

I'd also like to display the score alongside each ticket, potentially with a colour indicating how urgent it is.

I'll need to decide how to handle tickets where AI classification fails, and how to keep scores accurate as tickets get older.

## Why I want to build this

I think this is an important improvement because it makes Context AI more useful as an actual support management tool.

At the moment, the AI can analyse a ticket and recommend what to do, but staff still have to manually decide which ticket to look at first.

With priority scoring, the application could help with both understanding individual tickets and organising the overall workload.

It also gives me an opportunity to work on something beyond calling an AI API, including designing a scoring algorithm, thinking about trade-offs, and testing how the system behaves in different situations.

## Things I want to test

Before considering the feature complete, I want to check that:

- A critical service outage ranks above a routine question.
- A customer's chosen priority doesn't automatically override the actual severity.
- Older tickets gradually receive more attention.
- Tickets without AI analysis can still be ranked.
- Resolved tickets don't unnecessarily compete with unresolved ones.

I also want to test whether the scoring system produces sensible results across a variety of example tickets, rather than assuming my initial weightings are correct.

## Current status

**Planned — not yet implemented.**

The existing AI classification system provides a starting point, but the scoring formula, ticket ranking and interface changes still need to be built and tested.



## Initial idea for socring algorithm

\[
S = 0.45U + 0.25E + 0.15C + 0.15A
\]


Factor and weight
AI urgency (U)	: 45%
Escalation risk (E)	: 25%
Customer priority (C) : 15%
Ticket age (A) : 15%

So each factor would be converted to a value between 0 and 100.