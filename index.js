//express modöülleri
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const session = require("express-session");
const sequelizeStore = require("connect-session-sequelize")(session.Store);
const csurf = require("csurf");
const Role = require("./models/role");

//node modülleri
const path = require("path");

//routes
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");

//custom modules
const sequelize = require("./data/db");
const dummyData = require("./data/dummy-data");
const locals = require("./middlewares/locals");
const log = require("./middlewares/log");

//template engine
app.set("view engine", "ejs");

//models
const Category = require("./models/category");
const Blog = require("./models/blog");
const User = require("./models/user");
const errorHandling = require("./middlewares/error-handling");
const { title } = require("process");

//middleware
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 30 * 60 },
    store: new sequelizeStore({ db: sequelize }),
  })
);

app.use(locals);
app.use(csurf()); // CSRF middleware burada

app.use("/libs", express.static(path.join(__dirname, "node_modules")));
app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/admin", adminRoutes);
app.use("/account", authRoutes);
app.use(userRoutes);
app.use("*", (req, res) => {
  res.status(404).render("error/404", { title: "404" });
});
app.use(log);
app.use(errorHandling);

// ilişkiler
Blog.belongsTo(User, { foreigngKey: { allowNull: true } });
User.hasMany(Blog);

// many to many relationship
Blog.belongsToMany(Category, { through: "blogCategories" });
Category.belongsToMany(Blog, { through: "blogCategories" });

Role.belongsToMany(User, { through: "userRoles" });
User.belongsToMany(Role, { through: "userRoles" });

const start = async () => {
  try {
    await sequelize.sync({ force: true });
    await dummyData();
    console.log("DB hazır ve dummy data yüklendi.");
  } catch (err) {
    console.error(err);
  }
};

start();

app.listen(3000, function () {
  console.log("listening on port 3000");
});
