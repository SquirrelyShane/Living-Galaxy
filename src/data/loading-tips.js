// Living Galaxy — the loading screen's voice. One rotating line under the headline
// while the boot pipeline works, because a bar that only counts is a wait and a bar
// with a voice is a briefing. Lore and flying advice mixed on purpose: half of these
// teach a control, half teach the world, and a new pilot cannot yet tell which is
// which — which is exactly how a setting should arrive.
//
// Pure data. `ui/loading.js` rotates through them; nothing else imports this.

export const LOADING_TIPS = [
  'Every system is grown from a seed. Nothing is stored — the galaxy is mathematics with a memory for what you did to it.',
  'Stations orbit planets, and planets sit in gravity wells. A warp core will not hold in a well — burn to the edge first.',
  'WARP WITHIN puts you a chosen distance off the mark. Arriving on top of an unidentified contact is a choice, not an accident.',
  'The sensor array sees further than the eye. The contact list, the chart and the canopy brackets all read the same sweep.',
  'ARIA flies the ship the way you would — approach, mine, dock, hunt. She will also tell you why. Ask her.',
  'Credits banked with the galaxy live on the server, under your account. A wiped browser cannot touch them.',
  'Standing is per-individual, not per-faction. The captain you spared remembers. So does the one you did not.',
  'Contraband is relative to whoever owns the berth. The same crate is cargo on one pad and a confession on another.',
  'Solar arrays charge the bank for free — and lock the throttle while deployed. Committed is a place.',
  'Belts hide more than ore. Watch the shadows of the big rocks; sensors have shadows too.',
  'Docking is measured hull-to-berth. Five hundred metres of gap means the same thing at every pad in the galaxy.',
  'A doctrine tells the autopilot what to reach for first. It cannot invent a target that is not there.',
  'The crew talks when something causes it. If the galley has gone quiet, that is also information.',
  'Persuasion odds are printed on the button and seeded when the channel opens. A reload cannot reroll a conversation.',
  'The host of a system simulates its traffic for everyone in it. Leaving hands the sky to the next-longest-connected.',
  'Wrecks are places, not contacts. Places keep.',
  'Heat is a budget. Radiators pay it down; venting pays it all at once, loudly.',
  'The nine powers were here before you and will be here after. Where their borders rub is where the work is.',
  'Your ship remembers wear per module. A serviced drive and a survived drive are different machines.',
  'Two pilots in one system share one sky — same rocks, same wrecks, same pirates. Bring a friend to the same node.',
  'The galactic chart is jump-range honest: if the line will not draw, the drive will not make it. Fuel is not the only distance.',
  'Provisions are ordinary cargo. Hydroponics just means the galley shops aboard.'
];
