import { useCallback, useEffect, useRef, useState } from 'react';
import { useReactFlow, type EdgeProps } from '@xyflow/react';

interface BendPoint {
  x: number;
  y: number;
}

function distToSegment(
  p: BendPoint,
  a: BendPoint,
  b: BendPoint
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function buildPath(points: BendPoint[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export function DraggableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data,
  markerEnd,
}: EdgeProps) {
  const { setEdges, screenToFlowPosition } = useReactFlow();
  const bendPoints: BendPoint[] =
    ((data as Record<string, unknown>)?.bendPoints as BendPoint[]) ?? [];
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  dragRef.current = dragIdx;

  const allPoints = [
    { x: sourceX, y: sourceY },
    ...bendPoints,
    { x: targetX, y: targetY },
  ];
  const pathD = buildPath(allPoints);

  // Click+drag anywhere on the edge line → insert bend point and start dragging
  const onPathMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // left click only
      e.stopPropagation();
      e.preventDefault();
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      // If click is near an existing bend point, grab it instead of creating a new one
      const GRAB_RADIUS = 20;
      for (let i = 0; i < bendPoints.length; i++) {
        if (Math.hypot(pos.x - bendPoints[i].x, pos.y - bendPoints[i].y) < GRAB_RADIUS) {
          setDragIdx(i);
          return;
        }
      }

      const pts = [
        { x: sourceX, y: sourceY },
        ...bendPoints,
        { x: targetX, y: targetY },
      ];
      // Find the nearest segment
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < pts.length - 1; i++) {
        const d = distToSegment(pos, pts[i], pts[i + 1]);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      // Insert new bend point at click position
      const newBP = [...bendPoints];
      newBP.splice(bestIdx, 0, pos);
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? { ...edge, data: { ...edge.data, bendPoints: newBP } }
            : edge
        )
      );
      setDragIdx(bestIdx);
    },
    [id, sourceX, sourceY, targetX, targetY, bendPoints, setEdges, screenToFlowPosition]
  );

  // Drag an existing bend point
  const onBendMouseDown = useCallback(
    (e: React.MouseEvent, idx: number) => {
      e.stopPropagation();
      e.preventDefault();
      setDragIdx(idx);
    },
    []
  );

  // Double-click a bend point to remove it
  const onBendDoubleClick = useCallback(
    (e: React.MouseEvent, idx: number) => {
      e.stopPropagation();
      e.preventDefault();
      const newBP = bendPoints.filter((_, i) => i !== idx);
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? { ...edge, data: { ...edge.data, bendPoints: newBP } }
            : edge
        )
      );
    },
    [id, bendPoints, setEdges]
  );

  // Mouse move + up for dragging
  useEffect(() => {
    if (dragIdx === null) return;
    const onMove = (e: MouseEvent) => {
      if (dragRef.current === null) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== id) return edge;
          const bp = [
            ...((edge.data as Record<string, unknown>)?.bendPoints as BendPoint[] ?? []),
          ];
          bp[dragRef.current!] = pos;
          return { ...edge, data: { ...edge.data, bendPoints: bp } };
        })
      );
    };
    const onUp = () => setDragIdx(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragIdx, id, setEdges, screenToFlowPosition]);

  return (
    <>
      {/* Invisible wider path — grab anywhere to add a bend */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: selected ? 'grab' : 'pointer' }}
        onMouseDown={selected ? onPathMouseDown : undefined}
      />
      {/* Visible edge path */}
      <path
        className="react-flow__edge-path"
        d={pathD}
        fill="none"
        markerEnd={markerEnd as string}
        style={{ cursor: selected ? 'grab' : 'pointer' }}
        onMouseDown={selected ? onPathMouseDown : undefined}
      />

      {/* Bend point handles — visible when selected */}
      {selected &&
        bendPoints.map((bp, i) => (
          <circle
            key={`bp-${i}`}
            cx={bp.x}
            cy={bp.y}
            r={7}
            className="edge-bend-point"
            onMouseDown={(e) => onBendMouseDown(e, i)}
            onDoubleClick={(e) => onBendDoubleClick(e, i)}
          />
        ))}
    </>
  );
}
