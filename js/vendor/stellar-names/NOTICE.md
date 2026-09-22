# Stellar Names — vendored into Living Galaxy

Two third-party things live here, under their own licences. Keep this file,
and both licence files, with them.

## The generator

**Stellar Names 1.2** — `index.js`. MIT, © 2026 Stellar Names contributors.
Full text in `LICENSE-stellar-names-MIT.txt`.

**Changes from upstream**, both about payload on a phone:

1. The `human-names.js` import and the `HUMAN_NAMES` re-export are removed.
   That file is the optional 1.97 MB FinNLP pool, reachable only through
   `humanSource: 'finnlp'`, and it is unclassified — no gender labels — which
   is not what this game wants. `humanSource` now accepts `'arincli'` only and
   throws a `RangeError` on anything else rather than silently falling back to
   a pool that is no longer there.
2. Nothing else. Same generator, same API, and the same sequence for a given
   seed, so upstream's determinism guarantees still hold.

## The name data

**ARIN `arincli` name lists** — `classified-names.js`. Apache-2.0. Full text in
`LICENSE-arincli-Apache-2.0.md`.

- Repository: https://github.com/arineng/arincli
- Pinned commit: `376fd36e115b088cc3c26e63c4ae44187956c091`

Upstream counts and hashes, as published by Stellar Names:

| file | entries | sha256 |
| --- | ---: | --- |
| `male-first-names.txt` | 1,219 | `4e8af54dc9968adbfef33ab3911970111c7a5044d7217343245ba0d1fe948cec` |
| `female-first-names.txt` | 4,275 | `e61a9b08f11c2b7882062dd71f0c6685a4e150358baa2a623d02385d17be8375` |
| `last-names.txt` | 88,799 | `a39e331fed8145943b9cb34b04210fa1fb548068a5fb287c1c7c0cd1708969b6` |

**Transformations applied.** Apache-2.0 §4(b) asks that modifications be
stated, so:

- *By Stellar Names:* trim whitespace, skip blank lines, lowercase then
  title-case, deduplicate exact normalised names preserving source order.
  Title-casing does not reconstruct special capitalisation such as McDonald.
- *By this project,* in `classified-names.js`, in this order:
  1. Every list is filtered through the game's own `offensive()` check
     (`js/names.js`), so no name the game ships can trip it. This removes a
     few real names as collateral — Assunta and Douglass both contain "ass" —
     taking the lists to 1,217 male, 4,274 female and 88,375 surnames.
  2. The surname list is then trimmed to 8,000, sampled at a fixed stride
     across the alphabetical source. A stride rather than a head, so the
     sample keeps the whole alphabet and the whole range of name shapes.
     Deterministic, so the trim is reproducible from the upstream file.

  First-name lists are otherwise complete and in source order.

The full 88,799-entry list and the FinNLP pool are not redistributed here.

## What these are not

Names are sampled uniformly, with no frequency weighting and no culture
matching. The `male` / `female` labels are the source files' own, and are a
naming convention in that dataset rather than a statement about any real
person. Generated names are fictional combinations.
