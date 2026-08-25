// Living Galaxy — the living-world layer. Mercenary contracts, ship disabling and
// boarding, construction sites with builder crews, and pirate territory claims.
// Rule of space law here: only a completed DEFENSIVE station (a bastion) claims
// territory — habitats, refineries and trade posts never do.

import { scene } from '../../world/scene.js';
import { S } from '../../core/state.js';
import { releaseHull } from '../company/fleet.js';
import { makeRng, stream } from '../../core/rng.js';
import { SIM, TUTORIAL, COMMS } from '../../core/config.js';
import { rand, fmtCr } from '../../core/utils.js';
import { toast, status } from '../../core/notify.js';
import { sfx } from './audio.js';
import { spawn } from '../../core/spawn.js';
import { addStation } from '../../world/system.js';
import { hailMercContract, hailClaimWarning, hailDistress } from '../npc/npc-brain.js';

const MAXB = 16;
let beamSeg = null, beamPos = null, beamCount = 0;
const _v = new THREE.Vector3();

// ── shared work/boarding beams (miners, builders, mercs) ─────────────
export function addBeam(a, b) {
  if (beamCount >= MAXB || !beamPos) return;
  const o = beamCount * 6, arr = beamPos.array;
  arr[o] = a.x; arr[o + 1] = a.y; arr[o + 2] = a.z;
  arr[o + 3] = b.x; arr[o + 4] = b.y; arr[o + 5] = b.z;
  beamCount++;
}

function initBeams() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXB * 6), 3));
  beamPos = geo.attributes.position;
  geo.setDrawRange(0, 0);
  beamSeg = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    color: 0xffc060, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, fog: false
  }));
  beamSeg.frustumCulled = false;
  scene.add(beamSeg);
}

// ── construction sites ───────────────────────────────────────────────
function makeSite(kind, orbitR, angle) {
  const size = kind === 'fort' ? 30 : 40;
  const scaffold = new THREE.Mesh(
    new THREE.BoxGeometry(size, size * 0.7, size),
    new THREE.MeshBasicMaterial({ color: kind === 'fort' ? 0xff4466 : 0x66bbff,
      wireframe: true, transparent: true, opacity: 0.5 })
  );
  scaffold.scale.setScalar(0.25);
  scene.add(scaffold);
  const s = { kind, orbitR, angle, y: rand(-40, 40), pos: new THREE.Vector3(),
              progress: 0, need: SIM.siteNeed, done: false, scaffold };
  siteOrbit(s, 0);
  S.sim.sites.push(s);
  return s;
}

function siteOrbit(s, dt) {
  s.angle += (0.3 / s.orbitR) * dt;
  s.pos.set(Math.cos(s.angle) * s.orbitR, s.y, Math.sin(s.angle) * s.orbitR);
  s.scaffold.position.copy(s.pos);
  s.scaffold.rotation.y += 0.1 * dt;
}

/** Builders call this per supply run; tests call it directly. */
export function deliverToSite(site, amt) {
  if (site.done) return;
  site.progress = Math.min(site.need, site.progress + amt);
  site.scaffold.scale.setScalar(0.25 + 0.75 * (site.progress / site.need));
  site.scaffold.material.opacity = 0.5 + 0.4 * (site.progress / site.need);
  if (site.progress >= site.need) completeSite(site);
}

function completeSite(site) {
  site.done = true;
  scene.remove(site.scaffold);
  if (site.kind === 'fort') {
    // Null when no entity factory is registered — a headless run, an economy-only test. The
    // claim is still recorded, because who holds territory is a fact about the world and not
    // about whether anything is drawing it. See `core/spawn.js`.
    const fort = spawn('npc', 'fort');
    if (fort) fort.position.copy(site.pos);
    S.sim.claims.push({ fort, r: SIM.claimR });
    status('Pirate bastion completed — territory claimed');
    toast('☠ A pirate bastion is online — the region around it is claimed space', 5000);
    sfx.deny();
  } else {
    const spec = { name: 'Meridian Habitat', cat: 'civilian', orbit: site.orbitR,
                   color: 0x99ddff, size: 40, angle: site.angle };
    addStation(spec);
    (S.sim.built = S.sim.built || []).push(spec);
    status('Construction complete — Meridian Habitat online');
    toast('Coalition construction complete — Meridian Habitat is open for docking', 5000);
    sfx.dock();
  }
}

function assignBuilders() {
  const fortSite = S.sim.sites.find(s => s.kind === 'fort' && !s.done);
  const civSite = S.sim.sites.find(s => s.kind !== 'fort' && !s.done);
  for (const n of S.world.npcs) {
    const u = n.userData;
    if (u.role !== 'build' || (u.site && !u.site.done)) continue;
    u.site = u.faction === 'hostile' ? fortSite : civSite;
    if (!u.site) continue;
    u.phase = 'toSite';
    if (u.faction === 'hostile') {
      u.home = u.site.pos.clone().add(new THREE.Vector3(rand(-1, 1), 0, rand(-1, 1)).normalize().multiplyScalar(900));
    } else {
      let best = null, bd = Infinity;
      for (const st of S.world.stations) {
        const d = st.position.distanceToSquared(u.site.pos);
        if (d < bd) { bd = d; best = st; }
      }
      u.homeStation = best;
    }
  }
}

// ── mercenary contracts ──────────────────────────────────────────────
/**
 * Is the player a name anybody would pay to have collected?
 *
 * This used to be `kills >= 1 || credits > 2500`, and starting credits are already above
 * that threshold for most lineage/corp pairs — so a pilot who had done nothing but
 * undock could have a mercenary on them inside the first minute, before they had a gun
 * fitted. Being wealthy at creation is not notoriety; it is a character sheet.
 *
 * Eligibility is now something you *earn*, on two independent tracks:
 *
 *   **Time** — TUTORIAL.graceContract seconds of actual flying, so the opening of a game
 *     is never the moment a contract lands.
 *   **Deeds** — TUTORIAL.graceKills kills short-circuits the clock entirely. Somebody who
 *     came out shooting has made themselves interesting and the world should react.
 *
 * On top of either, a notoriety floor: the board does not bite on a pilot with a clean
 * record no matter how long they have been out or how much they are carrying.
 */
export function playerEligible() {
  if (S.sim.playerContract) return false;
  if (S.tutorial && S.tutorial.active && !S.tutorial.done) return false;
  const kills = S.player.kills || 0;
  const notoriety = kills + (S.sim.trespass || 0);
  if (notoriety < TUTORIAL.minNotoriety) return false;
  return kills >= TUTORIAL.graceKills || (S.playtime || 0) >= TUTORIAL.graceContract;
}

function issueContracts() {
  const idle = S.world.npcs.find(n => n.userData.role === 'merc' && n.userData.hp > 0 && !n.userData.contract);
  if (!idle) return;
  const u = idle.userData;

  if (playerEligible() && simRng.next() < SIM.playerContractChance) {
    u.contract = { kind: 'player', mode: 'capture' };
    S.sim.playerContract = { merc: idle };
    toast('⚠ A contract has been posted on you — mercenary inbound', 4500);
    sfx.deny();
    // ...and the mercenary says so, on an open channel, with something to answer.
    hailMercContract(idle);
    return;
  }
  const pool = S.world.npcs.filter(n => {
    const t = n.userData;
    return t.hp > 0 && t !== u && t.type !== 'fort' &&
      (t.faction === 'hostile' || t.faction === 'friendly');
  });
  if (!pool.length) return;
  const target = pool[Math.floor(simRng.next() * pool.length)];
  u.contract = { kind: 'npc', target, mode: simRng.next() < 0.6 ? 'capture' : 'kill' };
}

/** Merc boarding of an NPC finished — the target is taken, not killed. */
export function captureNpc(npc, byName) {
  // Taking a company hull ends its contract rather than leaving a record pointing at a
  // ship that is no longer in the world.
  if (npc.userData && npc.userData.contracted) releaseHull(npc.userData.contracted, { silent: true });
  const i = S.world.npcs.indexOf(npc);
  if (i >= 0) S.world.npcs.splice(i, 1);
  scene.remove(npc);
  if (S.target && S.target.obj === npc) S.target = null;
  toast(`${npc.userData.name} boarded and taken by ${byName}`);
}

// ── player disable / boarding ────────────────────────────────────────
function updatePlayerBoarding(dt) {
  const d = S.sim.disabled;
  if (!d) return;
  d.t += dt;

  const pc = S.sim.playerContract;
  const merc = pc && pc.merc;
  const mercAlive = merc && merc.userData.hp > 0 && S.world.npcs.indexOf(merc) >= 0;

  if (mercAlive) {
    const dist = merc.position.distanceTo(S.player.position);
    if (dist < SIM.boardRange) {
      const b = S.sim.boarding || (S.sim.boarding = { t: 0 });
      b.t += dt;
      addBeam(merc.position, S.player.position);
      status(`BOARDING IN PROGRESS — ${Math.max(0, SIM.boardTime - b.t).toFixed(0)} s`);
      if (b.t >= SIM.boardTime) capturePlayer(merc);
      return;
    }
    S.sim.boarding = null;
    status('SHIP DISABLED — hostile closing');
    return;
  }

  // boarder gone — the patrols (or your gunner friends) saved you
  S.sim.boarding = null;
  if (pc) { S.sim.playerContract = null; toast('The contract on you went quiet'); }
  if (d.t >= SIM.rebootTime) {
    S.sim.disabled = null;
    status('Systems restored');
    toast('Ship systems back online');
    sfx.pickup();
  } else {
    status(`SHIP DISABLED — rebooting ${Math.max(0, SIM.rebootTime - d.t).toFixed(0)} s`);
  }
}

function capturePlayer(merc) {
  const lostCr = Math.round(S.credits * 0.25);
  S.credits -= lostCr;
  S.cargo.ore = 0; S.cargo.salvage = 0; S.cargo.data = 0;
  S.player.hull = S.stats.hullMax * 0.35;
  S.player.shield = S.stats.shieldMax * 0.5;
  S.sim.disabled = null;
  S.sim.boarding = null;
  S.sim.playerContract = null;
  const i = S.world.npcs.indexOf(merc);
  if (i >= 0) S.world.npcs.splice(i, 1);
  scene.remove(merc);
  toast(`Boarded. They emptied the hold, took ${fmtCr(lostCr)}, and left you drifting.`, 6000);
  status('Boarding over — you kept the ship');
  sfx.explode();
}

// ── lifecycle ────────────────────────────────────────────────────────
let simRng = makeRng(12345);
export function initWorldSim() {
  // A named stream rather than a hand-mixed seed: the whole reason slice 1 built these is
  // that adding a draw here must not shift what the belt or the sky generate.
  simRng = stream('worldsim');
  initBeams();
  S.sim.sites.length = 0;
  S.sim.claims.length = 0;
  S.sim.built = [];
  makeSite('habitat', 9200, simRng.range(0, Math.PI * 2));
  makeSite('fort', 26500, simRng.range(0, Math.PI * 2));
  assignBuilders();
  S.sim.contractT = SIM.contractInterval * 0.5;
  S.sim.fortTimer = 0;
  S.sim.trespass = S.sim.trespass || 0;
  inClaim = false; claimT = 0;
}

export function updateWorldSim(dt) {
  // beams are re-declared every frame by whoever is working
  if (beamPos) {
    beamPos.needsUpdate = true;
    beamSeg.geometry.setDrawRange(0, beamCount * 2);
    beamCount = 0;
  }

  for (const s of S.sim.sites) if (!s.done) siteOrbit(s, dt);

  // claims live and die with their bastion
  for (let i = S.sim.claims.length - 1; i >= 0; i--) {
    const c = S.sim.claims[i];
    if (c.fort.userData.hp <= 0 || S.world.npcs.indexOf(c.fort) < 0) {
      S.sim.claims.splice(i, 1);
      toast('Pirate claim broken — the bastion is gone', 4500);
      status('Claimed space liberated');
      S.sim.fortTimer = SIM.fortRebuild;      // they will try again
    }
  }
  if (S.sim.fortTimer > 0) {
    S.sim.fortTimer -= dt;
    if (S.sim.fortTimer <= 0) {
      makeSite('fort', rand(24000, 29000), rand(0, Math.PI * 2));
      assignBuilders();
      status('Pirate construction signatures detected on the rim');
    }
  }

  S.sim.contractT += dt;
  if (S.sim.contractT >= SIM.contractInterval) {
    S.sim.contractT = 0;
    issueContracts();
  }

  // a dead merc voids the contract on you
  const pc = S.sim.playerContract;
  if (pc && (pc.merc.userData.hp <= 0 || S.world.npcs.indexOf(pc.merc) < 0) && !S.sim.disabled) {
    S.sim.playerContract = null;
    toast('The contract on you went quiet');
  }

  updatePlayerBoarding(dt);
  trackTrespass(dt);
  watchDistress(dt);
}

// ── distress ─────────────────────────────────────────────────────────
// Somebody losing a fight inside voice range is the single most interesting thing that
// can happen on a radio, and until now it happened in total silence. The hail carries
// real reply options (comms.js), so answering it is a decision with standing attached.

let distressT = 0;

function watchDistress(dt) {
  distressT += dt;
  if (distressT < 4) return;
  distressT = 0;
  for (const n of S.world.npcs) {
    const u = n.userData;
    if (!u || u.hp <= 0 || u.faction === 'hostile') continue;
    if (u.role === 'merc' || u.type === 'fort') continue;
    if (u.lastHit == null || S.time - u.lastHit > 6) continue;
    if (u.maxHp && u.hp / u.maxHp > 0.45) continue;
    if (n.position.distanceTo(S.player.position) > COMMS.range) continue;
    hailDistress(n);
    return;
  }
}

// ── notoriety ────────────────────────────────────────────────────────
// Sitting inside somebody else's claim is a thing you did, and it should count toward
// being worth hunting exactly like a kill does. One tick per continuous incursion, not
// one per frame — otherwise a slow pass through a claim would make you the most wanted
// pilot in Solaris in about four seconds.

let inClaim = false, claimT = 0;

function trackTrespass(dt) {
  const now = inClaimedSpace(S.player.position);
  if (!now) { inClaim = false; claimT = 0; return; }
  claimT += dt;
  if (inClaim) return;
  if (claimT < 6) return;                       // a grazing pass is not a trespass
  inClaim = true;
  S.sim.trespass = (S.sim.trespass || 0) + 1;
  hailClaimWarning('Bastion control');
}

// ── persistence ──────────────────────────────────────────────────────
// Until 0.5 the living world was rebuilt from scratch every boot. You could spend an hour
// dismantling a bastion and financing a habitat, save, come back, and find the bastion
// standing and the habitat unbuilt — the one part of the game that was explicitly about
// leaving a mark was the one part that could not.

/** Everything about the running simulation that is worth carrying across a session. */
export function serializeSim() {
  return {
    sites: S.sim.sites.filter(s => !s.done).map(s => ({
      kind: s.kind, orbitR: s.orbitR, angle: s.angle, y: s.y,
      progress: s.progress, need: s.need
    })),
    // A claim is stored as a place, not as a ship reference: the bastion is respawned
    // from the claim on load, so the two can never disagree about whether it exists.
    claims: S.sim.claims.map(c => ({
      x: c.fort.position.x, y: c.fort.position.y, z: c.fort.position.z,
      r: c.r, hp: c.fort.userData.hp
    })),
    built: (S.sim.built || []).slice(),
    fortTimer: S.sim.fortTimer || 0,
    contractT: S.sim.contractT || 0,
    trespass: S.sim.trespass || 0
  };
}

export function restoreSim(data) {
  if (!data) return false;

  for (const s of S.sim.sites) if (s.scaffold) scene.remove(s.scaffold);
  S.sim.sites.length = 0;
  S.sim.claims.length = 0;

  for (const d of data.sites || []) {
    const site = makeSite(d.kind, d.orbitR, d.angle);
    site.y = d.y;
    site.need = d.need || SIM.siteNeed;
    // deliverToSite rather than assigning progress, so the scaffold's scale and opacity
    // are rebuilt by the same code that grows them in play — one path, not two.
    deliverToSite(site, d.progress || 0);
  }

  for (const c of data.claims || []) {
    const fort = spawn('npc', 'fort');
    if (fort) {
      fort.position.set(c.x, c.y, c.z);
      if (typeof c.hp === 'number') fort.userData.hp = c.hp;
    }
    // Restored either way: a save records that a bastion holds this region, and that is true
    // whether or not this process has a renderer to put a hull in.
    S.sim.claims.push({ fort, r: c.r || SIM.claimR });
  }

  // Stations the player financed into existence are part of the map now.
  S.sim.built = (data.built || []).slice();
  for (const b of S.sim.built) {
    if (S.world.stations.some(st => st.userData.name === b.name)) continue;
    addStation(b);
  }

  S.sim.fortTimer = data.fortTimer || 0;
  S.sim.contractT = data.contractT || 0;
  S.sim.trespass = data.trespass || 0;
  assignBuilders();
  return true;
}

/** Is a point inside any pirate-claimed region? */
export function inClaimedSpace(pos) {
  for (const c of S.sim.claims) {
    if (c.fort.position.distanceTo(pos) < c.r) return true;
  }
  return false;
}
