import React from 'react';
import Sidebar from './Sidebar';
import EchoDashboard from './echo/EchoDashboard';
import './echo/echo.css';

const Dashboard = () => (
  <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
    <Sidebar />
    <main style={{ flex: 1, marginLeft: '250px', padding: '24px', overflowY: 'auto', minWidth: 0 }}>
      <EchoDashboard />
    </main>
  </div>
);

export default Dashboard;
