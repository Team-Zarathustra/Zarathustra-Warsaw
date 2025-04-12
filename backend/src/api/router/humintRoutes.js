import express from 'express';
import { 
 analyzeFieldReport, 
 analyzeMultipleReports, 
 exportMilitaryFormat 
} from '../../controllers/humintController.js';

const router = express.Router();

router.get('/limits', async (req, res) => {
 res.json({
   limit: 10,
   used: 0,
   remaining: 10,
   resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
   isAuthenticated: true,
   planType: 'standard',
   upgradeAvailable: false
 });
});

router.post('/analyze', analyzeFieldReport);
router.post('/analyze-multiple', analyzeMultipleReports);

router.get('/export/:analysisId/:format', exportMilitaryFormat);
router.post('/export/:analysisId/:format', exportMilitaryFormat);

export default router;