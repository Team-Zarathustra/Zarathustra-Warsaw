import sigintService from './sigintService.js';

export default sigintService;

export { RadarSignal, EmitterLocation, EmitterTrack, EOBElement } from './models/radarSignal.js';
export { geolocateEmitter } from './strategies/emitterGeolocation.js';
export { trackEmitters } from './strategies/emitterTracking.js';
export { classifyEmitter } from './parsers/signalClassifier.js';
export { buildElectronicOrderOfBattle } from './parsers/eobBuilder.js';

export const processSignals = (...args) => sigintService.processSignals(...args);
export const getAllEmitterTracks = (...args) => sigintService.getAllEmitterTracks(...args);
export const getEmitterById = (...args) => sigintService.getEmitterById(...args);
export const getElectronicOrderOfBattle = () => sigintService.getElectronicOrderOfBattle();
export const clearAllTracks = () => sigintService.clearAllTracks();
export const importEmitterData = (...args) => sigintService.importEmitterData(...args);