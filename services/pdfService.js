import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

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
    const storeInfoHTML = this.generateStoreInfoHTML(options.storeInfo);

    try {
      // Generate HTML content
      const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${options.title || "Expense Report"}</title>
          ${this.getCommonStyles()}
        </head>
        <body>
          ${storeInfoHTML}
          <div class="content">
           ${data}
          </div>
        </body>
      </html>
    `;

      const pdfBuffer = await this.generatePDFFromHTML(htmlContent);
      const fileName = `expense-report-${uuidv4()}.pdf`;

      // Production logic (e.g., upload to S3)
      const url = await this.uploadToS3(pdfBuffer, fileName);
      return { url };
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // Generate store info header HTML
  generateStoreInfoHTML(storeInfo) {
    return `
      <div class="store-header">
        <div class="store-info">
          <img  src="${storeInfo.logo || ""}" alt="${
      storeInfo.name || "IRFARM"
    } Logo" class="store-logo" style="max-width: 100px; height: 100px;" />
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

  // Get common CSS styles for expense report PDF
  getCommonStyles() {
    return `
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
          padding: 10px;
          margin-bottom: 20px;
          text-align: center;
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
        
        @media print {
          body {
            padding: 0;
          } 
        }
      </style>
    `;
  }

  // Convert HTML to PDF using Puppeteer
  async generatePDFFromHTML(htmlContent) {
    let browser;
    try {
      console.log("NODE_ENV:", process.env.NODE_ENV);
      console.log(
        "PUPPETEER_EXECUTABLE_PATH:",
        process.env.PUPPETEER_EXECUTABLE_PATH
      );

      if (process.env.NODE_ENV === "development") {
        // Use regular puppeteer in development
        console.log("Using regular puppeteer for development");
        const regularPuppeteer = await import("puppeteer");
        browser = await regularPuppeteer.default.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
      } else if (
        process.env.NODE_ENV === "production" &&
        process.env.PUPPETEER_EXECUTABLE_PATH
      ) {
        // Use system Google Chrome in AWS App Runner production
        console.log("Using system Google Chrome for AWS App Runner");
        browser = await puppeteer.launch({
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
          ],
        });
      } else {
        // Use @sparticuz/chromium for Vercel/other serverless
        console.log("Using @sparticuz/chromium for serverless");
        browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        });
      }

      const page = await browser.newPage();
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });

      return pdfBuffer;
    } catch (error) {
      console.error("PDF generation error:", error);
      throw new Error(`PDF generation error: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // Upload PDF buffer to S3
  async uploadToS3(pdfBuffer, fileName) {
    try {
      const uploadParams = {
        Bucket: this.bucketName,
        Key: `pdfs/${fileName}`,
        Body: pdfBuffer,
        ContentType: "application/pdf",
        // ACL: "public-read", // Make file publicly accessible
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
