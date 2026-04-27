import React, { useEffect, useRef } from 'react';

const RevenueChart = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Sample data for revenue (in thousands)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
        const thisYear = [150, 180, 170, 220, 250, 240, 270];
        const lastYear = [120, 140, 160, 180, 200, 190, 220];

        const allValues = [...thisYear, ...lastYear];
        const maxValue = Math.max(...allValues);
        const minValue = 0;
        const valueRange = maxValue - minValue;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
        }

        // Draw Y-axis labels
        ctx.fillStyle = '#6B7280';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= gridLines; i++) {
            const value = maxValue - (maxValue / gridLines) * i;
            const y = padding.top + (chartHeight / gridLines) * i;
            ctx.fillText(`${Math.round(value)}K`, padding.left - 10, y);
        }

        // Draw X-axis labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        months.forEach((month, index) => {
            const x = padding.left + (chartWidth / (months.length - 1)) * index;
            ctx.fillText(month, x, height - padding.bottom + 10);
        });

        // Helper function to draw line
        const drawLine = (data, color, isDashed = false) => {
            const xStep = chartWidth / (data.length - 1);

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (isDashed) {
                ctx.setLineDash([5, 5]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.beginPath();
            data.forEach((value, index) => {
                const x = padding.left + index * xStep;
                const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Draw points
            ctx.fillStyle = color;
            data.forEach((value, index) => {
                const x = padding.left + index * xStep;
                const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        // Draw last year (dashed line)
        drawLine(lastYear, '#D1D5DB', true);

        // Draw this year (solid line)
        drawLine(thisYear, '#1F2937', false);

    }, []);

    return (
        <section className="chart-section">
            <div className="chart-card">
                <div className="chart-header">
                    <div>
                        <h2 className="chart-title">Revenue Trends</h2>
                        <p className="chart-subtitle">Gross revenue across all properties</p>
                    </div>
                    <div className="chart-legend">
                        <span className="legend-item">
                            <span className="legend-dot current-year"></span>
                            This year
                        </span>
                        <span className="legend-item">
                            <span className="legend-dot last-year"></span>
                            Last year
                        </span>
                    </div>
                </div>
                <canvas ref={canvasRef} id="revenueChart" style={{ width: '100%', height: '300px' }}></canvas>
            </div>
        </section>
    );
};

export default RevenueChart;
