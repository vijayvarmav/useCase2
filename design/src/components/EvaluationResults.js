import React from 'react';
import { useLocation } from 'react-router-dom';

const EvaluationResults = () => {
    const { state } = useLocation();
    const { evaluationResults } = state || { evaluationResults: [] };

    return (
        <div className="container mt-3">
            <h2>Evaluation Results</h2>
            {evaluationResults.length === 0 ? (
                <p>No results found.</p>
            ) : (
                <ul className="list-unstyled">
                    {evaluationResults.map((result, index) => (
                        <li key={index} className="mb-3">
                            <h5>Name: {result.name}</h5>
                            <p>Score: {result.score}</p>
                            <p>Submitted by: {result.userName}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default EvaluationResults;
