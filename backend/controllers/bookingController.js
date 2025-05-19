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
  try {
    console.log('Attempting to send email to:', to);
    console.log('Using API Key:', process.env.BREVO_API_KEY ? 'Present' : 'Missing');
    console.log('From Email:', process.env.FROM_EMAIL);
    
    const result = await tranEmailApi.sendTransacEmail({
      sender: { email: process.env.FROM_EMAIL, name: "Premium Wash" },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    });
    
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.body,
      status: error.response?.status
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
          <h2 style="color: #333;">Varausvahvistus</h2>
          <p style="color: #666;">Kiitos varauksestasi Premium Wash -autopesulassa!</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">Varauksen tiedot:</h3>
          <p><strong>Nimi:</strong> ${booking.name}</p>
          <p><strong>Päivämäärä:</strong> ${formattedDate}</p>
          <p><strong>Aika:</strong> ${booking.time} - ${booking.endTime}</p>
          <p><strong>Ajoneuvotyyppi:</strong> ${booking.vehicleType}</p>
          <p><strong>Puhelin:</strong> ${booking.phone}</p>
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
          <p style="color: #666; margin: 0;">Jos sinulla on kysyttävää, ota yhteyttä:</p>
          <p style="color: #666; margin: 5px 0;">Puhelin: +358442438872</p>
          <p style="color: #666; margin: 0;">Sähköposti: ${process.env.FROM_EMAIL}</p>
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
        subject: 'Varausvahvistus - Premium Wash',
        text: `Kiitos varauksestasi Premium Wash -autopesulassa!\n\nVarauksen tiedot:\nNimi: ${booking.name}\nPäivämäärä: ${formattedDate}\nAika: ${booking.time} - ${booking.endTime}\nAjoneuvotyyppi: ${booking.vehicleType}\nPuhelin: ${booking.phone}\n\nValitut palvelut:\n${services.map(s => `${s.name} - ${s.price} (${s.duration})`).join('\n')}\n\nYhteensä: ${totalPrice}€\n\n${note ? `Lisätiedot:\n${note}\n\n` : ''}Jos sinulla on kysyttävää, ota yhteyttä:\nPuhelin: +358442438872\nSähköposti: ${process.env.FROM_EMAIL}`,
        html: customerHtml
      });
      console.log('Customer confirmation email sent successfully');

      // Send notification email to admin
      console.log('Sending admin notification email...');
      await sendBookingEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'Uusi varaus - Premium Wash',
        text: `Uusi varaus on vastaanotettu!\n\nAsiakkaan tiedot:\nNimi: ${booking.name}\nSähköposti: ${booking.email}\nPuhelin: ${booking.phone}\n\nVarauksen tiedot:\nPäivämäärä: ${formattedDate}\nAika: ${booking.time} - ${booking.endTime}\nAjoneuvotyyppi: ${booking.vehicleType}\n\nValitut palvelut:\n${services.map(s => `${s.name} - ${s.price} (${s.duration})`).join('\n')}\n\nYhteensä: ${totalPrice}€\n\n${note ? `Lisätiedot:\n${note}\n\n` : ''}Varaus ID: ${savedBooking._id}`,
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
