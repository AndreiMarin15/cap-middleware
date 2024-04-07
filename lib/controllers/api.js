const { client } = require("../initSupabase.js");
const { db } = require("../public/db.js");

const patientStructure = {
  
}

const validateApiKey = async (apiKey) => {
  if (apiKey) {
    const api = await db.selectFrom("api_keys", {
      column: "key",
      value: apiKey,
    });

    if (api[0]?.id) {
      return api[0];
    } else {
      return false;
    }
  }
};

function transformObject(inputObject, keyMapping) {
  const transformedData = {};

  // Iterate through the keys in the mapping
  for (const mainKey in keyMapping) {
    if (inputObject.hasOwnProperty(keyMapping[mainKey])) {
      // Map the value from the input object to the main key
      transformedData[mainKey] = inputObject[keyMapping[mainKey]];
    }
  }

  return transformedData;
}
const middleware = client();
const api = {
  insertFhirData: async (req, res) => {
    // merong table name
    // query yung row na merong 
    const apiKey = req.body.apiKey;
    const validApiKey = await validateApiKey(apiKey);
    if (validApiKey !== false) {
      const response = await middleware
        .from(req.body.table)
        .insert(req.body.data);

      res.json(response);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  },

  getFhirData: async (req, res) => {
    const apiKey = req.body.apiKey;
    const validApiKey = await validateApiKey(apiKey);
    if (validApiKey !== false) {
      const response = req.body.column
        ? await middleware
            .from(req.body.table)
            .select("*")
            .eq(req.body.column, req.body.value)
        : await middleware.from(req.body.table).select("*");

      res.json(response);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  },

  visitMiddleware: (req, res) => {
    res.redirect("https://capstone-cap2224.vercel.app/middleware");
  },
};

module.exports = api;
