export const generateCategoryListReportHTML = (data, options) => {
  const categories = data || [];

  const formatAmount = (amount) =>
    amount != null
      ? Number(amount).toLocaleString("en-PK", { minimumFractionDigits: 2 })
      : "0.00";

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const getStyles = () => `
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 13px;
          margin: 0;
          padding: 20px;
          background: #f4f4f4;
        }
  
        .report-container {
          max-width: 1100px;
          margin: 0 auto;
          background: #fff;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
  
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
  
        .report-title {
          font-size: 24px;
          font-weight: bold;
        }
  
        .category-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
  
        .category-table th, .category-table td {
          border: 1px solid #ddd;
          padding: 8px;
          vertical-align: top;
          font-size: 12px;
        }
  
        .category-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
  
        .badge {
          display: inline-block;
          padding: 2px 6px;
          font-size: 11px;
          border-radius: 4px;
          color: white;
          background-color: #999;
          margin-top: 2px;
        }
  
        .badge-active {
          background-color: #28a745;
        }
  
        .badge-inactive {
          background-color: #dc3545;
        }
  
        .text-muted {
          color: #666;
          font-size: 11px;
        }
  
        .category-name {
          font-weight: bold;
          font-size: 13px;
        }
  
        .creator-img {
          width: 35px;
          height: 35px;
          object-fit: cover;
          border-radius: 50%;
          margin-right: 8px;
          vertical-align: middle;
        }
  
        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
      </style>
    `;

  const rows = categories
    .map((category, index) => {
      const creator = category.created_by || {};
      const creatorName = creator.name || "-";
      const creatorImage = creator.image || "";
      const createdByUser = creator.created_by?.name || "-";
      const statusBadge =
        category.status === "active"
          ? `<span class="badge badge-active">Active</span>`
          : `<span class="badge badge-inactive">Inactive</span>`;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <div class="category-name">${category.name || "Unnamed"}</div>
            ${statusBadge}
          </td>
          <td>PKR ${formatAmount(category.value)}</td>
          <td>${category.totalProduct || 0}</td>
          <td>
            ${
              creatorImage
                ? `<img src="${creatorImage}" class="creator-img" />`
                : ""
            }
            ${creatorName}<br>
          </td>
        </tr>
      `;
    })
    .join("");

  const reportHTML = `
      ${getStyles()}
      <div class="report-container">
        <div class="report-header">
          <div class="report-title">Category List Report</div>
          <div>${new Date().toLocaleDateString(
            "en-GB"
          )} ${new Date().toLocaleTimeString("en-GB")}</div>
        </div>
  
        <table class="category-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Category</th>
              <th>Total Value</th>
              <th>Total Products</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
  
        <div class="footer">
          <div>Total Categories: ${categories.length}</div>
          <div>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    `;

  return reportHTML;
};
