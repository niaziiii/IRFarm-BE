import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import path from "path";
import { jsPDF } from "jspdf";
// import html2canvas from "html2canvas";

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
      // Generate PDF using jsPDF (no browser required)
      const doc = new jsPDF();

      // Add header
      doc.setFontSize(20);
      doc.text(options.storeInfo.name || "IRFARM", 105, 20, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.text(options.storeInfo.phone || "", 105, 30, { align: "center" });
      doc.text(options.storeInfo.email || "", 105, 40, { align: "center" });
      doc.text(options.storeInfo.address || "", 105, 50, { align: "center" });

      // Add a line separator
      doc.line(20, 60, 190, 60);

      // Add title
      doc.setFontSize(16);
      doc.text(options.title || "Expense Report", 105, 75, { align: "center" });

      // Parse and add the HTML content as text
      // This is a simplified version - you might need to parse the HTML data
      doc.setFontSize(10);
      const lines = this.parseHTMLToText(data);
      let yPosition = 90;

      lines.forEach((line) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 7;
      });

      // Convert to buffer
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      const fileName = `expense-report-${uuidv4()}.pdf`;

      // Upload to S3
      const url = await this.uploadToS3(pdfBuffer, fileName);
      return { url };
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // Simple HTML parser (you can enhance this based on your needs)
  parseHTMLToText(html) {
    // Remove HTML tags and split into lines
    const text = html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + " " + word).length > 80) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + " " + word : word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  // Generate store info header HTML (kept for compatibility)
  generateStoreInfoHTML(storeInfo) {
    return `
      <div class="store-header">
        <div class="store-info">
          <h1 class="store-name">${storeInfo.name || "IRFARM"}</h1>
          <p>Phone: ${storeInfo.phone || ""}</p>
          <p>Email: ${storeInfo.email || ""}</p>
          <div class="store-details">
            <p>${storeInfo.address || ""}</p>
          </div>
        </div>
      </div>
    `;
  }

  // Get common CSS styles (kept for compatibility)
  getCommonStyles() {
    return `
      <style>
        /* Styles kept for compatibility */
      </style>
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
