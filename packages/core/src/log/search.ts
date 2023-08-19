import { z } from "zod";
import { event } from "../event";
import { createTransactionEffect, useTransaction } from "../util/transaction";
import { zod } from "../util/zod";
import { log_search } from "./log.sql";
import { assertActor, useActor, useWorkspace } from "../actor";
import { createSelectSchema } from "drizzle-zod";
import { and, eq } from "drizzle-orm";

export * as Search from "./search";
export const Info = createSelectSchema(log_search, {
  id: (schema) => schema.id.cuid2(),
});
export type Info = z.infer<typeof Info>;

export const Events = {
  Created: event("log.search.created", {
    id: z.string().cuid2(),
  }),
};

export const fromID = zod(Info.shape.id, async (id) =>
  useTransaction((tx) =>
    tx
      .select()
      .from(log_search)
      .where(
        and(eq(log_search.id, id), eq(log_search.workspaceID, useWorkspace()))
      )
      .execute()
      .then((rows) => rows.at(0))
  )
);

export const search = zod(
  Info.pick({
    id: true,
    logGroup: true,
    stageID: true,
    timeStart: true,
    timeEnd: true,
  }),
  async (input) =>
    useTransaction(async (tx) => {
      await tx
        .insert(log_search)
        .values({
          userID: assertActor("user").properties.userID,
          stageID: input.stageID,
          logGroup: input.logGroup,
          id: input.id,
          workspaceID: useWorkspace(),
          timeStart: input.timeStart,
          timeEnd: input.timeEnd,
        })
        .execute();
      createTransactionEffect(() =>
        Events.Created.publish({
          id: input.id,
        })
      );
    })
);

export const setStart = zod(
  Info.pick({
    id: true,
    timeStart: true,
  }),
  async (input) =>
    useTransaction(async (tx) => {
      await tx
        .update(log_search)
        .set({
          id: input.id,
          timeStart: input.timeStart,
        })
        .where(
          and(
            eq(log_search.id, input.id),
            eq(log_search.workspaceID, useWorkspace())
          )
        )
        .execute();
    })
);

export const complete = zod(Info.shape.id, async (input) =>
  useTransaction(async (tx) => {
    await tx
      .delete(log_search)
      .where(
        and(
          eq(log_search.id, input),
          eq(log_search.workspaceID, useWorkspace())
        )
      )
      .execute();
  })
);
