

## Commercial Real Estate Dashboard

Implement a pixel-accurate dashboard matching the uploaded screenshot with two main sections:

### Section 1: Lease Expiry, Escalations & Ownership-wise Sales
Three-column layout:
- **Leases nearing expiry** — List of 5 leases (GF-12 Zara, FF-07 CCD, GF-01 Shoppers Stop, SF-22 Nykaa, TF-04 PVR) with unit ID, tenant name, area/rent, days remaining, and color-coded status badges (Notice=yellow, Expiring=red, Lock-in=orange, Active=green). "View all expiring leases" link at bottom.
- **Upcoming escalations** — List of 4 escalations (GF-08 H&M, FC-03 McDonald's, SF-09 Reliance Digital, GF-06 Lifestyle) with details and Critical/Pending badges. Green "Escalation impact" callout box showing ₹5.1L/mo. "Manage escalations" link.
- **Unit sales & ownership** — Stacked horizontal bar (navy 42%, green 25%, yellow 33%), breakdown by External investors (78 units), Close group (46 units), Unsold/developer retained (62 units) with rent and sqft avg values.

### Section 2: Comprehensive Rental Projection Matrix
Two-column layout:
- **By Units & Area (SQFT)** — Table with 6 rental categories (Fixed rent lock-in/post, MG rent lock-in/post, Rev share lock-in/post) showing colored dots, units, area, and Fixed/Variable type badges. Total: 142 units, 9,84,800 sqft.
- **By Financial Value (Monthly)** — Bar chart using Recharts showing 6 categories. Summary: Committed ₹1.46 Cr (90%), Variable ₹16.3L (10%).

### Design
- Clean white background, minimal borders
- Section headers with left orange/red vertical bar accent
- Typography: uppercase bold headers, regular body text
- Status badges: red (Critical), orange (Pending/Notice), yellow (Expiring/Lock-in), green (Active)
- Color-coded dots for rental categories matching the bar chart
- All amounts in Indian format (₹, L=Lakhs, Cr=Crores)
- Static/hardcoded data matching the screenshot exactly

