const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.MIDDLEWARE_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.MIDDLEWARE_PUBLIC_SUPABASE_ANON_KEY || "";

exports.client = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

exports.clientOption = (schema) => {
  const option = {
    db: { schema: schema },
  };

  return createClient(supabaseUrl, supabaseAnonKey, option);
};

const ETsupabaseUrl = process.env.ENDOTRACKER_PUBLIC_SUPABASE_URL || "";
const ETsupabaseAnonKey =
  process.env.ENDOTRACKER_PUBLIC_SUPABASE_ANON_KEY || "";

exports.endotrackerClient = () => {
  return createClient(ETsupabaseUrl, ETsupabaseAnonKey);
};
