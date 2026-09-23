import React from "react";
import { TemperatureLab as Inner } from "./problem-compare";
export function TemperatureLab(props: { chapterId: string; moduleId: string }) { return React.createElement(Inner, props); }
