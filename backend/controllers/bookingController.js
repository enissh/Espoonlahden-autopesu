const Booking = require('../models/Booking');
const moment = require('moment');
require('dotenv').config();
const SibApiV3Sdk = require('sib-api-v3-sdk');
const brevoClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = brevoClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// Format date and time
const formatDateTime = (date, time) => {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `${formattedDate} at ${time}`;
};

// Helper function to check if a time slot is available
const isTimeSlotAvailable = async (date, startTime, endTime, excludeBookingId = null) => {
  const query = {
    date,
    $or: [
      // Check if new booking overlaps with existing bookings
      {
        $and: [
          { time: { $lte: startTime } },
          { endTime: { $gt: startTime } }
        ]
      },
      {
        $and: [
          { time: { $lt: endTime } },
          { endTime: { $gte: endTime } }
        ]
      },
      {
        $and: [
          { time: { $gte: startTime } },
          { endTime: { $lte: endTime } }
        ]
      }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await Booking.findOne(query);
  return !conflictingBooking;
};

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

async function sendBookingEmail({ to, subject, text, html }) {
  await tranEmailApi.sendTransacEmail({
    sender: { email: process.env.FROM_EMAIL, name: "Premium Wash" },
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent: html,
  });
}

// Get all bookings
exports.getBookings = async (req, res) => {
  try {
    const { date } = req.query;
    const query = date ? { date } : {};
    const bookings = await Booking.find(query).sort({ date: 1, time: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { date, time, endTime, email, services, vehicleType, name, phone, note } = req.body;

    // Validate required fields
    if (!date || !time || !endTime || !email || !vehicleType || !name || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate services array
    if (services && (!Array.isArray(services) || services.length === 0)) {
      return res.status(400).json({ message: 'Services must be a non-empty array' });
    }

    // Check if time slot is available
    const isAvailable = await isTimeSlotAvailable(date, time, endTime);
    if (!isAvailable) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    const booking = new Booking({
      vehicleType,
      services,
      date,
      time,
      endTime,
      name,
      email,
      phone,
      note
    });

    const savedBooking = await booking.save();

    // Send confirmation emails to customer and admin
    const bookingDetails = `
Varausvahvistus:
Nimi: ${booking.name}
Sähköposti: ${booking.email}
Puhelin: ${booking.phone}
Päivämäärä: ${booking.date}
Aika: ${booking.time} - ${booking.endTime}
Palvelut: ${booking.services ? booking.services.map(s => s.name).join(', ') : booking.service}
`;

    try {
      await sendBookingEmail({
        to: booking.email,
        subject: 'Varausvahvistus - Premium Wash',
        text: bookingDetails,
        html: `<pre>${bookingDetails}</pre>`
      });

      await sendBookingEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'Uusi varaus - Premium Wash',
        text: bookingDetails,
        html: `<pre>${bookingDetails}</pre>`
      });
    } catch (emailError) {
      console.error('Error sending confirmation emails:', emailError);
      // Don't fail the booking if email sending fails
    }

    res.status(201).json(savedBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(400).json({ message: error.message || 'Failed to create booking' });
  }
};

// Update a booking
exports.updateBooking = async (req, res) => {
  try {
    const { date, time, endTime } = req.body;
    const bookingId = req.params.id;

    // If date or time is being changed, check availability
    if (date || time || endTime) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const isAvailable = await isTimeSlotAvailable(
        date || booking.date,
        time || booking.time,
        endTime || booking.endTime,
        bookingId
      );

      if (!isAvailable) {
        return res.status(400).json({ message: 'This time slot is already booked' });
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
