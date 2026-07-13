import EconomicEngineState from '../models/EconomicEngineState.js';
import * as worldClockService from './worldClockService.js';
import { payrollModuleHooks } from './payrollModule.js';
import { corporateTaxModuleHooks } from './taxModule.js';
import { processMonthlyLoans } from './loanService.js';

export const loanModuleHooks = {
  onMonth: async (clockData) => {
    try {
      await processMonthlyLoans(clockData);
    } catch (err) {
      console.error(`[Economic Engine] Loan Module monthly tick failed: ${err.message}`);
    }
  }
};

const modules = [];

/**
 * Register a simulation module to subscribe to period transitions
 */
export const registerModule = (name, hooks) => {
  modules.push({ name, hooks });
  console.log(`[Economic Engine] Registered simulation module: ${name}`);
};

// Lifecycle trigger executors
const triggerHour = (clockData) => {
  console.log(`[Economic Engine] Hour Transition to: ${clockData.formatted}`);
  const executed = [];
  for (const m of modules) {
    if (m.hooks.onHour) {
      try {
        m.hooks.onHour(clockData);
        executed.push(m.name);
      } catch (err) {
        console.error(`[Economic Engine Error] Module ${m.name} failed onHour: ${err.message}`);
      }
    }
  }
  if (executed.length > 0) {
    console.log(`[Economic Engine] Executed Modules (Hour): ${executed.join(', ')}`);
  }
};

const triggerDay = (clockData) => {
  console.log(`[Economic Engine] Day Transition to: ${clockData.formatted}`);
  const executed = [];
  for (const m of modules) {
    if (m.hooks.onDay) {
      try {
        m.hooks.onDay(clockData);
        executed.push(m.name);
      } catch (err) {
        console.error(`[Economic Engine Error] Module ${m.name} failed onDay: ${err.message}`);
      }
    }
  }
  if (executed.length > 0) {
    console.log(`[Economic Engine] Executed Modules (Day): ${executed.join(', ')}`);
  }
};

const triggerWeek = (clockData) => {
  console.log(`[Economic Engine] Week Transition to: ${clockData.formatted}`);
  const executed = [];
  for (const m of modules) {
    if (m.hooks.onWeek) {
      try {
        m.hooks.onWeek(clockData);
        executed.push(m.name);
      } catch (err) {
        console.error(`[Economic Engine Error] Module ${m.name} failed onWeek: ${err.message}`);
      }
    }
  }
  if (executed.length > 0) {
    console.log(`[Economic Engine] Executed Modules (Week): ${executed.join(', ')}`);
  }
};

const triggerMonth = (clockData) => {
  console.log(`[Economic Engine] Month Transition to: ${clockData.formatted}`);
  const executed = [];
  for (const m of modules) {
    if (m.hooks.onMonth) {
      try {
        m.hooks.onMonth(clockData);
        executed.push(m.name);
      } catch (err) {
        console.error(`[Economic Engine Error] Module ${m.name} failed onMonth: ${err.message}`);
      }
    }
  }
  if (executed.length > 0) {
    console.log(`[Economic Engine] Executed Modules (Month): ${executed.join(', ')}`);
  }
};

const triggerYear = (clockData) => {
  console.log(`[Economic Engine] Year Transition to: ${clockData.formatted}`);
  const executed = [];
  for (const m of modules) {
    if (m.hooks.onYear) {
      try {
        m.hooks.onYear(clockData);
        executed.push(m.name);
      } catch (err) {
        console.error(`[Economic Engine Error] Module ${m.name} failed onYear: ${err.message}`);
      }
    }
  }
  if (executed.length > 0) {
    console.log(`[Economic Engine] Executed Modules (Year): ${executed.join(', ')}`);
  }
};

const getMockState = () => {
  if (!global.mockEconomicEngineState) {
    global.mockEconomicEngineState = {
      lastProcessedHour: new Date('2026-07-01T00:00:00.000Z'),
      lastProcessedDay: new Date('2026-07-01T00:00:00.000Z'),
      lastProcessedWeek: new Date('2026-07-01T00:00:00.000Z'),
      lastProcessedMonth: new Date('2026-07-01T00:00:00.000Z'),
      lastProcessedYear: new Date('2026-07-01T00:00:00.000Z')
    };
  }
  return global.mockEconomicEngineState;
};

/**
 * Main public ticker processor. Evaluates missed periods and triggers catch-ups.
 */
export const processEconomicTick = async (state, currentGameTime) => {
  let hourChanged = false;
  let dayChanged = false;
  let weekChanged = false;
  let monthChanged = false;
  let yearChanged = false;

  // 1. Chronological Hour catch-up
  let nextHour = new Date(new Date(state.lastProcessedHour).getTime() + 60 * 60 * 1000);
  while (nextHour <= currentGameTime) {
    const clockData = worldClockService.getFormattedClock(nextHour);
    triggerHour(clockData);
    state.lastProcessedHour = nextHour;
    hourChanged = true;
    nextHour = new Date(new Date(state.lastProcessedHour).getTime() + 60 * 60 * 1000);
  }

  // 2. Chronological Day catch-up
  let nextDay = new Date(new Date(state.lastProcessedDay).getTime() + 24 * 60 * 60 * 1000);
  while (nextDay <= currentGameTime) {
    const clockData = worldClockService.getFormattedClock(nextDay);
    triggerDay(clockData);
    state.lastProcessedDay = nextDay;
    dayChanged = true;
    nextDay = new Date(new Date(state.lastProcessedDay).getTime() + 24 * 60 * 60 * 1000);
  }

  // 3. Chronological Week catch-up
  let nextWeek = new Date(new Date(state.lastProcessedWeek).getTime() + 7 * 24 * 60 * 60 * 1000);
  while (nextWeek <= currentGameTime) {
    const clockData = worldClockService.getFormattedClock(nextWeek);
    triggerWeek(clockData);
    state.lastProcessedWeek = nextWeek;
    weekChanged = true;
    nextWeek = new Date(new Date(state.lastProcessedWeek).getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  // 4. Chronological Month catch-up
  let nextMonth = new Date(state.lastProcessedMonth);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  while (nextMonth <= currentGameTime) {
    const clockData = worldClockService.getFormattedClock(nextMonth);
    triggerMonth(clockData);
    state.lastProcessedMonth = nextMonth;
    monthChanged = true;
    nextMonth = new Date(state.lastProcessedMonth);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  }

  // 5. Chronological Year catch-up
  let nextYear = new Date(state.lastProcessedYear);
  nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
  while (nextYear <= currentGameTime) {
    const clockData = worldClockService.getFormattedClock(nextYear);
    triggerYear(clockData);
    state.lastProcessedYear = nextYear;
    yearChanged = true;
    nextYear = new Date(state.lastProcessedYear);
    nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
  }

  // Persist state if at least one boundary transition was updated
  if (hourChanged || dayChanged || weekChanged || monthChanged || yearChanged) {
    if (global.useMockDb) {
      global.mockEconomicEngineState = state;
    } else {
      await state.save();
    }
  }
};

/**
 * Public invocation point to tick the Economic Engine
 */
export const tickEngine = async () => {
  const currentGameTime = worldClockService.getCurrentGameTime();
  let state;

  if (global.useMockDb) {
    state = getMockState();
  } else {
    try {
      state = await EconomicEngineState.findOne();
      if (!state) {
        state = await EconomicEngineState.create({
          lastProcessedHour: new Date('2026-07-01T00:00:00.000Z'),
          lastProcessedDay: new Date('2026-07-01T00:00:00.000Z'),
          lastProcessedWeek: new Date('2026-07-01T00:00:00.000Z'),
          lastProcessedMonth: new Date('2026-07-01T00:00:00.000Z'),
          lastProcessedYear: new Date('2026-07-01T00:00:00.000Z')
        });
      }
    } catch (err) {
      console.error(`[Economic Engine Service] Error loading engine state: ${err.message}`);
      global.useMockDb = true;
      state = getMockState();
    }
  }

  await processEconomicTick(state, currentGameTime);
};

// Default Simulation Modules Registration
const createPlaceholderModule = (moduleName) => {
  return {
    onHour: (clock) => console.log(`[Economic Engine] [${moduleName}] Executing onHour hook at: ${clock.formatted}`),
    onDay: (clock) => console.log(`[Economic Engine] [${moduleName}] Executing onDay hook at: ${clock.formatted}`),
    onWeek: (clock) => console.log(`[Economic Engine] [${moduleName}] Executing onWeek hook at: ${clock.formatted}`),
    onMonth: (clock) => console.log(`[Economic Engine] [${moduleName}] Executing onMonth hook at: ${clock.formatted}`),
    onYear: (clock) => console.log(`[Economic Engine] [${moduleName}] Executing onYear hook at: ${clock.formatted}`)
  };
};

export const registerDefaultModules = () => {
  // Register active simulation modules
  registerModule('Payroll', payrollModuleHooks);
  registerModule('Taxes', corporateTaxModuleHooks);
  registerModule('Loan', loanModuleHooks);

  // Register remaining placeholders
  const placeholders = [
    'Inflation',
    'World Events',
    'Interest',
    'Government',
    'Company Reports',
    'Leaderboard'
  ];

  placeholders.forEach(name => registerModule(name, createPlaceholderModule(name)));
};
