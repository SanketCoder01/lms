import React from "react";
import {
    FiHome,
    FiFolder,
    FiFileText,
    FiUser,
    FiUsers,
    FiSettings,
    FiTrendingUp,
    FiLogOut,
} from "react-icons/fi"; // simple black/white icons

const Sidebar = ({ isOpen, onClose }) => {
    const navItems = [
        { icon: <FiTrendingUp />, label: "Dashboard", active: true },
        { icon: <FiFolder />, label: "Project", active: false },
        { icon: <FiFileText />, label: "Leases", active: false },
        { icon: <FiUser />, label: "Owner", active: false },
        { icon: <FiHome />, label: "Tenant", active: false },
        { icon: <FiUsers />, label: "Role Management", active: false },
        { icon: <FiSettings />, label: "Settings", active: false },
    ];

    return (
        <aside className={`sidebar ${isOpen ? "active" : ""}`}>
            <div className="logo">
                <div className="logo-icon">🏢</div>
                <span className="logo-text">Cusec Consulting LLP</span>
            </div>

            <nav className="nav-menu">
                {navItems.map((item, index) => (
                    <a
                        key={index}
                        href="#"
                        className={`nav-item ${item.active ? "active" : ""}`}
                        onClick={(e) => {
                            e.preventDefault();
                            if (window.innerWidth < 768) onClose();
                        }}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </a>
                ))}
            </nav>

            {/* 🔥 Logout - red icon only */}
            <div className="logout-btn">
                <span className="nav-icon" style={{ color: "red" }}>
                    <FiLogOut />
                </span>
                <span className="nav-label">Log Out</span>
            </div>
        </aside>
    );
};

export default Sidebar;
