import React from "react";
import { LambdaLab as Inner } from "./problem-compare";
export function LambdaLab(props: { chapterId: string; moduleId: string }) { return React.createElement(Inner, props); }
