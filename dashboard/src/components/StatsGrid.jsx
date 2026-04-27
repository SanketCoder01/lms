import React from 'react';
import StatCard from './StatCard';
import '../App.css';

const StatsGrid = () => {
    const statsData = [
        {
            title: 'Total Projects',
            value: '12',
            trend: '+2% vs last month',
            trendType: 'positive',
            chartData: [8, 9, 8.5, 10, 9.5, 11, 10.5, 12]
        },
        {
            title: 'Total Units',
            value: '148',
            trend: '+5% vs last month',
            trendType: 'negative',
            chartData: [130, 135, 138, 142, 140, 145, 143, 148]
        },
        {
            title: 'Total Owners',
            value: '45',
            trend: '~ 0% change',
            trendType: 'neutral',
            chartData: [45, 46, 45, 44, 45, 46, 45, 45]
        },
        {
            title: 'Total Tenants',
            value: '142',
            trend: '+3% vs last month',
            trendType: 'warning',
            chartData: [125, 128, 132, 135, 137, 139, 140, 142]
        },
        {
            title: 'Total Leases',
            value: '138',
            trend: '+4% vs last month',
            trendType: 'info',
            chartData: [120, 124, 128, 130, 132, 135, 136, 138]
        },
        {
            title: 'Total Revenue',
            value: '$1.2M',
            trend: '+12% YTD',
            trendType: 'negative',
            chartData: [0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.18, 1.2]
        }
    ];

    return (
        <section className="stats-section">
            <div className="stats-grid">
                {statsData.map((stat, index) => (
                    <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        trend={stat.trend}
                        trendType={stat.trendType}
                        chartData={stat.chartData}
                    />
                ))}
            </div>
        </section>
    );
};

export default StatsGrid;
