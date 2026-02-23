import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

interface ValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate = (schema: ValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (schema.body) {
      req.body = await schema.body.parseAsync(req.body);
    }

    if (schema.query) {
      req.query = (await schema.query.parseAsync(req.query)) as Request["query"];
    }

    if (schema.params) {
      req.params = (await schema.params.parseAsync(req.params)) as Request["params"];
    }

    next();
  };
};
