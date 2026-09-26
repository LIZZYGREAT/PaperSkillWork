import type { ArchitectureSpec } from "../../core/architecture";
import type { FlowStep } from "../../core/flow-stepper";
import type { ProcessLoopSpec } from "../../core/process-loop";
import type { ResponsibilityMapSpec } from "../../core/responsibility-map";
import type { StateMachineSpec } from "../../core/state-machine";
import type { TermDefinition } from "../../core/reference";
import type { FormulaTermData } from "../../optional/formula";

export const lwfProcess: ProcessLoopSpec = {
  nodes: [
    { id: "task", label: "New task data", kind: "input", description: "The current task supplies new examples." },
    { id: "teacher", label: "Teacher", kind: "module", group: "Old model", description: "A fixed copy provides old-task responses during this task." },
    { id: "student", label: "Student", kind: "module", group: "Updated model", description: "The trainable model learns the new task while matching old responses." },
    { id: "shared", label: "Shared feature h", kind: "parameter", group: "Student", description: "The shared representation feeds the task-specific output branches." },
    { id: "old-head", label: "Old head", kind: "module", group: "Student", description: "Produces outputs for previously learned classes." },
    { id: "new-head", label: "New head", kind: "module", group: "Student", description: "Produces outputs for the current task classes." },
    { id: "target", label: "Teacher response", kind: "output", group: "Old model", description: "The teacher's output is used as a target for function preservation." },
    { id: "old-loss", label: "Old-task loss", kind: "loss", description: "Distillation loss compares the student old-class response with the teacher target." },
    { id: "new-loss", label: "New-task loss", kind: "loss", description: "Supervised loss trains the student on current task labels." },
    { id: "optimizer", label: "Optimizer update", kind: "module", description: "The update changes student parameters; the teacher remains fixed during this task." },
    { id: "next-teacher", label: "Next teacher", kind: "state", description: "After the task completes, the trained student can serve as the teacher for the next task." },
  ],
  edges: [
    { id: "task-student", from: "task", to: "student", kind: "data" },
    { id: "task-teacher", from: "task", to: "teacher", kind: "data" },
    { id: "teacher-target", from: "teacher", to: "target", kind: "data" },
    { id: "student-shared", from: "student", to: "shared", kind: "data" },
    { id: "shared-old", from: "shared", to: "old-head", kind: "data" },
    { id: "shared-new", from: "shared", to: "new-head", kind: "data" },
    { id: "target-loss", from: "target", to: "old-loss", kind: "data" },
    { id: "old-loss-student", from: "old-head", to: "old-loss", kind: "data" },
    { id: "new-loss-student", from: "new-head", to: "new-loss", kind: "data" },
    { id: "losses-optimizer", from: "old-loss", to: "optimizer", kind: "gradient" },
    { id: "newloss-optimizer", from: "new-loss", to: "optimizer", kind: "gradient" },
    { id: "optimizer-next", from: "optimizer", to: "next-teacher", kind: "control" },
  ],
  steps: [
    { id: "arrive", title: "A new task arrives", summary: "Current-task examples enter a model that already carries parameters from earlier learning.", activeNodes: ["task"], detail: { title: "Task boundary", bullets: ["The task changes; the system reuses the existing model.", "No experimental values are implied by this diagram."] } },
    { id: "teacher", title: "Fix the old model as teacher", summary: "The previous model provides a stable old-task response while the student is trained.", activeNodes: ["task", "teacher", "target"], activeEdges: ["task-teacher", "teacher-target"] },
    { id: "student", title: "Initialize the student", summary: "A trainable student starts from the previous model and is prepared for the new task.", activeNodes: ["student", "teacher"], activeEdges: ["task-student"] },
    { id: "forward", title: "Run the forward pass", summary: "The same task input is evaluated by the teacher and student; the student produces old- and new-class outputs.", activeNodes: ["task", "teacher", "student", "shared", "old-head", "new-head", "target"], activeEdges: ["task-student", "task-teacher", "teacher-target", "student-shared", "shared-old", "shared-new"] },
    { id: "old-target", title: "Form the old-response target", summary: "The fixed teacher's response supplies a target for the student's old-class branch.", activeNodes: ["teacher", "target", "old-head", "old-loss"], activeEdges: ["teacher-target", "target-loss", "old-loss-student"] },
    { id: "new-output", title: "Learn the new task outputs", summary: "The new head is trained using labels from the current task.", activeNodes: ["task", "new-head", "new-loss"], activeEdges: ["task-student", "shared-new", "new-loss-student"] },
    { id: "loss", title: "Combine learning objectives", summary: "The update balances the old-response objective and the new-task objective.", activeNodes: ["old-loss", "new-loss"], activeEdges: ["target-loss", "old-loss-student", "new-loss-student"] },
    { id: "backward", title: "Send learning signals", summary: "Both objectives contribute learning signals to the student update.", activeNodes: ["old-loss", "new-loss", "student", "shared", "old-head", "new-head"], activeEdges: ["losses-optimizer", "newloss-optimizer"] },
    { id: "update", title: "Update the student", summary: "The optimizer changes student parameters while the teacher remains a fixed target for this task.", activeNodes: ["optimizer", "student", "shared", "old-head", "new-head"], activeEdges: ["losses-optimizer", "newloss-optimizer"] },
    { id: "complete", title: "Complete the task", summary: "The trained model is ready to carry forward to the next task.", activeNodes: ["student", "next-teacher"], activeEdges: ["optimizer-next"] },
  ],
};

export const lwfArchitecture: ArchitectureSpec = {
  nodes: [
    { id: "input", label: "New task input", group: "Input", detail: "The current example is the input to both model evaluations." },
    { id: "teacher", label: "Fixed teacher", group: "Old model", status: "frozen", detail: "Produces the response target during the task update." },
    { id: "student-shared", label: "Shared backbone", group: "Student", status: "trainable", detail: "Shared student parameters produce a feature representation." },
    { id: "student-old", label: "Old-class head", group: "Student", status: "trainable", detail: "Produces the student's response for old classes." },
    { id: "student-new", label: "New-class head", group: "Student", status: "trainable", detail: "Produces the current task's class outputs." },
    { id: "teacher-out", label: "Old response target", group: "Outputs", detail: "The teacher response is compared with the student's old-class output." },
    { id: "loss-old", label: "Distillation objective", group: "Objectives", detail: "Encourages the student to preserve old-task outputs." },
    { id: "loss-new", label: "Task objective", group: "Objectives", detail: "Supervises learning on the current task." },
  ],
  edges: [
    { from: "input", to: "teacher", branch: "teacher" }, { from: "teacher", to: "teacher-out", branch: "teacher" },
    { from: "input", to: "student-shared", branch: "student" }, { from: "student-shared", to: "student-old", branch: "old" },
    { from: "student-shared", to: "student-new", branch: "new" }, { from: "teacher-out", to: "loss-old", branch: "old" },
    { from: "student-old", to: "loss-old", branch: "old" }, { from: "student-new", to: "loss-new", branch: "new" },
  ],
};

export const lwfFlow: FlowStep[] = [
  { id: "input", title: "Input", description: "A current-task example is presented.", relatedIds: ["input", "teacher", "student-shared"] },
  { id: "forward", title: "Forward", description: "Teacher and student produce outputs for their relevant class sets.", relatedIds: ["teacher", "teacher-out", "student-shared", "student-old", "student-new"] },
  { id: "loss", title: "Losses", description: "Distillation and current-task supervision define complementary objectives.", relatedIds: ["loss-old", "loss-new", "teacher-out"] },
  { id: "backward", title: "Backward", description: "Learning signals flow into the trainable student path.", relatedIds: ["student-shared", "student-old", "student-new", "loss-old", "loss-new"] },
  { id: "update", title: "Update", description: "The student changes; the teacher stays fixed until the task boundary.", relatedIds: ["student-shared", "student-old", "student-new", "teacher"] },
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
    { id: "task-a", label: "Train task A", kind: "input", description: "The first task is learned before estimating which parameters matter to it." },
    { id: "theta-star", label: "Stored optimum θ*", kind: "parameter", description: "The parameter values at the earlier task solution are retained." },
    { id: "fisher", label: "Fisher importance F", kind: "memory", description: "A diagonal importance estimate weights how strongly parameter changes are penalized." },
    { id: "task-b", label: "Task B data", kind: "input", description: "New-task examples supply the current objective." },
    { id: "new-loss", label: "New-task loss", kind: "loss", description: "The current task objective favors parameters that fit the new task." },
    { id: "penalty", label: "Quadratic penalty", kind: "loss", description: "Parameters important to the earlier task are penalized for moving away from θ*." },
    { id: "optimizer", label: "Optimizer", kind: "module", description: "Updates balance new-task learning against the importance-weighted constraint." },
    { id: "theta-b", label: "Consolidated parameters", kind: "state", description: "The resulting parameters fit the current task while being regularized toward the earlier solution." },
  ],
  edges: [
    { id: "a-star", from: "task-a", to: "theta-star", kind: "control" }, { id: "a-fisher", from: "task-a", to: "fisher", kind: "memory" },
    { id: "star-penalty", from: "theta-star", to: "penalty", kind: "memory" }, { id: "fisher-penalty", from: "fisher", to: "penalty", kind: "memory" },
    { id: "b-loss", from: "task-b", to: "new-loss", kind: "data" }, { id: "loss-update", from: "new-loss", to: "optimizer", kind: "gradient" },
    { id: "penalty-update", from: "penalty", to: "optimizer", kind: "gradient" }, { id: "update-b", from: "optimizer", to: "theta-b", kind: "control" },
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
    { id: "params", label: "Current parameters θ", group: "Model", status: "trainable", detail: "These are adjusted while learning the current task." },
    { id: "optimum", label: "Stored optimum θ*", group: "Earlier-task state", status: "frozen", detail: "The earlier task's parameter solution anchors the regularizer." },
    { id: "importance", label: "Importance F", group: "Earlier-task state", status: "frozen", detail: "Importance weights set the relative penalty on parameter changes." },
    { id: "current-loss", label: "Current-task loss", group: "Objective", detail: "Encourages performance on the new task." },
    { id: "ewc-penalty", label: "EWC penalty", group: "Objective", detail: "Discourages changes to parameters estimated to be important." },
    { id: "optimizer", label: "Optimizer", group: "Update", detail: "Combines gradient signals to update the current parameters." },
  ],
  edges: [
    { from: "optimum", to: "ewc-penalty", branch: "regularizer" }, { from: "importance", to: "ewc-penalty", branch: "regularizer" },
    { from: "current-loss", to: "optimizer", branch: "new-task" }, { from: "ewc-penalty", to: "optimizer", branch: "regularizer" }, { from: "optimizer", to: "params", branch: "update" },
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
