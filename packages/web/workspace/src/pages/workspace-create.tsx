import { WorkspaceStore } from "$/data/workspace";
import { useStorage } from "$/providers/account";
import { useAuth } from "$/providers/auth";
import { createSubscription } from "$/providers/replicache";
import {
  Button,
  FormInput,
  Fullscreen,
  Stack,
  AvatarInitialsIcon,
  Text,
  utility,
} from "$/ui";
import { styled } from "@macaron-css/solid";
import { createId } from "@paralleldrive/cuid2";
import { useNavigate } from "@solidjs/router";
import { Show, createEffect, createMemo, createSignal } from "solid-js";

const Form = styled("form", {
  base: {
    width: 320,
    ...utility.stack(5),
  },
});

export function WorkspaceCreate() {
  const auth = useAuth();
  const storage = useStorage();
  const nav = useNavigate();
  const rep = createMemo(() => auth[storage.value.account].replicache);
  const id = createId();
  const workspace = createSubscription(
    () => WorkspaceStore.fromID(id),
    null,
    rep
  );
  const [slug, setSlug] = createSignal("");
  const pending = createMemo(() => workspace() != null);
  const [error, setError] = createSignal(false);

  createEffect((prev) => {
    if (prev && !pending()) setError(true);
    return pending();
  });
  createEffect(() => {
    if (workspace()?.timeCreated) nav("/" + workspace()?.slug + "/account");
  });

  return (
    <Fullscreen>
      <Stack space="5">
        <Stack horizontal="center" space="5">
          <AvatarInitialsIcon type="workspace" text={slug() || "-"} />
          <Stack horizontal="center" space="2">
            <Text size="lg" weight="medium">
              Create a new workspace
            </Text>
            <Text color="secondary" on="base">
              Start by giving your workspace a name
            </Text>
          </Stack>
        </Stack>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const slug = fd.get("slug") as string;
            rep().mutate.workspace_create({
              id,
              slug,
            });
          }}
        >
          <FormInput
            autofocus
            pattern="[a-z0-9\-]+"
            minlength={3}
            onInput={(e) => {
              setSlug(e.currentTarget.value);
              setError(false);
            }}
            name="slug"
            color={error() ? "danger" : "primary"}
            placeholder="acme"
            hint="Needs to be lowercase, unique, and URL friendly."
          />
          <Button type="submit" disabled={Boolean(pending())}>
            <Show when={pending()} fallback="Create Workspace">
              Creating&hellip;
            </Show>
          </Button>
        </Form>
      </Stack>
    </Fullscreen>
  );
}
