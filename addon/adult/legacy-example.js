/** FICTIONAL SAMPLE WORLD ONLY. Never automatically mixed into the game registry. */
export const EXAMPLE_LEGACY = {
  version: 1,
  families: [
    { id: 'vale', name: 'House Vale', founderId: 'iona',
      founding: { year: 2186, status: 'verified', source: 'Kepler Anchorage settlement register', story: 'She organized the station’s first independent repair cooperative after the supply convoys stopped.', cost: 'Her letters describe two winters in temporary quarters. The family toast remembers the charter signing; it rarely mentions the people who kept the heat on.' },
      names: [
        { name: 'Iona', reason: 'The founder’s name; later branches used it as a middle name so children could keep a first name of their own.' },
        { name: 'Ren', reason: 'A navigation teacher, remembered for taking in children stranded by the convoy collapse.' },
        { name: 'Sera', reason: 'An old settlement name meaning “the return” in family usage; its earlier linguistic origin is unrecorded.' },
        { name: 'Aven', reason: 'A newer name first entered by an adopted branch of the family.' }
      ],
      traditions: [{ text: 'At a naming meal, each person tells one useful truth about an ancestor. Nobody is required to tell a heroic one.' }],
      archives: [{ label: 'Founding charter', location: 'Kepler Anchorage civic archive, ring C', note: 'The cooperative charter and later sale are separate records.' }, { label: 'Private letters', location: 'Vale family chest aboard the Wayfarer', visibility: 'personal', note: 'Access requires the family’s permission.' }]
    },
    { id: 'merrow', name: 'The Merrow family', founderId: 'tavi',
      founding: { year: 2191, status: 'testimony', source: 'Lysa’s recorded recollection', story: 'Tavi chose the family name after resettlement. The older passenger manifest was lost.' },
      names: [{ name: 'Tavi', reason: 'Honors the resettlement founder without claiming to know the name used before the crossing.' }, { name: 'Lysa', reason: 'The name of the relative who preserved the oral register.' }, { name: 'Orin', reason: 'A name shared across two branches, with no claim of a single original bearer.' }],
      traditions: [{ text: 'Every departure gets a forwarding address, even when people are angry with each other.' }], archives: [] }
  ],
  people: [
    { id: 'iona', name: 'Iona Vale', givenName: 'Iona', familyId: 'vale', parents: [], stories: [{ status: 'verified', source: 'her letters', text: 'she signed the cooperative charter only after apprentices were guaranteed a vote.' }] },
    { id: 'ren', name: 'Ren Vale', familyId: 'vale', parents: [{ id: 'iona', kind: 'biological' }], stories: [{ status: 'testimony', source: 'family oral register', text: 'he kept teaching navigation after losing his own flight clearance.' }] },
    { id: 'sera', name: 'Sera Vale', familyId: 'vale', parents: [{ id: 'ren', kind: 'adoptive' }], stories: [{ status: 'testimony', visibility: 'personal', text: 'she refused an office job because the maintenance crew would have lost its elected representative.' }] },
    { id: 'mara', name: 'Mara Vale', age: 32, familyId: 'vale', parents: [{ id: 'sera', kind: 'biological' }], stories: [] },
    { id: 'tavi', name: 'Tavi Merrow', familyId: 'merrow', parents: [], stories: [] },
    { id: 'lysa', name: 'Lysa Merrow', familyId: 'merrow', parents: [{ id: 'tavi', kind: 'biological' }], stories: [] },
    { id: 'player', name: 'Alex Merrow', age: 31, familyId: 'merrow', parents: [{ id: 'lysa', kind: 'biological' }], stories: [] }
  ],
  corporations: [{ id: 'kepler', name: 'Kepler Repair Cooperative' }, { id: 'heliodyne', name: 'Heliodyne Logistics' }],
  ties: [
    { id: 'iona-founder', personId: 'iona', corporationId: 'kepler', kind: 'founder', startYear: 2186, endYear: 2221, status: 'verified', source: 'cooperative charter' },
    { id: 'iona-shares', personId: 'iona', corporationId: 'kepler', kind: 'ownership', share: 12, startYear: 2186, endYear: 2221, status: 'verified', source: 'share ledger', note: 'The closing entry records a sale, not an inheritance.' },
    { id: 'ren-job', personId: 'ren', corporationId: 'heliodyne', kind: 'employment', role: 'navigation instructor', startYear: 2230, endYear: 2259, status: 'verified', source: 'payroll archive' },
    { id: 'lysa-job', personId: 'lysa', corporationId: 'heliodyne', kind: 'employment', role: 'convoy dispatcher', startYear: 2238, endYear: 2270, status: 'verified', source: 'service certificate' },
    { id: 'sera-shares', personId: 'sera', corporationId: 'heliodyne', kind: 'ownership', share: 0.4, startYear: 2265, endYear: 2280, status: 'rumor', visibility: 'private', knownTo: ['mara'], source: 'an unsigned family note', note: 'No transfer document has been found. This is not a current ownership claim.' }
  ], memories: {}, events: []
};
