# Siply Business metrics

This document defines what each portal number means. Until the consumer app sends production analytics events to this service, every metric shown by the local demo is sample data and must not be presented to venues as live performance.

| Metric | Event and location | Repeat handling | Time window | Current status |
|---|---|---|---|---|
| Profile views | A guest opens the venue’s public Siply account | One view per account open; bots and known crawlers excluded | Selected 7, 30 or 90 days | Sample |
| Menu views | A guest opens the venue menu | Repeated opens count; rapid refreshes within 30 seconds collapse to one | Selected period | Sample |
| Drink logs | A guest saves a completed drink log linked to a venue menu item | Each completed log counts once; deleted logs are removed | Selected period | Sample |
| Unique visitors | Distinct signed-in guests with a qualifying venue event | One guest per selected period | Selected period | Pro, not sent to Free accounts |
| New visitors | A unique guest with no earlier qualifying visit | One classification per guest | Selected period | Pro sample |
| Returning visitors | A guest with a previous qualifying visit before the current one | One guest per selected period | Selected period | Pro sample |
| Followers | Signed-in guests currently following the venue | Current state, not cumulative | Current total | Pro sample |
| Regulars | Guests with at least three qualifying visits in 60 days | One aggregate segment membership per guest | Rolling 60 days | Pro sample; hidden under five guests |
| At risk | Returning guests with no qualifying visit in 45 days | One aggregate segment membership per guest | Rolling 45 days | Pro sample; hidden under five guests |
| Return rate | Returning visitors divided by all unique visitors | Deduplicated by guest | Selected period | Pro sample |
| Average visits | Qualifying visits divided by returning guests | Deduplicated visit sessions | Selected period | Pro sample |
| Average rating | Mean of submitted venue-linked drink ratings | Latest rating per guest and drink in a session | Selected period | Sample |
| Post views | A post enters the visible viewport for at least one second | One impression per guest, post and session | Lifetime per post | Sample |
| Offer views | A guest opens an offer card | One view per guest and session | Lifetime per offer | Sample |
| Offer saves / taps | A guest taps or saves a live offer | One action per guest and offer per day | Lifetime per offer | Sample |
| Offer redemptions | Not currently recorded | Not applicable | Not applicable | Hidden until a launch method exists |

Audience reporting is aggregate-only. Segments with fewer than five guests must be suppressed and returned as “Not enough data” so an individual cannot be inferred.
