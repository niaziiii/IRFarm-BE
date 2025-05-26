/**
 * @swagger
 * components:
 *   schemas:
 *     Warehouse:
 *       type: object
 *       required:
 *         - name
 *         - store_id
 *         - city
 *         - manager
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the warehouse
 *         name:
 *           type: string
 *           description: The name of the warehouse
 *         store_id:
 *           type: string
 *           description: Reference to the associated store ID
 *         city:
 *           type: string
 *           description: The city where the warehouse is located
 *         province:
 *           type: string
 *           description: The province or state where the warehouse is located
 *         country:
 *           type: string
 *           description: The country where the warehouse is located
 *         address:
 *           type: string
 *           description: The full address of the warehouse
 *         description:
 *           type: string
 *           description: A description of the warehouse
 *         image:
 *           type: string
 *           description: An image or logo representing the warehouse
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *                 description: Reference to the associated product ID
 *               quantity:
 *                 type: integer
 *                 description: Quantity of the product in the warehouse
 *                 default: 0
 *         manager:
 *           type: string
 *           description: Reference to the user who manages the warehouse
 *       example:
 *         name: "Main Warehouse"
 *         store_id: "6143b0c8f1e8e93688d0a61d"
 *         city: "Los Angeles"
 *         province: "CA"
 *         country: "USA"
 *         address: "456 Industrial St, Los Angeles, CA 90021"
 *         description: "Primary storage for electronics"
 *         image: "warehouse_image.png"
 *         products:
 *           - product_id: "6143b0c8f1e8e93688d0a61e"
 *             quantity: 100
 *         manager: "6143b0c8f1e8e93688d0a61f"
 *     WarehouseUpdateResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Warehouse updated successfully"
 *     WarehouseDeleteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Warehouse and related data deleted successfully"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Warehouse
 *     description: Parent tag for warehouse-related operations
 */

/**
 * @swagger
 * /api/v1/warehouse/list:
 *   get:
 *     summary: Returns the list of all warehouses
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of warehouses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Warehouse'
 */

/**
 * @swagger
 * /api/v1/warehouse/create:
 *   post:
 *     summary: Create a new warehouse
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Warehouse'
 *     responses:
 *       201:
 *         description: The warehouse was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warehouse'
 */

/**
 * @swagger
 * /api/v1/warehouse/single/{id}:
 *   get:
 *     summary: Get a warehouse by ID
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The warehouse ID
 *     responses:
 *       200:
 *         description: The warehouse was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warehouse'
 */

/**
 * @swagger
 * /api/v1/warehouse/edit/{id}:
 *   put:
 *     summary: Update warehouse by ID
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The warehouse ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Warehouse'
 *     responses:
 *       200:
 *         description: The warehouse was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WarehouseUpdateResponse'
 */

/**
 * @swagger
 * /api/v1/warehouse/delete/{id}:
 *   delete:
 *     summary: Remove a warehouse by ID
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The warehouse ID
 *     responses:
 *       200:
 *         description: The warehouse was deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WarehouseDeleteResponse'
 */
