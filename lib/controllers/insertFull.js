const { client } = require("../initSupabase.js");

const supabase = client("project");

const fullInsert = async (req,res, next) => {
    if (req.body.status === true){
        console.log(req.body);
        const patient_id = req.body.patient_id
        const id = req.body.id;
        
        const referralData = (await supabase.from('referrals').eq("id", id).select("referred_to", "created_at")).data[0];
        const doctor_id = referralData.referredTo;
        const last_pull = referralData.created_at;
        const patient = (await supabase.from('patient').eq("id", patient_id).select("personal_information")).data[0].personal_information;
        const doctor = (await supabase.from('doctors').eq("id", doctor_id).select("license_id")).data[0];

        const request = {
            "subject": {
                "patient": {
                    "fname": patient.first_name,
                    "lname": patient.last_name,
                    "mname": "",
                    "DOB": patient.birthdate,
                    "sex": patient.gender
                }
            },
            "participant": {
                "type": "doctor",
                "actor": {
                    "doctor_id": doctor.license_id,
                }
            },
            "last_pull": last_pull
        };

        const response = await fetch("http://localhost:6001/endotrack/full", {
            method: "POST",
            body: JSON.stringify(request),
        })
        
        
        console.log(response)


        next();
    }
}
module.exports = fullInsert;