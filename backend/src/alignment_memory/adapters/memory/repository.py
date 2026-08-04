import asyncio
from collections import defaultdict
from datetime import datetime

from alignment_memory.domain import (
    Alignment,
    AppendOnlyViolation,
    Handshake,
    Job,
    JobStatus,
    KnowledgeEdge,
    KnowledgeNode,
    KnowledgeNodeVersion,
    Override,
    Source,
    SourceVersion,
    append_knowledge_node_version,
    append_source_version,
    transition_job,
)


class InMemoryRepository:
    """Concurrency-safe local adapter with the same append-only rules as PostgreSQL."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._sources: dict[str, Source] = {}
        self._source_keys: dict[tuple[str, str, str], str] = {}
        self._source_versions: dict[str, tuple[SourceVersion, ...]] = defaultdict(tuple)
        self._source_version_ids: dict[str, SourceVersion] = {}
        self._nodes: dict[str, KnowledgeNode] = {}
        self._node_keys: dict[tuple[str, str], str] = {}
        self._node_versions: dict[str, tuple[KnowledgeNodeVersion, ...]] = defaultdict(tuple)
        self._node_version_ids: dict[str, KnowledgeNodeVersion] = {}
        self._edges: dict[str, KnowledgeEdge] = {}
        self._jobs: dict[str, Job] = {}
        self._job_keys: dict[tuple[str, str], str] = {}
        self._alignments: dict[str, Alignment] = {}
        self._result_job_ids: dict[str, str] = {}
        self._alignment_keys: dict[tuple[str, int, str, int], str] = {}
        self._handshakes: dict[str, Handshake] = {}
        self._overrides: dict[str, Override] = {}

    async def add_source(self, source: Source) -> Source:
        natural_key = (source.repository_id, source.source_type, source.external_id)
        async with self._lock:
            existing = self._sources.get(source.id)
            existing_id = self._source_keys.get(natural_key)
            if existing is not None:
                if existing == source:
                    return existing
                raise AppendOnlyViolation("source identity already exists with different data")
            if existing_id is not None:
                stored = self._sources[existing_id]
                if stored.url == source.url:
                    return stored
                raise AppendOnlyViolation("source identity already exists with different data")
            self._sources[source.id] = source
            self._source_keys[natural_key] = source.id
            return source

    async def get_source(self, source_id: str) -> Source | None:
        return self._sources.get(source_id)

    async def append_source_version(self, version: SourceVersion) -> SourceVersion:
        async with self._lock:
            if version.source_id not in self._sources:
                raise AppendOnlyViolation("source version requires an existing source")
            existing_by_id = self._source_version_ids.get(version.id)
            if existing_by_id is not None:
                if existing_by_id == version:
                    return existing_by_id
                raise AppendOnlyViolation("source version ID already exists with different data")

            history = self._source_versions[version.source_id]
            duplicate_hash = next(
                (item for item in history if item.content_hash == version.content_hash),
                None,
            )
            if duplicate_hash is not None:
                return duplicate_hash

            updated = append_source_version(history, version)
            self._source_versions[version.source_id] = updated
            self._source_version_ids[version.id] = version
            return version

    async def list_source_versions(self, source_id: str) -> tuple[SourceVersion, ...]:
        return self._source_versions[source_id]

    async def add_knowledge_node(self, node: KnowledgeNode) -> KnowledgeNode:
        natural_key = (node.repository_id, node.logical_key)
        async with self._lock:
            existing = self._nodes.get(node.id)
            existing_id = self._node_keys.get(natural_key)
            if existing is not None:
                if self._same_node_identity(existing, node):
                    return existing
                raise AppendOnlyViolation("knowledge node identity already exists")
            if existing_id is not None:
                stored = self._nodes[existing_id]
                if self._same_node_identity(stored, node):
                    return stored
                raise AppendOnlyViolation("knowledge node identity already exists")
            self._nodes[node.id] = node
            self._node_keys[natural_key] = node.id
            return node

    async def append_knowledge_node_version(
        self,
        version: KnowledgeNodeVersion,
    ) -> KnowledgeNodeVersion:
        async with self._lock:
            node = self._nodes.get(version.node_id)
            if node is None:
                raise AppendOnlyViolation("knowledge version requires an existing node")
            existing = self._node_version_ids.get(version.id)
            if existing is not None:
                if existing == version:
                    return existing
                raise AppendOnlyViolation("knowledge version ID already exists with different data")

            history = self._node_versions[version.node_id]
            updated = append_knowledge_node_version(history, version)
            self._node_versions[version.node_id] = updated
            self._node_version_ids[version.id] = version
            self._nodes[node.id] = KnowledgeNode(
                id=node.id,
                repository_id=node.repository_id,
                node_type=node.node_type,
                logical_key=node.logical_key,
                current_version_id=version.id,
            )
            return version

    async def add_knowledge_edge(self, edge: KnowledgeEdge) -> KnowledgeEdge:
        async with self._lock:
            if edge.from_node_id not in self._nodes or edge.to_node_id not in self._nodes:
                raise AppendOnlyViolation("knowledge edge requires existing endpoint nodes")
            existing = self._edges.get(edge.id)
            if existing == edge:
                return edge
            if existing is not None:
                raise AppendOnlyViolation("knowledge edge ID already exists with different data")
            self._edges[edge.id] = edge
            return edge

    async def get_active_context(
        self,
        repository_id: str,
        revision: int | None = None,
    ) -> tuple[KnowledgeNodeVersion, ...]:
        active: list[KnowledgeNodeVersion] = []
        for node in self._nodes.values():
            if node.repository_id != repository_id:
                continue
            versions = self._node_versions[node.id]
            eligible = tuple(
                version
                for version in versions
                if revision is None or version.revision <= revision
            )
            if eligible:
                active.append(eligible[-1])
        return tuple(sorted(active, key=lambda version: (version.node_id, version.revision)))

    async def create_job(self, job: Job) -> Job:
        natural_key = (job.repository_id, job.event_key)
        async with self._lock:
            existing = self._jobs.get(job.id)
            existing_id = self._job_keys.get(natural_key)
            if existing is not None:
                if self._same_job_identity(existing, job):
                    return existing
                raise AppendOnlyViolation("job event key already exists with different data")
            if existing_id is not None:
                stored = self._jobs[existing_id]
                if self._same_job_identity(stored, job):
                    return stored
                raise AppendOnlyViolation("job event key already exists with different data")
            self._jobs[job.id] = job
            self._job_keys[natural_key] = job.id
            return job

    async def get_job(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    async def compare_and_set_job(
        self,
        job_id: str,
        expected_status: JobStatus,
        next_status: JobStatus,
        *,
        occurred_at: datetime,
        error_code: str | None = None,
    ) -> Job | None:
        async with self._lock:
            current = self._jobs.get(job_id)
            if current is None:
                raise KeyError(job_id)
            if current.status is not expected_status:
                return None
            transitioned = transition_job(
                current,
                next_status,
                occurred_at=occurred_at,
                error_code=error_code,
            )
            self._jobs[job_id] = transitioned
            return transitioned

    async def persist_validated_result(
        self,
        job_id: str,
        alignment: Alignment,
    ) -> Alignment:
        natural_key = (
            alignment.repository_id,
            alignment.pr_number,
            alignment.head_sha,
            alignment.knowledge_revision,
        )
        async with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                raise KeyError(job_id)
            if job.repository_id != alignment.repository_id:
                raise AppendOnlyViolation("alignment repository does not match its job")

            result_id = self._result_job_ids.get(job_id)
            natural_result_id = self._alignment_keys.get(natural_key)
            if result_id is not None or natural_result_id is not None:
                existing_id = result_id or natural_result_id
                existing = self._alignments[existing_id]
                if existing == alignment:
                    self._result_job_ids[job_id] = existing.id
                    return existing
                raise AppendOnlyViolation("validated result already exists with different data")

            if alignment.id in self._alignments:
                raise AppendOnlyViolation("alignment ID already exists with different data")
            self._alignments[alignment.id] = alignment
            self._alignment_keys[natural_key] = alignment.id
            self._result_job_ids[job_id] = alignment.id
            return alignment

    async def get_result_for_job(self, job_id: str) -> Alignment | None:
        result_id = self._result_job_ids.get(job_id)
        return self._alignments.get(result_id) if result_id is not None else None

    async def append_handshake(self, handshake: Handshake) -> Handshake:
        async with self._lock:
            if handshake.id in self._handshakes:
                raise AppendOnlyViolation("handshake ID already exists")
            if handshake.analysis_id not in self._alignments:
                raise AppendOnlyViolation("handshake requires an existing alignment")
            self._handshakes[handshake.id] = handshake
            return handshake

    async def list_handshakes(self, analysis_id: str) -> tuple[Handshake, ...]:
        return tuple(
            sorted(
                (
                    item
                    for item in self._handshakes.values()
                    if item.analysis_id == analysis_id
                ),
                key=lambda item: (item.created_at, item.id),
            )
        )

    async def append_override(self, override: Override) -> Override:
        async with self._lock:
            if override.id in self._overrides:
                raise AppendOnlyViolation("override ID already exists")
            self._overrides[override.id] = override
            return override

    async def list_overrides(self, target_type: str, target_id: str) -> tuple[Override, ...]:
        return tuple(
            sorted(
                (
                    item
                    for item in self._overrides.values()
                    if item.target_type == target_type and item.target_id == target_id
                ),
                key=lambda item: (item.created_at, item.id),
            )
        )

    @staticmethod
    def _same_node_identity(left: KnowledgeNode, right: KnowledgeNode) -> bool:
        return (
            left.repository_id == right.repository_id
            and left.node_type is right.node_type
            and left.logical_key == right.logical_key
        )

    @staticmethod
    def _same_job_identity(left: Job, right: Job) -> bool:
        return (
            left.repository_id == right.repository_id
            and left.event_key == right.event_key
            and left.job_type is right.job_type
            and left.head_sha == right.head_sha
        )
