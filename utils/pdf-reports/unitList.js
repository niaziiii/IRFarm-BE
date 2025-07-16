export const generateUnitListReportHTML = (data, options) => {
  const units = data || [];

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString("en-GB") : "-";

  const getStatusBadge = (status) => {
    return `<span class="badge ${
      status === "active" ? "badge-active" : "badge-inactive"
    }">${status}</span>`;
  };

  const getStyles = () => `
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          font-size: 13px;
          margin: 0;
          padding: 20px;
          background: #f9f9f9;
        }
  
        .report-container {
          max-width: 1100px;
          margin: 0 auto;
          background: #fff;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.08);
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
  
        .unit-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 20px;
        }
  
        .unit-table th, .unit-table td {
          border: 1px solid #ddd;
          padding: 10px;
          vertical-align: top;
        }
  
        .unit-table th {
          background-color: #f1f1f1;
          font-weight: bold;
        }
  
        .badge {
          display: inline-block;
          padding: 2px 6px;
          font-size: 11px;
          border-radius: 4px;
          color: white;
          background-color: #999;
          margin-top: 4px;
        }
  
        .badge-active {
          background-color: #28a745;
        }
  
        .badge-inactive {
          background-color: #dc3545;
        }
  
        .creator-img {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 6px;
          vertical-align: middle;
        }
  
        .text-muted {
          color: #666;
          font-size: 11px;
        }
  
        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
  
        .description {
          white-space: pre-line;
          line-height: 1.4;
        }
      </style>
    `;

  const rows = units
    .map((unit, index) => {
      const creator = unit.created_by || {};
      const creatorImage = creator.image
        ? `<img src="${creator.image}" class="creator-img" />`
        : `<div class="creator-img" style="background:#ccc;text-align:center;line-height:35px;color:#fff;">N/A</div>`;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${unit.name}</strong><br>
            ${getStatusBadge(unit.status)}
          </td>
          <td class="description">${unit.description || "-"}</td>
          <td>${unit.unit_symbol || "-"}</td>
          <td>${unit.unit_type || "-"}</td>
          <td>
            ${creatorImage}
            ${creator.name || "-"}<br>
            <span class="text-muted">Created: ${formatDate(
              unit.createdAt
            )}</span>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
      ${getStyles()}
      <div class="report-container">
        <div class="report-header">
          <div class="report-title">Unit List Report</div>
          <div>${new Date().toLocaleDateString(
            "en-GB"
          )} ${new Date().toLocaleTimeString("en-GB")}</div>
        </div>
  
        <table class="unit-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Unit Name</th>
              <th>Description</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
  
        <div class="footer">
          <div>Total Units: ${units.length}</div>
          <div>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    `;

  return html;
};
