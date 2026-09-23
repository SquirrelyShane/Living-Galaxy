/* Living Galaxy — CONSOLE › CORP › ACCOUNT: the pilot that follows you.
 *
 * Sign in to living-galaxy.com from inside the game, see what the account
 * holds, sync now, and — the only screen that ever asks — choose between two
 * copies of a pilot when both this device and the account moved. Everything
 * else is js/account.js; this file is the buttons.
 */

import { el, section, note, row, button, group, card } from "../kit.js";
import { account, accountLine, signIn, signOut, sync, resolve, takeNewer, checkRemote, loadBoard, SITE_LINK } from "../../account.js";

const fmtWhen = (t) => {
  if (!t) return "—";
  const d = new Date(typeof t === "number" && t < 1e12 ? t * 1000 : t);
  return isNaN(d) ? "—" : d.toLocaleString();
};

export function mountAccount(root, ctx) {
  const head = section("ACCOUNT");
  const line = row(head, "Status", { value: accountLine() });
  root.append(head);

  const body = el("div");
  root.append(body);
  let painted = "";

  const paint = () => {
    /* the key is WHICH card, not the status text: a refused sign-in must not
     * rebuild the card and throw away what the pilot typed — the status row
     * carries the words */
    const kind = account.site === false ? "offline" : account.site === null ? "probing" : !account.user ? "signin" : account.conflict ? "conflict" : "in";
    const key = `${kind}|${account.user?.username ?? ""}|${account.user?.verified ?? ""}|${account.version}|${Boolean(account.newer)}`;
    line.value.textContent = accountLine();
    line.value.className = `v ${account.status === "error" || account.status === "conflict" ? "hot" : account.status === "synced" ? "good" : ""}`;
    if (key === painted) return;
    painted = key;
    body.innerHTML = "";
    if (account.site === false) return mountOffline(body);
    if (account.site === null) return note(body, "Looking for the site…");
    if (!account.user) mountSignIn(body, paint);
    else if (account.conflict) mountConflict(body, paint);
    else mountSignedIn(body, paint);
    mountBoard(body);
  };
  paint();
  ctx.push(paint);
}

/** 0.3.43 — TOP PILOTS: the site's board, by purse, callsigns only. Fetched
 * when the card builds; a site without one shows nothing. */
function mountBoard(body) {
  const c = card("TOP PILOTS", "by purse, across every account");
  const holder = el("div");
  c.body.append(holder);
  const paintBoard = (b) => {
    holder.innerHTML = "";
    if (!b) { note(holder, "The board is not up yet."); return; }
    if (!b.pilots.length) { note(holder, "Nobody has synced a pilot yet — be the first."); return; }
    for (const p of b.pilots) row(holder, `${p.rank}. ${p.callsign}`, { hint: [p.career, p.sky].filter(Boolean).join(" · "), value: `${(p.credits | 0).toLocaleString()} cr` });
    if (b.total > b.pilots.length) note(holder, `…and ${b.total - b.pilots.length} more on the site.`);
  };
  paintBoard(account.board);
  loadBoard().then(paintBoard);
  const a = el("a", "tbtn", "THE BOARD");
  a.href = `${SITE_LINK}/pilots`; a.target = "_blank"; a.rel = "noopener";
  c.body.append(group(a));
  body.append(c.card);
}

function mountOffline(body) {
  const c = card("No account behind this server", "this copy of the game is served from a phone or a plain host");
  note(c.body, `Play from ${SITE_LINK.replace("https://", "")}/play/ and your pilot — hulls, corp, refits, ARIA's net — follows you between devices. Nothing on this device is lost either way; the account is a copy that lives on the site.`);
  const a = el("a", "tbtn", "OPEN THE SITE");
  a.href = SITE_LINK; a.target = "_blank"; a.rel = "noopener";
  c.body.append(group(a));
  body.append(c.card);
}

function mountSignIn(body, paint) {
  const c = card("Sign in", "your living-galaxy.com account");
  const user = el("input", "tinput"); user.placeholder = "username or email"; user.autocomplete = "username"; user.autocapitalize = "none";
  const pass = el("input", "tinput"); pass.type = "password"; pass.placeholder = "password"; pass.autocomplete = "current-password";
  const msg = el("p", "dim", "");
  const go = button("SIGN IN", async () => {
    go.disabled = true; msg.textContent = "…";
    const ok = await signIn(user.value.trim(), pass.value);
    go.disabled = false;
    msg.textContent = ok ? "" : account.error || "refused";
    if (ok) pass.value = "";
    paint();
  }, "accent");
  pass.addEventListener("keydown", (e) => { if (e.key === "Enter") go.click(); });
  c.body.append(group(user), group(pass), group(go), msg);
  const reg = el("a", "tbtn", "CREATE AN ACCOUNT");
  reg.href = `${SITE_LINK}/register`; reg.target = "_blank"; reg.rel = "noopener";
  const forgot = el("a", "tbtn", "FORGOT PASSWORD");
  forgot.href = `${SITE_LINK}/reset`; forgot.target = "_blank"; forgot.rel = "noopener";
  c.body.append(group(reg, forgot));
  note(c.body, "The account carries the pilot: callsign, corp, fleet, refits, robots, missions, drones, ARIA's flying. Sound, rock quality and the shared sky's people stay on the device.");
  body.append(c.card);
}

function mountSignedIn(body, paint) {
  const u = account.user;
  const c = card(u.username, u.verified ? `synced to version ${account.version || "—"}` : "email not verified yet");
  row(c.body, "Last sync", { value: account.lastSync ? fmtWhen(account.lastSync) : "—" });
  row(c.body, "Account version", { value: account.version ? `v${account.version}` : "none yet" });
  if (!u.verified) note(c.body, "Open the link in the verification email, then SYNC NOW. Until then the account cannot hold a save.");
  const acts = [];
  if (account.newer) {
    note(c.body, `A newer copy (v${account.newer.version}${account.newer.callsign ? `, ${account.newer.callsign}` : ""}) was written from another device. Taking it replaces this device's pilot and reloads.`);
    acts.push(button("TAKE THE NEWER COPY", async () => { await takeNewer(); paint(); }, "accent"));
  }
  acts.push(button("SYNC NOW", async () => { await sync({ force: true }); if (!account.conflict) await checkRemote({ auto: false }); paint(); }, account.newer ? "" : "accent"));
  acts.push(button("SIGN OUT", async () => { await signOut(); paint(); }));
  c.body.append(group(...acts));
  const a = el("a", "tbtn", "ACCOUNT PAGE");
  a.href = `${SITE_LINK}/account`; a.target = "_blank"; a.rel = "noopener";
  c.body.append(group(a));
  body.append(c.card);
}

function mountConflict(body, paint) {
  const k = account.conflict;
  const c = card("Two copies of this pilot", "both this device and the account changed since they last agreed — pick one");
  const side = (title, d, when) => {
    const s = el("div", "tcard");
    s.append(el("div", "head"));
    s.firstChild.append(el("b", null, title));
    const b = el("div", "body");
    row(b, "Callsign", { value: d.callsign || "—" });
    if (d.purse != null) row(b, "Purse", { value: `${d.purse.toLocaleString()} cr` });
    if (d.corp) row(b, "Corp", { value: d.corp });
    if (d.credits != null) row(b, "Treasury", { value: `${d.credits.toLocaleString()} cr` });
    if (when) row(b, "Written", { value: fmtWhen(when) });
    s.append(b);
    return s;
  };
  c.body.append(side("THIS DEVICE", k.local, null), side(`THE ACCOUNT (v${k.server.version})`, k.server, k.server.updatedAt));
  c.body.append(group(
    button("KEEP THIS DEVICE", async () => { await resolve("device"); paint(); }, "accent"),
    button("USE THE ACCOUNT COPY", async () => { await resolve("account"); paint(); }, "danger"),
  ));
  note(c.body, "KEEP THIS DEVICE overwrites the account with what is here. USE THE ACCOUNT COPY replaces this device's pilot and reloads the game. Neither touches the other device until it syncs and gets the same question.");
  body.append(c.card);
}
