import { useState } from "react";
import LeaseOSDashboardUI from "./LeaseOSDashboardUI";
import LeaseOSInvoicingUI from "./LeaseOSInvoicingUI";
import LeaseOSCollectionsUI from "./LeaseOSCollectionsUI";
import LeaseOSRentLedgerUI from "./LeaseOSRentLedgerUI";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  if (activePage === "Invoicing") {
    return <LeaseOSInvoicingUI onNavigate={setActivePage} />;
  }
  if (activePage === "Collections") {
    return <LeaseOSCollectionsUI onNavigate={setActivePage} />;
  }
  if (activePage === "Rent Ledger") {
    return <LeaseOSRentLedgerUI onNavigate={setActivePage} />;
  }

  return <LeaseOSDashboardUI onNavigate={setActivePage} />;
}

export default App;
