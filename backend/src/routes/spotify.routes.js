
import { Router } from 'express';

import {
  spotifyLogin,
  spotifyCallback,
} from '../controllers/spotify.controller.js';

const router = Router();

router.get('/login', spotifyLogin);
router.get('/callback', spotifyCallback);

export default router;
