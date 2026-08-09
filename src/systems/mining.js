// Living Galaxy — mining beam. Locks onto the targeted rock, or the nearest one in range.

import { scene } from '../world/scene.js';
import { practice } from './character.js';
import { crewEvent } from './crew.js';
import { S, cargoFree } from '../core/state.js';
import { MINING } from '../core/config.js';
import { mineAsteroid, nearestAsteroid } from '../world/asteroids.js';
import { setTarget } from './targeting.js';
import { sfx } from './audio.js';
import { toast, status } from '../ui/toast.js';
import { canMine, announce } from './preflight.js';
import { witnessClaimJump } from './npc-brain.js';
import { AVATAR } from '../core/config.js';
import { wearMining } from './wear.js';

let beam, beamPos;
let sound = 0, warned = 0;

export function initMining() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  beamPos = geo.attributes.position;
  beam = new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: 0xffb040, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, fog: false
  }));
  beam.frustumCulled = false;
  beam.visible = false;
  scene.add(beam);
}

/** The rock the beam would hit right now, or null. */
export function miningTarget() {
  const t = S.target;
  if (t && t.kind === 'asteroid' && t.obj.ore > 0 &&
      t.obj.position.distanceTo(S.player.position) <= MINING.range) return t.obj;
  return nearestAsteroid(S.player.position, MINING.range);
}

/**
 * Cutting a rock an NPC miner is already working is a small, petty theft, and the sort of
 * thing a laborer holds on to. Checked on a slow cadence rather than per-frame — the
 * memory system merges repeats anyway, so hammering it sixty times a second would buy
 * nothing but a hot loop over the NPC roster.
 */
let claimCheck = 0;
function noteClaimJump(rock) {
  if (S.time - claimCheck < 3) return;
  claimCheck = S.time;
  for (const n of S.world.npcs) {
    const u = n.userData;
    if (!u || u.role !== 'mine' || u.hp <= 0) continue;
    // Working the same rock, or near enough to it to reasonably call it theirs.
    if (n.position.distanceTo(rock.position) > AVATAR.claimRange) continue;
    witnessClaimJump(u);
    return;                       // one aggrieved miner is enough
  }
}

export function updateMining(dt) {
  const p = S.player;
  if (!S.input.mining) { beam.visible = false; return; }

  // Same door as the guns. The cutter now also refuses on a hull that is too broken to
  // carry the arm and on a hull class with no cutter head at all — states that used to
  // be expressed as "the beam quietly does nothing".
  const clear = canMine();
  if (!clear.ok) { beam.visible = false; announce(clear, { sound: clear.code !== 'warp' }); return; }

  const rock = miningTarget();
  if (!rock) {
    beam.visible = false;
    if (S.time - warned > 1.5) { warned = S.time; status('No ore-bearing rock in beam range'); sfx.deny(); }
    return;
  }
  if (!S.target || S.target.obj !== rock) setTarget(rock, 'asteroid', rock.name, 'neutral');

  const free = cargoFree();
  if (free <= 0) {
    beam.visible = false;
    if (S.time - warned > 2) { warned = S.time; toast('Cargo hold full — sell at a station'); }
    return;
  }

  noteClaimJump(rock);

  const kg = Math.min(MINING.rate * S.stats.miningMult * dt, free);
  const got = mineAsteroid(rock, kg);
  S.cargo.ore += got;
  // The beam is a utility hardpoint doing work, and it wears like one. A mining session is
  // the longest continuous load a peaceful pilot ever puts on a fit, which is why the
  // rate here is per second rather than per event.
  wearMining(dt);
  practice('extraction', got * 0.02);
  crewEvent('oreLoad', 'rigger', got / 400);
  p.energy -= MINING.energy * dt;
  p.expend += MINING.energy;

  const a = beamPos.array;
  a[0] = p.position.x; a[1] = p.position.y - 4; a[2] = p.position.z;
  a[3] = rock.position.x; a[4] = rock.position.y; a[5] = rock.position.z;
  beamPos.needsUpdate = true;
  beam.visible = true;
  beam.material.opacity = 0.6 + Math.random() * 0.35;

  if (S.time - sound > 0.22) { sound = S.time; sfx.mine(); }
  if (rock.ore <= 0) toast(`${rock.name} mined out`);
}
