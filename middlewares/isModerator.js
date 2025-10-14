module.exports = (req, res, next) => {
  if (!req.session.isAuth) {
    return res.redirect("/account/login?returnUrl=" + req.originalUrl);
  }

  if (
    !req.session.roles.includes("moderator") &&
    !req.session.roles.includes("admin")
  ) {
    req.session.message = { text: "Yetkin YOK", class: "danger" };
    return res.redirect("/account/login");
  }

  next();
};
