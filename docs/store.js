/**
 * @swagger
 * components:
 *   schemas:
 *     Store:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the store
 *         name:
 *           type: string
 *           description: The name of the store or warehouse
 *         description:
 *           type: string
 *           description: A description of the store or warehouse
 *         image:
 *           type: string
 *           description: An image or logo representing the store or warehouse
 *         address:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *               description: The country where the store or warehouse is located
 *             province:
 *               type: string
 *               description: The province or state where the store or warehouse is located
 *             city:
 *               type: string
 *               description: The city where the store or warehouse is located
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *                 description: The product ID linked to the store or warehouse
 *               quantity:
 *                 type: number
 *                 description: The quantity of the product in the store or warehouse
 *       example:
 *         name: "Central Warehouse"
 *         description: "Main storage facility for electronics"
 *         image: "warehouse.png"
 *         address:
 *           country: "USA"
 *           province: "NY"
 *           city: "New York"
 *         products:
 *           - product_id: "64f40bfbd74f5eab3d18a0b7"
 *             quantity: 150
 *     StoreUpdateResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Store updated successfully"
 *     StoreDeleteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Store and related data deleted successfully"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Store
 *     description: Parent tag for store-related operations
 */
/**
 * @swagger
 * /api/v1/store/list:
 *   post:
 *     summary: Returns the list of companies with filtering and sorting options
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *                 $ref: '#/components/schemas/Store'
 */

/**
 * @swagger
 * /api/v1/store/product-stats:
 *   get:
 *     summary: Returns the stats of products
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 */

/**
 * @swagger
 * /api/v1/store/create:
 *   post:
 *     summary: Create a new store
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Store'
 *     responses:
 *       201:
 *         description: The store was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 */

/**
 * @swagger
 * /api/v1/store/single/{id}:
 *   get:
 *     summary: Get a store by ID
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     responses:
 *       200:
 *         description: The store was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 */

/**
 * @swagger
 * /api/v1/store/edit/{id}:
 *   put:
 *     summary: Update store by ID
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Store'
 *     responses:
 *       200:
 *         description: The store was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreUpdateResponse'
 */

/**
 * @swagger
 * /api/v1/store/delete/{id}:
 *   delete:
 *     summary: Remove a store by ID
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     responses:
 *       200:
 *         description: The store was deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreDeleteResponse'
 */

/**
 * @swagger
 * /api/v1/store/products-from-store/{id}:
 *   get:
 *     summary: Get products from a store by store ID
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The store ID
 *     responses:
 *       200:
 *         description: The products were retrieved from the store
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 */

/**
 * @swagger
 * /api/v1/store/available:
 *   get:
 *     summary: Get available stores list
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The available stores were retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 */
