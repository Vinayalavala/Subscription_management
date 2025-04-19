import Subscription from '../models/subscription.model.js';
import { workflowClient } from '../config/upstash.js';
import { SERVER_URL } from '../config/env.js';

export const createSubscription = async (req, res, next) => {
  try {
    console.log('Creating subscription for user:', req.user._id); // Debug log
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    let workflowRunId = null;
    if (process.env.NODE_ENV !== 'development') {
      const triggerUrl = `${SERVER_URL}/api/v1/workflows/subscription/reminder`;
      console.log('QStash Trigger URL:', triggerUrl);
      const result = await workflowClient.trigger({
        url: triggerUrl,
        body: {
          subscriptionId: subscription.id,
        },
        headers: {
          'content-type': 'application/json',
        },
        retries: 0,
      });
      workflowRunId = result.workflowRunId;
    } else {
      console.log('QStash trigger skipped in development mode');
    }

    console.log('Sending response for subscription:', subscription._id); // Debug log
    res.status(201).json({ success: true, data: { subscription, workflowRunId } });
  } catch (e) {
    console.error('Error in createSubscription:', e.message); // Debug log
    next(e);
  }
};

export const getUserSubscriptions = async (req, res, next) => {
  try {
    console.log('Fetching subscriptions for user:', req.params.id); // Debug log
    if (req.user.id !== req.params.id) {
      const error = new Error('You are not the owner of this account');
      error.status = 401;
      throw error;
    }

    const subscriptions = await Subscription.find({ user: req.params.id });

    console.log('Sending subscriptions response:', subscriptions.length); // Debug log
    res.status(200).json({ success: true, data: subscriptions });
  } catch (e) {
    console.error('Error in getUserSubscriptions:', e.message); // Debug log
    next(e);
  }
};