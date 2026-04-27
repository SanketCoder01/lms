import React, { useState } from 'react';

const Header = ({ onSearch }) => {
    const [searchValue, setSearchValue] = useState('');

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchValue(value);
        onSearch(value);
    };

    return (
        <header className="top-header">
            <div className="search-container">
                <input
                    type="search"
                    placeholder="Search properties, tenants..."
                    className="search-input"
                    value={searchValue}
                    onChange={handleSearchChange}
                />
                <span className="search-icon">🔍</span>
            </div>

            <div className="header-actions">
                <button className="notification-btn" aria-label="Notifications">
                    <span className="bell-icon">🔔</span>
                </button>
                <button className="new-lease-btn">
                    <span className="plus-icon">+</span>
                    <span>New Lease</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
