import { registerAs } from '@nestjs/config';

export default registerAs('databaseMongo', () => {
  return {
    MONGODB_URI: process.env.MONGODB_URI,
  };
});
