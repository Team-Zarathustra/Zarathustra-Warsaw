import express from 'express';
import { 
 generateFusedIntelligence,
 getEntityDetails,
 getCorrelationDetails
} from '../../controllers/fusionController.js';

const router = express.Router();

router.post('/analyze', generateFusedIntelligence);

router.get('/entities/:entityId', getEntityDetails);

router.get('/correlations/:correlationId', getCorrelationDetails);

export default router;