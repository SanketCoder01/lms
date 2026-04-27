import React from 'react';
import LeaseNavBar from './LeaseNavBar';
import './leaseManagerNew.css';

const LeaseManagerLayout = ({ children }) => {
    return (
        <div className="lease-layout">
            <LeaseNavBar />
            <main className="lease-main-content">
                {children}
            </main>
        </div>
    );
};

export default LeaseManagerLayout;
