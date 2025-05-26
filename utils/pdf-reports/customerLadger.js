// utils/pdf-reports/customerLadger.js

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
        
        .customer-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .customer-detail {
          margin-bottom: 5px;
        }
        
        .summary-box {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .summary-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
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
        
        .summary-value {
          font-size: 15px;
          font-weight: 500;
        }
        
        .summary-value.primary {
          color: #0066cc;
        }
        
        .summary-value.positive {
          color: #28a745;
        }
        
        .summary-value.negative {
          color: #dc3545;
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
        }
        
        .amount-column {
          text-align: right;
        }
        
        .balance-column {
          text-align: right;
          font-weight: bold;
          color: #0066cc;
        }
        
        .total-row td {
          font-weight: bold;
          border-top: 2px solid #000;
          background-color: #f5f5f5;
        }
        
        .ledger-balance {
          text-align: right;
          font-weight: bold;
          margin-top: 10px;
          border-top: 2px solid #000;
          padding-top: 10px;
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

const generateSummarySection = (data) => {
  const creditLimit = data.summary?.credit_limit || 0;
  const usedAmount = data.summary?.used_amount || 0;
  const balance = (data.summary?.balance || 0) - data.summary?.used_amount;
  const availableCredit = creditLimit - usedAmount;

  return `
      <div class="summary-box">
        <div class="summary-title">Account Summary</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Cash Used</div>
            <div class="summary-value">PKR ${formatAmount(
              data.summary?.total_cash_used || 0
            )}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Credit Used</div>
            <div class="summary-value negative">PKR ${formatAmount(
              data.summary?.total_credit_used || 0
            )}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Credit Limit</div>
            <div class="summary-value">PKR ${formatAmount(creditLimit)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Current Balance</div>
            <div class="summary-value primary">PKR ${formatAmount(
              balance
            )}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Available Credit</div>
            <div class="summary-value positive">PKR ${formatAmount(
              availableCredit
            )}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Transactions</div>
            <div class="summary-value">${data.transactions?.length || 0}</div>
          </div>
        </div>
      </div>
    `;
};

const generateTransactionsTableHTML = (data) => {
  if (
    !data.transactions ||
    !Array.isArray(data.transactions) ||
    data.transactions.length === 0
  ) {
    return "<p>No transactions found</p>";
  }

  // Sort transactions by date (newest to oldest)
  const sortedTransactions = [...data.transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const tableRows = sortedTransactions
    .map((transaction) => {
      // Format transaction date with time
      const dateTime = transaction.date
        ? `${formatDate(transaction.date)} ${formatTime(transaction.date)}`
        : "";

      // Format transaction narrative
      let narration = "";
      if (transaction.transaction_type === "sale") {
        const saleNumber =
          transaction.sale_id?.sale_number?.split("-").pop() || "";
        if (transaction.payment_type === "credit") {
          narration = `Invoice# ${saleNumber} - Bill<br><span style="font-size:11px">Desc: credit purchase</span>`;
        } else if (transaction.payment_type === "split") {
          narration = `Invoice# ${saleNumber} - Bill<br><span style="font-size:11px">Desc: split payment</span>`;
        } else {
          narration = `Invoice# ${saleNumber} - Bill<br><span style="font-size:11px">Desc: cash payment</span>`;
        }
      } else {
        narration = `${
          transaction.transaction_type || "Transaction"
        }<br><span style="font-size:11px">Desc: ${
          transaction.note || ""
        }</span>`;
      }

      // Determine cash/credit amounts based on payment type
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
        // For regular payments, use the original logic
        cashAmount =
          transaction.payment_type === "cash"
            ? Math.abs(transaction.amount)
            : 0;
        creditAmount =
          transaction.payment_type === "credit"
            ? Math.abs(transaction.amount)
            : 0;
      }

      // Format balance
      const balance = formatAmount(transaction.remaining_balance);

      return `
        <tr>
          <td>${transaction.added_by?.name || "Admin"}</td>
          <td>${dateTime}</td>
          <td>${narration}</td>
          <td class="amount-column">${
            cashAmount > 0 ? `PKR ${formatAmount(cashAmount)}` : "-"
          }</td>
          <td class="amount-column">${
            creditAmount > 0 ? `PKR ${formatAmount(creditAmount)}` : "-"
          }</td>
          <td class="balance-column">PKR ${balance}</td>
        </tr>
      `;
    })
    .join("");

  // Calculate totals
  const totalCash = data.summary?.total_cash_used || 0;
  const totalCredit = data.summary?.total_credit_used || 0;

  return `
      <table class="ledger-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Date</th>
            <th>Narration</th>
            <th>Cash</th>
            <th>Credit</th>
            <th>Balance</th>
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
    `;
};

export const generateCustomerLadgerReportHTML = (data, options) => {
  // Extract customer and transaction data
  const customerData = data.customer || {};
  const summaryData = data.summary || {};
  const date = data.date;

  let startDate = date.startDate;
  let endDate = date.endDate;

  // Generate the summary section HTML
  const summarySectionHTML = generateSummarySection(data);

  // Generate the transactions table HTML
  const transactionsTableHTML = generateTransactionsTableHTML(data);

  // Customer code - use the last 8 characters of the customer ID
  const customerCode = customerData._id
    ? customerData._id.substring(customerData._id.length - 8)
    : "N/A";

  return `${getStyles()}
      <div class="report-container">
        <div class="report-header"> 
          <div class="report-title">Ledger Report</div>
          <div class="date-range">${startDate} - ${endDate}</div>
        </div>
        
        <div class="customer-info">
          <div>
            <div class="customer-detail">Code: ${customerCode}</div>
            <div class="customer-detail">Title: ${
              customerData.name || "N/A"
            }</div>
            <div class="customer-detail">Head: ${
              customerData.reference || "General Customer"
            }</div>
          </div> 
        </div>
        
        ${summarySectionHTML}
        ${transactionsTableHTML} 
      </div>
    `;
};
