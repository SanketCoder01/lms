import React from 'react';
import jsPDF from 'jspdf';
// eslint-disable-next-line no-unused-vars
import autoTable from 'jspdf-autotable';

/**
 * Lease Report Generator Component
 * Generates a comprehensive PDF report with all lease details
 */
const LeaseReport = ({ lease, onGenerated }) => {
    
    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return `Rs ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDateTime = () => {
        const now = new Date();
        return now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + 
               ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const generatePDF = () => {
        if (!lease) {
            alert('No lease data available to generate report');
            return;
        }

        const doc = new jsPDF();
        let yPos = 20;

        // Header - Company Name
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 102, 255);
        doc.text('LEASE MANAGEMENT SYSTEM', 105, yPos, { align: 'center' });
        
        yPos += 8;
        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139);
        doc.text('Lease Agreement Report', 105, yPos, { align: 'center' });

        // Date and Time
        yPos += 10;
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${formatDateTime()}`, 105, yPos, { align: 'center' });

        // Divider line
        yPos += 8;
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPos, 195, yPos);

        // Lease ID and Status
        yPos += 12;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 55, 72);
        doc.text(`Lease ID: ${lease.id || 'N/A'}`, 15, yPos);
        doc.setFont('helvetica', 'normal');
        const status = lease.status || 'Draft';
        const statusColor = status === 'Active' ? [22, 163, 74] : status === 'Expired' ? [220, 38, 38] : [100, 116, 139];
        doc.setTextColor(...statusColor);
        doc.text(`Status: ${status}`, 195, yPos, { align: 'right' });

        // Section 1: Tenant Information
        yPos += 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 102, 255);
        doc.text('1. Tenant Information', 15, yPos);
        
        yPos += 8;
        doc.autoTable({
            startY: yPos,
            head: [['Field', 'Details']],
            headStyles: { fillColor: [46, 102, 255], textColor: 255, fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [45, 55, 72] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 15, right: 15 },
            tableWidth: 'auto',
            body: [
                ['Tenant Name', lease.tenant_name || lease.sub_tenant_name || 'N/A'],
                ['Contact Person', lease.tenant_first_name && lease.tenant_last_name ? `${lease.tenant_first_name} ${lease.tenant_last_name}` : lease.tenant_name || 'N/A'],
                ['Phone', lease.contact_person_phone || 'N/A'],
                ['Email', lease.contact_person_email || 'N/A'],
                ['Industry', lease.industry || 'N/A'],
                ['Lease Type', lease.lease_type || 'Direct Lease'],
                ['Sub-Tenant', lease.sub_tenant_name || 'N/A'],
            ],
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Section 2: Unit Details
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 102, 255);
        doc.text('2. Unit Details', 15, yPos);

        yPos += 8;
        doc.autoTable({
            startY: yPos,
            head: [['Field', 'Details']],
            headStyles: { fillColor: [46, 102, 255], textColor: 255, fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [45, 55, 72] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 15, right: 15 },
            tableWidth: 'auto',
            body: [
                ['Project', lease.project_name || 'N/A'],
                ['Location', lease.project_location || 'N/A'],
                ['Unit Number', lease.unit_number || 'N/A'],
                ['Floor', lease.floor_number || 'N/A'],
                ['Unit Condition', lease.unit_condition || 'N/A'],
                ['Chargeable Area', lease.chargeable_area ? `${lease.chargeable_area} sq ft` : 'N/A'],
                ['Carpet Area', lease.carpet_area ? `${lease.carpet_area} sq ft` : 'N/A'],
                ['Sub-Lease Area', lease.sub_lease_area_sqft ? `${lease.sub_lease_area_sqft} sq ft` : 'N/A'],
            ],
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Section 3: Owner Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 102, 255);
        doc.text('3. Owner Information', 15, yPos);

        yPos += 8;
        doc.autoTable({
            startY: yPos,
            head: [['Field', 'Details']],
            headStyles: { fillColor: [46, 102, 255], textColor: 255, fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [45, 55, 72] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 15, right: 15 },
            tableWidth: 'auto',
            body: [
                ['Owner Name', lease.owner_name || 'N/A'],
                ['Owner ID', lease.party_owner_id || 'N/A'],
            ],
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Section 4: Lease Terms
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 102, 255);
        doc.text('4. Lease Terms', 15, yPos);

        yPos += 8;
        doc.autoTable({
            startY: yPos,
            head: [['Field', 'Details']],
            headStyles: { fillColor: [46, 102, 255], textColor: 255, fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [45, 55, 72] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 15, right: 15 },
            tableWidth: 'auto',
            body: [
                ['Lease Start Date', formatDate(lease.lease_start)],
                ['Lease End Date', formatDate(lease.lease_end)],
                ['Rent Commencement Date', formatDate(lease.rent_commencement_date)],
                ['Fitout Period End', formatDate(lease.fitout_period_end)],
                ['Tenure (Months)', lease.tenure_months || 'N/A'],
                ['Lock-in Period (Months)', lease.lessee_lockin_period_days || lease.lockin_period_months || 'N/A'],
                ['Notice Period (Days)', lease.lessee_notice_period_days || lease.notice_period_months ? `${lease.lessee_notice_period_days || lease.notice_period_months}` : 'N/A'],
                ['Billing Frequency', lease.billing_frequency || 'Monthly'],
                ['Days Remaining', lease.days_remaining ? `${lease.days_remaining} days` : 'N/A'],
            ],
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Check if we need a new page for financial details
        if (yPos > 220) {
            doc.addPage();
            yPos = 20;
        }

        // Section 5: Financial Details
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 102, 255);
        doc.text('5. Financial Details', 15, yPos);

        yPos += 8;
        doc.autoTable({
            startY: yPos,
            head: [['Field', 'Details']],
            headStyles: { fillColor: [46, 102, 255], textColor: 255, fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [45, 55, 72] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 15, right: 15 },
            tableWidth: 'auto',
            body: [
                ['Monthly Rent', formatCurrency(lease.monthly_rent)],
                ['Rent Model', lease.rent_model || 'Fixed'],
                ['Security Deposit', formatCurrency(lease.security_deposit)],
                ['Utility Deposit', formatCurrency(lease.utility_deposit)],
                ['CAM Charges', formatCurrency(lease.cam_charges)],
                ['Revenue Share %', lease.revenue_share_percentage ? `${lease.revenue_share_percentage}%` : 'N/A'],
                ['Revenue Share Applicable On', lease.revenue_share_applicable_on || 'N/A'],
                ['Net Sales Threshold', formatCurrency(lease.net_sales_threshold)],
                ['Parking Charges', formatCurrency(lease.parking_charges)],
                ['Electricity Type', lease.electricity_type || 'N/A'],
            ],
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Section 6: Escalations
        if (lease.escalations && lease.escalations.length > 0) {
            if (yPos > 220) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(46, 102, 255);
            doc.text('6. Rent Escalations', 15, yPos);

            yPos += 8;
            const escalationData = lease.escalations.map((esc, idx) => [
                `Escalation #${idx + 1}`,
                formatDate(esc.effective_from),
                esc.effective_to ? formatDate(esc.effective_to) : 'Present',
                esc.increase_type || 'N/A',
                esc.value ? `${esc.value}${esc.increase_type === 'Percentage' ? '%' : ''}` : 'N/A',
            ]);

            doc.autoTable({
                startY: yPos,
                head: [['Escalation', 'Effective From', 'Effective To', 'Type', 'Value']],
                headStyles: { fillColor: [46, 102, 255], textColor: 255, fontSize: 10, fontStyle: 'bold' },
                bodyStyles: { fontSize: 9, textColor: [45, 55, 72] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 15, right: 15 },
                body: escalationData,
            });

            yPos = doc.lastAutoTable.finalY + 10;
        }

        // Section 7: Documents Status
        if (yPos > 200) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 102, 255);
        doc.text(lease.escalations?.length > 0 ? '7. Documents Status' : '6. Documents Status', 15, yPos);

        yPos += 8;
        const documentsData = [
            ['Letter of Intent (LOI)', lease.loi_document_url ? 'Uploaded' : 'Not Uploaded', formatDate(lease.loi_date)],
            ['Lease Agreement', lease.agreement_document_url ? 'Uploaded' : 'Not Uploaded', formatDate(lease.agreement_date)],
            ['Registration Document', lease.registration_document_url ? 'Uploaded' : 'Not Uploaded', 'N/A'],
        ];

        doc.autoTable({
            startY: yPos,
            head: [['Document', 'Status', 'Date']],
            headStyles: { fillColor: [46, 102, 255], textColor: 255, fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [45, 55, 72] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 15, right: 15 },
            body: documentsData,
            columnStyles: {
                1: { 
                    cellCallback: function(data) {
                        if (data.cell.raw === 'Uploaded') {
                            data.cell.styles.textColor = [22, 163, 74];
                        } else if (data.cell.raw === 'Not Uploaded') {
                            data.cell.styles.textColor = [220, 38, 38];
                        }
                    }
                }
            }
        });

        // Footer
        yPos = doc.lastAutoTable.finalY + 15;
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPos, 195, yPos);
        
        yPos += 10;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('This report is generated electronically and is for reference purposes only.', 105, yPos, { align: 'center' });
        yPos += 5;
        doc.text('Lease Management System - Confidential', 105, yPos, { align: 'center' });

        // Save the PDF
        const fileName = `Lease_Report_${lease.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);

        if (onGenerated) {
            onGenerated(fileName);
        }
    };

    return (
        <button
            onClick={generatePDF}
            className="primary-btn"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#2e66ff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none'
            }}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <polyline points="9 15 12 12 15 15"></polyline>
            </svg>
            Generate Report (PDF)
        </button>
    );
};

export default LeaseReport;
