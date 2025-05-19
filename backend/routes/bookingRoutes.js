const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

// Test email route
router.get('/test-email', async (req, res) => {
    try {
        const testBooking = {
            name: 'Test User',
            email: 'enisshabani71@gmail.com', // This will be the customer email
            phone: '+1234567890',
            service: 'Premium Wash',
            vehicleType: 'Sedan',
            date: new Date(),
            time: '14:00',
            duration: '30 minutes',
            note: 'This is a test booking'
        };

        // Send both emails
        await Promise.all([
            bookingController.sendCustomerEmail(testBooking),
            bookingController.sendAdminEmail(testBooking)
        ]);

        res.json({ message: 'Test emails sent successfully to both admin and customer!' });
    } catch (error) {
        console.error('Error sending test emails:', error);
        res.status(500).json({ error: 'Failed to send test emails', details: error.message });
    }
});

// Public routes (no auth required)
router.get('/', bookingController.getBookings);
router.post('/', bookingController.createBooking);

// Protected routes (auth required)
router.put('/:id', auth, bookingController.updateBooking);
router.delete('/:id', auth, bookingController.deleteBooking);

module.exports = router;
  