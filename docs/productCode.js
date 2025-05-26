/**
 * @swagger
 * components:
 *   schemas:
 *     ProductCode:
 *       type: object
 *       required:
 *         - prod_code
 *       properties:
 *         prod_code:
 *           type: number
 *           description: The product's unique code identifier
 *       example:
 *         prod_code: 67890
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: ProductCode
 *     description: Operations related to product codes
 */

/**
 * @swagger
 * /api/v1/product-code/list:
 *   post:
 *     summary: Returns the list of all product-codes
 *     tags: [ProductCode]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [all, active, inactive]
 *                 description: Filter product-codes by status (all, active, inactive)
 *                 example: all
 *               order:
 *                 type: string
 *                 enum: [asc,desc]
 *                 description: Sort product-codes alphabetically from A-Z
 *                 example: asc
 *     responses:
 *       200:
 *         description: The list of product-codes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductCode'
 */

/**
 * @swagger
 * /api/v1/product-code/validate:
 *   get:
 *     summary: Validate a product code or registration number
 *     tags: [ProductCode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prod_code
 *         schema:
 *           type: string
 *         required: false
 *         description: The product code to validate
 *       - in: query
 *         name: reg_no
 *         schema:
 *           type: string
 *         required: false
 *         description: The registration number to validate
 *     responses:
 *       200:
 *         description: Validation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Validation successful
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Either 'prod_code' or 'reg_no' must be provided.
 */
