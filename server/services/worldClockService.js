import EventEmitter from 'events';
import WorldClock from '../models/WorldClock.js';

const clockEvents = new EventEmitter();
let cachedClockDoc = null;
let prevProjectedTime = null;
let tickInterval = null;

// Helpers
const getSeason = (month) => {
  if (month === 12 || month === 1 || month === 2) return 'Winter';
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  return 'Autumn';
};

const getWeekNumber = (date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date - startOfYear) / 86400000;
  return Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
};

const getMarketStatus = (hour) => {
  return (hour >= 8 && hour < 20) ? 'OPEN' : 'CLOSED';
};

const getWorldAge = (currentTime, originalStartDate = new Date('2026-07-01T00:00:00.000Z')) => {
  const diffMs = currentTime.getTime() - originalStartDate.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(1, diffDays + 1);
};

const getMockClock = () => {
  if (!global.mockWorldClock) {
    global.mockWorldClock = {
      gameStartDate: new Date('2026-07-01T00:00:00.000Z'),
      speedMultiplier: 30,
      lastUpdated: new Date()
    };
  }
  return global.mockWorldClock;
};

export const getCurrentGameTime = () => {
  const doc = global.useMockDb ? getMockClock() : cachedClockDoc;
  if (!doc) return new Date('2026-07-01T00:00:00.000Z');

  const elapsedRealMs = Date.now() - new Date(doc.lastUpdated).getTime();
  const elapsedGameMs = elapsedRealMs * doc.speedMultiplier;
  return new Date(new Date(doc.gameStartDate).getTime() + elapsedGameMs);
};

export const getFormattedClock = (timeInput = null) => {
  const currTime = timeInput || getCurrentGameTime();
  
  const year = currTime.getFullYear();
  const monthNum = currTime.getMonth() + 1; // 1-indexed
  const day = currTime.getDate();
  const hour = currTime.getHours();
  const minute = currTime.getMinutes();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[currTime.getMonth()];
  
  // Format string: e.g., "14 July 2026 | 08:00"
  const format2Digits = (num) => String(num).padStart(2, '0');
  const formatted = `${day} ${monthName} ${year} | ${format2Digits(hour)}:${format2Digits(minute)}`;
  
  const week = getWeekNumber(currTime);
  const season = getSeason(monthNum);
  const marketStatus = getMarketStatus(hour);
  const worldAge = getWorldAge(currTime);
  
  const doc = global.useMockDb ? getMockClock() : cachedClockDoc;
  const speedMultiplier = doc ? doc.speedMultiplier : 30;

  return {
    formatted,
    timestamp: currTime.getTime(),
    year,
    month: monthNum,
    day,
    hour,
    minute,
    week,
    season,
    marketStatus,
    worldAge,
    speedMultiplier
  };
};

const runTick = () => {
  if (!cachedClockDoc) return;
  const currTime = getCurrentGameTime();
  if (!prevProjectedTime) {
    prevProjectedTime = currTime;
    return;
  }

  const payload = getFormattedClock(currTime);

  // Transition detection checks
  const prev = prevProjectedTime;
  const curr = currTime;

  if (prev.getHours() !== curr.getHours() || prev.getDate() !== curr.getDate() || prev.getMonth() !== curr.getMonth() || prev.getFullYear() !== curr.getFullYear()) {
    clockEvents.emit('hour', payload);
  }
  if (prev.getDate() !== curr.getDate() || prev.getMonth() !== curr.getMonth() || prev.getFullYear() !== curr.getFullYear()) {
    clockEvents.emit('day', payload);
  }
  if (getWeekNumber(prev) !== getWeekNumber(curr) || prev.getFullYear() !== curr.getFullYear()) {
    clockEvents.emit('week', payload);
  }
  if (prev.getMonth() !== curr.getMonth() || prev.getFullYear() !== curr.getFullYear()) {
    clockEvents.emit('month', payload);
  }
  if (prev.getFullYear() !== curr.getFullYear()) {
    clockEvents.emit('year', payload);
  }

  prevProjectedTime = currTime;
};

export const initializeClock = async () => {
  if (global.useMockDb) {
    cachedClockDoc = getMockClock();
  } else {
    try {
      let doc = await WorldClock.findOne();
      if (!doc) {
        doc = await WorldClock.create({
          gameStartDate: new Date('2026-07-01T00:00:00.000Z'),
          speedMultiplier: 30,
          lastUpdated: new Date()
        });
      }
      cachedClockDoc = doc;
    } catch (err) {
      console.error(`[World Clock Service] Error initializing clock database: ${err.message}`);
      global.useMockDb = true;
      cachedClockDoc = getMockClock();
    }
  }

  prevProjectedTime = getCurrentGameTime();

  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(() => {
    runTick();
  }, 5000);
};

export const updateClockSettings = async (settings) => {
  const currentProjected = getCurrentGameTime();
  const { speedMultiplier, gameStartDate } = settings;

  const updatePayload = {
    gameStartDate: gameStartDate ? new Date(gameStartDate) : currentProjected,
    lastUpdated: new Date()
  };
  if (speedMultiplier !== undefined) {
    updatePayload.speedMultiplier = Number(speedMultiplier);
  }

  if (global.useMockDb) {
    const mock = getMockClock();
    mock.gameStartDate = updatePayload.gameStartDate;
    mock.lastUpdated = updatePayload.lastUpdated;
    if (speedMultiplier !== undefined) {
      mock.speedMultiplier = updatePayload.speedMultiplier;
    }
    cachedClockDoc = mock;
  } else {
    let doc = await WorldClock.findOne();
    if (!doc) {
      doc = new WorldClock();
    }
    doc.gameStartDate = updatePayload.gameStartDate;
    doc.lastUpdated = updatePayload.lastUpdated;
    if (speedMultiplier !== undefined) {
      doc.speedMultiplier = updatePayload.speedMultiplier;
    }
    await doc.save();
    cachedClockDoc = doc;
  }

  prevProjectedTime = getCurrentGameTime();
  
  return getFormattedClock();
};

export const on = (event, callback) => {
  clockEvents.on(event, callback);
};

export const off = (event, callback) => {
  clockEvents.off(event, callback);
};
