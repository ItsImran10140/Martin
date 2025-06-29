/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Handle, Position } from "@xyflow/react";
import { useCallback } from "react";

const handleStyle = { left: 10 };

function TextUpdaterNode(props: any) {
  const onChange = useCallback((evt: any) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div>
      <div className="flex flex-col p-2  rounded-md bg-zinc-50 border">
        <Handle type="source" position={Position.Left} id="a" />
        <Handle type="source" position={Position.Right} id="b" />
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

export default TextUpdaterNode;
