import { useEffect, useRef } from 'react';
import './MetricsChart.css';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface MetricsChartProps {
  data: DataPoint[];
  maxDataPoints?: number;
  color?: string;
  label: string;
  unit?: string;
}

function MetricsChart({ 
  data, 
  maxDataPoints = 20, 
  color = '#06b6d4',
  label,
  unit = ''
}: MetricsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Get last N data points
    const displayData = data.slice(-maxDataPoints);
    if (displayData.length < 2) return;

    // Calculate bounds
    const maxValue = Math.max(...displayData.map(d => d.value), 100);
    const minValue = 0;
    const valueRange = maxValue - minValue;

    // Calculate scaling
    const padding = 20;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;
    const xStep = chartWidth / (maxDataPoints - 1);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    }

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, rect.height - padding);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    displayData.forEach((point, index) => {
      const x = padding + index * xStep;
      const normalizedValue = (point.value - minValue) / valueRange;
      const y = rect.height - padding - normalizedValue * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Complete the fill path
    const lastX = padding + (displayData.length - 1) * xStep;
    ctx.lineTo(lastX, rect.height - padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    displayData.forEach((point, index) => {
      const x = padding + index * xStep;
      const normalizedValue = (point.value - minValue) / valueRange;
      const y = rect.height - padding - normalizedValue * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points
    displayData.forEach((point, index) => {
      const x = padding + index * xStep;
      const normalizedValue = (point.value - minValue) / valueRange;
      const y = rect.height - padding - normalizedValue * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Highlight last point
      if (index === displayData.length - 1) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      }
    });

  }, [data, maxDataPoints, color]);

  const currentValue = data.length > 0 ? data[data.length - 1].value : 0;

  return (
    <div className="metrics-chart">
      <div className="chart-header">
        <span className="chart-label">{label}</span>
        <span className="chart-value" style={{ color }}>
          {Math.round(currentValue)}{unit}
        </span>
      </div>
      <canvas 
        ref={canvasRef} 
        className="chart-canvas"
        style={{ width: '100%', height: '80px' }}
      />
    </div>
  );
}

export default MetricsChart;
