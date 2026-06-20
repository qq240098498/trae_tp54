import { cn } from '@/lib/utils';

interface TrendDataPoint {
  date: string;
  count: number;
}

interface TrendChartProps {
  data?: TrendDataPoint[];
  className?: string;
  height?: number;
  title?: string;
}

const defaultData: TrendDataPoint[] = [
  { date: '06-14', count: 5 },
  { date: '06-15', count: 8 },
  { date: '06-16', count: 6 },
  { date: '06-17', count: 12 },
  { date: '06-18', count: 9 },
  { date: '06-19', count: 7 },
  { date: '06-20', count: 8 },
];

export default function TrendChart({
  data = defaultData,
  className,
  height = 200,
  title = '近7日报修趋势',
}: TrendChartProps) {
  const width = 600;
  const paddingTop = 30;
  const paddingRight = 20;
  const paddingBottom = 40;
  const paddingLeft = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const yAxisMax = Math.ceil(maxCount / 5) * 5;
  const yAxisSteps = 5;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.count / yAxisMax) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${paddingTop + chartHeight}` +
    ` L ${points[0].x} ${paddingTop + chartHeight}` +
    ' Z';

  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-sm text-gray-500">
          总计 <span className="font-bold text-primary-800 text-lg">{totalCount}</span> 单
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: `${height}px` }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y 轴网格线和刻度 */}
        {Array.from({ length: yAxisSteps + 1 }).map((_, i) => {
          const y = paddingTop + (i / yAxisSteps) * chartHeight;
          const value = Math.round(yAxisMax - (i / yAxisSteps) * yAxisMax);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray={i === yAxisSteps ? '0' : '4 4'}
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-400 text-xs"
                style={{ fontSize: '11px' }}
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* 面积填充 */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* 折线 */}
        <path
          d={linePath}
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 数据点 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#1e3a5f" strokeWidth="2.5" />
            <circle cx={p.x} cy={p.y} r="2" fill="#1e3a5f" />
            <text
              x={p.x}
              y={p.y - 12}
              textAnchor="middle"
              className="fill-primary-800 font-semibold"
              style={{ fontSize: '12px' }}
            >
              {p.count}
            </text>
            <text
              x={p.x}
              y={height - 15}
              textAnchor="middle"
              className="fill-gray-500"
              style={{ fontSize: '11px' }}
            >
              {p.date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
