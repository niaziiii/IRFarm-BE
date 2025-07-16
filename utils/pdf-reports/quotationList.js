export const generateQuotationListReportHTML = (data) => {
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
    return `<span style="background:${colors[type] || "#6c757d"};
      color:#fff;
      padding:2px 8px;
      border-radius:3px;
      font-size:11px;
      text-transform:uppercase;
      display:inline-block;
      margin:2px 0;">
      ${label}
    </span>`;
  };

  const rows = quotations.map((q) => {
    const customer = q.customer || {};
    const items = q.quotation_items
      .map((item) => {
        const product = item.product_id || {};
        return `${product.prod_name || "Unnamed"} (${
          item.quantity
        } @ ${formatCurrency(item.sale_price)})`;
      })
      .join("<br>");

    const paymentBreakdown = (() => {
      if (q.payment_type?.type === "split") {
        return `Cash: ${formatCurrency(q.payment_type.split?.cash_amount)}<br>
                Credit: ${formatCurrency(q.payment_type.split?.credit_amount)}`;
      } else if (q.payment_type?.type === "credit") {
        return `Credit: ${formatCurrency(q.grand_total)}`;
      } else {
        return `Cash: ${formatCurrency(q.grand_total)}`;
      }
    })();

    return `
      <tr>
        <td>${q.quotation_number}<br><small>${formatDate(q.date)} ${formatTime(
      q.date
    )}</small></td>
        <td>${customer.name || "Walk-in Customer"}<br><small>Contact: ${
      customer.contact_no || "-"
    }</small></td>
        <td>${q.store_id?.name || "-"}</td>
        <td>${q.salePerson?.name || "-"}</td>
        <td>${q.added_by?.name || "-"}</td>
        <td>${items}</td>
        <td>${formatCurrency(q.discount_value)}</td>
        <td>${formatCurrency(q.shipping_charges)}</td>
        <td>${formatCurrency(q.grand_total)}</td>
        <td>${paymentBreakdown}</td>
        <td>
          ${badge(q.status, q.status)}<br>
          ${badge(q.payment_type?.type, q.payment_type?.type)}<br>
          ${q.converted_to_sale ? badge("Converted", "converted") : ""}
        </td>
        <td>${formatDate(q.validity)}</td>
        <td>${q.note || "-"}</td>
      </tr>
    `;
  });

  const styles = `
    <style>
      @page { margin: 10mm; }
      body { font-family: 'Segoe UI', sans-serif; font-size: 12px; margin: 0; padding: 0; background: #fff; }
      .report-header { text-align: center; margin-bottom: 10px; }
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
      <h2>Quotation List Report</h2>
      <div>${formatDate(new Date())} ${formatTime(new Date())}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Quotation # / Date</th>
          <th>Customer</th>
          <th>Store</th>
          <th>Sales Person</th>
          <th>Created By</th>
          <th>Items</th>
          <th>Discount</th>
          <th>Shipping</th>
          <th>Grand Total</th>
          <th>Payment</th>
          <th>Badges</th>
          <th>Validity</th>
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
