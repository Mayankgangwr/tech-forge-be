import { NextFunction, Request, RequestHandler, Response } from "express";

export const asyncHandler = <T extends RequestHandler>(fn: T): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
