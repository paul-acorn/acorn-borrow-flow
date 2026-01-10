import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DealData {
  id: string;
  name: string;
  type: string;
  status: string;
  amount: number | null;
  created_at: string;
  profiles: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
  } | null;
}

interface ClientData {
  personal: any;
  addresses: any[];
  assets: any;
  income: any[];
  credit: any;
}

const formatCurrency = (amount: number | null | undefined): string => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: string | null | undefined): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const fetchClientData = async (userId: string): Promise<ClientData> => {
  const [personal, addresses, assets, income, credit] = await Promise.all([
    supabase.from("client_personal_details").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("client_addresses").select("*").eq("user_id", userId).order("is_current", { ascending: false }),
    supabase.from("client_financial_assets").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("client_income_streams").select("*").eq("user_id", userId),
    supabase.from("client_credit_history").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    personal: personal.data,
    addresses: addresses.data || [],
    assets: assets.data,
    income: income.data || [],
    credit: credit.data,
  };
};

export const generateDealPDF = async (deal: DealData): Promise<void> => {
  try {
    const clientData = deal.profiles ? await fetchClientData(deal.id.split("-")[0]) : null;
    
    // For now, generate a clean HTML that can be printed to PDF
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to export PDF");
      return;
    }

    const currentAddress = clientData?.addresses.find((a) => a.is_current);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Deal Summary - ${deal.name}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
            h1 { color: #1a365d; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #6b7280; display: inline-block; width: 180px; }
            .value { color: #1f2937; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #dbeafe; color: #1e40af; font-weight: 500; }
            .amount { font-size: 1.5em; color: #059669; font-weight: bold; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 0.9em; color: #6b7280; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Deal Summary</h1>
          
          <div class="section">
            <h2>Deal Information</h2>
            <div class="grid">
              <div><span class="label">Deal Name:</span> <span class="value">${deal.name}</span></div>
              <div><span class="label">Type:</span> <span class="value" style="text-transform: capitalize;">${deal.type.replace(/_/g, " ")}</span></div>
              <div><span class="label">Status:</span> <span class="status-badge">${deal.status.replace(/_/g, " ")}</span></div>
              <div><span class="label">Created:</span> <span class="value">${formatDate(deal.created_at)}</span></div>
            </div>
            <div style="margin-top: 15px;">
              <span class="label">Loan Amount:</span> <span class="amount">${formatCurrency(deal.amount)}</span>
            </div>
          </div>

          <div class="section">
            <h2>Client Information</h2>
            <div class="grid">
              <div><span class="label">Name:</span> <span class="value">${deal.profiles?.first_name || ""} ${deal.profiles?.last_name || ""}</span></div>
              <div><span class="label">Email:</span> <span class="value">${deal.profiles?.email || "N/A"}</span></div>
              <div><span class="label">Phone:</span> <span class="value">${deal.profiles?.phone_number || "N/A"}</span></div>
              ${currentAddress ? `<div><span class="label">Address:</span> <span class="value">${currentAddress.property_number || ""} ${currentAddress.street || ""}, ${currentAddress.city || ""} ${currentAddress.postcode || ""}</span></div>` : ""}
            </div>
          </div>

          ${clientData?.personal ? `
          <div class="section">
            <h2>Personal Details</h2>
            <div class="grid">
              <div><span class="label">Date of Birth:</span> <span class="value">${formatDate(clientData.personal.dob)}</span></div>
              <div><span class="label">Nationality:</span> <span class="value">${clientData.personal.nationality || "N/A"}</span></div>
              <div><span class="label">Marital Status:</span> <span class="value">${clientData.personal.marital_status || "N/A"}</span></div>
              <div><span class="label">Dependents:</span> <span class="value">${clientData.personal.dependents || 0}</span></div>
            </div>
          </div>
          ` : ""}

          ${clientData?.assets ? `
          <div class="section">
            <h2>Financial Summary</h2>
            <div class="grid">
              <div><span class="label">Bank Accounts:</span> <span class="value">${formatCurrency(clientData.assets.bank_accounts)}</span></div>
              <div><span class="label">Property Value:</span> <span class="value">${formatCurrency(clientData.assets.property_value)}</span></div>
              <div><span class="label">Investments:</span> <span class="value">${formatCurrency(clientData.assets.investments)}</span></div>
              <div><span class="label">Pension Value:</span> <span class="value">${formatCurrency(clientData.assets.pension_value)}</span></div>
            </div>
          </div>
          ` : ""}

          ${clientData?.credit ? `
          <div class="section">
            <h2>Credit History</h2>
            <div class="grid">
              <div><span class="label">Credit Score:</span> <span class="value">${clientData.credit.credit_score || "N/A"}</span></div>
              <div><span class="label">CCJs:</span> <span class="value">${clientData.credit.has_ccjs ? `Yes (${clientData.credit.ccj_count || 0})` : "No"}</span></div>
              <div><span class="label">Defaults:</span> <span class="value">${clientData.credit.has_defaults ? `Yes (${clientData.credit.default_count || 0})` : "No"}</span></div>
              <div><span class="label">Bankruptcy:</span> <span class="value">${clientData.credit.has_bankruptcy ? "Yes" : "No"}</span></div>
            </div>
          </div>
          ` : ""}

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString("en-GB")} | Confidential Document</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 500);

    toast.success("PDF export ready - use Print to save as PDF");
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF");
  }
};

export const generateDealCSV = async (deal: DealData): Promise<void> => {
  try {
    // Fetch additional client data
    const clientData = await fetchClientData(deal.profiles ? (deal as any).user_id : deal.id);

    const currentAddress = clientData.addresses.find((a) => a.is_current);
    const primaryIncome = clientData.income[0];

    // Build CSV data
    const rows = [
      ["Deal Summary Export"],
      ["Generated", new Date().toISOString()],
      [],
      ["DEAL INFORMATION"],
      ["Deal Name", deal.name],
      ["Deal Type", deal.type.replace(/_/g, " ")],
      ["Status", deal.status.replace(/_/g, " ")],
      ["Loan Amount", deal.amount?.toString() || ""],
      ["Created Date", deal.created_at],
      [],
      ["CLIENT INFORMATION"],
      ["First Name", deal.profiles?.first_name || ""],
      ["Last Name", deal.profiles?.last_name || ""],
      ["Email", deal.profiles?.email || ""],
      ["Phone", deal.profiles?.phone_number || ""],
      [],
      ["PERSONAL DETAILS"],
      ["Date of Birth", clientData.personal?.dob || ""],
      ["Nationality", clientData.personal?.nationality || ""],
      ["Marital Status", clientData.personal?.marital_status || ""],
      ["Dependents", clientData.personal?.dependents?.toString() || "0"],
      ["NI Number", clientData.personal?.ni_number || ""],
      [],
      ["ADDRESS"],
      ["Property Number", currentAddress?.property_number || ""],
      ["Street", currentAddress?.street || ""],
      ["City", currentAddress?.city || ""],
      ["Postcode", currentAddress?.postcode || ""],
      ["Date Moved In", currentAddress?.date_moved_in || ""],
      [],
      ["FINANCIAL ASSETS"],
      ["Bank Accounts", clientData.assets?.bank_accounts?.toString() || "0"],
      ["Property Value", clientData.assets?.property_value?.toString() || "0"],
      ["Investments", clientData.assets?.investments?.toString() || "0"],
      ["Pension Value", clientData.assets?.pension_value?.toString() || "0"],
      ["Other Assets", clientData.assets?.other_assets?.toString() || "0"],
      [],
      ["INCOME"],
      ["Income Type", primaryIncome?.income_type || ""],
      ["Monthly Net", primaryIncome?.monthly_net?.toString() || ""],
      ["Annual Gross", primaryIncome?.annual_gross?.toString() || ""],
      ["Employer/Business", primaryIncome?.employer_name || primaryIncome?.business_name || ""],
      [],
      ["CREDIT HISTORY"],
      ["Credit Score", clientData.credit?.credit_score?.toString() || ""],
      ["Has CCJs", clientData.credit?.has_ccjs ? "Yes" : "No"],
      ["CCJ Count", clientData.credit?.ccj_count?.toString() || "0"],
      ["Has Defaults", clientData.credit?.has_defaults ? "Yes" : "No"],
      ["Has Bankruptcy", clientData.credit?.has_bankruptcy ? "Yes" : "No"],
      ["Has IVA", clientData.credit?.has_iva ? "Yes" : "No"],
    ];

    // Convert to CSV string
    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma
            const stringCell = String(cell);
            if (stringCell.includes(",") || stringCell.includes('"') || stringCell.includes("\n")) {
              return `"${stringCell.replace(/"/g, '""')}"`;
            }
            return stringCell;
          })
          .join(",")
      )
      .join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `deal-${deal.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully");
  } catch (error) {
    console.error("Error generating CSV:", error);
    toast.error("Failed to generate CSV");
  }
};

export const useDealExport = () => {
  return {
    exportToPDF: generateDealPDF,
    exportToCSV: generateDealCSV,
  };
};
