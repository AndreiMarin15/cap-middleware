const { endotrackerClientOption } = require("../initSupabase.js");

const supabase = endotrackerClientOption("project");

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

    const doctor_id = referralData.referred_from;
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
    res.json(result);
    return;

    //TODO Insert into endotrack database;

    next();
  }
};
module.exports = fullInsert;
