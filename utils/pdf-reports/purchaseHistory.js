export const generatePurchaseHistoryReportHTML = (_data, options) => {
  const data = _data.data;
  const dates = _data.date;

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return "0.00";
    return Number(amount)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date)
      ? "-"
      : date.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });
  };

  const getStyles = () => `
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: #fff;
          color: #333;
        }
        .report-title {
          text-align: center;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 30px;
          border-bottom: 3px solid #000;
          padding-bottom: 10px;
          text-transform: uppercase;
        }
           .report-title-2 {
          text-align: center;
          font-size: 14px;
          margin-bottom: 30px;
          padding-bottom: 10px;
          text-transform: uppercase;
        }
        .supplier-section {
          margin-bottom: 50px;
        }
        .supplier-header {
          background: #f2f2f2;
          padding: 10px 15px;
          font-size: 18px;
          font-weight: bold;
          border-left: 6px solid #2563eb;
          margin-bottom: 15px;
        }
        .summary {
          font-size: 14px;
          margin-bottom: 10px;
          padding-left: 10px;
        }
        .purchase-box {
          border: 1px solid #ccc;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          background: #fafafa;
        }
        .purchase-header {
          font-weight: bold;
          font-size: 16px;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .purchase-meta {
          font-size: 13px;
          margin-bottom: 10px;
        }
        .product-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .product-table th,
        .product-table td {
          border: 1px solid #ddd;
          padding: 8px 10px;
          font-size: 13px;
        }
        .product-table th {
          background-color: #f1f5f9;
          font-weight: bold;
        }
        .footer {
          margin-top: 40px;
          font-size: 12px;
          text-align: center;
          color: #777;
          border-top: 1px solid #ccc;
          padding-top: 15px;
        }
      </style>
    `;

  const generateSupplierSection = (entry) => {
    const { supplierInfo, purchases, totalAmount, totalPurchases, totalItems } =
      entry;
    const supplierName = supplierInfo?.name || "N/A";
    const date = formatDate(entry?._id?.date);

    let sectionHTML = `
        <div class="supplier-section">
          <div class="supplier-header">${supplierName} - ${date}</div>
          <div class="summary">
            <strong>Total Purchases:</strong> ${totalPurchases} &nbsp;|&nbsp;
            <strong>Total Items:</strong> ${totalItems} &nbsp;|&nbsp;
            <strong>Total Amount:</strong> PKR ${formatAmount(totalAmount)}
          </div>
      `;

    purchases.forEach((purchase) => {
      const {
        purchase_number,
        grand_total,
        shipping_charges,
        discount_value,
        order_status,
        purchased_type,
        date,
        order_items,
      } = purchase;

      sectionHTML += `
          <div class="purchase-box">
            <div class="purchase-header">#${purchase_number}</div>
            <div class="purchase-meta">
              <strong>Date:</strong> ${formatDate(date)} &nbsp;|&nbsp;
              <strong>Status:</strong> ${order_status} &nbsp;|&nbsp;
              <strong>Type:</strong> ${purchased_type}<br>
              <strong>Total:</strong> PKR ${formatAmount(
                grand_total
              )} &nbsp;|&nbsp;
              <strong>Shipping:</strong> PKR ${formatAmount(
                shipping_charges
              )} &nbsp;|&nbsp;
              <strong>Discount:</strong> PKR ${formatAmount(discount_value)}
            </div>
            <table class="product-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Subtotal</th> 
                </tr>
              </thead>
              <tbody>
        `;

      order_items.forEach((item, index) => {
        sectionHTML += `
            <tr>
              <td>${index + 1}</td>
              <td>${item.productName || "N/A"}</td>
              <td>${item.quantity}</td>
              <td>PKR ${formatAmount(item.purchasePrice)}</td>
              <td>PKR ${formatAmount(item.subtotal)}</td> 
            </tr>
          `;
      });

      sectionHTML += `
              </tbody>
            </table>
          </div>
        `;
    });

    sectionHTML += `</div>`;
    return sectionHTML;
  };

  const allSupplierSections = data.map(generateSupplierSection).join("");

  return `
      ${getStyles()}
      <div class="report-title">
      <b>Purchase History Report</b>
      </br>
      <small class="report-title-2"> ${dates?.startDate ?? ""} - ${
    dates?.endDate ?? ""
  } </small>
      
      </div>
      ${allSupplierSections}
      <div class="footer">Generated on: ${new Date().toLocaleString()} &nbsp;|&nbsp; IR Farm System</div>
    `;
};
