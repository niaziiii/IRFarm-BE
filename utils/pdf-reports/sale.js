// utils/pdf-reports/sale.js

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
          }
          
          .store-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .store-address {
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          
          .invoice-number {
            font-weight: bold;
          }
          
          .customer-details {
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 4px;
          }
          
          .sale-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .sale-table th, .sale-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          .sale-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          .amount {
            text-align: right;
          }
          
          .quantity {
            text-align: center;
          }
          
          .total-section {
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          
          .total-label {
            font-weight: bold;
          }
          
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            border-top: 2px solid #333;
            padding-top: 10px;
          }
          
          .payment-details {
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          
          .payment-type {
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .terms-conditions {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
        `;
};

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return "0.00";
  return Number(amount).toFixed(2);
};

const generateSaleItemsTableHTML = (saleData) => {
  if (!saleData.sale_items || !Array.isArray(saleData.sale_items)) {
    return "<p>No items found</p>";
  }

  return `
      <table class="sale-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Price</th>
            <th>Qty/Unit</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${saleData.sale_items
            .map(
              (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.product_id?.prod_name || "Unknown Product"}</td>
              <td class="amount">PKR ${formatAmount(item.sale_price)}</td>
              <td class="quantity">${item.quantity} PCS</td>
              <td class="amount">PKR ${formatAmount(
                item.sale_price * item.quantity
              )}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
};

const generateTotalsSection = (saleData) => {
  return `
      <div class="total-section">
        <div class="total-row">
          <span class="total-label">Total:</span>
          <span class="amount">PKR ${formatAmount(
            saleData.total_sale_value
          )}</span>
        </div>
        ${
          saleData.discount_value
            ? `
          <div class="total-row">
            <span class="total-label">Discount:</span>
            <span class="amount">PKR ${formatAmount(
              saleData.discount_value
            )}</span>
          </div>
        `
            : ""
        }
        ${
          saleData.shipping_charges
            ? `
          <div class="total-row">
            <span class="total-label">Shipping Charges:</span>
            <span class="amount">PKR ${formatAmount(
              saleData.shipping_charges
            )}</span>
          </div>
        `
            : ""
        }
        <div class="total-row grand-total">
          <span class="total-label">Grand Total:</span>
          <span class="amount">PKR ${formatAmount(saleData.grand_total)}</span>
        </div>
      </div>
    `;
};

const generatePaymentDetailsSection = (saleData) => {
  let paymentTypeText = "Cash";

  if (saleData.payment_type) {
    if (saleData.payment_type.type === "credit") {
      paymentTypeText = "Credit";
    } else if (saleData.payment_type.type === "split") {
      paymentTypeText = "Split Payment";
    }
  }

  return `
      <div class="payment-details">
        <div class="payment-type">Payment: ${paymentTypeText}</div>
        ${
          saleData.payment_type.type == "split"
            ? `
            <div class="total-row">
              <span class="total-label">Cash Amount:</span>
              <span class="amount">
                PKR ${formatAmount(saleData.payment_type.split.cash_amount)}
              </span>
            </div>
             <div class="total-row">
              <span class="total-label">Credit Amount:</span>
              <span class="amount">
                PKR ${formatAmount(saleData.payment_type.split.credit_amount)}
              </span>
            </div>
           `
            : ""
        }
        <div class="total-row">
          <span class="total-label">Payment:</span>
          <span class="amount">${
            saleData.payment_status === "paid"
              ? `PKR ${formatAmount(saleData.grand_total)}`
              : "PKR 0.00"
          }</span>
        </div>
        <div class="total-row">
          <span class="total-label">Balance:</span>
          <span class="amount">${
            saleData.payment_status === "paid"
              ? "PKR 0.00"
              : `PKR ${formatAmount(saleData.grand_total)}`
          }</span>
        </div>
        ${
          saleData.customer_account_details?.previous_balance
            ? `
          <div class="total-row">
            <span class="total-label">Previous Balance:</span>
            <span class="amount">PKR ${formatAmount(
              Math.abs(saleData.customer_account_details.previous_balance)
            )}</span>
          </div>
        `
            : ""
        }
        ${
          saleData.customer_account_details?.remaining_balance
            ? `
          <div class="total-row">
            <span class="total-label">Net Balance:</span>
            <span class="amount">PKR ${formatAmount(
              Math.abs(saleData.customer_account_details.remaining_balance)
            )}</span>
          </div>
        `
            : ""
        }
      </div>
    `;
};

export const generateSaleReportHTML = (data, options) => {
  // Extract the sale data from the provided data object
  const saleData = data.data || data;

  // Generate the sale items table HTML
  const saleItemsTableHTML = generateSaleItemsTableHTML(saleData);

  // Generate the totals section HTML
  const totalsSectionHTML = generateTotalsSection(saleData);

  // Generate the payment details section HTML
  const paymentDetailsSectionHTML = generatePaymentDetailsSection(saleData);

  return `${getStyles()}
      <div class="report-container">
        <div class="report-header">
          <div class="store-name">Sale Report</div>
         </div>
        
        <div class="invoice-details">
          <div>
            <div class="invoice-number">Invoice # ${
              saleData.sale_number || ""
            }</div>
            <div>Date: ${formatDate(saleData.date)} ${formatTime(
    saleData.date
  )}</div>
            <div>Sales Person: ${saleData.added_by?.name || "Admin"}</div>
          </div>
          <div>
            <div>${
              saleData.sale_type === "sale" ? "Credit Sale" : saleData.sale_type
            }</div>
          </div>
        </div>
        
        <div class="customer-details">
          <div>${saleData.customer_info?.name || "Walk-in Customer"}</div>
          ${
            saleData.customer_info?.contact_no
              ? `<div>Contact: ${saleData.customer_info.contact_no}</div>`
              : ""
          }
          ${
            saleData.customer_info?.cnic
              ? `<div>CNIC: ${saleData.customer_info.cnic}</div>`
              : ""
          }
        </div>
        
        ${saleItemsTableHTML}
        ${totalsSectionHTML}
        ${paymentDetailsSectionHTML}
        
        <div class="terms-conditions">
          <p>Terms & Conditions: Terms and Conditions according to company rules * As per company own policy</p>
        </div>
      </div>
    `;
};
