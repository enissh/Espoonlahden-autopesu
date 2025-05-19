const Booking = require('../models/Booking');
const moment = require('moment');
require('dotenv').config();
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo client with proper configuration
const defaultClient = new SibApiV3Sdk.ApiClient();
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

// Create a new instance of the API
const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi(defaultClient);

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
  try {
    console.log('Attempting to send email to:', to);
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { 
      email: process.env.FROM_EMAIL, 
      name: "Premium Wash" 
    };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.textContent = text;
    sendSmtpEmail.htmlContent = html;
    
    // Minimal headers for better deliverability
    sendSmtpEmail.headers = {
      'X-Mailin-Tag': 'Booking Confirmation'
    };

    // Add reply-to header
    sendSmtpEmail.replyTo = {
      email: process.env.FROM_EMAIL,
      name: "Premium Wash Support"
    };

    // Add message ID for better tracking
    sendSmtpEmail.headers['Message-ID'] = `<${Date.now()}.${Math.random().toString(36).substring(2)}@sendinblue.com>`;

    // Add tags for better categorization
    sendSmtpEmail.tags = ['booking', 'confirmation'];

    const result = await tranEmailApi.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.body,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
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

    // Format date for email
    const formattedDate = new Date(date).toLocaleDateString('fi-FI', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calculate total price
    const totalPrice = services.reduce((sum, service) => 
      sum + parseInt(service.price.replace('€', '')), 0);

    // Create HTML email template for customer
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333; margin-bottom: 10px;">Booking Confirmation</h2>
          <p style="color: #666; font-size: 16px;">Thank you for booking with Premium Wash!</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">Booking Details:</h3>
          <p style="margin: 10px 0;"><strong>Name:</strong> ${booking.name}</p>
          <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 10px 0;"><strong>Time:</strong> ${booking.time} - ${booking.endTime}</p>
          <p style="margin: 10px 0;"><strong>Vehicle Type:</strong> ${booking.vehicleType}</p>
          <p style="margin: 10px 0;"><strong>Phone:</strong> ${booking.phone}</p>
        </div>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">Selected Services:</h3>
          ${services.map(service => `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
              <p style="margin: 0; font-size: 16px;"><strong>${service.name}</strong></p>
              <p style="margin: 5px 0; color: #666;">Price: ${service.price} | Duration: ${service.duration}</p>
            </div>
          `).join('')}
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #ddd;">
            <p style="margin: 0; font-size: 18px;"><strong>Total:</strong> ${totalPrice}€</p>
          </div>
        </div>

        ${note ? `
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">Additional Notes:</h3>
            <p style="margin: 0;">${note}</p>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0;">If you have any questions, please contact us:</p>
          <p style="color: #666; margin: 5px 0;">Phone: +358442438872</p>
          <p style="color: #666; margin: 0;">Email: ${process.env.FROM_EMAIL}</p>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
          <p>© ${new Date().getFullYear()} Premium Wash. All rights reserved.</p>
        </div>
      </div>
    `;

    // Create HTML email template for admin
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333;">Uusi varaus</h2>
          <p style="color: #666;">Uusi varaus on vastaanotettu!</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">Asiakkaan tiedot:</h3>
          <p><strong>Nimi:</strong> ${booking.name}</p>
          <p><strong>Sähköposti:</strong> ${booking.email}</p>
          <p><strong>Puhelin:</strong> ${booking.phone}</p>
        </div>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">Varauksen tiedot:</h3>
          <p><strong>Päivämäärä:</strong> ${formattedDate}</p>
          <p><strong>Aika:</strong> ${booking.time} - ${booking.endTime}</p>
          <p><strong>Ajoneuvotyyppi:</strong> ${booking.vehicleType}</p>
        </div>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">Valitut palvelut:</h3>
          ${services.map(service => `
            <div style="margin-bottom: 10px;">
              <p style="margin: 0;"><strong>${service.name}</strong></p>
              <p style="margin: 0; color: #666;">Hinta: ${service.price} | Kesto: ${service.duration}</p>
            </div>
          `).join('')}
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
            <p style="margin: 0;"><strong>Yhteensä:</strong> ${totalPrice}€</p>
          </div>
        </div>

        ${note ? `
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Lisätiedot:</h3>
            <p style="margin: 0;">${note}</p>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0;">Varaus ID: ${savedBooking._id}</p>
        </div>
      </div>
    `;

    try {
      console.log('Starting to send confirmation emails...');
      
      // Send confirmation email to customer
      console.log('Sending customer confirmation email...');
      await sendBookingEmail({
        to: booking.email,
        subject: 'Booking Confirmation - Premium Wash',
        text: `Thank you for booking with Premium Wash!\n\nBooking Details:\nName: ${booking.name}\nDate: ${formattedDate}\nTime: ${booking.time} - ${booking.endTime}\nVehicle Type: ${booking.vehicleType}\nPhone: ${booking.phone}\n\nSelected Services:\n${services.map(s => `${s.name} - ${s.price} (${s.duration})`).join('\n')}\n\nTotal: ${totalPrice}€\n\n${note ? `Additional Notes:\n${note}\n\n` : ''}If you have any questions, please contact us:\nPhone: +358442438872\nEmail: ${process.env.FROM_EMAIL}`,
        html: customerHtml
      });
      console.log('Customer confirmation email sent successfully');

      // Send notification email to admin
      console.log('Sending admin notification email...');
      await sendBookingEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'New Booking - Premium Wash',
        text: `A new booking has been received!\n\nCustomer Details:\nName: ${booking.name}\nEmail: ${booking.email}\nPhone: ${booking.phone}\n\nBooking Details:\nDate: ${formattedDate}\nTime: ${booking.time} - ${booking.endTime}\nVehicle Type: ${booking.vehicleType}\n\nSelected Services:\n${services.map(s => `${s.name} - ${s.price} (${s.duration})`).join('\n')}\n\nTotal: ${totalPrice}€\n\n${note ? `Additional Notes:\n${note}\n\n` : ''}Booking ID: ${savedBooking._id}`,
        html: adminHtml
      });
      console.log('Admin notification email sent successfully');
    } catch (emailError) {
      console.error('Error sending confirmation emails:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        response: emailError.response?.body,
        status: emailError.response?.status
      });
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