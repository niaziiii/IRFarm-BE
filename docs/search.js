/**
 * @swagger
 * components:
 *   schemas:
 *     Search:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *           description: The search query
 *       example:
 *         query: "tes"
 */

/**
 * @swagger
 * tags:
 *   - name: Search
 *     description: Parent tag for search-related operations
 */

/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     summary: Get searchable results
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: The searchable text
 *     responses:
 *       200:
 *         description: Search results were retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Search'
 *       400:
 *         description: Bad request (missing or invalid query)
 */
