import React from "react";
import { LossLab as Inner } from "./problem-compare";
export function LossLab(props: { chapterId: string; moduleId: string }) { return React.createElement(Inner, props); }
