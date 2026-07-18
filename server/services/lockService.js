const activeLocks = new Set();

/**
 * Acquire a lock for a given key.
 * Returns true if the lock was acquired, false if it is already locked.
 */
export const acquireLock = async (lockKey) => {
  if (activeLocks.has(lockKey)) {
    return false;
  }
  activeLocks.add(lockKey);
  return true;
};

/**
 * Release a lock for a given key.
 */
export const releaseLock = async (lockKey) => {
  activeLocks.delete(lockKey);
};
