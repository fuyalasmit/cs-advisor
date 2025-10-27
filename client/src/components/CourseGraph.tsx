import React, { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge, MarkerType, Panel } from "reactflow";
import "reactflow/dist/style.css";
import CourseNode from "./CourseNode.tsx";

interface Course {
  courseNo: string;
  title: string;
  creditHour: number;
  category: string;
  genEdCategory?: string;
}

interface Prerequisite {
  type: string;
  courseNo?: string;
  courseTitle?: string;
  minGrade?: string;
  operator?: string;
  extra?: string;
}

interface CourseDetails extends Course {
  prerequisites: Prerequisite[];
  requiredFor: Array<{
    courseNo: string;
    title: string;
    minGrade?: string;
  }>;
}

interface CurriculumSlot {
  id: number;
  slotType: string;
  creditHour: number;
  minGrade?: string;
  genEdCategory?: string;
  courseNo?: string;
  title?: string;
  category?: string;
  placeholderType?: string;
  description?: string;
}

interface SemesterData {
  year: string;
  semester: string;
  slots: CurriculumSlot[];
  totalCredits: number;
}

interface CourseGraphProps {
  curriculum: SemesterData[];
  courseDetails: Map<string, CourseDetails>;
}

const nodeTypes = {
  course: CourseNode,
};

const getCategoryColor = (category?: string, slotType?: string): string => {
  const type = category || slotType;
  switch (type) {
    case "major":
    case "fixed":
      return "#651d32";
    case "concentration":
      return "#902444";
    case "genEd":
      return "#dc588a";
    case "elective":
    case "free":
      return "#f1b0cc";
    default:
      return "#651d32";
  }
};

const CourseGraph: React.FC<CourseGraphProps> = ({ curriculum, courseDetails }) => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];

    const allCourses = new Map<string, { slot: CurriculumSlot; semester: SemesterData }>();
    curriculum.forEach((semester) => {
      semester.slots.forEach((slot) => {
        if (slot.courseNo) {
          allCourses.set(slot.courseNo, { slot, semester });
        }
      });
    });

    const inDegree = new Map<string, number>();
    const outEdges = new Map<string, Set<string>>();
    const inEdges = new Map<string, Set<string>>();

    allCourses.forEach((_, courseNo) => {
      inDegree.set(courseNo, 0);
      outEdges.set(courseNo, new Set());
      inEdges.set(courseNo, new Set());
    });

    allCourses.forEach((_, courseNo) => {
      const details = courseDetails.get(courseNo);
      if (details?.prerequisites) {
        details.prerequisites.forEach((prereq) => {
          if (prereq.courseNo && prereq.type === "course" && allCourses.has(prereq.courseNo)) {
            inDegree.set(courseNo, (inDegree.get(courseNo) || 0) + 1);
            outEdges.get(prereq.courseNo)!.add(courseNo);
            inEdges.get(courseNo)!.add(prereq.courseNo);
          }
        });
      }
    });

    const layers = new Map<number, string[]>();
    const nodeLayer = new Map<string, number>();
    const queue: string[] = [];

    inDegree.forEach((degree, courseNo) => {
      if (degree === 0) {
        queue.push(courseNo);
        nodeLayer.set(courseNo, 0);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLayer = nodeLayer.get(current)!;

      if (!layers.has(currentLayer)) {
        layers.set(currentLayer, []);
      }
      layers.get(currentLayer)!.push(current);

      outEdges.get(current)!.forEach((dependent) => {
        const newDegree = inDegree.get(dependent)! - 1;
        inDegree.set(dependent, newDegree);

        if (newDegree === 0) {
          let maxPrereqLayer = -1;
          inEdges.get(dependent)!.forEach((prereq) => {
            const prereqLayer = nodeLayer.get(prereq);
            if (prereqLayer !== undefined) {
              maxPrereqLayer = Math.max(maxPrereqLayer, prereqLayer);
            }
          });
          nodeLayer.set(dependent, maxPrereqLayer + 1);
          queue.push(dependent);
        }
      });
    }

    const layerSpacing = 250;
    const nodeSpacing = 200;

    const layerNumbers = Array.from(layers.keys()).sort((a, b) => a - b);

    layerNumbers.forEach((layerNum) => {
      const layerCourses = layers.get(layerNum)!;
      const layerWidth = layerCourses.length * nodeSpacing;
      const startX = -layerWidth / 2;

      layerCourses.forEach((courseNo, index) => {
        const courseData = allCourses.get(courseNo);
        if (!courseData) return;

        const { slot } = courseData;
        const details = courseDetails.get(courseNo);

        const x = startX + index * nodeSpacing + nodeSpacing / 2;
        const y = layerNum * layerSpacing;

        nodeMap.set(courseNo, {
          id: courseNo,
          type: "course",
          position: { x, y },
          data: {
            courseNo: slot.courseNo,
            title: slot.title || "",
            creditHour: slot.creditHour,
            category: slot.category,
            color: getCategoryColor(slot.category, slot.slotType),
            prerequisites: details?.prerequisites || [],
            onSelect: () => setSelectedCourse(courseNo),
            isSelected: selectedCourse === courseNo,
          },
        });
      });
    });

    allCourses.forEach((_, courseNo) => {
      const details = courseDetails.get(courseNo);
      if (details?.prerequisites) {
        details.prerequisites.forEach((prereq) => {
          if (prereq.courseNo && prereq.type === "course" && allCourses.has(prereq.courseNo)) {
            edgeList.push({
              id: `${prereq.courseNo}-${courseNo}`,
              source: prereq.courseNo,
              target: courseNo,
              type: "smoothstep",
              animated: selectedCourse === courseNo || selectedCourse === prereq.courseNo,
              style: {
                stroke:
                  selectedCourse === courseNo || selectedCourse === prereq.courseNo ? "#651d32" : "#9ca3af",
                strokeWidth: selectedCourse === courseNo || selectedCourse === prereq.courseNo ? 3 : 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color:
                  selectedCourse === courseNo || selectedCourse === prereq.courseNo ? "#651d32" : "#9ca3af",
                width: 20,
                height: 20,
              },
            });
          }
        });
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: edgeList,
    };
  }, [curriculum, courseDetails, selectedCourse]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="h-[700px] relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={1.5}
          defaultEdgeOptions={{
            type: "smoothstep",
          }}>
          <Background color="#e5e7eb" gap={16} />
          <Controls className="bg-white border border-gray-200 rounded-lg" />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as { color?: string };
              return data.color || "#651d32";
            }}
            className="bg-white border border-gray-200 rounded-lg"
            maskColor="rgba(101, 29, 50, 0.1)"
          />

          {selectedCourse && courseDetails.has(selectedCourse) && (
            <Panel position="top-right" className="max-w-sm">
              <CourseDetailsPanel
                course={courseDetails.get(selectedCourse)!}
                onClose={() => setSelectedCourse(null)}
              />
            </Panel>
          )}

          {!selectedCourse && (
            <Panel
              position="bottom-center"
              className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 px-4 py-2">
              <p className="text-sm text-gray-600">
                💡 Click on a course to see details • Drag to pan • Scroll to zoom
              </p>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

const CourseDetailsPanel: React.FC<{
  course: CourseDetails;
  onClose: () => void;
}> = ({ course, onClose }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-h-[500px] overflow-y-auto">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{course.courseNo}</h3>
          <p className="text-sm text-gray-600 mt-1">{course.title}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-gray-700">Credits:</span>
          <span className="text-gray-900">{course.creditHour}</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-gray-700">Category:</span>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${getCategoryColor(course.category)}20`,
              color: getCategoryColor(course.category),
            }}>
            {course.category}
          </span>
        </div>

        {course.prerequisites.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Prerequisites:</h4>
            <div className="space-y-2">
              {course.prerequisites.map((prereq, idx) => (
                <div key={idx} className="text-sm bg-gray-50 rounded p-2">
                  {prereq.type === "course" ? (
                    <div>
                      <span className="font-medium text-aamu-maroon">{prereq.courseNo}</span>
                      {prereq.courseTitle && <span className="text-gray-600"> - {prereq.courseTitle}</span>}
                      {prereq.minGrade && (
                        <span className="text-gray-600"> (Min grade: {prereq.minGrade})</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-600">{prereq.extra}</div>
                  )}
                  {prereq.operator && <span className="text-xs text-gray-500 ml-2">({prereq.operator})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {course.requiredFor.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Required For:</h4>
            <div className="space-y-1">
              {course.requiredFor.map((req, idx) => (
                <div key={idx} className="text-sm text-gray-600">
                  • {req.courseNo} - {req.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseGraph;
