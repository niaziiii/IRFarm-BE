export const generateSaleListReportHTML = (data) => {
  const sales = data || [];

  const formatAmount = (amount) =>
    amount != null
      ? `PKR ${Number(amount).toLocaleString("en-PK", {
          minimumFractionDigits: 2,
        })}`
      : "PKR 0.00";

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB") : "-";

  const formatTime = (date) =>
    date
      ? new Date(date).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const getBadge = (label, type) => {
    const colors = {
      paid: "#28a745",
      unpaid: "#dc3545",
      loan: "#ffc107",
      sale: "#007bff",
      returned: "#6f42c1",
      cash: "#17a2b8",
      credit: "#fd7e14",
      split: "#20c997",
    };
    return `<span style="
        background:${colors[type] || "#999"};
        color:#fff;
        padding:3px 7px;
        border-radius:3px;
        font-size:11px;
        display:inline-block;
        margin-left:5px;
        text-transform: uppercase;
      ">${label}</span>`;
  };

  const blocks = sales.map((sale) => {
    const customer = sale.customer_info || {};
    const items = (sale.sale_items || [])
      .map((item) => {
        const name = item.product_id?.prod_name || "Unnamed";
        const qty = item.quantity;
        const price = formatAmount(item.sale_price);
        return `${name} (${qty} @ ${price})`;
      })
      .join("<br>");

    const pt = sale.payment_type || {};
    const method = pt.type || "cash";
    const breakdown =
      method === "split"
        ? `Cash: ${formatAmount(
            pt.split?.cash_amount
          )}<br>Credit: ${formatAmount(pt.split?.credit_amount)}`
        : method === "credit"
        ? `Credit: ${formatAmount(sale.grand_total)}`
        : `Cash: ${formatAmount(sale.grand_total)}`;

    return `
        <div class="sale-block">
          <div class="sale-header">
            <div class="left">
              <strong>${sale.sale_number}</strong><br>
              <small>${formatDate(sale.date)} ${formatTime(sale.date)}</small>
            </div>
            <div class="right">
              ${getBadge(sale.sale_type, sale.sale_type)}
              ${getBadge(method, method)}
              ${getBadge(sale.payment_status, sale.payment_status)}
            </div>
          </div>
  
          <div class="sale-body">
            <div class="row"><strong>Customer:</strong> ${
              customer.name || "Walk-in Customer"
            }
              <br><small>CNIC: ${customer.cnic || "-"} | Contact: ${
      customer.contact_no || "-"
    }</small>
            </div>
            <div class="row"><strong>Store:</strong> ${
              sale.store_details?.name || "-"
            }</div>
            <div class="row"><strong>Sales Person:</strong> ${
              sale.salePerson?.name || "-"
            }</div>
            <div class="row"><strong>Created By:</strong> ${
              sale.added_by?.name || "-"
            }</div>
            <div class="row"><strong>Items:</strong><br><div class="items">${items}</div></div>
            <div class="row"><strong>Total:</strong> ${formatAmount(
              sale.total_sale_value
            )}</div>
            <div class="row"><strong>Discount:</strong> ${formatAmount(
              sale.discount_value
            )}</div>
            <div class="row"><strong>Shipping:</strong> ${formatAmount(
              sale.shipping_charges
            )}</div>
            <div class="row"><strong>Grand Total:</strong> ${formatAmount(
              sale.grand_total
            )}</div>
            <div class="row"><strong>Payment Breakdown:</strong><br>${breakdown}</div>
            ${
              sale.note
                ? `<div class="row"><strong>Note:</strong> ${sale.note}</div>`
                : ""
            }
          </div>
        </div>
      `;
  });

  const styles = `
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          font-size: 13px;
          margin: 0;
          padding: 20px;
          background: #f4f4f4;
        }
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .sale-block {
          background: #fff;
          border: 1px solid #ccc;
          border-left: 5px solid #007bff;
          padding: 15px;
          margin-bottom: 25px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          page-break-inside: avoid;
        }
        .sale-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .sale-header .right {
          text-align: right;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .sale-body .row {
          margin-bottom: 6px;
        }
        .items {
          line-height: 1.4em;
          margin-top: 4px;
          white-space: normal;
          word-break: break-word;
        }
        @media print {
          .sale-block {
            page-break-inside: avoid;
          }
        }
      </style>
    `;

  const html = `
      ${styles}
      <div class="report-header">
        <h1>Sale List Report</h1>
        <div>${formatDate(new Date())} ${formatTime(new Date())}</div>
      </div>
      ${blocks.join("")}
    `;

  return html;
};
