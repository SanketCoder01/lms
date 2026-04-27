import React from 'react';
import Sidebar from './Sidebar';
import EchoDashboard from './echo/EchoDashboard';
import './echo/echo.css';
import './dashboard.css';

const Dashboard = () => (
  <div className="admin-dashboard-layout">
    <Sidebar />
    <main className="admin-main-content">
      <EchoDashboard />
    </main>
  </div>
);

export default Dashboard;
