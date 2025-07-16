export const generatePurchaseListReportHTML = (data) => {
  const purchases = data || [];

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
      purchased: "#007bff",
      returned: "#dc3545",
      pending: "#ffc107",
      received: "#28a745",
      order: "#6f42c1",
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
        margin:2px 0;
        text-transform: uppercase;
      ">${label}</span>`;
  };

  const rows = purchases.map((purchase) => {
    const supplier = purchase.supplier || {};
    const items = (purchase.order_items || [])
      .map((item) => {
        const product = item.product_id || {};
        const name = product.prod_name || "Unnamed";
        const qty = item.quantity;
        const price = formatAmount(item.purchase_price);
        return `${name} (${qty} @ ${price})<br>Batch: ${item.batch_number}`;
      })
      .join("<br><br>");

    const pt = purchase.payment_type || {};
    const method = pt.type || "cash";
    const breakdown =
      method === "split"
        ? `Cash: ${formatAmount(pt.split?.cash_amount)}<br>
           Credit: ${formatAmount(pt.split?.credit_amount)}`
        : method === "credit"
        ? `Credit: ${formatAmount(purchase.grand_total)}`
        : `Cash: ${formatAmount(purchase.grand_total)}`;

    return `
      <tr>
        <td>${purchase.purchase_number}<br><small>${formatDate(
      purchase.date
    )} ${formatTime(purchase.date)}</small></td>
        <td>${supplier.name || "-"}<br><small>Contact: ${
      supplier.contact_person || "-"
    }<br>Phone: ${supplier.phone || "-"}</small></td>
        <td>${purchase.store_id?.name || "-"}</td>
        <td>${purchase.added_by?.name || "-"}</td>
        <td>${items}</td>
        <td>${formatAmount(purchase.discount_value)}</td>
        <td>${formatAmount(purchase.shipping_charges)}</td>
        <td>${formatAmount(purchase.grand_total)}</td>
        <td>${breakdown}</td>
        <td>
          ${getBadge(purchase.purchased_type, purchase.purchased_type)}<br>
          ${getBadge(purchase.order_status, purchase.order_status)}<br>
          ${getBadge(method, method)}
        </td>
        <td>${purchase.note || "-"}</td>
      </tr>
    `;
  });

  const styles = `
    <style>
      @page { margin: 10mm; }
      body { font-family: 'Segoe UI', sans-serif; font-size: 12px; margin: 0; padding: 0; background: #fff; }
      .report-header { text-align: center; margin: 0 0 10px 0; padding: 0; }
      table { width: 100%; border-collapse: collapse; margin: 0; page-break-inside: auto; }
      th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; vertical-align: top; }
      th { background: black; color: #fff; font-size: 12px; }
      tr:nth-child(even) { background: #f9f9f9; }
      td small { font-size: 10px; color: #555; }
      @media print {
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        body { margin: 0; }
      }
    </style>
  `;

  const html = `
    ${styles}
    <div class="report-header">
      <h2>Purchase List Report</h2>
      <div>${formatDate(new Date())} ${formatTime(new Date())}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Purchase # / Date</th>
          <th>Supplier</th>
          <th>Store</th>
          <th>Created By</th>
          <th>Items</th>
          <th>Discount</th>
          <th>Shipping</th>
          <th>Grand Total</th>
          <th>Payment</th>
          <th>Badges</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join("")}
      </tbody>
    </table>
  `;

  return html;
};
