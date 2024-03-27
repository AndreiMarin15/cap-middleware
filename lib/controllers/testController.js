const { db } = require("../public/db.js");
const { db: endotracker } = require("../endotracker/db.js");
const { client, endotrackerClient } = require("../initSupabase.js");
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
  uploadEncounter: async (req, res) => {
    const encounter = req.body;
    const contained = [];

    // Use Promise.all with Array.map to wait for all promises to resolve
    await Promise.all(
      encounter.contained.map(async (element) => {
        const fhir = {
          status: "created",
          resource: element,
        };
        console.log(element);
        const inserted = await db.insertInto(
          element.resource_type.toLowerCase(),
          fhir,
        );
        contained.push(inserted[0].id);
        console.log("HI");
        console.log(contained);
        if (inserted.status !== 201) {
          return;
        }
      }),
    );

    const data = {
      status: "created",
      resource: {
        id: encounter.id,
        period: encounter.period,
        subject: encounter.subject,
        contained: contained,
        resource_type: encounter.resource_type,
      },
      resource_type: encounter.resource_type,
    };

    const enc = await db.insertInto(data.resource_type.toLowerCase(), data);

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
        console.log("addRequest");
        console.log(addRequest);
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
        { status: req.body.status, patient_id: req.body.patient_id },
        { id: req.body.id },
      );
      // req.body.patient_id

      if (req.body.status === true) {
        const last_encounter = await endotrackerClient()
          .from("encounter")
          .select("*")
          .order("ts", { ascending: false })
          .limit(1);

        const last_visit = last_encounter.data[0].ts ?? null;

        const clinic_visits = last_visit
          ? await client()
              .from("encounter")
              .select("*")
              .contains("resource", {
                subject: {
                  reference: req.body.patient_id,
                },
              })
              .gte("ts", last_visit)
          : await client()
              .from("encounter")
              .select("*")
              .contains("resource", {
                subject: {
                  reference: req.body.patient_id,
                },
              });
        console.log("clinic_visits");
        console.log(clinic_visits);
        //await client.query(query, values);

        if (clinic_visits.data.length > 0) {
          clinic_visits.data.map(async (visit) => {
            const insert = await endotracker.insertInto("encounter", visit);
            console.log("visit");
            console.log(visit);

            console.log("insert");
            console.log(insert);
            const observations = await client()
              .from("observation")
              .select("*")
              .contains("resource", { patient_id: insert.contains });

            // await client.query(obsQuery, obsValues);
            console.log("observations");
            console.log(observations);
            if (observations.data.length > 0) {
              observations.data.map(async (obs) => {
                const insertObs = await endotracker.insertInto(
                  "observation",
                  obs,
                );
                console.log(insertObs);
              });
            }
          });
        }
        // get clinic visits
        // get the observations that clinic visits have
        // insert the clinic visits and the observations to the endotrackerdb
      }
      console.log(update);
      res.send(update.data);
    } catch (err) {
      console.error(err);
      res.send(err);
    }
  },
};

module.exports = testController;
