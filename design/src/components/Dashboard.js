import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const [submittedTexts, setSubmittedTexts] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFiles, setResumeFiles] = useState([]);
  const [evaluationPoints, setEvaluationPoints] = useState([]);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleResumeChange = (e) => {
    setResumeFiles(e.target.files);
  };

  const handleEvaluationPointsChange = (index, value) => {
    const updatedPoints = [...evaluationPoints];
    if (updatedPoints[index]) {
      updatedPoints[index].points = value; // Update the points for the specific item
    }
    setEvaluationPoints(updatedPoints);
  };

  const handleSubmit = () => {
    if (inputText) {
      const newTexts = inputText
        .split(",")
        .map((text) => text.trim())
        .filter((text) => text);

      const newEntry = {
        text: newTexts,
        points: 0, // Initialize with 0
      };

      if (editIndex !== null) {
        // Edit the existing entry
        const updatedTexts = [...submittedTexts];
        updatedTexts[editIndex] = newEntry;

        const updatedEvaluationPoints = [...evaluationPoints];
        updatedEvaluationPoints[editIndex] = newEntry;

        setSubmittedTexts(updatedTexts);
        setEvaluationPoints(updatedEvaluationPoints);
        setEditIndex(null); // Clear edit index for future additions
      } else {
        // Add new entry
        setSubmittedTexts((prev) => [...prev, newEntry]);
        setEvaluationPoints((prev) => [...prev, newEntry]);
      }

      setInputText("");
      setDialogVisible(false);
    }
  };

  const handleEvaluateResumes = async () => {
    const formData = new FormData();

    formData.append("jobDescription", jobDescription);
    console.log("Evaluation Points before submission:", JSON.stringify(evaluationPoints));
    formData.append("evaluationPoints", JSON.stringify(evaluationPoints));

    Array.from(resumeFiles).forEach((file) => {
      formData.append("resumes", file);
    });

    try {
      const response = await axios.post("http://localhost:5000/api/evaluate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Store the results and potentially display them to the user
      setResults(response.data);

    } catch (error) {
      console.error("Error evaluating resumes:", error);
    }
  };

  const handleEdit = (index) => {
    const { text } = submittedTexts[index];
    setEditIndex(index);
    setInputText(text.join(", "));
    setDialogVisible(true);
  };

  const handleDelete = (index) => {
    const updatedTexts = submittedTexts.filter((_, i) => i !== index);
    setSubmittedTexts(updatedTexts);
    const updatedPoints = evaluationPoints.filter((_, i) => i !== index);
    setEvaluationPoints(updatedPoints);
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

      <div className="mt-3">
        <h4>Job Description:</h4>
        <textarea
          value={jobDescription}
          onChange={handleJobDescriptionChange}
          className="form-control"
          rows="5"
          placeholder="Enter Job Description"
        />
      </div>

      <div className="mt-3">
        <h4>Upload Resumes:</h4>
        <input
          type="file"
          onChange={handleResumeChange}
          multiple
          accept=".txt,.pdf,.doc,.docx"
          className="form-control"
        />
      </div>

      <div className="d-flex flex-column align-items-center justify-content-center">
        <button
          className="btn btn-primary me-2 rounded-circle mt-3"
          onClick={() => {
            setEditIndex(null);
            setDialogVisible(true);
          }}
        >
          +
        </button>
        <span>Click the "+" button to add Evaluation Points</span>
      </div>

      <div className="p-3 mt-3">
        <h4>Evaluation Points:</h4>
        <ul className="list-unstyled">
          {evaluationPoints.map((item, index) => (
            <li key={index} className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <span>{item.text.join(", ")}</span>
                <div className="d-flex align-items-center">
                  <span className="px-2 me-3">
                    <label className="me-2">Points:</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={item.points}
                      onChange={(e) => handleEvaluationPointsChange(index, e.target.value)}
                      className="form-range"
                      style={{ width: "100px" }}
                    />
                    <span>{item.points}</span>
                  </span>
                  <button
                    className="btn btn-warning btn-sm me-2"
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
      </div>

      <div className="d-flex justify-content-center">
        <button className="btn btn-success mt-3 text-center" onClick={handleEvaluateResumes}>
          Evaluate Resumes
        </button>
      </div>

      {/* Display Evaluation Results */}
      {results.length > 0 && (
        <div className="mt-3">
          <h4>Evaluation Results:</h4>
          <ul className="list-group">
            {results.map((result, index) => (
              <li key={index} className="list-group-item">
                <strong>{result.name}</strong> (Score: {result.totalScore})
                <div>Email: {result.email}</div>
                <div>Phone: {result.phone}</div>
                <div>Education: {result.education.join(', ')}</div>
                <div>Skills: {result.skills.join(', ')}</div>
                <div>Experience: {result.workExperience.join(', ')}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dialogVisible && (
        <div className="modal show mt-5" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header d-flex justify-content-between">
                <h5 className="modal-title">
                  {editIndex !== null ? "Edit Requirements" : "Add Requirements"}
                </h5>
                <button type="button" className="close" onClick={() => setDialogVisible(false)}>
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
                <button type="button" className="btn btn-secondary" onClick={() => setDialogVisible(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                  {editIndex !== null ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
