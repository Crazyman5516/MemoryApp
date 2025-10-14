const config = require("../config");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.db.database,
  config.db.user,
  config.db.password,
  {
    dialect: "mysql",
    host: config.db.host,
    define: { timestamps: false },
    storage: "./session.mysql",
  }
);

const connect = async () => {
  try {
    await sequelize.authenticate();
    console.log("mysql server bağlantısı yapıldı valla");
  } catch (err) {
    console.error(err);
  }
};

connect();

module.exports = sequelize;
