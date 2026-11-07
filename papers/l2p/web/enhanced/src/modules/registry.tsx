import type { ComponentType } from "react";
import type { WidgetProps } from "../types";
import { TaskStream, ViTPath, EncoderAttention } from "./lessons";
import { PromptTuning } from "./prompt-tuning";

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  "task-stream": TaskStream,
  "vit-path": ViTPath,
  "encoder-attention": EncoderAttention,
  "prompt-tuning": PromptTuning,
};
