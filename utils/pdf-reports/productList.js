const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return "0.00";
  return Number(amount).toFixed(2);
};

const getStyles = () => {
  return `
      <style>
        .report-container {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        
        .store-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        
        .report-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .report-date {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        
        .product-list-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 13px;
        }
        
        .product-list-table th {
          background-color: #f5f5f5;
          font-weight: bold;
          font-size: 12px;
          text-transform: uppercase;
          padding: 10px 8px;
          text-align: left;
          border: 1px solid #ddd;
        }
        
        .product-list-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .category-header {
          background-color: #e0e0e0;
          font-weight: bold;
          font-size: 14px;
          padding: 10px 8px;
          border: 1px solid #ccc;
        }
        
        .category-row td {
          background-color: #e0e0e0;
          font-weight: bold;
        }
        
        .product-row td {
          background-color: #fff;
        }
        
        .product-row:hover {
          background-color: #f9f9f9;
        }
        
        .code-column {
          width: 15%;
          text-align: center;
        }
        
        .product-column {
          width: 65%;
        }
        
        .price-column {
          width: 20%;
          text-align: right;
        }
        
        .summary-section {
          margin-top: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .summary-label {
          font-weight: bold;
        }
        
        .summary-value {
          color: #0066cc;
          font-weight: bold;
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        
        .total-row td {
          font-weight: bold;
          border-top: 2px solid #000;
          background-color: #f5f5f5;
          padding: 10px 8px;
        }
        
        .empty-message {
          text-align: center;
          padding: 40px;
          color: #666;
          font-style: italic;
        }
      </style>
    `;
};

const generateProductTableRows = (categories) => {
  if (!categories || Object.keys(categories).length === 0) {
    return '<tr><td colspan="3" class="empty-message">No products found</td></tr>';
  }

  let rows = "";
  let totalProducts = 0;
  let totalValue = 0;

  // Iterate through categories
  Object.values(categories).forEach((category) => {
    // Add category header row
    rows += `
        <tr class="category-row">
          <td colspan="3" class="category-header">Category: ${
            category.name || "Uncategorized"
          }</td>
        </tr>
      `;

    // Add products for this category
    if (category.products && Array.isArray(category.products)) {
      category.products.forEach((product) => {
        const price = product.retail_price || 0;
        totalProducts++;
        totalValue += price;

        rows += `
            <tr class="product-row">
              <td class="code-column">${product.prod_code || "N/A"}</td>
              <td class="product-column">${
                product.name || "Unknown Product"
              }</td>
              <td class="price-column">PKR ${formatAmount(price)}</td>
            </tr>
          `;
      });
    }
  });

  // Add total row
  rows += `
      <tr class="total-row">
        <td colspan="2">Total (${totalProducts} products)</td>
        <td class="price-column">PKR ${formatAmount(totalValue)}</td>
      </tr>
    `;

  return rows;
};

export const generateProductListReportHTML = (data, options) => {
  const categories = data || {};
  const tableRows = generateProductTableRows(categories);

  return `${getStyles()}
      <div class="report-container">
        <div class="report-header"> 
          <div class="report-title">Product List</div>
          
        </div>
        
        <table class="product-list-table">
          <thead>
            <tr>
              <th class="code-column">Code</th>
              <th class="product-column">Product</th>
              <th class="price-column">Retail Price</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
                
        <div class="footer"> 
          <div class="report-date">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    `;
};
