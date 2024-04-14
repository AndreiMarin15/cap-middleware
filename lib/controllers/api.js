const { client } = require("../initSupabase.js");
const { db } = require("../public/db.js");

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
  } else {
    return false;
  }
};

const filterNullValues = (data) => {
  const filteredData = {};
  Object.keys(data).forEach((key) => {
    if (
      data[key] !== null &&
      data[key] !== "" &&
      data[key] !== undefined &&
      data[key] !== "null" &&
      data[key] !== 0 &&
      data[key] !== "0"
    ) {
      filteredData[key] = data[key];
    }
  });
  return filteredData;
};

const getFhirObservations = (data) => {
  const observations = [];
  Object.keys(data).forEach((key) => {
    console.log("KEY", key);
    console.log("VALUE", data[key]);
    console.log("REF", data["pid"]);
    console.log("EID", data["eid"]);
    const converted = convertObservation(key, data[key], data["pid"]);

    if (converted != null) {
      observations.push(converted);
    }

    console.log(converted);
  });
  return observations;
};
const convertObservation = (key, value, reference) => {
  const objectKey =
    key === "bps"
      ? "systolic"
      : key === "bpd"
        ? "diastolic"
        : key === "pulse"
          ? "heartRate"
          : key === "weight"
            ? "weight"
            : key === "height"
              ? "height"
              : key === "BMI"
                ? "bmi"
                : null;

  if (objectKey != null) {
    const observation = {
      id: objectKey,
      code: {
        coding: [
          {
            code: "objectKey",
            system: "http://loinc.org",
          },
        ],
      },
      subject: {
        type: "Patient",
        reference: reference,
      },
      resource_type: "Observation",
      valueQuantity: {
        unit: "",
        value: value,
      },
    };

    return observation;
  }

  return null;
};

function convertCarePlan(input, reference) {
  const carePlanConversion = {
    "health concern": "dietary management",
    goal: "physical activities",
    instruction: "Self monitoring",
  };

  const activities = input.new.care_plan_type
    .map((type, index) => {
      if (!["health concern", "goal", "instruction"].includes(type)) {
        return null;
      }

      return {
        detail: {
          code: {
            text: carePlanConversion[type],
            coding: [
              {
                code: "18771-9",
                system: "http://loinc.org",
                display: carePlanConversion[type],
              },
            ],
          },
          description: input.new.description[index],
        },
      };
    })
    .filter((activity) => activity !== null);

  return {
    title: "External Care Plan",
    period: {
      end: input.new.reasonDateHigh[0],
      start: input.new.reasonDateLow[0],
    },
    created: input.new.code_date[0],
    subject: {
      display: "",
      reference: reference,
    },
    activity: activities,
    contributor: [
      {
        display: input.actor,
        reference: input.actor,
      },
    ],
    description: "External Care Plan",
    encounter_ref: input.eid,
    api_key: input.apiKey,
    resource_type: "CarePlan",
  };
}

function transformPatient(input) {
  return {
    status: "created",
    resource: {
      name: input.name || "",
      photo: input.photo || "",
      active: input.active || true,
      gender: input.gender || "",
      address: {
        street_address: input.street_address || "",
      },
      telecom: {
        email: input.email || "",
      },
      deceased: input.deceased || false,
      birthdate: input.birthdate || "",
      identifier: input.identifier || "",
      philhealth_id: input.philhealth_id || "",
    },
  };
}

function transformAccount(input) {
  return {
    status: "created",
    resource: {
      name: input.name || "",
      status: input.status || "",
      identifier: input.identifier || "",
      description: input.description || "",
    },
  };
}

function transformPerson(input) {
  return {
    status: "created",
    resource: {
      name: input.name || "",
      gender: input.gender || "",
      status: input.status || "",
      telecom: {
        email: input.email || "",
      },
      gender: input.gender || "",
      deceased: input.deceased || false,
      birthdate: input.birthdate || "",
      identifier: input.identifier || "",
      description: input.description || "",
      address: {
        street_address: input.street_address || "",
      },
    },
  };
}

function transformPractitioner(input) {
  return {
    status: "created",
    resource: {
      name: input.practitioner || "",
      active: input.active || true,
      gender: input.gender || "",
      telecom: input.telecom || "",
      birthdate: input.birthdate || "",
      identifier: input.identifier || "",
      qualification: {
        identifier: input.qualification || "",
      },
    },
  };
}

function transformObservation(input) {
  return {
    status: "created",
    resource: {
      id: input.id || "height",
      code: {
        coding: [
          {
            code: input.code || "8302-2",
            system: input.system || "http://loinc.org",
          },
        ],
      },
      subject: {
        type: "Patient",
        reference: input.subject || "546bc2ce-444b-479a-a23e-2b57e9a31dc9",
      },
      participant: {
        type: "Doctor",
        actor: input.actor || "Harold Chiu",
      },
      resource_type: input.resource_type || "Observation",
      valueQuantity: {
        unit: input.unit || "cm",
        value: input.value || "165",
      },
    },
  };
}

function groupByValue(ros) {
  const result = { yes: [], no: [] };

  for (const key in ros) {
    if (ros[key].toUpperCase() === "YES") {
      result.yes.push(key);
    } else if (ros[key].toUpperCase() === "NO") {
      result.no.push(key);
    }
  }

  return result;
}

function transformROS(ros, patientId, actor) {
  return {
    id: "reviewOfSystems",
    code: {
      coding: [
        {
          code: "8687-6",
          system: "http://loinc.org",
        },
      ],
    },
    subject: {
      type: "Patient",
      reference: patientId,
    },
    participant: {
      type: "Doctor",
      actor: actor,
    },
    valueString: JSON.stringify(ros),
    resource_type: "Observation",
  };
}
function transformEncounter(input) {
  return {
    id: input.id || "",
    period: {
      start: input.start || "",
    },
    subject: {
      type: "Patient",
      reference: input.subject || "",
    },
    contained: input.contained || [],
    participant: {
      type: "doctor",
      actor: input.actor || "",
    },
    resource_type: input.resource_type || "",
  };
}

function transformFamilyMemberHistory(input) {
  return {
    age: input.age || "",
    sex: input.sex || "",
    name: input.name || "",
    patient: input.patient || "",
    condition: {
      code: input.code || "",
      onset: input.onset || "",
      outcome: input.outcome || "",
    },
    procedure: input.procedure || [],
    identifier: input.identifier || "",
    relationship: input.relationship || "",
  };
}

function transformMedicationRequest(input) {
  return {
    id: input.id || "",
    form: {
      text: input.form || "",
    },
    note: input.note || "",
    status: input.status || "",
    subject: {
      type: "Patient",
      reference: input.subject || "",
    },
    requester: {
      agent: {
        reference: input.requester || "",
      },
    },
    adverseEvent: {
      adverseReaction: input.adverseEvent || "",
    },
    dispenseRequest: {
      validityPeriod: {
        end: input.end || "",
        start: input.start || "",
      },
      dispenseInterval: input.dispenseRequest || "",
    },
    dosageInstruction: input.dosageInstruction || [
      {
        doseAndRate: [
          {
            doseQuantity: {
              doseUnit: input.doseUnit || "",
            },
          },
        ],
      },
    ],
    medicationCodeableConcept: input.medicationCodeableConcept || [
      {
        text: input.text || "",
        coding: [
          {
            system: input.system || "",
            display: input.display || "",
          },
        ],
      },
    ],
  };
}

const getEmailWithAPIKey = async (api_key) => {
  const email = await client()
    .from("api_keys")
    .select("owner_email")
    .eq("key", api_key);

  return email.data[0].email;
};

const transformObject = async (inputObject, table, api_key) => {
  const transformedData = {};

  const email = await getEmailWithAPIKey(api_key);

  const mapped = await client()
    .from("client_mapping")
    .select("*")
    .eq("owner_email", email)
    .eq("client_table", table);

  const keyMapping = mapped.data[0]?.column_mapping;

  // Iterate through the keys in the mapping
  for (const mainKey in keyMapping &&
    keyMapping !== undefined &&
    keyMapping !== null) {
    if (inputObject.hasOwnProperty(keyMapping[mainKey])) {
      // Map the value from the input object to the main key
      transformedData[mainKey] = inputObject[keyMapping[mainKey]];
    }
  }

  switch (mapped.data[0]?.fhir_table) {
    case "patient":
      return transformPatient(transformedData);
    case "account":
      return transformAccount(transformedData);
    case "person":
      return transformPerson(transformedData);
    case "practitioner":
      return transformPractitioner(transformedData);
    case "observation":
      return transformObservation(transformedData);
    case "encounter":
      return transformEncounter(transformedData);
    case "familymemberhistory":
      return transformFamilyMemberHistory(transformedData);
    case "medicationrequest":
      return transformMedicationRequest(transformedData);
    default:
      return null;
  }
};
const middleware = client();
const api = {
  insertFhirData: async (req, res) => {
    // merong table name
    // query yung row na merong

    const data = await transformObject(
      req.body.data,
      req.body.table,
      req.body.apiKey,
    );

    const apiKey = req.body.apiKey;
    const validApiKey = await validateApiKey(apiKey);
    if (validApiKey !== false) {
      const response = await middleware.from(req.body.table).insert(data);

      res.json(response);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  },

  insertEncounterData: async (req, res) => {
    // const data = await transformObject(req.body.data, req.body.table);
    const apiKey = req.body.apiKey;
    const validApiKey = await validateApiKey(apiKey);
    if (validApiKey !== false) {
      await client().from("encounter").insert({ resource: req.body.data });
      res.json({ data: req.body.data });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  },

  addCarePlan: async (req, res) => {
    const apiKey = req.body.apiKey;
    const validApiKey = await validateApiKey(apiKey);

    if (validApiKey !== false) {
      // const response = await middleware
      //   .from("careplan")
      //   .insert({ resource: req.body.data });

      // res.json(response);
      const encounter = await client()
        .from("encounter")
        .select("*")
        .eq("resource->id", req.body.eid);
      const reference = encounter.data[0].resource.subject.reference;

      const insert = await client()
        .from("careplan")
        .insert({
          status: "created",
          resource: convertCarePlan(req.body, reference),
        })
        .select("*");

      console.log(insert);
      res.send(insert);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  },

  addVitals: async (req, res) => {
    console.log(JSON.stringify(req.body.data));

    const apiKey = req.body.apiKey;
    const validApiKey = await validateApiKey(apiKey);
    console.log("API KEY", apiKey, validApiKey);
    if (validApiKey !== false) {
      console.log(req.body);
      // res.json({ data: req.body.data });

      const encounter = await client()
        .from("encounter")
        .select("*")
        .eq("resource->id", req.body.data?.eid);
      const encResource = encounter.data[0].resource;

      const newObject = filterNullValues(req.body.data);
      const obs = getFhirObservations(newObject);

      const newIds = [];

      await Promise.all(
        obs.map(async (observation) => {
          const id = await client()
            .from("observation")
            .insert({
              resource: observation,
            })
            .select("*");
          newIds.push(id.data[0].id);
        }),
      );

      const update = await client()
        .from("encounter")
        .update({
          resource: {
            ...encResource,
            contained: newIds,
          },
        })
        .eq("resource->id", req.body.data?.eid);

      res.send(update);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  },

  addROS: async (req, res) => {
    console.log(JSON.stringify(req.body.data));

    const apiKey = req.body.apiKey;
    const validApiKey = await validateApiKey(apiKey);

    if (validApiKey !== false) {
      console.log(req.body);
      // console.log(groupByValue(req.body.data.ros));
      const encounter = await client()
        .from("encounter")
        .select("*")
        .eq("resource->id", req.body.data?.eid);
      const encResource = encounter.data[0].resource;
      const ros = groupByValue(req.body.data.ros);

      const transformROSData = transformROS(
        ros,
        req.body.data.ros.pid,
        req.body.actor,
      );

      console.log(transformROSData);

      res.json(transformROSData);
      const insertRos = await client()
        .from("observation")
        .insert({
          status: "created",
          resource: transformROSData,
        })
        .select("*");
      const ROSDataID = insertRos.data[0].id;
      const update = await client()
        .from("encounter")
        .update({
          resource: {
            ...encResource,
            contained: [...encResource.contained, ROSDataID],
          },
        })
        .eq("resource->id", req.body.data?.eid);
      console.log(update);
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

  consoleData: async (req, res) => {
    const apiKey = req.body.apiKey;
    const validApiKey = await validateApiKey(apiKey);

    console.log(req.body);
    res.send(req.body);
    // res.send(req.body)
  },

  visitMiddleware: (req, res) => {
    res.redirect("https://capstone-cap2224.vercel.app/middleware");
  },
};

module.exports = api;
