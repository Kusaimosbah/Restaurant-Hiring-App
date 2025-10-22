'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface TrendChartProps {
  title: string;
  data: number[];
  labels?: string[];
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  height?: number;
  loading?: boolean;
}

export default function TrendChart({
  title,
  data,
  labels,
  color = 'blue',
  height = 80,
  loading = false,
}: TrendChartProps) {
  // Map color to Tailwind classes
  const colorMap = {
    blue: {
      stroke: '#3b82f6',
      fill: '#93c5fd',
    },
    green: {
      stroke: '#10b981',
      fill: '#6ee7b7',
    },
    purple: {
      stroke: '#8b5cf6',
      fill: '#c4b5fd',
    },
    yellow: {
      stroke: '#f59e0b',
      fill: '#fcd34d',
    },
    red: {
      stroke: '#ef4444',
      fill: '#fca5a5',
    },
  };

  // Calculate SVG path for the chart
  const getPath = () => {
    if (!data || data.length === 0) return '';

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    // Scale data points to fit within the SVG height
    const scaledData = data.map(value => 
      height - ((value - min) / range) * height
    );
    
    // Calculate the width of each segment
    const width = 100 / (scaledData.length - 1);
    
    // Create the SVG path
    let path = `M 0,${scaledData[0]}`;
    
    scaledData.forEach((point, i) => {
      if (i > 0) {
        path += ` L ${i * width},${point}`;
      }
    });
    
    // Create the area fill path
    let areaPath = path + ` L ${100},${height} L 0,${height} Z`;
    
    return { line: path, area: areaPath };
  };

  const paths = getPath();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse h-20 w-full bg-gray-200 rounded"></div>
        ) : (
          <>
            <svg
              width="100%"
              height={height}
              viewBox={`0 0 100 ${height}`}
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {/* Area fill */}
              {paths && typeof paths === 'object' && (
                <path
                  d={paths.area}
                  fill={colorMap[color].fill}
                  fillOpacity="0.2"
                />
              )}
              
              {/* Line */}
              {paths && typeof paths === 'object' && (
                <path
                  d={paths.line}
                  fill="none"
                  stroke={colorMap[color].stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {/* Data points */}
              {data.map((value, i) => {
                const max = Math.max(...data);
                const min = Math.min(...data);
                const range = max - min || 1;
                const x = i * (100 / (data.length - 1));
                const y = height - ((value - min) / range) * height;
                
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="2"
                    fill="white"
                    stroke={colorMap[color].stroke}
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
            
            {/* Labels */}
            {labels && (
              <div className="flex justify-between mt-2">
                {labels.map((label, i) => (
                  <div key={i} className="text-xs text-gray-500">
                    {label}
                  </div>
                ))}
              </div>
            )}
            
            {/* Current value */}
            <div className="mt-2 flex items-center justify-between">
              <div className="text-2xl font-bold">{data[data.length - 1]}</div>
              <div className="text-xs text-gray-500">
                {data[data.length - 1] > data[0] ? (
                  <span className="text-green-600">↑ {Math.round(((data[data.length - 1] - data[0]) / data[0]) * 100)}%</span>
                ) : data[data.length - 1] < data[0] ? (
                  <span className="text-red-600">↓ {Math.round(((data[0] - data[data.length - 1]) / data[0]) * 100)}%</span>
                ) : (
                  <span>No change</span>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
