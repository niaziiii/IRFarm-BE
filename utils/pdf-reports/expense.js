const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB");
};

const getStyles = () => {
  return `
      <style>
      .report-title {
          text-align: center;
          font-size: 20px;
          margin-bottom: 10px;
          color: #333;
        }
        
        .date-range {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-bottom: 30px;
        }
        
        .expense-section {
          margin-bottom: 40px;
        }
        
        .expense-section h3 {
          background-color: #f5f5f5;
          padding: 10px;
          border: 1px solid #ddd;
          font-size: 16px;
        //   margin-bottom: 10px;
        }
        
        .expense-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 12px;
        }
        
        .expense-table th, .expense-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .expense-table th {
          background-color: #f9f9f9;
          font-weight: bold;
        }
        
        .amount {
          text-align: right;
        }
        
        .total-row {
          background-color: #f9f9f9;
          font-weight: bold;
        }
        
        .payment-method {
          text-align: center;
        }
        
        .payment-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          color: white;
        }
        
        .payment-badge.cash {
          background-color: #28a745;
        }
        
        .payment-badge.credit {
          background-color: #007bff;
        }
        
        .payment-badge.debit {
          background-color: #17a2b8;
        }
        
        .payment-badge.bank {
          background-color: #6c757d;
        }
        
        .grand-total-section {
          margin-top: 40px;
          border-top: 2px solid #333;
          padding-top: 20px;
        }
        
        .summary-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-label {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 5px;
        }
        
        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        
        .grand-total .stat-value {
          color: #28a745;
          font-size: 24px;
        }
      </style>
      `;
};
const formatDateRange = (data) => {
  if (data.dateRange) {
    const { startDate, endDate } = data.dateRange;
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  // If no date range provided, find min and max dates from expenses
  if (data.expenses && data.expenses.length > 0) {
    let allDates = [];
    data.expenses.forEach((expense) => {
      expense.items.forEach((item) => {
        if (item.date) allDates.push(new Date(item.date));
      });
    });

    if (allDates.length > 0) {
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));
      return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
    }
  }

  return `Generated on ${new Date().toLocaleDateString("en-GB")}`;
};
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return "0.00";
  return Number(amount).toFixed(2);
};

const formatPaymentMethod = (method) => {
  if (!method) return "N/A";
  return method.charAt(0).toUpperCase() + method.slice(1);
};
const generateExpenseTableHTML = (data) => {
  let tablesHTML = "";

  if (data.expenses && Array.isArray(data.expenses)) {
    data.expenses.forEach((expenseGroup) => {
      tablesHTML += `
          <div class="expense-section">
            <h3>Expense: ${expenseGroup.name || "General"}</h3>
            <table class="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Created By</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${expenseGroup.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${formatDate(item.date)}</td>
                    <td class="payment-method">
                    <span class="payment-badge ${
                      item.paymentMethod
                    }">${formatPaymentMethod(item.paymentMethod)}</span>
                    </td>
                    <td>${item.createdBy || ""}</td>
                    <td class="amount">PKR ${formatAmount(item.amount)}</td>
                    <td>${item.description || "No description"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="4"><strong>Total:</strong></td>
                  <td class="amount"><strong>PKR ${formatAmount(
                    expenseGroup.total
                  )}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
    });
  }

  return tablesHTML;
};

export const generateExpenseReportHTML = (data, options) => {
  const expenseTableHTML = generateExpenseTableHTML(data);

  return ` ${getStyles()}
        <h2 class="report-title">${options.title || "Expenses Report"}</h2>
        <div class="date-range">${formatDateRange(data)}</div>
            ${expenseTableHTML}
            <div class="grand-total-section">
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Entries:</span>
                  <span class="stat-value">${data.totalCount || 0}</span>
                </div>
                <div class="stat-item grand-total">
                  <span class="stat-label">Grand Total:</span>
                  <span class="stat-value">PKR ${formatAmount(
                    data.grandTotal
                  )}</span>
                </div>
              </div>
            </div>
    `;
};
