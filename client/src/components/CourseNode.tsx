import React from "react";
import { Handle, Position } from "reactflow";

interface Prerequisite {
  type: string;
  courseNo?: string;
  courseTitle?: string;
  minGrade?: string;
  operator?: string;
  extra?: string;
}

interface CourseNodeData {
  courseNo: string;
  title: string;
  creditHour: number;
  category?: string;
  color: string;
  prerequisites: Prerequisite[];
  onSelect: () => void;
  isSelected: boolean;
}

interface CourseNodeProps {
  data: CourseNodeData;
}

const CourseNode: React.FC<CourseNodeProps> = ({ data }) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: data.color,
          width: 8,
          height: 8,
          border: "2px solid white",
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: data.color,
          width: 8,
          height: 8,
          border: "2px solid white",
        }}
      />

      <div
        onClick={data.onSelect}
        className={`w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
          data.isSelected ? "ring-4 ring-offset-2" : "shadow-md hover:shadow-lg"
        }`}
        style={{
          backgroundColor: data.color,
          ...(data.isSelected && {
            ringColor: data.color,
          }),
        }}>
        <div className="text-center">
          <div className="text-white font-bold text-sm leading-tight">{data.courseNo}</div>
        </div>
      </div>
    </div>
  );
};

export default CourseNode;
