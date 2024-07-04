const { endotrackerClientOption } = require("../initSupabase.js");
const {helpers} = require("../helpers/helpers.js");
const supabase = endotrackerClientOption("project");
const pub = endotrackerClientOption("public");

const fullInsert = async (req, res, next) => {
  if (req.body.status === true) {
    const patient_id = req.body.patient_id;
    const id = req.body.id;

    const referralData = (
      await supabase
        .from("referrals")
        .select("referred_to, created_at")
        .eq("id", id)
    ).data[0];

    const doctor_id = referralData.referred_to;
    const last_pull = referralData.created_at;

    const patient = (
      await supabase
        .from("patients")
        .select("personal_information")
        .eq("id", patient_id)
    ).data[0].personal_information;

    const doctor = (
      await supabase.from("doctors").select("license_id").eq("id", doctor_id)
    ).data[0];

    const request = {
      subject: {
        patient: {
          fname: patient.first_name,
          lname: patient.last_name,
          mname: "",
          DOB: patient.birthdate,
          sex: patient.gender,
        },
      },
      participant: {
        type: "doctor",
        actor: {
          doctor_id: doctor.license_id,
        },
      },
      last_pull: last_pull,
    };

    var response = await fetch("http://localhost:6001/endotrack/full", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    //TODO Insert into endotrack database;
    if(Array.isArray(result?.medication)){
        const medications = result.medication;
        medications.forEach(async(medication) => {
            
          const doctor = medication.doctor
          const patient = medication.patient
           
          const array = medication?.medications
          const patient_id = await helpers.getPatientId(patient.first_name, patient.last_name, patient.birthdate);
            array.forEach(async(med) => {
              const insertedMedication = await pub.from("medicationrequest").insert({
                status: "created",
                resource: {
                  ...med,
                  requester: {
                    agent: {
                      reference: `${doctor.first_name} ${doctor.last_name}`,
                      license_id: doctor.license
                    }
                  },
                  subject: {
                    type: "Patient",
                    reference: patient_id ?? null,
                  }
                },
              });
  
              console.log(insertedMedication);
            })
        })

        if(Array.isArray(result?.careplan)){
          const careplans = result.careplan;
          careplans.forEach(async(careplan) => {
              
            const doctor = careplan.doctor
            const patient = careplan.patient
             
            const array = careplan?.careplans
            const patient_id = await helpers.getPatientId(patient.first_name, patient.last_name, patient.birthdate);
              array.forEach(async(plan) => {
                const insertedCarePlan = await pub.from("careplan").insert({
                  status: "created",
                  resource: {
                    ...plan,
                    requester: {
                      agent: {
                        reference: `${doctor.first_name} ${doctor.last_name}`,
                        license_id: doctor.license
                      }
                    },
                    subject: {
                      type: "Patient",
                      reference: patient_id ?? null,
                    }
                  },
                });
        
                console.log(insertedCarePlan);
              })
          })
        }
    }
    next();
  }
};
module.exports = fullInsert;
