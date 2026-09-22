/* The rig: everything ops needs to know about whatever is currently on the cradle —
 * a full ship or a single inspected part. Refilled by opsBind(). */
export const rig = {
  root: null, builder: null, size: null, U: 1, accent: "#9ceeff", occ: [],
  turrets: [], launchers: [], drills: [], intakes: [], rcs: [], deployables: [], docks: [], sensors: [],
  engineLights: [], srbPlumes: [], reactors: []
};
