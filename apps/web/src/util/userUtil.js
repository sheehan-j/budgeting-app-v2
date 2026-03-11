import supabase from "../config/supabaseClient";

export const isEmailWhitelisted = async (email) => {
  const { data, error } = await supabase
  .from('whitelist')
  .select('email')
  .eq('email', email);

  if (error) {
    console.error("Could not get whitelisted emails.");
    return false;
  }

  return data.length === 1;
}