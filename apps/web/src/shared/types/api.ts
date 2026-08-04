export type AlignmentOutcome = "aligned" | "direct_conflict" | "missing_alignment";

export type JobStatus =
  | "queued"
  | "fetching"
  | "analyzing"
  | "validating"
  | "persisting"
  | "writing_github"
  | "completed"
  | "failed";

export type NodeType = "goal" | "requirement" | "decision" | "task" | "artifact" | "risk";

export interface Repository {
  id: string;
  githubRepositoryId: number;
  githubInstallationId: number;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  baselineCommitSha: string | null;
  mainCommitSha: string | null;
  knowledgeRevision: number;
}

export interface Job {
  jobId: string;
  repositoryId: string;
  eventType: "initial_sync" | "pr_analysis" | "merge_publish";
  eventKey: string;
  status: JobStatus;
  progress: number;
  headSha: string | null;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface AlignmentSummary {
  id: string;
  prNumber: number;
  headSha: string;
  outcome: AlignmentOutcome;
  findingCount: number;
  createdAt: string;
}

export interface Dashboard {
  repository: Repository;
  summary: {
    sourceCount: number;
    knowledgeNodeCount: number;
    alignmentCount: number;
    openJobCount: number;
  };
  recentAlignments: AlignmentSummary[];
  jobs: Job[];
}

export interface Evidence {
  sourceVersionId: string;
  url: string;
  exactQuote: string;
  role: "supports" | "contradicts" | "correction";
  verified: boolean;
}

export interface Finding {
  id: string;
  findingType: AlignmentOutcome;
  targetNodeId: string | null;
  targetNodeType: NodeType | null;
  targetNodeStatus: "active" | "superseded" | "disputed" | null;
  contradicts: boolean;
  uncertain: boolean;
  explanation: string;
  recommendedAction: string;
  evidence: Evidence[];
}

export interface Handshake {
  id: string;
  analysisId: string;
  profileId: string;
  response: "agree" | "needs_clarification" | "disagree";
  message: string | null;
  sourceLanguage: string;
  createdAt: string;
}

export interface Override {
  id: string;
  targetType: "alignment" | "finding" | "knowledge_node" | "knowledge_node_version";
  targetId: string;
  overrideType: "false_positive" | "supersede_decision" | "insufficient_evidence";
  reason: string;
  actorProfileId: string;
  createdNodeVersionId: string | null;
  createdAt: string;
}

export interface AlignmentDetail extends AlignmentSummary {
  repositoryId: string;
  knowledgeRevision: number;
  aiRunId: string;
  findings: Finding[];
  handshakes: Handshake[];
  overrides: Override[];
}

export interface ContextPassport {
  id: string;
  analysisId: string;
  profileId: string;
  language: string;
  content: string;
  sourceVersionIds: string[];
  ambiguities: string[];
  aiRunId: string;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  logicalKey: string;
  nodeType: NodeType;
  title: string;
  summary: string;
  status: "active" | "superseded" | "disputed";
  revision: number;
  evidence: Evidence[];
}

export interface GraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: string;
  validFromRevision: number;
  evidence: Evidence[];
}

export interface KnowledgeGraph {
  repositoryId: string;
  knowledgeRevision: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface HandshakeInput {
  response: Handshake["response"];
  message?: string;
  sourceLanguage: string;
}

export interface OverrideInput {
  overrideType: Override["overrideType"];
  reason: string;
  targetType?: Override["targetType"];
  targetId?: string;
}
