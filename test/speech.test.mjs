/* LIVING GALAXY — NPC speech (npc/speech.js over js/speech/npc-speech.js).
 *
 * The band mirrors real hulls and ports; exchanges come out of the speech engine,
 * name real neighbours, never leak the Living Galaxy map, and file memory; talking
 * to a hull answers in character, files regard, and hands it back as standing
 * (gains capped per hull); a sky change is a fresh band; the free-talk call flow
 * routes chips and typed lines through the session's talk node.
 *
 *   node --import ./test/three-register.mjs test/speech.test.mjs
 */

import { sim, launchSim } from "../js/sim.js";
import { makePilot } from "../js/pilot.js";
import { stations } from "../js/stations.js";
import { traffic, stepTraffic } from "../js/npc/traffic.js";
import { flow, stepFlow } from "../js/npc/flow.js";
import { corpById } from "../js/corps.js";
import { speech, resetSpeech, syncBand, chatter, talkTo, regardOf, speechName, talkChips, noteLost, speechStats, localise, SPEECH_SCALE } from "../js/npc/speech.js";
import { CALIBRATION, runGrammarSelfTest } from "../js/speech/npc-speech.js";
import { CallSession, CallState } from "../js/comms/call-session.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  FAIL", m); } };

/* the vendored engine is intact */
{
  const g = runGrammarSelfTest({ verbose: false, iterations: 300 });
  ok(g.fail === 0, `speech grammar self-test green (${g.pass} cases)`);
}

ok(speechName("Clamshell Mk II ORTEGA-42") === "Ortega 42", "callsign → speech name");
ok(speechName("MV TAMARIN 14") === "Tamarin 14", "flow boat → speech name");

makePilot("Talk", "terran", "commerce", null);
launchSim("SpeechTest", "sol");
sim.phase = "play";
for (let t = 0; t < 400; t += 5) { stepTraffic(t, 5); stepFlow(t); }
const port = stations.find((s) => s.sector !== "pirate");
sim.ship.pos = { x: port.x + 400, y: port.y, z: port.z + 400 };

resetSpeech(sim.skySeed);
ok(Math.abs(CALIBRATION.questionLift - 0.3) < 1e-9 && CALIBRATION.codaLift > 0, "baked calibration dials applied");
const band = syncBand(sim.ship.pos, sim.skySeed);
ok(band.length >= 4, `a band forms around a port (${band.length} voices)`);
/* The open channel is pilots. A port is a building with a duty officer —
 * it calls you on the puck, it does not gossip on the band. */
ok(!band.some((u) => u.isStation), "no port is on the open channel");
ok(band.every((u) => u.kind === "vessel" || u.kind === "flow"), "the band is hulls only");
ok(band.every((u) => u.person && u.person.startsWith(u.name.replace(/ \w\.$/, ""))), `every voice is a person, shortened for radio (${band.slice(0, 3).map((u) => `${u.name} = ${u.person}`).join(", ")})`);
ok(band.some((u) => u.hullName && u.hullName !== u.name), "the hull name is still carried, just not used as the voice");
ok(band.filter((u) => u.pronouns).length >= band.length - 1, "voices carry pronouns");
ok(band.every((u) => u.ref && typeof u.ref.x === "number"), "every voice is a real game entity");
ok(new Set(band.map((u) => u.name)).size === band.length, "voices have distinct names");
{
  const u = band.find((x) => x.kind === "vessel") ?? band[0];
  ok(Math.abs(u.position.x - u.ref.x / SPEECH_SCALE) < 1e-9, "position mirrors the sim at 1/SPEECH_SCALE");
}

/* the open channel */
const LG = /Kessel Deep|Ostrava|Boneyard|second marker|Tessera|Cinder Reach|Fallow Drift|Vachell|inner shoals|Harrow Point|slow lane/;
let exchanges = 0, lines = 0, leaks = 0, empty = 0, named = 0;
const topics = new Set();
let t = 400;
for (let i = 0; i < 160; i++) {
  t += 40;
  stepTraffic(t, 40);
  const ex = chatter(sim.ship.pos, t, Math.random, { skySeed: sim.skySeed });
  if (!ex) continue;
  exchanges++;
  topics.add(ex.topic);
  for (const l of ex.lines) {
    lines++;
    if (!l.text || !l.text.trim()) empty++;
    if (LG.test(l.text)) leaks++;
    if (speech.byName.get(l.from.name)?.ref) named++;
  }
}
ok(exchanges > 40, `the band talks (${exchanges} exchanges, ${lines} lines)`);
ok(topics.size >= 6, `and about different things (${topics.size} topics: ${[...topics].slice(0, 8).join(", ")}…)`);
ok(empty === 0, "no empty lines");
ok(leaks === 0, `no Living Galaxy places leak onto the band (${leaks})`);
ok(named === lines, "every speaker maps back to a hull or port");
ok(band.every((u) => !LG.test(u.nearestName ?? "")), "nobody's position got renamed (no drift)");
ok(speech.world.memories.length > 0, `exchanges file memory (${speech.world.memories.length})`);
ok(speech.clock === t, "the speech clock follows sim time");

/* a hull that changed job opens the exchange, to its port where it can reach it */
{
  const n = traffic.find((x) => x.visible !== false && Math.hypot(x.x - sim.ship.pos.x, x.y - sim.ship.pos.y, x.z - sim.ship.pos.z) < 60000);
  if (n) {
    let opened = 0, tries = 0;
    for (let i = 0; i < 12; i++) { t += 30; const ex = chatter(sim.ship.pos, t, Math.random, { forceSpeaker: n.id, prefer: port.id }); tries++; if (ex && speech.byId.get(n.id)?.name === ex.lines[0].from.name) opened++; }
    ok(opened > 0, `a forced speaker opens (${opened}/${tries})`);
  } else ok(true, "no hull near the port to force (skipped)");
}

/* you, talking */
{
  const n = traffic.find((x) => x.corpId && corpById(x.corpId));
  ok(n, "a flagged hull to talk to");
  const corp = corpById(n.corpId);
  const s0 = corp.standing;
  const hi = talkTo(n, "hello there", t, "vessel");
  ok(hi && hi.text && hi.understood && hi.intent === "greet", `greeting answered in character: "${hi?.text}"`);
  const th = talkTo(n, "thanks for that", t + 1, "vessel");
  ok(th.intent === "thank" && th.standing > 0, `thanks earns standing (+${th.standing})`);
  const th2 = talkTo(n, "thanks again", t + 2, "vessel");
  ok(th2.standing === 0, "a second thanks inside the cooldown earns nothing");
  const rude = talkTo(n, "you are useless", t + 3, "vessel");
  ok(rude.intent === "insult" && rude.standing < 0, `an insult costs standing (${rude.standing})`);
  ok(Math.abs(corp.standing - (s0 + th.standing + rude.standing)) < 2, `standing moved by what was said (${s0.toFixed(1)} → ${corp.standing.toFixed(1)})`);
  const r = regardOf(n, "vessel");
  ok(r.why.length > 0 && r.why.some((m) => /player-was/.test(m.type)), `regard is auditable (${r.why.map((m) => m.type).join(", ")})`);
  const threat = talkTo(n, "hand over your cargo or else", t + 4, "vessel");
  ok(threat.intent === "threaten" && regardOf(n, "vessel").regard < r.regard, "a threat lowers regard");
  const st = talkTo(port, "requesting a berth", t + 5, "station");
  ok(st && st.text && st.intent === "dock", `port control answers a berth request: "${st?.text}"`);
  const chips = talkChips(n, 0, "vessel");
  ok(chips.length === 3 && chips.every((c) => c.label && c.text), "three quick lines");
  ok(talkChips(n, 1, "vessel").map((c) => c.label).join() !== chips.map((c) => c.label).join() || chips.length < 3, "chips rotate");
}

/* the engine's stock Living Galaxy places are swapped for this sky's */
{
  const a = localise("still has not paid for the tow off Cinder Reach");
  ok(!LG.test(a) && /tow off \S/.test(a), `LG place localised: "${a}"`);
  ok(localise("past the second marker") === "past the second beacon", "the second marker becomes a beacon");
  ok(localise("tow off Cinder Reach") === localise("tow off Cinder Reach"), "localising is stable");
}

/* losses reach the band */
noteLost({ name: "Clamshell VANTRY-19" });
ok(speech.lastLost === "Vantry 19", "a shoot-down becomes the band's last lost hull");

/* free-talk call flow: chip → talk node → provider reply; typed line → talk node */
{
  const n = traffic[0];
  const script = { start: "hail", nodes: { hail: { text: "Go ahead.", options: [{ label: "BYE", text: "Out.", end: true }] } } };
  script.nodes.hail.options.push({ label: "TALK", text: "Got a minute?", next: "__talk" });
  script.nodes.__talk = { text: "fallback", options: [{ label: "SIGN OFF", text: "Signing off.", next: "__bye" }] };
  script.nodes.__bye = { text: "Out.", end: true };
  const heard = [];
  const s = new CallSession({ peerName: "TEST", script, talkNode: "__talk", provider: ({ history, node }) => {
    if (node.id !== "__talk" && node.id !== "__bye") return null;
    const said = [...history].reverse().find((l) => l.speaker === "self").text;
    heard.push(said);
    return { text: talkTo(n, said, t + 10, "vessel").text };
  } });
  s.hail({ incoming: false });
  const run = async (ms) => { for (let i = 0; i < ms / 50; i++) { s.tick(50); await Promise.resolve(); await Promise.resolve(); } };
  await run(4000);
  ok(s.state === CallState.ACTIVE, "call connects");
  s.skipReveal();
  ok(s.choose(s.options.find((o) => o.label === "TALK").id), "TALK chosen");
  await run(1500);
  const reply = s.lines[s.lines.length - 1];
  ok(heard[0] === "Got a minute?" && reply.speaker === "peer" && reply.text !== "fallback", `talk node answered by the engine: "${reply.text}"`);
  s.skipReveal();
  ok(s.say("what are you carrying?"), "free text accepted on a scripted call with a talk node");
  await run(1500);
  ok(heard[1] === "what are you carrying?" && s.lines[s.lines.length - 1].speaker === "peer", `typed line answered: "${s.lines[s.lines.length - 1].text}"`);
  s.skipReveal();
  s.choose(s.options.find((o) => o.label === "SIGN OFF").id);
  await run(8000);
  ok(s.state === CallState.CLOSED, "sign-off closes the channel");
}

/* a new sky is a new band */
resetSpeech("ElsewhereSky");
ok(speech.world.memories.length === 0 && speech.units.length === 0, "sky change: fresh band, no memory carried");
ok(speechStats().sky === "ElsewhereSky", "stats report the sky");

console.log(`speech: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
