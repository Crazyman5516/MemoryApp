const sequelize = require("../data/db");
const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

const User = sequelize.define(
  "user",
  {
    fullname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Ad soyad zorunludur",
        },
        isFullname(value) {
          // Değerin başındaki/sonundaki boşlukları temizle,
          // birden fazla boşluğu tek boşluğa indir ve kelimeleri say.
          const words = value.trim().split(/\s+/);
          if (words.length < 2) {
            throw new Error("Lütfen adınızı ve soyadınızı giriniz.");
          }
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: "Email daha önce kullanılmış",
      },
      validate: {
        notEmpty: {
          msg: "Email zorunludur",
        },
        isEmail: {
          msg: "Geçersiz email formatı",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Şifre zorunludur",
        },
        len: {
          args: [6, 20],
          msg: "Şifre 6 ile 20 karakter arasında olmalıdır",
        },
      },
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetTokenExpiration: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

User.afterValidate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});
module.exports = User;
