export const generateCompanyListReportHTML = (data, options) => {
  const companies = data || [];

  const formatAmount = (amount) =>
    amount != null ? Number(amount).toFixed(2) : "0.00";

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const getStyles = () => `
      <style>
        body {
          font-family: Arial, sans-serif;
        }
  
        .white-space {
          white-space: nowrap;
        }
  
        .report-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px;
        }
  
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
  
        .report-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
  
        .company-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 20px;
        }
  
        .company-table th, .company-table td {
          border: 1px solid #ddd;
          padding: 8px;
          vertical-align: top;
        }
  
        .company-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
  
        .badge {
          display: inline-block;
          padding: 2px 6px;
          font-size: 11px;
          border-radius: 4px;
          color: white;
          background-color: #999;
          margin-top: 2px;
        }
  
        .badge-credit {
          background-color: #0066cc;
        }
  
        .badge-cash {
          background-color: #28a745;
        }
  
        .badge-active {
          background-color: #007bff;
        }
  
        .badge-inactive {
          background-color: #6c757d;
        }
  
        .text-muted {
          color: #666;
          font-size: 11px;
        }
  
        .company-name {
          font-weight: bold;
          font-size: 13px;
        }
  
        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
      </style>
    `;

  const tableRows = companies
    .map((company, index) => {
      const account = company.account_details?.account || {};
      const address = company.address || {};
      const accountInfo = company.account_details || {};
      const creator = company.created_by || {};

      const accountTypeBadge =
        account?.type === "credit"
          ? `<span class="badge badge-credit">Credit</span>`
          : `<span class="badge badge-cash">Cash</span>`;

      const statusBadge =
        company.status === "active"
          ? `<span class="badge badge-active">Active</span>`
          : `<span class="badge badge-inactive">${
              company.status || "Inactive"
            }</span>`;

      return `
          <tr>
            <td>${index + 1}</td>
            <td>
              <div class="company-name">${company.name || "-"}</div>
              <div class="text-muted">Code: ${company.comp_code || "-"}</div>
              <div class="text-muted">Reg#: ${
                company.registration_no || "-"
              }</div>
              ${statusBadge}
            </td>
            <td>
              ${company.contact_no?.filter(Boolean).join(", ") || "-"}<br>
              <span class="text-muted">Email: ${
                company.email_address || "-"
              }</span><br>
              <span class="text-muted">Website: ${
                company.website || "-"
              }</span><br>
              <span class="text-muted">Insta: ${
                company.instagram?.filter(Boolean).join(", ") || "-"
              }</span>
            </td>
            <td>
              ${address.city || "-"}, ${address.province || "-"}, ${
        address.country || "-"
      }
            </td>
            <td>
              ${accountTypeBadge}<br>
              <span class="text-muted white-space">Limit: PKR ${formatAmount(
                account.amount
              )}</span><br>
              <span class="text-muted white-space">Used: PKR ${formatAmount(
                account.usedAmount
              )}</span><br>
              <span class="text-muted white-space">Balance: PKR ${formatAmount(
                account.balance - account.usedAmount
              )}</span>
            </td>
            <td>
              ${accountInfo.account_holder_name || "-"}<br>
              <span class="text-muted">Bank: ${
                accountInfo.bank_name || "-"
              }</span><br>
              <span class="text-muted">IBAN: ${
                accountInfo.iban || "-"
              }</span><br>
              <span class="text-muted">Branch: ${
                accountInfo.branch_address || "-"
              }</span><br>
              <span class="text-muted">Acc#: ${
                accountInfo.account_number || "-"
              }</span><br>
              <span class="text-muted">Expiry: ${formatDate(
                accountInfo.agreement_expiry_date
              )}</span>
            </td>
            <td>
              ${creator.name || "-"}<br>
              <span class="text-muted">${formatDate(company.createdAt)}</span>
            </td>
            <td>${company.total_products || 0}</td>
          </tr>
        `;
    })
    .join("");

  const reportHTML = `
      ${getStyles()}
      <div class="report-container">
        <div class="report-header">
          <div class="report-title">Company List Report</div>
          <div>${new Date().toLocaleDateString(
            "en-GB"
          )} ${new Date().toLocaleTimeString("en-GB")}</div>
        </div>
  
        <table class="company-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Account</th>
              <th>Bank Details</th>
              <th>Created By</th>
              <th>Products</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
  
        <div class="footer">
          <div>Total Companies: ${companies.length}</div>
          <div>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    `;

  return reportHTML;
};
