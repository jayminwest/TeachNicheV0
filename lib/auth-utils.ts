import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isBuildTime } from "./env-utils";

export async function requireAdmin() {
  // Skip authentication during build time
  if (isBuildTime()) {
    console.log("Build-time detected: Skipping admin authentication check");
    // Return mock admin data for build time
    return { 
      user: { id: 'build-time-user-id', email: 'build@example.com' },
      role: 'admin'
    };
  }

  const supabase = createServerComponentClient({ cookies });
  
  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // User is not logged in
    redirect("/auth/sign-in");
  }
  
  // Get the user's role from the database
  const { data: userData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();
  
  if (error || !userData || userData.role !== 'admin') {
    // User is not an admin
    console.log("Access denied: User is not an admin");
    redirect("/dashboard");
  }
  
  // User is an admin, return the user data for later use if needed
  return { 
    user: session.user,
    role: userData.role
  };
}

export async function getRole() {
  // Return mock role during build time
  if (isBuildTime()) {
    console.log("Build-time detected: Returning mock role");
    return "user";
  }

  const supabase = createServerComponentClient({ cookies });
  
  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  // Get the user's role from the database
  const { data: userData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();
  
  if (error || !userData) {
    return null;
  }
  
  return userData.role;
}