const User = require("../models/user");
const bcrypt = require("bcrypt");
const emailService = require("../helpers/send-mail");
const config = require("../config");
const crypto = require("crypto");
const { Op } = require("sequelize");

exports.get_register = async (req, res, next) => {
  try {
    res.render("auth/register", {
      title: "Register",
    });
  } catch (err) {
    next(err);
  }
};

exports.post_register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // 1. Validasyonu hash'lemeden ÖNCE yap.
    if (!password) {
      // Sequelize'ın fırlatacağı hataya benzer bir yapı oluşturalım.
      const err = {
        errors: [{ message: "Şifre zorunludur" }],
      };
      throw err;
    }

    // 2. Validasyon başarılıysa hash'le.

    await User.create({
      fullname: name,
      email: email,
      password: password,
    });

    await emailService.sendMail({
      from: config.email.from,
      to: email,
      subject: "Blog App Kaydınız Oluşturuldu",
      html: `<h1>Blog App'e Hoşgeldiniz</h1><p>Kaydınız başarıyla oluşturuldu.</p>`,
    });

    req.session.message = {
      text: "Kayıt başarılı, giriş yapabilirsiniz",
      class: "success",
    };

    return res.redirect("login");
  } catch (err) {
    let msg = "";
    if (
      err.name === "SequelizeValidationError" ||
      err.name === "SequelizeUniqueConstraintError"
    ) {
      console.log(err.name); // SequelizeValidationError, SequelizeUniqueConstraintError

      if (err.errors) {
        for (let e of err.errors) {
          msg += e.message + "<br>";
        }
      } else {
        // Diğer beklenmedik hataları da yakalamak iyi bir pratiktir.
        console.log(err);
        msg = "Bilinmeyen bir hata oluştu, lütfen tekrar deneyin.";
      }
      return res.render("auth/register", {
        title: "Register",
        message: { text: msg, class: "danger" },
      });
    } else {
      next(err);
    }
  }
};

exports.get_login = async (req, res, next) => {
  const message = req.session.message;
  delete req.session.message;
  try {
    return res.render("auth/login", {
      title: "login",
      message: message,
    });
  } catch {
    next(err);
  }
};

exports.post_login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Gerekli alanların doldurulduğunu kontrol et
    if (!email || !password) {
      return res.status(400).render("auth/login", {
        title: "Giriş",
        message: { text: "Email ve şifre zorunludur", class: "danger" },
        csrfToken: req.csrfToken(),
      });
    }

    // Kullanıcıyı veritabanında bul
    const user = await User.findOne({ where: { email } });

    // Zamanlama saldırılarını önlemek için:
    // 1. Kullanıcı bulunamazsa bile, sahte bir hash ile karşılaştırma yaparak işlem süresini benzer tut.
    // 2. Kullanıcı varsa, gerçek şifre hash'i ile karşılaştır.
    const match = user ? await bcrypt.compare(password, user.password) : false;

    if (match) {
      // Başarılı giriş
      const userRoles = await user.getRoles({
        attributes: ["rolename"],
        raw: true,
      });

      req.session.roles = userRoles.map((role) => role["rolename"]);
      req.session.isAuth = true;
      req.session.fullname = user.fullname;
      req.session.userid = user.id;
      const returnUrl = req.query.returnUrl || "/";
      return res.redirect(returnUrl);
    }

    // Başarısız giriş (kullanıcı yok VEYA şifre yanlış)
    // Her iki durumda da aynı genel hata mesajını göster.
    return res.status(401).render("auth/login", {
      title: "login",
      message: { text: "Geçersiz email veya şifre", class: "danger" },
      csrfToken: req.csrfToken(),
    });
  } catch (err) {
    next(err);
  }
};

exports.get_reset = async (req, res, next) => {
  const message = req.session.message;
  delete req.session.message;
  res.render("auth/reset-password", {
    title: "Reset Password",
    message: message,
  });
};

exports.post_reset = async (req, res) => {
  const { email } = req.body;
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      req.session.message = { text: "Email bulunamadı", class: "warning" };
      return res.redirect("reset-password");
    }

    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();

    await emailService.sendMail({
      from: config.email.from,
      to: email,
      subject: "Şifre Sıfırlama",
      html: `<h1>Şifrenizi sıfırlamak için linke tıklayın</h1><p>
      <a href="http://localhost:3000/account/new-password/${token}">Şifre Sıfırlama Linki</a>
      </p>`,
    });
    req.session.message = {
      text: "Şifre sıfırlama linki mailinize gönderildi",
      class: "success",
    };
    return res.redirect("login");
  } catch (err) {
    next(err);
  }
};

exports.get_newPassword = async (req, res, next) => {
  const token = req.params.token;

  try {
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiration: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      req.session.message = {
        text: "Geçersiz veya süresi dolmuş token.",
        class: "danger",
      };
      return res.redirect("reset-password");
    }

    res.render("auth/new-password", {
      title: "New Password",
      token: token,
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
};

exports.post_newPassword = async (req, res, next) => {
  const { newPassword, userId, token } = req.body;
  try {
    const user = await User.findOne({
      where: {
        id: userId,
        resetToken: token,
        resetTokenExpiration: { [Op.gt]: Date.now() },
      },
    });
    if (!user) {
      req.session.message = {
        text: "Geçersiz veya süresi dolmuş token",
        class: "danger",
      };
      return res.redirect("reset-password");
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();

    req.session.message = {
      text: "Parola başarıyla güncellendi, giriş yapabilirsiniz",
      class: "success",
    };

    return res.redirect("login");
  } catch (err) {
    next(err);
  }
};

exports.get_logout = async (req, res, next) => {
  try {
    await req.session.destroy((err) => {
      if (err) {
        console.error(err);
      }
      res.clearCookie("connect.sid");
      return res.redirect("login");
    });
  } catch (err) {
    next(err);
  }
};
