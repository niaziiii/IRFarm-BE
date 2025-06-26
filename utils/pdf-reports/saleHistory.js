export const generateSaleHistoryReportHTML = (_data, options) => {
  const data = _data.data;
  const dates = _data.date;

  const formatAmount = (amount) =>
    amount == null
      ? "0.00"
      : Number(amount)
          .toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; }
        .report-title { text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; }
        .report-subtitle { text-align: center; font-size: 14px; margin-bottom: 30px; color: #555; }
        .customer-section { margin-bottom: 50px; }
        .customer-header { background: #eef2ff; padding: 10px 15px; font-size: 18px; font-weight: bold; border-left: 6px solid #6366f1; }
        .summary, .account-info { font-size: 14px; margin: 8px 0 15px 10px; }
        .sale-box { background: #f9f9f9; border: 1px solid #ccc; border-radius: 5px; padding: 15px; margin-bottom: 20px; }
        .sale-header { font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
        .sale-meta { font-size: 13px; margin-bottom: 10px; }
        .product-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .product-table th, .product-table td { border: 1px solid #ddd; padding: 8px; font-size: 13px; text-align: left; }
        .product-table th { background-color: #e0e7ff; }
        .footer { margin-top: 40px; font-size: 12px; text-align: center; color: #777; border-top: 1px solid #ccc; padding-top: 15px; }
      </style>
    `;

  const renderCustomerSection = (entry) => {
    const customer = entry.customerInfo;
    const customerName = customer?.name || "Walk-in Customer";
    const date = formatDate(entry._id?.date);
    const sales = entry.sales || [];

    let section = `
        <div class="customer-section">
          <div class="customer-header">${customerName} - ${date}</div>
          <div class="summary">
            <strong>Total Sales:</strong> ${entry.totalSales} &nbsp;|&nbsp;
            <strong>Total Items:</strong> ${entry.totalItems} &nbsp;|&nbsp;
            <strong>Total Amount:</strong> PKR ${formatAmount(
              entry.totalAmount
            )}
          </div>`;

    if (customer?.account) {
      const acc = customer.account;
      section += `
          <div class="account-info">
            <strong>Account Type:</strong> ${acc.type} &nbsp;|&nbsp;
            <strong>Limit:</strong> PKR ${formatAmount(
              acc.amount
            )} &nbsp;|&nbsp;
            <strong>Used:</strong> PKR ${formatAmount(
              acc.usedAmount
            )} &nbsp;|&nbsp;
            <strong>Balance:</strong> PKR ${formatAmount(acc.balance)}
          </div>`;
    }

    for (const sale of sales) {
      const {
        sale_number,
        date,
        grand_total,
        discount_value,
        payment_status,
        sale_type,
        payment_type,
        sale_items,
      } = sale;

      let paymentDetails = "N/A";
      if (payment_type?.type === "split") {
        const { cash_amount, credit_amount } = payment_type.split || {};
        paymentDetails = `Split (Cash: PKR ${formatAmount(
          cash_amount
        )}, Credit: PKR ${formatAmount(credit_amount)})`;
      } else if (payment_type?.type === "cash") {
        paymentDetails = "Cash";
      } else if (payment_type?.type === "credit") {
        paymentDetails = "Credit";
      }

      section += `
          <div class="sale-box">
            <div class="sale-header">#${sale_number}</div>
            <div class="sale-meta">
              <strong>Date:</strong> ${formatDate(date)} &nbsp;|&nbsp;
              <strong>Status:</strong> ${payment_status} &nbsp;|&nbsp;
              <strong>Type:</strong> ${sale_type}<br>
              <strong>Total:</strong> PKR ${formatAmount(
                grand_total
              )} &nbsp;|&nbsp;
              <strong>Discount:</strong> PKR ${formatAmount(
                discount_value
              )} &nbsp;|&nbsp;
              <strong>Payment:</strong> ${paymentDetails}
            </div>
            <table class="product-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
        `;

      sale_items.forEach((item, idx) => {
        section += `
            <tr>
              <td>${idx + 1}</td>
              <td>${item.productName}</td>
              <td>${item.sku}</td>
              <td>${item.quantity}</td>
              <td>PKR ${formatAmount(item.salePrice)}</td>
              <td>PKR ${formatAmount(item.subtotal)}</td>
            </tr>`;
      });

      section += `
              </tbody>
            </table>
          </div>`;
    }

    section += `</div>`;
    return section;
  };

  const allSections = data.map(renderCustomerSection).join("");
  const dateRange = `${dates?.startDate ?? ""} - ${dates?.endDate ?? ""}`;

  return `
      ${getStyles()}
      <div class="report-title">Sale History Report</div>
      <div class="report-subtitle">Date Range: ${dateRange}</div>
      ${allSections}
      <div class="footer">Generated on: ${new Date().toLocaleString()} | IR Farm System</div>
    `;
};
