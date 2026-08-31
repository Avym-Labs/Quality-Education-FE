import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const RADIAN = Math.PI / 180;
const EXPLODE = 16; // px each slice is pushed outward from center

function explodedCenter(cx, cy, midAngle) {
  const rad = -midAngle * RADIAN;
  return {
    x: cx + EXPLODE * Math.cos(rad),
    y: cy + EXPLODE * Math.sin(rad),
  };
}

// Each slice's own radius scales with its value (0-100), so bigger numbers
// visibly reach further out — not just a wider angle, a taller petal too.
function radiusForValue(value, maxOuterRadius) {
  const minR = maxOuterRadius * 0.42;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  return minR + pct * (maxOuterRadius - minR);
}

// Custom exploded slice shape
function renderExplodedSlice(props) {
  const { cx, cy, midAngle, innerRadius, outerRadius: maxOuterRadius, startAngle, endAngle, fill, value } = props;
  const outerRadius = radiusForValue(value, maxOuterRadius);
  const { x, y } = explodedCenter(cx, cy, midAngle);

  // Convert angles to radians for arc path
  const toRad = (a) => (-a * Math.PI) / 180;
  const startRad = toRad(startAngle);
  const endRad = toRad(endAngle);

  const x1 = x + innerRadius * Math.cos(startRad);
  const y1 = y + innerRadius * Math.sin(startRad);
  const x2 = x + outerRadius * Math.cos(startRad);
  const y2 = y + outerRadius * Math.sin(startRad);
  const x3 = x + outerRadius * Math.cos(endRad);
  const y3 = y + outerRadius * Math.sin(endRad);
  const x4 = x + innerRadius * Math.cos(endRad);
  const y4 = y + innerRadius * Math.sin(endRad);

  const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;

  const d = [
    `M ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${x3} ${y3}`,
    `L ${x4} ${y4}`,
    innerRadius > 0 ? `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${x1} ${y1}` : '',
    'Z',
  ].join(' ');

  return (
    <path
      d={d}
      fill={fill}
      stroke="#fff"
      strokeWidth={2.5}
      style={{ filter: `drop-shadow(0 4px 8px ${fill}55)` }}
    />
  );
}

// Renders a white dot on the slice, a connector line, and a colored pill label
function renderCalloutLabel(props) {
  const { cx, cy, midAngle, outerRadius: maxOuterRadius, name, value, fill } = props;
  const outerRadius = radiusForValue(value, maxOuterRadius);
  const { x: ex, y: ey } = explodedCenter(cx, cy, midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sin = Math.sin(-RADIAN * midAngle);

  // White dot sits at ~70% of the way out on the slice
  const dotX = ex + outerRadius * 0.68 * cos;
  const dotY = ey + outerRadius * 0.68 * sin;

  // Line extends beyond the slice edge
  const lineStartX = ex + (outerRadius + 2) * cos;
  const lineStartY = ey + (outerRadius + 2) * sin;
  const lineEndX = ex + (outerRadius + 30) * cos;
  const lineEndY = ey + (outerRadius + 30) * sin;

  // Label position
  const labelX = lineEndX;
  const labelY = lineEndY;

  const text = `${name} ${value}%`;
  const charWidth = 6.2;
  const badgeW = Math.max(52, text.length * charWidth + 20);
  const badgeH = 22;
  const rectX = cos >= 0 ? labelX : labelX - badgeW;

  return (
    <g>
      {/* White dot on slice */}
      <circle cx={dotX} cy={dotY} r={4.5} fill="#fff" />
      {/* Connector line */}
      <line
        x1={lineStartX}
        y1={lineStartY}
        x2={lineEndX}
        y2={lineEndY}
        stroke={fill}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Colored pill badge */}
      <rect
        x={rectX}
        y={labelY - badgeH / 2}
        width={badgeW}
        height={badgeH}
        rx={badgeH / 2}
        fill={fill}
      />
      <text
        x={rectX + badgeW / 2}
        y={labelY + 4.5}
        textAnchor="middle"
        fill="#fff"
        fontSize={10}
        fontWeight={800}
        fontFamily="inherit"
      >
        {text}
      </text>
    </g>
  );
}

export default function ExplodedPieChart({ data, height = 320 }) {
  if (!data || data.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-on-surface-variant font-semibold">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 40, right: 48, left: 48, bottom: 40 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={0}
          outerRadius="50%"
          paddingAngle={3}
          stroke="none"
          shape={renderExplodedSlice}
          label={renderCalloutLabel}
          labelLine={false}
          isAnimationActive={false}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
