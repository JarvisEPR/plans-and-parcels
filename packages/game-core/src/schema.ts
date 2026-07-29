import { z } from "zod";

const attributeNameSchema = z.enum([
  "analysis",
  "empathy",
  "persuasion",
  "procedure",
  "vision",
  "resilience"
]);

const trackNameSchema = z.enum([
  "publicTrust",
  "equity",
  "implementationCapacity",
  "politicalSupport"
]);

const attributesSchema = z.object({
  analysis: z.number().int().min(0).max(3),
  empathy: z.number().int().min(0).max(3),
  persuasion: z.number().int().min(0).max(3),
  procedure: z.number().int().min(0).max(3),
  vision: z.number().int().min(0).max(3),
  resilience: z.number().int().min(0).max(3)
});

const tracksSchema = z.object({
  publicTrust: z.number().int().min(0).max(8),
  equity: z.number().int().min(0).max(8),
  implementationCapacity: z.number().int().min(0).max(8),
  politicalSupport: z.number().int().min(0).max(8)
});

const effectSchema = z.object({
  track: trackNameSchema,
  amount: z.number().int().min(-8).max(8)
});

export const scenarioSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  minimumPlayers: z.number().int().min(1).max(6),
  maximumPlayers: z.number().int().min(1).max(6),
  publicBrief: z.string().min(1),
  facilitatorBrief: z.string().min(1),
  startingTracks: tracksSchema,
  phaseDurations: z.record(z.string(), z.number().int().positive()),
  roles: z.array(
    z.object({
      id: z.string().min(1),
      characterName: z.string().min(1),
      profession: z.string().min(1),
      purpose: z.string().min(1),
      attributes: attributesSchema,
      specialties: z
        .array(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            description: z.string().min(1)
          })
        )
        .length(3),
      professionalMove: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1)
      }),
      startingKnowledge: z.string().min(1),
      prompt: z.string().min(1)
    })
  ),
  evidence: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      summary: z.string().min(1),
      detail: z.string().min(1),
      visibility: z.enum(["public", "facilitator", "role"]),
      roleIds: z.array(z.string()).optional(),
      leverage: z.string().optional()
    })
  ),
  factions: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      publicPosition: z.string().min(1),
      underlyingNeed: z.string().min(1),
      fear: z.string().min(1),
      leverage: z.string().min(1),
      supportConditions: z.array(z.string().min(1)).min(1)
    })
  ),
  programs: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      summary: z.string().min(1),
      effects: z.array(effectSchema),
      supportCondition: z.string().optional()
    })
  ),
  commitments: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      summary: z.string().min(1),
      effects: z.array(effectSchema),
      unsupportedEffects: z.array(effectSchema),
      supportCondition: z.string().min(1)
    })
  ),
  hearingChallenges: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      prompt: z.string().min(1),
      defaultDc: z.number().int().min(10).max(20),
      relevantAttributes: z.array(attributeNameSchema).min(1),
      success: z.string().min(1),
      mixed: z.string().min(1),
      setback: z.string().min(1)
    })
  ),
  epilogues: z
    .array(
      z.object({
        track: trackNameSchema,
        weakest: z.string().min(1),
        strongest: z.string().min(1)
      })
    )
    .length(4)
});
