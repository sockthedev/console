import { useApiAuth } from "src/api";
import { ApiHandler, useJsonBody } from "sst/node/api";
import { useTransaction } from "@console/core/util/transaction";
import { Replicache } from "@console/core/replicache";
import { server } from "./server";
import { useActor } from "@console/core/actor";
import { Realtime } from "@console/core/realtime";

export const handler = ApiHandler(async () => {
  await useApiAuth();
  console.log("Pushing for", useActor());

  const body = useJsonBody();
  await useTransaction(async (tx) => {
    let mutationID = await (async function () {
      const result = await Replicache.fromID(body.clientID);
      if (result) return result.mutationID;
      await Replicache.create(body.clientID);
      return 0;
    })();

    for (const mutation of body.mutations) {
      console.log("processing", mutation);
      const expectedMutationID = mutationID + 1;

      if (mutation.id < expectedMutationID) {
        console.log(
          `Mutation ${mutation.id} has already been processed - skipping`
        );
        continue;
      }

      if (mutation.id > expectedMutationID) {
        console.warn(`Mutation ${mutation.id} is from the future - aborting`);
        break;
      }

      const { args, name } = mutation;
      console.log("processing", name);
      try {
        await server.execute(name, args);
      } catch (ex) {
        console.error(ex);
      }

      mutationID = expectedMutationID;
    }

    await Replicache.setMutationID({
      clientID: body.clientID,
      mutationID,
    });
  });
  const actor = useActor();
  if (actor.type === "user") await Replicache.poke();
  return {
    statusCode: 200,
  };
});
