// Example: userController.js
const { PROJECT } = require("../db");

exports.viewAccount = async () => {
  const table = "test";
  PROJECT.selectAllFrom('test').then((val)=>{
    console.log(val);

  })
  return null;
};
