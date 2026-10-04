# Search indexing policy

Production origin: `https://dear-day.com`.

## Public pages

The homepage, Arabic/English occasion directories, gifts, cake, venues and
partners pages are indexable. Each has a unique description and an absolute
self-referencing canonical without a query string. The homepage canonical is
`/`, including when reached through `/index.html`.

Only these seven canonical URLs belong in `sitemap.xml`. Do not add unavailable
pages, checkout steps, query variants or invented modification dates.

## Booking pages

Birthday-Approved is a stateful planning template used for birthdays,
anniversaries, engagements and proposals. It is not yet a dedicated birthday
search landing page. It, Details, Cart, Review and Payment use `noindex, follow`
on both clean URLs and parameterized URLs and stay out of the sitemap.
Their canonicals identify their own clean page, never the homepage.

## Query strings

`flow`, `dd`, `directStart`, `standalone`, budget and selection parameters carry
booking state; they do not create separate search landing pages. Public catalog
variants canonicalize to the corresponding clean catalog URL. Booking-template
variants (including `occasion=birthday`) remain noindex. Do not remove parameters
or redirect visitors: the existing booking flow still needs them.

Canonical is a search hint, not a guarantee that a variant cannot be indexed.
Noindex is not authentication or a privacy boundary.

## Crawling and future launch

Robots allows crawling so search engines can read canonical and noindex metadata.
It points to the production sitemap. Do not disallow the noindex pages or block
all query strings: that would prevent crawlers from reading those directives.

Before adopting a custom domain, update all canonicals and the sitemap reference
together with the domain redirects. Revisit indexability as real catalog data
and dedicated occasion landing pages replace the demonstration/planning views.
Analytics, Search Console setup, social metadata and unfinished navigation links
are separate follow-up tasks.
