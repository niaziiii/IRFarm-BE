/**
 * @swagger
 * components:
 *   schemas:
 *     Unit:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the unit
 *         name:
 *           type: string
 *           description: The name of the unit
 *         status:
 *           type: string
 *           enum: ["active", "inactive"]
 *           default: "active"
 *           description: The status of the unit
 *         description:
 *           type: string
 *           description: A description of the unit
 *         unit_symbol:
 *           type: string
 *           description: The symbol representing the unit
 *         unit_type:
 *           type: string
 *           description: The type of the unit
 *         image:
 *           type: string
 *           description: The URL for the unit image
 *       example:
 *         name: "Kilogram"
 *         status: "active"
 *         description: "Measurement unit for mass"
 *         unit_symbol: "kg"
 *         unit_type: "mass"
 *         image: "https://example.com/unit-image.jpg"
 *     UnitUpdateResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Unit updated successfully"
 *     UnitDeleteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Unit and related data deleted successfully"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Unit
 *     description: Operations related to unit management
 */
/**
 * @swagger
 * /api/v1/unit/list:
 *   post:
 *     summary: Returns the list of all units
 *     tags: [Unit]
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
 *                 $ref: '#/components/schemas/Unit'
 */
/**
 * @swagger
 * /api/v1/unit/create:
 *   post:
 *     summary: Create a new unit
 *     tags: [Unit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Unit'
 *     responses:
 *       201:
 *         description: The unit was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unit'
 */

/**
 * @swagger
 * /api/v1/unit/single/{id}:
 *   get:
 *     summary: Get a unit by ID
 *     tags: [Unit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unit ID
 *     responses:
 *       200:
 *         description: The unit was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unit'
 */

/**
 * @swagger
 * /api/v1/unit/edit/{id}:
 *   put:
 *     summary: Update unit by ID
 *     tags: [Unit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Unit'
 *     responses:
 *       200:
 *         description: The unit was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnitUpdateResponse'
 */

/**
 * @swagger
 * /api/v1/unit/delete/{id}:
 *   delete:
 *     summary: Remove a unit by ID
 *     tags: [Unit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The unit ID
 *     responses:
 *       200:
 *         description: The unit was deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnitDeleteResponse'
 */
