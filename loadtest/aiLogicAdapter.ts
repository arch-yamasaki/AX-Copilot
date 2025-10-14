import { createChat, generateCarteData, setAIApp } from '../services/aiLogic.ts';
import { app as nodeApp } from './firebaseNodeClient';

// Inject Node.js Firebase app before exporting API
setAIApp(nodeApp);

export { createChat, generateCarteData };
