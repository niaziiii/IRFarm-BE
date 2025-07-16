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
        margin:2px 0;
        text-transform: uppercase;
      ">${label}</span>`;
  };

  const rows = sales.map((sale) => {
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
      <tr>
        <td>${sale.sale_number}<br><small>${formatDate(sale.date)} ${formatTime(
      sale.date
    )}</small></td>
        <td>${customer.name || "Walk-in Customer"}<br><small>CNIC: ${
      customer.cnic || "-"
    }<br>Contact: ${customer.contact_no || "-"}</small></td>
        <td>${sale.store_details?.name || "-"}</td>
        <td>${sale.salePerson?.name || "-"}</td>
        <td>${sale.added_by?.name || "-"}</td>
        <td>${items}</td>
        <td>${formatAmount(sale.total_sale_value)}</td>
        <td>${formatAmount(sale.discount_value)}</td>
        <td>${formatAmount(sale.shipping_charges)}</td>
        <td>${formatAmount(sale.grand_total)}</td>
        <td>${breakdown}</td>
        <td>
          ${getBadge(sale.sale_type, sale.sale_type)}<br>
          ${getBadge(method, method)}<br>
          ${getBadge(sale.payment_status, sale.payment_status)}
        </td>
        <td>${sale.note || "-"}</td>
      </tr>
    `;
  });

  const styles = `
    <style>
      @page {
        margin: 10mm; /* Remove large default margins */
      }
      body {
        font-family: 'Segoe UI', sans-serif;
        font-size: 12px;
        margin: 0;
        padding: 0;
        background: #fff;
      }
      .report-header {
        text-align: center;
        margin: 0 0 10px 0;
        padding: 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 0;
        page-break-inside: auto;
      }
      th, td {
        border: 1px solid #ccc;
        padding: 5px 8px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: black;
        color: #fff;
        font-size: 12px;
      }
      tr:nth-child(even) {
        background: #f9f9f9;
      }
      td small {
        font-size: 10px;
        color: #555;
      }
      @media print {
        table {
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        thead {
          display: table-header-group;
        }
        tfoot {
          display: table-footer-group;
        }
        body {
          margin: 0;
        }
      }
    </style>
  `;

  const html = `
    ${styles}
    <div class="report-header">
      <h2>Sale List Report</h2>
      <div>${formatDate(new Date())} ${formatTime(new Date())}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Sale # / Date</th>
          <th>Customer</th>
          <th>Store</th>
          <th>Sales Person</th>
          <th>Created By</th>
          <th>Items</th>
          <th>Total</th>
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
