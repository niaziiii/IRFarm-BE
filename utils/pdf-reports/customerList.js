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

      .white-space{
      white-space:nowrap;
      }
      .report-container {
        max-width: 1000px;
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

      .customer-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        margin-top: 20px;
      }

      .customer-table th, .customer-table td {
        border: 1px solid #ddd;
        padding: 8px;
        vertical-align: top;
      }

      .customer-table th {
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
        font-size: 12px;
      }

      .footer {
        margin-top: 30px;
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #666;
      }

      .customer-name {
        font-weight: bold;
        font-size: 14px;
      }
    </style>
  `;

export const generateCustomerListReportHTML = (data, options) => {
  const customers = data || [];

  const tableRows = customers
    .map((customer, index) => {
      const account = customer.account || {};
      const address = customer.address || {};

      const customerCode = customer._id ? customer._id.slice(-8) : "-";

      const accountTypeBadge =
        account?.type === "credit"
          ? `<span class="badge badge-credit">Credit</span>`
          : `<span class="badge badge-cash">Cash</span>`;

      return `
          <tr>
            <td>${index + 1}</td>
            <td>
              <div class="customer-name">${customer.name || "-"}</div>
              <div class="text-muted">Code: ${customerCode}</div>
              <div class="text-muted">CNIC: ${customer.cnic || "-"}</div>
              <div class="text-muted">Contact: ${
                customer.contact_no || "-"
              }</div>
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
              ${customer.reference || "-"}<br>
              <span class="text-muted">${customer.description || ""}</span>
            </td>
            <td>
              ${address.city || "-"}, ${address.province || "-"}, ${
        address.country || "-"
      }
            </td>
          </tr>
        `;
    })
    .join("");

  const reportHTML = `
      ${getStyles()}
      <div class="report-container">
        <div class="report-header">
          <div class="report-title">Customer List Report</div>
          <div>${new Date().toLocaleDateString(
            "en-GB"
          )} ${new Date().toLocaleTimeString("en-GB")}</div>
        </div>
  
        <table class="customer-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Info</th>
              <th>Account</th> 
              <th>Reference / Description</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
  
        <div class="footer">
          <div>Total Customers: ${customers.length}</div>
          <div>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    `;

  return reportHTML;
};
