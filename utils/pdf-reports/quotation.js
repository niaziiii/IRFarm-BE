export const generateQuotationReportHTML = (data, options) => {
  const quotation = data.data || data;

  const formatAmount = (amount) => `PKR ${Number(amount || 0).toFixed(2)}`;
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");
  const formatTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const getStyles = () => `
      <style>
        .report-container { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .report-header { text-align: center; margin-bottom: 20px; }
        .store-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .invoice-number { font-weight: bold; }
        .customer-details { border: 1px solid #ddd; padding: 10px; margin-bottom: 20px; border-radius: 4px; }
        .sale-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .sale-table th, .sale-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .sale-table th { background-color: #f5f5f5; font-weight: bold; }
        .amount { text-align: right; }
        .quantity { text-align: center; }
        .total-section { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .total-label { font-weight: bold; }
        .grand-total { font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 2px solid #333; padding-top: 10px; }
        .payment-details { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        .terms-conditions { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    `;

  const itemsTable = `
      <table class="sale-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${quotation.quotation_items
            .map((item, i) => {
              const prod = item.product_id || {};
              return `
              <tr>
                <td>${i + 1}</td>
                <td>${prod.prod_name || "Unnamed Product"}</td>
                <td class="amount">${formatAmount(item.sale_price)}</td>
                <td class="quantity">${item.quantity}</td>
                <td class="amount">${formatAmount(
                  item.sale_price * item.quantity
                )}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    `;

  const totals = `
      <div class="total-section">
        <div class="total-row">
          <span class="total-label">Total:</span>
          <span class="amount">${formatAmount(quotation.total_value)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Discount:</span>
          <span class="amount">${formatAmount(quotation.discount_value)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Shipping:</span>
          <span class="amount">${formatAmount(
            quotation.shipping_charges
          )}</span>
        </div>
        <div class="total-row grand-total">
          <span class="total-label">Grand Total:</span>
          <span class="amount">${formatAmount(quotation.grand_total)}</span>
        </div>
      </div>
    `;

  const paymentSection = `
      <div class="payment-details">
        <div class="total-row">
          <span class="total-label">Payment:</span>
          <span>${quotation.payment_type?.type || "Cash"}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Payment Amount:</span>
          <span class="amount">${formatAmount(quotation.grand_total)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Balance:</span>
          <span class="amount">PKR 0.00</span>
        </div>
        ${
          quotation.payment_type?.type === "split"
            ? `
          <div class="total-row">
            <span class="total-label">Cash:</span>
            <span class="amount">${formatAmount(
              quotation.payment_type.split.cash_amount
            )}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Credit:</span>
            <span class="amount">${formatAmount(
              quotation.payment_type.split.credit_amount
            )}</span>
          </div>`
            : ""
        }
        ${
          quotation.verification_details?.customer_credit_check
            ?.current_used_amount
            ? `
          <div class="total-row">
            <span class="total-label">Previous Balance:</span>
            <span class="amount">${formatAmount(
              quotation.verification_details.customer_credit_check
                .current_used_amount
            )}</span>
          </div>`
            : ""
        }
        ${
          quotation.verification_details?.customer_credit_check
            ?.new_used_amount_would_be
            ? `
          <div class="total-row">
            <span class="total-label">Net Balance:</span>
            <span class="amount">${formatAmount(
              quotation.verification_details.customer_credit_check
                .new_used_amount_would_be
            )}</span>
          </div>`
            : ""
        }
      </div>
    `;

  return `${getStyles()}
      <div class="report-container">
        <div class="report-header">
          <div class="store-name">Quotation Report</div>
        </div>
  
        <div class="invoice-details">
          <div>
            <div class="invoice-number">Quotation #: ${
              quotation.quotation_number
            }</div>
            <div>Date: ${formatDate(quotation.date)} ${formatTime(
    quotation.date
  )}</div>
            <div>Sales Person: ${quotation.salePerson?.name || "N/A"}</div>
          </div>
          <div>
            <div>Status: ${quotation.status}</div>
            <div>Validity: ${formatDate(quotation.validity)}</div>
          </div>
        </div>
  
        <div class="customer-details">
          <div>${quotation.customer?.name || "Walk-in Customer"}</div>
          ${
            quotation.customer?.contact_no
              ? `<div>Contact: ${quotation.customer.contact_no}</div>`
              : ""
          }
        </div>
  
        ${itemsTable}
        ${totals}
        ${paymentSection}
  
        <div class="terms-conditions">
          <p>Terms & Conditions: As per company policy and quotation agreement.</p>
        </div>
      </div>
    `;
};
