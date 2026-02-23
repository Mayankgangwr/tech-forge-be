import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authLoginRateLimiter, authRateLimiter } from "../../middlewares/rateLimiter.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  emptyBodyValidation,
  loginValidation,
  registerValidation,
} from "../../validators/auth.validator";
import * as authController from "./auth.controller";

const router = Router();

router.post("/register", authRateLimiter, validate(registerValidation), authController.register);
router.post("/login", authLoginRateLimiter, validate(loginValidation), authController.login);
router.post("/refresh", authRateLimiter, validate(emptyBodyValidation), authController.refresh);
router.post("/logout", authRateLimiter, validate(emptyBodyValidation), authController.logout);
router.get("/me", authRateLimiter, requireAuth, authController.me);

export default router;
