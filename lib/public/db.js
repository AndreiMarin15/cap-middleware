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

    console.log("data", data);
    console.log("table", table);
    console.log("colData", colData);
    if (error) {
      console.log("Error inserting data:", error);
      return error;
    }

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
