import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RequirementsDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { submittedTexts } = location.state || { submittedTexts: [] }; // Get submitted texts from state

  return (
    <div className="container mt-3">
      <h2>Submitted Requirements</h2>
      <ul className="list-unstyled">
        {submittedTexts.map((item, index) => (
          <li key={index} className="mb-3">
            <span>{item.text.join(", ")}</span> - <strong>Experience: {item.experience} years</strong>
          </li>
        ))}
      </ul>
      
      {/* Button to go back */}
      <button
        className="btn btn-secondary mt-3"
        onClick={() => navigate(-1)} // Go back to the previous page
      >
        Go Back
      </button>
    </div>
  );
};

export default RequirementsDisplay;
