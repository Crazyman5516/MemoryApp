const Blog = require("../models/blog");
const Category = require("../models/category");
const fs = require("fs");
const sanitizeHtml = require("sanitize-html");
const { Op } = require("sequelize");
const sequelize = require("../data/db");
const { slugField } = require("../helpers/slugfield");
const Role = require("../models/role");
const User = require("../models/user");

exports.get_blog_delete = async (req, res) => {
  const blogid = req.params.blogid;
  const userid = req.session.userid;

  try {
    const blog = await Blog.findOne({ id: blogid, userId: userid });
    if (blog) {
      return res.render("admin/blog-delete", {
        title: "delete blog",
        blog: blog,
      });
    }
    res.redirect("/admin/blogs");
  } catch (err) {
    console.error(err);
  }
};

exports.post_blog_delete = async (req, res) => {
  const blogid = req.body.blogid;
  try {
    const blog = await Blog.findByPk(blogid);
    if (blog) {
      await blog.destroy();
      return res.redirect("/admin/blogs?action=delete");
    }
    res.redirect("/admin/blogs");
  } catch (err) {
    console.error(err);
  }
};

exports.get_category_delete = async (req, res) => {
  const categoryid = req.params.categoryid;
  try {
    const category = await Category.findByPk(categoryid);
    res.render("admin/category-delete", {
      title: "delete category",
      category: category,
    });
  } catch (err) {
    console.error(err);
  }
};

exports.post_category_delete = async (req, res) => {
  const categoryid = req.body.categoryid;

  try {
    await Category.destroy({
      where: {
        id: categoryid,
      },
    });
    res.redirect("/admin/categories?action=delete");
  } catch (err) {
    console.error(err);
  }
};

exports.get_blog_create = async (req, res) => {
  try {
    const categories = await Category.findAll();
    console.log("get_blog_create çalıştı"); // <-- Bunu ekleyin

    res.render("admin/blog-create", {
      title: "Add blogs",
      categories: categories,
    });
  } catch (err) {
    console.error(err);
  }
};

exports.post_blog_create = async (req, res) => {
  const baslik = req.body.baslik;
  const resim = req.file ? req.file.filename : null;
  const anasayfa = req.body.anasayfa == "on" ? 1 : 0;
  const onay = req.body.onay == "on" ? 1 : 0;
  const altbaslik = req.body.altbaslik;
  const cleanHtml = sanitizeHtml(req.body.aciklama);
  const userid = req.session.userid;
  try {
    if (!baslik || !altbaslik || !cleanHtml || !userid) {
      throw new Error("Lütfen tüm alanları doldurun.");
    }
    if (baslik.length < 5 || baslik.length > 20) {
      throw new Error("Başlık 5 ile 20 karakter arasında olmalıdır.");
    }
    if (altbaslik.length < 10 || altbaslik.length > 50) {
      throw new Error("Alt başlık 10 ile 50 karakter arasında olmalıdır.");
    }

    await Blog.create({
      baslik: baslik,
      url: slugField(baslik),
      altbaslik: altbaslik,
      aciklama: cleanHtml,
      resim: resim,
      anasayfa: anasayfa,
      onay: onay,
      userId: userid,
    });

    res.redirect("/admin/blogs?action=create");
  } catch (err) {
    let errorMessage = "Beklenmedik bir hata oluştu.";
    if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      console.error(err); // Beklenmedik hataları logla
    }

    // Hata durumunda bile kategorileri tekrar çekmeliyiz ki sayfa doğru render edilsin.
    const categories = await Category.findAll();

    res.render("admin/blog-create", {
      title: "Add blogs",
      categories: categories,
      message: { text: errorMessage, class: "danger" },
      values: {
        baslik: baslik,
        altbaslik: altbaslik,
        aciklama: cleanHtml,
      },
    });
  }
};
exports.get_category_create = async (req, res) => {
  try {
    res.render("admin/category-create", {
      title: "add category",
    });
  } catch (err) {
    res.redirect("/500");
  }
};

exports.post_category_create = async (req, res) => {
  const name = req.body.name;
  try {
    await Category.create({ name: name, url: slugField(name) });
    res.redirect("/admin/categories?action=create");
  } catch (err) {
    console.error(err);
  }
};

exports.get_blog_edit = async (req, res) => {
  const blogid = req.params.blogid;
  const userid = req.session.userid;
  try {
    const blog = await Blog.findOne({
      where: { id: blogid }, // Sadece blogid ile bul, yetki kontrolünü aşağıda yap

      include: [
        {
          model: Category,
        },
      ],
    });
    const categories = await Category.findAll();
    if (!blog) {
      return res.redirect("/admin/blogs"); // Blog bulunamazsa yönlendir
    }

    // Yetki kontrolü: Admin değilse ve blogun sahibi değilse erişimi engelle
    if (!req.session.roles.includes("admin") && blog.userId !== userid) {
      return res.redirect("/admin/blogs");
    }
    res.render("admin/blog-edit", {
      title: blog.baslik,
      blog,
      categories,
    });
  } catch (err) {
    console.error(err);
  }
};

exports.post_blog_edit = async (req, res) => {
  const blogid = req.body.blogid;
  const baslik = req.body.baslik;
  const altbaslik = req.body.altbaslik;
  const aciklama = req.body.aciklama;
  let kategoriIds = req.body.categories;
  const url = req.body.url;
  const userid = req.session.userid;

  if (!kategoriIds || kategoriIds.length === 0) {
    kategoriIds = [];
  } else if (!Array.isArray(kategoriIds)) {
    kategoriIds = [kategoriIds];
  }
  let resim = req.body.resim;
  if (req.file) {
    resim = req.file.filename;

    fs.unlink("./public/images/" + req.body.resim, (err) => {
      console.error(err);
    });
  }
  const anasayfa = req.body.anasayfa == "on" ? 1 : 0;
  const onay = req.body.onay == "on" ? 1 : 0;
  try {
    const blog = await Blog.findOne({
      where: { id: blogid, userId: userid },
      include: [
        {
          model: Category,
        },
      ],
    });
    if (blog) {
      blog.baslik = baslik;
      blog.altbaslik = altbaslik;
      blog.aciklama = aciklama;
      blog.resim = resim;
      blog.anasayfa = anasayfa;
      blog.onay = onay;
      blog.url = url;

      if (kategoriIds === undefined) {
        await blog.removeCategories(blog.categories);
      } else {
        await blog.removeCategories(blog.categories);
        const selectedCategories = await Category.findAll({
          where: { id: { [Op.in]: kategoriIds } },
        });
        await blog.addCategories(selectedCategories);
      }
      await blog.save();
      return res.redirect("/admin/blogs?action=edit&blogid=" + blogid);
    }
    res.redirect("/admin/blogs");
  } catch (err) {
    console.error(err);
  }
};

exports.post_category_remove = async (req, res) => {
  const blogid = req.body.blogid;
  const categoryid = req.body.categoryid;

  try {
    // SQL Injection'a karşı güvenli yöntem
    await sequelize.models.blogCategories.destroy({
      where: {
        blogId: blogid,
        categoryId: categoryid,
      },
    });
    res.redirect("/admin/categories/" + categoryid);
  } catch (err) {
    console.error("Kategoriden blog çıkarma hatası:", err);
  }
};

exports.get_category_edit = async (req, res) => {
  const categoryid = req.params.categoryid;

  try {
    const category = await Category.findByPk(categoryid);
    const blogs = await category.getBlogs();

    if (category) {
      return res.render("admin/category-edit", {
        title: category.name,
        category: category,
        blogs: blogs,
      });
    }
    res.redirect("admin/categories");
  } catch (err) {
    console.error(err);
  }
};

exports.post_category_edit = async (req, res) => {
  const categoryid = req.body.categoryid;
  const name = req.body.name;

  try {
    if (categoryid) {
      await Category.update(
        { name: name },
        {
          where: {
            id: categoryid,
          },
        }
      );
      return res.redirect(
        "/admin/categories?action=edit&categoryid=" + categoryid
      );
    }
  } catch (err) {
    console.error(err);
  }
};

exports.get_blogs = async (req, res) => {
  const userId = req.session.userid;
  const isModerator = req.session.roles.includes("moderator");
  const isAdmin = req.session.roles.includes("admin");

  let whereClause = {};

  if (!isAdmin && isModerator) {
    // Eğer kullanıcı admin değil ama moderatör ise, sadece kendi bloglarını görsün.
    whereClause.userId = userId;
  }
  // Eğer kullanıcı admin ise, whereClause boş kalır ve tüm bloglar listelenir.

  try {
    const blogs = await Blog.findAll({
      attributes: ["id", "baslik", "altbaslik", "resim"],
      include: { model: Category, attributes: ["name"] },
      where: whereClause,
    });
    res.render("admin/blog-list", {
      title: "blog list",
      blogs: blogs,
      action: req.query.action,
      blogid: req.query.blogid,
    });
  } catch (err) {
    console.error(err);
  }
};

exports.get_categories = async (req, res) => {
  try {
    const categories = await Category.findAll();

    res.render("admin/category-list", {
      title: "Tüm Kategoriler",
      categories: categories,
      action: req.query.action,
      categoryid: req.query.categoryid,
    });
  } catch (err) {
    console.error(err);
  }
};

exports.get_roles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: {
        include: [
          "role.id",
          "role.rolename",
          [sequelize.fn("COUNT", sequelize.col("users.id")), "userCount"],
        ],
      },
      include: [
        {
          model: User,
          attributes: ["id"],
        },
      ],
      group: ["role.id"],
      raw: true,
      includeIgnoreAttributes: false,
    });

    res.render("admin/role-list", {
      title: "role list",
      roles: roles,
    });
  } catch (err) {
    console.error(err);
  }
};

exports.get_role_edit = async (req, res) => {
  const roleid = req.params.roleid;

  try {
    const role = await Role.findByPk(roleid, {
      include: [{ model: User, attributes: ["id", "fullname", "email"] }],
    });
    if (role) {
      return res.render("admin/role-edit", {
        title: role.roleName,
        role: role,
        users: role.users,
      });
    }
    res.redirect("/admin/roles");
  } catch (err) {
    console.error(err);
  }
};

exports.post_role_edit = async (req, res) => {
  const roleid = req.body.roleid;
  const rolename = req.body.rolename;

  try {
    if (roleid) {
      await Role.update(
        { roleName: rolename },
        {
          where: {
            id: roleid,
          },
        }
      );
      return res.redirect("/admin/roles");
    }
  } catch (err) {
    console.error(err);
  }
};

exports.roles_remove = async (req, res) => {
  const userId = req.body.userid;
  const roleId = req.body.roleid;

  try {
    const user = await User.findByPk(userId);
    const role = await Role.findByPk(roleId);
    if (user && role) {
      await user.removeRole(role);
      return res.redirect("/admin/roles/" + roleId);
    }
  } catch (err) {
    console.error(err);
  }
};

exports.get_user = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "fullname", "email"],
      include: { model: Role, attributes: ["roleName"] },
    });
    res.render("admin/user-list", {
      title: "user list",
      users: users,
    });
  } catch (err) {
    console.error(err);
  }
};

exports.get_user_edit = async (req, res) => {
  const userid = req.params.userid;

  try {
    const user = await User.findOne({
      where: { id: userid },
      include: { model: Role, attributes: ["id"] },
    });
    const roles = await Role.findAll();

    res.render("admin/user-edit", {
      title: "user edit",
      user: user,
      roles: roles,
    });
  } catch (err) {
    console.error(err);
  }
};

exports.post_user_edit = async (req, res) => {
  const { userid, fullname, email } = req.body;
  // Checkbox'lardan gelen roller undefined olabilir, bu yüzden varsayılan olarak boş bir dizi atayalım.
  const roleIds = req.body.roles || [];

  // Session modelini al
  const Session = sequelize.models.Session;

  try {
    // 1. `await` ile veritabanı sorgusunun bitmesini bekle.
    // 2. `where` koşulunu doğru sütun adı olan `id` ile yap.
    const user = await User.findOne({
      where: { id: userid },
      include: { model: Role }, // İlişkili rolleri de getir
    });

    if (user) {
      // Kullanıcı bilgilerini güncelle
      user.fullname = fullname;
      user.email = email;

      // 3. `setRoles` ile rolleri tek adımda güncelle.
      // `roleIds` boş bir dizi ise, kullanıcının tüm rolleri kaldırılır.
      await user.setRoles(roleIds);
      await user.save();

      // Eğer güncellenen kullanıcı, işlemi yapan admin değilse,
      // o kullanıcının aktif oturumlarını sonlandır.
      if (req.session.userid != userid) {
        await Session.destroy({
          where: {
            data: {
              [Op.like]: `%"userid":${userid}%`,
            },
          },
        });
      }
      return res.redirect("/admin/users");
    }
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
  }
};
