import type { ComponentType } from "react";
import type { WidgetProps } from "../types";
import { TaskStream, ViTPath, EncoderAttention } from "./lessons";

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  "task-stream": TaskStream,
  "vit-path": ViTPath,
  "encoder-attention": EncoderAttention,
};
