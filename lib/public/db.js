const { client } = require("../initSupabase");

const supabase = client();
exports.db = {
  selectAllFrom: async (table) => {
    const { data, error } = await supabase.from(table).select();

    return error ? error : data;
  },

  selectFrom: async (table, options) => {
    const { data } = await supabase
      .from(table)
      .select("*")
      .eq(options.column, options.value);
    return data;
  },

  insertInto: async (table, colData) => {
    const { data, error } = await supabase.from(table).insert(colData).select();

    if (error) {
      console.error("Error inserting data:", error);
      return error;
    }

    // Assuming your table has an 'id' column
    console.log(data);

    return data;
  },

  updateTable: async (table, colData, where) => {
    const { data, error } = await supabase
      .from(table)
      .update(colData)
      .match(where);

    return error ? error : data;
  },

  deleteTable: async (table, where) => {
    const { data, error } = await supabase.from(table).delete().match(where);

    return error ? error : data;
  },
};
