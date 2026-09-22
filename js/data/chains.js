/* LIVING GALAXY — chain contracts: the multi-stage work a desk runs.
 *
 * 0.3.21. A chain is a job with a story: three to five stages, each one an
 * ordinary board job built from an existing KIND (js/contracts.js), posted one
 * at a time. Finish a stage and the next one is waiting — here, or at the port
 * the desk sends you to — and the last one pays a bonus and standing on top.
 *
 * DATA ONLY. The engine is js/chains.js; contracts.js builds each stage's job
 * from the kind named here and overrides the title, the text, the pay and the
 * quantity. Which means a chain never invents a mechanic: every stage is
 * something the game already knows how to complete.
 *
 *   { id, cat, name, blurb, sectors?, stages: [{ kind, title, text, payK?, qtyK?, good?, at? }], bonus, standing }
 *
 *   kind    one of that department's kinds (CATEGORIES in contracts.js)
 *   at      "same" — posted at the port the last stage was; "next" — a nearby
 *           port the engine picks and names. Stage 1 has no `at`.
 *   payK    multiplier on the kind's own pay; qtyK on its own quantity
 *   good    forces the ore/cargo where the story needs a particular one
 *
 * The prose is per-stage and the numbers are not: amounts, ore names, port
 * names, drift names, beacon and world names are filled in by the engine from
 * the live sky, so a stage reads the same way the one-off jobs do.
 */

export const CHAINS = [
  /* ---- MINING & EXTRACTION ---------------------------------------------------- */
  {
    id: "relight-the-furnace",
    cat: "mining",
    name: "RELIGHT THE FURNACE",
    blurb: "Number Three comes off bank this week. Feed it from cold charge to a finished alloy pour, and the foreman remembers who kept up.",
    sectors: ["industrial", "logistic"],
    stages: [
      { kind: "mine", title: "Cold charge for Number Three", text: "Number Three comes off bank at the end of the week and the charge floor is bare. Cut plain iron ore and keep the hoppers ahead of the burner crew.", payK: 0.9, qtyK: 1.4, good: "iron_ore" },
      { kind: "mine", title: "Carbon in the first melt", text: "Melt chemistry wants carbon in the charge before the first tap. Carbonaceous rock will do — the desk is not fussy about grade, only tonnage.", payK: 1.0, qtyK: 1.2, good: "carbonaceous", at: "same" },
      { kind: "mine", title: "Nickel by the second heat", text: "The order book turned over in the night: stainless billet, not structural. That means nickel in the ladle by the second heat, with no waiting on a freighter.", payK: 1.3, qtyK: 0.9, good: "nickel_ore", at: "same" },
      { kind: "mine", title: "Chrome off the next port's book", text: "Local chrome is tied up in somebody else's supply deal, so the desk has bought your time at the port along the lane. Cut chromite there and run it back yourself.", payK: 1.6, qtyK: 0.8, good: "chromite", at: "next" },
      { kind: "vein", title: "High grade for the final pour", text: "The last heat wants clean nickel sulphide, not yard sweepings. Survey has a small rich pocket on the books — cut it, sack it, and Number Three signs off on your account.", payK: 2.2, qtyK: 0.4, good: "pentlandite", at: "same" },
    ],
    bonus: 8500,
    standing: 10,
  },
  {
    id: "ice-came-back-sour",
    cat: "mining",
    name: "THE ICE CAME BACK SOUR",
    blurb: "Hydro took a bad load of ice and the tanks are off spec. Run the frost line until the station has clean water again.",
    sectors: ["civilian", "industrial"],
    stages: [
      { kind: "ice", title: "Make up the hydro tanks", text: "Hydro is running on reserve and the reserve is thin. Cut clean water ice and get it inbound before the rationing notice goes up.", payK: 1.2, qtyK: 0.9, good: "water_ice" },
      { kind: "mine", title: "Find what is fouling the ice", text: "Your last lot assayed brown: the field is laced with organics and hydro will not take another load. The lab wants a sack of the muck itself so it can name the seam.", payK: 1.4, qtyK: 0.5, good: "tholins", at: "same" },
      { kind: "ice", title: "Ammonia for the scrubber beds", text: "Flushing the sour water stripped the scrubbers back to bare media. They want ammonia ice to recharge the beds before the shift change, and they want it ahead of the water.", payK: 1.1, qtyK: 0.7, good: "ammonia_ice", at: "same" },
      { kind: "ice", title: "A field the organics never reached", text: "Survey has a clean field past the line, but it sits on another port's book and the desk has traded you across. Cut a proving lot and let the lab read it.", payK: 1.6, qtyK: 0.6, good: "water_ice", at: "next" },
      { kind: "ice", title: "Fill her and prove the claim", text: "The lab likes the numbers, so hydro wants the tanks brim full off the same field. One long cut closes the shortage and puts tonnage on the claim in the station's name.", payK: 1.3, qtyK: 1.9, good: "water_ice", at: "same" },
    ],
    bonus: 9500,
    standing: 12,
  },

  /* ---- FREIGHT & LOGISTICS ------------------------------------------------------ */
  {
    id: "long-thirst",
    cat: "logistics",
    name: "THE LONG THIRST",
    blurb: "The ring's reclaimer has cracked and they are drinking the reserve. Keep water on the dock until the stack is rebuilt.",
    sectors: ["agricultural", "civilian"],
    stages: [
      { kind: "supply", title: "Water on the dock, everything else waits", text: "Their reclaimer is down and the reserve is falling. Buy water wherever it is cheap and get it onto their dock. Nobody is asking where it came from.", payK: 1.3, qtyK: 1.4, good: "water" },
      { kind: "supply", title: "The condenser stack came apart", text: "Stripping the reclaimer found the condenser scaled through and split. Find heat exchangers that will bolt to an old frame and bring them in.", payK: 1.4, qtyK: 0.7, good: "heat_ex", at: "same" },
      { kind: "courier", title: "Logic can out to the bench, bonded", text: "The control unit went down with the stack and nobody here will sign off a repair. It travels sealed, on a short clock, and the bench will not hold the slot past the window.", payK: 1.9, qtyK: 0.3, good: "controller", at: "same" },
      { kind: "haul", title: "Clear the old membranes off the pad", text: "The stripped membrane stacks are crated and sitting where the rebuild needs to happen. A reprocessor has bought the lot, so take the consignment out on the manifest the desk hands you.", payK: 1.1, qtyK: 1.2, good: "polymer", at: "same" },
      { kind: "supply", title: "Fill the reserve back to the line", text: "The reclaimer is turning again and the ring wants its buffer deep before anyone relaxes. Bring water in one more time, as much as you can carry.", payK: 1.5, qtyK: 1.6, good: "water", at: "same" },
    ],
    bonus: 9500,
    standing: 12,
  },
  {
    id: "sealed-manifest",
    cat: "logistics",
    name: "SEALED MANIFEST",
    blurb: "A bonded case with the contents field left blank, a clock on it, and a consignee who keeps rewriting the order.",
    sectors: ["logistic", "military"],
    stages: [
      { kind: "courier", title: "Bonded case, contents field blank", text: "The case is light, sealed at both ends and logged as bonded freight. You are not cleared to know what is in it, only where it has to be and by when.", payK: 2.1, qtyK: 0.3, good: "chip" },
      { kind: "supply", title: "The consignee changes the order", text: "The desk that signed for the case now says the requisition was wrong and what they actually want is sensor stock. Argue if it makes you feel better, then go and find it.", payK: 1.3, qtyK: 0.9, good: "sensor", at: "same" },
      { kind: "haul", title: "The case goes out again, resealed", text: "Same case, new seal, new bond number, riding inside whatever the yard is shipping this shift. The load is real freight and pays as freight; the case is along for the trip.", payK: 1.5, qtyK: 1.1, at: "same" },
      { kind: "courier", title: "Last leg, and someone finally signs", text: "The owner has surfaced and will take delivery in person, on a clock again. When the bond officer cuts the seal you are allowed to watch: a calibration optic for a survey scope, stuck in paperwork since the day it shipped.", payK: 2.3, qtyK: 0.35, good: "optic", at: "next" },
    ],
    bonus: 6500,
    standing: 9,
  },

  /* ---- TRADE & PROCUREMENT ------------------------------------------------------ */
  {
    id: "ceramic-squeeze",
    cat: "trade",
    name: "THE CERAMIC SQUEEZE",
    blurb: "Ceramic keeps climbing and nobody at the exchange will say who is buying. The desk wants stock in hand before it finds out.",
    sectors: ["industrial", "logistic"],
    stages: [
      { kind: "procure", title: "Buy into the squeeze", text: "The desk wants ceramic and will not wait for the price to settle. Find whoever is still selling it cheap and bring a load in.", payK: 1.1, qtyK: 0.9, good: "ceramic" },
      { kind: "resupply", title: "The kiln that is not in on it", text: "One supplier is still pricing ceramic like nothing has happened. Go there, load up, and note who else is queueing on their pad.", payK: 1.3, qtyK: 1.3, good: "ceramic", at: "same" },
      { kind: "tender", title: "Feedstock for our own kilns", text: "If the finished goods are being held off the market, the port will fire its own. Buyers are tendering for silicon at a fixed price over the bid.", payK: 1.4, qtyK: 1.2, good: "silicon", at: "same" },
      { kind: "consign", title: "Sell into the corner", text: "Word is out that we are making our own, and the holders are nervous. Take our ceramic on consignment to the port still paying up, and take your cut.", payK: 1.6, qtyK: 1.4, good: "ceramic", at: "same" },
      { kind: "tender", title: "They come to us", text: "Whoever cornered it now needs stock to cover their own contracts, and this desk is the last seller standing. Bring in every crate you can find, at the price set over the bid.", payK: 2.2, qtyK: 1.0, good: "ceramic", at: "same" },
    ],
    bonus: 9500,
    standing: 13,
  },
  {
    id: "paper-buyer",
    cat: "trade",
    name: "PAPER BUYER",
    blurb: "A house up the lane pays over the book for anything we consign. Nobody here has met them. Take the run and keep your eyes open.",
    sectors: ["logistic", "civilian"],
    stages: [
      { kind: "consign", title: "The buyer who pays over the book", text: "A trading house takes our stock on consignment and settles better than anyone local. Run the first load and see the colour of their money.", payK: 1.2, qtyK: 1.0 },
      { kind: "procure", title: "Their credit is thinner than their prices", text: "They have put in a standing order and will not pay a credit up front. The desk will carry it. Buy the goods wherever they are cheapest and bring them in.", payK: 1.3, qtyK: 1.1, at: "same" },
      { kind: "tender", title: "The same crates, coming home", text: "Our own markings turned up in a lot the buyers here are tendering for. Someone is selling our consignment back to us at a markup. Bring it in and let the desk read the manifests.", payK: 1.5, qtyK: 1.0, at: "same" },
      { kind: "consign", title: "Cut out the middle", text: "The house was never a buyer, only a broker sitting on our stock. The desk has the end customer's name off the manifests now. Take the consignment there direct.", payK: 2.1, qtyK: 1.5, at: "same" },
    ],
    bonus: 5500,
    standing: 9,
  },

  /* ---- SECURITY & BOUNTIES ------------------------------------------------------- */
  {
    id: "quiet-picket",
    cat: "security",
    name: "THE QUIET PICKET",
    blurb: "A routine picket turns up something that was counting our hulls. Work it back to whoever was doing the counting.",
    sectors: ["military", "civilian"],
    stages: [
      { kind: "patrol", title: "Run the outer picket", text: "Standard sweep of the approach. Sit on each picket point until the clock runs out and log whatever drifts past. Nobody is expecting anything." },
      { kind: "rogues", title: "Break the nest the scouts came from", text: "Those loiterers were drone scouts and control backtracked their heading. Go out and take the nest apart before it finishes counting our hulls.", payK: 1.2, at: "same" },
      { kind: "patrol", title: "Same pattern, next port along", text: "The port down the lane is reporting the same quiet traffic on its approach. Hold their picket points and tell us whether the pattern holds.", payK: 1.1, at: "next" },
      { kind: "escort", title: "Ride with the boat carrying the logs", text: "The recovered nav logs go back for analysis on a slow supply boat. Stay inside escort range the whole run. Somebody would rather they did not arrive.", payK: 1.4, at: "same" },
      { kind: "bounty", title: "Close it out on the hull selling timings", text: "The logs name the hull that has been passing our convoy timings along. It is on the board now, paid on the kill. Expect it to fight.", payK: 2.1, at: "same" },
    ],
    bonus: 9000,
    standing: 11,
  },
  {
    id: "boats-going-missing",
    cat: "security",
    name: "BOATS GOING MISSING",
    blurb: "This lane keeps swallowing freight and leaving no wreckage. Ride it, find what is doing it, and finish the job at the far end.",
    sectors: ["logistic", "industrial"],
    stages: [
      { kind: "escort", title: "Ride the lane that keeps losing boats", text: "Hulls go out on this run and do not arrive, and nobody finds a wreck field. Stay inside escort range of the supply boat and see what comes for it." },
      { kind: "rogues", title: "Break the nest sitting off the line", text: "What jumped the boat pulled off toward a nest parked quiet beside the shipping line. Clear the drones out of it while we still know where it is.", payK: 1.3, at: "same" },
      { kind: "patrol", title: "Picket the approach at the far end", text: "Those drones were being fed positions from near the other end of the run. Hold each picket point on that approach and let the scanners listen.", payK: 1.1, at: "next" },
      { kind: "bounty", title: "Take the hull working the relay", text: "The relay traces back to one hull that has been loitering in the lane looking like ordinary traffic. It is on the board. Paid on the kill, no salvage terms.", payK: 2.2, at: "same" },
    ],
    bonus: 6500,
    standing: 9,
  },

  /* ---- SALVAGE & RECOVERY --------------------------------------------------------- */
  {
    id: "adjusters-reconstruction",
    cat: "salvage",
    name: "LOSS ADJUSTMENT",
    blurb: "An underwriter is rebuilding a total loss from the pieces. She pays for metal, for scans, and for anything with a serial on it.",
    sectors: ["logistic", "industrial"],
    stages: [
      { kind: "salvage", title: "Sample for the adjuster's file", text: "She will not open a claim on hearsay. Bring debris iron to the yard and let them grade it with her ticket on the load.", payK: 1.0, qtyK: 0.8 },
      { kind: "wreck", title: "Sit on the primary break", text: "The hull parted forward of the spine and nobody has imaged it since. Hold over the site until the insurers have their scan, then cut what you can carry.", payK: 1.3, qtyK: 1.0, at: "same" },
      { kind: "pod", good: "sensor", title: "Recover the recorder pod off the bridge", text: "A sensor pod came away when she broke up. The adjuster wants it sealed, not opened. Hold while the tractor gets a grip and bring it in as found.", payK: 1.6, qtyK: 0.6, at: "next" },
      { kind: "wreck", title: "The break the claim never mentions", text: "Recorder puts a second failure aft, weeks before the loss. Scan that site and bring back plate from it. She wants metal on the desk, not opinion.", payK: 1.8, qtyK: 1.1, at: "same" },
      { kind: "salvage", title: "Deliver the exhibit metal", text: "The file goes to arbitration and the iron goes with it. Run the last of the debris to the yard she has retained and sign it over on her paperwork.", payK: 2.1, qtyK: 1.3, at: "next" },
    ],
    bonus: 9500,
    standing: 12,
  },
  {
    id: "buying-her-back",
    cat: "salvage",
    name: "BUYING HER BACK",
    blurb: "The yard built that hull and now it is buying her back a plate at a time. No questions, cash on the scale.",
    sectors: ["industrial"],
    stages: [
      { kind: "salvage", title: "First weight on the yard scale", text: "The foreman will not talk numbers until he has seen your metal. Bring debris iron in and let the scale settle before you argue price.", payK: 0.9, qtyK: 0.9 },
      { kind: "wreck", title: "Cut from the section he recognises", text: "He wants frames from the stern, where the yard mark is still legible. Hold on the site for the insurers' scan, then bring the plate home.", payK: 1.3, qtyK: 1.0, at: "same" },
      { kind: "pod", good: "armour_plate", title: "Lift the pod the tug crew walked away from", text: "The field started tumbling and the tug dropped its load rather than lose the boat. Sit steady while the tractor takes it, then bring it in.", payK: 1.5, qtyK: 0.8, at: "same" },
      { kind: "salvage", title: "Close the book across the lane", text: "The rest goes to the partner yard. He would rather his own name was not on the final ticket. Deliver the plate and collect the chit.", payK: 1.9, qtyK: 1.2, at: "next" },
    ],
    bonus: 6000,
    standing: 9,
  },

  /* ---- INDUSTRY & CONSTRUCTION ----------------------------------------------------- */
  {
    id: "line-three-restart",
    cat: "industry",
    name: "LINE THREE RESTART",
    blurb: "Line three has been down nine days. The fabricators want feedstock before they want excuses.",
    sectors: ["industrial"],
    stages: [
      { kind: "materials", title: "Feedstock for the cold hoppers", text: "Line three stopped the day the hoppers ran dry. Bring refined stock to the fabricator deck and they can start the preheat tonight.", payK: 1.0, qtyK: 1.3, good: "steel" },
      { kind: "materials", title: "Alloy for the new press dies", text: "The old dies cracked on the last batch before the shutdown. Metallurgy will cut replacements, but they want proper alloy stock, not scrap.", payK: 1.6, qtyK: 0.5, good: "superalloy", at: "same" },
      { kind: "parts", title: "Drive parts for the roller bed", text: "Half the roller bed seized while the line sat cold. The refit bay has it stripped and is waiting on the drive parts.", payK: 1.4, qtyK: 0.6, good: "bearing", at: "same" },
      { kind: "parts", title: "Boards for the control cabinet", text: "The control cabinet is a generation out of date and the rebuild is being done at the partner works. Their bay wants the boards before the shift ends.", payK: 1.8, qtyK: 0.4, good: "controller", at: "next" },
      { kind: "materials", title: "Buffer stock so it never stops again", text: "The partner works runs the same feedstock. Fill their buffer and they will cover the line the next time supply goes thin.", payK: 1.2, qtyK: 1.5, good: "steel", at: "same" },
    ],
    bonus: 6500,
    standing: 9,
  },
  {
    id: "ring-two-extension",
    cat: "industry",
    name: "RING TWO EXTENSION",
    blurb: "The habitat ring is two segments short and a season behind. Steel first, then everything the crews cannot bodge.",
    sectors: ["industrial", "logistic"],
    stages: [
      { kind: "build", title: "Girders for the ring two spine", text: "The extension is two segments short of closing. Lift girders out to the frame crew so they can start running the spine.", payK: 1.2, qtyK: 1.4, good: "girder" },
      { kind: "build", title: "Deck plate for the new segments", text: "Frames are up and the crews are working off mesh and goodwill. Take deck plate out and they can floor both segments this rotation.", payK: 1.3, qtyK: 1.2, good: "steel_plate", at: "same" },
      { kind: "parts", title: "Actuators for the segment locks", text: "Every new segment needs its locks driven and proof tested. The refit bay is assembling the door sets and is short the actuators.", payK: 1.5, qtyK: 0.5, good: "actuator", at: "same" },
      { kind: "materials", title: "Seal stock for the ring joints", text: "The joints are leaking faster than the crews can chase them. The fabricators here will extrude new seal profile if you bring them the stock.", payK: 1.1, qtyK: 0.8, good: "polymer", at: "next" },
      { kind: "build", title: "Skin for the last segment", text: "One segment left open to vacuum. Lift the panels out, the crew closes her, and the ring gets pressurised on schedule for once.", payK: 1.9, qtyK: 1.0, good: "hull_panel", at: "same" },
    ],
    bonus: 8500,
    standing: 11,
  },
  {
    id: "hull-forty-one",
    cat: "industry",
    name: "HULL FORTY-ONE",
    blurb: "Hull forty-one has sat in the bay eight months, waiting on other people's shortages. Time to finish her.",
    sectors: ["industrial", "military"],
    stages: [
      { kind: "materials", title: "Stock for the frame shop", text: "Forty-one's frames were cut to a design nobody builds any more. The shop will recut them from scratch if you bring the stock.", payK: 1.5, qtyK: 0.7, good: "titanium" },
      { kind: "build", title: "Panels for the deep dock cradle", text: "She is being moved to a dock that can take her weight. Run the panels out so the cradle is skinned and shored before the tow arrives.", payK: 1.4, qtyK: 0.9, good: "hull_panel", at: "next" },
      { kind: "parts", title: "Mid-section for hull forty-one", text: "There is a hole amidships where the pressure section should be. Get it into the bay and the welders can close her at last.", payK: 1.8, qtyK: 0.5, good: "pressure_hull", at: "same" },
      { kind: "parts", title: "The bell that stalled the whole refit", text: "One part has held this refit since spring. Land it in the bay and the yard can finally book a burn test.", payK: 1.9, qtyK: 0.4, good: "thruster_bell", at: "same" },
      { kind: "parts", title: "Rods for her first cold start", text: "Welded, closed and signed off by three inspectors. Bring the rods and forty-one lights her own reactor for the first time.", payK: 2.2, qtyK: 0.35, good: "reactor_rod", at: "same" },
    ],
    bonus: 9500,
    standing: 12,
  },

  /* ---- ENERGY & FUEL ---------------------------------------------------------------- */
  {
    id: "flare-debt",
    cat: "energy",
    name: "FLARE DEBT",
    blurb: "A flare front put the collectors down and the bunkers with them. Fuel first, then parts, then everything back where it was.",
    sectors: ["industrial", "logistic"],
    stages: [
      { kind: "fuel", title: "Top the day tanks ahead of the next gust", text: "The flare front knocked the collectors flat and the day tanks are down to hours. Get bunker fuel onto the fuel desk before the next gust arrives.", payK: 1.3, qtyK: 0.9, good: "hydrogen_r" },
      { kind: "fuel", title: "Fill the main bunker, not just the tanks", text: "Day tanks buy a shift. The main bunker buys the week. Load deep and run it in while the berth queue is still short.", payK: 1.2, qtyK: 1.6, good: "deuterium_r", at: "same" },
      { kind: "reactor", title: "Swap the panel the flare cooked", text: "Second-stage heat rejection took the worst of it and the plant is holding at reduced output. The overhaul crew wants the replacement on the pad before shift change.", payK: 1.5, qtyK: 0.7, good: "radiator", at: "same" },
      { kind: "reactor", title: "Restart bank for the plant downstream", text: "Same storm, worse luck. The neighbouring plant tripped and cannot hold a start, and they are short the gear to charge the restart bank. Haul it across.", payK: 1.6, qtyK: 0.8, good: "capacitor", at: "next" },
      { kind: "fuel", title: "Put the reserve back where you found it", text: "Everything they had went into keeping the lights on, and the reserve is empty. Refill it while the sky is quiet. It will not stay quiet.", payK: 1.8, qtyK: 1.2, at: "same" },
    ],
    bonus: 9000,
    standing: 11,
  },
  {
    id: "slipped-overhaul",
    cat: "energy",
    name: "SLIPPED OVERHAUL",
    blurb: "The plant overhaul has been deferred four quarters running. This time the parts arrive before the excuses do.",
    sectors: ["industrial", "military"],
    stages: [
      { kind: "reactor", title: "Feed the overhaul that keeps slipping", text: "The outage has been pushed back every quarter this year, and the spares list is still open. Bring the fuel elements so the plant runs out of reasons to wait.", payK: 1.0, qtyK: 1.1, good: "reactor_rod" },
      { kind: "reactor", title: "Cracked exchanger found on the strip-down", text: "With the set open they found a crack nobody had budgeted for. The overhaul stops here until the replacement is on the floor.", payK: 1.3, qtyK: 0.8, good: "heat_ex", at: "same" },
      { kind: "fuel", title: "Bunkers for the port carrying the load", text: "While the main set is open, a neighbouring port is holding the grid up on gas turbines. That burns through bunkers faster than anyone costed. Keep their desk supplied.", payK: 1.4, qtyK: 1.5, good: "methane", at: "next" },
      { kind: "reactor", title: "Repay the port that took the strain", text: "Their own heat rejection has been running hot for weeks and is close to letting go. Land the replacement and both plants finish the season standing.", payK: 1.7, qtyK: 0.9, good: "radiator", at: "same" },
    ],
    bonus: 6000,
    standing: 9,
  },

  /* ---- SURVEY & SCIENCE --------------------------------------------------------------- */
  {
    id: "weathering-series",
    cat: "science",
    name: "WEATHERING SERIES",
    blurb: "The register has a hole in it and the lab wants it closed properly: two worlds, two trays, and a lane the next crew can repeat.",
    sectors: ["civilian", "industrial"],
    stages: [
      { kind: "survey", title: "Close the gap in the weathering register", text: "The register has this world down from a single pass, decades back. Close on it and run the scan properly. Everything after this sits on that baseline.", payK: 1.0 },
      { kind: "assay", good: "regolith", title: "Tray one: loose material off the drift", text: "The lab wants surface material, not core. Work the drift on the job card and bring the units in unmixed.", payK: 1.2, qtyK: 0.7, at: "same" },
      { kind: "survey", title: "Second world, same instrument settings", text: "Now the same run on a world we already have numbers for, so the first set has something to sit against. Do not touch the instrument settings between passes.", payK: 1.3, at: "next" },
      { kind: "chart", title: "Record the approach so it can be repeated", text: "Reviewers will ask whether the next crew can fly the same approach. Sit on the beacon and let the plot take the lane, then bring it back.", payK: 1.4, at: "same" },
      { kind: "assay", good: "silicate", title: "Last tray for the silicate series", text: "One more tray and the series is closed. Silicate this time, from the drift on the card. The paper goes out with your approach lane in the method.", payK: 1.7, qtyK: 0.9, at: "same" },
    ],
    bonus: 8000,
    standing: 11,
  },
  {
    id: "lane-reads-short",
    cat: "science",
    name: "THE LANE READS SHORT",
    blurb: "Crews keep filing the same complaint about one beacon. The nav office wants the lane flown, cross-checked and amended.",
    sectors: ["logistic", "civilian"],
    stages: [
      { kind: "chart", title: "The beacon that reads short", text: "Three crews have filed the same complaint about this lane. Fly out, hold the mark, and bring the plot home clean.", payK: 1.1 },
      { kind: "chart", title: "Cross-check the neighbouring mark", text: "One bad reading is a fault in the kit. Two is a fault in the lane. Take the next mark along, same way, same hold.", payK: 1.2, at: "next" },
      { kind: "survey", title: "Scan whatever is pulling the plot", text: "The error grows on one side of the run, so something unregistered is sitting off it. Close on that world and scan it before anyone starts guessing.", payK: 1.5, at: "same" },
      { kind: "chart", title: "File the amendment with the nav office", text: "Fly the first lane again with the new mass figures loaded and hold for the record. The office will not amend a chart on one pass.", payK: 1.9, at: "next" },
    ],
    bonus: 5500,
    standing: 8,
  },
  {
    id: "world-viability-file",
    cat: "science",
    name: "VIABILITY STUDY",
    blurb: "A world sits on a terraforming shortlist on the strength of one distant reading. Find out what it is actually made of.",
    sectors: ["agricultural", "industrial"],
    stages: [
      { kind: "survey", title: "First honest look at the candidate", text: "Somebody put this world on a shortlist off a long-range reading. Close on it and scan it properly before the study spends another credit.", payK: 1.0 },
      { kind: "assay", good: "water_ice", title: "How much water is actually down there", text: "Nothing else in the file matters if the water budget is short. Cut ice from the drift on the card and bring it in sealed.", payK: 1.3, qtyK: 1.2, at: "same" },
      { kind: "assay", good: "tholins", title: "Volatiles from the outer drift", text: "Nitrogen and the rest of the gas budget come out of the cold stuff. Work the drift the job points at and keep the load cold on the way in.", payK: 1.5, qtyK: 0.8, at: "next" },
      { kind: "assay", good: "ilmenite", title: "Oxygen you can get out of the rock", text: "A world you cannot breathe on is a mine with weather. Bring ilmenite off the drift on the card so the lab can run the extraction figures.", payK: 1.7, qtyK: 1.0, at: "same" },
      { kind: "survey", title: "Close the file with a second pass", text: "The committee wants one clean scan set against everything you have carried in. Fly it, run it, and the file closes either way.", payK: 2.1, at: "next" },
    ],
    bonus: 9500,
    standing: 12,
  },

  /* ---- CIVIC SERVICES ------------------------------------------------------------------ */
  {
    id: "civic-clinic-surge",
    cat: "civic",
    name: "CLINIC SURGE",
    blurb: "A recycler fault has put half the ring on the ward list. Nothing exotic, just a lot of it, and the clinic is out of stock.",
    sectors: ["civilian"],
    stages: [
      { kind: "medical", title: "Restock the ward before the night shift", text: "The clinic went through a fortnight of stock in two days. Bring medkits in and hand them to the ward sister, not the dock office.", payK: 1.1, qtyK: 1.0, good: "medkit" },
      { kind: "medical", title: "Scrub charges for the water plant", text: "Source is a failed scrubber stack on the recycler. Deliver life scrub so the plant crew can clear the line before the next cycle.", payK: 1.3, qtyK: 0.8, good: "life_scrub", at: "next" },
      { kind: "food", title: "Water while the mains stay locked out", text: "Galley is shut until the sampling comes back clean. Run water in so the ring can eat and drink without boiling everything first.", payK: 1.0, qtyK: 1.4, good: "water", at: "same" },
      { kind: "medical", title: "Reagents for the screening bench", text: "This port is taking the overflow cases and wants everyone screened before they board. Deliver organics for the assay benches.", payK: 1.4, qtyK: 0.6, good: "organics", at: "next" },
      { kind: "medical", title: "Close the incident out", text: "Sampling is clean and the ward is emptying. Top the clinic back to its standing hold and the desk will sign the incident shut.", payK: 1.6, qtyK: 1.2, good: "medkit", at: "same" },
    ],
    bonus: 8800,
    standing: 11,
  },
  {
    id: "civic-racks-down",
    cat: "civic",
    name: "RACKS DOWN",
    blurb: "A hab ring lost its growing racks to a thermal fault. Feed the ring, clear the beds, and get the next crop standing.",
    sectors: ["agricultural", "civilian"],
    stages: [
      { kind: "food", title: "Feed the ring while the beds are dark", text: "Every rack went over temperature and took the crop with it. Bring rations in to cover the mess halls until the beds are back.", payK: 1.0, qtyK: 1.5, good: "ration" },
      { kind: "medical", title: "Kit out the clearing crew", text: "Dead crop in a warm ring goes mouldy quickly and the spores are hard on lungs. Deliver life scrub so the crew can work a full shift.", payK: 1.3, qtyK: 0.5, good: "life_scrub", at: "same" },
      { kind: "food", title: "Charge the borrowed grow decks", text: "A nearby port is lending its spare decks for one season. Run fertiliser over so they can charge the beds before the stock arrives.", payK: 1.1, qtyK: 1.2, good: "fertiliser", at: "next" },
      { kind: "food", title: "Stand the new crop up", text: "Beds are charged and the lamps are on the timer. Deliver hydroponic stock and the ring's agronomist says there will be greens by the turn of the season.", payK: 1.5, qtyK: 0.9, good: "hydroponic", at: "same" },
    ],
    bonus: 6000,
    standing: 8,
  },
  {
    id: "civic-one-good-scope",
    cat: "civic",
    name: "ONE GOOD SCOPE",
    blurb: "The district school has one working telescope and a survey slot it cannot reach on its own. Fly the class; they will do the rest.",
    sectors: ["civilian", "logistic"],
    stages: [
      { kind: "fieldtrip", title: "Take the upper school out for a baseline", text: "The class wants its own plate of the field before anyone argues about the numbers. Fly them out and hold in survey range while they log the frame.", payK: 1.2 },
      { kind: "relay", title: "Re-key the beacon that carries their data", text: "Their upload runs through a beacon still on last year's cipher, and the net is being re-keyed after a breach. Sit on it and hold while the relay takes the new key.", payK: 1.0, at: "next" },
      { kind: "food", title: "Galley stores for the long leg", text: "The next run is days out and back with a full class aboard. Deliver stores before the school ship books its slot.", payK: 0.9, qtyK: 0.8, good: "ration", at: "same" },
      { kind: "fieldtrip", title: "Second world, same instrument", text: "Comparison is the whole point of the exercise. Take the class out again and hold in survey range until the frames match the first set.", payK: 1.4, at: "next" },
      { kind: "fieldtrip", title: "The occultation window", text: "The window opens once this season and it does not wait for anybody. Have the class in survey range before it starts and hold through it. That pass is their year of data.", payK: 1.8, at: "same" },
    ],
    bonus: 9000,
    standing: 12,
  },
];

export const CHAIN_BY_ID = Object.fromEntries(CHAINS.map((c) => [c.id, c]));
