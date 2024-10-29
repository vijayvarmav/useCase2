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

// Function to extract skills from the job description
const extractSkillsFromJobDescription = (jobDescription) => {
    const skillsPattern = /\b(react|node|javascript|sql|git|css|html|api|development|mysql|material-ui|restful apis)\b/gi;
    return new Set(jobDescription.toLowerCase().match(skillsPattern) || []);
};

// Function to extract resume data from uploaded file using basic NLP
const extractResumeData = async (resumePath, mimeType, jobSkills) => {
    const resumeText = await readResumeText(resumePath, mimeType);

    const name = extractName(resumeText);
    const email = extractContactInfo(resumeText, 'email');
    const phone = extractContactInfo(resumeText, 'phone');
    const education = extractEducation(resumeText);
    const skills = extractSkillsFromResume(resumeText, jobSkills); // Pass jobSkills for filtering
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

// Function to extract skills from resume text
const extractSkillsFromResume = (resumeText, jobSkills) => {
    const skillsPattern = /\b(react|node|javascript|sql|git|css|html|api|development|mysql|material-ui|restful apis)\b/gi;
    const foundSkills = resumeText.match(skillsPattern) || [];
    const uniqueSkills = new Set(foundSkills);

    // Filter skills to include only those that are in jobSkills
    return new Set([...uniqueSkills].filter(skill => jobSkills.has(skill)));
};

// Function to extract name
const extractName = (resumeText) => {
    const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let name = '';

    // Pattern 1: Full name at the start (assumes first line is name)
    if (lines.length > 0) {
        name = lines[0];
    }

    // Pattern 2: Look for common name formats in subsequent lines
    const namePattern = /^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Prof\.?)?\s*([A-Z][a-z]+(\s+[A-Z][a-z]+)*\s+[A-Z][a-z]+)$/; // Example: "John Doe" or "Dr. Jane Smith"
    
    for (let i = 1; i < lines.length; i++) {
        const match = lines[i].match(namePattern);
        if (match) {
            name = match[0]; // Use the matched name format
            break;
        }
    }

    return name.trim();
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

// Function to calculate score based on skills found in both resume and evaluation points
const calculateScore = (skills, evaluationPoints) => {
    let score = 0;

    skills.forEach(skill => {
        if (evaluationPoints[skill]) {
            score += Number(evaluationPoints[skill]); // Ensure score is treated as a number
        }
    });

    return score;
};

// API endpoint to evaluate resumes
app.post('/api/evaluate', upload.array('resumes'), async (req, res) => {
    const jobDescription = req.body.jobDescription;
    const jobSkills = extractSkillsFromJobDescription(jobDescription);
    
    // Parse evaluation points as an object like { react: 5, node: 10 }
    const evaluationPoints = JSON.parse(req.body.evaluationPoints || "{}");
    console.log('Parsed Evaluation Points:', evaluationPoints); // Debugging line

    try {
        const results = await Promise.all(req.files.map(async (file) => {
            const resumeData = await extractResumeData(file.path, file.mimetype, jobSkills);

            // Debugging: Log the skills extracted from the resume
            console.log('Extracted Skills from Resume:', resumeData.skills);

            // Calculate the score based on evaluation points
            const score = calculateScore(resumeData.skills, evaluationPoints);
            console.log('Calculated Score:', score); // Debugging line

            return {
                score, // This should be a number now
                name: resumeData.name,
                email: resumeData.email,
                phone: resumeData.phone,
                education: resumeData.education,
                skills: resumeData.skills,
                workExperience: resumeData.workExperience
            };
        }));

        // Clean up uploaded files
        req.files.forEach(file => fs.unlinkSync(file.path));

        res.json(results);
    } catch (error) {
        console.error("Error processing evaluation:", error);
        res.status(500).json({ error: 'Error processing evaluation' });
    }
});

// Start the server on port 5000
app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
