/**
 * Validation Middleware
 * Request validation using Joi
 */

const Joi = require('joi');
const { ValidationError } = require('./errorHandler');

/**
 * Order validation schema
 */
const orderSchema = Joi.object({
  customerId: Joi.string().required(),
  customerEmail: Joi.string().email().required(),
  customerName: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().min(0).required()
    })
  ).min(1).required(),
  totalAmount: Joi.number().min(0).required(),
  currency: Joi.string().length(3).default('usd'),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required()
  }).required(),
  billingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required()
  }).optional()
});

/**
 * Validate order data
 */
function validateOrder(req, res, next) {
  const { error, value } = orderSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return next(new ValidationError(errors.join(', ')));
  }

  req.body = value;
  next();
}

/**
 * Generic validation middleware factory
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return next(new ValidationError(errors.join(', ')));
    }

    req.body = value;
    next();
  };
}

module.exports = {
  validateOrder,
  validate,
  orderSchema
};
