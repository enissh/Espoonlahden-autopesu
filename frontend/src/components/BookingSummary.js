import React from 'react';
import { Modal, Button, Card } from 'react-bootstrap';

const getServiceDuration = (service) => {
  const durations = {
    'Peruspesu': '30 minuuttia',
    'Premium-pesu': '45 minuuttia',
    'Täyspesu': '2 tuntia',
    'Sisäpesu': '1 tunti',
    'Ulkopesu': '30 minuuttia',
    'Varattu': 'Vaihteleva'
  };
  return durations[service] || '30 minuuttia';
};

const BookingSummary = ({ booking, show, onHide, onEdit, onDelete }) => {
  if (!booking) return null;

  const serviceDuration = getServiceDuration(booking.service);

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Varauksen Tiedot</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card>
          <Card.Body>
            <div className="row">
              <div className="col-md-6">
                <h5 className="mb-4">Asiakkaan Tiedot</h5>
                <p><strong>Nimi:</strong> {booking.name}</p>
                <p><strong>Sähköposti:</strong> {booking.email}</p>
                <p><strong>Puhelin:</strong> {booking.phone}</p>
              </div>
              <div className="col-md-6">
                <h5 className="mb-4">Palvelun Tiedot</h5>
                <p><strong>Ajoneuvon Tyyppi:</strong> {booking.vehicleType}</p>
                <p><strong>Palvelu:</strong></p>
                <ul>
                  {Array.isArray(booking.services) && booking.services.length > 0 ? (
                    booking.services.map((service, idx) => (
                      <li key={idx}>
                        {service.name}
                        {service.price ? ` - ${service.price}` : ''}
                        {service.duration ? ` (${service.duration})` : ''}
                      </li>
                    ))
                  ) : booking.service ? (
                    <li>
                      {booking.service}
                      {booking.price ? ` - ${booking.price}` : ''}
                      {booking.duration ? ` (${booking.duration})` : ''}
                    </li>
                  ) : (
                    <li>Ei palvelutietoja</li>
                  )}
                </ul>
                <p><strong>Kesto:</strong> {serviceDuration}</p>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-12">
                <h5 className="mb-4">Varauksen Ajankohta</h5>
                <p><strong>Päivämäärä:</strong> {new Date(booking.date).toLocaleDateString('fi-FI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Aika:</strong> {booking.time}</p>
                {booking.note && (
                  <div className="mt-3">
                    <h5>Lisätiedot</h5>
                    <p>{booking.note}</p>
                  </div>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Sulje
        </Button>
        <Button variant="primary" onClick={onEdit}>
          Muokkaa Varausta
        </Button>
        <Button variant="danger" onClick={onDelete}>
          Poista Varaus
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BookingSummary; 