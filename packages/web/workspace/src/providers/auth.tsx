import { WorkspaceStore } from "$/data/workspace";
import { Client } from "@console/functions/replicache/framework";
import type { ServerType } from "@console/functions/replicache/server";
import { Navigate } from "@solidjs/router";
import { Replicache } from "replicache";
import { ParentProps, createContext, useContext } from "solid-js";
import { useStorage } from "./account";

export * as AuthStore from "./auth";

interface AuthData {
  [accountID: string]: Token;
}

interface Token {
  email: string;
  accountID: string;
  token: string;
}

function get() {
  return JSON.parse(localStorage.getItem("auth") || "{}") as AuthData;
}

function set(auth: AuthData) {
  return localStorage.setItem("auth", JSON.stringify(auth));
}

type AuthContextType = Record<
  string,
  {
    token: Token;
    replicache: Replicache<typeof mutators>;
  }
>;
const AuthContext = createContext<AuthContextType>();

const mutators = new Client<ServerType>()
  .mutation("workspace_create", async (tx, input) => {
    await WorkspaceStore.put({
      id: input.id!,
      slug: input.slug,
      timeUpdated: null as any,
      timeCreated: null as any,
      timeDeleted: null,
    })(tx);
  })
  .build();

export function AuthProvider(props: ParentProps) {
  const tokens = get();
  const fragment = new URLSearchParams(location.hash.substring(1));
  const access_token = fragment.get("access_token");
  const storage = useStorage();
  if (access_token) {
    const [_headerEncoded, payloadEncoded] = access_token.split(".");
    const payload = JSON.parse(
      atob(payloadEncoded.replace(/-/g, "+").replace(/_/g, "/"))
    );
    tokens[payload.properties.accountID] = {
      token: access_token,
      ...payload.properties,
    };
    storage.set("account", payload.properties.accountID);
    set(tokens);
  }

  console.log("Auth Info", tokens);

  if (Object.values(tokens).length === 0) return <Navigate href="/auth" />;

  const stores: AuthContextType = {};
  for (const token of Object.values(tokens)) {
    const rep = new Replicache({
      name: token.accountID,
      auth: `Bearer ${token.token}`,
      licenseKey: "l24ea5a24b71247c1b2bb78fa2bca2336",
      pullURL: import.meta.env.VITE_API_URL + "/replicache/pull",
      pushURL: import.meta.env.VITE_API_URL + "/replicache/push",
      mutators,
    });
    const oldPush = rep.pusher;
    rep.pusher = async (req: Request) => {
      const result = await oldPush(req);
      setTimeout(() => {
        rep.pull();
      }, 0);
      return result;
    };

    stores[token.accountID] = {
      token,
      replicache: rep,
    };
  }

  return (
    <AuthContext.Provider value={stores}>{props.children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const result = useContext(AuthContext);
  if (!result) throw new Error("useAuth must be used within a AuthProvider");
  return result;
}
