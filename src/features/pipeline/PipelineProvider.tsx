"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { initialState, reducer, type PipelineAction, type PipelineState } from "./reducer";
import type { StepSlug } from "./registry";

const StateCtx = createContext<PipelineState>(initialState);
const DispatchCtx = createContext<Dispatch<PipelineAction>>(() => {});

/** Lives in the root layout, so choices survive client-side navigation between steps. */
export function PipelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export const usePipeline = () => useContext(StateCtx);
export const usePipelineDispatch = () => useContext(DispatchCtx);
export const useStepDone = (step: StepSlug) => usePipeline().done.includes(step);
