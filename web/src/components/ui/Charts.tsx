import React from 'react';

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    tension?: number;
    fill?: boolean;
  }>;
}

export interface ChartProps {
  data: ChartData;
  options?: any;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Line Chart Component
 */
export const LineChart: React.FC<ChartProps> = ({
  data,
  options = {},
  width = 400,
  height = 200,
  className = ''
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Calculate data bounds
    const allValues = data.datasets.flatMap(dataset => dataset.data);
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues, 0);
    const valueRange = maxValue - minValue || 1;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxValue - (valueRange * i) / 5;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(value).toString(), padding - 10, y + 4);
    }

    // Vertical grid lines
    const stepX = chartWidth / (data.labels.length - 1 || 1);
    for (let i = 0; i < data.labels.length; i++) {
      const x = padding + i * stepX;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();

      // X-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.labels[i], x, padding + chartHeight + 20);
    }

    // Draw datasets
    data.datasets.forEach((dataset, index) => {
      const color = Array.isArray(dataset.borderColor) 
        ? dataset.borderColor[0] 
        : dataset.borderColor || '#3b82f6';

      ctx.strokeStyle = color;
      ctx.lineWidth = dataset.borderWidth || 2;
      ctx.beginPath();

      dataset.data.forEach((value, i) => {
        const x = padding + i * stepX;
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Draw data points
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      ctx.stroke();
    });

    // Draw legend
    let legendY = 20;
    data.datasets.forEach((dataset, index) => {
      const color = Array.isArray(dataset.borderColor) 
        ? dataset.borderColor[0] 
        : dataset.borderColor || '#3b82f6';

      ctx.fillStyle = color;
      ctx.fillRect(padding + chartWidth - 100, legendY, 12, 12);
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(dataset.label, padding + chartWidth - 80, legendY + 9);
      
      legendY += 20;
    });

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`border rounded ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};

/**
 * Bar Chart Component
 */
export const BarChart: React.FC<ChartProps> = ({
  data,
  options = {},
  width = 400,
  height = 200,
  className = ''
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Calculate data bounds
    const allValues = data.datasets.flatMap(dataset => dataset.data);
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues, 0);
    const valueRange = maxValue - minValue || 1;

    // Draw grid (horizontal lines only)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxValue - (valueRange * i) / 5;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(value).toString(), padding - 10, y + 4);
    }

    // Calculate bar dimensions
    const barWidth = chartWidth / data.labels.length * 0.8;
    const barSpacing = chartWidth / data.labels.length * 0.2;

    // Draw bars
    data.datasets.forEach((dataset, datasetIndex) => {
      dataset.data.forEach((value, i) => {
        const x = padding + i * (barWidth + barSpacing) + (barWidth * datasetIndex) / data.datasets.length;
        const barHeight = ((value - minValue) / valueRange) * chartHeight;
        const y = padding + chartHeight - barHeight;

        const color = Array.isArray(dataset.backgroundColor)
          ? dataset.backgroundColor[i] || dataset.backgroundColor[0]
          : dataset.backgroundColor || '#3b82f6';

        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth / data.datasets.length, barHeight);

        // Add value labels on bars
        ctx.fillStyle = '#374151';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          value.toString(),
          x + (barWidth / data.datasets.length) / 2,
          y - 5
        );
      });
    });

    // Draw X-axis labels
    data.labels.forEach((label, i) => {
      const x = padding + i * (barWidth + barSpacing) + barWidth / 2;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, padding + chartHeight + 20);
    });

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`border rounded ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};

/**
 * Doughnut Chart Component
 */
export const DoughnutChart: React.FC<ChartProps> = ({
  data,
  options = {},
  width = 200,
  height = 200,
  className = ''
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up dimensions
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;

    // Get data from first dataset
    const dataset = data.datasets[0];
    if (!dataset) return;

    const total = dataset.data.reduce((sum, value) => sum + value, 0);
    let currentAngle = -Math.PI / 2; // Start from top

    // Default colors
    const defaultColors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
    ];

    // Draw segments
    dataset.data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const color = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[index] || defaultColors[index % defaultColors.length]
        : dataset.backgroundColor || defaultColors[index % defaultColors.length];

      // Draw segment
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Draw segment border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Draw legend
    let legendY = 20;
    data.labels.forEach((label, index) => {
      const color = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[index] || defaultColors[index % defaultColors.length]
        : dataset.backgroundColor || defaultColors[index % defaultColors.length];

      // Legend color box
      ctx.fillStyle = color;
      ctx.fillRect(10, legendY, 12, 12);

      // Legend text
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      const percentage = total > 0 ? ((dataset.data[index] / total) * 100).toFixed(1) : '0';
      ctx.fillText(`${label} (${percentage}%)`, 30, legendY + 9);

      legendY += 20;
    });

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`border rounded ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};

/**
 * Area Chart Component
 */
export const AreaChart: React.FC<ChartProps> = ({
  data,
  options = {},
  width = 400,
  height = 200,
  className = ''
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Calculate data bounds
    const allValues = data.datasets.flatMap(dataset => dataset.data);
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues, 0);
    const valueRange = maxValue - minValue || 1;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxValue - (valueRange * i) / 5;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(value).toString(), padding - 10, y + 4);
    }

    // Draw datasets
    const stepX = chartWidth / (data.labels.length - 1 || 1);
    
    data.datasets.forEach((dataset, index) => {
      const strokeColor = Array.isArray(dataset.borderColor) 
        ? dataset.borderColor[0] 
        : dataset.borderColor || '#3b82f6';
      
      const fillColor = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[0]
        : dataset.backgroundColor || strokeColor + '20';

      // Create path for area
      ctx.beginPath();
      ctx.moveTo(padding, padding + chartHeight); // Start from bottom left

      dataset.data.forEach((value, i) => {
        const x = padding + i * stepX;
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        ctx.lineTo(x, y);
      });

      ctx.lineTo(padding + chartWidth, padding + chartHeight); // End at bottom right
      ctx.closePath();

      // Fill area
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Draw line
      ctx.beginPath();
      dataset.data.forEach((value, i) => {
        const x = padding + i * stepX;
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = dataset.borderWidth || 2;
      ctx.stroke();
    });

    // Draw X-axis labels
    data.labels.forEach((label, i) => {
      const x = padding + i * stepX;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, padding + chartHeight + 20);
    });

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`border rounded ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};