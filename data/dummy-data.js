const Category = require("../models/category");
const Blog = require("../models/blog");
const { slugField } = require("../helpers/slugfield");
const User = require("../models/user");
const Role = require("../models/role");
const bcrypt = require("bcrypt");

const populate = async () => {
  const userCount = await User.count();
  if (userCount > 0) {
    return;
  }

  //Kategoriler
  const categories = await Category.bulkCreate([
    { name: "Web Geliştirme", url: slugField("Web Geliştirme") },
    { name: "Mobil Geliştirme", url: slugField("Mobil Geliştirme") },
    { name: "Programlama", url: slugField("Programlama") },
  ]);
  console.log("Kategoriler eklendi.");

  //Roller
  const roles = await Role.bulkCreate([
    { roleName: "admin" },
    { roleName: "moderator" },
    { roleName: "guest" },
  ]);
  console.log("Roller eklendi.");

  //Kullanıcılar
  const password = await bcrypt.hash("123456", 10);
  const users = await User.bulkCreate([
    {
      fullname: "Tuna Admin",
      email: "tunaadmin@gmail.com",
      password: password,
    },
    {
      fullname: "Ahmet Moderator",
      email: "ahmetmoderator@gmail.com",
      password: password,
    },
    {
      fullname: "Ayşe Guest",
      email: "ayseguest@gmail.com",
      password: password,
    },
  ]);
  console.log("Kullanıcılar eklendi.");

  //Rolleri Ata
  await users[0].addRole(roles[0]); // admin
  await users[1].addRole(roles[1]); // moderator
  await users[2].addRole(roles[2]); // guest
  console.log("Roller kullanıcılara atanmış.");

  //Blogları oluştur
  const blogs = await Blog.bulkCreate([
    {
      baslik: "Sıfırdan İleri Seviye Modern Javascript Dersleri ES7+",
      url: slugField("Sıfırdan İleri Seviye Modern Javascript Dersleri ES7+"),
      altbaslik: "Adam gibi js dersleri",
      aciklama:
        "ES7+ React/Redux/React-Native snippets uzantısı, React, Redux ve React Native ile çalışan geliştiriciler için güçlü bir araçtır. Kod tabanınıza .",
      resim: "1.jpeg",
      anasayfa: true,
      onay: true,
      userId: users[0].id,
    },
    {
      baslik: "Sıfırdan İleri Seviye Modern Python Dersleri",
      url: slugField("Sıfırdan İleri Seviye Modern Python Dersleri"),
      altbaslik: "Adam gibi piton dersleri",
      aciklama:
        "ES7+ React/Redux/React-Native snippets uzantısı, React, Redux ve React Native ile çalışan geliştiriciler için güçlü bir araçtır. Kod tabanınıza .",
      resim: "2.jpeg",
      anasayfa: true,
      onay: true,
      userId: users[1].id,
    },
    {
      baslik: "React ile Modern Web Geliştirme",
      url: slugField("React ile Modern Web Geliştirme"),
      altbaslik: "Component bazlı frontend geliştirme",
      aciklama:
        "React kütüphanesini kullanarak modern web uygulamaları geliştirmeyi öğrenin. Component yapısı, state yönetimi ve hooks kullanımı.",
      resim: "3.jpeg",
      anasayfa: true,
      onay: true,
      userId: users[0].id,
    },
    {
      baslik: "Node.js ve Express ile Backend Programlama",
      url: slugField("Node.js ve Express ile Backend Programlama"),
      altbaslik: "Server-side JavaScript geliştirme",
      aciklama:
        "Node.js runtime environment ve Express framework ile RESTful API'lar ve backend servisleri geliştirmenin temelleri.",
      resim: "4.jpeg",
      anasayfa: false,
      onay: true,
      userId: users[1].id,
    },
    {
      baslik: "Veritabanı Tasarımı ve SQL",
      url: slugField("Veritabanı Tasarımı ve SQL"),
      altbaslik: "İlişkisel veritabanları ve sorgulama",
      aciklama:
        "Veritabanı normalizasyonu, ilişkisel modelleme ve SQL sorguları ile veri yönetimi. MySQL ve PostgreSQL örnekleri.",
      resim: "5.jpeg",
      anasayfa: true,
      onay: true,
      userId: users[0].id,
    },
    {
      baslik: "Mobil Uygulama Geliştirme with React Native",
      url: slugField("Mobil Uygulama Geliştirme with React Native"),
      altbaslik: "Cross-platform mobil geliştirme",
      aciklama:
        "React Native ile iOS ve Android için native mobil uygulamalar geliştirin. Tek kod tabanı ile iki platformda çalışan uygulamalar.",
      resim: "6.jpeg",
      anasayfa: true,
      onay: true,
      userId: users[1].id,
    },
    {
      baslik: "Git ve GitHub Kullanımı",
      url: slugField("Git ve GitHub Kullanımı"),
      altbaslik: "Versiyon kontrol sistemi ve collaboration",
      aciklama:
        "Git versiyon kontrol sistemi ve GitHub platformu ile proje yönetimi, branch stratejileri ve takım çalışması.",
      resim: "7.jpeg",
      anasayfa: false,
      onay: true,
      userId: users[0].id,
    },
  ]);

  //Blog kategori ilişkileri
  await categories[0].addBlog(blogs[0]);
  await categories[1].addBlog(blogs[0]);
  await categories[2].addBlog(blogs[0]);
  await categories[0].addBlog(blogs[1]);
  await categories[1].addBlog(blogs[1]);
  await categories[2].addBlog(blogs[1]);
  await categories[0].addBlog(blogs[2]);
  await categories[1].addBlog(blogs[2]);
  await categories[2].addBlog(blogs[2]);
  await categories[0].addBlog(blogs[3]);
  await categories[1].addBlog(blogs[3]);
  await categories[2].addBlog(blogs[3]);
  await categories[0].addBlog(blogs[4]);
  await categories[1].addBlog(blogs[4]);
  await categories[2].addBlog(blogs[4]);

  //İlişki üzerinden blog oluşturma
  await categories[2].createBlog({
    baslik: "JavaScript ES2024 Yenilikleri",
    url: slugField("JavaScript ES2024 Yenilikleri"),
    altbaslik: "JavaScript'in en yeni özelliklerini keşfedin",
    aciklama:
      "JavaScript ES2024, geliştiricilere daha verimli ve etkili kod yazma imkanı sunan bir dizi yeni özellik ve iyileştirme getiriyor. Bu makalede, ES2024'ün en önemli yeniliklerini keşfedeceğiz.",
    resim: "3.jpeg",
    anasayfa: true,
    onay: true,
    userId: users[0].id,
  });
};
module.exports = populate;
