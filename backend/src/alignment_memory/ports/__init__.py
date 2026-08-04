"""Interfaces for external capabilities."""

from alignment_memory.ports.repositories import (
    CorrectionRepository,
    JobRepository,
    KnowledgeRepository,
    PersistenceRepository,
    SourceRepository,
)

__all__ = [
    "CorrectionRepository",
    "JobRepository",
    "KnowledgeRepository",
    "PersistenceRepository",
    "SourceRepository",
]
