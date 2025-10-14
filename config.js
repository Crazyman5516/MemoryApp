// .env dosyasındaki değişkenleri process.env'e yükler
require("dotenv").config();

const config = {
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || "blogapp",
  },
  email: {
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME,
  },
};

module.exports = config;
