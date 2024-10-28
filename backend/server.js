const express = require('express');
const cors = require('cors');
const authRoutes = require('./authController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors()); // Allows cross-origin requests from frontend
app.use(express.json()); // Parses JSON request bodies

// Set up routes for registration and login
app.use('/', authRoutes);

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Function to extract skills from the job description
const extractSkills = (jobDescription) => {
    const skillsPattern = /\b(react|javascript|degree|restful apis|responsive design|version control|unit testing)\b/gi;
    return new Set(jobDescription.match(skillsPattern).map(skill => skill.toLowerCase()));
};

// Function to extract resume data from uploaded file
const extractResumeData = (resumePath) => {
    return fs.readFileSync(resumePath, 'utf-8').toLowerCase();
};

// Function to score resumes based on required skills
const scoreResume = (resumeText, requiredSkills) => {
    let score = 0;
    requiredSkills.forEach(skill => {
        if (resumeText.includes(skill)) {
            score++;
        }
    });
    return score;
};

// API endpoint to evaluate resumes
app.post('/api/evaluate', upload.array('resumes'), (req, res) => {
    const jobDescription = req.body.jobDescription;
    const requiredSkills = Array.from(extractSkills(jobDescription));
    const rankedResumes = [];

    req.files.forEach(file => {
        const resumeText = extractResumeData(file.path);
        const score = scoreResume(resumeText, requiredSkills);
        rankedResumes.push({
            name: file.originalname,
            score: score
        });
    });

    rankedResumes.sort((a, b) => b.score - a.score);

    // Clean up uploaded files
    req.files.forEach(file => {
        fs.unlinkSync(file.path);
    });

    res.json(rankedResumes);
});

// Start the server on port 5000
app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
