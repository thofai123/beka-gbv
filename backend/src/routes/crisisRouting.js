import express from 'express';
import { findOptimalResponder } from '../services/dynamicRouter.js';

const router = express.Router();

router.post('/route-crisis', async (req, res) => {
  try {
    const { latitude, longitude, triggerType, confidence, requiredService } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and Longitude are required for emergency routing.' });
    }

    const prisma = req.app.get('prisma') || (await import('../config/db.js')).prisma;
    
    const routingResult = await findOptimalResponder(prisma, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      requiredService,
      triggerType
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      triggerType: triggerType || 'MANUAL_SOS',
      routing: routingResult
    });
  } catch (error) {
    console.error('Error during crisis routing dispatch:', error);
    return res.status(500).json({ error: 'Failed to complete crisis routing dispatch.' });
  }
});

export default router;
