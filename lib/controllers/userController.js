const userServices = require("../services/userServices.js");

const { db } = require("../public/db.js");


const userController = {
  viewAccount: async (req, res) => {
    try {
      const response = await userServices.viewAccount();
      res.json({
        HI: null,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  postMapping: async (req, res) => {
    const insert = await db.insertInto(
      req.body.table,
      req.body.data,
      //   {
      //   api_key: req.body.api_key,
      //   middleware_table: req.body.middleware_table,
      //   client_table: req.body.client_table
      // }
    );

    res.send(insert);
  },



  getMapping: async (req, res) => {
    const mapping = await db.selectAllFrom(req.body.table);

    res.send(mapping);
  },
};
module.exports = userController;
