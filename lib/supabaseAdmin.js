const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://enuewanwmwwqeshfyylp.supabase.co";
// Using the provided secret key for admin access
const supabaseServiceKey = "sb_secret_Vh6HMbDZ9GjJiqlnpsEVng_81nZVWa2";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabaseAdmin };
