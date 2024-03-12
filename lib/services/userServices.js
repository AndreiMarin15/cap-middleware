// Example: userController.js
const { db } = require("../public/db");

exports.viewAccount = async () => {
  const table = "test";
  db.selectAllFrom("test").then((val) => {
    console.log(val);
  });
  return null;
};
