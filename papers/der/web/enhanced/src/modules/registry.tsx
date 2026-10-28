import type { ComponentType } from "react";
import type { WidgetProps } from "../types";
import ReplayEntry from "./ReplayEntry";
import { KLBoard, ScoreBoard } from "./MechanismScenes";
import Reservoir from "./Reservoir";
import MemorySnapshot from "./MemorySnapshot";

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {};
widgetRegistry["der-replay-entry"] = ReplayEntry;
widgetRegistry["der-probability-constraint"] = KLBoard;
widgetRegistry["der-logit-matching"] = ScoreBoard;
widgetRegistry["der-memory-snapshot"] = MemorySnapshot;

widgetRegistry["der-reservoir"] = Reservoir;
