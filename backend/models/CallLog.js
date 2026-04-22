import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  entityType: {
    type: String,
    required: true,
    trim: true
  },
  problemType: {
    type: String,
    required: true
  },
  problemSummary: {
    type: String,
    required: true
  },
  matchedCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  matchedCaseCode: {
    type: String,
    trim: true,
    default: null
  },
  flowResult: {
    completedSteps: [{
      stepId: String,
      stepName: String,
      selectedSubCondition: {
        id: String,
        name: String,
        action: {
          type: String,
          enum: ['continue', 'force_solution', 'escalation']
        },
        actionDetails: String
      }
    }],
    finalAction: {
      type: String,
      enum: ['continue', 'force_solution', 'escalation']
    },
    escalationDetails: String,
    solutionDetails: String
  },
  generatedResponse: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'escalated', 'closed'],
    default: 'pending'
  },
  duration: {
    type: Number, // in seconds
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
callLogSchema.index({ user: 1, createdAt: -1 });
callLogSchema.index({ status: 1 });
callLogSchema.index({ entityType: 1 });
callLogSchema.index({ matchedCase: 1 });

const CallLog = mongoose.model('CallLog', callLogSchema);

export default CallLog;
