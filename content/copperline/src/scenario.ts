import { scenarioSchema } from "@plans-and-parcels/game-core";

const copperlineRaw = {
  schemaVersion: 1,
  id: "copperline",
  version: "1.0.0",
  title: "The Copperline Crossroads",
  subtitle: "A contested district. A forty-five-day clock. No perfect plan.",
  durationMinutes: 120,
  minimumPlayers: 4,
  maximumPlayers: 6,
  publicBrief:
    "Copperline Partners seeks rezoning and public infrastructure support for a 94-acre former industrial site beside Hearthside. Council needs a recommendation tonight addressing housing, displacement, mobility, schools, wetlands, historic Copper Row, and implementation.",
  facilitatorBrief:
    "The submitted design is a negotiating position. A viable compact plan exists if the team discovers leverage: reduced parking can finance affordability, a connected grid can replace the interchange, rail can reserve a station, a state grant can fund restoration, housing trust funds can protect residents, and a heritage corridor can preserve Copper Row. The notice list also omitted fourteen owners; prompt disclosure preserves the schedule.",
  startingTracks: {
    publicTrust: 4,
    equity: 3,
    implementationCapacity: 4,
    politicalSupport: 4
  },
  phaseDurations: {
    briefing: 10,
    investigation: 25,
    stakeholder_forum: 25,
    recommendation: 15,
    hearing: 25,
    epilogue: 10
  },
  roles: [
    {
      id: "comprehensive-planner",
      characterName: "Rowan Vale",
      profession: "Comprehensive Planner",
      purpose: "Connect policies, people, and long-term outcomes.",
      attributes: {
        analysis: 2,
        empathy: 2,
        persuasion: 2,
        procedure: 2,
        vision: 3,
        resilience: 1
      },
      specialties: [
        {
          id: "policy-alignment",
          name: "Policy Alignment",
          description: "Connect the proposal to adopted plans and implementation commitments."
        },
        {
          id: "scenario-building",
          name: "Scenario Building",
          description: "Compare plausible futures and expose their tradeoffs."
        },
        {
          id: "plan-synthesis",
          name: "Plan Synthesis",
          description: "Combine evidence and professional recommendations into one package."
        }
      ],
      professionalMove: {
        id: "connect-the-plans",
        name: "Connect the Plans",
        description:
          "Once per game, cite two discovered facts pointing toward the same conclusion and improve the check result by one category."
      },
      startingKnowledge:
        "The comprehensive plan directs at least 40% of new housing toward transit corridors and also requires anti-displacement measures in vulnerable neighborhoods.",
      prompt: "What future does this decision make easier, and what future does it foreclose?"
    },
    {
      id: "zoning-administrator",
      characterName: "Morgan Reed",
      profession: "Zoning Administrator",
      purpose: "Find defensible paths through law, code, and procedure.",
      attributes: {
        analysis: 2,
        empathy: 1,
        persuasion: 1,
        procedure: 3,
        vision: 1,
        resilience: 3
      },
      specialties: [
        {
          id: "code-interpretation",
          name: "Code Interpretation",
          description: "Identify lawful authority, conditions, and procedural paths."
        },
        {
          id: "hearing-procedure",
          name: "Hearing Procedure",
          description: "Protect notice, records, findings, and decision integrity."
        },
        {
          id: "nonconforming-uses",
          name: "Nonconforming Uses",
          description: "Resolve legacy uses and unusual site history."
        }
      ],
      professionalMove: {
        id: "find-a-lawful-path",
        name: "Find a Lawful Path",
        description:
          "Once per game, require the facilitator to provide two procedurally valid routes and the primary risk attached to each."
      },
      startingKnowledge:
        "Council can meet the applicant's 45-day schedule only if the application is complete and required notice is legally sufficient.",
      prompt: "Who has authority to make that promise, and what must happen for it to bind?"
    },
    {
      id: "transportation-planner",
      characterName: "Avery Chen",
      profession: "Transportation Planner",
      purpose: "Understand networks, access, safety, and movement across modes.",
      attributes: {
        analysis: 3,
        empathy: 1,
        persuasion: 1,
        procedure: 1,
        vision: 2,
        resilience: 2
      },
      specialties: [
        {
          id: "network-analysis",
          name: "Network Analysis",
          description: "Test how street connections distribute trips and improve access."
        },
        {
          id: "complete-streets",
          name: "Complete Streets",
          description: "Design safe, useful movement for every mode and ability."
        },
        {
          id: "transit-planning",
          name: "Transit Planning",
          description: "Protect transit operations, access, and future station feasibility."
        }
      ],
      professionalMove: {
        id: "reveal-the-network",
        name: "Reveal the Network",
        description:
          "Once per game, cancel one negative track effect from a mobility commitment supported by discovered evidence."
      },
      startingKnowledge:
        "The traffic study assumes every household will drive and a new interchange will be built. It models no transit, walking, cycling, or demand-management scenario.",
      prompt: "What trips disappear, shift, or become safer if we change the network?"
    },
    {
      id: "gis-environmental-analyst",
      characterName: "Samira Ortiz",
      profession: "GIS and Environmental Analyst",
      purpose: "Test spatial claims and connect development to land, water, and history.",
      attributes: {
        analysis: 3,
        empathy: 1,
        persuasion: 1,
        procedure: 2,
        vision: 2,
        resilience: 2
      },
      specialties: [
        {
          id: "spatial-analysis",
          name: "Spatial Analysis",
          description: "Overlay site, infrastructure, environmental, and historic conditions."
        },
        {
          id: "data-quality",
          name: "Data Quality",
          description: "Find projection errors, obsolete sources, and unsupported claims."
        },
        {
          id: "environmental-constraints",
          name: "Environmental Constraints",
          description: "Interpret wetlands, flood storage, restoration, and performance."
        }
      ],
      professionalMove: {
        id: "ground-truth",
        name: "Ground Truth",
        description:
          "Once per game, cancel one track loss caused by a mapping error, rumor, or unsupported factual claim."
      },
      startingKnowledge:
        "The parcel layer and wetland inventory use different coordinate systems, and the environmental data are nine years old.",
      prompt: "What does the map omit, and who would notice the omission first?"
    },
    {
      id: "community-engagement-specialist",
      characterName: "Jordan Brooks",
      profession: "Community Engagement Specialist",
      purpose: "Build an inclusive process and identify interests beneath positions.",
      attributes: {
        analysis: 1,
        empathy: 3,
        persuasion: 3,
        procedure: 1,
        vision: 1,
        resilience: 2
      },
      specialties: [
        {
          id: "facilitation",
          name: "Facilitation",
          description: "Structure useful participation and turn conflict into choices."
        },
        {
          id: "conflict-deescalation",
          name: "Conflict De-escalation",
          description: "Keep difficult conversations productive without erasing disagreement."
        },
        {
          id: "accessible-communication",
          name: "Accessible Communication",
          description: "Make technical choices understandable and participation practical."
        }
      ],
      professionalMove: {
        id: "make-room",
        name: "Make Room",
        description:
          "Once per game, bring an unheard stakeholder into the scene, reveal their underlying need, and increase Public Trust by one."
      },
      startingKnowledge:
        "Hearthside residents requested an anti-displacement strategy during the last plan update. The request appears in an appendix but not in the implementation program.",
      prompt: "Who is absent, and what would participation cost them?"
    },
    {
      id: "housing-equity-planner",
      characterName: "Taylor Okafor",
      profession: "Housing and Equity Planner",
      purpose: "Test affordability, displacement risk, and the distribution of benefits.",
      attributes: {
        analysis: 2,
        empathy: 3,
        persuasion: 2,
        procedure: 1,
        vision: 2,
        resilience: 1
      },
      specialties: [
        {
          id: "housing-feasibility",
          name: "Housing Feasibility",
          description: "Test housing terms against financing, income, and enforcement."
        },
        {
          id: "anti-displacement",
          name: "Anti-displacement Strategy",
          description: "Design protections that operate before and during development."
        },
        {
          id: "equity-analysis",
          name: "Equity Analysis",
          description: "Identify who benefits, who pays, and who carries risk."
        }
      ],
      professionalMove: {
        id: "who-benefits",
        name: "Who Benefits?",
        description:
          "Once per game, add a funded anti-displacement safeguard, increase Equity by one, and ignore its normal Capacity cost."
      },
      startingKnowledge:
        "The applicant's 62 workforce units expire after 15 years. None serve the lowest-income Hearthside renters, and there is no right-to-return protection.",
      prompt: "Affordable to whom, for how long, and enforceable by whom?"
    }
  ],
  evidence: [
    {
      id: "e1-project-viability",
      title: "Project Viability",
      summary: "The preferred design contains more parking and road work than financing requires.",
      detail:
        "The project remains viable at 520 homes if parking falls below 700 spaces and the town provides a predictable review schedule.",
      visibility: "facilitator",
      leverage:
        "The applicant will accept 18% income-restricted homes for 40 years and contribute $2 million to anti-displacement if the project retains 520 homes and a lawful 45-day decision."
    },
    {
      id: "e2-connected-network",
      title: "Connected Network",
      summary: "The traffic study models only an interchange-based driving scenario.",
      detail:
        "A connected grid, signal changes, bus priority, safe crossings, and demand management can serve the compact plan without a new interchange.",
      visibility: "facilitator",
      leverage:
        "The Regional Rail Authority will fund a design study if the town reserves an eight-acre corridor."
    },
    {
      id: "e3-copper-run",
      title: "Copper Run Restoration",
      summary: "The official parcel and wetland layers do not align.",
      detail:
        "Twelve acres qualify as wetland or flood storage. A ten-acre restored buffer improves flood performance.",
      visibility: "facilitator",
      leverage:
        "A state resilience grant can cover 60% of eligible work if the project preserves the buffer this funding cycle."
    },
    {
      id: "e4-copper-row",
      title: "Copper Row Heritage Corridor",
      summary: "Copper Row resources extend farther into the site than the applicant's map shows.",
      detail:
        "The most significant foundations, paths, and gathering spaces fit within a six-acre heritage corridor.",
      visibility: "facilitator",
      leverage:
        "The Descendants Council will support compact development outside the corridor with binding co-stewardship and funded archaeology."
    },
    {
      id: "e5-hearthside-housing",
      title: "Hearthside Housing Conditions",
      summary: "Sixty-eight renter households face immediate displacement risk.",
      detail:
        "Bellwether's housing trust has $1.2 million available for a land trust, right-to-return, rental assistance, or home repair.",
      visibility: "facilitator",
      leverage:
        "The Hearthside Coalition will consider support if protection begins before construction."
    },
    {
      id: "e6-schools-and-notice",
      title: "Schools and Notice",
      summary: "School capacity and hearing notice are both real but repairable.",
      detail:
        "The district accepts phased occupancy, a $3.8 million contribution, and a reserved school site. The notice list omitted fourteen owners.",
      visibility: "facilitator",
      leverage:
        "Immediate corrected notice preserves the legal schedule; voluntary disclosure increases Public Trust."
    }
  ],
  factions: [
    {
      id: "copperline-partners",
      name: "Copperline Partners",
      publicPosition: "Approve the submitted plan tonight or the financing disappears.",
      underlyingNeed:
        "Predictable entitlement, at least 520 homes, and manageable infrastructure cost.",
      fear: "An open-ended process with accumulating conditions.",
      leverage: "Housing supply, tax base, site control, and construction financing.",
      supportConditions: ["At least 520 homes", "A lawful decision within 45 days"]
    },
    {
      id: "hearthside-coalition",
      name: "Hearthside Coalition",
      publicPosition: "Stop Copperline until residents are protected.",
      underlyingNeed: "Housing stability, safe access, community ownership, and shared benefits.",
      fear: "Public investment will increase land values while current residents are displaced.",
      leverage: "Organized testimony, local knowledge, and relationships with council members.",
      supportConditions: [
        "Enforceable right-to-return",
        "Funded protection before construction",
        "Safe crossings",
        "Formal implementation oversight"
      ]
    },
    {
      id: "descendants-council",
      name: "Copper Row Descendants Council",
      publicPosition: "No approval based on the incomplete cultural-resources map.",
      underlyingNeed: "Authority over how Copper Row is researched, preserved, and interpreted.",
      fear: "Another institution will extract the history and erase the place.",
      leverage: "Archival records, expert testimony, and the ability to challenge the survey.",
      supportConditions: [
        "Six-acre heritage corridor",
        "Funded archaeological work",
        "Binding co-stewardship"
      ]
    },
    {
      id: "rail-authority",
      name: "Regional Rail Authority",
      publicPosition: "Passenger service is possible but unfunded.",
      underlyingNeed:
        "Preserve a usable corridor and station location before development forecloses them.",
      fear: "The town will promise transit while approving a plan that makes transit impossible.",
      leverage: "Corridor control, technical standards, and future capital funding.",
      supportConditions: [
        "Eight-acre reservation",
        "Connected street access",
        "No permanent structures in the station envelope"
      ]
    },
    {
      id: "school-district",
      name: "Bellwether School District",
      publicPosition: "The district cannot absorb the full proposal today.",
      underlyingNeed: "Seats and predictable occupancy phasing.",
      fear: "Occupancy will precede facilities and leave the district blamed for overcrowding.",
      leverage: "Enrollment evidence and influential parent networks.",
      supportConditions: [
        "$3.8 million contribution",
        "Reserved school site",
        "Occupancy phases tied to capacity"
      ]
    },
    {
      id: "riverkeepers",
      name: "Copper Run Riverkeepers",
      publicPosition: "Redesign the project around the watershed.",
      underlyingNeed: "Flood storage, water quality, and long-term maintenance.",
      fear: "Decorative open space will be counted as functioning restoration.",
      leverage: "Technical evidence, state-agency access, and a possible permit appeal.",
      supportConditions: [
        "Ten-acre restored buffer",
        "Verified performance standards",
        "Funded maintenance entity"
      ]
    }
  ],
  programs: [
    {
      id: "submitted-plan",
      name: "Submitted Applicant Plan",
      summary: "Approve 620 homes, 1,050 parking spaces, the interchange, and submitted terms.",
      effects: [
        { track: "implementationCapacity", amount: 1 },
        { track: "politicalSupport", amount: 2 },
        { track: "publicTrust", amount: -2 },
        { track: "equity", amount: -2 }
      ]
    },
    {
      id: "compact-transit",
      name: "Compact Transit District",
      summary:
        "Approve approximately 520 homes with reduced parking, a connected network, and negotiated protections.",
      effects: [{ track: "politicalSupport", amount: 1 }],
      supportCondition: "Applicant viability and transportation or rail agreements"
    },
    {
      id: "community-stewardship",
      name: "Community Stewardship District",
      summary:
        "Approve approximately 360 homes with community-controlled land, preservation, and restoration.",
      effects: [
        { track: "publicTrust", amount: 1 },
        { track: "equity", amount: 1 },
        { track: "politicalSupport", amount: -2 },
        { track: "implementationCapacity", amount: -1 }
      ],
      supportCondition: "Alternative development or funding partner"
    },
    {
      id: "defined-deferral",
      name: "Defined Deferral or Denial",
      summary:
        "Do not approve the present development; establish a funded alternative work program.",
      effects: [
        { track: "implementationCapacity", amount: 1 },
        { track: "politicalSupport", amount: -2 }
      ],
      supportCondition: "Funded work program and responsible party"
    }
  ],
  commitments: [
    {
      id: "durable-affordability",
      name: "Durable Affordability",
      summary: "Require 18% income-restricted homes for 40 years and a $2 million contribution.",
      effects: [
        { track: "equity", amount: 2 },
        { track: "publicTrust", amount: 1 }
      ],
      unsupportedEffects: [{ track: "implementationCapacity", amount: -1 }],
      supportCondition: "Applicant agreement"
    },
    {
      id: "hearthside-stability",
      name: "Hearthside Stability Program",
      summary: "Fund right-to-return, rental assistance, home repair, or a community land trust.",
      effects: [
        { track: "equity", amount: 1 },
        { track: "publicTrust", amount: 1 }
      ],
      unsupportedEffects: [{ track: "implementationCapacity", amount: -1 }],
      supportCondition: "Committed funding source and administrator"
    },
    {
      id: "connected-streets",
      name: "Connected Streets",
      summary: "Use a connected grid, safe crossings, transit priority, and demand management.",
      effects: [{ track: "publicTrust", amount: 1 }],
      unsupportedEffects: [{ track: "politicalSupport", amount: -1 }],
      supportCondition: "Mobility evidence and agency or public-safety concurrence"
    },
    {
      id: "rail-reservation",
      name: "Passenger-Rail Reservation",
      summary: "Preserve a station site and corridor without promising immediate service.",
      effects: [{ track: "politicalSupport", amount: 1 }],
      unsupportedEffects: [{ track: "implementationCapacity", amount: -1 }],
      supportCondition: "Rail authority agreement"
    },
    {
      id: "copper-run-restoration",
      name: "Copper Run Restoration",
      summary: "Create a ten-acre restored buffer with performance standards and maintenance.",
      effects: [
        { track: "publicTrust", amount: 1 },
        { track: "equity", amount: 1 }
      ],
      unsupportedEffects: [{ track: "implementationCapacity", amount: -1 }],
      supportCondition: "Committed funding and implementation partner"
    },
    {
      id: "copper-row-stewardship",
      name: "Copper Row Co-Stewardship",
      summary: "Create a heritage corridor, fund archaeology, and share interpretive authority.",
      effects: [
        { track: "publicTrust", amount: 2 },
        { track: "equity", amount: 1 }
      ],
      unsupportedEffects: [{ track: "implementationCapacity", amount: -1 }],
      supportCondition: "Binding co-stewardship agreement and funded survey"
    },
    {
      id: "school-capacity",
      name: "School-Capacity Agreement",
      summary: "Tie occupancy to seats, reserve a site, and make a capital contribution.",
      effects: [
        { track: "implementationCapacity", amount: 1 },
        { track: "politicalSupport", amount: 1 }
      ],
      unsupportedEffects: [{ track: "implementationCapacity", amount: -1 }],
      supportCondition: "District agreement and committed funding"
    },
    {
      id: "corrected-notice",
      name: "Corrected Notice",
      summary: "Disclose procedural defects, provide notice, and publish the schedule.",
      effects: [{ track: "publicTrust", amount: 1 }],
      unsupportedEffects: [{ track: "politicalSupport", amount: -1 }],
      supportCondition: "Correction preserves the lawful deadline"
    },
    {
      id: "local-business",
      name: "Local Business and Workforce Program",
      summary: "Provide technical assistance, affordable space, and workforce commitments.",
      effects: [{ track: "equity", amount: 1 }],
      unsupportedEffects: [{ track: "implementationCapacity", amount: -1 }],
      supportCondition: "Funded administrator and enforceable terms"
    },
    {
      id: "implementation-board",
      name: "Community Implementation Board",
      summary: "Create public milestone reporting and defined enforcement authority.",
      effects: [{ track: "publicTrust", amount: 1 }],
      unsupportedEffects: [{ track: "implementationCapacity", amount: -1 }],
      supportCondition: "Assigned staffing, authority, and reporting responsibility"
    }
  ],
  hearingChallenges: [
    {
      id: "notice-defect",
      name: "The Notice Defect",
      prompt: "An attorney produces a list of fourteen omitted owners.",
      defaultDc: 16,
      relevantAttributes: ["procedure", "resilience"],
      success: "The team establishes a lawful cure.",
      mixed: "The case continues with political and trust costs.",
      setback: "The schedule fails and the room loses confidence."
    },
    {
      id: "secret-units",
      name: "Secret 900 Units",
      prompt: "An anonymous flyer claims the station plan secretly permits 900 homes.",
      defaultDc: 10,
      relevantAttributes: ["analysis", "persuasion"],
      success: "Evidence and a clear explanation correct the claim.",
      mixed: "The explanation lands unevenly and trust falls.",
      setback: "The rumor controls the hearing."
    },
    {
      id: "unfunded-promise",
      name: "The Unfunded Promise",
      prompt: "The finance director asks who will pay for the most expensive commitment.",
      defaultDc: 13,
      relevantAttributes: ["analysis", "procedure"],
      success: "The team identifies a credible committed source.",
      mixed: "The promise survives with a capacity cost.",
      setback: "The commitment is removed or implementation credibility collapses."
    },
    {
      id: "affordability-amendment",
      name: "Affordability Amendment",
      prompt: "A council member proposes reducing the affordability term to 15 years.",
      defaultDc: 13,
      relevantAttributes: ["persuasion", "analysis", "procedure"],
      success: "The team defeats the amendment.",
      mixed: "The percentage survives but the term shortens.",
      setback: "The amendment passes and Equity falls."
    },
    {
      id: "emergency-access",
      name: "Emergency Access",
      prompt: "The fire marshal questions the connected street plan.",
      defaultDc: 13,
      relevantAttributes: ["analysis", "procedure", "vision"],
      success: "The network evidence answers the concern.",
      mixed: "A costly redesign is required.",
      setback: "The interchange assumption returns."
    },
    {
      id: "unmet-faction",
      name: "Testimony from an Unmet Faction",
      prompt: "An affected faction identifies the missing commitment.",
      defaultDc: 16,
      relevantAttributes: ["empathy", "persuasion", "resilience"],
      success: "The team explains or repairs the omission.",
      mixed: "A narrower late commitment carries a cost.",
      setback: "The relevant civic track falls sharply."
    }
  ],
  epilogues: [
    {
      track: "publicTrust",
      weakest:
        "Implementation becomes adversarial, rumors flourish, and the next planning effort begins with damaged credibility.",
      strongest: "A durable civic relationship survives disagreement and guides implementation."
    },
    {
      track: "equity",
      weakest:
        "The project advances while vulnerable households bear its largest costs and organize for repair.",
      strongest: "Meaningful protections let existing residents share in the district's benefits."
    },
    {
      track: "implementationCapacity",
      weakest:
        "Funding gaps, staff limits, or engineering conflicts pull the built result away from the adopted vision.",
      strongest: "Visible projects and enforceable commitments make the recommendation real."
    },
    {
      track: "politicalSupport",
      weakest:
        "The package is delayed, weakened, or rejected as coalition members pursue separate strategies.",
      strongest:
        "Sustained authorization and resources carry the package through difficult implementation."
    }
  ]
} as const;

export const copperlineScenario = scenarioSchema.parse(copperlineRaw);
