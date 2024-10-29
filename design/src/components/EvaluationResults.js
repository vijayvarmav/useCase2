// src/components/EvaluationResults.js
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const EvaluationResults = () => {
    const location = useLocation();
    const results = location.state?.results || []; // Get results passed from the Dashboard

    // Sort results by score in descending order
    const sortedResults = results.sort((a, b) => b.score - a.score);

    return (
        <div className="container mt-3">
            <h1>Evaluation Results</h1>
            <ul className="list-group">
                {sortedResults.map((result, index) => (
                    <li key={index} className="list-group-item">
                        <strong>{result.name}</strong> (Score: {result.score})
                        <div>Email: {result.email}</div>
                        <div>Phone: {result.phone}</div>
                        <div>Education: {result.education.join(', ')}</div>
                        <div>Skills: {result.skills.join(', ')}</div>
                        <div>Experience: {result.workExperience.join(', ')}</div>
                    </li>
                ))}
            </ul>
            <Link to="/dashboard" className="btn btn-primary mt-3">Back to Dashboard</Link>
        </div>
    );
};

export default EvaluationResults;
