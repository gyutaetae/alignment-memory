import type {
  AlignmentDetail,
  ContextPassport,
  Dashboard,
  GraphEdge,
  GraphNode,
  Handshake,
  HandshakeInput,
  Job,
  KnowledgeGraph,
  Override,
  OverrideInput,
  Repository,
} from "../types/api";

const repositoryId = "10000000-0000-0000-0000-000000000001";
const alignmentId = "40000000-0000-0000-0000-000000000001";
const sourceVersionId = "20000000-0000-0000-0000-000000000002";
const decisionNodeId = "50000000-0000-0000-0000-000000000002";
const fixtureNow = "2026-08-04T12:00:00+00:00";

const repository: Repository = {
  id: repositoryId,
  githubRepositoryId: 1,
  githubInstallationId: 99,
  owner: "fixture-owner",
  name: "alignment-memory-demo",
  fullName: "fixture-owner/alignment-memory-demo",
  defaultBranch: "main",
  baselineCommitSha: "b".repeat(40),
  mainCommitSha: "b".repeat(40),
  knowledgeRevision: 12,
};

const evidence = {
  sourceVersionId,
  url: "https://github.com/fixture-owner/alignment-memory-demo/blob/main/docs/adr.md",
  exactQuote: "Browser extensions are out of scope for the MVP.",
  role: "contradicts" as const,
  verified: true,
};

const baseAlignment: AlignmentDetail = {
  id: alignmentId,
  repositoryId,
  prNumber: 7,
  headSha: "a".repeat(40),
  knowledgeRevision: 12,
  outcome: "direct_conflict",
  findingCount: 1,
  createdAt: fixtureNow,
  aiRunId: "60000000-0000-0000-0000-000000000001",
  findings: [
    {
      id: "41000000-0000-0000-0000-000000000001",
      findingType: "direct_conflict",
      targetNodeId: decisionNodeId,
      targetNodeType: "decision",
      targetNodeStatus: "active",
      contradicts: true,
      uncertain: false,
      explanation:
        "The proposed browser extension synchronization conflicts with the active repository-only MVP boundary.",
      recommendedAction:
        "Keep extension sync out of this PR, or supersede the active decision with a recorded reason.",
      evidence: [evidence],
    },
  ],
  handshakes: [],
  overrides: [],
};

const dashboard: Dashboard = {
  repository,
  summary: {
    sourceCount: 48,
    knowledgeNodeCount: 18,
    alignmentCount: 9,
    openJobCount: 1,
  },
  recentAlignments: [
    {
      id: "40000000-0000-0000-0000-000000000003",
      prNumber: 10,
      headSha: "d".repeat(40),
      outcome: "aligned",
      findingCount: 0,
      createdAt: "2026-08-04T12:12:00+00:00",
    },
    {
      id: alignmentId,
      prNumber: 7,
      headSha: "a".repeat(40),
      outcome: "direct_conflict",
      findingCount: 1,
      createdAt: fixtureNow,
    },
    {
      id: "40000000-0000-0000-0000-000000000002",
      prNumber: 11,
      headSha: "e".repeat(40),
      outcome: "missing_alignment",
      findingCount: 1,
      createdAt: "2026-08-04T12:08:00+00:00",
    },
  ],
  jobs: [
    {
      jobId: "30000000-0000-0000-0000-000000000003",
      repositoryId,
      eventType: "pr_analysis",
      eventKey: "fixture-pr-11",
      status: "analyzing",
      progress: 42,
      headSha: "e".repeat(40),
      errorCode: null,
      createdAt: "2026-08-04T12:08:00+00:00",
      updatedAt: "2026-08-04T12:10:00+00:00",
      completedAt: null,
    },
    {
      jobId: "30000000-0000-0000-0000-000000000001",
      repositoryId,
      eventType: "initial_sync",
      eventKey: "fixture-initial-sync",
      status: "completed",
      progress: 100,
      headSha: null,
      errorCode: null,
      createdAt: "2026-08-04T11:30:00+00:00",
      updatedAt: fixtureNow,
      completedAt: fixtureNow,
    },
  ],
};

const graphNodes: GraphNode[] = [
  {
    id: "50000000-0000-0000-0000-000000000001",
    logicalKey: "ship-evidence-rich-mvp",
    nodeType: "goal",
    title: "Ship the evidence-rich MVP",
    summary: "Deliver one trusted vertical slice before expanding the product boundary.",
    status: "active",
    revision: 12,
    evidence: [evidence],
  },
  {
    id: decisionNodeId,
    logicalKey: "exclude-browser-extension",
    nodeType: "decision",
    title: "Exclude browser extensions",
    summary: "Keep the MVP repository-native and desktop web only.",
    status: "active",
    revision: 12,
    evidence: [evidence],
  },
  {
    id: "50000000-0000-0000-0000-000000000003",
    logicalKey: "evidence-before-verdict",
    nodeType: "requirement",
    title: "Evidence before verdict",
    summary: "Every conflict must include an exact verified source quote.",
    status: "active",
    revision: 11,
    evidence: [evidence],
  },
  {
    id: "50000000-0000-0000-0000-000000000004",
    logicalKey: "add-extension-sync",
    nodeType: "task",
    title: "Add extension synchronization",
    summary: "Proposed work in PR #7 that crosses the active product boundary.",
    status: "disputed",
    revision: 12,
    evidence: [evidence],
  },
  {
    id: "50000000-0000-0000-0000-000000000005",
    logicalKey: "scope-drift",
    nodeType: "risk",
    title: "MVP scope drift",
    summary: "New ingestion surfaces may delay the vertical slice.",
    status: "active",
    revision: 12,
    evidence: [evidence],
  },
  {
    id: "50000000-0000-0000-0000-000000000006",
    logicalKey: "alignment-dashboard",
    nodeType: "artifact",
    title: "Alignment dashboard",
    summary: "The desktop review surface produced by the current phase.",
    status: "active",
    revision: 12,
    evidence: [evidence],
  },
];

const graphEdges: GraphEdge[] = [
  {
    id: "edge-1",
    fromNodeId: graphNodes[0].id,
    toNodeId: decisionNodeId,
    relationType: "constrains",
    validFromRevision: 1,
    evidence: [evidence],
  },
  {
    id: "edge-2",
    fromNodeId: decisionNodeId,
    toNodeId: graphNodes[3].id,
    relationType: "conflicts_with",
    validFromRevision: 12,
    evidence: [evidence],
  },
  {
    id: "edge-3",
    fromNodeId: graphNodes[2].id,
    toNodeId: decisionNodeId,
    relationType: "supports",
    validFromRevision: 11,
    evidence: [evidence],
  },
  {
    id: "edge-4",
    fromNodeId: graphNodes[3].id,
    toNodeId: graphNodes[4].id,
    relationType: "introduces",
    validFromRevision: 12,
    evidence: [evidence],
  },
  {
    id: "edge-5",
    fromNodeId: graphNodes[0].id,
    toNodeId: graphNodes[5].id,
    relationType: "produces",
    validFromRevision: 12,
    evidence: [evidence],
  },
];

const passport: ContextPassport = {
  id: "70000000-0000-0000-0000-000000000001",
  analysisId: alignmentId,
  profileId: "00000000-0000-0000-0000-000000000001",
  language: "en",
  content:
    "The current decision keeps the MVP repository-native. PR #7 needs either a narrower change or an explicit superseding decision.",
  sourceVersionIds: [sourceVersionId],
  ambiguities: ["Is extension sync intended to replace the repository-only workflow or follow it later?"],
  aiRunId: baseAlignment.aiRunId,
  createdAt: fixtureNow,
};

let handshakes: Handshake[] = [];
let overrides: Override[] = [];
let syncPollCount = 0;
let syncJob: Job | null = null;
const mutationLog: string[] = [];

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function resetFixtureApi() {
  handshakes = [];
  overrides = [];
  syncPollCount = 0;
  syncJob = null;
  mutationLog.length = 0;
}

export function getFixtureMutationLog() {
  return [...mutationLog];
}

export async function fixtureListRepositories() {
  return { repositories: clone([repository]) };
}

export async function fixtureStartSync(): Promise<Job> {
  mutationLog.push("sync");
  syncPollCount = 0;
  syncJob = {
    jobId: "30000000-0000-0000-0000-000000000099",
    repositoryId,
    eventType: "initial_sync",
    eventKey: "fixture-manual-sync",
    status: "queued",
    progress: 0,
    headSha: null,
    errorCode: null,
    createdAt: fixtureNow,
    updatedAt: fixtureNow,
    completedAt: null,
  };
  return clone(syncJob);
}

export async function fixturePollJob(jobId: string): Promise<Job> {
  if (syncJob?.jobId !== jobId) {
    const existing = dashboard.jobs.find((job) => job.jobId === jobId);
    if (!existing) throw new Error("Fixture job was not found.");
    return clone(existing);
  }
  const states: Array<Pick<Job, "status" | "progress">> = [
    { status: "fetching", progress: 15 },
    { status: "analyzing", progress: 45 },
    { status: "validating", progress: 70 },
    { status: "persisting", progress: 85 },
    { status: "writing_github", progress: 95 },
    { status: "completed", progress: 100 },
  ];
  const next = states[Math.min(syncPollCount, states.length - 1)];
  syncPollCount += 1;
  syncJob = {
    ...syncJob,
    ...next,
    completedAt: next.status === "completed" ? fixtureNow : null,
  };
  return clone(syncJob);
}

export async function fixtureGetDashboard() {
  return clone(dashboard);
}

export async function fixtureGetAlignment(requestedId: string) {
  if (requestedId !== alignmentId) {
    const summary = dashboard.recentAlignments.find((item) => item.id === requestedId);
    if (!summary) throw new Error("Fixture alignment was not found.");
    return clone({
      ...baseAlignment,
      ...summary,
      findings: summary.outcome === "aligned" ? [] : baseAlignment.findings,
      handshakes: [],
      overrides: [],
    });
  }
  return clone({ ...baseAlignment, handshakes, overrides });
}

export async function fixtureGetPassport() {
  return clone(passport);
}

export async function fixtureGetGraph(): Promise<KnowledgeGraph> {
  return clone({
    repositoryId,
    knowledgeRevision: repository.knowledgeRevision,
    nodes: graphNodes,
    edges: graphEdges,
  });
}

export async function fixturePostHandshake(input: HandshakeInput) {
  mutationLog.push("handshake");
  const handshake: Handshake = {
    id: `fixture-handshake-${handshakes.length + 1}`,
    analysisId: alignmentId,
    profileId: passport.profileId,
    response: input.response,
    message: input.message ?? null,
    sourceLanguage: input.sourceLanguage,
    createdAt: fixtureNow,
  };
  handshakes = [...handshakes, handshake];
  return clone(handshake);
}

export async function fixturePostOverride(input: OverrideInput) {
  mutationLog.push("override");
  if (!input.reason.trim()) throw new Error("Override reason is required.");
  const override: Override = {
    id: `fixture-override-${overrides.length + 1}`,
    targetType: input.targetType ?? "alignment",
    targetId: input.targetId ?? alignmentId,
    overrideType: input.overrideType,
    reason: input.reason,
    actorProfileId: passport.profileId,
    createdNodeVersionId: null,
    createdAt: fixtureNow,
  };
  overrides = [...overrides, override];
  return clone(override);
}
