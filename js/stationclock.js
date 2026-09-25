/* LIVING GALAXY — port standard time (0.3.52).
 *
 * The sky had one clock, `sim.time` in seconds, and one rhythm on top of it:
 * the 90-second CYCLE that payroll and the company books run on. Nothing had a
 * day. So nothing could have a shift, a night, a meal, or a weekend, and a
 * settled hand "working at the port" was a number arriving every 90 seconds.
 *
 * PORT STANDARD TIME is the shared clock every port keeps:
 *
 *   an HOUR is 30 s of sky time    a DAY is 24 hours = 12 minutes at ×1
 *   a CYCLE (payroll) is 3 hours   a WEEK is 7 days
 *
 * Day 1 opens at 06:00 when the sky's clock is zero, so a fresh sky starts on
 * the morning shift. Three eight-hour shifts: DAY 06–14, SWING 14–22, NIGHT
 * 22–06. The day has parts for the lights: NIGHT 22–05, DAWN 05–07, DAY 07–19,
 * DUSK 19–22. In the shared sky every client runs `now − born`, so everyone is
 * on the same hour by construction.
 *
 * Pure: no DOM, no imports. Everything that wants the time asks this.
 */

export const CLOCK = {
  hourS: 30,          // sky seconds per port hour
  dayH: 24,
  weekD: 7,
  startHour: 6,       // the hour sky time zero falls on
};
export const DAY_S = CLOCK.hourS * CLOCK.dayH;   // 720
export const WEEKDAYS = ["Firstday", "Seconday", "Thirday", "Fourthday", "Fifthday", "Sixthday", "Restday"];

export const SHIFTS = {
  day: { id: "day", label: "day shift", start: 6 },
  swing: { id: "swing", label: "swing shift", start: 14 },
  night: { id: "night", label: "night shift", start: 22 },
};
export const SHIFT_IDS = ["day", "swing", "night"];

/** Absolute port hours since the epoch (fractional). */
export function hoursAt(t) {
  return Math.max(0, t ?? 0) / CLOCK.hourS + CLOCK.startHour;
}

/**
 * → { day (1-based), week (1-based), dow (0-6), weekday, hour (0-23), minute,
 *     hhmm "14:20", part, isNight, shift, label "D3 · 14:20" }
 */
export function clockAt(t) {
  const H = hoursAt(t);
  const dayIx = Math.floor(H / CLOCK.dayH);
  const hf = H - dayIx * CLOCK.dayH;
  const hour = Math.floor(hf);
  const minute = Math.floor((hf - hour) * 60);
  const dow = dayIx % CLOCK.weekD;
  const part = hour >= 22 || hour < 5 ? "night" : hour < 7 ? "dawn" : hour < 19 ? "day" : "dusk";
  const shift = hour >= 6 && hour < 14 ? "day" : hour >= 14 && hour < 22 ? "swing" : "night";
  const hhmm = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return {
    day: dayIx + 1, week: Math.floor(dayIx / CLOCK.weekD) + 1, dow, weekday: WEEKDAYS[dow],
    hour, minute, hhmm, part, isNight: part === "night", shift, label: `D${dayIx + 1} · ${hhmm}`,
  };
}

/** Hours into a shift that starts at `start` (0..24) at absolute hour H. */
export function hoursIntoShift(start, H) {
  return (((H - start) % CLOCK.dayH) + CLOCK.dayH) % CLOCK.dayH;
}

/** Sky seconds until the next occurrence of `hour` o'clock. */
export function secondsUntilHour(t, hour) {
  const H = hoursAt(t);
  const into = hoursIntoShift(hour, H);
  const left = into === 0 ? 0 : CLOCK.dayH - into;
  return left * CLOCK.hourS;
}

/** A one-line reading for a HUD or a deck header. */
export function clockLine(t) {
  const c = clockAt(t);
  return `D${c.day} ${c.hhmm} · ${c.part === "day" ? "DAY" : c.part.toUpperCase()}`;
}
