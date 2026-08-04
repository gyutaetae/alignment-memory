import dagre from "@dagrejs/dagre";
import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";

import type { GraphEdge, GraphNode, KnowledgeGraph } from "../shared/types/api";

export interface KnowledgeNodeData extends Record<string, unknown> {
  label: string;
  nodeType: GraphNode["nodeType"];
  status: GraphNode["status"];
  summary: string;
}

export type KnowledgeFlowNode = Node<KnowledgeNodeData, "knowledge">;

export function relevantSubgraph(graph: KnowledgeGraph, focusNodeId: string, hops = 2): KnowledgeGraph {
  const included = new Set([focusNodeId]);
  let frontier = new Set([focusNodeId]);

  for (let depth = 0; depth < hops; depth += 1) {
    const next = new Set<string>();
    graph.edges.forEach((edge) => {
      if (frontier.has(edge.fromNodeId)) next.add(edge.toNodeId);
      if (frontier.has(edge.toNodeId)) next.add(edge.fromNodeId);
    });
    next.forEach((id) => included.add(id));
    frontier = next;
  }

  return {
    ...graph,
    nodes: graph.nodes.filter((node) => included.has(node.id)),
    edges: graph.edges.filter((edge) => included.has(edge.fromNodeId) && included.has(edge.toNodeId)),
  };
}

export function layoutSubgraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
): { nodes: KnowledgeFlowNode[]; edges: Edge[] } {
  const layout = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  layout.setGraph({ rankdir: "LR", ranksep: 96, nodesep: 42, marginx: 24, marginy: 24 });
  nodes.forEach((node) => layout.setNode(node.id, { width: 210, height: 92 }));
  edges.forEach((edge) => layout.setEdge(edge.fromNodeId, edge.toNodeId));
  dagre.layout(layout);

  return {
    nodes: nodes.map((node) => {
      const position = layout.node(node.id);
      return {
        id: node.id,
        type: "knowledge",
        position: { x: position.x - 105, y: position.y - 46 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        ariaLabel: `${node.nodeType}: ${node.title}`,
        data: {
          label: node.title,
          nodeType: node.nodeType,
          status: node.status,
          summary: node.summary,
        },
      };
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      label: edge.relationType.replaceAll("_", " "),
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
      style: { stroke: "#2563EB", strokeWidth: 1.4 },
      labelStyle: { fill: "#64748b", fontSize: 10, fontWeight: 650 },
    })),
  };
}
