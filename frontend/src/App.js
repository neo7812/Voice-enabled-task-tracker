import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Plus, Search, Filter, X, Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';

// Mock AI parsing function (simulates Claude API or similar)
const parseVoiceInput = async (transcript) => {
  // In production, this would call Claude API or similar
  // For demo, we'll use rule-based parsing
  
  let title = transcript;
  let priority = 'Medium';
  let dueDate = null;
  let status = 'To Do';
  
  // Extract priority
  const priorityKeywords = {
    'urgent|critical|high priority|important': 'High',
    'low priority|minor|small': 'Low'
  };
  
  for (const [keywords, level] of Object.entries(priorityKeywords)) {
    const regex = new RegExp(keywords, 'i');
    if (regex.test(transcript)) {
      priority = level;
      title = title.replace(regex, '').trim();
      break;
    }
  }
  
  // Extract due dates
  const datePatterns = [
    { pattern: /tomorrow/i, getDays: () => 1 },
    { pattern: /today/i, getDays: () => 0 },
    { pattern: /next week/i, getDays: () => 7 },
    { pattern: /in (\d+) days?/i, getDays: (match) => parseInt(match[1]) },
    { pattern: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, getDays: (match) => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = new Date().getDay();
      const target = days.indexOf(match[1].toLowerCase());
      return target >= today ? target - today : 7 - today + target;
    }}
  ];
  
  for (const { pattern, getDays } of datePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      const date = new Date();
      date.setDate(date.getDate() + getDays(match));
      dueDate = date.toISOString().split('T')[0];
      title = title.replace(pattern, '').trim();
      break;
    }
  }
  
  // Clean up common phrases
  title = title
    .replace(/^(create|add|remind me to|make a task to|task to)\s+/i, '')
    .replace(/\s+(task|by|before|due)\s*$/i, '')
    .trim();
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  return { title, priority, dueDate, status, transcript };
};

const TaskTracker = () => {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('kanban'); // 'kanban' or 'list'
  const [isRecording, setIsRecording] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [voiceData, setVoiceData] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      recognitionInstance.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        const parsed = await parseVoiceInput(text);
        setVoiceData(parsed);
        setShowVoicePreview(true);
        setIsRecording(false);
      };
      
      recognitionInstance.onerror = () => {
        setIsRecording(false);
        alert('Speech recognition error. Please try again.');
      };
      
      setRecognition(recognitionInstance);
    }
    
    // Load tasks from storage
    const saved = window.localStorage.getItem('tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const startRecording = () => {
    if (recognition) {
      setTranscript('');
      setIsRecording(true);
      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
  };

  const createTask = (taskData) => {
    const newTask = {
      id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'To Do',
      priority: taskData.priority || 'Medium',
      dueDate: taskData.dueDate || null,
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id, updates) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, ...updates } : task));
  };

  const deleteTask = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'bg-red-100 text-red-800 border-red-300',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Low': 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[priority] || colors.Medium;
  };

  const TaskCard = ({ task }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900 flex-1">{task.title}</h3>
        <div className="flex gap-2 ml-2">
          <button onClick={() => setEditingTask(task)} className="text-gray-400 hover:text-blue-600">
            <Edit2 size={16} />
          </button>
          <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {task.description && (
        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
      )}
      <div className="flex gap-2 items-center flex-wrap">
        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 flex items-center gap-1">
            <Calendar size={12} />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );

  const TaskForm = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState(initialData || {
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      dueDate: ''
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">{initialData?.id ? 'Edit Task' : 'Create Task'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows="3"
                placeholder="Enter task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option>To Do</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => {
                if (formData.title.trim()) {
                  onSave(formData);
                  onCancel();
                }
              }}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {initialData?.id ? 'Update' : 'Create'}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Voice-Enabled Task Tracker</h1>
          
          {/* Actions */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <button
              onClick={() => setShowManualForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Task
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-lg flex items-center gap-2`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              {isRecording ? 'Stop Recording' : 'Voice Input'}
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setView('kanban')}
                className={`px-4 py-2 rounded-lg ${view === 'kanban' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                Kanban
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Tasks Display */}
        {view === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['To Do', 'In Progress', 'Done'].map(status => (
              <div key={status} className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="font-bold text-lg mb-4 text-gray-700">{status}</h2>
                <div className="space-y-3">
                  {filteredTasks.filter(t => t.status === status).map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {filteredTasks.filter(t => t.status === status).length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-8">No tasks</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-4">
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            {filteredTasks.length === 0 && (
              <p className="text-gray-400 text-center py-8">No tasks found</p>
            )}
          </div>
        )}

        {/* Manual Task Form */}
        {showManualForm && (
          <TaskForm
            onSave={createTask}
            onCancel={() => setShowManualForm(false)}
          />
        )}

        {/* Edit Task Form */}
        {editingTask && (
          <TaskForm
            initialData={editingTask}
            onSave={(data) => updateTask(editingTask.id, data)}
            onCancel={() => setEditingTask(null)}
          />
        )}

        {/* Voice Preview Modal */}
        {showVoicePreview && voiceData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Review Voice Input</h2>
              
              <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Transcript:</p>
                <p className="text-gray-800">{voiceData.transcript}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={voiceData.title}
                    onChange={(e) => setVoiceData({ ...voiceData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={voiceData.priority}
                      onChange={(e) => setVoiceData({ ...voiceData, priority: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={voiceData.status}
                      onChange={(e) => setVoiceData({ ...voiceData, status: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option>To Do</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={voiceData.dueDate || ''}
                    onChange={(e) => setVoiceData({ ...voiceData, dueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    createTask(voiceData);
                    setShowVoicePreview(false);
                    setVoiceData(null);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Task
                </button>
                <button
                  onClick={() => {
                    setShowVoicePreview(false);
                    setVoiceData(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <Mic size={20} />
            <span>Listening...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskTracker;