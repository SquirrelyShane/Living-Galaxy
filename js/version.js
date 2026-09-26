/* LIVING GALAXY — Ad Astrum: what this build is.
 *
 * One place, so the tab title, the HUD corner, the creation screen and the
 * relay's start-up banner cannot drift apart from one another.
 *
 * `VERSION` is the product version and nothing else. Data-format versions live
 * with the data they describe — CRADLE_VERSION in js/npc/cradle.js, PACK_VERSION
 * in js/genome/spacer.js, the `.v1` suffix on a storage key — and move on their
 * own schedule, because a save format and a release are different things and
 * tying them together makes both harder to change.
 */
export const NAME = "Living Galaxy";
export const SUBTITLE = "Ad Astrum";
export const VERSION = "0.3.61";

/** "Living Galaxy — Ad Astrum" — the full mark, for a tab title or a banner. */
export const FULL_NAME = `${NAME} — ${SUBTITLE}`;

/** "Living Galaxy — Ad Astrum 0.1" — the mark with the build on it. */
export const BUILD_LINE = `${FULL_NAME} ${VERSION}`;
