const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  }
});

const bookingSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
    trim: true
  },
  services: {
    type: [serviceSchema],
    required: function() {
      return !this.service; // services is required if service is not provided
    }
  },
  service: {
    type: String,
    required: function() {
      return !this.services; // service is required if services is not provided
    },
    trim: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:mm)`
    }
  },
  endTime: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:mm)`
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  note: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for date and time to prevent double bookings
bookingSchema.index({ date: 1, time: 1, endTime: 1 });

// Add validation to ensure endTime is after time
bookingSchema.pre('save', function(next) {
  const start = new Date(`2000-01-01T${this.time}`);
  const end = new Date(`2000-01-01T${this.endTime}`);
  
  if (end <= start) {
    next(new Error('End time must be after start time'));
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
