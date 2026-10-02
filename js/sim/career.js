export function applyCareerDefaults(ship, pilot) {
  const cx = pilot.complexId;
  if (cx === "mining") ship.miningMode = "closest";
  if (cx === "salvage") ship.salvage = true;
  if (cx === "security") ship.turretMode = "enemies";
  return ship;
}

export function createCareerStepper({
  sim, updateCrewMods, currentShipId, crewEffects,
  boarding, tickBoarding, stepContract, stepIcework,
  stepAtmoWorks, pilot, WALLET_EVERY, persistProgress,
  stepMarket, coolBodies, syncMods, serveTime,
  takePayout, logEvent, rankStatus, mining,
  work, turretAim, crewCapacity, robotCapacity,
  tickHullRepair, tickPatchDrone, tickCrew, tickRobots,
  tickCompany
}) {
  let _crewFxAt = -10;
  return function stepCareer(d) {
    const ship = sim.ship;
    if (sim.time - _crewFxAt > 2) {
      _crewFxAt = sim.time;
      updateCrewMods(currentShipId(), sim.callsign, sim.time);
      const fx = crewEffects(currentShipId(), sim.callsign, sim.time);
      sim.interior = {
        hull: fx.plan.hullName,
        robots: fx.plan.robots,
        sensors: fx.plan.rooms.reduce((a, r) => a + r.sensors, 0),
        hasBrig: fx.plan.rooms.some((r) => r.kind === "brig"),
        intruders: boarding.intruders,
      };
    }
    tickBoarding(d);
    stepContract();
    stepIcework(d);
    stepAtmoWorks(d);
    if ((Math.abs(Math.round(sim.ship.credits) - (sim.walletSaved ?? 0)) >= 1 || pilot.dirty) && sim.wall - (sim.walletAt ?? 0) >= WALLET_EVERY) sim.requestPersist = true;
    if (sim.requestPersist) { sim.requestPersist = false; persistProgress(); }
    stepMarket(d);
    coolBodies(d);
    syncMods(ship);
    serveTime(d, { docked: Boolean(ship.dockedAt) });
    const pay = takePayout();
    if (pay > 0) {
      ship.credits += pay;
      sim.payAccrued = (sim.payAccrued ?? 0) + pay;
    }
    if (ship.dockedAt && (sim.payAccrued ?? 0) > 0) {
      logEvent(`Payroll cleared: +${sim.payAccrued} cr as ${rankStatus()?.title ?? "crew"}`, "trade");
      sim.payAccrued = 0;
    }
    if (mining.assay) {
      logEvent(mining.assay, "survey");
      sim.toast = mining.assay;
      sim.lastToastAt = sim.time;
      mining.assay = null;
      work("geology", 2);
    }
    if (mining.active) {
      work("geology", d * 0.6);
      work("heavyOps", d * 0.45);
      if (ship.miningMode === "overdrive") work("hazardOps", d * 0.25);
    }
    if (Math.abs(ship.throttle) > 0.05) work("piloting", d * 0.22);
    if (sim.warp.state === "spool" || sim.warp.state === "run") work("navigation", d * 0.8);
    if (sim.lock.locked) work("dataOps", d * 0.3);
    if (turretAim.firing) work("security", d * 0.9);
    if (ship.dockedAt) work("commerce", d * 0.35);
    sim.crewCapacity = crewCapacity();
    sim.robotCapacity = robotCapacity();
    tickHullRepair(d);
    tickPatchDrone(d);
    tickCrew(d, ship);
    tickRobots(d);
    tickCompany(d);
    if (sim.heat > 0.2) work("hazardOps", d * 0.5);
    if (!ship.pressurized) work("lifeSupport", d * 0.3);
    if (ship.brownout) work("energySystems", d * 0.6);
  }
  ;
}
