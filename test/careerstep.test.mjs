import assert from 'node:assert/strict';
import { applyCareerDefaults, createCareerStepper } from '../js/sim/career.js';
for (const [complexId, key, value] of [['mining','miningMode','closest'],['salvage','salvage',true],['security','turretMode','enemies']]) {
  const ship = {};
  assert.equal(applyCareerDefaults(ship, { complexId }), ship);
  assert.equal(ship[key], value);
}
const calls = [];
const deps = {};
for (const name of ['updateCrewMods','tickBoarding','stepContract','stepIcework','stepAtmoWorks','persistProgress','stepMarket','coolBodies','syncMods','serveTime','tickHullRepair','tickPatchDrone','tickCrew','tickRobots','tickCompany']) deps[name] = (...args) => calls.push([name,...args]);
const training = [];
const sim = { ship: { credits: 10, powered: {}, throttle: 0, pressurized: true, dockedAt: 'port' }, time: 0, wall: 30, warp: {}, lock: {}, callsign: 'test', heat: 0 };
Object.assign(deps, {sim, pilot: {dirty:true}, WALLET_EVERY:30, currentShipId:()=> 'hull', crewEffects:()=>({plan:{hullName:'test',robots:0,rooms:[]}}), boarding:{intruders:0}, takePayout:()=>5, logEvent:(...args)=>calls.push(['logEvent',...args]), rankStatus:()=>({title:'Miner'}), mining:{active:true,assay:'Sample'}, turretAim:{}, work:(...args)=>training.push(args), crewCapacity:()=>2, robotCapacity:()=>3});
const step = createCareerStepper(deps);
step(1);
assert.equal(sim.ship.credits,15);
assert.equal(sim.payAccrued,0);
assert.equal(sim.toast,'Sample');
assert.equal(deps.mining.assay,null);
assert.equal(sim.crewCapacity,2);
assert.equal(sim.robotCapacity,3);
assert.deepEqual(training,[['geology',2],['geology',0.6],['heavyOps',0.45],['commerce',0.35]]);
const order = calls.map(c=>c[0]);
assert.ok(order.indexOf('persistProgress') < order.indexOf('serveTime'));
assert.ok(order.indexOf('serveTime') < order.indexOf('logEvent'));
sim.time = 1; step(1);
assert.equal(calls.filter(c=>c[0]==='updateCrewMods').length,1);
sim.time = 3; step(1);
assert.equal(calls.filter(c=>c[0]==='updateCrewMods').length,2);
console.log('careerstep: defaults, payroll, persistence order, training and crew cadence passed');

sim.ship.salvage = true; sim.ship.powered.ops = true;
training.length = 0; step(1);
assert.ok(!training.some(([skill]) => skill === 'salvage'), 'idle tractor earns no salvage training');
