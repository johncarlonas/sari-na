import { supabase } from "./supabase";

type UserProfilePayload = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  last_login?: string;
};

export type CurrentUserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
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

export const getCurrentUserProfile = async (): Promise<CurrentUserProfile | null> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    email: data.email ?? user.email ?? "",
    first_name: data.first_name ?? "",
    last_name: data.last_name ?? "",
  };
};

export const updateCurrentUserName = async (firstName: string, lastName: string) => {
  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("No active user session");
  }

  const { error } = await supabase
    .from("users")
    .update({ first_name: cleanFirstName, last_name: cleanLastName })
    .eq("id", user.id);

  if (error) {
    throw error;
  }
};

const splitDisplayName = (rawName: string) => {
  const parts = rawName
    .trim()
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { first_name: "", last_name: "" };
  }

  if (parts.length === 1) {
    return { first_name: parts[0], last_name: "" };
  }

  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
};

export const syncCurrentUserProfileFromAuth = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("No active user session");
  }

  const metadata = user.user_metadata ?? {};
  const providerFirstName = (metadata.given_name as string | undefined)?.trim() ?? "";
  const providerLastName = (metadata.family_name as string | undefined)?.trim() ?? "";
  const providerFullName =
    (metadata.full_name as string | undefined)?.trim() ||
    (metadata.name as string | undefined)?.trim() ||
    "";

  const namePartsFromFull = splitDisplayName(providerFullName);
  const firstName = providerFirstName || namePartsFromFull.first_name || "Google";
  const lastName = providerLastName || namePartsFromFull.last_name || "User";

  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      first_name: firstName,
      last_name: lastName,
      last_login: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
};
