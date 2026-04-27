import React, { useEffect, useRef } from 'react';

const StatCard = ({ title, value, trend, trendType, chartData }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw sparkline chart
        if (chartData && chartData.length > 0) {
            const padding = 5;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;

            const max = Math.max(...chartData);
            const min = Math.min(...chartData);
            const range = max - min || 1;

            const xStep = chartWidth / (chartData.length - 1);

            // Set line style based on trend type
            let strokeColor = '#10B981'; // green
            if (trendType === 'negative') strokeColor = '#EF4444'; // red
            if (trendType === 'neutral') strokeColor = '#9CA3AF'; // gray
            if (trendType === 'warning') strokeColor = '#F59E0B'; // orange
            if (trendType === 'info') strokeColor = '#8B5CF6'; // purple

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Draw line
            ctx.beginPath();
            chartData.forEach((point, index) => {
                const x = padding + index * xStep;
                const y = padding + chartHeight - ((point - min) / range) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Draw filled area
            ctx.lineTo(padding + (chartData.length - 1) * xStep, height - padding);
            ctx.lineTo(padding, height - padding);
            ctx.closePath();

            ctx.fillStyle = strokeColor + '20'; // 20 is alpha in hex
            ctx.fill();
        }
    }, [chartData, trendType]);

    const getTrendClass = () => {
        switch (trendType) {
            case 'positive': return 'stat-trend positive';
            case 'negative': return 'stat-trend negative';
            case 'neutral': return 'stat-trend neutral';
            case 'warning': return 'stat-trend warning';
            case 'info': return 'stat-trend info';
            default: return 'stat-trend';
        }
    };

    return (
        <div className="stat-card">
            <div className="stat-header">
                <h3 className="stat-title">{title}</h3>
            </div>
            <div className="stat-value">{value}</div>
            <div className={getTrendClass()}>{trend}</div>
            <canvas
                ref={canvasRef}
                className="trend-chart"
                width={100}
                height={40}
            />
        </div>
    );
};

export default StatCard;
