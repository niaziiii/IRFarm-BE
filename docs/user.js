/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - cnic
 *         - contact_no
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         prefix:
 *           type: string
 *           description: The prefix for the user's name (e.g., Mr., Mrs.)
 *         name:
 *           type: string
 *           description: The full name of the user
 *         email:
 *           type: string
 *           description: The email address of the user
 *         password:
 *           type: string
 *           description: The user's password
 *         cnic:
 *           type: string
 *           description: The CNIC (National ID) of the user
 *         contact_no:
 *           type: string
 *           description: The contact number of the user
 *         image:
 *           type: string
 *           description: URL to the user's profile image
 *         address:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *               description: The country where the user is located
 *             province:
 *               type: string
 *               description: The province or state where the user is located
 *             city:
 *               type: string
 *               description: The city where the user is located
 *         status:
 *           type: string
 *           description: Whether the user account is active
 *         store_id:
 *           type: string
 *           description: The store ID associated with the user (not required for 'super_admin')
 *         role:
 *           type: string
 *           enum: ["super_admin", "manager", "user"]
 *           description: The role of the user
 *       example:
 *         prefix: "Mr."
 *         name: "John Doe"
 *         email: "john@example.com"
 *         password: "12345"
 *         cnic: "12345-6789012-3"
 *         contact_no: "+1234567890"
 *         image: ""
 *         address:
 *           country: "USA"
 *           province: "NY"
 *           city: "New York"
 *         status: "active"
 *         store_id: "6143b0c8f1e8e93688d0a61f"
 *         role: "manager"
 *     UserUpdateResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User updated successfully"
 *     UserDeleteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User and related data deleted successfully"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Parent tag for user-related operations
 */

/**
 * @swagger
 * /api/v1/user/list:
 *   post:
 *     summary: Returns the list of all users
 *     tags: [User]
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
 *               role:
 *                 type: string
 *                 enum: [manager, user]
 *                 description: Filter companies by status (manager, user)
 *                 example: manager
 *               order:
 *                 type: string
 *                 enum: [asc,desc]
 *                 description: Sort companies alphabetically from A-Z
 *                 example: asc
 *     responses:
 *       200:
 *         description: The list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/v1/user/create:
 *   post:
 *     summary: Create a new user
 *     description: |
 *       - Endpoint to create a new user with specific rules based on roles:
 *         * For **super_admin**:
 *           - To create a `manager`, you must provide `store_id`.
 *           - To create a `user`, you must provide `user_id`.
 *           - If creating a `user`, the associated `store_id` will be automatically populated from the user's data.
 *         * For **manager**:
 *           - Managers are not authorized to create other managers.
 *           - The `store_id` for new users will be set to the manager's store_id.
 *         - **Note:** Email will be converted to lowercase before saving.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: The user was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/v1/user/create-admin:
 *   post:
 *     summary: Create a new Admin
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: The user was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/v1/user/profile:
 *   get:
 *     summary: Get logged-in user's profile
 *     description: |
 *       - Retrieves profile information from the JWT payload of the logged-in user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/v1/user/single/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user was retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/v1/user/edit/{id}:
 *   put:
 *     summary: Update user by ID
 *     description: |
 *       - This endpoint is only accessible by **super_admin** and **manager** roles.
 *         * For **super_admin**:
 *           - Can update any user's details including role.
 *         * For **manager**:
 *           - Can update users they created but cannot promote a `user` to `manager`.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The user was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserUpdateResponse'
 */

/**
 * @swagger
 * /api/v1/user/update-profile:
 *   put:
 *     summary: Update logged-in user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The user profile was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserUpdateResponse'
 */

/**
 * @swagger
 * /api/v1/user/delete/{id}:
 *   delete:
 *     summary: Remove a user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user was deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDeleteResponse'
 */

/**
 * @swagger
 * /api/v1/user/managers:
 *   get:
 *     summary: Returns the list of all managers
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of managers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
