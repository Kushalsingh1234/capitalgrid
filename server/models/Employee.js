import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: [true, 'Startup ID reference is required']
  },
  employeeType: {
    type: String,
    required: [true, 'Employee type name is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Hired quantity is required'],
    default: 0,
    min: [0, 'Quantity cannot be negative']
  },
  salary: {
    type: Number,
    required: [true, 'Monthly salary is required'],
    min: [0, 'Salary cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
