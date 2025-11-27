const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const moment = require('moment');

// @route   GET /api/events
// @desc    Get all events with filters
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      category,
      status,
      startDate,
      endDate,
      search,
      upcoming,
      page = 1,
      limit = 20
    } = req.query;
    
    // Build query
    const query = { visibility: 'public' };
    
    if (category) query.category = category;
    if (status) query.status = status;
    
    // Date filters
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    
    // Upcoming events
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
      query.status = { $in: ['published', 'ongoing'] };
    }
    
    // Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const events = await Event.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('organizer.userId', 'name email');
    
    const total = await Event.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer.userId', 'name email profile')
      .populate('rsvp.attendees.userId', 'name email profile');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Track view
    if (req.user) {
      event.analytics.views += 1;
      if (!event.analytics.uniqueVisitors.includes(req.user._id)) {
        event.analytics.uniqueVisitors.push(req.user._id);
      }
      await event.save();
    }
    
    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (organizer, admin)
router.post('/', protect, authorize('organizer', 'admin', 'teacher'), async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      organizer: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.profile?.phone
      }
    };
    
    const event = await Event.create(eventData);
    
    // Broadcast new event via WebSocket
    const io = req.app.get('io');
    io.emit('event:new', {
      event: {
        id: event._id,
        title: event.title,
        category: event.category,
        startDate: event.startDate
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (organizer/owner, admin)
router.put('/:id', protect, async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check ownership or admin role
    if (event.organizer.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }
    
    event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Broadcast update via WebSocket
    const io = req.app.get('io');
    io.to(`event-${event._id}`).emit('event:updated', { event });
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (organizer/owner, admin)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check ownership or admin role
    if (event.organizer.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }
    
    await event.deleteOne();
    
    // Broadcast deletion
    const io = req.app.get('io');
    io.emit('event:deleted', { eventId: req.params.id });
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events/:id/rsvp
// @desc    RSVP to event
// @access  Private
router.post('/:id/rsvp', protect, async (req, res, next) => {
  try {
    const { status = 'going' } = req.body;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if RSVP is required and deadline
    if (event.rsvp.deadline && new Date() > new Date(event.rsvp.deadline)) {
      return res.status(400).json({
        success: false,
        message: 'RSVP deadline has passed'
      });
    }
    
    await event.addAttendee(req.user._id, req.user.name, req.user.email, status);
    
    // Broadcast RSVP update
    const io = req.app.get('io');
    io.to(`event-${event._id}`).emit('event:rsvp-update', {
      eventId: event._id,
      userId: req.user._id,
      userName: req.user.name,
      status,
      totalAttendees: event.attendeeCount
    });
    
    res.json({
      success: true,
      message: 'RSVP submitted successfully',
      data: {
        status,
        attendeeCount: event.attendeeCount,
        availableSpots: event.availableSpots
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/events/:id/rsvp
// @desc    Cancel RSVP
// @access  Private
router.delete('/:id/rsvp', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    await event.removeAttendee(req.user._id);
    
    // Broadcast update
    const io = req.app.get('io');
    io.to(`event-${event._id}`).emit('event:rsvp-cancelled', {
      eventId: event._id,
      userId: req.user._id,
      totalAttendees: event.attendeeCount
    });
    
    res.json({
      success: true,
      message: 'RSVP cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events/:id/live-update
// @desc    Post live update for event
// @access  Private (organizer, admin)
router.post('/:id/live-update', protect, authorize('organizer', 'admin', 'teacher'), async (req, res, next) => {
  try {
    const { status, message, type = 'info' } = req.body;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check ownership
    if (event.organizer.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }
    
    await event.updateLiveStatus(status, message, req.user.name, type);
    
    // Broadcast live update
    const io = req.app.get('io');
    const rtdb = req.app.get('rtdb');
    
    const update = {
      status,
      message,
      author: req.user.name,
      type,
      timestamp: new Date()
    };
    
    io.to(`event-${event._id}`).emit('event:live-update', {
      eventId: event._id,
      update
    });
    
    // Store in Firebase
    if (rtdb) {
      await rtdb.ref(`events/${event._id}/liveUpdates`).push(update);
    }
    
    res.json({
      success: true,
      message: 'Live update posted successfully',
      data: { update }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events/:id/score
// @desc    Update score for sports event
// @access  Private (organizer, admin)
router.post('/:id/score', protect, authorize('organizer', 'admin', 'teacher'), async (req, res, next) => {
  try {
    const { team1Score, team2Score } = req.body;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    if (event.category !== 'sports') {
      return res.status(400).json({
        success: false,
        message: 'Score updates only available for sports events'
      });
    }
    
    await event.updateScore(team1Score, team2Score);
    
    // Broadcast score update
    const io = req.app.get('io');
    const rtdb = req.app.get('rtdb');
    
    const scoreUpdate = {
      team1: { name: event.liveTracking.score.team1.name, score: team1Score },
      team2: { name: event.liveTracking.score.team2.name, score: team2Score },
      timestamp: new Date()
    };
    
    io.to(`event-${event._id}`).emit('event:score-change', {
      eventId: event._id,
      score: scoreUpdate
    });
    
    // Store in Firebase
    if (rtdb) {
      await rtdb.ref(`events/${event._id}/score`).set(scoreUpdate);
    }
    
    res.json({
      success: true,
      message: 'Score updated successfully',
      data: { score: scoreUpdate }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events/:id/check-in
// @desc    Check in to event
// @access  Private
router.post('/:id/check-in', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const attendee = event.rsvp.attendees.find(
      a => a.userId.toString() === req.user._id.toString()
    );
    
    if (!attendee) {
      return res.status(400).json({
        success: false,
        message: 'You must RSVP before checking in'
      });
    }
    
    if (attendee.checkInAt) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in'
      });
    }
    
    attendee.checkInAt = new Date();
    await event.save();
    
    // Broadcast check-in
    const io = req.app.get('io');
    io.to(`event-${event._id}`).emit('event:check-in', {
      eventId: event._id,
      userId: req.user._id,
      userName: req.user.name,
      checkInCount: event.analytics.checkIns
    });
    
    res.json({
      success: true,
      message: 'Checked in successfully',
      data: {
        checkInAt: attendee.checkInAt,
        checkInCount: event.analytics.checkIns
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/events/my/organized
// @desc    Get events organized by current user
// @access  Private
router.get('/my/organized', protect, async (req, res, next) => {
  try {
    const events = await Event.find({ 'organizer.userId': req.user._id })
      .sort({ startDate: -1 });
    
    res.json({
      success: true,
      data: { events, count: events.length }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/events/my/attending
// @desc    Get events user is attending
// @access  Private
router.get('/my/attending', protect, async (req, res, next) => {
  try {
    const events = await Event.find({
      'rsvp.attendees.userId': req.user._id
    }).sort({ startDate: 1 });
    
    res.json({
      success: true,
      data: { events, count: events.length }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
