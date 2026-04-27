import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TenantList from './TenantList';
import OwnerList from './OwnerList';
import './Master.css';

const Master = () => {
    // Determine active tab from local storage or default to 'owners'
    const [activeTab, setActiveTab] = useState('owners');

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <div className="master-container">
                    <header className="page-header">
                        <div className="header-left">
                            <h1>Master Management</h1>
                            <p>Manage owners and tenants from a single location.</p>
                        </div>
                    </header>

                    <div className="master-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'owners' ? 'active' : ''}`}
                            onClick={() => setActiveTab('owners')}
                        >
                            Owners
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'tenants' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tenants')}
                        >
                            Tenants
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'owners' ? <OwnerList isTabContent={true} /> : <TenantList isTabContent={true} />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Master;
