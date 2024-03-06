import { client as c } from "./initSupabase";
import { currentUser } from "../../src/app/store";

const client = c("public");
export const authentication = {
  getSession: async () => {
    const { data, error } = await client.auth.getSession();

    return error ? error : data;
  },

  mountUser: async () => {
    client.auth.onAuthStateChange((_, session) => {
      if (session && session.user) {
        currentUser.getState().setInfo(session.user);
      }
    });

    return currentUser.getState().info;
  },

  unmountUser: async () => {
    currentUser.getState().setInfo({});
    client.auth.setSession({});
  },

  signUpNewUser: async (email, password) => {
    const { data, error } = await client.auth.signUp({
      email: email,
      password: password,
    });

    if (!error) {
      authentication.mountUser();
    }

    return error ? error : data;
  },

  signInWithEmail: async (email, password) => {
    const { data, error } = await client.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (!error) {
      authentication.mountUser();
    }

    return error ? error : data;
  },

  signOut: async () => {
    const { error } = await client.auth.signOut();

    if (!error) {
      authentication.unmountUser();
    }

    return error ? error : null;
  },
};
