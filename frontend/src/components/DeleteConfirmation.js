import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import './DeleteConfirmation.css';

const DeleteConfirmation = ({ show, onHide, onConfirm, booking }) => {
  if (!booking) return null;

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      className="delete-confirmation-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Vahvista Poisto</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="delete-confirmation-content">
          <div className="warning-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h4 className="confirmation-title">Haluatko varmasti poistaa tämän varauksen?</h4>
          <div className="booking-details">
            <p><strong>Asiakas:</strong> {booking.name}</p>
            <p><strong>Palvelu:</strong> {booking.service}</p>
            <p><strong>Päivämäärä:</strong> {new Date(booking.date).toLocaleDateString('fi-FI', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Aika:</strong> {booking.time}</p>
          </div>
          <p className="warning-text">Tätä toimintoa ei voi peruuttaa.</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Peruuta
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Poista Varaus
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmation; 