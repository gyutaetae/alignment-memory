import {
  fixtureGetAlignment,
  fixtureGetDashboard,
  fixtureGetGraph,
  fixtureGetPassport,
  fixtureListRepositories,
  fixturePollJob,
  fixturePostHandshake,
  fixturePostOverride,
  fixtureStartSync,
} from "./fixture";
import type {
  AlignmentDetail,
  ContextPassport,
  Dashboard,
  Handshake,
  HandshakeInput,
  Job,
  KnowledgeGraph,
  Override,
  OverrideInput,
  Repository,
} from "../types/api";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export const isFixtureMode = import.meta.env.VITE_FIXTURE_MODE === "true" || !apiBaseUrl;

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly code = "request_failed",
    readonly retryable = false,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = window.sessionStorage.getItem("alignment-memory-access-token");
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  } catch {
    throw new ApiClientError("The API could not be reached.", "api_unavailable", true);
  }
  const payload = (await response.json().catch(() => null)) as
    | { error?: { code?: string; message?: string; retryable?: boolean } }
    | null;
  if (!response.ok) {
    throw new ApiClientError(
      payload?.error?.message ?? "The request failed.",
      payload?.error?.code,
      payload?.error?.retryable,
    );
  }
  return payload as T;
}

export function getGitHubLoginUrl() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) return "#github-login-not-configured";
  const redirectTo = encodeURIComponent(`${window.location.origin}/connect`);
  return `${supabaseUrl}/auth/v1/authorize?provider=github&redirect_to=${redirectTo}`;
}

export async function listRepositories(signal?: AbortSignal): Promise<{ repositories: Repository[] }> {
  if (isFixtureMode) return fixtureListRepositories();
  return request("/api/v1/repositories", { signal });
}

export async function startInitialSync(repositoryId: string): Promise<Job> {
  if (isFixtureMode) return fixtureStartSync();
  return request(`/api/v1/repositories/${repositoryId}/sync`, { method: "POST" });
}

export async function pollJob(jobId: string, signal?: AbortSignal): Promise<Job> {
  if (isFixtureMode) return fixturePollJob(jobId);
  return request(`/api/v1/jobs/${jobId}`, { signal });
}

export async function getDashboard(repositoryId: string, signal?: AbortSignal): Promise<Dashboard> {
  if (isFixtureMode) return fixtureGetDashboard();
  return request(`/api/v1/repositories/${repositoryId}/dashboard`, { signal });
}

export async function getAlignment(alignmentId: string, signal?: AbortSignal): Promise<AlignmentDetail> {
  if (isFixtureMode) return fixtureGetAlignment(alignmentId);
  return request(`/api/v1/alignments/${alignmentId}`, { signal });
}

export async function getContextPassport(
  alignmentId: string,
  language = "en",
  signal?: AbortSignal,
): Promise<ContextPassport> {
  if (isFixtureMode) return fixtureGetPassport();
  const query = new URLSearchParams({ language });
  return request(`/api/v1/alignments/${alignmentId}/context-passport?${query}`, { signal });
}

export async function getGraph(repositoryId: string, signal?: AbortSignal): Promise<KnowledgeGraph> {
  if (isFixtureMode) return fixtureGetGraph();
  return request(`/api/v1/repositories/${repositoryId}/graph`, { signal });
}

export async function postHandshake(
  alignmentId: string,
  input: HandshakeInput,
): Promise<Handshake> {
  if (isFixtureMode) return fixturePostHandshake(input);
  return request(`/api/v1/alignments/${alignmentId}/handshakes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function postOverride(alignmentId: string, input: OverrideInput): Promise<Override> {
  if (isFixtureMode) return fixturePostOverride(input);
  return request(`/api/v1/alignments/${alignmentId}/overrides`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
