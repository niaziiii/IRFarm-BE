export const generateUserListReportHTML = (data, options) => {
  const users = data || [];

  const formatDate = (dateString) => {
    if (!dateString) return "?";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const getStatusBadge = (status) => {
    return `<span class="badge ${
      status === "active" ? "badge-active" : "badge-inactive"
    }">${status}</span>`;
  };

  const renderPermissions = (permissions = {}) => {
    return Object.entries(permissions)
      .map(([module, perms]) => {
        const permsStr =
          Object.entries(perms)
            .filter(([, val]) => val)
            .map(([key]) => key)
            .join(", ") || "None";

        return `<div><strong>${module}:</strong> <span class="text-muted">${permsStr}</span></div>`;
      })
      .join("");
  };

  const getStyles = () => `
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          font-size: 13px;
          margin: 0;
          padding: 20px;
          background: #f4f4f4;
        }
  
        .report-container {
          max-width: 1200px;
          margin: 0 auto;
          background: #fff;
          padding: 20px;
          box-shadow: 0 0 8px rgba(0,0,0,0.1);
        }
  
        .report-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
  
        .report-title {
          font-size: 24px;
          font-weight: bold;
        }
  
        .user-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 20px;
        }
  
        .user-table th, .user-table td {
          border: 1px solid #ccc;
          padding: 10px;
          vertical-align: top;
        }
  
        .user-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
  
        .user-image {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 50%;
        }
  
        .badge {
          padding: 2px 6px;
          font-size: 11px;
          border-radius: 3px;
          color: #fff;
          display: inline-block;
          margin-top: 5px;
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
  
        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
  
        .permissions {
          margin-top: 5px;
          padding-top: 5px;
          border-top: 1px solid #eee;
        }
      </style>
    `;

  const rows = users
    .map((user, index) => {
      const creator = user.created_by || {};
      const grandCreator = creator.created_by?.name || "?";
      const address = user.address || {};
      const fullAddress = `${address.city || "?"}, ${
        address.province || "?"
      }, ${address.country || "?"}`;
      const imageHTML = user.image
        ? `<img src="${user.image}" class="user-image" />`
        : `<div class="user-image" style="background:#ccc;display:inline-block;text-align:center;line-height:40px;color:#fff;">N/A</div>`;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            ${imageHTML}<br>
            <strong>${user.prefix || ""} ${user.name}</strong><br>
            <span class="text-muted">${user.role}</span><br>
            ${getStatusBadge(user.status)}
          </td>
          <td>
            <div><strong>Email:</strong> ${user.email || "?"}</div>
            <div><strong>Contact:</strong> ${user.contact_no || "?"}</div>
            <div><strong>CNIC:</strong> ${user.cnic || "?"}</div>
          </td>
          <td>${fullAddress}</td>
          <td>
            <div><strong>Created by:</strong> ${creator.name || "?"}</div>
            <div class="text-muted">Senior: ${grandCreator}</div>
            <div class="text-muted">Created: ${formatDate(user.createdAt)}</div>
          </td>
          <td class="permissions">${renderPermissions(user.permissions)}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
      ${getStyles()}
      <div class="report-container">
        <div class="report-header">
          <div class="report-title">User List Report</div>
          <div>${new Date().toLocaleDateString(
            "en-GB"
          )} ${new Date().toLocaleTimeString("en-GB")}</div>
        </div>
  
        <table class="user-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Contact Info</th>
              <th>Address</th>
              <th>Created Info</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
  
        <div class="footer">
          <div>Total Users: ${users.length}</div>
          <div>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    `;

  return html;
};
