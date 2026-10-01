# Ceyvora Phase 1 design

Palette: tropical green #163F35, canopy #28614E, sand #E4C78C, warm white #FAF9F5, charcoal #263630, muted grey-green #65736B.

Typography: Georgia for spacious travel headings, locally available Segoe UI/system sans for navigation, forms and supporting copy. No external font dependency.

Layout: a full-width Sri Lankan landscape opens the page, with left-aligned copy and an unobstructed view on the right. Quiet, wide margins lead into destination photography, tour cards, a dark green experience gallery, genuine traveller stories and a planning invitation.

```text
brand          navigation          login / plan
landscape: headline + actions          open view
intro                         destination link
destination grid (4 / 2 / 1)
journey heading                    tours link
tour cards (3 / 2 / 1)
four concise service principles
green experience gallery (4 / 2 / 1)
approved reviews / honest empty state
planning invitation
brand                  explore        support
```

Use one shared alignment grid (1200px maximum), readable line lengths, generous spacing and modest rounding. Mobile navigation is a disclosure, not an overlay that traps content. Focus must remain visible; reduce motion when requested.

Review before implementation: green, warm white and a serif follow the requested brand direction. Avoid generic decorative counters, invented statistics, testimonial quotations and repeated eyebrow labels. The Sri Lankan photography is the dominant visual; keep the surrounding UI quiet. API images take precedence; absent images get an explicitly labelled illustrative fallback, never invented destination records.

# Phase 2 extension

Keep the Phase 1 palette, type, spacing, navigation and homepage composition. Listings use a clear search row, expandable labelled filters and the existing card grid. Details use a large landscape followed by an editorial reading column and a compact planning panel. Itinerary day numbers convey real sequence; reviews remain literal approved API content.

```text
listing: header / search + sort / filters / results / page controls
 detail: breadcrumbs / title + summary / wide image
         description + itinerary     duration / price / plan
         included places / approved reviews / enquiry CTA
```

Review: preserve the established identity rather than introducing another card system. No invented highlights, destination facts or photo galleries. Use native details/summary for itinerary and filter disclosure. Stack filter controls and the planning panel on narrow screens, and keep long API text wrappable.

# Editorial visual refinement

Palette: forest #163F35, leaf #28614E, sand #E4C78C, paper #FAF9F5, white #FFFFFF, charcoal #263630. Retain the existing Georgia display/system sans pairing; enlarge headings and give body copy more breathing room.

Layout: left-aligned near-viewport landscape hero, paper introduction overlapping its lower edge, portrait destination photography with names overlaid, wide tour imagery, and a staggered experience gallery. Detail pages lead with full-width photography and a calm reading column below.

```text
home: overlay nav / expansive landscape + headline / overlapping paper introduction
      portrait destinations / wide journeys / quiet benefits / staggered photo gallery
      stories / restrained invitation / spacious forest footer
detail: breadcrumb / cinematic photo + title / overview + planning / places / itinerary timeline
```

Review: avoid repeating identical rounded panels. Portrait destinations have captions outside the image; tours retain clear price/CTA rows. Gradients are limited to text legibility on photos. No invented metrics, decorative icons or new API data. Preserve responsive controls and functional states.

## Phase 3 customer experience

Continue forest #163F35, leaf #28614E, sand #E4C78C, paper #FAF9F5, white #FFFFFF and charcoal #263630. Georgia headings and the existing readable sans body maintain continuity. Left-align forms and account content, with comfortable line lengths.

```text
authentication: tea-country photograph | welcome + spacious labelled form
account: quiet navigation | personal greeting / useful links / beach photograph
booking: selected journey photograph + summary | dates, travellers and contact form
history: photographic journey rows / distinct request status / detail link
```

Review against brief: use real personal information and travel requests; no metrics, admin panels, profile editing or payment controls. The photographic split is reserved for authentication and booking rather than enclosing every section in cards. On mobile, content follows one comfortable column; traveller counts share a row. Existing public pages retain their layout.
