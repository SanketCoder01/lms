import React from 'react';

const ListSection = ({ title, items, iconType }) => {
    const getBadgeClass = (type) => {
        switch (type) {
            case 'days': return 'badge badge-days';
            case 'critical': return 'badge badge-critical';
            case 'warning': return 'badge badge-warning';
            case 'success': return 'badge badge-success';
            case 'percent': return 'badge badge-percent';
            default: return 'badge';
        }
    };

    return (
        <div className="list-card">
            <div className="list-header">
                <h3 className="list-title">{title}</h3>
                <a href="#" className="view-all-link" onClick={(e) => e.preventDefault()}>
                    View All
                </a>
            </div>
            <div className="list-items">
                {items.map((item) => (
                    <div key={item.id} className="list-item">
                        {iconType === 'date' && item.dateIcon ? (
                            <div className="item-icon date-icon">
                                <div className="date-month">{item.dateIcon.month}</div>
                                <div className="date-day">{item.dateIcon.day}</div>
                            </div>
                        ) : (
                            <div className="item-icon">U</div>
                        )}
                        <div className="item-details">
                            <div className="item-title">
                                {item.title} · {item.date}
                            </div>
                            <div className="item-subtitle">{item.subtitle}</div>
                        </div>
                        <span className={getBadgeClass(item.badge.type)}>
                            {item.badge.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ListSection;
