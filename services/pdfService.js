import PDFDocument from "pdfkit";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

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
      const pdfBuffer = await this.generatePDFFromData(data, options);
      const fileName = `expense-report-${uuidv4()}.pdf`;

      // Upload to S3
      const url = await this.uploadToS3(pdfBuffer, fileName);
      return { url };
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // Generate PDF using PDFKit
  async generatePDFFromData(data, options) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Add store header
        this.addStoreHeader(doc, options.storeInfo);

        // Add content
        this.addContent(doc, data, options);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Add store header to PDF
  addStoreHeader(doc, storeInfo) {
    // Black background rectangle
    doc.rect(0, 0, doc.page.width, 120).fill("#000000");

    // Store name
    doc
      .fillColor("#FFFFFF")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(storeInfo.name || "IRFARM", 50, 30, { align: "center" });

    // Store details
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(storeInfo.address || "", 50, 65, { align: "center" })
      .text(`Phone: ${storeInfo.phone || ""}`, 50, 80, { align: "center" })
      .text(`Email: ${storeInfo.email || ""}`, 50, 95, { align: "center" });

    // Reset color and move down
    doc.fillColor("#000000");
    doc.y = 150;
  }

  // Add main content to PDF
  addContent(doc, data, options) {
    // Title
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(options.title || "Expense Report", 50, doc.y, { align: "left" });

    doc.moveDown(2);

    // Convert HTML data to plain text or parse specific content
    // This is a simple example - you might need to parse your HTML data
    const textContent = this.htmlToText(data);

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(textContent, 50, doc.y, {
        width: doc.page.width - 100,
        align: "left",
      });
  }

  // Simple HTML to text conversion
  htmlToText(html) {
    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
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

export default new PDFService();
