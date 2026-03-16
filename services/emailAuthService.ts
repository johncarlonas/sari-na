import { supabase } from "./supabase";

type UserProfilePayload = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  last_login?: string;
};

export const checkEmailExistsInUsers = async (email: string) => {
  const { data, error } = await supabase.rpc("user_email_exists", {
    target_email: email,
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
};

export const sendOtpToEmail = async (email: string, shouldCreateUser: boolean) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser,
    },
  });

  if (error) {
    throw error;
  }
};

export const verifyEmailOtp = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    throw error;
  }

  return data.user;
};

export const upsertSignupProfile = async (payload: UserProfilePayload) => {
  const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });

  if (error) {
    throw error;
  }
};

export const touchUserLastLogin = async (id: string, email: string, lastLogin: string) => {
  const { error } = await supabase
    .from("users")
    .update({ email, last_login: lastLogin })
    .eq("id", id);

  if (error) {
    throw error;
  }
};
