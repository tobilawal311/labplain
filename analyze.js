import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔹 REPLACE THESE TWO VALUES
const SUPABASE_URL = "https://ckcooenhxypdctzdjoqj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_REPLACE_THIS_WITH_YOURS";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// 🔹 LOGIN FUNCTION
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  if (data?.session) {
    window.location.href = "/"; // redirect after login
  }
}

// 🔹 OPTIONAL: auto-redirect if already logged in
supabase.auth.onAuthStateChange((_event, session) => {
  if (session && window.location.pathname.includes("login")) {
    window.location.href = "/";
  }
});
