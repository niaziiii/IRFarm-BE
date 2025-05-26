/**
 * @swagger
 * components:
 *   schemas:
 *     FileUploader:
 *       type: object
 *       properties:
 *         files:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Array of data files to upload
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: File Upload
 *     description: File upload operations
 */

/**
 * @swagger
 * /api/v1/file:
 *   post:
 *     summary: Upload multiple files
 *     tags: [File Upload]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Successfully uploaded the files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Images uploaded successfully"
 *                 filenames:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["image1-1721684906318.png", "image2-1721684906319.jpg"]
 */
