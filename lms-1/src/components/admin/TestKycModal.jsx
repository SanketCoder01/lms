import React, { useState } from 'react';
import KycDetailsModal from './KycDetailsModal';

const TestKycModal = () => {
    const [isModalOpen, setIsModalOpen] = useState(true);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center', height: '100vh', background: '#f5f5f5' }}>
            <h1>KYC Details Modal Test Page</h1>
            <p>Click the button below to open the modal if it's closed.</p>

            <button
                onClick={handleOpenModal}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    background: '#0369a1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
                Open KYC Details
            </button>

            <KycDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            // data={null} // Passing null to trigger default mock data in component
            />
        </div>
    );
};

export default TestKycModal;
