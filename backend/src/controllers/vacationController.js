/**
 * Vacation Planning Agent Controllers
 * Handles all vacation planning API endpoints
 */

import {
  getAllVacationPlans,
  getVacationPlanById,
  createVacationPlan,
  updateVacationPlan,
  deleteVacationPlan,
  addDestination,
  updateDestination,
  deleteDestination,
  reorderDestinations,
  addExpense,
  updateExpense,
  deleteExpense,
  getBudgetSummary,
  addActivity,
  updateActivity,
  deleteActivity,
  getActivities,
  getItinerary,
  getPlanningChecklist,
} from '../lib/vacationDataLoader.js';

// ===========================================
// VACATION PLAN CONTROLLERS
// ===========================================

/**
 * GET /api/vacations
 * Returns all vacation plans with summary data
 */
export const getVacations = async (req, res) => {
  try {
    const { status } = req.query;
    const plans = await getAllVacationPlans({ status });

    res.json({
      success: true,
      total: plans.length,
      vacations: plans,
    });
  } catch (error) {
    console.error('Get vacations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vacation plans',
      message: error.message,
    });
  }
};

/**
 * GET /api/vacations/:id
 * Returns a single vacation plan with all details
 */
export const getVacation = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await getVacationPlanById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Vacation plan not found',
      });
    }

    res.json({
      success: true,
      vacation: plan,
    });
  } catch (error) {
    console.error('Get vacation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vacation plan',
      message: error.message,
    });
  }
};

/**
 * POST /api/vacations
 * Creates a new vacation plan
 */
export const createVacation = async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Name, startDate, and endDate are required',
      });
    }

    const plan = await createVacationPlan(req.body);

    res.status(201).json({
      success: true,
      message: 'Vacation plan created successfully',
      vacation: plan,
    });
  } catch (error) {
    console.error('Create vacation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vacation plan',
      message: error.message,
    });
  }
};

/**
 * PUT /api/vacations/:id
 * Updates a vacation plan
 */
export const updateVacation = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await updateVacationPlan(id, req.body);

    res.json({
      success: true,
      message: 'Vacation plan updated successfully',
      vacation: plan,
    });
  } catch (error) {
    console.error('Update vacation error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Vacation plan not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update vacation plan',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/vacations/:id
 * Deletes a vacation plan and all related data
 */
export const deleteVacation = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteVacationPlan(id);

    res.json({
      success: true,
      message: 'Vacation plan deleted successfully',
    });
  } catch (error) {
    console.error('Delete vacation error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Vacation plan not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete vacation plan',
      message: error.message,
    });
  }
};

// ===========================================
// DESTINATION CONTROLLERS
// ===========================================

/**
 * POST /api/vacations/:vacationId/destinations
 * Adds a destination to a vacation plan
 */
export const createDestination = async (req, res) => {
  try {
    const { vacationId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Destination name is required',
      });
    }

    const destination = await addDestination(vacationId, req.body);

    res.status(201).json({
      success: true,
      message: 'Destination added successfully',
      destination,
    });
  } catch (error) {
    console.error('Create destination error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add destination',
      message: error.message,
    });
  }
};

/**
 * PUT /api/vacations/:vacationId/destinations/:id
 * Updates a destination
 */
export const editDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const destination = await updateDestination(id, req.body);

    res.json({
      success: true,
      message: 'Destination updated successfully',
      destination,
    });
  } catch (error) {
    console.error('Update destination error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Destination not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update destination',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/vacations/:vacationId/destinations/:id
 * Deletes a destination
 */
export const removeDestination = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDestination(id);

    res.json({
      success: true,
      message: 'Destination removed successfully',
    });
  } catch (error) {
    console.error('Delete destination error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Destination not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to remove destination',
      message: error.message,
    });
  }
};

/**
 * PUT /api/vacations/:vacationId/destinations/reorder
 * Reorders destinations in a vacation plan
 */
export const reorderVacationDestinations = async (req, res) => {
  try {
    const { vacationId } = req.params;
    const { destinationIds } = req.body;

    if (!destinationIds || !Array.isArray(destinationIds)) {
      return res.status(400).json({
        success: false,
        error: 'destinationIds array is required',
      });
    }

    const destinations = await reorderDestinations(vacationId, destinationIds);

    res.json({
      success: true,
      message: 'Destinations reordered successfully',
      destinations,
    });
  } catch (error) {
    console.error('Reorder destinations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder destinations',
      message: error.message,
    });
  }
};

// ===========================================
// EXPENSE CONTROLLERS
// ===========================================

/**
 * POST /api/vacations/:vacationId/expenses
 * Adds an expense to a vacation plan
 */
export const createExpense = async (req, res) => {
  try {
    const { vacationId } = req.params;
    const { category, name } = req.body;

    if (!category || !name) {
      return res.status(400).json({
        success: false,
        error: 'Category and name are required',
      });
    }

    const validCategories = ['flights', 'accommodation', 'food', 'activities', 'transport', 'shopping', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
    }

    const expense = await addExpense(vacationId, req.body);

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense,
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add expense',
      message: error.message,
    });
  }
};

/**
 * PUT /api/vacations/:vacationId/expenses/:id
 * Updates an expense
 */
export const editExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await updateExpense(id, req.body);

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense,
    });
  } catch (error) {
    console.error('Update expense error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update expense',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/vacations/:vacationId/expenses/:id
 * Deletes an expense
 */
export const removeExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteExpense(id);

    res.json({
      success: true,
      message: 'Expense removed successfully',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to remove expense',
      message: error.message,
    });
  }
};

/**
 * GET /api/vacations/:vacationId/budget
 * Returns budget summary for a vacation plan
 */
export const getVacationBudget = async (req, res) => {
  try {
    const { vacationId } = req.params;
    const summary = await getBudgetSummary(vacationId);

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: 'Vacation plan not found',
      });
    }

    res.json({
      success: true,
      budget: summary,
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget summary',
      message: error.message,
    });
  }
};

// ===========================================
// ACTIVITY CONTROLLERS
// ===========================================

/**
 * GET /api/vacations/:vacationId/activities
 * Returns activities for a vacation, optionally filtered by destination
 */
export const getVacationActivities = async (req, res) => {
  try {
    const { vacationId } = req.params;
    const { destinationId } = req.query;

    const activities = await getActivities(vacationId, destinationId);

    res.json({
      success: true,
      total: activities.length,
      activities,
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities',
      message: error.message,
    });
  }
};

/**
 * POST /api/vacations/:vacationId/activities
 * Adds an activity to a vacation plan
 */
export const createActivity = async (req, res) => {
  try {
    const { vacationId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Activity name is required',
      });
    }

    const activity = await addActivity(vacationId, req.body);

    res.status(201).json({
      success: true,
      message: 'Activity added successfully',
      activity,
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add activity',
      message: error.message,
    });
  }
};

/**
 * PUT /api/vacations/:vacationId/activities/:id
 * Updates an activity
 */
export const editActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await updateActivity(id, req.body);

    res.json({
      success: true,
      message: 'Activity updated successfully',
      activity,
    });
  } catch (error) {
    console.error('Update activity error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Activity not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update activity',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/vacations/:vacationId/activities/:id
 * Deletes an activity
 */
export const removeActivity = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteActivity(id);

    res.json({
      success: true,
      message: 'Activity removed successfully',
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Activity not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to remove activity',
      message: error.message,
    });
  }
};

// ===========================================
// ITINERARY & PLANNING CONTROLLERS
// ===========================================

/**
 * GET /api/vacations/:vacationId/itinerary
 * Returns the full day-by-day itinerary
 */
export const getVacationItinerary = async (req, res) => {
  try {
    const { vacationId } = req.params;
    const itinerary = await getItinerary(vacationId);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        error: 'Vacation plan not found',
      });
    }

    res.json({
      success: true,
      itinerary,
    });
  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch itinerary',
      message: error.message,
    });
  }
};

/**
 * GET /api/vacations/:vacationId/checklist
 * Returns planning checklist with completion status
 */
export const getVacationChecklist = async (req, res) => {
  try {
    const { vacationId } = req.params;
    const checklist = await getPlanningChecklist(vacationId);

    if (!checklist) {
      return res.status(404).json({
        success: false,
        error: 'Vacation plan not found',
      });
    }

    res.json({
      success: true,
      ...checklist,
    });
  } catch (error) {
    console.error('Get checklist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch planning checklist',
      message: error.message,
    });
  }
};
