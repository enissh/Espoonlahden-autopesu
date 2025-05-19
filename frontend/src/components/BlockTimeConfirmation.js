import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import './BlockTimeConfirmation.css';

const BlockTimeConfirmation = ({ show, onHide, onConfirm, blockData }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  if (!blockData) return null;

  const handleConfirm = async () => {
    setShowSuccess(true);
    await onConfirm();
    
    // Hide success message after animation
    setTimeout(() => {
      setShowSuccess(false);
      onHide();
    }, 2500);
  };

  return (
    <>
      <Modal 
        show={show} 
        onHide={onHide}
        centered
        className="block-confirmation-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Vahvista Ajan Varaus</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="block-confirmation-content">
            <div className="info-icon">
              <i className="fas fa-clock"></i>
            </div>
            <h4 className="confirmation-title">Vahvista ajan varaaminen</h4>
            <div className="block-details">
              <p><strong>Kuvaus:</strong> {blockData.name}</p>
              <p><strong>Päivämäärä:</strong> {new Date(blockData.date).toLocaleDateString('fi-FI', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Alkamisaika:</strong> {blockData.startTime}</p>
              <p><strong>Päättymisaika:</strong> {blockData.endTime}</p>
              {blockData.note && (
                <p><strong>Lisätiedot:</strong> {blockData.note}</p>
              )}
            </div>
            <p className="info-text">Tämä aika merkitään varatuksi kalenteriin.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Peruuta
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Vahvista Varaus
          </Button>
        </Modal.Footer>
      </Modal>

      {showSuccess && (
        <>
          <div className="success-overlay" />
          <div className="success-animation">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="success-message">
              Aika varattu onnistuneesti!
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BlockTimeConfirmation; 