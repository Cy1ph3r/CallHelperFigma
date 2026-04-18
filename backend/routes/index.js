import express from 'express';
import authRoutes from './auth.js';
import analyticsRoutes from './analytics.js';
import User from '../models/User.js';
import CallLog from '../models/CallLog.js';
import KnowledgeBase from '../models/KnowledgeBase.js';
import Settings from '../models/Settings.js';
import Case from '../models/Case.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateAIResponse } from '../services/aiService.js';
import { analyzeConfidence } from '../services/confidenceService.js';

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Users routes
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/cases/:id/active', authenticate, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      {
        isActive,
        updatedBy: req.user._id,
      },
      { new: true, runValidators: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    res.json({
      success: true,
      data: updatedCase,
      message: `Case ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/cases/:id/archive', authenticate, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const archivedCase = await Case.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: req.user._id,
        updatedBy: req.user._id,
      },
      { new: true, runValidators: true }
    );

    if (!archivedCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    res.json({
      success: true,
      data: archivedCase,
      message: 'Case archived successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users/me', authenticate, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// Call logs routes
router.post('/calls', authenticate, async (req, res) => {
  try {
    const callLog = new CallLog({
      ...req.body,
      user: req.user._id
    });
    await callLog.save();
    res.status(201).json({ success: true, data: callLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/calls', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;
    
    const calls = await CallLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CallLog.countDocuments(query);
    
    res.json({
      success: true,
      data: calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all call logs (admin only)
router.get('/calls/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const calls = await CallLog.find()
      .populate('user', 'name username')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: calls
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete call log
router.delete('/calls/:id', authenticate, async (req, res) => {
  try {
    const call = await CallLog.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call log not found' });
    }
    
    // Only allow users to delete their own calls, or admins to delete any
    if (call.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await call.deleteOne();
    
    res.json({
      success: true,
      message: 'Call log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Knowledge base routes
router.get('/knowledge', authenticate, async (req, res) => {
  try {
    const { search, category, minConfidence } = req.query;
    let query = { isPublished: true };
    
    if (category) query.category = category;
    if (minConfidence) query.confidence = { $gte: parseInt(minConfidence) };
    if (search) {
      query.$text = { $search: search };
    }
    
    const articles = await KnowledgeBase.find(query)
      .populate('createdBy', 'name username')
      .sort({ confidence: -1, createdAt: -1 });
    
    res.json({ success: true, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/knowledge', authenticate, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const article = new KnowledgeBase({
      ...req.body,
      createdBy: req.user._id
    });
    await article.save();
    res.status(201).json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update knowledge article (admin/mod)
router.put('/knowledge/:id', authenticate, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const updated = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete knowledge article (admin)
router.delete('/knowledge/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const deleted = await KnowledgeBase.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, data: null, message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Record view
router.post('/knowledge/:id/view', authenticate, async (req, res) => {
  try {
    const updated = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Record feedback
router.post('/knowledge/:id/feedback', authenticate, async (req, res) => {
  try {
    const helpful = Boolean(req.body?.helpful);
    const inc = helpful ? { helpfulCount: 1 } : { notHelpfulCount: 1 };

    const updated = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { $inc: inc },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Settings routes
router.get('/settings', authenticate, async (req, res) => {
  try {
    const settings = await Settings.find(
      req.user.role === 'admin' ? {} : { isPublic: true }
    );
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings/:key', authenticate, authorize('admin'), async (req, res) => {
  try {
    const setting = await Settings.findOneAndUpdate(
      { key: req.params.key },
      { ...req.body, updatedBy: req.user._id },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// AI response generation endpoint
// Integrated with AI service (OpenAI/Claude) as per BACKEND_INTEGRATION_GUIDE.md
router.post('/ai/generate-response', authenticate, async (req, res) => {
  try {
    const { flowResult, clientData } = req.body;
    
    // Validate input
    if (!flowResult || !clientData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: flowResult and clientData'
      });
    }
    
    // Call AI service to generate intelligent response
    // Will automatically fallback to mock if no API key is configured
    const result = await generateAIResponse(flowResult, clientData);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ AI Route Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate AI response',
      error: error.message 
    });
  }
});

// Confidence analysis endpoint
// AI-powered semantic analysis to determine problem description quality
// Replaces frontend keyword-based calculation with intelligent scoring
router.post('/analyze-confidence', authenticate, async (req, res) => {
  try {
    const { description } = req.body;
    
    // Validate input
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: description'
      });
    }
    
    if (typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Description must be a string'
      });
    }
    
    // Call confidence service for AI-powered analysis
    // Will automatically fallback to keyword analysis if AI is unavailable
    const result = await analyzeConfidence(description);
    
    // Log for monitoring (optional)
    if (process.env.LOG_CONFIDENCE_SCORES === 'true') {
      console.log('📊 Confidence Analysis:', {
        userId: req.user._id,
        username: req.user.username,
        descriptionLength: description.length,
        confidenceScore: result.data.confidenceScore,
        provider: result.metadata.provider,
        processingTime: result.metadata.processingTime
      });
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Confidence Analysis Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to analyze confidence',
      error: error.message 
    });
  }
});

// Cases routes (for fuzzy matching reference cases)
// Search endpoint - available to all authenticated users
router.get('/cases', authenticate, async (req, res) => {
  try {
    const { archived = 'false', includeInactive = 'false' } = req.query;
    const query = { isArchived: archived === 'true' };

    if (includeInactive !== 'true') {
      query.isActive = true;
    }

    const cases = await Case.find(query)
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username')
      .populate('archivedBy', 'name username')
      .sort({ updatedAt: -1 });
    
    res.json({ success: true, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/cases', authenticate, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const newCase = new Case({
      ...req.body,
      createdBy: req.user._id
    });
    
    await newCase.save();
    
    res.status(201).json({
      success: true,
      data: newCase,
      message: 'Case created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/cases/:id', authenticate, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    
    if (!updatedCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    
    res.json({
      success: true,
      data: updatedCase,
      message: 'Case updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/cases/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const deletedCase = await Case.findByIdAndDelete(req.params.id);
    
    if (!deletedCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    
    res.json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
