/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - customer_type
 *         - name
 *         - cnic
 *         - contact_no
 *         - opening_type
 *         - opening_balance
 *         - opening_date
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the customer
 *         customer_type:
 *           type: string
 *           description: The type of customer (e.g., contractor, general)
 *         code:
 *           type: string
 *           description: A unique code for the customer
 *         name:
 *           type: string
 *           description: The name of the customer
 *         cnic:
 *           type: string
 *           description: The CNIC (National ID) of the customer
 *         contact_no:
 *           type: string
 *           description: The contact number of the customer
 *         image:
 *           type: string
 *           description: URL of the customer's image
 *           default: ""
 *         reference:
 *           type: string
 *           description: Reference for the customer
 *           default: ""
 *         description:
 *           type: string
 *           description: Additional information about the customer
 *           default: ""
 *         address:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *               description: The customer's country
 *               default: ""
 *             province:
 *               type: string
 *               description: The customer's province
 *               default: ""
 *             city:
 *               type: string
 *               description: The customer's city
 *               default: ""
 *         opening_type:
 *           type: string
 *           enum: ["debit", "credit"]
 *           description: The opening type of the customer account
 *         opening_balance:
 *           type: number
 *           description: The initial balance of the customer account
 *           default: 0
 *         debit_amount:
 *           type: number
 *           description: The initial debit_amount of the customer account
 *           default: 0
 *         credit_amount:
 *           type: number
 *           description: The initial credit_amount of the customer account
 *           default: 0
 *         debit_limit:
 *           type: number
 *           description: The maximum debit limit for the customer
 *           default: 0
 *         opening_date:
 *           type: string
 *           format: date-time
 *           description: The date when the account was opened
 *           default: "2024-11-27T00:00:00.000Z"
 *       example:
 *         customer_type: "general"
 *         code: "C12345"
 *         name: "John Doe"
 *         cnic: "12345-6789012-3"
 *         contact_no: "+1234567890"
 *         image: "https://example.com/johndoe.jpg"
 *         reference: "Referred by Jane"
 *         description: "Preferred customer"
 *         address:
 *           country: "USA"
 *           province: "California"
 *           city: "Los Angeles"
 *         opening_type: "credit"
 *         opening_balance: 500
 *         credit_amount: 0
 *         debit_amount: 5000
 *         debit_limit: 10000
 *         opening_date: "2024-11-27T00:00:00.000Z"
 */

/**
 * @swagger
 * tags:
 *   - name: Customer
 *     description: Operations related to customer management
 */

/**
 * @swagger
 * /api/v1/customer/list:
 *   post:
 *     summary: Returns the list of customers with filtering and sorting options
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [all, active, inactive]
 *                 description: Filter companies by status (all, active, inactive)
 *                 example: all
 *               order:
 *                 type: string
 *                 enum: [asc,desc]
 *                 description: Sort companies alphabetically from A-Z
 *                 example: asc
 *     responses:
 *       200:
 *         description: The list of filtered and sorted companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 */

/**
 * @swagger
 * /api/v1/customer/create:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       201:
 *         description: The customer was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 */

/**
 * @swagger
 * /api/v1/customer/single/{id}:
 *   get:
 *     summary: Get a customer by ID
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The customer ID
 *     responses:
 *       200:
 *         description: The customer was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 */

/**
 * @swagger
 * /api/v1/customer/edit/{id}:
 *   put:
 *     summary: Update customer by ID
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       200:
 *         description: The customer was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 */

/**
 * @swagger
 * /api/v1/customer/delete/{id}:
 *   delete:
 *     summary: Remove a customer by ID
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The customer ID
 *     responses:
 *       200:
 *         description: The customer was deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Customer deleted successfully"
 */
