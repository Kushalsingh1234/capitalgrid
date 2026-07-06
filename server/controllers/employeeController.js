import Employee from '../models/Employee.js';
import Startup from '../models/Startup.js';
import { getSalary } from '../config/countryEconomy.js';

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
  'Clothing Store': ['Labourer', 'Manager'],
  'Electronics Store': ['Labourer', 'Manager'],
  'Restaurant': ['Manager', 'Chef'],
  'Car Showroom': ['Labourer', 'Manager']
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

    // Map legacy 'Chief' to 'Chef'
    hiredEmployees = hiredEmployees.map(e => {
      if (e.employeeType === 'Chief') {
        e.employeeType = 'Chef';
      }
      return e;
    });

    // 3. Merge with allowed employee types for the business type
    const country = startup.country || 'United States';
    const allowedTypes = BUSINESS_REQUIRED_EMPLOYEES[startup.businessType] || [];
    const mergedList = allowedTypes.map(type => {
      const hired = hiredEmployees.find(e => e.employeeType === type);
      return {
        employeeType: type,
        salary: getSalary(country, type),
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
  const { employeeType, quantity } = req.body;
  const hireQty = Math.max(1, parseInt(quantity) || 1);
  const userId = req.user.id || req.user._id;

  try {
    if (!employeeType) {
      return res.status(400).json({ success: false, message: 'Employee type is required' });
    }

    let targetRole = employeeType;
    if (employeeType === 'Chief') {
      targetRole = 'Chef';
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
    if (!allowedTypes.includes(targetRole)) {
      return res.status(400).json({ success: false, message: `Your business category does not employ ${targetRole}s` });
    }

    // 3. Hire transaction logic
    let employee;
    const country = startup.country || 'United States';
    const salary = getSalary(country, targetRole);

    if (global.useMockDb) {
      employee = global.mockEmployees.find(e => String(e.startupId) === String(startup._id) && e.employeeType === targetRole);
      if (employee) {
        employee.quantity += hireQty;
      } else {
        employee = {
          _id: 'mock-emp-' + Date.now(),
          startupId: startup._id,
          employeeType: targetRole,
          quantity: hireQty,
          salary,
          createdAt: new Date()
        };
        global.mockEmployees.push(employee);
      }
      startup.employeesRecruited = (startup.employeesRecruited || 0) + hireQty;
    } else {
      employee = await Employee.findOne({ startupId: startup._id, employeeType: targetRole });
      if (employee) {
        employee.quantity += hireQty;
        await employee.save();
      } else {
        employee = await Employee.create({
          startupId: startup._id,
          employeeType: targetRole,
          quantity: hireQty,
          salary
        });
      }
      startup.employeesRecruited = (startup.employeesRecruited || 0) + hireQty;
      await startup.save();
    }

    // 4. Fetch updated employees listing to return
    let hiredEmployees = [];
    if (global.useMockDb) {
      hiredEmployees = (global.mockEmployees || []).filter(e => String(e.startupId) === String(startup._id));
    } else {
      hiredEmployees = await Employee.find({ startupId: startup._id });
    }

    // Map legacy 'Chief' to 'Chef'
    hiredEmployees = hiredEmployees.map(e => {
      if (e.employeeType === 'Chief') {
        e.employeeType = 'Chef';
      }
      return e;
    });

    const updatedMerged = allowedTypes.map(type => {
      const hired = hiredEmployees.find(e => e.employeeType === type);
      return {
        employeeType: type,
        salary: getSalary(country, type),
        quantity: hired ? hired.quantity : 0
      };
    });

    res.status(200).json({
      success: true,
      message: `Successfully hired ${hireQty} ${targetRole}(s).`,
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

    let targetRole = employeeType;
    if (employeeType === 'Chief') {
      targetRole = 'Chef';
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
      employee = global.mockEmployees.find(e => String(e.startupId) === String(startup._id) && e.employeeType === targetRole);
      if (!employee || employee.quantity <= 0) {
        return res.status(400).json({ success: false, message: `You have no ${targetRole}s currently hired` });
      }
      employee.quantity -= 1;
      startup.employeesLaidOff = (startup.employeesLaidOff || 0) + 1;
    } else {
      employee = await Employee.findOne({ startupId: startup._id, employeeType: targetRole });
      if (!employee || employee.quantity <= 0) {
        return res.status(400).json({ success: false, message: `You have no ${targetRole}s currently hired` });
      }
      employee.quantity -= 1;
      await employee.save();

      startup.employeesLaidOff = (startup.employeesLaidOff || 0) + 1;
      await startup.save();
    }

    // 3. Fetch updated employees listing to return
    let hiredEmployees = [];
    if (global.useMockDb) {
      hiredEmployees = (global.mockEmployees || []).filter(e => String(e.startupId) === String(startup._id));
    } else {
      hiredEmployees = await Employee.find({ startupId: startup._id });
    }

    // Map legacy 'Chief' to 'Chef'
    hiredEmployees = hiredEmployees.map(e => {
      if (e.employeeType === 'Chief') {
        e.employeeType = 'Chef';
      }
      return e;
    });

    const country = startup.country || 'United States';
    const updatedMerged = allowedTypes.map(type => {
      const hired = hiredEmployees.find(e => e.employeeType === type);
      return {
        employeeType: type,
        salary: getSalary(country, type),
        quantity: hired ? hired.quantity : 0
      };
    });

    res.status(200).json({
      success: true,
      message: `Successfully fired 1 ${targetRole}.`,
      employees: updatedMerged
    });

  } catch (error) {
    console.error(`[Fire Employee Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during firing operation' });
  }
};
