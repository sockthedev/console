import sst from "./sst.png";
import patrick from "./patrick.jpg";
import { styled } from "@macaron-css/solid";
import {
  IconChevronUpDown,
  IconClipboard,
  IconGlobeAmericas,
} from "$/ui/icons";
import { createSubscription } from "$/data/replicache";
import { useParams } from "@solidjs/router";
import { StageStore } from "$/data/stage";
import { AppStore } from "$/data/app";
import { theme } from "$/ui/theme";
import { Row, Stack } from "$/ui/layout";
import { utility } from "$/ui/utility";
import {
  IconAPI,
  IconNext,
  IconNodeRuntime,
  IconPythonRuntime,
} from "$/ui/icons/custom";
import { For, Match, Show, Switch, createEffect, createMemo } from "solid-js";
import { ResourceStore } from "$/data/resource";
import type { Resource } from "@console/core/app/resource";
import {
  AppProvider,
  StageProvider,
  useCommandBar,
} from "$/pages/workspace/command-bar";

const Content = styled("div", {
  base: {
    padding: theme.contentPadding,
    ...utility.stack(4),
  },
});

const Header = styled("div", {
  base: {
    top: "0",
    position: "sticky",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    backgroundColor: theme.color.background.navbar,
    borderBottom: `1px solid ${theme.color.divider.base}`,
    padding: theme.space[3],
  },
});

const User = styled("a", {
  base: {
    color: theme.color.text.secondary,
    flexShrink: 0,
    cursor: "pointer",
    fontSize: "0.875rem",
    opacity: "0.8",
    transition: `opacity ${theme.colorFadeDuration} ease-out`,
    ":hover": {
      opacity: "1",
      textDecoration: "none",
    },
  },
});

const UserImage = styled("img", {
  base: {
    borderRadius: "50%",
    backgroundColor: theme.color.background.surface,
    width: 28,
  },
});

const OrgSwitcher = styled("img", {
  base: {
    width: 32,
    height: 32,
    flexShrink: 0,
    padding: 0,
    border: "none",
    borderRadius: "4px",
    backgroundColor: "transparent",
    transition: `border ${theme.colorFadeDuration} ease-out`,
  },
});

const StageSwitcher = styled("div", {
  base: {
    flexShrink: 0,
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    borderLeft: `1px solid ${theme.color.divider.base}`,
    paddingLeft: theme.space[3],
    gap: theme.space[3],
    font: theme.fonts.heading,
    color: theme.color.text.secondary,
  },
});

const SwitcherApp = styled("div", {
  base: {
    fontWeight: "500",
  },
});
const SwitcherStage = styled("div", {
  base: {
    fontSize: "0.875rem",
    color: theme.color.text.dimmed,
  },
});

const SwitcherIcon = styled(IconChevronUpDown, {
  base: {
    color: theme.color.text.dimmed,
    width: 20,
    height: 20,
  },
});

const ResourceCard = styled("div", {
  base: {
    borderRadius: 4,
    backgroundColor: theme.color.background.surface,
  },
  variants: {
    type: {
      default: {},
      outputs: {
        backgroundColor: "transparent",
        border: `1px solid ${theme.color.divider.base}`,
      },
    },
  },
});

const ResourceHeader = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${theme.space[3]} ${theme.space[3]}`,
    borderBottom: `1px solid ${theme.color.divider.surface}`,
  },
});

const ResourceName = styled("div", {
  base: {
    fontWeight: "500",
    fontFamily: theme.fonts.body,
    fontSize: "0.875rem",
  },
});

const ResourceDescription = styled("div", {
  base: {
    fontWeight: "400",
    fontSize: "0.8125rem",
    color: theme.color.text.secondary,
  },
});

const ResourceType = styled("div", {
  base: {
    fontSize: "0.8125rem",
    fontWeight: "400",
    color: theme.color.text.secondary,
  },
});

const ResourceChildren = styled("div", {
  base: {
    ...utility.stack(0),
    padding: `0 ${theme.space[3]}`,
  },
});

export const ResourceChild = styled("div", {
  base: {
    padding: `${theme.space[4]} 0`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space[4],
    borderBottom: `1px solid ${theme.color.divider.surface}`,
    selectors: {
      "&:last-child": {
        border: "none",
      },
    },
  },
});

export const ResourceChildTitleLink = styled("a", {
  base: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
  },
});

export const ResourceChildTitle = styled("span", {
  base: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
  },
});

export const ResourceChildDetail = styled("span", {
  base: {
    color: theme.color.text.secondary,
    fontSize: "0.8125rem",
    fontFamily: theme.fonts.code,
    textOverflow: "ellipsis",
    textAlign: "right",
    overflow: "hidden",
    lineHeight: "normal",
    whiteSpace: "nowrap",
  },
});
export const ResourceChildExtra = styled("span", {
  base: {
    color: theme.color.text.dimmed,
    fontSize: "0.625rem",
    textTransform: "uppercase",
    fontFamily: theme.fonts.code,
    whiteSpace: "nowrap",
  },
});

export const ResourceChildIcon = styled("div", {
  base: {
    flexShrink: 0,
    width: 16,
    color: theme.color.text.dimmed,
    opacity: 0.85,
    ":hover": {
      color: theme.color.text.secondary,
    },
  },
});

export const ResourceChildTag = styled("div", {
  base: {
    flex: "0 0 auto",
    width: "50px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.color.text.secondary,
    fontSize: "0.5625rem",
    textTransform: "uppercase",
    border: `1px solid ${theme.color.divider.base}`,
    borderRadius: theme.borderRadius,
  },
});

export function Stage() {
  const params = useParams();
  const app = createSubscription(() => AppStore.fromName(params.appName));
  const stage = createSubscription(() =>
    app()
      ? StageStore.fromName(app()!.id, params.stageName)
      : async () => undefined
  );
  const resources = createSubscription(
    () => (stage() ? ResourceStore.forStage(stage()!.id) : async () => []),
    []
  );

  createEffect(() => console.log({ ...params }));

  const bar = useCommandBar();

  return (
    <>
      <Header>
        <Row space="4">
          <OrgSwitcher src={sst} />
          <StageSwitcher onClick={() => bar.show(StageProvider, AppProvider)}>
            <Stack space="1">
              <SwitcherApp>{app()?.name}</SwitcherApp>
              <SwitcherStage>{stage()?.name}</SwitcherStage>
            </Stack>
            <SwitcherIcon />
          </StageSwitcher>
        </Row>
        <User>
          <UserImage src={patrick} />
        </User>
      </Header>
      <Content>
        <For
          each={resources()
            .filter((r) => r.type === "Api" || r.type === "StaticSite")
            .sort((a, b) => (a.cfnID > b.cfnID ? 1 : -1))}
        >
          {(resource) => (
            <ResourceCard>
              <ResourceHeader>
                <Row space="2" vertical="center">
                  <Switch>
                    <Match when={resource.type === "Api"}>
                      <IconAPI width={16} />
                    </Match>
                    <Match when={resource.type === "StaticSite"}>
                      <IconGlobeAmericas width={16} />
                    </Match>
                  </Switch>
                  <ResourceName>{resource.cfnID}</ResourceName>
                  <ResourceDescription>
                    <Switch>
                      <Match when={resource.type === "Api" && resource}>
                        {(resource) =>
                          resource().metadata.customDomainUrl ||
                          resource().metadata.url
                        }
                      </Match>
                      <Match when={resource.type === "StaticSite" && resource}>
                        {(resource) =>
                          resource().metadata.customDomainUrl ||
                          resource().metadata.path
                        }
                      </Match>
                    </Switch>
                  </ResourceDescription>
                </Row>
                <ResourceType>{resource.type}</ResourceType>
              </ResourceHeader>
              <ResourceChildren>
                <Switch>
                  <Match when={resource.type === "Api" && resource}>
                    {(resource) => (
                      <For each={resource().metadata.routes}>
                        {(route) => {
                          const fn = createMemo(
                            () =>
                              resources().find(
                                (r) =>
                                  r.type === "Function" &&
                                  r.addr === route.fn?.node
                              ) as Extract<Resource.Info, { type: "Function" }>
                          );
                          const method = createMemo(
                            () => route.route.split(" ")[0]
                          );
                          const path = createMemo(
                            () => route.route.split(" ")[1]
                          );
                          return (
                            <Show when={fn()}>
                              <ResourceChild>
                                <Row space="2" vertical="center">
                                  <ResourceChildTag>
                                    {method()}
                                  </ResourceChildTag>
                                  <ResourceChildTitleLink
                                    href={`https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${
                                      fn().metadata.arn.split("function:")[1]
                                    }`}
                                  >
                                    {path()}
                                  </ResourceChildTitleLink>
                                </Row>
                                <Row shrink={false} space="3" vertical="center">
                                  <Show when={fn() && fn().enrichment.size}>
                                    {(value) => (
                                      <ResourceChildDetail>
                                        {Math.ceil(value() / 1024)} KB
                                      </ResourceChildDetail>
                                    )}
                                  </Show>
                                  <ResourceChildIcon>
                                    <IconNodeRuntime />
                                  </ResourceChildIcon>
                                </Row>
                              </ResourceChild>
                            </Show>
                          );
                        }}
                      </For>
                    )}
                  </Match>
                </Switch>
              </ResourceChildren>
            </ResourceCard>
          )}
        </For>
        <ResourceCard type="outputs">
          <ResourceHeader>
            <Row space="2" vertical="center">
              <ResourceName>Outputs</ResourceName>
            </Row>
          </ResourceHeader>
          <ResourceChildren>
            <For
              each={[
                [
                  "ApiEndpoint",
                  "https://mwismf5e9l.execute-api.us-east-1.amazonaws.com/prod",
                ],
                [
                  "ServerlessDeploymentBucketName",
                  "mono-repo-sls-groups-pro-serverlessdeploymentbuck-1kmkojwrhblsj",
                ],
                [
                  "HelloLambdaFunctionQualifiedArn",
                  "arn:aws:lambda:us-east-1:087220554750:function:mono-repo-sls-groups-prod-hello:3",
                ],
              ]}
            >
              {([key, value]) => (
                <ResourceChild>
                  <Row shrink={false}>
                    <ResourceChildTitle>{key}</ResourceChildTitle>
                  </Row>
                  <Row vertical="center" space="2">
                    <ResourceChildDetail>{value}</ResourceChildDetail>
                    <ResourceChildIcon>
                      <IconClipboard />
                    </ResourceChildIcon>
                  </Row>
                </ResourceChild>
              )}
            </For>
          </ResourceChildren>
        </ResourceCard>
      </Content>
    </>
  );
}