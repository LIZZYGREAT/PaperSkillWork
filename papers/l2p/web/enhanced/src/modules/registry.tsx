import type { ComponentType } from "react";
import type { WidgetProps } from "../types";

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {};
