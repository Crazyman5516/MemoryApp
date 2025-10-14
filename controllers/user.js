const Category = require("../models/category");
const Blog = require("../models/blog");
const { Op } = require("sequelize");

exports.blogs_details = async function (req, res, next) {
  // next'i parametre olarak ekliyoruz
  try {
    const slug = req.params.slug;
    const blog = await Blog.findOne({
      where: { url: slug, onay: { [Op.eq]: true } },
    });

    // BEKLENEN DURUM: Blog bulunamadı. Bu bir hata değil.
    if (blog) {
      return res.render("users/blog-details", {
        title: blog.baslik,
        blog: blog,
      });
    }
    // Blog bulunamadıysa, 404 sayfasını render et ve işlemi bitir.
    res.status(404).render("error/404", { title: "Sayfa Bulunamadı" });
  } catch (err) {
    // BEKLENMEYEN HATA: Veritabanı bağlantısı koptu, sorgu bozuk vb.
    // Bu hatayı logla ve merkezi hata yöneticisine (500 sayfasına) gönder.
    next(err);
  }
};

exports.blog_list = async function (req, res) {
  const size = 4;
  const page = parseInt(req.query.page) || 0;
  const slug = req.params.slug;

  try {
    const { rows, count } = await Blog.findAndCountAll({
      where: { onay: { [Op.eq]: true } },
      raw: true,
      include: slug ? { model: Category, where: { url: slug } } : [],
      limit: size,
      offset: page * size, // her sayfada 4 tane göster
    });
    const categories = await Category.findAll();

    res.render("users/blogs", {
      title: "Tüm Kurslar",
      blogs: rows,
      totalItems: count,
      totalPages: Math.ceil(count / size),
      currentPage: page,
      categories: categories,
      selectedCategory: slug,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.index = async function (req, res) {
  try {
    const blogs = await Blog.findAll({
      where: {
        anasayfa: true,
        onay: true,
      },
      raw: true,
    });
    const categories = await Category.findAll();

    res.render("users/index", {
      title: "Popüler Kurslar",
      blogs: blogs,
      categories: categories,
      selectedCategory: null,
    });
  } catch (err) {
    console.log(err);
  }
};
