export const generateQuotationListReportHTML = (data, options) => {
  const quotations = data || [];

  const formatCurrency = (val) =>
    `PKR ${Number(val || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
    })}`;
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");
  const formatTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const badge = (label, type) => {
    const colors = {
      active: "#28a745",
      converted: "#007bff",
      cash: "#17a2b8",
      credit: "#fd7e14",
      split: "#20c997",
    };
    return `<span style="background:${
      colors[type] || "#6c757d"
    };color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;margin-right:5px;text-transform:uppercase">${label}</span>`;
  };

  const styles = `
      <style>
        body { font-family: 'Segoe UI', sans-serif; font-size: 13px; margin: 0; padding: 20px; background: #f8f9fa; }
        .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .report-header h1 { font-size: 24px; margin: 0; }
        .quote-block { background: #fff; border-left: 5px solid #007bff; margin-bottom: 30px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); page-break-inside: avoid; }
        .quote-header { display: flex; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; }
        .quote-header .meta { font-size: 14px; }
        .quote-body .row { margin-bottom: 10px; }
        .quote-items { margin-top: 10px; }
        .quote-items div { margin-bottom: 5px; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; display: flex; justify-content: space-between; }
        .note { background: #f1f1f1; padding: 10px; border-left: 3px solid #ccc; font-style: italic; margin-top: 10px; }
      </style>
    `;

  const blocks = quotations
    .map((q) => {
      const customer = q.customer || {};
      const items = q.quotation_items
        .map((item) => {
          const product = item.product_id || {};
          return `<div>- ${product.prod_name || "Unnamed"} (${
            item.quantity
          } @ ${formatCurrency(item.sale_price)})</div>`;
        })
        .join("");

      const paymentBreakdown = (() => {
        if (q.payment_type?.type === "split") {
          return `Cash: ${formatCurrency(
            q.payment_type.split?.cash_amount
          )}<br>Credit: ${formatCurrency(q.payment_type.split?.credit_amount)}`;
        } else if (q.payment_type?.type === "credit") {
          return `Credit: ${formatCurrency(q.grand_total)}`;
        } else {
          return `Cash: ${formatCurrency(q.grand_total)}`;
        }
      })();

      return `
        <div class="quote-block">
          <div class="quote-header">
            <div class="meta">
              <strong>${q.quotation_number}</strong><br>
              <small>${formatDate(q.date)} ${formatTime(q.date)}</small>
            </div>
            <div>
              ${badge(q.status, q.status)}
              ${badge(q.payment_type?.type, q.payment_type?.type)}
              ${q.converted_to_sale ? badge("Converted", "converted") : ""}
            </div>
          </div>
  
          <div class="quote-body">
            <div class="row"><strong>Customer:</strong> ${
              customer.name || "Walk-in Customer"
            }</div>
            <div class="row"><strong>Contact:</strong> ${
              customer.contact_no || "-"
            }</div>
            <div class="row"><strong>Store:</strong> ${
              q.store_id?.name || "-"
            }</div>
            <div class="row"><strong>Sales Person:</strong> ${
              q.salePerson?.name || "-"
            }</div>
            <div class="row"><strong>Created By:</strong> ${
              q.added_by?.name || "-"
            }</div>
            <div class="row"><strong>Total Items:</strong> ${
              q.total_items
            } | <strong>Total Quantity:</strong> ${q.total_quantity}</div>
            <div class="row"><strong>Discount:</strong> ${formatCurrency(
              q.discount_value
            )} | <strong>Shipping:</strong> ${formatCurrency(
        q.shipping_charges
      )}</div>
            <div class="row"><strong>Grand Total:</strong> ${formatCurrency(
              q.grand_total
            )}</div>
            <div class="row"><strong>Payment Breakdown:</strong><br>${paymentBreakdown}</div>
            <div class="row"><strong>Validity:</strong> ${formatDate(
              q.validity
            )}</div>
            ${q.note ? `<div class="note">${q.note}</div>` : ""}
            <div class="quote-items">
              <strong>Items:</strong>
              ${items}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  return `
      ${styles}
      <div class="report-header">
        <h1>Quotation List Report</h1>
        <div>${formatDate(new Date())} ${formatTime(new Date())}</div>
      </div>
      ${blocks}
      <div class="footer">
        <div>Total Quotations: ${quotations.length}</div>
        <div>Generated: ${formatDate(new Date())} ${formatTime(
    new Date()
  )}</div>
      </div>
    `;
};
