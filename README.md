#  Voice-Enabled Task Tracker

A modern task management application with intelligent voice input powered by AI. Create tasks naturally by speaking, and let AI extract the details.

![Demo](demo.gif)

##  Features

-  **Voice Input**: Speak naturally to create tasks
-  **AI-Powered Parsing**: Intelligent extraction of title, priority, due dates
-  **Dual Views**: Kanban board and list view
-  **Advanced Filters**: Search and filter by status, priority, due date
-  **Full CRUD**: Create, read, update, delete tasks
-  **Responsive Design**: Works on desktop and mobile
-  **Persistent Storage**: MongoDB backend with real-time sync

##  Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Anthropic API key for AI parsing

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/voice-task-tracker.git
cd voice-task-tracker
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and Anthropic API key
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

4. **Access the app**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

##  Configuration

### Environment Variables

**Backend** (`.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-tracker
ANTHROPIC_API_KEY=your_api_key_here
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

**Frontend** (`.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Getting API Keys

1. **Anthropic Claude**: 
   - Sign up at https://console.anthropic.com
   - Create API key in settings
   - Add to backend `.env`

##  Usage Examples

### Voice Input Examples

**Example 1: Basic Task**
```
"Create a task to review the pull request"
```
Result: Task with title "Review the pull request", Medium priority

**Example 2: With Priority**
```
"Add a high priority task to fix the login bug by tomorrow"
```
Result: High priority task due tomorrow

**Example 3: Complex Task**
```
"Remind me to send the project proposal to the client by next Wednesday evening, it's urgent"
```
Result: High priority task due next Wednesday at 6 PM

### Supported Date Formats

- **Relative**: tomorrow, today, next week, in 3 days, next Monday
- **Absolute**: December 15, Jan 20, 15th January
- **Time**: evening (6 PM), morning (9 AM), afternoon (2 PM)

### Supported Priority Keywords

- **High**: urgent, critical, high priority, important, asap
- **Low**: low priority, minor, small, whenever
- **Medium**: (default if no keywords)

##  Architecture

### Tech Stack

**Frontend**
- React 18
- Lucide React (icons)
- Web Speech API
- Axios

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Anthropic Claude API
- Joi (validation)

### Project Structure

```
task-tracker/
├── frontend/               # React application
│   ├── src/
│   │   ├── services/      # API and voice services
│   │   ├── hooks/         # Custom React hooks
│   │   └── App.js         # Main app component
│   └── package.json
├── backend/               # Express API
│   ├── src/
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── services/     # AI parsing service
│   │   └── server.js     # Entry point
│   └── package.json
└── README.md
```

##  API Documentation

### Endpoints

#### Get All Tasks
```http
GET /api/tasks?status=To Do&priority=High&search=review
```

#### Parse Voice Input
```http
POST /api/tasks/parse-voice
Content-Type: application/json

{
  "transcript": "Create a high priority task to review PR by tomorrow"
}
```

#### Create Task
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Review pull request",
  "description": "Check authentication module",
  "status": "To Do",
  "priority": "High",
  "dueDate": "2024-12-15T00:00:00.000Z"
}
```

#### Update Task
```http
PUT /api/tasks/:id
Content-Type: application/json

{
  "status": "In Progress"
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
```

##  Design Decisions

### Why These Choices?

1. **Web Speech API**: Native browser support, no external dependencies for speech recognition
2. **Claude API**: Superior natural language understanding compared to regex-based parsing
3. **MongoDB**: Flexible schema allows easy addition of new task fields
4. **React Hooks**: Modern, functional approach with better code reusability
5. **localStorage Demo**: Allows testing without backend setup

### Assumptions

- Users speak in English
- Modern browser (Chrome/Edge for voice input)
- Single-user application (no authentication needed)
- Tasks are personal (no sharing/collaboration)
- Internet connection available for AI parsing

##  AI Tools Used

### Development Process

1. **Claude (Anthropic)**
   - **Used for**: Project architecture, code generation, API design
   - **Key prompts**: "Design a RESTful API for task management with voice input"
   - **Impact**: Structured the entire backend architecture and AI parsing logic

2. **GitHub Copilot**
   - **Used for**: Autocomplete, boilerplate code, test cases
   - **Impact**: Accelerated development by 30-40%

3. **ChatGPT**
   - **Used for**: Research on Web Speech API, date parsing algorithms
   - **Impact**: Improved natural language date understanding

### Key Learnings

- AI excels at standard patterns and boilerplate
- Manual refinement needed for domain-specific logic
- Iterative prompting yields better results
- Always validate AI-generated code for edge cases


##  Known Limitations

1. Voice input requires Chrome/Edge browser
2. AI parsing works best with English language
3. Date parsing may struggle with ambiguous dates
4. No offline support (requires internet for AI)
5. Single-user only (no multi-tenant support)


##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


**⭐ If you found this project helpful, please give it a star!**