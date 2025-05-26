import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/awsConfig.js";
import AppError from "../utils/apiError.js";

class ImageUploadService {
  async imageUpload(request) {
    try {
      if (!request.processedImages || request.processedImages.length === 0) {
        throw new AppError("Images must be provided.");
      }

      const uploadedFiles = await Promise.all(
        request.processedImages.map(async (file) => {
          // Define S3 upload parameters
          const fileKey = `productimages/${Date.now()}_${file.originalname}`;
          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          };

          const command = new PutObjectCommand(params);
          await s3Client.send(command);

          const file_url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

          return {
            file_name: file.originalname,
            file_url,
          };
        })
      );

      return uploadedFiles;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new AppError(`Image upload failed ${JSON.stringify(error)}`, 500);
    }
  }
}

export default new ImageUploadService();
