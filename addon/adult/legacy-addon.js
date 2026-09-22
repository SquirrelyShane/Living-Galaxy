/** Host adapter. Family history is separate from the adult scene pack toggle. */
import { addHook } from '../../js/crew/hooks.js';
import { social, loadSocial, playerAsPerson } from '../../js/family.js';
import { sim } from '../../js/sim.js';
import { createRegistry, legacyTopics, recordFamilyEvent } from './legacy.js';

let database = null;
let source = null;
let changed = () => {};
let partnerConsent = () => false;
const resolveId = member => String(member?.legacyPersonId ?? member?.id ?? '');
function registry() {
  // Follow the active save, including when the host swaps saves in-place.
  if (sim.familyLegacy !== source) {
    source = sim.familyLegacy;
    database = source ? createRegistry(source) : null;
    if (database) sim.familyLegacy = source = database;
  }
  return database;
}
function persist(db) { sim.familyLegacy = source = database = db; changed(db); }

/** Load actual world data; call on each world load or restore sim.familyLegacy. */
export function installFamilyLegacy(data, options = {}) {
  const db = createRegistry(data);
  changed = typeof options.onChange === 'function' ? options.onChange : () => {};
  partnerConsent = typeof options.canPlanFamily === 'function' ? options.canPlanFamily : () => false;
  persist(db);
  return db;
}
export function exportFamilyLegacy() { const db = registry(); return db ? JSON.parse(JSON.stringify(db)) : null; }
export function familyEvent(event) {
  const db = registry();
  if (!db) return null;
  const text = recordFamilyEvent(db, event);
  persist(db);
  return text;
}
addHook('talkTopics', member => {
  const db = registry();
  if (!db || !member) return [];
  loadSocial();
  const listenerId = resolveId(playerAsPerson()) || 'player';
  return legacyTopics(db, resolveId(member), {
    listenerId,
    // A host may explicitly grant personal/private disclosure per NPC.
    disclosure: () => Math.max(0, Math.min(2, Number(member.legacyDisclosure) || 0)),
    onChange: persist,
    canPlanFamily: (npc, player) => {
      loadSocial();
      return social.family === true && member.partner === 'player'
        && Number.isFinite(npc?.age) && npc.age >= 18
        && Number.isFinite(player?.age) && player.age >= 18
        && !member.captive && member.status !== 'captive'
        && partnerConsent(npc, player, member) === true;
    }
  });
});
