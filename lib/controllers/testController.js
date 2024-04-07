const { db } = require("../public/db.js");
const { db: endotracker } = require("../endotracker/db.js");
const { client, endotrackerClient } = require("../initSupabase.js");
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

const generateApiKeyUponSignup = async (email) => {
  if (email) {
    const generate = await db.insertInto("api_keys", {
      owner_email: email,
    });

    return generate;
  }
};

const testController = {
  allApiKeys: async (req, res) => {
    const apiKeys = await client()
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });

    res.send(apiKeys);
  },
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

      const last_encounter = await endotrackerClient()
        .from("encounter")
        .select("*")
        .match("contains", { subject: { reference: req.body.patient_id } })
        .order("ts", { ascending: false })
        .limit(1);

      console.log("last_encounter");
      console.log(last_encounter);
      const last_visit = last_encounter.data ? last_encounter.data[0].ts : null;

      const contents = [];
      const clinic_visits =
        last_visit != null
          ? await client()
              .from("encounter")
              .select("*")
              .match("resource", {
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

      if (clinic_visits.data.length > 0) {
        clinic_visits.data.map(async (visit, index) => {
          console.log("visit");
          console.log(visit);

          console.log(visit.resource.contained);
          const observations = await client()
            .from("observation")
            .select("*")
            .in("id", visit.resource.contained);

          console.log("observations");
          console.log(observations);
          if (observations.data != null) {
            if (observations.data.length > 0) {
              observations.data.map(async (obs) => {
                console.log("obs");
                console.log(obs);

                console.log("contents1");
                console.log(contents);
                if (!contents.includes(obs.resource.id)) {
                  contents.push(obs.resource.id);
                }
              });
            }
          }

          if (index === clinic_visits.data.length - 1) {
            if (api.id) {
              const addRequest = await db.insertInto("requests", {
                content: {
                  data_requested: contents,
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
        });
      }
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

        console.log("last_encounter");
        console.log(last_encounter);
        const last_visit =
          last_encounter.data.length > 0 ? last_encounter.data[0].ts : null;

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
  generateApiKey: async (req, res) => {
    if (req.body.email) {
      const generate = await db.insertInto("api_keys", {
        owner_email: req.body.email,
      });

      res.send(generate);
    }
  },

  mapTable: async (req, res) => {
    const data = req.body.data;
    const key = req.body.api_key;

    if (validateApiKey(key) === true) {
      const response = await db.insertInto("table_map", {
        api_key: key,
        middleware_table: data.middleware_table,
        client_table: data.client_table,
      });

      res.send(response);
    }
  },
  mapColumn: async (req, res) => {
    const data = req.body.data;
    const key = req.body.api_key;

    if (validateApiKey(key)) {
      const response = await db.insertInto("columns_map", {
        api_key: key,
        middleware_table: data.middleware_table,
        client_table: data.client_table,
        middleware_column: data.middleware_column,
        client_column: data.client_column,
      });

      res.send(response);
    } else {
      res.send({
        error: "Invalid API Key",
      });
    }
  },
  newMapping: async (req, res) => {
    const data = req.body.data;
    const key = req.body.api_key;
    // data[0] send to table_map
    // the rest, send to columns_map
    if (validateApiKey(key)) {
      await data.forEach(async (element, index) => {
        if (index === 0) {
          const data = await db.insertInto("table_map", {
            api_key: key,
            middleware_table: element.middleware_table,
            client_table: element.client_table,
          });
          console.log(data);
        } else {
          const data = await db.insertInto("columns_map", {
            api_key: key,
            middleware_table: element.middleware_table,
            client_table: element.client_table,
            middleware_column: element.middleware_column,
            client_column: element.client_column,
          });

          console.log(data);
        }
      });

      res.send({
        status: "success",
      });
    } else {
      res.send({
        error: "Invalid API Key",
      });
    }
  },

  mapForClient: async (req, res) => {
    const api_key = req.body.api_key;
    const owner_email = req.body.owner_email;

    if (validateApiKey(api_key)) {
      const data = await db.insertInto("client_mapping", {
        api_key: api_key,
        owner_email: owner_email,
        fhir_table: req.body.fhir_table,
        client_table: req.body.client_table,
        column_mapping: req.body.column_mapping,
      });

      console.log(data);

      res.send({
        status: "success",
        data: data,
      });
    } else {
      res.send({
        error: "Invalid API Key",
      });
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

  newUser: async (req, res) => {
    const { data, error } = await client().auth.signUp({
      email: req.body.email,
      password: req.body.password,
    });

    if (error) {
      res.send(error);
    }
    await generateApiKeyUponSignup(req.body.email);
    res.send(data);
  },

  logIn: async (req, res) => {
    const { data, error } = await client().auth.signInWithPassword({
      email: req.body.email,
      password: req.body.password,
    });

    if (error) {
      res.send(error);
    }
    console.log(data);

    res.send(data);
  },

  getApiKeysForUser: async (req, res) => {
    const apiKeys = await client()
      .from("api_keys")
      .select("*")
      .eq("owner_email", req.body.email)
      .order("created_at", { ascending: false });

    console.log(apiKeys);
    console.log("------------------------------------");
    console.log(req.body);
    res.send({ body: req.body, data: apiKeys.data });
  },
};

module.exports = testController;
