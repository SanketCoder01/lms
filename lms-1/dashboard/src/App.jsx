import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';
import AreaCards from './components/AreaCards';
import RevenueChart from './components/RevenueChart';
import ListSection from './components/ListSection';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
  };

  // Sample data for upcoming renewals
  const renewalsData = [
    {
      id: 1,
      title: 'Unit 402',
      date: 'Nov 15, 2024',
      subtitle: 'James Logistics',
      badge: { text: '30 Days', type: 'days' }
    },
    {
      id: 2,
      title: 'Unit 105',
      date: 'Dec 01, 2024',
      subtitle: 'TechCorp Inc',
      badge: { text: '45 Days', type: 'days' }
    },
    {
      id: 3,
      title: 'Unit 220',
      date: 'Dec 12, 2024',
      subtitle: 'Star Bakery',
      badge: { text: '60 Days', type: 'days' }
    }
  ];

  // Sample data for upcoming expiries
  const expiriesData = [
    {
      id: 1,
      title: 'Unit 402',
      date: 'Nov 15, 2024',
      subtitle: 'James Logistics',
      badge: { text: 'Past Due', type: 'critical' }
    },
    {
      id: 2,
      title: 'Unit 105',
      date: 'Dec 01, 2024',
      subtitle: 'TechCorp Inc',
      badge: { text: 'METAL NS', type: 'warning' }
    },
    {
      id: 3,
      title: 'Unit 220',
      date: 'Dec 12, 2024',
      subtitle: 'Star Bakery',
      badge: { text: 'LEASED', type: 'success' }
    }
  ];

  // Sample data for rent escalations
  const escalationsData = [
    {
      id: 1,
      title: 'Unit 402',
      date: 'Nov 15, 2024',
      subtitle: 'CPI Adjustment',
      badge: { text: '+3.5%', type: 'percent' },
      dateIcon: { month: 'JAN', day: '01' }
    },
    {
      id: 2,
      title: 'Unit 105',
      date: 'Dec 01, 2024',
      subtitle: 'Fixed Increase',
      badge: { text: '+2.0%', type: 'percent' },
      dateIcon: { month: 'JAN', day: '01' }
    },
    {
      id: 3,
      title: 'Unit 220',
      date: 'Dec 12, 2024',
      subtitle: 'Market Review',
      badge: { text: '+5.0%', type: 'percent' },
      dateIcon: { month: 'FEB', day: '01' }
    }
  ];

  return (
    <div className="app">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <button 
        className="mobile-menu-toggle" 
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <main className="main-content">
        <Header onSearch={handleSearch} />
        
        <StatsGrid />
        
        <AreaCards />
        
        <RevenueChart />
        
        <section className="lists-section">
          <div className="lists-grid">
            <ListSection 
              title="Upcoming Renewals"
              items={renewalsData}
              iconType="unit"
            />
            <ListSection 
              title="Upcoming Expiries"
              items={expiriesData}
              iconType="unit"
            />
            <ListSection 
              title="Rent Escalations"
              items={escalationsData}
              iconType="date"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
