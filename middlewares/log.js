module.exports = (err, req, res, next) => {
  console.log("Hata Loglandı:", err.message);

  next(err);
};
