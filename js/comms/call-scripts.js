// js/comms/call-scripts.js — what the other end of the channel says.
//
// Every script is a small dialogue tree: { start, nodes: { id: { text, options?, end? } } }.
// Options can carry an `effect(ctx)` — the director runs it when the pilot picks
// that line, so a bribe costs credits and a clearance actually opens the clamps.
// The factories take the station/contact so the words carry its name and sector.

const VOICE = {
  logistic: { hail: "traffic", style: "clipped" },
  military: { hail: "control", style: "hard" },
  industrial: { hail: "yard", style: "flat" },
  civilian: { hail: "harbour", style: "warm" },
  agricultural: { hail: "ring", style: "easy" },
  pirate: { hail: "watch", style: "hostile" },
};

const short = (name) => String(name || "").split(" ")[0].toUpperCase();
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length) % arr.length];

/* ---- NPC → player: a port sees you on approach --------------------------- */
export function approachScript(st, ctx) {
  const v = VOICE[st.sector] ?? VOICE.civilian;
  const who = short(st.name);
  const fee = st.sector === "military" ? 120 : st.sector === "civilian" ? 40 : 60;
  return {
    start: "hail",
    nodes: {
      hail: {
        text:
          v.style === "hard"
            ? `Unidentified hull, ${who} ${v.hail}. You are inside our picket. Declare intent or turn out.`
            : v.style === "warm"
              ? `${who} ${v.hail} to the inbound hull — you're on our board. What can we do for you, pilot?`
              : `${who} ${v.hail}. Inbound hull, we have you at ${Math.round(ctx.range() / 100) * 100} units. State intent.`,
        options: [
          {
            label: "REQUEST DOCK",
            text: "Requesting a berth. Inbound to the ring.",
            next: "dock",
          },
          {
            label: "MARKET",
            text: "What are you buying today?",
            next: "market",
            tone: "friendly",
          },
          { label: "PASSING", text: "Just passing. Keep your lane.", next: "pass", tone: "firm" },
          { label: "CUT", text: `Disregard, ${who}.`, end: true },
        ],
      },
      dock: {
        text: `Berth is yours. Take the ENTRY lane; our tractor takes you at the funnel and walks you onto the clamps. Docking fee is ${fee}, taken on the arm.`,
        effect: () => ctx.request?.(),
        options: [
          { label: "COPY", text: "Copy. Inbound slow.", end: true, tone: "friendly" },
          {
            label: "WAIVE IT",
            text: "Waive the fee. I fly your flag.",
            next: ctx.flagged() ? "waived" : "nowaive",
            tone: "firm",
          },
        ],
      },
      waived: {
        text: "Flag confirmed. Fee waived — don't make a habit of it. Ring is clear.",
        end: true,
        effect: () => ctx.standing(1.5, "docking courtesy"),
      },
      nowaive: { text: "No flag on your transponder, pilot. Fee stands. Ring is clear.", end: true },
      market: {
        text: ctx.wants().length
          ? `Paying over the odds for ${ctx.wants().join(", ")}. Everything else is book price.`
          : "Book price on everything today. Nothing we're short of.",
        options: [
          { label: "REQUEST DOCK", text: "Good. Requesting a berth.", next: "dock" },
          { label: "NOTED", text: "Noted. Out.", end: true },
        ],
      },
      pass: {
        text: v.style === "hard" ? "Then pass. Guns are tracking you until you are out of the picket." : "Understood. Clear skies.",
        end: true,
      },
    },
  };
}

/* ---- port → a hull on its lane or in its mouth with no berth ------------- */
export function laneScript(st, ctx, where = "lane") {
  const v = VOICE[st.sector] ?? VOICE.civilian;
  const who = short(st.name);
  const spot = where === "mouth" ? "in our hangar mouth" : "on our entry lane";
  return {
    start: "hail",
    nodes: {
      hail: {
        text:
          v.style === "hard"
            ? `Hull ${spot}, ${who} ${v.hail}. You have no berth. Request one now or clear the lane — the tractor does not take strays.`
            : v.style === "warm"
              ? `${who} ${v.hail} — you're ${spot} without a berth, pilot. Want one? Say the word and we'll take you in.`
              : `${who} ${v.hail}. Hull ${spot}, no berth filed. Request or clear.`,
        options: [
          { label: "REQUEST DOCK", text: "Requesting a berth. Take me in.", next: "granted", tone: "friendly" },
          { label: "PASSING", text: "Just passing through. Clearing the lane.", next: "clear", tone: "firm" },
          { label: "CUT", text: `Disregard, ${who}.`, end: true },
        ],
      },
      granted: {
        text: where === "mouth" ? "Berth granted. Tractor lock in three — hands off the stick." : "Berth granted. Hold the entry lane; the tractor takes you at the funnel.",
        end: true,
        effect: () => ctx.request?.(),
      },
      clear: { text: v.style === "hard" ? "Then clear it. Guns are on you until you do." : "Copy. Mind the outbound traffic.", end: true },
    },
  };
}

/* ---- player → port while docked: clearance to leave --------------------- */
export function undockScript(st, ctx) {
  const who = short(st.name);
  return {
    start: "greet",
    nodes: {
      greet: {
        text: `${who} ${VOICE[st.sector]?.hail ?? "control"}. Your clamp is still holding. State intent.`,
        options: [
          { label: "REQUEST UNDOCK", text: "Requesting undock clearance.", next: "queue" },
          {
            label: "PRIORITY LANE",
            text: "Requesting priority release. Cargo is time-critical.",
            next: "priority",
            tone: "firm",
          },
          { label: "HOLD", text: `Disregard, ${who}. Holding.`, end: true },
        ],
      },
      queue: {
        text: "Clearance logged. Clamp releasing in ten. Do not thrust until the ring is clear.",
        end: true,
        effect: () => ctx.undock(),
      },
      priority: {
        text: "Priority costs a surcharge of 80 and a hold scan. Take it or wait your turn.",
        options: [
          {
            label: "PAY IT",
            text: "Deduct it. Open the clamp.",
            next: ctx.credits() >= 80 ? "release" : "broke",
          },
          { label: "REFUSE SCAN", text: "No scan. Try me.", next: "refuse", tone: "hostile" },
          { label: "BACK TO QUEUE", text: "Belay that. I'll wait.", next: "queue" },
        ],
      },
      release: {
        text: "Surcharge taken. Clamp releasing now. Ring is yours.",
        end: true,
        effect: () => {
          ctx.pay(80, "priority release");
          ctx.undock();
        },
      },
      broke: { text: "Your account doesn't cover it, pilot. Back of the queue.", next: "queue", options: [{ label: "FINE", text: "Fine.", next: "queue" }] },
      refuse: {
        text: "Then you hold. Sentry has your profile. Out.",
        end: true,
        effect: () => ctx.standing(-2, "refused scan"),
      },
    },
  };
}

/* ---- GNN: the news desk --------------------------------------------------
 * A major planetary impact goes out as a galactic news broadcast. It rings
 * the puck like any contact; answer it and the bulletin types itself out on
 * the transcript. The desk does not take questions — but it will mark the
 * site on your chart.                                                       */
export function newsScript(report, ctx) {
  const { body, rock, tier, tempK, integrity, shattered, speed, blast, contractRate } = report;
  const lede = shattered
    ? `${body} has broken up. Repeat: ${body} is gone — reduced to a debris field by the impactor designated ${rock}.`
    : tier === "cataclysm"
      ? `A catastrophic impact on ${body}. The strike, designated ${rock}, came in at ${Math.round(speed)} u/s. Shockwaves are visible from orbit.`
      : `A major impact is confirmed on ${body} — impactor ${rock}, ${Math.round(speed)} u/s at entry.`;
  /* the body count — the blast wave's paperwork */
  const casualties = [];
  if (blast?.portsLost?.length) casualties.push(`${blast.portsLost.join(" and ")} ${blast.portsLost.length > 1 ? "are" : "is"} gone with the world`);
  if (blast?.portsHit?.length) casualties.push(blast.portsHit.map((h) => `${h.name} reports ${h.guns ? `${h.guns} batter${h.guns > 1 ? "ies" : "y"} out and ` : ""}stock losses`).join("; "));
  if (blast?.kills?.length) casualties.push(`${blast.kills.length} hull${blast.kills.length > 1 ? "s" : ""} lost in the wave (${blast.kills.slice(0, 3).join(", ")})`);
  const count = casualties.length ? ` ${casualties.join(". ")}.` : " No stations inside the blast radius.";
  const detail = shattered
    ? `Charter authorities have declared the volume a salvage zone.${count} All traffic is advised to hold clear of the debris field until the ring settles.`
    : `Surface stations report the crust running ${Math.round(tempK)} K at the site. Planetary integrity is assessed at ${Math.round(integrity * 100)} percent.${count}`;
  return {
    start: "lede",
    nodes: {
      lede: {
        text: `GNN BULLETIN — ${lede}`,
        options: [{ label: "CONTINUE", text: "Go ahead.", next: "detail" }],
      },
      detail: {
        text: detail,
        options: [
          ...(shattered && ctx.contract
            ? [{ label: `SALVAGE CONTRACT · ${contractRate} cr/u`, text: "Put my callsign on the salvage contract.", next: "contracted" }]
            : []),
          { label: "MARK IMPACT SITE", text: "Mark it on my chart.", next: "marked" },
          { label: "ACKNOWLEDGE", text: "Copy, GNN.", next: "out" },
        ],
      },
      contracted: {
        text: `Registered. Haul what you can out of the field — the charter pays ${contractRate} credits a unit at any dock, next thirty minutes. Site is on your chart.`,
        end: true,
        effect: () => { ctx.contract(); ctx.mark(); },
      },
      marked: {
        text: `Coordinates on your chart. GNN, clear.`,
        end: true,
        effect: () => ctx.mark(),
      },
      out: { text: `Stay safe out there. GNN, clear.`, end: true },
    },
  };
}

/** One-node desk reads: droughts and terraform bonds ride the same channel. */
export function marketScript(line, action = null) {
  return {
    start: "read",
    nodes: {
      read: {
        text: `GNN MARKETS — ${line}`,
        options: [
          ...(action ? [{ label: action.label, text: action.text ?? "Do it.", next: "acted" }] : []),
          { label: "ACKNOWLEDGE", text: "Copy.", next: "out" },
        ],
      },
      acted: { text: action?.reply ?? "Done. GNN, clear.", end: true, effect: () => action?.effect?.() },
      out: { text: "GNN, clear.", end: true },
    },
  };
}

/* ---- NPC → player: a free port with its guns up ------------------------- */
export function pirateScript(st, ctx) {
  const who = short(st.name);
  const ask = Math.max(150, Math.round(ctx.cargoValue() * 0.35));
  return {
    start: "demand",
    nodes: {
      demand: {
        text: `You're drifting in ${who} water with a hold on you. Cut thrust and open the bay, or we open it.`,
        options: [
          { label: "STALL", text: "Reactor fault on my end. Give me a minute.", next: "stall" },
          { label: "REFUSE", text: "The hold stays shut. Break off.", next: "refuse", tone: "hostile" },
          {
            label: `PAY ${ask}`,
            text: `${ask} credits, transferred now, and I fly through.`,
            next: ctx.credits() >= ask ? "bribe" : "broke",
            tone: "friendly",
          },
        ],
      },
      stall: { text: "Sixty seconds. Then the guns do the talking.", end: true },
      refuse: {
        text: `Wrong answer. ${who} closing.`,
        end: true,
        effect: () => {
          ctx.provoke();
          ctx.board?.();
        },
      },
      bribe: {
        text: "Credits landed. We never saw you. Go.",
        end: true,
        effect: () => {
          ctx.pay(ask, `${st.name} toll`);
          ctx.truce();
        },
      },
      broke: { text: "You can't cover that. Open the bay.", options: [{ label: "REFUSE", text: "No.", next: "refuse", tone: "hostile" }, { label: "STALL", text: "Give me a minute.", next: "stall" }] },
    },
  };
}

/* ---- player → drone/guard: nobody civil is listening -------------------- */
export function guardScript(c) {
  return {
    start: "warn",
    nodes: {
      warn: {
        text: `${c.name.toUpperCase()}: profile logged. Leave the picket.`,
        end: true,
      },
    },
  };
}

/* ---- port answers a cold hail from open space --------------------------- */
export function portScript(st, ctx) {
  const s = approachScript(st, ctx);
  s.nodes.hail.text = `${short(st.name)} ${VOICE[st.sector]?.hail ?? "control"} reading you. Go ahead.`;
  return s;
}

/* ---- NPC ↔ NPC: what the open channels sound like ----------------------- */
const CHATTER = {
  logistic: [
    ["Manifest for the {A} run is short two pallets.", "Short is what the ledger says. Send it anyway."],
    ["{B}, {A}. Consignment lane is clear to your side.", "Copy {A}. Tug is away."],
    ["Anyone got a bond slip for the {A} transfer?", "Filed an hour ago. Check your board."],
  ],
  military: [
    ["{A} picket, {B}. Unknown hull crossing the lane at four klicks.", "We have it. Holding fire unless it turns in."],
    ["Sentry sweep on the hour, {A}.", "Sweep acknowledged. Nothing on the board."],
    ["{B}, drone contact bearing two-two-zero.", "Rogue. Engaging on our side. Stay out of the cone."],
  ],
  industrial: [
    ["Smelt line three is down again, {A}.", "Run the ore through one and two. Bill the delay."],
    ["{B}, we need plate. How much can you fab by the cycle?", "Forty. Fifty if your ore is clean."],
    ["Kiln is cooking hot. Radiator's fouled.", "Cut to eighty until the shift turns over."],
  ],
  civilian: [
    ["{A} harbour to {B} — got a lounge full of transit crew and no packets.", "Rations are on the next hop. Feed them stories."],
    ["Anyone seen the {A} liner? Two hours late.", "Held at the belt for a rock. She'll be along."],
    ["{B}, terrace lights are flickering again.", "Grav plate on the promenade. Ticket is in."],
  ],
  agricultural: [
    ["{A} ring, vat four is ready to draw.", "Draw it. Hydro needs the water back by night cycle."],
    ["Phosphorus is short again, {B}.", "Everyone is short. Pay the miners more."],
    ["Harvest count is in. Up eleven.", "Good. Send the surplus to {B} before it spoils."],
  ],
  pirate: [
    ["Hull with a full hold on the outer lane, {A}.", "Seen it. Let it come to us."],
    ["{B}, watch says a picket ship is sniffing the belt.", "Then we go quiet. Guns cold till it turns."],
    ["Cutter's back with the chop. Who's buying?", "Anyone with credits and no questions."],
  ],
};

/** One overheard exchange between two ports: [{from, to, text}, …] */
export function chatterExchange(a, b, rnd) {
  const pool = CHATTER[a.sector] ?? CHATTER.civilian;
  const lines = pick(rnd, pool);
  const A = short(a.name);
  const B = short(b.name);
  const fill = (t) => t.replaceAll("{A}", A).replaceAll("{B}", B);
  return lines.map((t, i) => ({ from: i % 2 === 0 ? a : b, to: i % 2 === 0 ? b : a, text: fill(t) }));
}

/**
 * llama.cpp (OpenAI-compatible) provider for a local inference server.
 * Falls back silently to the scripted node if the server is slow or down —
 * CallSession already guards it with providerTimeoutMs.
 */
/* One warning, then stop asking. A voice provider that answers 404/405/501 is
 * not there, and the scripted lines are a complete fallback — so a call still
 * works, it just stops paying a dead round trip per line. */
const deadProviders = new Set();
function providerGone(status, url) {
  if (deadProviders.has(url)) return;
  deadProviders.add(url);
  console.warn(`[calls] voice provider at ${url} answered ${status} — scripted lines for the rest of this session.`);
}

export function llamaProvider({ url = "http://127.0.0.1:8089/v1/chat/completions", persona = "" } = {}) {
  return async ({ history, node, session }) => {
    const transcript = history
      .slice(-6)
      .map((l) => `${l.speaker === "self" ? "PILOT" : l.name}: ${l.text}`)
      .join("\n");
    const sys = `You are ${session.peerName}, a station controller in a hard sci-fi setting. ${persona}
Reply with ONE line of radio speech, max 22 words, no quotes, no narration.
Intent to convey: ${node.text}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "local",
        max_tokens: 64,
        temperature: 0.8,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: transcript || "(channel opens)" },
        ],
      }),
    });
    /* `fetch` only REJECTS on a network failure. A 404 from a misconfigured
     * host, or a 500 with a JSON error body, RESOLVES — so without this check
     * `res.json()` either throws a SyntaxError into a silent catch upstream or
     * quietly yields undefined, and every node of every call re-issues the
     * dead request forever. Same shape as the /cradle/put flood. */
    if (!res.ok) { providerGone(res.status, url); return null; }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text ? { text } : null; // options stay scripted → choices remain authored
  };
}

/* ---- NPC traffic answers a hail ------------------------------------------- */
/**
 * @param n       traffic hull (js/npc/traffic.js)
 * @param status  vesselStatus(n) line
 * @param ctx     { market: string, crewLine: string }
 */
export function vesselScript(n, status, ctx) {
  const cs = n.name.split(" ").pop();
  return {
    start: "hail",
    nodes: {
      hail: {
        text: `${cs}, ${n.hullName ?? "working hull"}, ${status}. Go ahead.`,
        options: [
          { label: "WHERE'S THE MARKET?", text: "What's paying out there?", next: "market" },
          { label: "WHO'S ABOARD?", text: "Who am I talking to?", next: "crew" },
          { label: "SAFE FLIGHT", text: "Just checking in. Safe flight.", next: "bye" },
        ],
      },
      market: { text: ctx.market, end: true },
      crew: { text: ctx.crewLine, end: true },
      bye: { text: `Same to you. ${cs} out.`, end: true },
    },
  };
}

/** What a hull says on the open channel when its job changes. [fromLine, replyLine] or null. */
export function trafficLines(n, job, rnd) {
  const cs = n.name.split(" ").pop();
  const at = n.toName || "control";
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  if (job === "outbound") return pick([
    [`${at} tower, ${cs} is off the clamps, outbound.`, `Copy ${cs}. Lane is yours, mind the traffic.`],
    [`${cs} departing. Manifest filed.`, `Filed and read, ${cs}. Clear skies.`],
  ]);
  if (job === "approach") return pick([
    [`${at} approach, ${cs} out of the lane, requesting clamps.`, `${cs}, clamps on the ring. Slow to twelve and hold.`],
    [`${cs} on the approach to ${at}, ${n.role === "miner" ? "hold is full" : "on schedule"}.`, `Read you ${cs}. Bring it in.`],
  ]);
  if (job === "cutting") return pick([
    [`${cs} on the claim. Cutting.`, `Log it, ${cs}. Assay when you have one.`],
    [`Anyone else on this rock? ${cs} is cutting the sunward face.`, `All yours, ${cs}.`],
  ]);
  return null;
}
