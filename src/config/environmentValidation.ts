import * as Joi from 'joi';

export default Joi.object({
  NODE_ENV: Joi.string()
    .valid('production', 'development', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(7777),
  HOST: Joi.string().default('0.0.0.0'),
  MONGODB_URI: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  REDIS_PASSWORD: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  // CLOUDINARY_NAME: Joi.string().required(),
  // CLOUDINARY_API_KEY: Joi.string().required(),
  // CLOUDINARY_API_SECRET: Joi.string().required(),
  // CLOUDINARY_URL: Joi.string().required(),
  // THIRDWEB_SECRET_KEY: Joi.string().required(),
});
