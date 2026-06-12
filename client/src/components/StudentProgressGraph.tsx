import React, { useEffect, useMemo, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";

interface ProgressNode {
    courseNo: string;
    title: string;
    creditHour: number;
    category: string;
    grade: string;
}

interface ProgressEdge {
    source: string;
    target: string;
}

interface GraphNode {
    id: string;
    name: string;
    title?: string;
    creditHour?: number;
    category?: string;
    grade?: string;
    color?: string;
    val?: number;
    fx?: number;
    fy?: number;
}

interface GraphLink {
    source: string;
    target: string;
    id: string;
    curvature?: number;
}

interface StudentProgressGraphProps {
    nodes: ProgressNode[];
    edges: ProgressEdge[];
}

const getCategoryColor = (category?: string): string => {
    switch (category) {
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

const StudentProgressGraph: React.FC<StudentProgressGraphProps> = ({ nodes, edges }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);

    const { graphNodes, graphLinks } = useMemo(() => {
        const graphNodes: GraphNode[] = nodes.map((n) => ({
            id: n.courseNo,
            name: n.courseNo,
            title: n.title,
            creditHour: n.creditHour,
            category: n.category,
            grade: n.grade,
            color: getCategoryColor(n.category),
            val: Math.max(4, n.creditHour || 4),
        }));

        const graphLinks: GraphLink[] = edges.map((e, idx) => ({
            source: e.source,
            target: e.target,
            id: `${e.source}->${e.target}-${idx}`,
        }));

        // Curvature offsets for multiple edges to same target
        const incomingMap = new Map<string, GraphLink[]>();
        graphLinks.forEach((l) => {
            const arr = incomingMap.get(l.target) || [];
            arr.push(l);
            incomingMap.set(l.target, arr);
        });
        incomingMap.forEach((arr) => {
            const len = arr.length;
            arr.forEach((link, idx) => {
                link.curvature = (idx - (len - 1) / 2) * 0.12;
            });
        });

        return { graphNodes, graphLinks };
    }, [nodes, edges]);

    useEffect(() => {
        const fg = fgRef.current;
        if (!fg) return;
        fg.d3Force("charge")?.strength?.(-70);
        fg.d3Force("link")?.distance?.(55).strength?.(0.7);
        fg.d3ReheatSimulation?.();
        setTimeout(() => {
            fg.zoomToFit?.(400, 40);
        }, 600);
    }, [graphNodes.length, graphLinks.length]);

    if (nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-[450px] text-gray-400">
                No completed courses to display
            </div>
        );
    }

    return (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white">
            <div className="h-[450px] w-full">
                <ForceGraph2D
                    ref={fgRef}
                    graphData={{ nodes: graphNodes, links: graphLinks }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    nodeLabel={(node: any) =>
                        `${node.id} · ${node.title}\nGrade: ${node.grade} · ${node.creditHour} credits`
                    }
                    linkDirectionalArrowLength={6}
                    linkDirectionalArrowRelPos={1}
                    linkWidth={1.5}
                    linkColor={() => "#9ca3af"}
                    linkCurvature={(link: GraphLink) => link.curvature || 0}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                        const size = Math.max(6, node.val || 6);
                        ctx.fillStyle = node.color || "#651d32";
                        ctx.beginPath();
                        ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI, false);
                        ctx.fill();

                        const fontSize = 10 / globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "#fff";
                        ctx.fillText(node.id, node.x || 0, node.y || 0);
                    }}
                    enableNodeDrag={true}
                />
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 p-2.5">
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Legend</p>
                <div className="space-y-1">
                    {[
                        { color: "#651d32", label: "Major" },
                        { color: "#902444", label: "Concentration" },
                        { color: "#dc588a", label: "GenEd" },
                        { color: "#f1b0cc", label: "Elective" },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-xs text-gray-600">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 px-2.5 py-1.5">
                <p className="text-xs text-gray-500">Hover for details · Scroll to zoom · Drag to pan</p>
            </div>
        </div>
    );
};

export default StudentProgressGraph;
