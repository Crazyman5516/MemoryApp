const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const imageUpload = require("../helpers/image-upload");
const isAdmin = require("../middlewares/isAdmin");
const csrf = require("../middlewares/csrf");
const isModerator = require("../middlewares/isModerator");

//blog

//delete get işlemi
router.get(
  "/blog/delete/:blogid",
  isAdmin,
  isModerator,
  csrf,
  adminController.get_blog_delete
);

//delete post işlemi
router.post(
  "/blog/delete/:blogid",
  isAdmin,
  isModerator,
  adminController.post_blog_delete
);

//category delete get işlemi
router.get(
  "/category/delete/:categoryid",
  isAdmin,
  csrf,
  adminController.get_category_delete
);

//category delete post işlemi
router.post(
  "/category/delete/:categoryid",
  isAdmin,
  adminController.post_category_delete
);

//blog create get işlemi
router.get("/blog/create", isModerator, csrf, adminController.get_blog_create);

//blog create post işlemi
router.post(
  "/blog/create",
  imageUpload.upload.single("resim"),
  isModerator,
  csrf,
  adminController.post_blog_create
);

//category create get işlemi
router.get(
  "/category/create",
  isAdmin,
  csrf,
  adminController.get_category_create
);

//category create post işlemi
router.post("/category/create", isAdmin, adminController.post_category_create);

//blog edit get işlemi
router.get("/blogs/:blogid", isModerator, csrf, adminController.get_blog_edit);

//blog edit post işlemi
router.post(
  "/blogs/:blogid",
  imageUpload.upload.single("resim"),
  isModerator,
  csrf,
  adminController.post_blog_edit
);

//category remove post işlemi
router.post(
  "/categories/remove",
  isAdmin,
  csrf,
  adminController.post_category_remove
);

//category edit get işlemi
router.get(
  "/categories/:categoryid",
  isAdmin,
  csrf,
  adminController.get_category_edit
);

//category edit post işlemi
router.post(
  "/categories/:categoryid",
  isAdmin,
  csrf,
  adminController.post_category_edit
);

//blog listeleme
router.get("/blogs", isModerator, adminController.get_blogs);

//kategori listeleme
router.get("/categories", isAdmin, adminController.get_categories);

router.post("/roles/remove", isAdmin, adminController.roles_remove);
router.get("/roles", isAdmin, adminController.get_roles);
router.get("/roles/:roleid", isAdmin, csrf, adminController.get_role_edit);
router.post("/roles/:roleid", isAdmin, csrf, adminController.post_role_edit);

router.get("/users", isAdmin, adminController.get_user);
router.get("/users/:userid", isAdmin, csrf, adminController.get_user_edit);
router.post("/users/:userid", isAdmin, adminController.post_user_edit);

module.exports = router;
