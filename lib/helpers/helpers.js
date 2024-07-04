const { endotrackerClientOption } = require("../initSupabase");

const supabase = endotrackerClientOption("project")

exports.helpers = {
    getPatientId: async (first_name, last_name, birthdate) => {
        const { data } = await supabase.from("patients").select().eq("personal_information->>first_name", first_name).eq("personal_information->>last_name", last_name).eq("personal_information->>birthdate", birthdate).limit(1);
        return data[0].id;
    }
}