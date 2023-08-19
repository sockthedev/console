import { Route, Routes, useNavigate, useParams } from "@solidjs/router";
import {
  ReplicacheProvider,
  createSubscription,
  useReplicache,
} from "$/providers/replicache";
import { useCommandBar } from "./command-bar";
import { Stage } from "./stage";
import { Show, createEffect, createMemo } from "solid-js";
import { WorkspaceStore } from "$/data/workspace";
import { useAuth } from "$/providers/auth";
import {
  IconUserPlus,
  IconArrowsRightLeft,
  IconCog6Tooth,
  IconWrench,
  IconWrenchScrewdriver,
} from "$/ui/icons";
import { User } from "./user";
import { Account } from "./account";
import { Settings } from "./settings";
import { Overview } from "./overview";
import { WorkspaceContext } from "./context";
import { AppStore } from "$/data/app";
import { IconApp } from "$/ui/icons/custom";
import { StageStore } from "$/data/stage";
import { useStorage } from "$/providers/account";
import { Debug } from "../debug";

export function Workspace() {
  const params = useParams();
  const auth = useAuth();
  const storage = useStorage();
  const nav = useNavigate();
  const rep = createMemo(() => auth[storage.value.account].replicache);
  const workspace = createSubscription(
    () => WorkspaceStore.fromSlug(params.workspaceSlug),
    undefined,
    rep
  );

  const bar = useCommandBar();

  createEffect(() => {
    const id = workspace()?.id;
    if (id) storage.set("workspace", id);
  });

  bar.register("workspace", async () => {
    return [
      {
        icon: IconUserPlus,
        title: "Invite user to workspace",
        category: "Workspace",
        run: (control) => {
          control.hide();
          nav(`/${workspace()?.slug}/user`);
        },
      },
      {
        icon: IconArrowsRightLeft,
        title: "Connect an AWS Account",
        category: "Workspace",
        run: (control) => {
          control.hide();
          nav(`/${workspace()?.slug}/account`);
        },
      },
      {
        icon: IconWrenchScrewdriver,
        title: "Manage workspace settings",
        category: "Workspace",
        run: (control) => {
          control.hide();
          nav(`/${workspace()?.slug}/settings`);
        },
      },
    ];
  });

  return (
    <Show when={workspace()}>
      <ReplicacheProvider
        accountID={storage.value.account}
        workspaceID={workspace()!.id}
      >
        <WorkspaceContext.Provider value={() => workspace()!}>
          <Content />
        </WorkspaceContext.Provider>
      </ReplicacheProvider>
    </Show>
  );
}

export function Content() {
  const bar = useCommandBar();
  const rep = useReplicache();
  const nav = useNavigate();
  const params = useParams();
  const apps = AppStore.watch.scan(useReplicache());
  bar.register("app-switcher", async () => {
    return apps().map((app) => ({
      icon: IconApp,
      category: "App",
      title: `Switch to "${app.name}" app`,
      run: async (control) => {
        const stages = await rep().query(StageStore.forApp(app.id));
        nav(`/${params.workspaceSlug}/${app.name}/${stages[0].name}`);
        control.hide();
      },
    }));
  });
  return (
    <Routes>
      <Route path="user" component={User} />
      <Route path="account" component={Account} />
      <Route path="settings" component={Settings} />
      <Route path="debug" component={Debug} />
      <Route path=":appName/:stageName/*" component={Stage} />
      <Route path="*" component={Overview} />
    </Routes>
  );
}
