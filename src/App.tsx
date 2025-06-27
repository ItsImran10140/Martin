/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel,
  Position,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

const initialNodes = [
  {
    id: "1",
    type: "textUpdater",
    position: { x: 0, y: 0 },
    data: {},
  },
  {
    id: "2",
    type: "textUpdater",
    position: { x: 0, y: 100 },
    data: {},
  },
  {
    id: "3",
    type: "output",
    targetPosition: Position.Top,
    position: { x: 200, y: 200 },
    data: { lable: "Output Node" },
  },
];
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

function TextUpdaterNode(props: any) {
  const onChange = useCallback((evt: any) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div>
      <div className="flex flex-col p-2 rounded-md bg-zinc-100 border">
        <label className="text-zinc-500" htmlFor="text">
          Text:
        </label>
        <input
          className="outline-none text-neutral-500"
          id="text"
          name="text"
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default function App() {
  const nodeTypes = useMemo(() => ({ textUpdater: TextUpdaterNode }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: import("@xyflow/react").Connection) =>
      setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        style={{ backgroundColor: "#f0f0f0" }}
      >
        <Controls />

        <Background variant={BackgroundVariant.Dots} gap={8} size={0.5} />
      </ReactFlow>
    </div>
  );
}
