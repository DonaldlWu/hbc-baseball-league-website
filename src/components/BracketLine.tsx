interface BracketLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number;
  color: string;
  dashed?: boolean;
}

export function BracketLine({ x1, y1, x2, y2, midX, color, dashed = false }: BracketLineProps) {
  const d = `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? '5 4' : undefined}
    />
  );
}
