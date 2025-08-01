import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import path from "path";
import pdf from "html-pdf-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "eu-north-1",
});

class PDFService {
  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || "irfarm";
  }

  // Main method to generate expense report PDF
  async generatePDFReport(data, options) {
    try {
      // Generate complete HTML content
      const htmlContent = this.generateCompleteHTML(data, options);

      // Options for PDF generation
      const pdfOptions = {
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
        preferCSSPageSize: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      };

      // Generate PDF from HTML
      const file = { content: htmlContent };
      const pdfBuffer = await pdf.generatePdf(file, pdfOptions);

      const fileName = `expense-report-${uuidv4()}.pdf`;

      // Upload to S3
      const url = await this.uploadToS3(pdfBuffer, fileName);
      return { url };
    } catch (error) {
      console.error("PDF Generation Error:", error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // Generate complete HTML with embedded styles
  generateCompleteHTML(data, options) {
    const storeInfoHTML = this.generateStoreInfoHTML(options.storeInfo);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${options.title || "Expense Report"}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
              color: #333;
              padding: 20px;
            }
            
            .store-header {
              background-color: #3EB5AF;
              color: black;
              padding: 20px;
              margin-bottom: 20px;
              text-align: center;
              border-radius: 8px;
            }
            
            .store-info {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            
            .store-logo {
              max-width: 100px;
              height: 100px;
              margin-bottom: 10px;
            }
            
            .store-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            
            .store-details p {
              margin: 5px 0;
              font-size: 14px;
            }
            
            .content {
              margin: 0 20px;
            }
            
            /* Table styles */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            /* List styles */
            ul, ol {
              margin-left: 20px;
              margin-bottom: 10px;
            }
            
            li {
              margin-bottom: 5px;
            }
            
            /* Text styles */
            h1, h2, h3, h4, h5, h6 {
              margin: 15px 0 10px 0;
              color: #2c3e50;
            }
            
            p {
              margin-bottom: 10px;
            }
            
            .highlight {
              background-color: #ffeb3b;
              padding: 2px 4px;
            }
            
            .text-center {
              text-align: center;
            }
            
            .text-right {
              text-align: right;
            }
            
            .font-bold {
              font-weight: bold;
            }
            
            .mt-20 {
              margin-top: 20px;
            }
            
            .mb-20 {
              margin-bottom: 20px;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .store-header {
                background-color: #3EB5AF !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${storeInfoHTML}
          <div class="content">
            ${data}
          </div>
        </body>
      </html>
    `;
  }

  // Generate store info header HTML
  generateStoreInfoHTML(storeInfo) {
    return `
      <div class="store-header">
        <div class="store-info">
          ${
            storeInfo.logo
              ? `<img src="${storeInfo.logo}" alt="${
                  storeInfo.name || "IRFARM"
                } Logo" class="store-logo" />`
              : ""
          }
          <h1 class="store-name">${storeInfo.name || "IRFARM"}</h1>
          ${storeInfo.phone ? `<p>Phone: ${storeInfo.phone}</p>` : ""}
          ${storeInfo.email ? `<p>Email: ${storeInfo.email}</p>` : ""}
          ${storeInfo.address ? `<p>${storeInfo.address}</p>` : ""}
        </div>
      </div>
    `;
  }

  // Upload PDF buffer to S3
  async uploadToS3(pdfBuffer, fileName) {
    try {
      const uploadParams = {
        Bucket: this.bucketName,
        Key: `pdfs/${fileName}`,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      };

      const result = await s3.upload(uploadParams).promise();
      return result.Location;
    } catch (error) {
      throw new Error(`S3 upload error: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new PDFService();
