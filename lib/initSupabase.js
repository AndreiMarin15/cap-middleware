const { createClient } = require("@supabase/supabase-js");
require('dotenv').config();

const supabaseUrl = process.env.MIDDLEWARE_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.MIDDLEWARE_PUBLIC_SUPABASE_ANON_KEY || "";

exports.client = (schema) => {
  const option = {
    db: { schema: schema },
  };
  return createClient(supabaseUrl, supabaseAnonKey, option);
};
