/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useCallback, useMemo } from "react";
import { Trash2, Plus, MousePointer, Move, Link } from "lucide-react";

const FlowCanvas = () => {
  type NodeType = {
    id: string;
    type: keyof typeof nodeTypes;
    position: { x: number; y: number };
    data: { label: string };
  };

  type EdgeType = {
    id: string;
    source: string;
    target: string;
  };

  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeType | null>(null);
  const [dragMode, setDragMode] = useState("select"); // 'select', 'pan', 'connect'
  const [draggedNode, setDraggedNode] = useState<NodeType | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [connectionDrag, setConnectionDrag] = useState<{
    sourceId: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeType | null>(null);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [edgeIdCounter, setEdgeIdCounter] = useState(1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Node types configuration
  const nodeTypes = {
    input: { color: "bg-blue-500", label: "Input Node" },
    default: { color: "bg-gray-500", label: "Default Node" },
    output: { color: "bg-green-500", label: "Output Node" },
    process: { color: "bg-purple-500", label: "Process Node" },
  };

  // Get mouse position relative to canvas
  const getMousePosition = useCallback(
    (e: any) => {
      if (!canvasRef.current) {
        return { x: 0, y: 0 };
      }
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: e.clientX - rect.left - canvasOffset.x,
        y: e.clientY - rect.top - canvasOffset.y,
      };
    },
    [canvasOffset]
  );

  // Add new node
  const addNode = useCallback(
    (type: keyof typeof nodeTypes, position: { x: number; y: number }) => {
      const newNode = {
        id: `node-${nodeIdCounter}`,
        type,
        position,
        data: { label: `${nodeTypes[type].label} ${nodeIdCounter}` },
      };
      setNodes((prev) => [...prev, newNode]);
      setNodeIdCounter((prev) => prev + 1);
    },
    [nodeIdCounter, nodeTypes]
  );

  // Delete node and connected edges
  const deleteNode = useCallback((nodeId: any) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) =>
      prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    setSelectedNode(null);
  }, []);

  // Delete edge only
  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
    setSelectedEdge(null);
  }, []);

  // Add edge between nodes
  const addEdge = useCallback(
    (sourceId: string, targetId: string) => {
      const edgeExists = edges.some(
        (edge) =>
          (edge.source === sourceId && edge.target === targetId) ||
          (edge.source === targetId && edge.target === sourceId)
      );

      if (!edgeExists && sourceId !== targetId) {
        const newEdge = {
          id: `edge-${edgeIdCounter}`,
          source: sourceId,
          target: targetId,
        };
        setEdges((prev) => [...prev, newEdge]);
        setEdgeIdCounter((prev) => prev + 1);
      }
    },
    [edges, edgeIdCounter]
  );

  // Handle canvas mouse down
  const handleCanvasMouseDown = useCallback(
    (e: any) => {
      // Only handle if clicking directly on the canvas div, not on child elements
      if (e.target !== e.currentTarget) {
        return;
      }

      const mousePos = getMousePosition(e);

      if (dragMode === "pan") {
        setIsPanning(true);
        setPanStart({
          x: e.clientX - canvasOffset.x,
          y: e.clientY - canvasOffset.y,
        });
      } else if (dragMode === "select") {
        // Deselect if clicking on empty canvas
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    },
    [dragMode, getMousePosition, canvasOffset]
  );

  // Handle canvas mouse move
  const handleCanvasMouseMove = useCallback(
    (e: any) => {
      const mousePos = getMousePosition(e);

      if (isPanning) {
        setCanvasOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      } else if (draggedNode) {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === draggedNode.id
              ? {
                  ...node,
                  position: {
                    x: mousePos.x - dragOffset.x,
                    y: mousePos.y - dragOffset.y,
                  },
                }
              : node
          )
        );
      } else if (connectionDrag) {
        setConnectionDrag((prev) => (prev ? { ...prev, end: mousePos } : null));
      }
    },
    [
      isPanning,
      panStart,
      draggedNode,
      dragOffset,
      getMousePosition,
      connectionDrag,
    ]
  );

  // Handle canvas mouse up
  const handleCanvasMouseUp = useCallback(
    (e: any) => {
      if (
        connectionDrag &&
        hoveredNode &&
        hoveredNode.id !== connectionDrag.sourceId
      ) {
        // Complete the connection
        addEdge(connectionDrag.sourceId, hoveredNode.id);
      }

      setIsPanning(false);
      setDraggedNode(null);
      setConnectionDrag(null);
      setHoveredNode(null);
    },
    [connectionDrag, hoveredNode, addEdge]
  );

  // Handle node mouse down
  const handleNodeMouseDown = useCallback(
    (e: any, node: any) => {
      e.stopPropagation();

      if (dragMode === "select") {
        setSelectedNode(node);
        setSelectedEdge(null);

        const mousePos = getMousePosition(e);
        setDraggedNode(node);
        setDragOffset({
          x: mousePos.x - node.position.x,
          y: mousePos.y - node.position.y,
        });
      }
    },
    [dragMode, getMousePosition]
  );

  // Handle connection handle mouse down
  const handleConnectionHandleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      node: NodeType,
      handlePosition: "left" | "right" | "top" | "bottom"
    ) => {
      e.stopPropagation();

      let startPos;
      switch (handlePosition) {
        case "right":
          startPos = { x: node.position.x + 100, y: node.position.y + 25 };
          break;
        case "left":
          startPos = { x: node.position.x, y: node.position.y + 25 };
          break;
        case "top":
          startPos = { x: node.position.x + 50, y: node.position.y };
          break;
        case "bottom":
          startPos = { x: node.position.x + 50, y: node.position.y + 50 };
          break;
        default:
          startPos = { x: node.position.x + 50, y: node.position.y + 25 };
      }

      setConnectionDrag({
        sourceId: node.id,
        start: startPos,
        end: startPos,
      });
    },
    []
  );

  // Handle node mouse enter
  const handleNodeMouseEnter = useCallback(
    (node: any) => {
      if (connectionDrag && node.id !== connectionDrag.sourceId) {
        setHoveredNode(node);
      }
    },
    [connectionDrag]
  );

  // Handle node mouse leave
  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  // Handle edge click - improved
  const handleEdgeClick = useCallback((e: any, edge: any) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Edge clicked:", edge.id); // Debug log
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Handle edge delete button click - separate function
  const handleEdgeDeleteClick = useCallback(
    (e: any, edgeId: any) => {
      e.stopPropagation();
      e.preventDefault();
      deleteEdge(edgeId);
    },
    [deleteEdge]
  );

  // Handle canvas double click to add node
  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragMode === "select") {
        const mousePos = getMousePosition(e);
        addNode("default", mousePos);
      }
    },
    [dragMode, getMousePosition, addNode]
  );

  // Calculate edge path with proper connection points
  const getEdgePath = useCallback(
    (sourceNode: NodeType, targetNode: NodeType) => {
      const sourceCenter = {
        x: sourceNode.position.x + 50,
        y: sourceNode.position.y + 25,
      };
      const targetCenter = {
        x: targetNode.position.x + 50,
        y: targetNode.position.y + 25,
      };

      // Determine which sides of the nodes to connect
      const dx = targetCenter.x - sourceCenter.x;
      const dy = targetCenter.y - sourceCenter.y;

      let sourceX, sourceY, targetX, targetY;

      // Choose connection points based on relative positions
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal connection
        if (dx > 0) {
          // Source right, target left
          sourceX = sourceNode.position.x + 100;
          sourceY = sourceCenter.y;
          targetX = targetNode.position.x;
          targetY = targetCenter.y;
        } else {
          // Source left, target right
          sourceX = sourceNode.position.x;
          sourceY = sourceCenter.y;
          targetX = targetNode.position.x + 100;
          targetY = targetCenter.y;
        }
      } else {
        // Vertical connection
        if (dy > 0) {
          // Source bottom, target top
          sourceX = sourceCenter.x;
          sourceY = sourceNode.position.y + 50;
          targetX = targetCenter.x;
          targetY = targetNode.position.y;
        } else {
          // Source top, target bottom
          sourceX = sourceCenter.x;
          sourceY = sourceNode.position.y;
          targetX = targetCenter.x;
          targetY = targetNode.position.y + 50;
        }
      }

      const distance = Math.sqrt(
        (targetX - sourceX) ** 2 + (targetY - sourceY) ** 2
      );
      const controlDistance = Math.min(distance * 0.4, 80);

      let sourceControlX, sourceControlY, targetControlX, targetControlY;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal bezier
        sourceControlX =
          sourceX + (dx > 0 ? controlDistance : -controlDistance);
        sourceControlY = sourceY;
        targetControlX =
          targetX + (dx > 0 ? -controlDistance : controlDistance);
        targetControlY = targetY;
      } else {
        // Vertical bezier
        sourceControlX = sourceX;
        sourceControlY =
          sourceY + (dy > 0 ? controlDistance : -controlDistance);
        targetControlX = targetX;
        targetControlY =
          targetY + (dy > 0 ? -controlDistance : controlDistance);
      }

      return `M ${sourceX} ${sourceY} C ${sourceControlX} ${sourceControlY} ${targetControlX} ${targetControlY} ${targetX} ${targetY}`;
    },
    []
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: any) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNode) {
          deleteNode(selectedNode.id);
        } else if (selectedEdge) {
          deleteEdge(selectedEdge.id);
        }
      }
    },
    [selectedNode, selectedEdge, deleteNode, deleteEdge]
  );

  // Add keyboard event listener
  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Get edge midpoint for delete button positioning
  const getEdgeMidpoint = useCallback((sourceNode: any, targetNode: any) => {
    const sourceCenter = {
      x: sourceNode.position.x + 50,
      y: sourceNode.position.y + 25,
    };
    const targetCenter = {
      x: targetNode.position.x + 50,
      y: targetNode.position.y + 25,
    };

    return {
      x: (sourceCenter.x + targetCenter.x) / 2,
      y: (sourceCenter.y + targetCenter.y) / 2,
    };
  }, []);

  // Render edges
  const renderedEdges = useMemo(() => {
    return edges.map((edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      const targetNode = nodes.find((node) => node.id === edge.target);

      if (!sourceNode || !targetNode) return null;

      const path = getEdgePath(sourceNode, targetNode);
      const midpoint = getEdgeMidpoint(sourceNode, targetNode);
      const isSelected = selectedEdge?.id === edge.id;

      return (
        <g key={edge.id}>
          {/* Invisible thick line for easier clicking */}
          <path
            d={path}
            stroke="transparent"
            strokeWidth="30"
            fill="none"
            style={{ cursor: "pointer", pointerEvents: "all" }}
            onClick={(e) => {
              console.log("Edge path clicked"); // Debug log
              handleEdgeClick(e, edge);
            }}
          />
          {/* Visible edge */}
          <path
            d={path}
            stroke={isSelected ? "#ef4444" : "#6b7280"}
            strokeWidth={isSelected ? 3 : 2}
            fill="none"
            style={{ pointerEvents: "none" }}
            markerEnd={`url(#arrow-${edge.id})`}
          />
          {/* Arrow marker */}
          <defs>
            <marker
              id={`arrow-${edge.id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="3"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M0,0 L0,6 L9,3 z"
                fill={isSelected ? "#ef4444" : "#6b7280"}
              />
            </marker>
          </defs>
          {/* Delete button for selected edge */}
          {isSelected && (
            <g>
              <circle
                cx={midpoint.x}
                cy={midpoint.y}
                r="12"
                fill="#ef4444"
                stroke="white"
                strokeWidth="2"
                style={{ cursor: "pointer", pointerEvents: "all" }}
                onClick={(e) => {
                  console.log("Delete button clicked"); // Debug log
                  e.stopPropagation();
                  handleEdgeDeleteClick(e, edge.id);
                }}
              />
              <text
                x={midpoint.x}
                y={midpoint.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize="14"
                fontWeight="bold"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                ×
              </text>
            </g>
          )}
        </g>
      );
    });
  }, [
    edges,
    nodes,
    selectedEdge,
    getEdgePath,
    getEdgeMidpoint,
    handleEdgeClick,
    handleEdgeDeleteClick,
  ]);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white shadow-md p-4 flex items-center gap-4 border-b">
        <h1 className="text-xl font-bold text-gray-800">Flow Canvas</h1>

        {/* Mode buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setDragMode("select")}
            className={`px-3 py-2 rounded flex items-center gap-2 ${
              dragMode === "select" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            <MousePointer size={16} />
            Select
          </button>
          <button
            onClick={() => setDragMode("pan")}
            className={`px-3 py-2 rounded flex items-center gap-2 ${
              dragMode === "pan" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            <Move size={16} />
            Pan
          </button>
        </div>

        {/* Node type buttons */}
        <div className="flex gap-2 ml-4">
          {Object.entries(nodeTypes).map(([type, config]) => (
            <button
              key={type}
              onClick={() =>
                addNode(type as keyof typeof nodeTypes, {
                  x: 100 + Math.random() * 200,
                  y: 100 + Math.random() * 200,
                })
              }
              className={`px-3 py-2 rounded text-white ${config.color} hover:opacity-80`}
            >
              Add {config.label}
            </button>
          ))}
        </div>

        {/* Delete buttons */}
        {selectedNode && (
          <button
            onClick={() => deleteNode(selectedNode.id)}
            className="px-3 py-2 bg-red-500 text-white rounded flex items-center gap-2 hover:bg-red-600 ml-auto"
          >
            <Trash2 size={16} />
            Delete Node
          </button>
        )}
        {selectedEdge && (
          <button
            onClick={() => deleteEdge(selectedEdge.id)}
            className="px-3 py-2 bg-orange-500 text-white rounded flex items-center gap-2 hover:bg-orange-600 ml-auto"
          >
            <Trash2 size={16} />
            Delete Edge
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="w-full h-full relative"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onDoubleClick={handleCanvasDoubleClick}
          style={{
            cursor:
              dragMode === "pan" ? "grab" : isPanning ? "grabbing" : "default",
          }}
        >
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                linear-gradient(180deg, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
              transform: `translate(${canvasOffset.x % 20}px, ${
                canvasOffset.y % 20
              }px)`,
            }}
          />

          {/* SVG for edges */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
            }}
          >
            {renderedEdges}
            {/* Temporary connection line */}
            {connectionDrag && (
              <path
                d={`M ${connectionDrag.start.x} ${connectionDrag.start.y} Q ${
                  connectionDrag.start.x +
                  (connectionDrag.end.x - connectionDrag.start.x) / 2
                } ${connectionDrag.start.y} ${connectionDrag.end.x} ${
                  connectionDrag.end.y
                }`}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
                fill="none"
                markerEnd="url(#temp-arrow)"
              />
            )}
            <defs>
              <marker
                id="temp-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="3"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
              </marker>
            </defs>
          </svg>

          {/* Nodes */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
            }}
          >
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`absolute w-24 h-12 rounded-lg shadow-lg border-2 flex items-center justify-center text-white text-sm font-medium cursor-pointer select-none transition-all ${
                  nodeTypes[node.type].color
                } ${
                  selectedNode?.id === node.id
                    ? "border-blue-400 ring-2 ring-blue-200"
                    : "border-gray-300"
                } ${
                  hoveredNode?.id === node.id ? "ring-2 ring-green-300" : ""
                } hover:shadow-xl`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  pointerEvents: "auto",
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onMouseEnter={() => handleNodeMouseEnter(node)}
                onMouseLeave={handleNodeMouseLeave}
              >
                <span className="truncate px-2 pointer-events-none">
                  {node.data.label}
                </span>

                {/* Connection handles - larger and more visible */}
                <div
                  className="absolute -left-2 top-1/2 w-4 h-4 bg-blue-500 rounded-full transform -translate-y-1/2 cursor-crosshair border-2 border-white shadow-md hover:bg-blue-600 hover:scale-110 transition-all duration-200"
                  style={{ opacity: dragMode === "select" ? 0 : 1 }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.opacity = "1")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.opacity =
                      dragMode === "select" ? "0" : "1")
                  }
                  onMouseDown={(e) =>
                    handleConnectionHandleMouseDown(e, node, "left")
                  }
                />
                <div
                  className="absolute -right-2 top-1/2 w-4 h-4 bg-blue-500 rounded-full transform -translate-y-1/2 cursor-crosshair border-2 border-white shadow-md hover:bg-blue-600 hover:scale-110 transition-all duration-200"
                  style={{ opacity: dragMode === "select" ? 0 : 1 }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.opacity = "1")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.opacity =
                      dragMode === "select" ? "0" : "1")
                  }
                  onMouseDown={(e) =>
                    handleConnectionHandleMouseDown(e, node, "right")
                  }
                />
                <div
                  className="absolute left-1/2 -top-2 w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 cursor-crosshair border-2 border-white shadow-md hover:bg-blue-600 hover:scale-110 transition-all duration-200"
                  style={{ opacity: dragMode === "select" ? 0 : 1 }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.opacity = "1")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.opacity =
                      dragMode === "select" ? "0" : "1")
                  }
                  onMouseDown={(e) =>
                    handleConnectionHandleMouseDown(e, node, "top")
                  }
                />
                <div
                  className="absolute left-1/2 -bottom-2 w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 cursor-crosshair border-2 border-white shadow-md hover:bg-blue-600 hover:scale-110 transition-all duration-200"
                  style={{ opacity: dragMode === "select" ? 0 : 1 }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.opacity = "1")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.opacity =
                      dragMode === "select" ? "0" : "1")
                  }
                  onMouseDown={(e) =>
                    handleConnectionHandleMouseDown(e, node, "bottom")
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 text-white p-3 text-sm">
        <div className="flex flex-wrap gap-4">
          <span>
            <strong>Double-click:</strong> Add node
          </span>
          <span>
            <strong>Drag nodes:</strong> Move around (Select mode)
          </span>
          <span>
            <strong>Drag connection handles:</strong> Blue dots on nodes to
            create connections
          </span>
          <span>
            <strong>Click edges:</strong> Select edge (shows red delete button)
          </span>
          <span>
            <strong>Delete key:</strong> Remove selected items
          </span>
          <span>
            <strong>Pan:</strong> Drag canvas in Pan mode
          </span>
        </div>
      </div>
    </div>
  );
};

export default FlowCanvas;
