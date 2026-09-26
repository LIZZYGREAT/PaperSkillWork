import type { ArchitectureSpec } from "../../core/architecture";
import type { FlowStep } from "../../core/flow-stepper";
import type { ProcessLoopSpec } from "../../core/process-loop";
import type { ResponsibilityMapSpec } from "../../core/responsibility-map";
import type { StateMachineSpec } from "../../core/state-machine";
import type { TermDefinition } from "../../core/reference";
import type { FormulaTermData } from "../../optional/formula";

export const lwfProcess: ProcessLoopSpec = {
  nodes: [
    { id: "task", label: "Current task input xₜ", kind: "input", position: { x: 125, y: 240 }, description: "The same current-task example is evaluated by the fixed teacher and trainable student." },
    { id: "teacher", label: "Fixed teacher", kind: "module", group: "Old model", position: { x: 400, y: 105 }, description: "A fixed copy of the previously learned model provides old-task responses." },
    { id: "student", label: "Trainable student", kind: "module", group: "Student", position: { x: 400, y: 340 }, description: "Initialized from the previous model and updated using old-response and current-task objectives." },
    { id: "shared", label: "Shared backbone hₜ", kind: "parameter", group: "Student", position: { x: 690, y: 340 }, description: "The shared representation feeds both task-specific output heads." },
    { id: "old-head", label: "Old-class head", kind: "module", group: "Student", position: { x: 970, y: 255 }, description: "Produces student outputs for previously learned classes." },
    { id: "new-head", label: "New-class head", kind: "module", group: "Student", position: { x: 970, y: 430 }, description: "Produces the student outputs supervised by current-task labels." },
    { id: "target", label: "Teacher old response", kind: "output", group: "Teacher target", position: { x: 690, y: 105 }, description: "The fixed teacher's output is the target for old-class response preservation." },
    { id: "new-label", label: "Current-task label yₜ", kind: "input", position: { x: 970, y: 570 }, description: "The current task's label supplies supervision for the new-class output." },
    { id: "old-loss", label: "L_old · response loss", kind: "loss", position: { x: 1260, y: 185 }, description: "Compares the teacher's old response target with the student's old-class output." },
    { id: "new-loss", label: "L_new · task loss", kind: "loss", position: { x: 1260, y: 485 }, description: "Combines the new-class student output with the current-task label." },
    { id: "optimizer", label: "Backward + optimizer", kind: "module", position: { x: 1530, y: 335 }, description: "Combines objective gradients and updates the student; the teacher stays fixed within the task." },
    { id: "next-teacher", label: "Student → next teacher", kind: "state", position: { x: 1830, y: 100 }, description: "At the task boundary, the updated student becomes the teacher for the next task." },
  ],
  edges: [
    { id: "task-teacher", from: "task", to: "teacher", label: "same xₜ", kind: "data", path: "curve" },
    { id: "task-student", from: "task", to: "student", label: "same xₜ", kind: "data" },
    { id: "teacher-student", from: "teacher", to: "student", label: "initialize", kind: "control", path: "curve" },
    { id: "teacher-target", from: "teacher", to: "target", label: "old response", kind: "data" },
    { id: "student-shared", from: "student", to: "shared", kind: "data" },
    { id: "shared-old", from: "shared", to: "old-head", kind: "data", path: "curve" },
    { id: "shared-new", from: "shared", to: "new-head", kind: "data", path: "curve" },
    { id: "target-loss", from: "target", to: "old-loss", label: "teacher target", kind: "data", path: "curve" },
    { id: "old-output-loss", from: "old-head", to: "old-loss", label: "student old output", kind: "data" },
    { id: "new-output-loss", from: "new-head", to: "new-loss", label: "student new output", kind: "data", path: "curve" },
    { id: "label-loss", from: "new-label", to: "new-loss", label: "current label", kind: "data" },
    { id: "oldloss-optimizer", from: "old-loss", to: "optimizer", label: "∇L_old", kind: "gradient", direction: "forward", path: "curve" },
    { id: "newloss-optimizer", from: "new-loss", to: "optimizer", label: "∇L_new", kind: "gradient", direction: "forward", path: "curve" },
    { id: "optimizer-student", from: "student", to: "optimizer", label: "update signal", kind: "gradient", direction: "reverse", path: "curve" },
    { id: "student-next", from: "student", to: "next-teacher", label: "task boundary", kind: "control", path: "curve" },
    { id: "next-task-loop", from: "next-teacher", to: "teacher", label: "Task t+1", kind: "control", path: "orthogonal" },
  ],
  steps: [
    { id: "arrive", title: "A new task arrives", summary: "Current-task examples enter a system with an existing model.", activeNodes: ["task"], activeEdges: ["task-teacher", "task-student"], detail: { title: "Problem and task boundary", bullets: ["The task changes while the system carries forward an earlier model.", "This mechanism sketch contains no reported experiment values."] } },
    { id: "teacher", title: "Keep the old model fixed", summary: "A fixed teacher evaluates the current input and supplies the old-response target.", activeNodes: ["task", "teacher", "target"], activeEdges: ["task-teacher", "teacher-target"] },
    { id: "student", title: "Initialize the student", summary: "The previous model initializes a trainable student for the current task.", activeNodes: ["teacher", "student"], activeEdges: ["teacher-student"] },
    { id: "forward", title: "Run both model paths", summary: "The teacher produces an old response while the student backbone feeds old- and new-class heads.", activeNodes: ["task", "teacher", "student", "shared", "old-head", "new-head", "target"], activeEdges: ["task-student", "task-teacher", "teacher-target", "student-shared", "shared-old", "shared-new"] },
    { id: "old-target", title: "Form the old-response loss", summary: "The teacher target and the student's old-class output meet at L_old.", activeNodes: ["teacher", "target", "old-head", "old-loss"], activeEdges: ["teacher-target", "target-loss", "old-output-loss"] },
    { id: "new-output", title: "Form the new-task loss", summary: "The student's new-class output and current-task label meet at L_new.", activeNodes: ["new-head", "new-label", "new-loss"], activeEdges: ["new-output-loss", "label-loss"] },
    { id: "loss", title: "Combine the two objectives", summary: "L_old preserves the teacher's response; L_new trains the current task.", activeNodes: ["old-loss", "new-loss"], activeEdges: ["target-loss", "old-output-loss", "new-output-loss", "label-loss"] },
    { id: "backward", title: "Send gradients into the update", summary: "Both objectives contribute gradients to the optimizer and student parameters.", activeNodes: ["old-loss", "new-loss", "optimizer", "student"], activeEdges: ["oldloss-optimizer", "newloss-optimizer", "optimizer-student"] },
    { id: "update", title: "Update the student", summary: "The optimizer changes the student parameters while the teacher remains fixed for this task.", activeNodes: ["optimizer", "student", "shared", "old-head", "new-head"], activeEdges: ["optimizer-student"] },
    { id: "complete", title: "Carry the student to the next task", summary: "At the task boundary, the updated student becomes the next task's teacher and the process repeats.", activeNodes: ["student", "next-teacher", "teacher"], activeEdges: ["student-next", "next-task-loop"] },
  ],
};

export const lwfArchitecture: ArchitectureSpec = {
  nodes: [
    { id: "input", label: "Current input xₜ", group: "Input", position: { x: 120, y: 255 }, detail: "The same current-task example enters the teacher and student paths." },
    { id: "teacher", label: "Fixed teacher", group: "Teacher", status: "frozen", position: { x: 430, y: 115 }, detail: "Produces an old-response target and remains fixed during this task's update." },
    { id: "teacher-out", label: "Old response target", group: "Teacher", position: { x: 720, y: 115 }, detail: "The teacher output is compared with the student's old-class response." },
    { id: "student-shared", label: "Shared backbone θₛ", group: "Student", status: "trainable", position: { x: 430, y: 340 }, detail: "Trainable shared parameters produce a feature used by both class heads." },
    { id: "student-old", label: "Old-class head θₒ", group: "Student", status: "trainable", position: { x: 760, y: 270 }, detail: "Produces the student's outputs over previously learned classes." },
    { id: "student-new", label: "New-class head θₙ", group: "Student", status: "trainable", position: { x: 760, y: 430 }, detail: "Produces the student's outputs over current-task classes." },
    { id: "new-label", label: "Current label yₜ", group: "Current supervision", position: { x: 1070, y: 540 }, detail: "Supplies supervised targets for the new-class head." },
    { id: "loss-old", label: "L_old · response", group: "Objectives", position: { x: 1080, y: 175 }, detail: "Compares the teacher target with the student old-class response." },
    { id: "loss-new", label: "L_new · task", group: "Objectives", position: { x: 1080, y: 415 }, detail: "Combines current-task labels with student new-class outputs." },
  ],
  edges: [
    { from: "input", to: "teacher", branch: "teacher", path: "curve", label: "xₜ" }, { from: "teacher", to: "teacher-out", branch: "teacher", label: "old response" },
    { from: "input", to: "student-shared", branch: "student", label: "xₜ" }, { from: "student-shared", to: "student-old", branch: "old", path: "curve" },
    { from: "student-shared", to: "student-new", branch: "new", path: "curve" }, { from: "teacher-out", to: "loss-old", branch: "old", path: "curve" },
    { from: "student-old", to: "loss-old", branch: "old" }, { from: "student-new", to: "loss-new", branch: "new", path: "curve" },
    { from: "new-label", to: "loss-new", branch: "new", path: "curve", label: "labels" },
  ],
};

export const lwfFlow: FlowStep[] = [
  { id: "arrive", title: "Problem", description: "A new task arrives while an earlier model must remain useful.", relatedIds: ["input", "teacher", "student-shared"] },
  { id: "teacher", title: "Teacher", description: "Keep the earlier model fixed to provide its old-response target.", relatedIds: ["teacher", "teacher-out"] },
  { id: "forward", title: "Forward", description: "The shared student backbone branches into old- and new-class heads.", relatedIds: ["student-shared", "student-old", "student-new", "teacher"] },
  { id: "loss", title: "Losses", description: "Old response plus student old output form L_old; new label plus student new output form L_new.", relatedIds: ["loss-old", "loss-new", "teacher-out", "new-label", "student-old", "student-new"] },
  { id: "update", title: "Update", description: "Both objectives send learning signals into the student update; the updated student starts the next task as teacher.", relatedIds: ["student-shared", "student-old", "student-new", "teacher"] },
];

export const lwfResponsibilities: ResponsibilityMapSpec = {
  actors: [
    { id: "teacher", name: "Teacher", can: "Provide an old-task response target.", cannot: "Learn the current task during this update." },
    { id: "backbone", name: "Shared backbone", can: "Transform inputs into shared features.", cannot: "By itself, distinguish every task's output labels." },
    { id: "old-head", name: "Old head", can: "Produce student outputs for old classes.", cannot: "Supply current-task labels." },
    { id: "new-head", name: "New head", can: "Produce outputs for current-task classes.", cannot: "Provide the teacher's old response." },
    { id: "objectives", name: "Learning objectives", can: "Signal old-response preservation and new-task learning.", cannot: "Choose parameter updates without an optimizer." },
    { id: "optimizer", name: "Optimizer", can: "Apply parameter updates to the student.", cannot: "Define which behavior should be preserved." },
  ],
  steps: [
    { id: "old-target", label: "Provide old behavior target", owners: ["teacher"] },
    { id: "shared", label: "Extract shared representation", owners: ["backbone"] },
    { id: "old", label: "Produce old-class response", owners: ["old-head"] },
    { id: "new", label: "Learn current task", owners: ["new-head"] },
    { id: "preserve", label: "Preserve old response", owners: ["objectives"] },
    { id: "update", label: "Update trainable parameters", owners: ["optimizer"] },
  ],
  conclusion: "The old-response objective supplies a learning signal; it does not freeze every old parameter.",
};

export const lwfStates: StateMachineSpec = {
  initialState: "ready",
  states: [
    { id: "ready", label: "Old model ready", owner: "Previous task", description: "Parameters from the previously learned tasks are available." },
    { id: "teacher", label: "Teacher fixed", owner: "Teacher copy", effect: "Old-task responses can be computed as targets." },
    { id: "student", label: "Student initialized", owner: "Student model", effect: "A trainable model is ready for current-task learning." },
    { id: "forward", label: "Forward pass", owner: "Teacher and student", effect: "Old and new outputs are available." },
    { id: "objectives", label: "Objectives formed", owner: "Loss functions", effect: "Old-response and current-task signals are combined." },
    { id: "update", label: "Student updated", owner: "Optimizer", effect: "Student parameters have changed; the teacher remains fixed for this task." },
    { id: "promoted", label: "Promoted for next task", owner: "Task boundary", terminal: true, effect: "The completed student becomes the starting teacher for the next task." },
  ],
  transitions: [
    { from: "ready", to: "teacher", explanation: "The previous model is held fixed as the response provider." },
    { from: "teacher", to: "student" }, { from: "student", to: "forward" }, { from: "forward", to: "objectives" },
    { from: "objectives", to: "update" }, { from: "update", to: "promoted", explanation: "Promotion occurs at the task boundary." },
  ],
  illegalHints: [{ from: "ready", to: "promoted", message: "The student must complete its forward, objective, and update phases before it can be promoted." }],
};

export const lwfTerms: TermDefinition[] = [
  { id: "teacher", label: "Teacher", fullName: "Previous-task model", definition: "A fixed model that supplies outputs used to preserve old-task responses.", paperRole: "Provides targets while the student learns the current task.", confusion: "A second model that is jointly optimized." },
  { id: "distillation", label: "Distillation", fullName: "Output-based knowledge distillation", definition: "A loss compares student outputs to target outputs from another model.", paperRole: "Supplies a function-level preservation signal.", confusion: "Freezing old parameters." },
];

export const ewcProcess: ProcessLoopSpec = {
  nodes: [
    { id: "task-a", label: "Task A training", kind: "input", position: { x: 125, y: 120 }, description: "Learn an earlier-task solution before estimating which parameters matter." },
    { id: "theta-star", label: "Stored optimum θ*", kind: "parameter", position: { x: 430, y: 90 }, description: "Retain the earlier task's parameter values as the regularizer's reference point." },
    { id: "fisher", label: "Fisher importance F", kind: "memory", position: { x: 430, y: 275 }, description: "Store parameter-wise importance weights estimated for the earlier task." },
    { id: "task-b", label: "Task B data", kind: "input", position: { x: 125, y: 485 }, description: "New-task examples supply the current task objective." },
    { id: "new-loss", label: "New-task loss", kind: "loss", position: { x: 430, y: 485 }, description: "Favors parameters that fit the current task." },
    { id: "penalty", label: "EWC penalty", kind: "loss", position: { x: 760, y: 205 }, description: "Importance-weighted changes away from θ* incur a larger penalty." },
    { id: "optimizer", label: "Combined optimizer", kind: "module", position: { x: 1080, y: 380 }, description: "Combines the new-task learning signal with the EWC penalty." },
    { id: "theta-b", label: "Updated parameters θ", kind: "state", position: { x: 1390, y: 380 }, description: "The current solution is updated while being regularized toward important earlier parameters." },
  ],
  edges: [
    { id: "a-star", from: "task-a", to: "theta-star", label: "learn θ*", kind: "control" }, { id: "a-fisher", from: "task-a", to: "fisher", label: "estimate F", kind: "memory", path: "curve" },
    { id: "star-penalty", from: "theta-star", to: "penalty", kind: "memory" }, { id: "fisher-penalty", from: "fisher", to: "penalty", kind: "memory", path: "curve" },
    { id: "b-loss", from: "task-b", to: "new-loss", kind: "data" }, { id: "loss-update", from: "new-loss", to: "optimizer", label: "∇L_new", kind: "gradient", direction: "forward", path: "curve" },
    { id: "penalty-update", from: "penalty", to: "optimizer", label: "∇L_EWC", kind: "gradient", direction: "forward", path: "curve" }, { id: "update-b", from: "optimizer", to: "theta-b", kind: "control" },
  ],
  steps: [
    { id: "old", title: "Train the earlier task", summary: "Learn a parameter solution for the earlier task.", activeNodes: ["task-a", "theta-star"], activeEdges: ["a-star"] },
    { id: "estimate", title: "Estimate parameter importance", summary: "Estimate which parameters are important to the earlier solution.", activeNodes: ["task-a", "fisher"], activeEdges: ["a-fisher"] },
    { id: "store", title: "Store θ* and importance", summary: "Retain the earlier optimum and its importance weights for the next task.", activeNodes: ["theta-star", "fisher"] },
    { id: "new-task", title: "Receive the new task", summary: "The current task supplies new examples and a new learning objective.", activeNodes: ["task-b", "new-loss"], activeEdges: ["b-loss"] },
    { id: "penalty", title: "Form the EWC penalty", summary: "Moving important parameters away from the stored solution incurs a larger penalty.", activeNodes: ["theta-star", "fisher", "penalty"], activeEdges: ["star-penalty", "fisher-penalty"] },
    { id: "combine", title: "Combine objectives", summary: "Optimize the new-task objective together with the importance-weighted penalty.", activeNodes: ["new-loss", "penalty", "optimizer"], activeEdges: ["loss-update", "penalty-update"] },
    { id: "update", title: "Update parameters", summary: "The optimizer produces a consolidated parameter state for the new task.", activeNodes: ["optimizer", "theta-b"], activeEdges: ["update-b"] },
  ],
};

export const ewcArchitecture: ArchitectureSpec = {
  nodes: [
    { id: "params", label: "Current parameters θ", group: "Current model", status: "trainable", position: { x: 1060, y: 370 }, detail: "These are adjusted while learning the current task." },
    { id: "optimum", label: "Stored optimum θ*", group: "Earlier-task state", status: "frozen", position: { x: 150, y: 105 }, detail: "The earlier task's parameter solution anchors the regularizer." },
    { id: "importance", label: "Importance F", group: "Earlier-task state", status: "frozen", position: { x: 150, y: 300 }, detail: "Importance weights set the relative penalty on parameter changes." },
    { id: "current-loss", label: "Current-task loss", group: "New-task objective", position: { x: 150, y: 530 }, detail: "Encourages performance on the new task." },
    { id: "ewc-penalty", label: "EWC penalty", group: "Regularizer", position: { x: 530, y: 210 }, detail: "Discourages changes to parameters estimated to be important." },
    { id: "optimizer", label: "Optimizer", group: "Update", position: { x: 800, y: 370 }, detail: "Combines gradient signals to update the current parameters." },
  ],
  edges: [
    { from: "optimum", to: "ewc-penalty", branch: "regularizer", label: "reference", path: "curve" }, { from: "importance", to: "ewc-penalty", branch: "regularizer", label: "weights", path: "curve" },
    { from: "current-loss", to: "optimizer", branch: "new-task", label: "∇L_new", path: "curve" }, { from: "ewc-penalty", to: "optimizer", branch: "regularizer", label: "∇L_EWC" }, { from: "optimizer", to: "params", branch: "update", label: "update" },
  ],
};

export const ewcResponsibilities: ResponsibilityMapSpec = {
  actors: [
    { id: "model", name: "Model parameters", can: "Represent the learned solution.", cannot: "Indicate importance without an estimator." },
    { id: "fisher", name: "Fisher estimator", can: "Estimate parameter importance for the earlier task.", cannot: "Learn the current task objective." },
    { id: "penalty", name: "EWC penalty", can: "Discourage changes to important parameters.", cannot: "Guarantee zero forgetting in every setting." },
    { id: "task-loss", name: "Current-task loss", can: "Provide a learning objective for new data.", cannot: "By itself, constrain changes to earlier parameters." },
    { id: "optimizer", name: "Optimizer", can: "Apply the combined update signal.", cannot: "Choose the importance weights." },
  ],
  steps: [
    { id: "old", label: "Store earlier solution", owners: ["model"] },
    { id: "estimate", label: "Estimate parameter importance", owners: ["fisher"] },
    { id: "protect", label: "Penalize important changes", owners: ["penalty"] },
    { id: "learn", label: "Learn the current task", owners: ["task-loss"] },
    { id: "update", label: "Update parameters", owners: ["optimizer"] },
  ],
  conclusion: "EWC protects earlier knowledge through an importance-weighted parameter penalty; it does not freeze all parameters.",
};

export const ewcStates: StateMachineSpec = {
  initialState: "task-a",
  states: [
    { id: "task-a", label: "Train task A", owner: "Model", description: "Learn an earlier task solution." },
    { id: "fisher", label: "Estimate Fisher", owner: "Importance estimator", effect: "Parameter importance values are estimated." },
    { id: "stored", label: "Store θ* and F", owner: "Task state", effect: "The reference parameters and importance weights are retained." },
    { id: "task-b", label: "Train task B with penalty", owner: "Combined objective", effect: "New-task learning is regularized by the stored state." },
    { id: "consolidated", label: "Consolidated model", owner: "Optimizer", terminal: true, effect: "The updated parameters are ready for a later task." },
  ],
  transitions: [{ from: "task-a", to: "fisher" }, { from: "fisher", to: "stored" }, { from: "stored", to: "task-b" }, { from: "task-b", to: "consolidated" }],
  illegalHints: [{ from: "task-a", to: "task-b", message: "Estimate and store parameter importance before using an importance-weighted penalty on the new task." }],
};

export const ewcTerms: TermDefinition[] = [
  { id: "fisher", label: "Fisher importance", fullName: "Diagonal Fisher information estimate", definition: "A parameter-wise estimate used to weight the regularization penalty.", paperRole: "Makes changes to more important parameters more costly.", confusion: "A hard freeze mask that forbids all parameter updates." },
  { id: "optimum", label: "θ*", fullName: "Earlier-task optimum", definition: "The parameter values at the earlier task solution.", paperRole: "The reference point in the quadratic penalty.", confusion: "The current model state after new-task training." },
];

export const ewcFormulaTerms: FormulaTermData[] = [
  { id: "new-loss", label: "L_new(θ)", explanation: "Current-task objective evaluated at the parameters being optimized.", relatedIds: ["current-loss"] },
  { id: "lambda", label: "λ", explanation: "Controls the strength of the regularization term.", relatedIds: ["ewc-penalty"] },
  { id: "fisher", label: "F_i", explanation: "Estimated importance weight for parameter i.", relatedIds: ["importance"] },
  { id: "theta-star", label: "θ*_i", explanation: "Earlier-task reference value for parameter i.", relatedIds: ["optimum"] },
];
