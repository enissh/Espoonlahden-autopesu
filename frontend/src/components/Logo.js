import React from 'react';
import { FaCar, FaWater } from 'react-icons/fa';
import './Logo.css';

const Logo = () => {
  return (
    <div className="logo-container">
      <div className="logo-icon">
        <FaCar className="car-icon" />
        <FaWater className="water-icon" />
      </div>
      <h1 className="logo-text">Premium Wash</h1>
    </div>
  );
};

export default Logo;
