import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fi';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import BookingSummary from './BookingSummary';
import EditBookingForm from './EditBookingForm';
import DeleteConfirmation from './DeleteConfirmation';
import { Modal, Button } from 'react-bootstrap';

// Set moment to use Finnish locale
moment.locale('fi');
const localizer = momentLocalizer(moment);

const MyCalendar = ({ bookings, onBookingsChange, formatBookingDetails, onBookingClick }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editedBooking, setEditedBooking] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const token = localStorage.getItem('token');

  const handleSelectEvent = (event) => {
    const booking = bookings.find(b => b._id === event.id);
    setSelectedBooking(booking);
    setShowSummary(true);
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/bookings/${selectedBooking._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.status === 200) {
        const updatedBookings = bookings.filter(b => b._id !== selectedBooking._id);
        onBookingsChange(updatedBookings);
        setShowDeleteModal(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const events = bookings.map(formatBookingDetails);

  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/bookings/${selectedBooking._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.status === 200) {
        onBookingsChange(bookings.filter(b => b._id !== selectedBooking._id));
        setShowDeleteConfirm(false);
        setShowSummary(false);
      } else {
        throw new Error('Varauksen poisto epäonnistui');
      }
    } catch (error) {
      console.error('Virhe poistettaessa varausta:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Varauksen poisto epäonnistui. Yritä uudelleen.');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setShowSummary(false);
  };

  const handleEdit = () => {
    setShowSummary(false);
    setEditedBooking(selectedBooking);
    setShowEditForm(true);
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/bookings/${selectedBooking._id}`,
        editedBooking,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const updatedBookings = bookings.map(b => 
        b._id === selectedBooking._id ? response.data : b
      );
      
      onBookingsChange(updatedBookings);
      setShowEditForm(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Virhe päivitettäessä varausta:', error);
      alert('Varauksen päivitys epäonnistui');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedBooking(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={handleSelectEvent}
        tooltipAccessor={event => event.description || event.title}
      />

      <BookingSummary
        booking={selectedBooking}
        show={showSummary}
        onHide={() => setShowSummary(false)}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <EditBookingForm
        booking={editedBooking}
        show={showEditForm}
        onHide={() => setShowEditForm(false)}
        onSave={handleSave}
        onChange={handleInputChange}
      />

      <DeleteConfirmation
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        booking={selectedBooking}
      />

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <div>
              <p>Are you sure you want to delete this booking?</p>
              <p><strong>Customer:</strong> {selectedBooking.name}</p>
              <p><strong>Services:</strong></p>
              <ul>
                {selectedBooking.services ? (
                  selectedBooking.services.map((service, index) => (
                    <li key={index}>{service.name} - {service.price}</li>
                  ))
                ) : (
                  <li>{selectedBooking.service}</li>
                )}
              </ul>
              <p><strong>Date:</strong> {selectedBooking.date}</p>
              <p><strong>Time:</strong> {selectedBooking.time} - {selectedBooking.endTime}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteBooking}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MyCalendar;
