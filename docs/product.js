/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - prod_name
 *         - sku
 *         - company
 *         - category
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the product
 *         prod_name:
 *           type: string
 *           description: The name of the product
 *         status:
 *           type: string
 *           description: The status of the product enum["active","inactive"]
 *         sku:
 *           type: string
 *           description: The SKU or barcode of the product
 *         company:
 *           type: string
 *           description: The company associated with the product
 *         batch_code:
 *           type: string
 *           description: The batch code of the product
 *         type:
 *           type: string
 *           enum: ["regular", "trial",]
 *           description: The type of the product
 *         category:
 *           type: string
 *           description: The category of the product (reference to Category)
 *         whole_sale_price:
 *           type: number
 *           description: The wholesale price of the product
 *         minimum_sale_price:
 *           type: number
 *           description: The minimum price of the product
 *         profit_calculate_in_rupees:
 *           type: number
 *           description: Calculated Profit
 *         purchase_price:
 *           type: number
 *           description: The price at which the product was purchased
 *         actual_retail_price:
 *           type: number
 *           description: The price at which the product was purchased
 *         maximum_retail_price:
 *           type: number
 *           description: The maximum retail price of the product
 *         minimum_stock_alert:
 *           type: number
 *           description: The minimum stock level at which an alert should be triggered
 *         images:
 *           type: array
 *           description: The images URL for the product
 *         prod_description:
 *           type: string
 *           description: A description of the product
 *         unit_profile:
 *           type: object
 *           properties:
 *             unit:
 *               type: string
 *               description: The country of the company
 *             value:
 *               type: string
 *               description: The province of the company
 *         manufactured_date:
 *           type: string
 *           format: date
 *           description: The manufactured date of the product
 *         expire_date:
 *           type: string
 *           format: date
 *           description: The expire date of the product
 *         quantity:
 *           type: number
 *           description: The quantity of the product available in stock
 *         created_by:
 *           type: string
 *           description: The user who created the product (reference to User)
 *       example:
 *         prod_name: "Smartphone"
 *         status: "active"
 *         sku: "SM1234"
 *         prod_code: "9876"
 *         type: "regular"
 *         expire_date: "2025-04-01"
 *         expiry_date_alert: "2025-04-01"
 *         manufactured_date: "2024-09-01"
 *         whole_sale_price: 450.00
 *         actual_retail_price: 450.00
 *         minimum_sale_price: 400.00
 *         purchase_price: 350.00
 *         maximum_retail_price: 600.00
 *         minimum_stock_alert: 10
 *         images: ["smartphone.png","smartphone.png"]
 *         batch_code: "Prod-9876"
 *         prod_description: "A high-end smartphone with advanced features."
 *         unit_profile:
 *           unit: "666a1adb4a817baa96f0387a"
 *           value: "5pcs"
 *         quantity: 100
 *         company: "666a1adb4a817baa96f0387a"
 *         category: "666a1adb4a817baa96f0387a"
 *     ProductUpdateResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Product updated successfully"
 *     ProductDeleteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Product and related data deleted successfully"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Parent tag for product-related operations
 */

/**
 * @swagger
 * /api/v1/product/list:
 *   post:
 *     summary: Returns the list of all products based on the filter query
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filter_query:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: Type of the product
 *                     example: "regular"
 *                   status:
 *                     type: string
 *                     description: Status of the product
 *                     example: "inactive"
 *                   company:
 *                     type: string
 *                     description: Company ID for the product
 *                     example: "67095a2f731a7ca6ca8484c3"
 *                   sort_by_quantity:
 *                     type: object
 *                     properties:
 *                       minimum:
 *                         type: string
 *                         example: "1"
 *                       maximum:
 *                         type: string
 *                         example: "100"
 *                   category:
 *                     type: string
 *                     description: Category ID for the product
 *                     example: "67083f2c756c4e285665ec08"
 *                   wear_houses:
 *                     type: string
 *                     description: Warehouse ID associated with the product
 *                     example: "67095a2f731a7ca6ca8484c3"
 *                   sort_by_mrp:
 *                     type: object
 *                     properties:
 *                       minimum:
 *                         type: string
 *                         example: "1"
 *                       maximum:
 *                         type: string
 *                         example: "500"
 *                   expire_date:
 *                     type: object
 *                     properties:
 *                       from:
 *                         type: string
 *                         format: date
 *                         example: "2024-10-28"
 *                       to:
 *                         type: string
 *                         format: date
 *                         example: "2024-10-12"
 *     responses:
 *       200:
 *         description: The list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/v1/product/create:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: The product was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/v1/product/single/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: The product was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/v1/product/edit/{id}:
 *   put:
 *     summary: Update product by ID
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: The product was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductUpdateResponse'
 */

/**
 * @swagger
 * /api/v1/product/delete/{id}:
 *   delete:
 *     summary: Remove a product by ID
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: The product was deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductDeleteResponse'
 */
