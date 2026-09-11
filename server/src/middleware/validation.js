import { validationResult } from "express-validator";

export function handleValidation(request, response, next) {
  const errors = validationResult(request);

  if (!errors.isEmpty()) {
    return response
      .status(400)
      .json({
        message: "Please check the submitted fields",
        errors: errors.array(),
      });
  }

  return next();
}

export function asyncHandler(handler) {
  return (request, response, next) =>
    Promise.resolve(handler(request, response, next)).catch(next);
}
