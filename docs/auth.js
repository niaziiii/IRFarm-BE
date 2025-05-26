/**
 * @swagger
 * components:
 *   schemas:
 *     Auth:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: The unique identifier for the customer
 *         password:
 *           type: string
 *           description: The unique identifier for the customer
 *       example:
 *         email: "admin@gmail.com"
 *         password: "12345"
 *     AuthUpdateResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "66997eb38a408696d1b798b7"
 *             name:
 *               type: string
 *               example: "Admin"
 *             contact_type:
 *               type: string
 *               example: "admin"
 *             current_status:
 *               type: string
 *               example: "active"
 *             location:
 *               type: string
 *               example: "USA"
 *             email:
 *               type: string
 *               example: "admin@gmail.com"
 *             password:
 *               type: string
 *               example: "$2b$10$jreD49z8fqIr0tNaCOaMU.ZTGWv6yevCf7idZxAHGL9IRK.I7wsRm"
 *             role:
 *               type: string
 *               example: "admin"
 *             createdOn:
 *               type: string
 *               format: date-time
 *               example: "2024-07-18T20:44:35.167Z"
 *             modifiedOn:
 *               type: string
 *               format: date-time
 *               example: "2024-07-18T20:44:35.167Z"
 *             __v:
 *               type: number
 *               example: 0
 *         message:
 *           type: string
 *           example: "success"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Operations related to account information
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Auth'
 *       example:
 *         email: "awais@admin.com"
 *         password: "12345"
 *     responses:
 *       201:
 *         description: Authentication successful, returning user details and token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthUpdateResponse'
 */
/**
 * @swagger
 * /api/v1/auth/authenticate:
 *   get:
 *     summary: Authenticate user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Authentication successful, returning user details and token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthUpdateResponse'
 */
