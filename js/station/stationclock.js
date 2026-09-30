export const CLOCK = {
  hourS: 30,
  dayH: 24,
  weekD: 7,
  startHour: 6,
};
export const DAY_S = CLOCK.hourS * CLOCK.dayH;
export const WEEKDAYS = ["Firstday", "Seconday", "Thirday", "Fourthday", "Fifthday", "Sixthday", "Restday"];

export const SHIFTS = {
  day: { id: "day", label: "day shift", start: 6 },
  swing: { id: "swing", label: "swing shift", start: 14 },
  night: { id: "night", label: "night shift", start: 22 },
};
export const SHIFT_IDS = ["day", "swing", "night"];

export function hoursAt(t) {
  return Math.max(0, t ?? 0) / CLOCK.hourS + CLOCK.startHour;
}

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

export function hoursIntoShift(start, H) {
  return (((H - start) % CLOCK.dayH) + CLOCK.dayH) % CLOCK.dayH;
}

export function secondsUntilHour(t, hour) {
  const H = hoursAt(t);
  const into = hoursIntoShift(hour, H);
  const left = into === 0 ? 0 : CLOCK.dayH - into;
  return left * CLOCK.hourS;
}

export function clockLine(t) {
  const c = clockAt(t);
  return `D${c.day} ${c.hhmm} · ${c.part === "day" ? "DAY" : c.part.toUpperCase()}`;
}
