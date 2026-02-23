import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { csrfProtection } from "../../middlewares/csrf.middleware";
import {
  authLoginGuard,
  authLoginRateLimiter,
  authRateLimiter,
  trackLoginAttempt,
} from "../../middlewares/rateLimiter.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  emptyBodyValidation,
  loginValidation,
  refreshValidation,
  registerValidation,
} from "../../validators/auth.validator";
import * as authController from "./auth.controller";

const router = Router();

router.get("/csrf-token", authRateLimiter, authController.csrfToken);
router.post("/register", authRateLimiter, csrfProtection, validate(registerValidation), authController.register);
router.post(
  "/login",
  authLoginRateLimiter,
  authLoginGuard,
  validate(loginValidation),
  trackLoginAttempt,
  csrfProtection,
  authController.login
);
router.post("/refresh", authRateLimiter, csrfProtection, validate(refreshValidation), authController.refresh);
router.post("/logout", authRateLimiter, csrfProtection, validate(emptyBodyValidation), authController.logout);
router.get("/me", authRateLimiter, requireAuth, authController.me);

export default router;
