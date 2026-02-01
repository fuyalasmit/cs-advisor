import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

// lightweight graph node/link types used by the force graph
interface GraphNode {
    id: string;
    name: string;
    title?: string;
    creditHour?: number;
    category?: string;
    color?: string;
    val?: number;
    x?: number;
    y?: number;
    fx?: number; // fixed x position
    fy?: number; // fixed y position
}

interface GraphLink {
    source: string;
    target: string;
    id: string;
    curvature?: number;
}

interface Prerequisite {
    type: string;
    courseNo?: string;
    courseTitle?: string;
    minGrade?: string;
    operator?: string;
    extra?: string;
}

interface CourseDetails {
    courseNo: string;
    title: string;
    creditHour: number;
    category: string;
    genEdCategory?: string;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);
    const [selectedCourse, setSelectedCourse] = useState<CourseDetails | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Collect all courses from curriculum
    const { nodes, links } = useMemo(() => {
        const allCourses = new Map<string, { slot: CurriculumSlot; semester: SemesterData }>();
        curriculum.forEach((semester) => {
            semester.slots.forEach((slot) => {
                if (slot.courseNo) allCourses.set(slot.courseNo, { slot, semester });
            });
        });

        const nodesArr: GraphNode[] = [];
        allCourses.forEach(({ slot }, courseNo) => {
            nodesArr.push({
                id: courseNo,
                name: courseNo,
                title: slot.title || "",
                creditHour: slot.creditHour,
                category: slot.category,
                color: getCategoryColor(slot.category, slot.slotType),
                val: Math.max(4, slot.creditHour || 4),
            });
        });

        const linksArr: GraphLink[] = [];
        allCourses.forEach((_, courseNo) => {
            const details = courseDetails.get(courseNo);
            if (details?.prerequisites) {
                details.prerequisites.forEach((prereq, index) => {
                    if (prereq.courseNo && prereq.type === "course" && allCourses.has(prereq.courseNo)) {
                        linksArr.push({
                            source: prereq.courseNo,
                            target: courseNo,
                            id: `${prereq.courseNo}->${courseNo}-${index}`,
                        });
                    }
                });
            }
        });

        // Find connected vs unconnected nodes
        const connectedNodes = new Set<string>();
        linksArr.forEach((link) => {
            connectedNodes.add(link.source);
            connectedNodes.add(link.target);
        });

        // Position unconnected nodes in a tight grid cluster at a fixed position
        const unconnectedNodes = nodesArr.filter((n) => !connectedNodes.has(n.id));
        const gridCols = Math.ceil(Math.sqrt(unconnectedNodes.length));
        const spacing = 30; // tight spacing
        const clusterX = 250; // offset to the right of main graph
        const clusterY = -150; // offset above center

        unconnectedNodes.forEach((node, idx) => {
            const row = Math.floor(idx / gridCols);
            const col = idx % gridCols;
            // Fix their positions so they don't move
            node.fx = clusterX + col * spacing;
            node.fy = clusterY + row * spacing;
        });

        // assign small curvature offsets for multiple incoming links to same target to visually separate them
        const incomingMap = new Map<string, GraphLink[]>();
        linksArr.forEach((l) => {
            const arr = incomingMap.get(l.target) || [];
            arr.push(l);
            incomingMap.set(l.target, arr);
        });

        incomingMap.forEach((arr) => {
            const len = arr.length;
            arr.forEach((link, idx) => {
                // spread between -0.3 and 0.3
                const offset = (idx - (len - 1) / 2) * 0.12;
                link.curvature = offset;
            });
        });

        return { nodes: nodesArr, links: linksArr };
    }, [curriculum, courseDetails]);

    // Tune d3 forces on mount - simpler now that unconnected nodes are fixed
    useEffect(() => {
        const fg = fgRef.current;
        if (!fg) return;

        // Moderate charge for balanced repulsion
        fg.d3Force("charge")?.strength?.(-70);

        // Moderate link distance for connected nodes
        fg.d3Force("link")?.distance?.(55).strength?.(0.7);

        // Restart simulation with updated forces
        fg.d3ReheatSimulation?.();

        // Zoom to fit after layout settles
        setTimeout(() => {
            fg.zoomToFit?.(400, 40);
        }, 600);
    }, [nodes.length, links.length]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
            <div className="h-[700px] w-full">
                <ForceGraph2D
                    ref={fgRef}
                    graphData={{ nodes, links }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    nodeLabel={(node: any) => `${node.id}${node.title ? " - " + node.title : ""}`}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    nodeAutoColorBy={(n: any) => n.category || n.color || null}
                    linkDirectionalArrowLength={6}
                    linkDirectionalArrowRelPos={1}
                    linkWidth={1.5}
                    linkColor={() => "#9ca3af"}
                    linkCurvature={(link: GraphLink) => link.curvature || 0}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onNodeClick={(node: any) => {
                        const details = courseDetails.get(node.id as string);
                        if (details) {
                            setSelectedCourse(details);
                            setSelectedNodeId(node.id);
                        }

                        // center on click
                        const fg = fgRef.current;
                        if (fg && typeof node.x === "number" && typeof node.y === "number") {
                            fg.centerAt(node.x, node.y, 400);
                            fg.zoom(1.2, 400);
                        }
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                        const size = Math.max(6, node.val || 6);
                        const isSelected = selectedNodeId === node.id;

                        ctx.fillStyle = node.color || "#666";
                        ctx.beginPath();
                        ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI, false);
                        ctx.fill();

                        // Draw stroke for selected node
                        if (isSelected) {
                            ctx.strokeStyle = "#fbbf24";
                            ctx.lineWidth = 3 / globalScale;
                            ctx.stroke();
                        }

                        const label = node.id;
                        const fontSize = 10 / globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "#fff";
                        ctx.fillText(label, node.x || 0, node.y || 0);
                    }}
                    enableNodeDrag={true}
                />
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Legend</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#651d32" }}></div>
                        <span className="text-xs text-gray-600">Major</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#902444" }}></div>
                        <span className="text-xs text-gray-600">Concentration</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#dc588a" }}></div>
                        <span className="text-xs text-gray-600">GenEd</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#f1b0cc" }}></div>
                        <span className="text-xs text-gray-600">Elective</span>
                    </div>
                </div>
            </div>

            {/* Help text */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 px-3 py-2">
                <p className="text-xs text-gray-600">💡 Click a course to see details • Scroll to zoom • Drag to pan</p>
            </div>

            {/* Course Details Panel */}
            {selectedCourse && (
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm max-h-[500px] overflow-y-auto">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{selectedCourse.courseNo}</h3>
                            <p className="text-sm text-gray-600 mt-1">{selectedCourse.title}</p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedCourse(null);
                                setSelectedNodeId(null);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium text-gray-700">Credits:</span>
                            <span className="text-gray-900">{selectedCourse.creditHour}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium text-gray-700">Category:</span>
                            <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                    backgroundColor: `${getCategoryColor(selectedCourse.category)}20`,
                                    color: getCategoryColor(selectedCourse.category),
                                }}>
                                {selectedCourse.category}
                            </span>
                        </div>

                        {selectedCourse.prerequisites.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Prerequisites:</h4>
                                <div className="space-y-2">
                                    {selectedCourse.prerequisites.map((prereq, idx) => (
                                        <div key={idx} className="text-sm bg-gray-50 rounded p-2">
                                            {prereq.type === "course" ? (
                                                <div>
                                                    <span className="font-medium text-[#651d32]">
                                                        {prereq.courseNo}
                                                    </span>
                                                    {prereq.courseTitle && (
                                                        <span className="text-gray-600"> - {prereq.courseTitle}</span>
                                                    )}
                                                    {prereq.minGrade && (
                                                        <span className="text-gray-600"> (Min: {prereq.minGrade})</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-gray-600">{prereq.extra}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedCourse.requiredFor.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Required For:</h4>
                                <div className="space-y-1">
                                    {selectedCourse.requiredFor.map((req, idx) => (
                                        <div key={idx} className="text-sm text-gray-600">
                                            • {req.courseNo} - {req.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseGraph;
