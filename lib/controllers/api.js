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
  }
};

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
