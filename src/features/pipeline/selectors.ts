import type { Resolution } from "@/lib/sim/clusters";
import type { PipelineState } from "./reducer";

/** Deep links: a step that needs a choice not made yet uses the default. */
export const effectiveResolution = (s: PipelineState): Resolution => s.resolution ?? "default";
