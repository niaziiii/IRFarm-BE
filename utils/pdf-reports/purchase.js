// utils/pdf-reports/purchase.js

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
            
            .purchase-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
            }
            
            .purchase-number {
              font-weight: bold;
            }
            
            .supplier-details {
              border: 1px solid #ddd;
              padding: 10px;
              margin-bottom: 20px;
              border-radius: 4px;
            }
            
            .purchase-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            .purchase-table th, .purchase-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            .purchase-table th {
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
            
            .status-badge {
              padding: 3px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
              text-transform: uppercase;
              color: white;
            }
            
            .status-badge.received {
              background-color: #28a745;
            }
            
            .status-badge.pending {
              background-color: #ffc107;
              color: #333;
            }
            
            .status-badge.cancelled {
              background-color: #dc3545;
            }
            
            .batch-details {
              margin-top: 20px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            
            .batch-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 12px;
            }
            
            .batch-table th, .batch-table td {
              border: 1px solid #ddd;
              padding: 6px;
              text-align: left;
            }
            
            .batch-table th {
              background-color: #f9f9f9;
              font-weight: bold;
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

const formatOrderStatus = (status) => {
  if (!status) return "pending";
  return status.toLowerCase();
};

const generatePurchaseItemsTableHTML = (purchaseData) => {
  if (!purchaseData.order_items || !Array.isArray(purchaseData.order_items)) {
    return "<p>No items found</p>";
  }

  return `
        <table class="purchase-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Batch Number</th>
              <th>Purchase Price</th>
              <th>Qty/Unit</th>
              <th>Amount</th>
              <th>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            ${purchaseData.order_items
              .map(
                (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.product_id?.prod_name || "Unknown Product"}</td>
                <td>${item.batch_number || "N/A"}</td>
                <td class="amount">PKR ${formatAmount(item.purchase_price)}</td>
                <td class="quantity">${item.quantity} ${
                  item.product_id?.unit_profile?.unit?.name || "PCS"
                }</td>
                <td class="amount">PKR ${formatAmount(
                  item.purchase_price * item.quantity
                )}</td>
                <td>${formatDate(item.expiry_date)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
};

const generateTotalsSection = (purchaseData) => {
  return `
        <div class="total-section">
          <div class="total-row">
            <span class="total-label">Total Purchase Value:</span>
            <span class="amount">PKR ${formatAmount(
              purchaseData.total_purchase_value
            )}</span>
          </div>
          ${
            purchaseData.discount_value
              ? `
            <div class="total-row">
              <span class="total-label">Discount:</span>
              <span class="amount">PKR ${formatAmount(
                purchaseData.discount_value
              )}</span>
            </div>
          `
              : ""
          }
          ${
            purchaseData.shipping_charges
              ? `
            <div class="total-row">
              <span class="total-label">Shipping Charges:</span>
              <span class="amount">PKR ${formatAmount(
                purchaseData.shipping_charges
              )}</span>
            </div>
          `
              : ""
          }
          <div class="total-row grand-total">
            <span class="total-label">Grand Total:</span>
            <span class="amount">PKR ${formatAmount(
              purchaseData.grand_total
            )}</span>
          </div>
        </div>
      `;
};

const generatePaymentDetailsSection = (purchaseData) => {
  let paymentTypeText = "Cash";

  if (purchaseData.payment_type) {
    if (purchaseData.payment_type.type === "credit") {
      paymentTypeText = "Credit";
    } else if (purchaseData.payment_type.type === "split") {
      paymentTypeText = "Split Payment";
    }
  }

  return `
        <div class="payment-details">
          <div class="payment-type">Payment: ${paymentTypeText}</div>
          ${
            purchaseData.payment_type?.type === "split"
              ? `
              <div class="total-row">
                <span class="total-label">Cash Amount:</span>
                <span class="amount">
                  PKR ${formatAmount(
                    purchaseData.payment_type.split?.cash_amount
                  )}
                </span>
              </div>
               <div class="total-row">
                <span class="total-label">Credit Amount:</span>
                <span class="amount">
                  PKR ${formatAmount(
                    purchaseData.payment_type.split?.credit_amount
                  )}
                </span>
              </div>
             `
              : ""
          }
          ${
            purchaseData.supplier_account_details?.previous_balance
              ? `
            <div class="total-row">
              <span class="total-label">Previous Balance:</span>
              <span class="amount">PKR ${formatAmount(
                purchaseData.supplier_account_details.previous_balance
              )}</span>
            </div>
          `
              : ""
          }
          ${
            purchaseData.supplier_account_details?.remaining_balance
              ? `
            <div class="total-row">
              <span class="total-label">Remaining Balance:</span>
              <span class="amount">PKR ${formatAmount(
                purchaseData.supplier_account_details.remaining_balance
              )}</span>
            </div>
          `
              : ""
          }
        </div>
      `;
};

const generateBatchDetailsSection = (purchaseData) => {
  if (
    !purchaseData.batches ||
    !Array.isArray(purchaseData.batches) ||
    purchaseData.batches.length === 0
  ) {
    return "";
  }

  return `
      <div class="batch-details">
        <h4>Batch Information</h4>
        <table class="batch-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Batch Number</th>
              <th>Initial Qty</th>
              <th>Current Qty</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${purchaseData.batches
              .map(
                (batch) => `
              <tr>
                <td>${batch.product_id?.prod_name || "Unknown Product"}</td>
                <td>${batch.batch_number || "N/A"}</td>
                <td class="quantity">${batch.initial_quantity || 0}</td>
                <td class="quantity">${batch.current_quantity || 0}</td>
                <td>${formatDate(batch.expiry_date)}</td>
                <td><span class="status-badge ${batch.status || "pending"}">${
                  batch.status || "pending"
                }</span></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
};

export const generatePurchaseReportHTML = (data, options) => {
  // Extract the purchase data from the provided data object
  const purchaseData = data.data || data;

  // Generate the purchase items table HTML
  const purchaseItemsTableHTML = generatePurchaseItemsTableHTML(purchaseData);

  // Generate the totals section HTML
  const totalsSectionHTML = generateTotalsSection(purchaseData);

  // Generate the payment details section HTML
  const paymentDetailsSectionHTML = generatePaymentDetailsSection(purchaseData);

  // Generate the batch details section HTML
  const batchDetailsSectionHTML = generateBatchDetailsSection(purchaseData);

  return `${getStyles()}
        <div class="report-container">
          <div class="report-header">
            <div class="store-name">Purchase Report</div>
           </div>
          
          <div class="purchase-details">
            <div>
              <div class="purchase-number">Purchase # ${
                purchaseData.purchase_number || ""
              }</div>
              <div>Date: ${formatDate(purchaseData.date)} ${formatTime(
    purchaseData.date
  )}</div>
              <div>Created By: ${purchaseData.added_by?.name || "Admin"}</div>
              <div>Total Items: ${purchaseData.total_items || 0}</div>
              <div>Total Quantity: ${purchaseData.total_quantity || 0}</div>
            </div>
            <div>
              <div><span class="status-badge ${formatOrderStatus(
                purchaseData.order_status
              )}">${purchaseData.order_status || "pending"}</span></div>
              <div>Type: ${purchaseData.purchased_type || "purchased"}</div>
            </div>
          </div>
          
          <div class="supplier-details">
            <div><strong>Supplier Information</strong></div>
            <div>${purchaseData.supplier?.name || "Unknown Supplier"}</div>
            ${
              purchaseData.supplier?.contact_no
                ? `<div>Contact: ${purchaseData.supplier.contact_no}</div>`
                : ""
            }
            ${
              purchaseData.supplier?.address
                ? `<div>Address: ${purchaseData.supplier.address}</div>`
                : ""
            }
          </div>
          
          ${purchaseItemsTableHTML}
          ${totalsSectionHTML}
          ${paymentDetailsSectionHTML}
          ${batchDetailsSectionHTML}
          
          ${
            purchaseData.note
              ? `
            <div class="terms-conditions">
              <p><strong>Note:</strong> ${purchaseData.note}</p>
            </div>
          `
              : ""
          }
          
          <div class="terms-conditions">
            <p>Terms & Conditions: Terms and Conditions according to company rules * As per company own policy</p>
          </div>
        </div>
      `;
};
