const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return "0.00";
  return Number(amount)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getStyles = () => {
  return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .report-container {
          font-family: Arial, sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 3px solid #000;
        }
        
        .store-name {
          font-size: 26px;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        
        .report-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .report-date-range {
          font-size: 14px;
          color: #555;
          margin-top: 8px;
        }
        
        .report-sections {
          display: grid;
          gap: 20px;
        }
        
        .section-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .section-full {
          grid-column: 1 / -1;
        }
        
        .section-box {
          border: 2px solid #333;
          border-radius: 0;
          overflow: hidden;
          background: #fff;
        }
        
        .section-header {
          background-color: #d9d9d9;
          padding: 10px 15px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          border-bottom: 2px solid #333;
        }
        
        .section-content {
          padding: 15px;
        }
        
        .detail-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .detail-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #ddd;
          font-size: 14px;
        }
        
        .detail-table tr:last-child td {
          border-bottom: none;
        }
        
        .detail-label {
          font-weight: 500;
          color: #333;
          width: 60%;
        }
        
        .detail-value {
          text-align: right;
          font-weight: bold;
          color: #000;
        }
        
        .total-row {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .total-row td {
          padding: 10px !important;
          border-top: 2px solid #333;
          border-bottom: 2px solid #333;
          font-size: 15px;
        }
        
        .profit-positive {
          color: #16a34a;
        }
        
        .profit-negative {
          color: #dc2626;
        }
        
        .profit-margin {
          font-size: 12px;
          color: #666;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .summary-card {
          background: #f8f8f8;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          text-align: center;
        }
        
        .summary-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .summary-value {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }
        
        @media print {
          .report-container {
            padding: 10px;
          }
          
          .section-box {
            break-inside: avoid;
          }
        }
      </style>
    `;
};

const generateSummaryCards = (data) => {
  return `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total Revenue</div>
          <div class="summary-value profit-positive">PKR ${formatAmount(
            data?.revenue?.total
          )}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Costs</div>
          <div class="summary-value profit-negative">PKR ${formatAmount(
            data?.costs?.total
          )}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Net Profit/Loss</div>
          <div class="summary-value ${
            data?.profitAnalysis?.netProfit < 0
              ? "profit-negative"
              : "profit-positive"
          }">
            PKR ${formatAmount(Math.abs(data?.profitAnalysis?.netProfit))}
          </div>
        </div>
      </div>
    `;
};

const generateRevenueSection = (data) => {
  const hasRevenue =
    data?.revenue &&
    (data?.revenue?.total > 0 ||
      data?.revenue?.cash > 0 ||
      data?.revenue?.credit > 0);

  if (!hasRevenue) return "";

  return `
      <div class="section-box">
        <div class="section-header">Revenue Breakdown</div>
        <div class="section-content">
          <table class="detail-table">
            <tr>
              <td class="detail-label">Cash Sales</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.revenue?.cash
              )}</td>
            </tr>
            <tr>
              <td class="detail-label">Credit Sales</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.revenue?.credit
              )}</td>
            </tr>
            ${
              data?.shippingCharges?.breakdown?.fromSales > 0
                ? `
            <tr>
              <td class="detail-label">Shipping Charges</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.shippingCharges?.breakdown?.fromSales
              )}</td>
            </tr>`
                : ""
            }
            ${
              data?.discounts?.total > 0
                ? `
            <tr>
              <td class="detail-label">Less: Discounts</td>
              <td class="detail-value profit-negative">-PKR ${formatAmount(
                data?.discounts?.total
              )}</td>
            </tr>`
                : ""
            }
            <tr class="total-row">
              <td class="detail-label">Total Revenue</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.revenue?.total
              )}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
};

const generateCostsSection = (data) => {
  const hasCosts = data?.costs && data?.costs?.total > 0;

  if (!hasCosts) return "";

  return `
      <div class="section-box">
        <div class="section-header">Costs Breakdown</div>
        <div class="section-content">
          <table class="detail-table">
            ${
              data?.costs?.breakdown?.purchases?.total > 0
                ? `
            <tr>
              <td class="detail-label">Purchase Costs</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.costs?.breakdown?.purchases?.total
              )}</td>
            </tr>`
                : ""
            }
            ${
              data?.costs?.breakdown?.purchases?.cash > 0 ||
              data?.costs?.breakdown?.purchases?.credit > 0
                ? `
            <tr>
              <td class="detail-label sub-detail">• Cash Purchases</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.costs?.breakdown?.purchases?.cash
              )}</td>
            </tr>
            <tr>
              <td class="detail-label sub-detail">• Credit Purchases</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.costs?.breakdown?.purchases?.credit
              )}</td>
            </tr>`
                : ""
            }
            ${
              data?.shippingCharges?.breakdown?.fromPurchases > 0
                ? `
            <tr>
              <td class="detail-label">Purchase Shipping</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.shippingCharges?.breakdown?.fromPurchases
              )}</td>
            </tr>`
                : ""
            }
            ${
              data?.costs?.breakdown?.expenses?.total > 0
                ? `
            <tr>
              <td class="detail-label">Operating Expenses</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.costs?.breakdown?.expenses?.total
              )}</td>
            </tr>`
                : ""
            }
            ${
              data?.costs?.breakdown?.expenses?.cash > 0 ||
              data?.costs?.breakdown?.expenses?.credit > 0
                ? `
            <tr>
              <td class="detail-label sub-detail">• Cash Expenses</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.costs?.breakdown?.expenses?.cash
              )}</td>
            </tr>
            <tr>
              <td class="detail-label sub-detail">• Credit Expenses</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.costs?.breakdown?.expenses?.credit
              )}</td>
            </tr>`
                : ""
            }
            <tr class="total-row">
              <td class="detail-label">Total Costs</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.costs?.total
              )}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
};

const generateProfitAnalysisSection = (data) => {
  if (!data?.profitAnalysis) return "";

  return `
      <div class="section-box section-full">
        <div class="section-header">Profit & Loss Analysis</div>
        <div class="section-content">
          <table class="detail-table">
            <tr>
              <td class="detail-label">Gross Revenue</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.profitAnalysis?.grossRevenue
              )}</td>
            </tr>
            <tr>
              <td class="detail-label">Net Revenue</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.profitAnalysis?.netRevenue
              )}</td>
            </tr>
            <tr>
              <td class="detail-label">Gross Profit/Loss</td>
              <td class="detail-value ${
                data?.profitAnalysis?.grossProfit < 0
                  ? "profit-negative"
                  : "profit-positive"
              }">
                PKR ${formatAmount(Math.abs(data?.profitAnalysis?.grossProfit))}
              </td>
            </tr>
            <tr class="total-row">
              <td class="detail-label">
                Net Profit/Loss
                <span class="profit-margin">(Margin: ${
                  data?.profitAnalysis?.profitMargin
                }%)</span>
              </td>
              <td class="detail-value ${
                data?.profitAnalysis?.netProfit < 0
                  ? "profit-negative"
                  : "profit-positive"
              }">
                PKR ${formatAmount(Math.abs(data?.profitAnalysis?.netProfit))}
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;
};

const generateShippingSection = (data) => {
  if (!data?.shippingCharges || data?.shippingCharges?.total === 0) return "";

  return `
      <div class="section-box">
        <div class="section-header">Shipping Charges</div>
        <div class="section-content">
          <table class="detail-table">
            ${
              data?.shippingCharges?.breakdown?.fromSales > 0
                ? `
            <tr>
              <td class="detail-label">From Sales</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.shippingCharges?.breakdown?.fromSales
              )}</td>
            </tr>`
                : ""
            }
            ${
              data?.shippingCharges?.breakdown?.fromPurchases > 0
                ? `
            <tr>
              <td class="detail-label">From Purchases</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.shippingCharges?.breakdown?.fromPurchases
              )}</td>
            </tr>`
                : ""
            }
            <tr class="total-row">
              <td class="detail-label">Total Shipping</td>
              <td class="detail-value">PKR ${formatAmount(
                data?.shippingCharges?.total
              )}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
};

const generateTransactionSummary = (data) => {
  const purchaseTransactions = data?.costs?.breakdown?.purchases?.transactions;

  if (!purchaseTransactions) return "";

  return `
      <div class="section-box">
        <div class="section-header">Transaction Summary</div>
        <div class="section-content">
          <table class="detail-table">
            <tr>
              <td class="detail-label">Purchase Transactions</td>
              <td class="detail-value">${purchaseTransactions}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
};

export const generateFinancialOverviewReportHTML = (data, options) => {
  const dateRange = data?.date
    ? `${data?.date?.startDate} - ${data?.date?.endDate}`
    : "All Time";

  // Generate sections based on available data
  const revenueSection = generateRevenueSection(data);
  const costsSection = generateCostsSection(data);
  const shippingSection = generateShippingSection(data);
  const transactionSection = generateTransactionSummary(data);
  const profitAnalysisSection = generateProfitAnalysisSection(data);
  const summaryCards = generateSummaryCards(data);

  // Determine if we need a two-column layout
  const hasMultipleSmallSections =
    [revenueSection, costsSection, shippingSection, transactionSection].filter(
      (section) => section !== ""
    ).length >= 2;

  return `${getStyles()}
      <div class="report-container">
        <div class="report-header">
          <div class="report-title">Financial Overview Report</div>
          <div class="report-date-range">${dateRange}</div>
        </div>
        
        ${summaryCards}
        
        <div class="report-sections">
          ${
            hasMultipleSmallSections
              ? `
          <div class="section-row">
            ${revenueSection}
            ${costsSection}
          </div>
          ${
            shippingSection || transactionSection
              ? `
          <div class="section-row">
            ${shippingSection}
            ${transactionSection}
          </div>`
              : ""
          }
          `
              : `
            ${revenueSection}
            ${costsSection}
            ${shippingSection}
            ${transactionSection}
          `
          }
          
          ${profitAnalysisSection}
        </div>
        
        <div class="footer">
          <div>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          <div>Financial Overview Report</div>
        </div>
      </div>
    `;
};
