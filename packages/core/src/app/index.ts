export * as App from "./";
export { Stage } from "./stage";

import { createSelectSchema } from "drizzle-zod";
import { app } from "./app.sql";
import { z } from "zod";
import { zod } from "../util/zod";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../drizzle";
import { eq, and } from "drizzle-orm";
import { useTransaction } from "../util/transaction";
import { useWorkspace } from "../actor";

export const Info = createSelectSchema(app, {
  id: (schema) => schema.id.cuid2(),
  workspaceID: (schema) => schema.workspaceID.cuid2(),
  name: (schema) => schema.name.trim().nonempty(),
}).omit({
  workspaceID: true,
});
export type Info = z.infer<typeof Info>;

export const create = zod(
  Info.pick({ name: true, id: true }).partial({
    id: true,
  }),
  async (input) => {
    const id = input.id ?? createId();
    return useTransaction(async (tx) => {
      await tx.insert(app).values({
        id,
        workspaceID: useWorkspace(),
        name: input.name,
      });
      return id;
    });
  }
);

export const fromID = zod(Info.shape.id, async (id) =>
  db.transaction(async (tx) => {
    return tx
      .select()
      .from(app)
      .where(and(eq(app.id, id), eq(app.workspaceID, useWorkspace())))
      .execute()
      .then((rows) => rows[0]);
  })
);

export const fromName = zod(Info.shape.name, async (name) =>
  db.transaction(async (tx) => {
    return tx
      .select()
      .from(app)
      .where(and(eq(app.name, name), eq(app.workspaceID, useWorkspace())))
      .execute()
      .then((rows) => rows[0]);
  })
);
