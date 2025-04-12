import express from 'express';
import multer from 'multer';
import { 
 analyzeSignalData,
 getActiveEmitters,
 getEmitterById,
 getElectronicOrderOfBattle
} from '../../controllers/signalIntelligenceController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
 storage: storage,
 limits: {
   fileSize: 10 * 1024 * 1024
 }
});

router.post('/analyze', 
 upload.single('signalData'),
 analyzeSignalData
);

router.get('/emitters', getActiveEmitters);

router.get('/emitters/:emitterId', getEmitterById);

router.get('/eob', getElectronicOrderOfBattle);

export default router;