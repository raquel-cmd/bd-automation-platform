/**
 * Data Loaders for Vacation Planning Agent
 * Queries the Prisma database to manage vacation plans, destinations, expenses, and activities
 */

import prisma from '../db/client.js';

// ===========================================
// VACATION PLAN CRUD OPERATIONS
// ===========================================

/**
 * Get all vacation plans with summary data
 * @param {Object} params
 * @param {string} params.status - Filter by status (optional)
 * @returns {Promise<Array>}
 */
export async function getAllVacationPlans({ status } = {}) {
  try {
    const where = status ? { status } : {};

    const plans = await prisma.vacationPlan.findMany({
      where,
      include: {
        destinations: {
          orderBy: { orderIndex: 'asc' },
        },
        expenses: true,
        activities: true,
      },
      orderBy: { startDate: 'asc' },
    });

    // Add computed fields
    return plans.map(plan => ({
      ...plan,
      travelerNames: plan.travelerNames ? JSON.parse(plan.travelerNames) : [],
      totalEstimatedCost: plan.expenses.reduce((sum, e) => sum + e.estimatedCost, 0),
      totalActualCost: plan.expenses.reduce((sum, e) => sum + (e.actualCost || 0), 0),
      destinationCount: plan.destinations.length,
      activityCount: plan.activities.length,
      budgetRemaining: plan.totalBudget - plan.expenses.reduce((sum, e) => sum + e.estimatedCost, 0),
    }));
  } catch (error) {
    console.error('Error in getAllVacationPlans:', error);
    throw error;
  }
}

/**
 * Get a single vacation plan with all details
 * @param {number} id - Vacation plan ID
 * @returns {Promise<Object>}
 */
export async function getVacationPlanById(id) {
  try {
    const plan = await prisma.vacationPlan.findUnique({
      where: { id: parseInt(id) },
      include: {
        destinations: {
          orderBy: { orderIndex: 'asc' },
          include: {
            activities: {
              orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
            },
          },
        },
        expenses: {
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
        },
        activities: {
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!plan) return null;

    // Calculate budget breakdown by category
    const expensesByCategory = {};
    plan.expenses.forEach(expense => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = {
          estimated: 0,
          actual: 0,
          items: [],
        };
      }
      expensesByCategory[expense.category].estimated += expense.estimatedCost;
      expensesByCategory[expense.category].actual += expense.actualCost || 0;
      expensesByCategory[expense.category].items.push(expense);
    });

    return {
      ...plan,
      travelerNames: plan.travelerNames ? JSON.parse(plan.travelerNames) : [],
      totalEstimatedCost: plan.expenses.reduce((sum, e) => sum + e.estimatedCost, 0),
      totalActualCost: plan.expenses.reduce((sum, e) => sum + (e.actualCost || 0), 0),
      budgetRemaining: plan.totalBudget - plan.expenses.reduce((sum, e) => sum + e.estimatedCost, 0),
      expensesByCategory,
      tripDuration: calculateTripDuration(plan.startDate, plan.endDate),
    };
  } catch (error) {
    console.error('Error in getVacationPlanById:', error);
    throw error;
  }
}

/**
 * Create a new vacation plan
 * @param {Object} data - Vacation plan data
 * @returns {Promise<Object>}
 */
export async function createVacationPlan(data) {
  try {
    const plan = await prisma.vacationPlan.create({
      data: {
        name: data.name,
        description: data.description || null,
        startDate: data.startDate,
        endDate: data.endDate,
        travelers: data.travelers || 1,
        travelerNames: data.travelerNames ? JSON.stringify(data.travelerNames) : null,
        totalBudget: data.totalBudget || 0,
        currency: data.currency || 'USD',
        status: data.status || 'planning',
        notes: data.notes || null,
      },
    });
    return plan;
  } catch (error) {
    console.error('Error in createVacationPlan:', error);
    throw error;
  }
}

/**
 * Update a vacation plan
 * @param {number} id - Vacation plan ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateVacationPlan(id, data) {
  try {
    const updateData = { ...data };
    if (data.travelerNames) {
      updateData.travelerNames = JSON.stringify(data.travelerNames);
    }

    const plan = await prisma.vacationPlan.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    return plan;
  } catch (error) {
    console.error('Error in updateVacationPlan:', error);
    throw error;
  }
}

/**
 * Delete a vacation plan and all related data
 * @param {number} id - Vacation plan ID
 * @returns {Promise<Object>}
 */
export async function deleteVacationPlan(id) {
  try {
    const plan = await prisma.vacationPlan.delete({
      where: { id: parseInt(id) },
    });
    return plan;
  } catch (error) {
    console.error('Error in deleteVacationPlan:', error);
    throw error;
  }
}

// ===========================================
// DESTINATION CRUD OPERATIONS
// ===========================================

/**
 * Add a destination to a vacation plan
 * @param {number} vacationId - Vacation plan ID
 * @param {Object} data - Destination data
 * @returns {Promise<Object>}
 */
export async function addDestination(vacationId, data) {
  try {
    // Get the next order index
    const lastDestination = await prisma.destination.findFirst({
      where: { vacationId: parseInt(vacationId) },
      orderBy: { orderIndex: 'desc' },
    });

    const destination = await prisma.destination.create({
      data: {
        vacationId: parseInt(vacationId),
        name: data.name,
        country: data.country || null,
        arrivalDate: data.arrivalDate || null,
        departureDate: data.departureDate || null,
        accommodation: data.accommodation || null,
        accommodationAddress: data.accommodationAddress || null,
        accommodationCost: data.accommodationCost || null,
        transportMode: data.transportMode || null,
        transportCost: data.transportCost || null,
        notes: data.notes || null,
        orderIndex: lastDestination ? lastDestination.orderIndex + 1 : 0,
      },
    });
    return destination;
  } catch (error) {
    console.error('Error in addDestination:', error);
    throw error;
  }
}

/**
 * Update a destination
 * @param {number} id - Destination ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateDestination(id, data) {
  try {
    const destination = await prisma.destination.update({
      where: { id: parseInt(id) },
      data,
    });
    return destination;
  } catch (error) {
    console.error('Error in updateDestination:', error);
    throw error;
  }
}

/**
 * Delete a destination
 * @param {number} id - Destination ID
 * @returns {Promise<Object>}
 */
export async function deleteDestination(id) {
  try {
    const destination = await prisma.destination.delete({
      where: { id: parseInt(id) },
    });
    return destination;
  } catch (error) {
    console.error('Error in deleteDestination:', error);
    throw error;
  }
}

/**
 * Reorder destinations within a vacation plan
 * @param {number} vacationId - Vacation plan ID
 * @param {Array<number>} destinationIds - Ordered array of destination IDs
 * @returns {Promise<Array>}
 */
export async function reorderDestinations(vacationId, destinationIds) {
  try {
    const updates = destinationIds.map((id, index) =>
      prisma.destination.update({
        where: { id: parseInt(id) },
        data: { orderIndex: index },
      })
    );
    await prisma.$transaction(updates);

    return prisma.destination.findMany({
      where: { vacationId: parseInt(vacationId) },
      orderBy: { orderIndex: 'asc' },
    });
  } catch (error) {
    console.error('Error in reorderDestinations:', error);
    throw error;
  }
}

// ===========================================
// EXPENSE CRUD OPERATIONS
// ===========================================

/**
 * Add an expense to a vacation plan
 * @param {number} vacationId - Vacation plan ID
 * @param {Object} data - Expense data
 * @returns {Promise<Object>}
 */
export async function addExpense(vacationId, data) {
  try {
    const expense = await prisma.expense.create({
      data: {
        vacationId: parseInt(vacationId),
        category: data.category,
        name: data.name,
        description: data.description || null,
        estimatedCost: data.estimatedCost || 0,
        actualCost: data.actualCost || null,
        isPaid: data.isPaid || false,
        paidDate: data.paidDate || null,
        vendor: data.vendor || null,
        confirmationNum: data.confirmationNum || null,
        notes: data.notes || null,
      },
    });
    return expense;
  } catch (error) {
    console.error('Error in addExpense:', error);
    throw error;
  }
}

/**
 * Update an expense
 * @param {number} id - Expense ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateExpense(id, data) {
  try {
    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data,
    });
    return expense;
  } catch (error) {
    console.error('Error in updateExpense:', error);
    throw error;
  }
}

/**
 * Delete an expense
 * @param {number} id - Expense ID
 * @returns {Promise<Object>}
 */
export async function deleteExpense(id) {
  try {
    const expense = await prisma.expense.delete({
      where: { id: parseInt(id) },
    });
    return expense;
  } catch (error) {
    console.error('Error in deleteExpense:', error);
    throw error;
  }
}

/**
 * Get budget summary for a vacation plan
 * @param {number} vacationId - Vacation plan ID
 * @returns {Promise<Object>}
 */
export async function getBudgetSummary(vacationId) {
  try {
    const plan = await prisma.vacationPlan.findUnique({
      where: { id: parseInt(vacationId) },
      include: { expenses: true },
    });

    if (!plan) return null;

    const categories = ['flights', 'accommodation', 'food', 'activities', 'transport', 'shopping', 'other'];
    const breakdown = {};

    categories.forEach(cat => {
      const catExpenses = plan.expenses.filter(e => e.category === cat);
      breakdown[cat] = {
        estimated: catExpenses.reduce((sum, e) => sum + e.estimatedCost, 0),
        actual: catExpenses.reduce((sum, e) => sum + (e.actualCost || 0), 0),
        paid: catExpenses.filter(e => e.isPaid).reduce((sum, e) => sum + (e.actualCost || e.estimatedCost), 0),
        count: catExpenses.length,
      };
    });

    const totalEstimated = plan.expenses.reduce((sum, e) => sum + e.estimatedCost, 0);
    const totalActual = plan.expenses.reduce((sum, e) => sum + (e.actualCost || 0), 0);
    const totalPaid = plan.expenses.filter(e => e.isPaid).reduce((sum, e) => sum + (e.actualCost || e.estimatedCost), 0);

    return {
      totalBudget: plan.totalBudget,
      currency: plan.currency,
      totalEstimated,
      totalActual,
      totalPaid,
      remaining: plan.totalBudget - totalEstimated,
      overBudget: totalEstimated > plan.totalBudget,
      percentUsed: plan.totalBudget > 0 ? (totalEstimated / plan.totalBudget) * 100 : 0,
      breakdown,
      perPerson: {
        estimated: plan.travelers > 0 ? totalEstimated / plan.travelers : totalEstimated,
        actual: plan.travelers > 0 ? totalActual / plan.travelers : totalActual,
      },
    };
  } catch (error) {
    console.error('Error in getBudgetSummary:', error);
    throw error;
  }
}

// ===========================================
// ACTIVITY CRUD OPERATIONS
// ===========================================

/**
 * Add an activity to a vacation plan
 * @param {number} vacationId - Vacation plan ID
 * @param {Object} data - Activity data
 * @returns {Promise<Object>}
 */
export async function addActivity(vacationId, data) {
  try {
    const activity = await prisma.activity.create({
      data: {
        vacationId: parseInt(vacationId),
        destinationId: data.destinationId ? parseInt(data.destinationId) : null,
        name: data.name,
        description: data.description || null,
        date: data.date || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        location: data.location || null,
        estimatedCost: data.estimatedCost || null,
        actualCost: data.actualCost || null,
        isBooked: data.isBooked || false,
        bookingRef: data.bookingRef || null,
        priority: data.priority || 'medium',
        category: data.category || null,
        notes: data.notes || null,
      },
    });
    return activity;
  } catch (error) {
    console.error('Error in addActivity:', error);
    throw error;
  }
}

/**
 * Update an activity
 * @param {number} id - Activity ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateActivity(id, data) {
  try {
    const updateData = { ...data };
    if (data.destinationId !== undefined) {
      updateData.destinationId = data.destinationId ? parseInt(data.destinationId) : null;
    }

    const activity = await prisma.activity.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    return activity;
  } catch (error) {
    console.error('Error in updateActivity:', error);
    throw error;
  }
}

/**
 * Delete an activity
 * @param {number} id - Activity ID
 * @returns {Promise<Object>}
 */
export async function deleteActivity(id) {
  try {
    const activity = await prisma.activity.delete({
      where: { id: parseInt(id) },
    });
    return activity;
  } catch (error) {
    console.error('Error in deleteActivity:', error);
    throw error;
  }
}

/**
 * Get activities for a vacation, optionally filtered by destination
 * @param {number} vacationId - Vacation plan ID
 * @param {number} destinationId - Optional destination ID filter
 * @returns {Promise<Array>}
 */
export async function getActivities(vacationId, destinationId = null) {
  try {
    const where = { vacationId: parseInt(vacationId) };
    if (destinationId) {
      where.destinationId = parseInt(destinationId);
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        destination: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return activities;
  } catch (error) {
    console.error('Error in getActivities:', error);
    throw error;
  }
}

// ===========================================
// ITINERARY AND RESEARCH HELPERS
// ===========================================

/**
 * Get the full itinerary for a vacation plan organized by day
 * @param {number} vacationId - Vacation plan ID
 * @returns {Promise<Object>}
 */
export async function getItinerary(vacationId) {
  try {
    const plan = await getVacationPlanById(vacationId);
    if (!plan) return null;

    // Build day-by-day itinerary
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    const days = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      // Find destination for this date
      const currentDestination = plan.destinations.find(dest => {
        if (!dest.arrivalDate || !dest.departureDate) return false;
        return dateStr >= dest.arrivalDate && dateStr <= dest.departureDate;
      });

      // Find activities for this date
      const dayActivities = plan.activities.filter(a => a.date === dateStr);

      days.push({
        date: dateStr,
        dayNumber: days.length + 1,
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'long' }),
        destination: currentDestination ? {
          id: currentDestination.id,
          name: currentDestination.name,
          accommodation: currentDestination.accommodation,
        } : null,
        activities: dayActivities.sort((a, b) => {
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          return a.startTime.localeCompare(b.startTime);
        }),
        isArrival: currentDestination?.arrivalDate === dateStr,
        isDeparture: currentDestination?.departureDate === dateStr,
      });
    }

    return {
      vacation: {
        id: plan.id,
        name: plan.name,
        startDate: plan.startDate,
        endDate: plan.endDate,
        travelers: plan.travelers,
        travelerNames: plan.travelerNames,
      },
      totalDays: days.length,
      days,
    };
  } catch (error) {
    console.error('Error in getItinerary:', error);
    throw error;
  }
}

/**
 * Get vacation planning suggestions based on destinations
 * @param {number} vacationId - Vacation plan ID
 * @returns {Promise<Object>}
 */
export async function getPlanningChecklist(vacationId) {
  try {
    const plan = await getVacationPlanById(vacationId);
    if (!plan) return null;

    const checklist = {
      prePlanning: [],
      bookings: [],
      packing: [],
      documents: [],
    };

    // Pre-planning items
    checklist.prePlanning.push({
      item: 'Set total budget',
      completed: plan.totalBudget > 0,
      value: plan.totalBudget,
    });
    checklist.prePlanning.push({
      item: 'Add all destinations',
      completed: plan.destinations.length > 0,
      value: plan.destinations.length,
    });
    checklist.prePlanning.push({
      item: 'List all travelers',
      completed: plan.travelerNames && plan.travelerNames.length > 0,
      value: plan.travelers,
    });

    // Booking items
    const hasFlights = plan.expenses.some(e => e.category === 'flights' && e.isPaid);
    const hasAccommodation = plan.destinations.some(d => d.accommodation);

    checklist.bookings.push({
      item: 'Book flights',
      completed: hasFlights,
    });
    checklist.bookings.push({
      item: 'Book accommodation',
      completed: hasAccommodation,
    });
    checklist.bookings.push({
      item: 'Plan activities',
      completed: plan.activities.length > 0,
      value: plan.activities.length,
    });

    // Check for must-do activities that need booking
    const unbookedMustDos = plan.activities.filter(a => a.priority === 'must-do' && !a.isBooked);
    if (unbookedMustDos.length > 0) {
      checklist.bookings.push({
        item: 'Book must-do activities',
        completed: false,
        pending: unbookedMustDos.map(a => a.name),
      });
    }

    // Document items (suggestions based on international travel)
    const hasInternational = plan.destinations.some(d => d.country && d.country !== 'USA');
    if (hasInternational) {
      checklist.documents.push({ item: 'Check passport validity', completed: false });
      checklist.documents.push({ item: 'Research visa requirements', completed: false });
      checklist.documents.push({ item: 'Get travel insurance', completed: false });
    }

    return {
      vacationId: plan.id,
      vacationName: plan.name,
      checklist,
      completionPercentage: calculateChecklistCompletion(checklist),
    };
  } catch (error) {
    console.error('Error in getPlanningChecklist:', error);
    throw error;
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function calculateTripDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

function calculateChecklistCompletion(checklist) {
  const allItems = [
    ...checklist.prePlanning,
    ...checklist.bookings,
    ...checklist.documents,
    ...checklist.packing,
  ];

  if (allItems.length === 0) return 0;

  const completedItems = allItems.filter(item => item.completed).length;
  return Math.round((completedItems / allItems.length) * 100);
}
