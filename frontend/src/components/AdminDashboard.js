import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaUserAlt, FaCog, FaClipboardList, FaUserCircle, FaSignOutAlt, FaBars } from 'react-icons/fa';
import './AdminDashboard.css';
import MyCalendar from './MyCalendar';
import BlockTimeConfirmation from './BlockTimeConfirmation';
import { API_BASE_URL } from '../config';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [newBooking, setNewBooking] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    note: '',
  });
  const [showBlockConfirmation, setShowBlockConfirmation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Generate time slots in 15-minute intervals
  const generateTimeOptions = () => {
    const times = [];
    let hour = 9; // Start at 9 AM
    while (hour < 18) { // Until 6 PM
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeStr);
      }
      hour++;
    }
    times.push('18:00'); // Add 6 PM as the last option
    return times;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');

    if (!token || !email) {
      navigate('/admin-login');
      return;
    }

    setUserEmail(email);

    // Verify token validity
    const verifyToken = async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/admin/test`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.error('Token verification error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/admin-login');
      }
    };

    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/bookings`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setBookings(res.data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Virhe varausten hakemisessa');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          navigate('/admin-login');
        }
      }
    };

    verifyToken();
    fetchBookings();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newBooking.name || !newBooking.date || !newBooking.startTime || !newBooking.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate that end time is after start time
    if (newBooking.startTime >= newBooking.endTime) {
      alert('End time must be after start time');
      return;
    }

    // Show confirmation modal
    setShowBlockConfirmation(true);
  };

  const handleConfirmBlock = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin-login');
      return;
    }

    try {
      const bookingData = {
        ...newBooking,
        vehicleType: 'admin-block',
        service: 'Reserved Block',
        time: newBooking.startTime,
        endTime: newBooking.endTime,
        email: userEmail,
        phone: 'Admin Reservation',
        isAdminBlock: true,
        name: newBooking.name || 'Admin Block' // Use the name provided or default to 'Admin Block'
      };

      const res = await axios.post(`${API_BASE_URL}/api/bookings`, bookingData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      setBookings(prevBookings => [...prevBookings, res.data]);
      setNewBooking({
        name: '',
        date: '',
        startTime: '',
        endTime: '',
        note: '',
      });
      setShowBlockConfirmation(false);
    } catch (err) {
      console.error('Error creating booking:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/admin-login');
      }
    }
  };

  const handleBookingsChange = (updatedBookings) => {
    setBookings(updatedBookings);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/admin-login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const formatBookingDetails = (booking) => {
    if (booking.isAdminBlock) {
      return {
        title: booking.name,
        description: 'Admin Block',
        start: new Date(`${booking.date}T${booking.time}`),
        end: new Date(`${booking.date}T${booking.endTime}`),
        id: booking._id
      };
    } else if (booking.services && Array.isArray(booking.services)) {
      const totalPrice = booking.services.reduce((sum, service) => 
        sum + parseInt(service.price.replace('€', '')), 0);
      
      return {
        title: `${booking.name} - ${totalPrice}€`,
        description: booking.services.map(s => s.name).join(', '),
        start: new Date(`${booking.date}T${booking.time}`),
        end: new Date(`${booking.date}T${booking.endTime}`),
        id: booking._id
      };
    } else {
      return {
        title: `${booking.name} - ${booking.service}`,
        start: new Date(`${booking.date}T${booking.time}`),
        end: new Date(`${booking.date}T${booking.endTime}`),
        id: booking._id
      };
    }
  };

  return (
    <div className="admin-dashboard">
      <nav className="custom-navbar">
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <span className="navbar-brand">Premium Wash - {userEmail}</span>
      </nav>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <div className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
        <ul>
          <li><Link to="/admin-dashboard" onClick={closeSidebar}><FaUserAlt className="sidebar-icon" /> Hallintapaneeli</Link></li>
          <li><Link to="/admin-dashboard/settings" onClick={closeSidebar}><FaCog className="sidebar-icon" /> Asetukset</Link></li>
          <li><Link to="/admin-dashboard/bookings" onClick={closeSidebar}><FaClipboardList className="sidebar-icon" /> Varaukset</Link></li>
          <li><Link to="/admin-dashboard/profile" onClick={closeSidebar}><FaUserCircle className="sidebar-icon" /> Profiili</Link></li>
        </ul>

        <button onClick={handleLogout} className="btn btn-danger logout-btn">
          <FaSignOutAlt /> Kirjaudu ulos
        </button>
      </div>

      <div className="container mt-5">
        {error && <div className="alert alert-danger">{error}</div>}
        <h2>Hallintapaneeli</h2>

        <div className="row">
          <div className="col-md-3">
            <div className="reservation-form card p-3">
              <h3 className="mb-4">Varaa Aika</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label>Kuvaus/Nimi</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={newBooking.name}
                    onChange={handleChange}
                    placeholder="esim. Huolto, Varattu, jne."
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Päivämäärä</label>
                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    value={newBooking.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Alkamisaika</label>
                  <select
                    name="startTime"
                    className="form-control"
                    value={newBooking.startTime}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Valitse alkamisaika</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label>Päättymisaika</label>
                  <select
                    name="endTime"
                    className="form-control"
                    value={newBooking.endTime}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Valitse päättymisaika</option>
                    {timeOptions
                      .filter(time => time > newBooking.startTime)
                      .map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label>Lisätiedot</label>
                  <textarea
                    name="note"
                    className="form-control"
                    value={newBooking.note}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Lisätietoja..."
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Varaa Aika
                </button>
              </form>
            </div>
          </div>

          <div className="col-md-9">
            <div className="my-calendar">
              <MyCalendar 
                bookings={bookings} 
                onBookingsChange={handleBookingsChange}
                formatBookingDetails={formatBookingDetails}
                onBookingClick={(booking) => setSelectedBooking(booking)}
              />
            </div>
          </div>
        </div>
      </div>

      <BlockTimeConfirmation
        show={showBlockConfirmation}
        onHide={() => setShowBlockConfirmation(false)}
        onConfirm={handleConfirmBlock}
        blockData={{
          name: newBooking.name,
          date: newBooking.date,
          startTime: newBooking.startTime,
          endTime: newBooking.endTime,
          note: newBooking.note
        }}
      />

      <div className="booking-details">
        {selectedBooking && (
          <div>
            <h4>{selectedBooking.name ? `Nimi/Rekisterinumero: ${selectedBooking.name}` : ''}</h4>
            <p><strong>Palvelu:</strong></p>
            <ul>
              {selectedBooking.services && selectedBooking.services.length > 0 ? (
                selectedBooking.services.map((service, index) => (
                  <li key={index}>
                    {service.name} - {service.price} {service.duration ? `(${service.duration})` : ''}
                  </li>
                ))
              ) : selectedBooking.service ? (
                <li>
                  {selectedBooking.service}
                  {selectedBooking.price ? ` - ${selectedBooking.price}` : ''}
                  {selectedBooking.duration ? ` (${selectedBooking.duration})` : ''}
                </li>
              ) : (
                <li>Ei palvelutietoja</li>
              )}
            </ul>
            <p><strong>Total Duration:</strong> {selectedBooking.duration}</p>
            <p><strong>Time:</strong> {selectedBooking.time} - {selectedBooking.endTime}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
