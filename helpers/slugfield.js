const slugify = require("slugify");

const options = {
  replacement: "-", // replace spaces with replacement
  remove: undefined, // regex to remove characters
  lower: true, // convert to lower case
  strict: true, // strip special characters except replacement
  locale: "tr", // language code of the locale to use
  trim: true, // trim leading and trailing replacement chars
};

module.exports.slugField = (str) => {
  return slugify(str, options);
};
