import React, { useState } from 'react';
import './ReportGenerator.css';

const ReportGenerator = ({
    title = 'Generate Report',
    data = [],
    columns = [],
    onClose
}) => {
    const [selectedColumns, setSelectedColumns] = useState(
        columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
    );
    const [generating, setGenerating] = useState(false);

    // Read company name dynamically from session
    const companyName = (() => {
        try {
            const u = JSON.parse(sessionStorage.getItem('user') || '{}');
            return u.company_name || 'Cusec Consulting LLP';
        } catch { return 'Cusec Consulting LLP'; }
    })();


    const handleSelectAll = () => {
        const allSelected = Object.values(selectedColumns).every(v => v);
        const newState = columns.reduce((acc, col) => ({
            ...acc,
            [col.key]: !allSelected
        }), {});
        setSelectedColumns(newState);
    };

    const handleColumnToggle = (key) => {
        setSelectedColumns(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const getSelectedColumnKeys = () => columns.filter(col => selectedColumns[col.key]);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        } catch { return dateStr; }
    };

    const formatValue = (value, key) => {
        if (value === null || value === undefined) return 'N/A';
        if (key.toLowerCase().includes('date')) return formatDate(value);
        if (typeof value === 'number') return value.toLocaleString('en-IN');
        return String(value);
    };

    const generatePDF = async () => {
        const selectedCols = getSelectedColumnKeys();
        if (selectedCols.length === 0) {
            alert('Please select at least one column');
            return;
        }

        setGenerating(true);

        // Create printable HTML
        const printWindow = window.open('', '_blank');
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, sans-serif; 
                        padding: 20px;
                        background: #fff;
                        color: #1e293b;
                    }
                    .report-header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #2e66ff;
                    }
                    .report-header h1 {
                        font-size: 24px;
                        color: #1e293b;
                        margin-bottom: 8px;
                    }
                    .report-header .subtitle {
                        color: #64748b;
                        font-size: 14px;
                    }
                    .report-header .generated-date {
                        color: #94a3b8;
                        font-size: 12px;
                        margin-top: 8px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        font-size: 12px;
                    }
                    th {
                        background: #f1f5f9;
                        padding: 12px 10px;
                        text-align: left;
                        font-weight: 600;
                        color: #475569;
                        border-bottom: 2px solid #e2e8f0;
                        text-transform: uppercase;
                        font-size: 11px;
                        letter-spacing: 0.5px;
                    }
                    td {
                        padding: 10px;
                        border-bottom: 1px solid #f1f5f9;
                        color: #334155;
                    }
                    tr:nth-child(even) { background: #f8fafc; }
                    tr:hover { background: #f1f5f9; }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        color: #94a3b8;
                        font-size: 11px;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 15px;
                    }
                    @media print {
                        body { padding: 0; }
                        @page { margin: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>${title}</h1>
                    <div class="subtitle">Generated from Lease Management System</div>
                    <div class="generated-date">Report Date: ${new Date().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            ${selectedCols.map(col => `<th>${col.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${selectedCols.map(col => `<td>${formatValue(row[col.key], col.key)}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    Total Records: ${data.length} | Generated by ${companyName}
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            setGenerating(false);
        }, 500);
    };

    return (
        <div className="report-generator-overlay">
            <div className="report-generator-modal">
                <div className="report-modal-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="report-modal-body">
                    <div className="column-selection">
                        <div className="selection-header">
                            <span>Select columns to include in report:</span>
                            <button className="select-all-btn" onClick={handleSelectAll}>
                                {Object.values(selectedColumns).every(v => v) ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="columns-grid">
                            {columns.map(col => (
                                <label key={col.key} className="column-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedColumns[col.key] || false}
                                        onChange={() => handleColumnToggle(col.key)}
                                    />
                                    <span>{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="selected-count">
                        {getSelectedColumnKeys().length} of {columns.length} columns selected
                    </div>
                </div>

                <div className="report-modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="generate-btn"
                        onClick={generatePDF}
                        disabled={generating || getSelectedColumnKeys().length === 0}
                    >
                        {generating ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportGenerator;
