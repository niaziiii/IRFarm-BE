/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       required:
 *         - date
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the sale
 *         date:
 *           type: string
 *           format: date-time
 *           description: The date of the sale
 *         note:
 *           type: string
 *           description: A note for the sale
 *           example: "Deliver to the back entrance."
 *         customer:
 *           type: string
 *           description: The ID of the customer associated with the sale
 *         customer_payment_mode:
 *           type: object
 *           properties:
 *             payment_mode:
 *               type: string
 *               enum: ["cash", "credit"]
 *               description: The payment mode used by the customer
 *             mobile_no:
 *               type: string
 *               description: The mobile number for payment confirmation
 *               example: "1234567890"
 *             paid:
 *               type: number
 *               description: The amount paid by the customer
 *               example: 300
 *             balance:
 *               type: number
 *               description: The remaining balance
 *               example: 200
 *             net_receivable:
 *               type: number
 *               description: The net amount receivable
 *               example: 450
 *             cash_on_delivery:
 *               type: boolean
 *               description: Indicates if cash on delivery is applicable
 *               default: false
 *         sold_items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: The ID of the product sold
 *               quantity:
 *                 type: number
 *                 description: The quantity of the product sold
 *           description: A list of items sold in the sale
 *       example:
 *         date: "2024-12-04T12:00:00Z"
 *         shipping_charges: 20
 *         note: "Urgent delivery."
 *         customer: "647f1e5c6d0e9e001cfd5e2a"
 *         customer_payment_mode:
 *           payment_mode: "credit"
 *           mobile_no: "9876543210"
 *           paid: 500
 *           balance: 500
 *           net_receivable: 1000
 *           cash_on_delivery: false
 *         sold_items:
 *           - product: "647f1e5c6d0e9e001cfd5e2c"
 *             quantity: 2
 *           - product: "647f1e5c6d0e9e001cfd5e2d"
 *             quantity: 1
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Sale
 *     description: Operations related to sale management
 */
/**
 * @swagger
 * /api/v1/sale/list:
 *   post:
 *     summary: Returns the list of all units
 *     tags: [Sale]
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
 *                 description: Filter units by status (all, active, inactive)
 *                 example: all
 *               order:
 *                 type: string
 *                 enum: [asc,desc]
 *                 description: Sort units alphabetically from A-Z
 *                 example: asc
 *     responses:
 *       200:
 *         description: The list of units
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sale'
 */
/**
 * @swagger
 * /api/v1/sale/create:
 *   post:
 *     summary: Create a new sale
 *     tags: [Sale]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Sale'
 *     responses:
 *       201:
 *         description: The sale was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sale'
 */

/**
 * @swagger
 * /api/v1/sale/single/{id}:
 *   get:
 *     summary: Get a sale by ID
 *     tags: [Sale]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The sale ID
 *     responses:
 *       200:
 *         description: The sale was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sale'
 */

/**
 * @swagger
 * /api/v1/sale/edit/{id}:
 *   put:
 *     summary: Update sale by ID
 *     tags: [Sale]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Sale'
 *     responses:
 *       200:
 *         description: The sale was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnitUpdateResponse'
 */

/**
 * @swagger
 * /api/v1/sale/delete/{id}:
 *   delete:
 *     summary: Remove a sale by ID
 *     tags: [Sale]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The sale ID
 *     responses:
 *       200:
 *         description: The sale was deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnitDeleteResponse'
 */
