const { db } = require("../public/db.js");

const validateApiKey = async (apiKey) => {
  if (apiKey) {
    const api = await db.selectFrom("api_keys", {
      column: "key",
      value: apiKey,
    });

    if (api[0].id) {
      return api[0];
    } else {
      return false;
    }
  }
};

const testController = {
  uploadCarePlan: async (req, res) => {
    const carePlan = req.body;

    // console.log(carePlan);
    carePlan.contained.forEach(async (element) => {
      const fhir = {
        status: "created",
        resource: element,
      };

      const inserted = await db.insertInto(
        element.resourceType.toLowerCase(),
        fhir,
      );
      if (inserted.status !== 201) {
        return;
      }
    });

    const encounter = {
      status: "created",
      resource: carePlan,
    };

    const enc = await db.insertInto(
      carePlan.resourceType.toLowerCase(),
      encounter,
    );

    res.send(enc);
  },

  requestApproval: async (req, res) => {
    if (req.body.api_key) {
      const api = await validateApiKey(req.body.api_key);

      if (api.id) {
        const addRequest = await db.insertInto("requests", {
          content: {
            data_requested: "Clinic Visits",
          },
          requested_by: api.owner_email,
          requested_from: req.body.requested_from,
          status: null,
          patient_id: req.body.patient_id,
          api_key: req.body.api_key,
        });

        res.send(addRequest);
      } else {
        res.send({
          error: "API Key not found",
        });
      }
    }
  },
  generateApiKey: async (req, res) => {
    if (req.body.email) {
      const generate = await db.insertInto("api_keys", {
        owner_email: req.body.email,
      });

      res.send(generate);
    }
  },

  getPatientRequests: async (req, res) => {
    if (req.body.api_key) {
      const api = await validateApiKey(req.body.api_key);

      if (req.body.requested_from && api.id) {
        const requests = await db.selectFrom("requests", {
          column: "requested_from",
          value: req.body.requested_from,
        });

        res.send(requests);
      }
    } else {
      res.send({
        error: "Invalid API Key",
      });
    }
  },

  updateRequest: async (req, res) => {
    try {
      const update = db.updateTable(
        "requests",
        { status: req.body.status },
        { id: req.body.id },
      );
      
      res.send(update.data[0]);
    } catch (err) {
      console.error(err);
      res.send(err);
    }
  },
};

module.exports = testController;
