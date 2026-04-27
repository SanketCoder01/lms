import React from 'react';

const AreaCards = () => {
    const areaData = [
        {
            title: 'Area Occupied',
            value: '245,000 sq ft',
            subtitle: 'Average Rent Achieved: $57.20 per sq ft',
            label: 'Super / Leasable Area'
        },
        {
            title: 'Area Vacant',
            value: '42,000 sq ft',
            subtitle: 'Average Expected Rent: $53.82 per sq ft',
            label: 'Super / Leasable Area'
        }
    ];

    return (
        <section className="area-section">
            <div className="area-grid">
                {areaData.map((area, index) => (
                    <div key={index} className="area-card">
                        <h3 className="area-title">{area.title}</h3>
                        <div className="area-value">{area.value}</div>
                        <div className="area-subtitle">{area.subtitle}</div>
                        <div className="area-label">{area.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AreaCards;
