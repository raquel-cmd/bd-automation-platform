import express from 'express';
import {
  // Vacation plan controllers
  getVacations,
  getVacation,
  createVacation,
  updateVacation,
  deleteVacation,
  // Destination controllers
  createDestination,
  editDestination,
  removeDestination,
  reorderVacationDestinations,
  // Expense controllers
  createExpense,
  editExpense,
  removeExpense,
  getVacationBudget,
  // Activity controllers
  getVacationActivities,
  createActivity,
  editActivity,
  removeActivity,
  // Itinerary & planning controllers
  getVacationItinerary,
  getVacationChecklist,
} from '../controllers/vacationController.js';

const router = express.Router();

// ===========================================
// VACATION PLAN ROUTES
// ===========================================

// GET /api/vacations - List all vacation plans
router.get('/', getVacations);

// GET /api/vacations/:id - Get a single vacation plan with details
router.get('/:id', getVacation);

// POST /api/vacations - Create a new vacation plan
router.post('/', createVacation);

// PUT /api/vacations/:id - Update a vacation plan
router.put('/:id', updateVacation);

// DELETE /api/vacations/:id - Delete a vacation plan
router.delete('/:id', deleteVacation);

// ===========================================
// DESTINATION ROUTES
// ===========================================

// POST /api/vacations/:vacationId/destinations - Add a destination
router.post('/:vacationId/destinations', createDestination);

// PUT /api/vacations/:vacationId/destinations/reorder - Reorder destinations
router.put('/:vacationId/destinations/reorder', reorderVacationDestinations);

// PUT /api/vacations/:vacationId/destinations/:id - Update a destination
router.put('/:vacationId/destinations/:id', editDestination);

// DELETE /api/vacations/:vacationId/destinations/:id - Remove a destination
router.delete('/:vacationId/destinations/:id', removeDestination);

// ===========================================
// EXPENSE ROUTES
// ===========================================

// GET /api/vacations/:vacationId/budget - Get budget summary
router.get('/:vacationId/budget', getVacationBudget);

// POST /api/vacations/:vacationId/expenses - Add an expense
router.post('/:vacationId/expenses', createExpense);

// PUT /api/vacations/:vacationId/expenses/:id - Update an expense
router.put('/:vacationId/expenses/:id', editExpense);

// DELETE /api/vacations/:vacationId/expenses/:id - Remove an expense
router.delete('/:vacationId/expenses/:id', removeExpense);

// ===========================================
// ACTIVITY ROUTES
// ===========================================

// GET /api/vacations/:vacationId/activities - List activities
router.get('/:vacationId/activities', getVacationActivities);

// POST /api/vacations/:vacationId/activities - Add an activity
router.post('/:vacationId/activities', createActivity);

// PUT /api/vacations/:vacationId/activities/:id - Update an activity
router.put('/:vacationId/activities/:id', editActivity);

// DELETE /api/vacations/:vacationId/activities/:id - Remove an activity
router.delete('/:vacationId/activities/:id', removeActivity);

// ===========================================
// ITINERARY & PLANNING ROUTES
// ===========================================

// GET /api/vacations/:vacationId/itinerary - Get day-by-day itinerary
router.get('/:vacationId/itinerary', getVacationItinerary);

// GET /api/vacations/:vacationId/checklist - Get planning checklist
router.get('/:vacationId/checklist', getVacationChecklist);

export default router;
