import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

const REQUEST_ID_HEADER = "x-request-id";

const sanitizeRequestId = (value: string): string => value.trim().slice(0, 100);

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incomingHeader = req.header(REQUEST_ID_HEADER);
  const requestId = incomingHeader ? sanitizeRequestId(incomingHeader) : randomUUID();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
};

