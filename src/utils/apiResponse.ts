import { Response } from "express";

interface ApiMeta {
  [key: string]: unknown;
}

interface ApiErrorItem {
  field?: string;
  message: string;
}

interface SuccessPayload<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta;
}

interface ErrorPayload {
  success: false;
  message: string;
  errors?: ApiErrorItem[];
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  meta?: ApiMeta
) => {
  const payload: SuccessPayload<T> = {
    success: true,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: ApiErrorItem[]
) => {
  const payload: ErrorPayload = {
    success: false,
    message,
  };

  if (errors?.length) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};
