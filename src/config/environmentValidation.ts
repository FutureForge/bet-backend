import * as Joi from 'joi';

export default Joi.object({
  NODE_ENV: Joi.string()
    .valid('production', 'development', 'test', 'staging')
    .default('development'),
  PORT: Joi.string().optional(),
  HOST: Joi.string().default('0.0.0.0'),
  MONGODB_URI: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  REDIS_PASSWORD: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  SPORT_API_URL: Joi.string().required(),
  SPORT_API_KEY: Joi.string().required(),
  // Blockchain configuration
  CROSSFI_RPC_URL: Joi.string().optional(),
  CROSSFI_CONTRACT_ADDRESS: Joi.string().optional(),
  BNB_RPC_URL: Joi.string().optional(),
  BNB_CONTRACT_ADDRESS: Joi.string().optional(),
  DEFAULT_BLOCKCHAIN: Joi.string().valid('crossfi', 'bnb').default('crossfi'),
  ADMIN_PRIVATE_KEY: Joi.string().required(),
  THIRDWEB_CLIENT_ID: Joi.string().required(),
  THIRDWEB_SERECT: Joi.string().required(),
  IS_TESTNET: Joi.string().required(),
  // CLOUDINARY_NAME: Joi.string().required(),
  // CLOUDINARY_API_KEY: Joi.string().required(),
  // CLOUDINARY_API_SECRET: Joi.string().required(),
  // CLOUDINARY_URL: Joi.string().required(),
  // THIRDWEB_SECRET_KEY: Joi.string().required(),
});
