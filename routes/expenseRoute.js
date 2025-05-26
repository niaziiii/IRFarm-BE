import express from "express";
import expenseController from "../controllers/expenseController.js";

const router = express.Router();

router.post("/create", expenseController.createExpense);

router.get("/list", expenseController.getAllExpenses);

router.get("/stats", expenseController.getExpenseStats);

router.get("/single/:id", expenseController.getExpenseById);

router.put("/edit/:id", expenseController.updateExpense);

router.delete("/delete/:id", expenseController.deleteExpense);

router.post("/category/create", expenseController.createExpenseCategory);
router.get("/category/list", expenseController.getAllExpensesCategory);

export default router;
