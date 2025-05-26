/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - name
 *         - email_address
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the company
 *         name:
 *           type: string
 *           description: The name of the company
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *           description: The status of the company
 *         registration_no:
 *           type: string
 *           description: The company's registration number
 *         address:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *               description: The country of the company
 *             province:
 *               type: string
 *               description: The province of the company
 *             city:
 *               type: string
 *               description: The city of the company
 *         contact_no:
 *           type: array
 *           items:
 *             type: string
 *           description: Contact numbers for the company
 *         email_address:
 *           type: string
 *           description: The email address of the company
 *         website:
 *           type: string
 *           description: The company's website URL
 *         instagram:
 *           type: array
 *           items:
 *             type: string
 *           description: Instagram handles or URLs of the company
 *         image:
 *           type: string
 *           description: URL of the company's image
 *         up_till:
 *           type: string
 *           format: date
 *           description: The date until which the company registration is valid
 *         reference:
 *           type: string
 *           description: A reference code for the company
 *         opening_balance:
 *           type: string
 *           description: The company's advance payment
 *         limit:
 *           type: string
 *           description: The company's credit limit or borrow limit
 *         account_details:
 *           type: object
 *           properties:
 *             account_holder_name:
 *               type: string
 *               description: The name of the account holder
 *             bank_name:
 *               type: string
 *               description: The name of the bank
 *             account_number:
 *               type: string
 *               description: The account number of the company
 *             iban:
 *               type: string
 *               description: The IBAN number of the company
 *             branch_address:
 *               type: string
 *               description: The branch address of the bank
 *             agreement_expiry_date:
 *               type: string
 *               format: date
 *               description: Expiry date of the credit agreement with the bank
 *       example:
 *         name: "TARA-GROUP"
 *         status: "active"
 *         registration_no: "ABC123456"
 *         address:
 *           country: "USA"
 *           province: "California"
 *           city: "Los Angeles"
 *         contact_no: ["1234567890", "0987654321"]
 *         email_address: "contact@taragroup.com"
 *         website: "https://www.taragroup.com"
 *         instagram: ["@taragroup"]
 *         image: "https://example.com/image.png"
 *         up_till: "2025-12-31"
 *         reference: "REF2024"
 *         account_details:
 *           account_holder_name: "John Doe"
 *           bank_name: "Bank of America"
 *           account_number: "123456789012"
 *           iban: "US1234567890"
 *           branch_address: "123 Main St, Los Angeles, CA"
 *           opening_balance: 5000
 *           credit_limit: 10000
 *           agreement_expiry_date: "2025-12-31"
 */

/**
 * @swagger
 * tags:
 *   - name: Company
 *     description: Parent tag for company-related operations
 */

/**
 * @swagger
 * /api/v1/company/list:
 *   post:
 *     summary: Returns the list of companies with filtering and sorting options
 *     tags: [Company]
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
 *                 $ref: '#/components/schemas/Company'
 */

/**
 * @swagger
 * /api/v1/company/products:
 *   post:
 *     summary: Returns the list of companies with filtering and sorting options
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: string
 *                 description: Filter company products by company_id
 *                 example: "666a1adb4a817baa96f0387a"
 *     responses:
 *       200:
 *         description: The list of filtered and sorted companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 */

/**
 * @swagger
 * /api/v1/company/create:
 *   post:
 *     summary: Create a new company
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: The company was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 */

/**
 * @swagger
 * /api/v1/company/edit/{id}:
 *   put:
 *     summary: Update company by ID
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: The company was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyUpdateResponse'
 */
/**
 * @swagger
 * /api/v1/company/single/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company ID
 *     responses:
 *       200:
 *         description: The company was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 */

/**
 * @swagger
 * /api/v1/company/delete/{id}:
 *   delete:
 *     summary: Remove a company by ID
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company ID
 *     responses:
 *       200:
 *         description: The company was deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyDeleteResponse'
 */

/**
 * @swagger
 * /api/v1/company/stats:
 *   post:
 *     summary: Returns the list of companies with filtering and sorting options
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: string
 *                 description: calculate companies stats
 *                 example: "67083f2c756c4e285665ec08"
 *     responses:
 *       200:
 *         description: The list of filtered and sorted companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 */
