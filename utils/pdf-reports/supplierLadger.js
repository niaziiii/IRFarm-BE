// utils/pdf-reports/supplierLadger.js

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB");
};

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStyles = () => {
  return `
      <style>
        .report-container {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        
        .store-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        
        .report-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .date-range {
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        .supplier-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .supplier-detail {
          margin-bottom: 5px;
        }
        
        .summary-box {
          background-color: #ffffff;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        
        .summary-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        
        .summary-period {
          font-size: 12px;
          color: #666;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        
        .summary-item {
          margin-bottom: 10px;
        }
        
        .summary-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 3px;
        }
        
       .ledger-table .narration-column {
          width: 300px;
        }

        .summary-value {
          font-size: 16px;
          font-weight: 500;
        }
        
        .text-blue {
          color: #2563eb;
        }
        
        .text-red {
          color: #dc2626;
        }
        
        .text-green {
          color: #16a34a;
        }
        
        .text-primary {
          color: #0066cc;
        }
        
        .text-gray {
          color: #111827;
        }
        
        .ledger-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 13px;
        }
        
        .ledger-table th, .ledger-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .ledger-table th {
          background-color: #f5f5f5;
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
        }
        
        .amount-column {
          text-align: right;
        }
        
        .balance-column {
          text-align: right;
          font-weight: bold;
          color: #0066cc;
        }
        
        .narration-column {
          max-width: 300px;
        }
        
        .narration-title {
          font-weight: 500;
          margin-bottom: 3px;
        }
        
        .narration-desc {
          font-size: 11px;
          color: #666;
        }
        
        .total-row td {
          font-weight: bold;
          border-top: 2px solid #000;
          background-color: #f5f5f5;
        }
        
        .transaction-history {
          margin-top: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
          overflow: hidden;
        }
        
        .history-header {
          padding: 16px;
          background-color: #fff;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .history-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
      </style>
    `;
};

const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return "0.00";
  return Number(amount).toFixed(2);
};

const generateTransactionsTableHTML = (data) => {
  if (
    !data.transactions ||
    !Array.isArray(data.transactions) ||
    data.transactions.length === 0
  ) {
    return "<p>No transactions found</p>";
  }

  // Sort transactions by date (newest to oldest) just like in CompanyHistory
  const sortedTransactions = [...data.transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const tableRows = sortedTransactions
    .map((transaction) => {
      // Format transaction date with time exactly as in CompanyHistory
      const dateTime = transaction.date
        ? `${formatDate(transaction.date)} ${formatTime(transaction.date)}`
        : "";

      const purchasedProducts = transaction.purchase_id?.order_items || [];

      let narrationHTML = "";
      // Render sale items if available
      if (transaction.purchase_id?.order_items?.length > 0) {
        narrationHTML = `
    <div style="font-size:11px;">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="border-bottom:1px solid #ddd;">Product</th>
            <th style="border-bottom:1px solid #ddd; text-align:right;">Qty</th>
            <th style="border-bottom:1px solid #ddd; text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${transaction.purchase_id?.order_items
            .map((item) => {
              return `
                <tr>
                  <td>${item.product_id?.prod_name || "-"}</td>
                  <td style="text-align:right;">${item.quantity}</td>
                  <td style="text-align:right;">${formatAmount(
                    item.purchase_price
                  )}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
      } else {
        narrationHTML = `<div style="font-size:11px;">No Sale Items</div>`;
      }

      // Format transaction narrative exactly matching CompanyHistory logic
      let narrationTitle = "";
      if (transaction.transaction_type === "purchase") {
        const purchaseNumber =
          transaction.purchase_id?.purchase_number?.split("-")?.pop() || "";
        narrationTitle = `Purchase# ${purchaseNumber} - Bill`;
      } else if (transaction.transaction_type === "return") {
        narrationTitle = "Return";
      } else if (transaction.transaction_type === "Balance-Added") {
        narrationTitle = "Payment Made";
      } else if (transaction.transaction_type === "Balance-Excluding") {
        narrationTitle = "Balance Excluded";
      } else {
        narrationTitle = transaction.transaction_type.replace(/-/g, " ");
      }

      let narrationDesc = "";
      if (transaction.payment_type === "credit") {
        narrationDesc = "credit purchase";
      } else if (transaction.payment_type === "cash") {
        narrationDesc = "cash payment";
      } else if (transaction.payment_type === "split") {
        narrationDesc = "split payment";
      } else {
        narrationDesc = transaction.payment_type?.replace(/-/g, " ") || "";
      }

      // Determine cash/credit amounts based on payment type exactly as in CompanyHistory
      let cashAmount = 0;
      let creditAmount = 0;

      if (transaction.payment_type === "split") {
        // For split payments, use the specific amounts stored in the transaction
        cashAmount = transaction.cash_amount
          ? Math.abs(transaction.cash_amount)
          : 0;
        creditAmount = transaction.credit_amount
          ? Math.abs(transaction.credit_amount)
          : 0;
      } else {
        // For regular payments
        cashAmount =
          transaction.payment_type === "cash"
            ? Math.abs(transaction.amount)
            : 0;
        creditAmount =
          transaction.payment_type === "credit"
            ? Math.abs(transaction.amount)
            : 0;
      }

      return `
          <tr>
            <td>${transaction.added_by?.name || ""}</td>
            <td>${dateTime}</td>
            <td class="amount-column">${
              cashAmount > 0 ? `PKR ${formatAmount(cashAmount)}` : "-"
            }</td>
            <td class="amount-column">${
              creditAmount > 0 ? `PKR ${formatAmount(creditAmount)}` : "-"
            }</td>
            <td class="balance-column">PKR ${formatAmount(
              transaction.remaining_balance
            )}</td>
            <td class="narration-column">${narrationHTML}</td>
          </tr>
        `;
    })
    .join("");

  // Calculate totals exactly as in CompanyHistory
  const totalCash = data.summary?.total_cash_used || 0;
  const totalCredit = data.summary?.total_credit_used || 0;

  return `
      <div class="transaction-history">
        <div class="history-header">
          <div class="history-title">Transaction History</div>
        </div>
        <table class="ledger-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Date</th>
              <th>Cash</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>Narration</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="3">Total:</td>
              <td class="amount-column">PKR ${formatAmount(totalCash)}</td>
              <td class="amount-column">PKR ${formatAmount(totalCredit)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
};

export const generateSupplierLadgerReportHTML = (data, options) => {
  // Extract supplier data from the transformed data
  const supplierData = data.company || {};

  // Get the date range from the data
  const dateFilter = data.date || { startDate: "", endDate: "" };

  // Generate the transactions table HTML
  const transactionsTableHTML = generateTransactionsTableHTML(data);

  // Supplier code - use the first 8 characters of the supplier ID as in CompanyHistory
  const supplierCode = supplierData._id
    ? supplierData._id.substring(0, 8)
    : "N/A";

  return `${getStyles()}
      <div class="report-container">
        <div class="report-header">
          <div class="report-title">Supplier Ledger Report</div>
          <div class="summary-period">
          ${dateFilter.startDate} - ${dateFilter.endDate} 
          </div>
        </div>
        
        <div class="supplier-info">
          <div>
            <div class="supplier-detail"><strong>Supplier Code:</strong> ${supplierCode}</div>
            <div class="supplier-detail"><strong>Name:</strong> ${
              supplierData.name || "N/A"
            }</div>
            ${
              supplierData.contact_no && supplierData.contact_no.length > 0
                ? `<div class="supplier-detail"><strong>Contact:</strong> ${
                    supplierData.contact_no[0] || ""
                  }</div>`
                : ""
            }
          </div>
          <div>
            ${
              supplierData.registration_no
                ? `<div class="supplier-detail"><strong>Registration No:</strong> ${supplierData.registration_no}</div>`
                : ""
            }
            ${
              supplierData.email_address
                ? `<div class="supplier-detail"><strong>Email:</strong> ${supplierData.email_address}</div>`
                : ""
            }
            ${
              supplierData.address?.city
                ? `<div class="supplier-detail"><strong>City:</strong> ${supplierData.address.city}</div>`
                : ""
            }
          </div>
        </div>
        
        ${transactionsTableHTML}
        
        <div class="footer">
          <div>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          <div>Total Transactions: ${data.transactions?.length || 0}</div>
        </div>
      </div>
    `;
};
