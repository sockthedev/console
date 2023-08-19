import type { Resource } from "@console/core/app/resource";
import { define } from "$/providers/replicache";

export const ResourceStore = define<Resource.Info>({
  scan() {
    return ["resource"];
  },
  get(id: string) {
    return ["resource", id];
  },
});
