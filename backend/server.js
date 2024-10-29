const express = require('express');
const cors = require('cors');
const authRoutes = require('./authController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const natural = require('natural');
const pdfParse = require('pdf-parse'); // For PDF parsing
const mammoth = require('mammoth'); // For DOCX parsing

// Create the uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const app = express();
app.use(cors()); // Allows cross-origin requests from frontend
app.use(express.json()); // Parses JSON request bodies

// Set up routes for registration and login
app.use('/', authRoutes);

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Store files in the uploads directory
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep original file name
    }
});
const upload = multer({ storage: storage });

// Function to extract skills from the job description
const extractSkills = (jobDescription) => {
    const skillsPattern = /\b(react|javascript|degree|restful apis|responsive design|version control|unit testing|good communicator)\b/gi;
    return new Set(jobDescription.match(skillsPattern) || []);
};

// Function to read resume text based on file type
const readResumeText = async (resumePath, mimeType) => {
    let resumeText = '';

    if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(resumePath);
        const data = await pdfParse(dataBuffer);
        resumeText = data.text.toLowerCase();
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value: text } = await mammoth.extractRawText({ path: resumePath });
        resumeText = text.toLowerCase();
    } else if (mimeType === 'text/plain') {
        // Read text files
        resumeText = fs.readFileSync(resumePath, 'utf-8').toLowerCase();
    } else {
        throw new Error('Unsupported file format');
    }

    return resumeText;
};

// Function to extract resume data from uploaded file using basic NLP
const extractResumeData = async (resumePath, mimeType) => {
    const resumeText = await readResumeText(resumePath, mimeType);

    const name = extractName(resumeText);
    const email = extractContactInfo(resumeText, 'email');
    const phone = extractContactInfo(resumeText, 'phone');
    const education = extractEducation(resumeText);
    const skills = extractSkills(resumeText);
    const workExperience = extractWorkExperience(resumeText);

    return {
        name,
        email,
        phone,
        education,
        skills: Array.from(skills),
        workExperience
    };
};

// Function to extract name
const extractName = (resumeText) => {
    // Assuming the name is the first line
    return resumeText.split('\n')[0].trim();
};

// Function to extract contact information
const extractContactInfo = (resumeText, type) => {
    if (type === 'email') {
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const match = resumeText.match(emailPattern);
        return match ? match[0] : null;
    } else if (type === 'phone') {
        const phonePattern = /(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/; // Simple phone number pattern
        const match = resumeText.match(phonePattern);
        return match ? match[0] : null;
    }
    return null;
};

// Function to extract education
const extractEducation = (resumeText) => {
    return resumeText.match(/(?:degree in|bachelor of|master of|phd in)(.+?)(?=\.\s|$)/gi) || [];
};

// Function to extract work experience
const extractWorkExperience = (resumeText) => {
    return resumeText.match(/(?:worked at|employment:|experience:)(.+?)(?=\.\s|$)/gi) || [];
};

// Function to score resumes based on required skills and evaluation criteria
const scoreResume = (resume, requiredSkills, evaluationPoints) => {
    let skillScore = 0;

    // Score based on skills
    requiredSkills.forEach(skill => {
        if (resume.skills.includes(skill)) {
            skillScore++;
        }
    });

    // Score based on evaluation points
    let evaluationScore = evaluationPoints.reduce((total, item) => {
        const experienceWeight = item.experience || 0;
        const skillWeight = resume.skills.includes(item.skill) ? item.points : 0;
        return total + experienceWeight + skillWeight;
    }, 0);

    return skillScore + evaluationScore; // Combine scores
};

// API endpoint to evaluate resumes
app.post('/api/evaluate', upload.array('resumes'), async (req, res) => {
    const jobDescription = req.body.jobDescription;
    const requiredSkills = Array.from(extractSkills(jobDescription));
    const evaluationPoints = JSON.parse(req.body.evaluationPoints || "[]");

    try {
        // Collect resumes and their scores
        const scores = await Promise.all(req.files.map(async (file) => {
            const resumeData = await extractResumeData(file.path, file.mimetype);
            const totalScore = scoreResume(resumeData, requiredSkills, evaluationPoints);

            return {
                name: resumeData.name,
                email: resumeData.email,
                phone: resumeData.phone,
                education: resumeData.education,
                skills: resumeData.skills,
                workExperience: resumeData.workExperience,
                totalScore
            };
        }));

        // Sort scores in descending order
        const sortedScores = scores.sort((a, b) => b.totalScore - a.totalScore);

        // Clean up uploaded files
        req.files.forEach(file => fs.unlinkSync(file.path));

        // Return the sorted response data
        res.json(sortedScores);
    } catch (error) {
        console.error("Error processing evaluation:", error);
        res.status(500).json({ error: 'Error processing evaluation' });
    }
});

// Start the server on port 5000
app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
