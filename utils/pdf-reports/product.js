// utils/pdf-reports/productLadger.js

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
        
        .product-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        
        .product-detail {
          margin-bottom: 5px;
        }
        
        .summary-period {
          font-size: 12px;
          color: #666;
        }

        .product-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #0066cc;
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
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        
        .summary-item {
          margin-bottom: 10px;
          text-align: center;
          padding: 10px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        
        .summary-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .summary-value {
          font-size: 20px;
          font-weight: 600;
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
        
        .amount-column, .quantity-column {
          text-align: right;
        }
        
        .balance-column {
          text-align: right;
          font-weight: bold;
          color: #0066cc;
        }
        
        .transaction-type {
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .transaction-type.purchase {
          color: #2563eb;
        }
        
        .transaction-type.sale {
          color: #dc2626;
        }
        
        .transaction-type.return {
          color: #16a34a;
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
        
        .total-row td {
          font-weight: bold;
          border-top: 2px solid #000;
          background-color: #f5f5f5;
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

const generateProductInfoSection = (product) => {
  return `
      <div class="product-info">
        <div>
          <div class="product-name">${product.name || "Unknown Product"}</div>
          <div class="product-detail"><strong>Product Code:</strong> ${
            product.code || "N/A"
          }</div>
          <div class="product-detail"><strong>Unit:</strong> ${
            product.unit || "N/A"
          }</div>
        </div>
        <div>
          <div class="product-detail"><strong>Current Quantity:</strong> <span class="text-primary">${
            product.current_quantity || 0
          }</span></div>
          <div class="product-detail"><strong>Product ID:</strong> ${
            product._id || "N/A"
          }</div>
        </div>
      </div>
    `;
};

const generateSummarySection = (data) => {
  return `
      <div class="summary-box">
        <div class="summary-header">
          <div class="summary-title">Inventory Summary</div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Total Purchases</div>
            <div class="summary-value text-blue">${
              data.totals?.totalIn || 0
            }</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Sales</div>
            <div class="summary-value text-red">${
              data.totals?.totalOut || 0
            }</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Current Stock</div>
            <div class="summary-value text-primary">${
              data.product?.current_quantity || 0
            }</div>
          </div>
          ${
            data.totals?.totalProfitLoss
              ? `
          <div class="summary-item">
            <div class="summary-label">Total Profit/Loss</div>
            <div class="summary-value ${
              data.totals.totalProfitLoss >= 0 ? "text-green" : "text-red"
            }">PKR ${formatAmount(data.totals.totalProfitLoss)}</div>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
};

const generateTransactionsTableHTML = (data) => {
  if (!data.ledger || !Array.isArray(data.ledger) || data.ledger.length === 0) {
    return "<p>No transactions found</p>";
  }

  // Sort transactions by date (newest to oldest)
  const sortedTransactions = data.ledger;

  const tableRows = sortedTransactions
    .map((transaction) => {
      // Format transaction date with time
      const dateTime = transaction.date
        ? `${formatDate(transaction.date)}`
        : "";

      // Format transaction type with color
      const transactionTypeClass = transaction.type.toLowerCase();

      // Format invoice number
      const invoiceNumber = transaction.invoice_number || "N/A";

      return `
          <tr>
            <td>${dateTime}</td>
            <td>${invoiceNumber}</td>
            <td class="transaction-type ${transactionTypeClass}">${
        transaction.type
      }</td>
             <td class="amount-column">PKR ${formatAmount(
               transaction.price
             )}</td>
            <td class="quantity-column">${transaction.in || 0}</td>
            <td class="quantity-column">${transaction.out || 0}</td>
            <td class="balance-column">${transaction.remaining || 0}</td>
            <td class="balance-column">${transaction.profit_loss || 0}</td>
          </tr>
        `;
    })
    .join("");

  // Calculate totals
  const totalIn = data.totals?.totalIn || 0;
  const totalOut = data.totals?.totalOut || 0;

  return `
      <div class="transaction-history">
        <div class="history-header">
          <div class="history-title">Transaction History</div>
        </div>
        <table class="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice</th>
              <th>Type</th> 
              <th>Price</th>
              <th>In</th>
              <th>Out</th>
              <th>Remaining</th>
              <th>Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="5">Total:</td>
              <td class="quantity-column">${totalIn}</td>
              <td class="quantity-column">${totalOut}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
};

export const generateSingleProductLadgerReportHTML = (data, options) => {
  // Generate the product info section
  const productInfoSection = generateProductInfoSection(data.product);

  // Generate the summary section
  const summarySectionHTML = generateSummarySection(data);

  // Generate the transactions table HTML
  const transactionsTableHTML = generateTransactionsTableHTML(data);

  return `${getStyles()}
      <div class="report-container">
        <div class="report-header">
           <div class="report-title">Product Ledger Report</div>
        <div class="summary-period">
          ${data.date?.startDate} - ${data.date?.endDate} 
          </div>
        </div>
        
        ${productInfoSection}
        ${summarySectionHTML}
        ${transactionsTableHTML}
        
        <div class="footer">
          <div>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          <div>Total Transactions: ${data.ledger?.length || 0}</div>
        </div>
      </div>
    `;
};
