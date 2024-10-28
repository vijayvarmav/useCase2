import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const [submittedTexts, setSubmittedTexts] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = () => {
    if (inputText) {
      const newTexts = inputText
        .split(",")
        .map((text) => text.trim())
        .filter((text) => text);
      
      if (editIndex !== null) {
        // Edit existing text
        const updatedTexts = [...submittedTexts];
        updatedTexts[editIndex] = {
          text: newTexts,
          experience: 0, // Initialize experience to 0 for edited items
        };
        setSubmittedTexts(updatedTexts);
        setEditIndex(null);
      } else {
        // Add new texts
        const newEntries = newTexts.map((text) => ({
          text: [text],
          experience: 0, // Initialize experience to 0 for new items
        }));
        setSubmittedTexts([...submittedTexts, ...newEntries]);
      }
      setInputText("");
      setDialogVisible(false);
    }
  };

  const handleEdit = (index) => {
    const { text } = submittedTexts[index];
    setEditIndex(index);
    setInputText(text.join(", ")); // Set input to the text being edited
    setDialogVisible(true);
  };

  const handleDelete = (index) => {
    const updatedTexts = submittedTexts.filter((_, i) => i !== index);
    setSubmittedTexts(updatedTexts);
  };

  const handleExperienceChange = (index, value) => {
    const updatedTexts = [...submittedTexts];
    updatedTexts[index].experience = value; // Update experience for the specific item
    setSubmittedTexts(updatedTexts);
  };

  const handleFinalSubmit = () => {
    // Navigate to the new page with submitted texts as state
    navigate('/requirements', { state: { submittedTexts } });
  };

  return (
    <div className="container mt-3">
      {user ? (
        <div className="p-3 mt-1 d-flex justify-content-between">
          <h2>Welcome, {user.name}!</h2>
          <button className="btn btn-danger" onClick={logout}>
            Logout
          </button>
        </div>
      ) : (
        <h2>Please log in</h2>
      )}

      <div className="d-flex flex-column align-items-center justify-content-center">
        <button
          className="btn btn-primary me-2 rounded-circle"
          onClick={() => {
            setEditIndex(null);
            setDialogVisible(true);
          }}
        >
          +
        </button>
        <span>Click the "+" button to add requirements.</span>
      </div>

      {/* Dialog for input */}
      {dialogVisible && (
        <div className="modal show mt-5" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header d-flex justify-content-between">
                <h5 className="modal-title">
                  {editIndex !== null ? "Edit Requirements" : "Add Requirements"}
                </h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setDialogVisible(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Enter Requirements (separated by commas)"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDialogVisible(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  {editIndex !== null ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display submitted texts */}
      <div className="p-3 mt-3">
        <h4>Requirements:</h4>
        <ul className="list-unstyled">
          {submittedTexts.map((item, index) => (
            <li key={index} className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <span>{item.text.join(", ")}</span>
                <div className="d-flex justify-content-evenly">
                  <span className="px-2">
                    <label>Years of Experience: {item.experience}</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={item.experience}
                      onChange={(e) => handleExperienceChange(index, e.target.value)}
                      className="form-range"
                    />
                  </span>
                  <button
                    className="btn btn-warning btn-sm me-2 p-3"
                    onClick={() => handleEdit(index)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        {/* Submit button at the end of the requirements */}
        {submittedTexts.length > 0 && (
          <button
            className="btn btn-primary mt-3"
            onClick={handleFinalSubmit}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
