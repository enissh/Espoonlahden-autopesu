import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const vehicleTypes = [
  { value: 'auto', label: 'Henkilöauto' },
  { value: 'maastoauto', label: 'Maastoauto' },
  { value: 'pakettiauto', label: 'Pakettiauto' },
  { value: 'asuntoauto', label: 'Asuntoauto' },
  { value: 'admin-block', label: 'Varattu (Admin)' }
];

const services = [
  'PERUSPESU',
  'PREMIUMPESU',
  'Talvipesu',
  'KEVYT SISÄPUHDISTUS',
  'TÄYDELLINEN SISÄPUHDISTUS',
  'TOTAL SISÄPUHDISTUS',
  'Nanokeraaminen pinnoite PCS2',
  'KOVAVAHA',
  'NANOVAHA',
  'Varattu'
];

const EditBookingForm = ({ booking, show, onHide, onSave, onChange }) => {
  if (!booking) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Muokkaa Varausta</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Nimi</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={booking.name}
              onChange={onChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Sähköposti</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={booking.email}
              onChange={onChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Puhelin</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              value={booking.phone}
              onChange={onChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Ajoneuvon Tyyppi</Form.Label>
            <Form.Select
              name="vehicleType"
              value={booking.vehicleType}
              onChange={onChange}
              required
            >
              <option value="">Valitse ajoneuvon tyyppi</option>
              {vehicleTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Palvelu</Form.Label>
            <Form.Select
              name="service"
              value={booking.service}
              onChange={onChange}
              required
            >
              <option value="">Valitse palvelu</option>
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Päivämäärä</Form.Label>
            <Form.Control
              type="date"
              name="date"
              value={booking.date}
              onChange={onChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Aika</Form.Label>
            <Form.Control
              type="time"
              name="time"
              value={booking.time}
              onChange={onChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Lisätiedot</Form.Label>
            <Form.Control
              as="textarea"
              name="note"
              value={booking.note || ''}
              onChange={onChange}
              rows={3}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Peruuta
        </Button>
        <Button variant="primary" onClick={onSave}>
          Tallenna Muutokset
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditBookingForm; 