import Employee from '../models/Employee.js';
import Startup from '../models/Startup.js';

// Salaries defined per employee type
export const EMPLOYEE_SALARIES = {
  'Farmer': 1200,
  'Labourer': 1000,
  'Fashion Designer': 2500,
  'Builder': 1500,
  'Engineer': 2000,
  'Manager': 3000,
  'Chief': 5000
};

// Employee roles required/allowed per business type
export const BUSINESS_REQUIRED_EMPLOYEES = {
  'Farming': ['Farmer'],
  'Dairy': ['Farmer'],
  'Mining': ['Labourer'],
  'Garment Factory': ['Fashion Designer', 'Labourer'],
  'Food Processing Factory': ['Labourer'],
  'Construction Factory': ['Labourer'],
  'Automobile Manufacturing': ['Engineer', 'Labourer'],
  'Electronics Manufacturing': ['Engineer', 'Labourer'],
  
  // Retail stores (no production, but can hire staff)
  'Clothing Store': ['Labourer', 'Manager', 'Chief'],
  'Electronics Store': ['Labourer', 'Manager', 'Chief'],
  'Restaurant': ['Labourer', 'Manager', 'Chief'],
  'Car Showroom': ['Labourer', 'Manager', 'Chief']
};

/**
 * @desc    Get current startup employees list merged with all allowed employee categories
 * @route   GET /api/employee
 * @access  Private
 */
export const getMyEmployees = async (req, res) => {
  const userId = req.user.id || req.user._id;

  try {
    // 1. Fetch player's startup
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'No startup found for this player' });
    }

    // 2. Fetch hired employee records
    let hiredEmployees = [];
    if (global.useMockDb) {
      hiredEmployees = (global.mockEmployees || []).filter(e => String(e.startupId) === String(startup._id));
    } else {
      hiredEmployees = await Employee.find({ startupId: startup._id });
    }

    // 3. Merge with allowed employee types for the business type
    const allowedTypes = BUSINESS_REQUIRED_EMPLOYEES[startup.businessType] || [];
    const mergedList = allowedTypes.map(type => {
      const hired = hiredEmployees.find(e => e.employeeType === type);
      return {
        employeeType: type,
        salary: EMPLOYEE_SALARIES[type] || 1000,
        quantity: hired ? hired.quantity : 0
      };
    });

    res.status(200).json({
      success: true,
      employees: mergedList
    });

  } catch (error) {
    console.error(`[Fetch Employees Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving employee data' });
  }
};

/**
 * @desc    Hire one unit of a specific employee type
 * @route   POST /api/employee/hire
 * @access  Private
 */
export const hireEmployee = async (req, res) => {
  const { employeeType } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    if (!employeeType) {
      return res.status(400).json({ success: false, message: 'Employee type is required' });
    }

    // 1. Fetch startup
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'No startup found for this player' });
    }

    // 2. Validate allowed roles
    const allowedTypes = BUSINESS_REQUIRED_EMPLOYEES[startup.businessType] || [];
    if (!allowedTypes.includes(employeeType)) {
      return res.status(400).json({ success: false, message: `Your business category does not employ ${employeeType}s` });
    }

    // 3. Hire transaction logic
    let employee;
    const salary = EMPLOYEE_SALARIES[employeeType] || 1000;

    if (global.useMockDb) {
      employee = global.mockEmployees.find(e => String(e.startupId) === String(startup._id) && e.employeeType === employeeType);
      if (employee) {
        employee.quantity += 1;
      } else {
        employee = {
          _id: 'mock-emp-' + Date.now(),
          startupId: startup._id,
          employeeType,
          quantity: 1,
          salary,
          createdAt: new Date()
        };
        global.mockEmployees.push(employee);
      }
    } else {
      employee = await Employee.findOne({ startupId: startup._id, employeeType });
      if (employee) {
        employee.quantity += 1;
        await employee.save();
      } else {
        employee = await Employee.create({
          startupId: startup._id,
          employeeType,
          quantity: 1,
          salary
        });
      }
    }

    // 4. Fetch updated employees listing to return
    let hiredEmployees = [];
    if (global.useMockDb) {
      hiredEmployees = (global.mockEmployees || []).filter(e => String(e.startupId) === String(startup._id));
    } else {
      hiredEmployees = await Employee.find({ startupId: startup._id });
    }

    const updatedMerged = allowedTypes.map(type => {
      const hired = hiredEmployees.find(e => e.employeeType === type);
      return {
        employeeType: type,
        salary: EMPLOYEE_SALARIES[type] || 1000,
        quantity: hired ? hired.quantity : 0
      };
    });

    res.status(200).json({
      success: true,
      message: `Successfully hired 1 ${employeeType}.`,
      employees: updatedMerged
    });

  } catch (error) {
    console.error(`[Hire Employee Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during hiring operation' });
  }
};

/**
 * @desc    Fire one unit of a specific employee type
 * @route   POST /api/employee/fire
 * @access  Private
 */
export const fireEmployee = async (req, res) => {
  const { employeeType } = req.body;
  const userId = req.user.id || req.user._id;

  try {
    if (!employeeType) {
      return res.status(400).json({ success: false, message: 'Employee type is required' });
    }

    // 1. Fetch startup
    let startup;
    if (global.useMockDb) {
      startup = global.mockStartups.find(s => String(s.owner) === String(userId));
    } else {
      startup = await Startup.findOne({ owner: userId });
    }

    if (!startup) {
      return res.status(404).json({ success: false, message: 'No startup found for this player' });
    }

    // 2. Fire transaction logic
    let employee;
    const allowedTypes = BUSINESS_REQUIRED_EMPLOYEES[startup.businessType] || [];

    if (global.useMockDb) {
      employee = global.mockEmployees.find(e => String(e.startupId) === String(startup._id) && e.employeeType === employeeType);
      if (!employee || employee.quantity <= 0) {
        return res.status(400).json({ success: false, message: `You have no ${employeeType}s currently hired` });
      }
      employee.quantity -= 1;
    } else {
      employee = await Employee.findOne({ startupId: startup._id, employeeType });
      if (!employee || employee.quantity <= 0) {
        return res.status(400).json({ success: false, message: `You have no ${employeeType}s currently hired` });
      }
      employee.quantity -= 1;
      await employee.save();
    }

    // 3. Fetch updated employees listing to return
    let hiredEmployees = [];
    if (global.useMockDb) {
      hiredEmployees = (global.mockEmployees || []).filter(e => String(e.startupId) === String(startup._id));
    } else {
      hiredEmployees = await Employee.find({ startupId: startup._id });
    }

    const updatedMerged = allowedTypes.map(type => {
      const hired = hiredEmployees.find(e => e.employeeType === type);
      return {
        employeeType: type,
        salary: EMPLOYEE_SALARIES[type] || 1000,
        quantity: hired ? hired.quantity : 0
      };
    });

    res.status(200).json({
      success: true,
      message: `Successfully fired 1 ${employeeType}.`,
      employees: updatedMerged
    });

  } catch (error) {
    console.error(`[Fire Employee Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during firing operation' });
  }
};
