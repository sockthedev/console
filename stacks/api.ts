import { StackContext, Api, use } from "sst/constructs";
import { Auth } from "./auth";
import { Secrets } from "./secrets";
import { Events } from "./events";
import { DNS } from "./dns";

export function API({ stack }: StackContext) {
  const auth = use(Auth);
  const secrets = use(Secrets);
  const bus = use(Events);
  const dns = use(DNS);

  const api = new Api(stack, "api", {
    defaults: {
      function: {
        bind: [auth, ...Object.values(secrets.database), bus],
        permissions: ["iot"],
      },
    },
    routes: {
      "POST /replicache/pull": "packages/functions/src/replicache/pull.handler",
      "POST /replicache/push": "packages/functions/src/replicache/push.handler",
    },
    customDomain: {
      domainName: "api." + dns.domain,
      hostedZone: dns.zone,
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.customDomainUrl,
    Output: "",
  });

  return api;
}
