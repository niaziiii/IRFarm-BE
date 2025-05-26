/**
 * @swagger
 * components:
 *   schemas:
 *     Purchase:
 *       type: object
 *       required:
 *         - date
 *         - order_status
 *         - grand_total
 *         - supplier
 *         - items
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the purchase
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the purchase
 *         location:
 *           type: string
 *           description: Location of the purchase
 *           default: ""
 *         order_status:
 *           type: string
 *           enum: ["received", "pending", "order"]
 *           description: Status of the purchase order
 *         payment_status:
 *           type: string
 *           enum: ["paid", "unpaid"]
 *           description: Payment status of the purchase
 *         purchased_type:
 *           type: string
 *           enum: ["purchased", "returned"]
 *           description: Purchased Type of the purchase
 *         grand_total:
 *           type: number
 *           description: Total amount for the purchase
 *         shipping_charges:
 *           type: number
 *           description: Shipping charges for the purchase
 *         paid:
 *           type: number
 *           description: Amount already paid
 *         discount_amount:
 *           type: number
 *           description: Discount amount applied to_date the purchase
 *         due:
 *           type: number
 *           description: Remaining amount due
 *         note:
 *           type: string
 *           description: Additional notes for the purchase
 *           default: ""
 *         supplier:
 *           type: string
 *           description: The ID of the supplier (Company)
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: Quantity of the product ordered
 *               product:
 *                 type: string
 *                 description: The ID of the product
 *           description: List of products included in the purchase
 *         payment_type:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               description: Type of payment, e.g., 'cash' or 'credit'
 *             cash:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   description: Type of cash payment, e.g., 'online' or 'by_hand'
 *                 by_hand:
 *                   type: object
 *                   properties:
 *                     invoice:
 *                       type: string
 *                       description: Invoice for by-hand cash payment
 *                 online:
 *                   type: object
 *                   properties:
 *                     invoice:
 *                       type: string
 *                       description: Invoice for online cash payment
 *                     receipt:
 *                       type: string
 *                       description: Receipt for online cash payment
 *             credit:
 *               type: object
 *               properties:
 *                 invoice:
 *                   type: string
 *                   description: Invoice for credit payment
 *       example:
 *         date: "2024-10-01"
 *         location: "Warehouse 1"
 *         order_status: "received"
 *         payment_status: "paid"
 *         purchased_type: "purchased"
 *         grand_total: 1200.50
 *         shipping_charges: 50.00
 *         paid: 800.00
 *         discount_amount: 100.00
 *         due: 400.50
 *         note: "Special handling required"
 *         supplier: "603e3c9f062ce7bda0dcb013"
 *         items:
 *           - quantity: 20
 *             product: "605c5f30f5a3b8d4cc9b80b2"
 *           - quantity: 40
 *             product: "605c5f30f5a3b8d4cc9b80b3"
 *         payment_type:
 *           type: "credit"
 *           cash:
 *             type: "by_hand"
 *             by_hand:
 *               invoice: "https://irfarm.s3.eu-north-1.amazonaws.com/productimages/1733206127401_1733118814497_1_7c5d94a0-8c7d-4f05-9c81-ff2f6eab5028_500x.webp"
 *             online:
 *               invoice: "https://irfarm.s3.eu-north-1.amazonaws.com/productimages/1733206151126_1733118814497_1_7c5d94a0-8c7d-4f05-9c81-ff2f6eab5028_500x.webp"
 *               receipt: "https://irfarm.s3.eu-north-1.amazonaws.com/productimages/1733206154364_1733118814497_1_7c5d94a0-8c7d-4f05-9c81-ff2f6eab5028_500x.webp"
 *           credit:
 *             invoice: "https://irfarm.s3.eu-north-1.amazonaws.com/productimages/1733206112398_1733118814497_1_7c5d94a0-8c7d-4f05-9c81-ff2f6eab5028_500x.webp"
 */

/**
 * @swagger
 * tags:
 *   - name: Purchase
 *     description: API for managing purchases
 */

/**
 * @swagger
 * /api/v1/purchase/list:
 *   post:
 *     summary: Returns the list of all purchases based on filter criteria
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               purchased_type:
 *                 type: string
 *                 enum: ["all", "purchased", "returned"]
 *                 default: "all"
 *                 description: Filter purchases by purchased_type
 *               from_date:
 *                 type: string
 *                 format: date
 *                 description: Start date for date range filter
 *               to_date:
 *                 type: string
 *                 format: date
 *                 description: End date for date range filter
 *     responses:
 *       200:
 *         description: The filtered list of purchases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Purchase'
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/purchase/create:
 *   post:
 *     summary: Create a new purchase
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Purchase'
 *     responses:
 *       201:
 *         description: The purchase was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Purchase'
 */

/**
 * @swagger
 * /api/v1/purchase/single/{id}:
 *   get:
 *     summary: Get a purchase by ID
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The purchase ID
 *     responses:
 *       200:
 *         description: The purchase was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Purchase'
 */

/**
 * @swagger
 * /api/v1/purchase/edit/{id}:
 *   put:
 *     summary: Update a purchase by ID
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The purchase ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Purchase'
 *     responses:
 *       200:
 *         description: The purchase was updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Purchase'
 */

/**
 * @swagger
 * /api/v1/purchase/delete/{id}:
 *   delete:
 *     summary: Remove a purchase by ID
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The purchase ID
 *     responses:
 *       200:
 *         description: The purchase was deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Purchase deleted successfully"
 */
