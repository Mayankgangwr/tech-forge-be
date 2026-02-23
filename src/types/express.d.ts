import { UserRole } from "../modules/user/user.types";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

export {};
