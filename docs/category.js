/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the category
 *         name:
 *           type: string
 *           description: The name of the category
 *         description:
 *           type: string
 *           description: A description of the category
 *       example:
 *         name: "Electronics"
 *         description: "Category for all electronic products"
 *     CategoryUpdateResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Category updated successfully"
 *     CategoryDeleteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Category and related data deleted successfully"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Category
 *     description: Parent tag for category-related operations
 */

/**
 * @swagger
 * /api/v1/category/list:
 *   get:
 *     summary: Returns the list of all categories
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /api/v1/category/filtered-list:
 *   post:
 *     summary: Returns the list of all categories
 *     tags: [Category]
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
 *               sort_by_quantity:
 *                 type: object
 *                 properties:
 *                   minimum:
 *                     type: number
 *                     example: 1
 *                   maximum:
 *                     type: number
 *                     example: 100
 *     responses:
 *       200:
 *         description: The list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /api/v1/category/create:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: The category was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /api/v1/category/single/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: The category was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /api/v1/category/edit/{id}:
 *   put:
 *     summary: Update category by ID
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: The category was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryUpdateResponse'
 */

/**
 * @swagger
 * /api/v1/category/delete/{id}:
 *   delete:
 *     summary: Remove a category by ID
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: The category was deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryDeleteResponse'
 */
