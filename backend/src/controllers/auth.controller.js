import {
  registerUser,
  loginUser,
  getUserById,
} from '../services/auth.service.js';

export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);

    return res.status(201).json({
      status: 'created',
      user,
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await getUserById(req.user.id);

    return res.status(200).json({
      status: 'success',
      user,
    });
  } catch (error) {
    return next(error);
  }
}