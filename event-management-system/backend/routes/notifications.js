const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendPushNotification } = require('../config/firebase');
const User = require('../models/User');
const Event = require('../models/Event');

// @route   POST /api/notifications/send
// @desc    Send push notification to users
// @access  Private (admin, organizer)
router.post('/send', protect, async (req, res, next) => {
  try {
    const { userIds, title, body, data, eventId } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }
    
    // Get FCM tokens for target users
    let users;
    if (userIds && userIds.length > 0) {
      users = await User.find({ _id: { $in: userIds } });
    } else if (eventId) {
      // Send to all event attendees
      const event = await Event.findById(eventId);
      const attendeeIds = event.rsvp.attendees.map(a => a.userId);
      users = await User.find({ _id: { $in: attendeeIds } });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either userIds or eventId is required'
      });
    }
    
    const tokens = [];
    users.forEach(user => {
      user.fcmTokens.forEach(tokenObj => {
        if (tokenObj.token) {
          tokens.push(tokenObj.token);
        }
      });
    });
    
    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No FCM tokens found for target users'
      });
    }
    
    // Send notification
    const result = await sendPushNotification(
      tokens,
      { title, body },
      data || {}
    );
    
    // Broadcast via WebSocket as well
    const io = req.app.get('io');
    if (userIds) {
      io.emit('notification:receive', {
        title,
        body,
        data,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        targetUsers: users.length,
        tokensUsed: tokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/notifications/event-reminder
// @desc    Send reminder for upcoming event
// @access  Private
router.post('/event-reminder/:eventId', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user is organizer
    if (event.organizer.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const attendeeIds = event.rsvp.attendees.map(a => a.userId);
    const users = await User.find({ _id: { $in: attendeeIds } });
    
    const tokens = [];
    users.forEach(user => {
      user.fcmTokens.forEach(tokenObj => {
        if (tokenObj.token) tokens.push(tokenObj.token);
      });
    });
    
    if (tokens.length > 0) {
      const notification = {
        title: `Reminder: ${event.title}`,
        body: `Event starts on ${new Date(event.startDate).toLocaleString()}`,
        imageUrl: event.imageUrl
      };
      
      const data = {
        eventId: event._id.toString(),
        type: 'event-reminder'
      };
      
      await sendPushNotification(tokens, notification, data);
      
      // Log reminder sent
      event.notifications.remindersSent.push({
        sentAt: new Date(),
        type: 'manual'
      });
      await event.save();
    }
    
    res.json({
      success: true,
      message: `Reminder sent to ${users.length} attendees`
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/notifications/broadcast
// @desc    Broadcast notification to all users
// @access  Private (admin only)
router.post('/broadcast', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can broadcast notifications'
      });
    }
    
    const { title, body, data } = req.body;
    
    // Get all active users with FCM tokens
    const users = await User.find({ isActive: true });
    
    const tokens = [];
    users.forEach(user => {
      user.fcmTokens.forEach(tokenObj => {
        if (tokenObj.token) tokens.push(tokenObj.token);
      });
    });
    
    if (tokens.length > 0) {
      const result = await sendPushNotification(
        tokens,
        { title, body },
        data || {}
      );
      
      // Broadcast via WebSocket
      const io = req.app.get('io');
      io.emit('notification:receive', {
        title,
        body,
        data,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        message: 'Broadcast sent successfully',
        data: {
          targetUsers: users.length,
          tokensUsed: tokens.length,
          successCount: result.successCount
        }
      });
    } else {
      res.json({
        success: false,
        message: 'No active users with FCM tokens found'
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
