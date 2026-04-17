import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject, ZodTypeAny } from "zod";
import { errors } from "../errors/AppError.js";

type RequestSchemas = {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
  response?: ZodTypeAny;
};

export const validateRequest =
  (schemas: RequestSchemas) => (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) return next(errors.validation(result.error.flatten()));
      req.body = result.data;
    }
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) return next(errors.validation(result.error.flatten()));
      req.params = result.data;
    }
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) return next(errors.validation(result.error.flatten()));
      req.query = result.data;
    }
    return next();
  };

export const sendValidated = <T>(res: Response, schema: ZodTypeAny, payload: T, statusCode = 200): void => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw errors.validation(result.error.flatten());
  }
  res.status(statusCode).json(result.data);
};
