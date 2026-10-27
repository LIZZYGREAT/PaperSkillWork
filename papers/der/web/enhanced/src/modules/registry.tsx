import type { ComponentType } from "react";
import type { WidgetProps } from "../types";
import ReplayEntry from "./ReplayEntry";
import ProbabilityConstraint from "./ProbabilityConstraint";
import LogitMatching from "./LogitMatching";
import MemorySnapshot from "./MemorySnapshot";

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {};
widgetRegistry["der-replay-entry"] = ReplayEntry;
widgetRegistry["der-probability-constraint"] = ProbabilityConstraint;
widgetRegistry["der-logit-matching"] = LogitMatching;
widgetRegistry["der-memory-snapshot"] = MemorySnapshot;
