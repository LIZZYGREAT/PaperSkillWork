# Source Cache — Learning to Prompt for Continual Learning

<!-- SOURCE CACHE STATUS: COMPLETE -->

**Source version:** arXiv:2112.08654v2, as identified on PDF page 1.  **Source file:** `source/paper.pdf`.  **SHA-256:** `C32A3012BE38E3AB1D6DCC2B38ED350C2DCF40D746899FF3E93B1B681FC08D87`.

**Extraction:** complete 13-page text extraction from the provided PDF with Poppler `pdftotext -layout -enc UTF-8`; page boundaries are retained below as PDF-page locators. Equations are the extracted text representation; use the cited equation/page in the preserved PDF when exact typesetting is needed. Full-page render captures for pages containing figures, tables, or the formal algorithm are listed in `manifest.json`.

**Locator convention:** `PDF p. N` means the Nth page of this exact 13-page source PDF; section, figure, table, equation, and algorithm labels refer to the paper’s own numbering.

## PDF p. 1

```text
                                                                         Learning to Prompt for Continual Learning

                                                      Zifeng Wang1 * Zizhao Zhang2 Chen-Yu Lee2 Han Zhang3 Ruoxi Sun2
                                                      Xiaoqi Ren2 Guolong Su3 Vincent Perot3 Jennifer Dy1 Tomas Pfister2
                                                             1
                                                               Northeastern University 2 Google Cloud AI 3 Google Research
arXiv:2112.08654v2 [cs.LG] 21 Mar 2022




                                                                    Abstract                              Rehearsal-based methods: 
              Our method: 

                                                                                                                                                                                               : Trainable
                                                                                                          Fine-tuning                             Prompt selection + tuning

                                                                                                            Data buffer of
                                             The mainstream paradigm behind continual learning has           past tasks
                                                                                                                                                               Query                Instruct
                                                                                                                               Mini-                                    Prompt 

                                         been to adapt the model parameters to non-stationary data                           batching   Model N      Task N                                     Model 0
                                                                                                                                                                          pool

                                         distributions, where catastrophic forgetting is the central               Task N                                           Mini-batching

                                         challenge. Typical methods rely on a rehearsal buffer or
                                         known task identity at test time to retrieve learned knowl-      Figure 1. Overview of the L2P framework. Compared with typical
                                         edge and address forgetting, while this work presents a          methods that adapt entire or partial model weights to tasks sequen-
                                         new paradigm for continual learning that aims to train           tially with a rehearsal buffer to avoid forgetting, L2P uses a single
                                         a more succinct memory system without accessing task             backbone model and learns a prompt pool to instruct the model
                                         identity at test time. Our method learns to dynamically          conditionally. Task-specific knowledge is stored inside a prompt
                                                                                                          pool, thus a rehearsal buffer is no longer mandatory to mitigate
                                         prompt (L2P) a pre-trained model to learn tasks sequen-
                                                                                                          forgetting. L2P automatically selects and updates prompts from
                                         tially under different task transitions. In our proposed
                                                                                                          the pool in an instance-wise fashion, thus task identity is not re-
                                         framework, prompts are small learnable parameters, which         quired at test time. Notably, our largest prompt space is smaller
                                         are maintained in a memory space. The objective is to            than the size of one 224 × 224 image.
                                         optimize prompts to instruct the model prediction and ex-
                                         plicitly manage task-invariant and task-specific knowledge
                                                                                                             A major body of work in continual learning follows the
                                         while maintaining model plasticity. We conduct comprehen-
                                                                                                          learning paradigm by adapting the entire or partial model
                                         sive experiments under popular image classification bench-
                                                                                                          weights continually as the data distribution shifts, with a
                                         marks with different challenging continual learning set-
                                                                                                          focus on preserving past knowledge [9,34]. Although many
                                         tings, where L2P consistently outperforms prior state-of-
                                                                                                          types of methods attain good results, there are still critical
                                         the-art methods. Surprisingly, L2P achieves competitive
                                                                                                          limitations that need to be addressed. First, motivated by
                                         results against rehearsal-based methods even without a re-
                                                                                                          the episodic memory in the hippocampus according to the
                                         hearsal buffer and is directly applicable to challenging task-
                                                                                                          Complementary Learning Systems (CLS) theory [23, 36],
                                         agnostic continual learning. Source code is available at
                                                                                                          many state-of-the-art methods [3, 4, 8] rely on a rehearsal
                                         https://github.com/google- research/l2p.
                                                                                                          buffer to re-train a portion of past examples. However,
                                                                                                          they suffer from substantial performance deterioration with
                                                                                                          smaller buffer size [4] and become ineffective when a re-
                                         1. Introduction                                                  hearsal buffer is not allowed – for example, in real-world
                                                                                                          scenarios where data privacy matters [54]. This suggests
                                            Contrary to ordinary supervised learning that trains on
                                                                                                          that simply buffering past data and re-train the model may
                                         independent and identically distributed (i.i.d.) data, contin-
                                                                                                          not be the best approach to retrieve past knowledge. With-
                                         ual learning tackles the problem of training a single model
                                                                                                          out accessing a rehearsal buffer, another branch of works
                                         on non-stationary data distributions where different classi-
                                                                                                          [19, 26, 45] bypass the forgetting issue by assuming known
                                         fication tasks are presented sequentially. However, since
                                                                                                          task identity at test time, so that they are able to attach
                                         the model only has access to the current data in an individ-
                                                                                                          task-independent modules to the shared model for infer-
                                         ual phase of the learning cycle, it is prone to overfit on the
                                                                                                          ence. However, knowing task identity at test time restricts
                                         currently available data and suffers from performance dete-
                                                                                                          practical usage.
                                         rioration on the previously trained data due to catastrophic
                                         forgetting [37].                                                    The limitations of prior work bring up critical questions
                                                                                                          in continual learning [13, 16]: (1) Whether the form of
                                           * Work done during internship at Google Cloud AI Research.     episodic memory can go beyond buffering past data to more
```

## PDF p. 2

```text
intelligent and succinct episodic memory system? (2) How          ing the interference between task-specific knowledge dur-
to automatically select relevant knowledge component for          ing optimization, leading to minimal catastrophic forgetting
arbitrary sample without knowing its task identity?               without the necessity of a rehearsal buffer. The instance-
    To answer the first question, we draw inspiration from        wise query mechanism removes the necessity of knowing
recent advances in prompt-based learning (prompting) [29],        the task identity or boundaries, enabling the most challeng-
a new transfer learning technique in the field of natural         ing, yet under-investigated task-agnostic continual learning.
language processing (NLP). Prompting techniques design            The selected prompts are then prepended to the input em-
model textual inputs with templated or learnable prompt to-       beddings (Figure 2), which implicitly add task-relevant in-
kens containing additional task-specific information, such        struction to pre-trained models, so that the model recalls
that the pre-trained language model can process parame-           the most relevant features to conduct corresponding tasks.
terized inputs in order to perform prompt-specific predic-        In summary, this work makes the following contributions:
tion [25, 27, 53]. Intuitively, prompt-based learning re-
                                                                   1. We propose L2P, a novel continual learning frame-
formulates learning downstream tasks from directly adapt-
                                                                      work based on prompts for continual learning, provid-
ing model weights to designing prompts that “instruct” the
                                                                      ing a new mechanism to tackle continual learning chal-
model to perform tasks conditionally. A prompt encodes
                                                                      lenges through learning a prompt pool memory space,
task-specific knowledge and has the ability to utilize pre-
                                                                      which are served as parameterized “instructions” for
trained frozen models more effectively than ordinary fine-
                                                                      pre-trained models to learn tasks sequentially. The
tuning [25, 47]. Thus, it is promising to leverage prompts
                                                                      method is applicable to handle the most challenging
to learn knowledge, and further store learned knowledge, in
                                                                      task-agnostic continual learning.
the continual learning context.
    Nevertheless, it is not clear how to apply prompting to        2. We conduct comprehensive experiments to demon-
address the aforementioned second question in continual               strate the effectiveness of L2P on multiple continual
learning directly: On one hand, if we train different prompts         learning benchmarks, including class- and domain-
for different tasks in the continual learning context, test-          incremental, and task-agnostic settings. The proposed
time task identity is still required for making predictions us-       L2P outperforms previous state-of-the-art methods
ing an appropriate task-specific prompt. On the other hand,           consistently on all benchmarks. Surprisingly, even
as a transfer learning technique, the target of prompting is to       when a rehearsal buffer is not used, L2P still achieves
make frozen pre-trained models achieve good performance               competitive results against rehearsal-based methods,
on down-streaming individually, not sequentially. There-              which is ideal in real-world scenarios when rehearsal
fore, if we instead maintain a single shared prompt for all           buffer is prohibited.
tasks, the problem of catastrophic forgetting may still exist
(see Section 5.4).                                                 3. To the best of our knowledge, we are the first to in-
                                                                      troduce the idea of prompting in the field of continual
    To this end, we propose a new continual learning method           learning. We expect that our method provides a differ-
called Learning to Prompt for Continual Learning (L2P),               ent perspective for solving frontier challenges in con-
which is orthogonal to popular rehearsal-based methods and            tinual learning.
applicable to practical continual learning scenarios with-
out known task identity or boundaries. Figure 1 gives an          2. Related Work
overview of our method in contrast to typical continual
learning methods. L2P leverages the representative features          Here we draw connections and discuss differences be-
from pre-trained models; however, instead of tuning the pa-       tween our method to related works.
rameters during the continual learning process, L2P keeps            Continual learning. There are three main categories of
the pre-trained model untouched, and instead learns a set         recent continual learning algorithms. Regularization-based
of prompts that dynamically instruct models to solve corre-       methods [1, 21, 28, 65] limit the plasticity of the model by
sponding tasks. Specifically, the prompts are structured in       limiting the learning rate on important parameters for previ-
a key-value shared memory space called the prompt pool,           ous tasks. Although these methods address catastrophic for-
and we design a query mechanism to dynamically lookup             getting to some extent without storing past examples, they
a subset of task-relevant prompts based on the instance-          cannot get satisfactory performance under challenging set-
wise input features. The prompt pool, which is optimized          tings [34] or complex datasets [49, 61].
jointly with the supervised loss, ensures that shared prompts        Rehearsal-based methods [7, 8, 17] construct a data
encode shared knowledge for knowledge transfer, and un-           buffer to save samples from older tasks to train with data
shared prompts encode task-specific knowledge that help           from the current task. Based on this simple yet effec-
maintain model plasticity. Our design explicitly decou-           tive idea, many recent methods improve upon it by involv-
ples shared and task-specific knowledge, thus largely reduc-      ing additional knowledge distillation penalties [3, 6, 49, 61],
```

## PDF p. 3

```text
or leveraging self-supervised learning techniques [4, 44].        is challenging and requires heuristics. Recent work, includ-
Albeit its simplicity in concept, rehearsal-based methods         ing prompt tuning [25] and prefix tuning [27], seek to ad-
achieve state-of-the-art performance on various benchmarks        dress this problem by applying learnable prompts in a con-
[34, 42]. However, the performance of rehearsal-based             tinuous space, achieving excellent performance on trans-
methods generally deteriorates with smaller buffer size [4],      fer learning. Prompts capture task-specific knowledge with
and rehearsal-based methods are eventually not applicable         much smaller additional parameters, than its competitors,
to scenarios where data privacy should be taken into ac-          such as Adapter [43, 58] and LoRA [18]. The central idea
count [54]. Different from directly saving data from past         of prompting is mainly designed for transfer learning. Note
knowledge to re-train the model, our method stores past           that it is non-trivial to directly apply prompting in continual
knowledge in small learnable prompt parameters to instruct        learning. Our proposed novel framework reveals its values
the model to deal with current task, and in turn accumu-          to continual learning problems.
late current knowledge to the prompts. Our method does
not need a rehearsal buffer to achieve performance close to       3. Prerequisites
rehearsal-based methods, and could be further improved to
set a new stat of the art given a small rehearsal buffer.         3.1. Continual learning protocols
    Architecture-based methods aim at having separate com-            Continual learning is usually defined as training machine
ponents for each task. The task-specific components can be        learning models on non-stationary data from sequential
identified by expanding the network [26, 31, 48, 50, 64, 68],     tasks. We define a sequence of tasks D = {D1 , · · · , DT },
or attend to task-specific sub-networks [19,35,51,59]. How-       where the t-th task Dt = {(xti , yit )}ni=1
                                                                                                           t
                                                                                                              contains tuples of
ever, most methods, which require task identity to condition                           t
                                                                  the input sample xi ∈ X and its corresponding label yit ∈
the network at test-time, are not applicable to more realis-      Y. The goal is to train a single model fθ : X → Y param-
tic class-incremental and task-agnostic settings when task        eterized by θ, such that it predicts the label y = fθ (x) ∈ Y
identity is unknown. Some recent methods either infer task        given an unseen test sample x from arbitrary tasks. Data
identity directly [60], or additionally add rehearsal buffer to   from the previous tasks may not be seen anymore when
bypass the problem [44, 63]. Nevertheless, these methods          training future tasks.
require substantial amount of additional parameters, some-            Depending on the task transition environment, contin-
times close to the size of the full model [19,59]. On the con-    ual learning can be categorized into multiple settings with
trary, L2P does not require test-time task identity and only      slightly different challenges. The common task-, class-,
adds negligible amount of additional parameters (∼ 0.1%).         and domain-incremental setting assume task data Dt arrives
Although L2P also introduces additional prompt parame-            in sequence t = {1, ..., T } in a discrete manner. Differ-
ters, it has a totally different design principle from archi-     ent from class-incremental, task-incremental learning as-
tecture based methods: L2P designs a novel prompt-based           sumes task identity is known at test time and are often re-
memory to learn high-level instructions from model inputs         garded as the simplest setting [34, 38]. Different from task-
to steer model outputs and keeps the learned architecture         and class-incremental settings where each task has different
fixed. In contrast, most architecture-based methods aim to        classes, domain-incremental learning maintains the same
separate model parameters.                                        set of classes for every task and only changes the distri-
    Lastly, recent work of CTN [45] and DualNet [44]              bution of x by task. In the more challenging task-agnostic
start to consider knowledge management via a controller           setting, task data in D changes smoothly, and the task iden-
that models task-level information in addition to a back-         tity t is unknown. Our paper tackles the more challenging
bone model. However, CTN still requires task identity at          class-incremental and domain-incremental, and further ex-
test time, while DualNet needs a rehearsal buffer to work.        plores the task-agnostic settings.
Moreover, CTN and DualNet are inspired from a different
perspective of CLS, which suggests human beings achieve           3.2. Prompt-based learning and baselines
continual learning through two systems that facilitate fast           Prompt-based learning is an emerging technique in NLP.
learning and long-term remembering respectively. Interest-        In contrast to traditional supervised fine-tuning, this type of
ingly, though we get our inspiration differently, L2P could       methods design task-specific prompt functions to instruct
be interpreted through CLS theory exactly: The prompt             pre-trained models perform corresponding tasks condition-
pool deals with fast learning, and the backbone model             ally [29]. One of recent techniques, Prompt Tuning (PT)
serves as long-term memory.                                       [25], proposes to simply condition frozen T5-like language
    Prompting for transfer learning. The high-level idea          models [47] to perform down-stream NLP tasks by learning
of prompting is to apply a function to modify the input           prompt parameters that are prepended to the input tokens
text, so that the language model gets additional information      to instruct the model prediction. Without loss of general-
about the task. However, the design of a prompting function       ity, here we introduce the definition of PT using the im-
```

## PDF p. 4

```text
                                                     Prompt pool

                                                                                                                        Input
                                             (a shared memory space)



                                                                            Prepend selected prompts          Pretrained Embedding Layer




                     Input                                     Key
                                                                                                                                ...
                                           Query function




                                                                                                   Pretrained Transformer Encoder
                                                            Matched pairs




                                                                                                          AvgPool


                                                                                             Classifier

                        A key-value pair

                                                                                            Prediction



Figure 2. Illustration of L2P at test time. We follow the same procedure at training time: First, L2P selects a subset of prompts from a
key-value paired prompt pool based on our proposed instance-wise query mechanism. Then, L2P prepends the selected prompts to the
input tokens. Finally, L2P feeds the extended tokens to the model, and optimize the prompt pool through the loss defined in equation 5.
The objective is learning to select and update prompts to instruct the prediction of the pre-trained backbone model.


age modality transformer-based sequence models [10, 56].                           training task-independent prompts is not feasible. Second,
The definition is easy to generalize to other modalities and                       even if the task-independent prompt can be known at test
sequence-based models.                                                             time, it prevents possible knowledge sharing between simi-
    Given an input of 2D image x ∈ RH×W ×C and a pre-                              lar tasks [16]. Third, while the naive way of learning a sin-
trained vision transformer (ViT) f = fr ◦ fe (excluding                            gle shared prompt for all tasks enables knowledge sharing,
the classification head), where fe is the input embedding                          it still causes severe forgetting issue (see Section 5.4). Ide-
layer, and fr represents a stack of self-attention layers [10].                    ally one would learn a model that is able to share knowledge
Images are reshaped to a sequence of flattened 2D patches                          when tasks are similar, while maintaining knowledge inde-
                2
xp ∈ RL×(S ·C) , where L is the token length, i.e., the                            pendent otherwise. Thus, we propose using a prompt pool
number of patches, S is the patch size and C is the origi-                         to store encoded knowledge, which can be flexibly grouped
nal number of channels. To simplify notation, we assume                            as an input to the model. The prompt pool is defined as
the first token in xp is the [class] token as part of the
pre-trained model [10]. The pre-trained embedding layer                              P = {P1 , P2 , · · · , PM },        M = total # of prompts, (1)
             2
fe : RL×(S ·C) → RL×D projects the patched image to                                where Pj ∈ RLp ×D is a single prompt with token length
the embedding feature xe = fe (x) ∈ RL×D , where D is                              Lp and the same embedding size D as xe . Following the
the embedding dimension. When solving multiple down-                               notations in Section 3.2, we let x and xe = fe (x) be the in-
streaming tasks, we keep the large-scale pre-trained back-                         put and its corresponding embedding feature, respectively.
bone frozen to maintain its generality following PT. The                           Note that we omit the task index t of x in our notation as
direct application of PT is to prepend learnable parame-                           our method is general enough to the task-agnostic setting.
ters Pe ∈ RLp ×D , called a prompt, to the embedding fea-                          Denoting {si }Ni=1 as a subset of N indices from [1, M ], we
ture xp = [Pe ; xe ], and feed the extended sequences to the                       can then adapt the input embedding as follows:
model function fr (xp ) for performing classification tasks.
Different tasks have independent prompts and share one                                        xp = [Ps1 ; · · · ; PsN ; xe ],         1 ≤ N ≤ M,   (2)
copy of the large model.
    Compared with ordinary fine-tuning, literature shows                           where ; represents concatenation along the token length di-
that prompt-based learning results in a sequence-based                             mension. Prompts are free to compose, so they can jointly
model having higher capacity to learn features [25,29]. De-                        encode knowledge (e.g. visual features or task information)
spite its successes in transfer learning to train individual                       for the model to process. Ideally, we want to achieve a more
prompts for each task, prompting can not be directly ap-                           fine-grained knowledge sharing scheme via prompt com-
plied to continual learning scenarios where test-time task                         binations at the instance-wise level: similar inputs tend to
identity is unknown.                                                               share more common prompts, and vice versa.

4. Learning to Prompt (L2P)                                                        4.2. Instance-wise prompt query

4.1. From prompt to prompt pool                                                       We design a key-value pair based query strategy to dy-
                                                                                   namically select suitable prompts for different inputs (see
   The motivations of introducing prompt pool are three-                           Figure 2). This key-valued memory query mechanism
fold. First, the task identity at test time is unknown so                          shares some design principles with methods in other fields,
```

## PDF p. 5

```text
such as Differentiable Neural Computer [14] and VQ-VAE                    4.3. Optimization objective for L2P
[41], which have external memory to maintain, and employ
                                                                             At every training step, after selecting N prompts follow-
them for a different purpose.
                                                                          ing the aforementioned query strategy, the adapted embed-
   We associate each prompt as value to a learnable key:
                                                                          ding feature xp is fed into the rest of the pre-trained model
{(k1 , P1 ), (k2 , P2 ), · · · , (kM , PM )}, where ki ∈ RDk .
                                                                          fr and the final classifier gφ parametrized by φ. Overall, we
And we denote the set of all keys by K = {ki }M      i=1 . Ideally,
                                                                          seek to minimize the end-to-end training loss function:
we would like to let the input instance itself decide which
prompts to choose through query-key matching. To this                                                           X
                                                                              min L(gφ (fravg (xp )), y) + λ        γ (q(x), ksi ) ,
end, we introduce a query function q : RH×W ×C → RDk                         P,K,φ
                                                                                                                Kx                   (5)
that encodes input x to the same dimension as the key.
Moreover, q should be a deterministic function with respect                                s.t., Kx is obtained with equation 3,
to different tasks and has no learnable parameters. We di-
rectly use the whole pre-trained model as a frozen feature                where fravg = AvgPool(fr (xp )[0 : N Lp , :]), i.e., the output
extractor to get the query features: q(x) = f (x)[0, :] (we               hidden vectors corresponding to the N ·Lp prompt locations
use the feature vector corresponding to [class]). Other                   are averaged before the classification head. The first term is
feature extractors like ConvNet are feasible as well.                     the softmax cross-entropy loss, the second term is a surro-
   Denote γ : RDk × RDk → R as a function to score the                    gate loss to pull selected keys closer to corresponding query
match between the query and prompt key (we find cosine                    features. λ is a scalar to weight the loss.
distance works well). Given an input x, we use q(x) to
lookup the top-N keys by simply solving the objective:                    5. Experiments
                                      N
                                      X                                      To evaluate the proposed L2P, we closely follow the set-
          Kx =       argmin                  γ (q(x), ksi ) ,       (3)   tings proposed in prior works [32,55,66], and conduct com-
                  {si }N
                       i=1 ⊆[1,M ]     i=1                                prehensive experiments. In particular, we mainly consider
                                                                          (1) the class-incremental setting, where the task identity is
where Kx represents the a subset of top-N keys selected
                                                                          unknown during inference; (2) the domain-incremental set-
specifically for x from K. Note that the design of this
                                                                          ting, where the input domain shifts over time; (3) the task-
key-value strategy decouples the query mechanism learn-
                                                                          agnostic setting, where there is no clear task boundary. We
ing and prompt learning processes, which has been exper-
                                                                          carefully compare L2P with state-of-the-art (SOTA) meth-
imentally shown to be critical (see Section 5.4). Further-
                                                                          ods of different categories under proper experiment settings.
more, querying prompts is done in an instance-wise fashion,
                                                                          Moreover, we conduct extensive ablation studies to provide
which makes the whole framework task-agnostic, meaning
                                                                          a deeper understanding of our method.
that the method works without needing clear task bound-
aries during training, nor task identity at test time.                    5.1. Comparing methods
   Optionally diversifying prompt-selection. Although
our method does not need task boundary information, in                        We compare L2P against several baselines and state-of-
real-world scenarios and experimental datasets, it is quite               the-art (SOTA) continual learning methods. Our method is
common that the task transition is discrete and so task                   based on a pre-trained ViT-B/16 [11,67], which has become
boundaries are known at train time. We find that adding                   a common asset in advanced vision communities. We care-
such a prior into our framework can help the model learn                  fully choose compared methods in the same environment
better task-specific prompts, especially when tasks have                  for fair comparison. Many recent methods claimed SOTA
high diversity. To this end, we propose a simple extension                performance in the simplest task-incremental setting, where
to add task boundary prior, which is optional for L2P.                    task identity is known at test time [19, 45, 57]. We do not
   During training of task t, we maintain a prompt fre-                   include these methods, since they are not applicable to more
quency table Ht = [h1 , h2 , · · · , hM ], where each entry               general class-incremental setting. We refer to multiple re-
represents the normalized frequency of prompt Pi being se-                cent reviews papers [9, 34] and recent work [3, 4, 46] and
lected up until task t − 1. To encourage the query mecha-                 select the most well-recognized and best-performing meth-
nism to select diverse prompts, we modify equation 3 to                   ods. For completeness, we also include naive sequential
                                                                          training approaches and representative regularization-based
                                     N
                                     X                                    methods. Moreover, we refer to the original codebases for
       Kx =       argmin                   γ (q(x), ksi ) · hsi ,   (4)   implementation and hyperparameter selection to ensure the
               {si }N
                    i=1 ⊆[1,M ]      i=1
                                                                          best possible performance.
where hsi penalizes the frequently-used prompts being se-                     Baseline methods. Upper-bound is the usual supervised
lected to encourage diversified selection. Equation 4 is only             finetuning on the i.i.d. data of all tasks, which is the usu-
applicable during training; at test time, equation 3 is used.             ally regarded as the upper bound performance a method can
```

## PDF p. 6

```text
Table 1. Results on class-incremental learning (i.e., task identity is unknown at test time). Compared methods are grouped based on
different rehearsal buffer sizes. 0 means no rehearsal is required, where most SOTA methods are not applicable anymore. Importantly, L2P
can attain competitive results without it and greatly outperform them with a small buffer size.

                                                 Split CIFAR-100                                        5-datasets
         Method            Buffer size                                        Buffer size
                                          Average Acc (↑) Forgetting (↓)                      Average Acc (↑) Forgetting (↓)
         FT-seq-frozen                       17.72±0.34        59.09±0.25                       39.49±0.12        42.62±0.20
         FT-seq                              33.61±0.85        86.87±0.20                       20.12±0.42        94.63±0.68
         EWC [21]                0           47.01±0.29        33.27±1.17          0            50.93±0.09        34.94±0.07
         LwF [28]                            60.69±0.63        27.77±2.17                       47.91±0.33        38.01±0.28
         L2P (ours)                          83.83±0.04        7.63±0.30                        81.14 ±0.93       4.64 ±0.52
         ER [8]                              67.87±0.57        33.33±1.28                       80.32±0.55        15.69±0.89
         GDumb [46]                          67.14±0.37            -                            56.99±0.06             -
         BiC [61]                            66.11±1.76        35.24±1.64                       78.74±1.41        21.15±1.00
                            10/class                                             5/class
         DER++ [3]                           61.06±0.87        39.87±0.99                       80.81±0.07        14.38±0.35
         Co2 L [4]                           72.15±1.32        28.55±1.56                       82.25±1.17        17.52±1.35
         L2P-R (ours)                        84.21±0.53        7.72±0.77                        85.56±0.95         4.22±0.03
         ER [8]                              82.53±0.17        16.46±0.25                       84.26±0.84        12.85±0.62
         GDumb [46]                          81.67±0.02            -                            70.76±0.12             -
         BiC [61]                            81.42±0.85        17.31±1.02                       85.53±2.06        10.27±1.32
                            50/class                                            10/class
         DER++ [3]                           83.94±0.34        14.55±0.73                       84.88±0.57        10.46±1.02
         Co2 L [4]                           82.49±0.89        17.48±1.80                       86.05±1.03        12.28±1.44
         L2P-R (ours)                        86.31±0.59        5.83±0.61                        88.95±0.78         4.92±0.71
         Upper-bound             -           90.85±0.12            -                -           93.93±0.18             -

Table 2. Class-incremental results on Split CIFAR-100 against          Table 3. Results on domain-incremental learning using CORe50
architecture-based methods. Diff = Upper-Bound Acc -                   dataset, in terms of test accuracy.
Method Acc (lower is better) measures how close the perfor-
mance to the upper-bound of the used backbone.                                   Method           Buffer size    Test Acc (↑)
                                                                                 EWC [21]                         74.82±0.60
    Method           Backbone        Avg. Acc (↑)   Diff (↓)                     LwF [28]              0          75.45±0.40
                                                                                 L2P (ours)                       78.33±0.06
    Upper-bound                      80.41             -
                                                                                 ER [8]                           80.10±0.56
    SupSup [60]       ResNet18       28.34±2.45      52.07
                                                                                 GDumb [46]                       74.92±0.25
    DualNet [44]                     40.14±1.64      40.27
                                                                                 BiC [61]                         79.28±0.30
                                                                                                    50/class
    Upper-bound                      90.85             -                         DER++ [3]                        79.70±0.44
                      ViT-B/16
    L2P (ours)                       83.83±0.04      7.02                        Co2 L [4]                        79.75±0.84
                                                                                 L2P-R (ours)                     81.07±0.13

achieve. FT-seq-frozen is the naive sequential fine-tuning                       Upper-bound           -          82.15±0.37
approach with the pre-trained model frozen. FT-seq instead
fine-tunes pre-trained model weights as well. EWC [21]                 recommended by their original authors. We compare the
and LwF [28] are representative regularization-based ap-               relative performance to the corresponding upper-bound per-
proaches that are widely compared.                                     formance for fairness.
    SOTA rehearsal-based methods. We select 5 advanced                    Our methods. L2P is our proposed method without
rehearsal-based methods to compare, including ER [8, 17],              rehearsal buffer. L2P-R is L2P equipped with a rehearsal
GDumb [46], BiC [61], DER++ [3] and Co2 L [4]. ER and                  buffer for a fair comparison with SOTA methods.
GDumb are simple in concept, but they have achieved very
strong performance not only in their own work, but in later            5.2. Datasets and experimental details
literature [3, 34] as well. DER++ and Co2 L are the latest                Datasets.     We use Split CIFAR-100 [22] and 5-
SOTA methods.                                                          datasets [12] for class-incremental setting, CORe50 [30]
    SOTA architeture-based methods. We select two rep-                 for domain-incremental setting, and Gaussian scheduled
resentative architecture-based methods to compare. Sup-                CIFAR-100 [52] for task-agnostic setting, to evaluate the
Sup [60] and DualNet [44] are both based on ResNet18,                  effectiveness of our method. Details of the datasets are in-
```

## PDF p. 7

```text
Table 4. Results on task-agnostic continual learning using the
Gaussian scheduled CIFAR-100 dataset, in terms of test accuracy.

          Method              Buffer size      Test Acc (↑)
          EWC [21]                             63.04±0.42
                                  0
          L2P (ours)                           88.34±0.14
          ER [8]                               82.63±0.27
          GDumb [46]                           81.67±0.02
                               50/class
          DER++ [3]                            85.24±0.71
          L2P-R (ours)                         88.92±0.39
                                                                   Figure 3. Prompt selection histograms for (left) Split CIFAR-100
          Upper-bound              -           90.85±0.12
                                                                   and (right) 5-datasets. CIFAR-100 has higher intra-task similar-
                                                                   ity compared to 5-datasets, thus largely sharing prompts between
  Table 5. Ablation studies. See text for detailed explanations.   tasks results in good performance, while 5-datasets favors more
                                                                   task-specific prompts. We only show the first 5 tasks for Split
                                         5-datasets                CIFAR-100 for better readability.
  Ablated components
                               Average Acc (↑) Forgetting (↓)
  w/o prompt pool                      51.96             26.60     5.3. Main results
  w/o key-value pair                   58.33             20.45
  w/o diversified selection            62.26             17.84         Results on class-incremental learning. Table 1 sum-
  none                                 81.14                4.64   marizes the results on these two class-incremental bench-
                                                                   marks. L2P outperforms all comparing methods consis-
                                                                   tently under different configurations, in terms of both av-
                                                                   erage accuracy and forgetting. We observe that when the
troduced in Appendix C.                                            buffer size is relatively large, L2P not only outperforms
   Evaluation metrics. For settings with task boundaries           all other methods, but also closes a significant part of the
and where each task has an associated test set, we use two         gap to the upper bound performance under the i.i.d. set-
metrics, Average accuracy (higher is better) and Forget-           ting. When the buffer size gets smaller, L2P outperforms
ting (lower is better), which are widely used in previous          others by a even larger margin. Finally, when there is
works [7, 32, 34]. For settings without task boundary or           no buffer, rehearsal-based methods are no longer capable,
where there is only a single test set available, we report the     while L2P still remains superior performance by beating
final test accuracy following the common protocol [30, 52].        regularization-based methods, and outperforms almost all
                                                                   rehearsal-based methods when buffer is small.
    Training details. For L2P, we train all models using
Adam [20] with β1 = 0.9 and β2 = 0.999, a batch size                   Table 2 shows the comparison between L2P and
of 128, and a constant learning rate of 0.03 for all set-          architecture-based methods on Split CIFAR-100. Instead
tings. Input images are resized to 224 × 224 and nor-              of absolute performance in average accuracy, we use differ-
malized to the range of [0, 1] to match the pretraining set-       ence to upper-bound (Diff) to measure the performance of
ting. As pointed out by [3], training multiple epochs for          each method given a specific architecture. We observe that
each task disentangles the effects of possible underfitting        L2P outperforms both methods with (DualNet) or without
from forgetting. Thus, we train every task for 5 epochs            (SupSup) rehearsal buffer, by a large margin.
in the class- and domain-incremental settings. However,                The outstanding performance of L2P over all competing
in the task-agnostic setting where we don’t have the con-          methods indicates that our proposed prompt pool success-
cept of a task, we follow [52] to train every batch only           fully accumulates knowledge from experiences, thus it can
once. We set M = 10, N = 5, Lp = 5 for all CIFAR-                  overall improve the learning performance while mitigating
100 based datasets and CORe50. For 5-datasets, we use              catastrophic forgetting even without a rehearsal buffer.
M = 20, N = 4, Lp = 5. Prompts only add 46, 080                        Results on domain-incremental learning. Table 3
and 92, 160 parameters to the original pre-trained model for       summarizes the results on the domain-incremental set-
these two settings, leading to a small 0.05% and 0.11% to-         ting. L2P remains the best performance compared with
tal parameter increase, respectively. We apply the optional        other methods. Interestingly, all rehearsal-based compar-
prompt selection strategy introduced in 4.2 to this dataset.       ing methods perform quite closely (except GDumb). The
We find λ in equation 5 is not sensitive and works well in a       observation of relatively modest performance gap between
large range, so we set λ = 0.5 consistently for all datasets.      baseline methods and the upper-bound result has also been
Main experimental results are averaged over 3 runs, and cor-       reported in [30], thus there is indeed a significant perfor-
responding standard deviation is reported as well.                 mance gap between our method and others.
```

## PDF p. 8

```text
                                  77.01 82.49 83.39 83.15                     70.87 78.34 79.26 79.50                   85.0




                         1




                                                                     1
                                                                                                                        82.5
                                                                                                                        80.0


                  Prompt length




                                                              Prompt length
                                  82.88 83.50 83.39 82.84                     75.30 80.65 80.68 80.83


                         5




                                                                     5




                                                                                                         Accuracy (%)
                                                                                                                        77.5
                                                                                                                        75.0
                         10       83.28 83.18 83.13 81.84                     74.82 81.14 80.84 79.81




                                                                     10
                                                                                                                        72.5
                                                                                                                        70.0
                                  83.40 82.60 81.60 79.65                     77.20 76.54 77.25 76.03                              Split CIFAR-100
                         20




                                                                     20
                                                                                                                        67.5
                                                                                                                                   5-datasets
                                   1      5      10      20                    1      2       4      8                  65.0   5   10   15    20       25   30
                                        Selection size                              Selection size                                  Prompt pool size
Figure 4. Left-Middle: Average accuracy w.r.t prompt length Lp and prompt selection size N for Split CIFAR-100 and 5-datasets,
respectively, given M = 20. Right: Average accuracy (%) w.r.t. prompt pool size M , given Lp = 5, N = 5 for Split CIFAR-100 and
Lp = 5, N = 4 for 5-datasets.

    Results on task-agnostic learning. Although task-                                        both Split CIFAR-100 and 5-datasets in Figure 3 under the
agnostic setting is usually considered more challenging                                      best-performing parameters settings, respectively. From the
[52], the topic is under-investigated. We conduct more ex-                                   plot of Split CIFAR-100 (left), the tasks largely share all
ploratory studies on task-agnostic settings. Table 4 sum-                                    prompts, meaning that our prompt selection mechanism en-
marizes the results on the challenging task-agnostic learn-                                  courages more knowledge sharing between similar tasks. In
ing setting. We do not compare with LwF, BiC and Co2 L                                       contrast, in the plot of 5-datasets (right), diverse tasks re-
since they require task boundary to save model snapshots                                     quire more task-specific prompts and share less.
and calculate distillation loss. It is beyond our scope to ex-                                   Effect of hyperparameters for L2P. Recall that there
tend them to this setting. We also use the online version of                                 are three key hyperparameters, including the size of the
EWC proposed by [5] for the task agnostic setting. Since                                     prompt pool M , length of a single prompt Lp , and the se-
all compared methods are based on pre-trained models, the                                    lection size N used as model input. Intuitively, M decides
absolute numbers are not too far away from Upper-bound.                                      the total capacity of learnable prompts. Lp decides capac-
As can been seen, rehearsal-based methods have clear ad-                                     ity of a singe prompt (which jointly encodes certain knowl-
vantages. Nevertheless, L2P still achieves the best perfor-                                  edge), and Lp × N decides the total size used to prepend
mance even when buffer size is zero, among all methods,                                      the input. From the results on both datasets (Figure 4 (left-
including ones have a rehearsal buffer. We believe that the                                  middle)), a too small Lp always negatively affects results,
smoother transition of tasks implicitly help L2P consolidate                                 while an oversized prompt may introduce knowledge un-
knowledge into prompts. Since we have better prompts, the                                    derfitting. We hypothesize that a reasonable capacity of a
benefit of a rehearsal buffer is naturally weakened.                                         single prompt is critical to encode a certain aspect of shared
                                                                                             knowledge. Increasing the prompt pool size shows posi-
5.4. Effectiveness of core designs                                                           tive effect on performance as shown in Figure 4 (right) on
    Effect of prompt related components for L2P. Table 5                                     5-datasets while not as effective on Split CIFAR-100, sug-
(row 1) removes the prompt pool design and uses a single                                     gesting a large enough pool size is needed to encode task-
prompt to train sequentially. The performance has a sig-                                     specific knowledge when tasks are diverse.
nificant drop, suggesting that a single prompt suffers se-
vere catastrophic forgetting and knowledge interference be-                                  6. Conclusion
tween tasks, while our design of prompt pool encodes task-
invariant and task-specific knowledge well. Table 5 (row                                        This paper presents a novel method to address some
2) removes the learnable key associated with prompts and                                     of the key challenges in continual learning with a method
directly uses mean of prompts as keys. As results show,                                      that can achieve strong performance without a need for
learnable keys play an important role to decouple the query                                  rehearsal and task identity. L2P introduces prompt-based
and prompt learning processes. Table 5 (row 3) removes                                       learning to continual learning and proposes a novel tech-
the diversified prompt selection (only used in 5-dataset ex-                                 nique to enable a single pre-trained model to adapt to se-
periments). Basically, removing it allows instances from                                     quential tasks via a shared prompt pool, successfully mit-
different tasks to choose prompts freely. The decrease in                                    igating the catastrophic forgetting problem. The resulting
performance suggests that, when tasks are diverse, adding                                    method significantly outperforms previous SOTA on several
this strategy indeed reduces unnecessary knowledge sharing                                   continual learning problems, including class-incremental
and thus mitigating interference between unrelated tasks.                                    and domain-incremental. We show our method is general
    To better understand the prompt selection mechanism,                                     enough to handle even more challenging task-agnostic set-
we plot the prompt selection histograms for each task in                                     tings where previous methods are incapable of.
```

## PDF p. 9

```text
Acknowledgments                                                    Uszkoreit, and Neil Houlsby. An image is worth
                                                                   16x16 words: Transformers for image recognition at
  We would like to thank Chun-Liang Li, Jeremy Martin              scale. In ICLR. OpenReview.net, 2021. 5
Kubica, Sayna Ebrahimi, Stratis Ioannidis, Nan Hua, and
Emmanouil Koukoumidis, for their valuable discussions.        [12] Sayna Ebrahimi, Franziska Meier, Roberto Calandra,
                                                                   Trevor Darrell, and Marcus Rohrbach. Adversarial
References                                                         continual learning. In ECCV, 2020. 6, 12
                                                              [13] Sebastian Farquhar and Yarin Gal. Towards robust
 [1] Rahaf Aljundi, Francesca Babiloni, Mohamed Elho-
                                                                   evaluations of continual learning. arXiv preprint
     seiny, Marcus Rohrbach, and Tinne Tuytelaars. Mem-
                                                                   arXiv:1805.09733, 2018. 1
     ory aware synapses: Learning what (not) to forget. In
     ECCV, 2018. 2                                            [14] Alex Graves, Greg Wayne, Malcolm Reynolds,
                                                                   Tim Harley, Ivo Danihelka, Agnieszka Grabska-
 [2] Yaroslav Bulatov. notmnist dataset, 2011. 12
                                                                   Barwińska, Sergio Gómez Colmenarejo, Edward
 [3] Pietro Buzzega, Matteo Boschini, Angelo Porrello,             Grefenstette, Tiago Ramalho, John Agapiou, et al. Hy-
     Davide Abati, and Simone Calderara. Dark experi-              brid computing using a neural network with dynamic
     ence for general continual learning: a strong, simple         external memory. Nature, 538(7626):471–476, 2016.
     baseline. In NeurIPS, 2020. 1, 2, 5, 6, 7                     5
 [4] Hyuntak Cha, Jaeho Lee, and Jinwoo Shin. Co2l:           [15] Sorin Grigorescu, Bogdan Trasnea, Tiberiu Cocias,
     Contrastive continual learning. In ICCV, 2021. 1, 3,          and Gigel Macesanu. A survey of deep learning
     5, 6                                                          techniques for autonomous driving. Journal of Field
 [5] Arslan Chaudhry, Puneet K Dokania, Thalaiyasingam             Robotics, 37(3):362–386, 2020. 12
     Ajanthan, and Philip HS Torr. Riemannian walk for in-    [16] Raia Hadsell, Dushyant Rao, Andrei A Rusu, and Raz-
     cremental learning: Understanding forgetting and in-          van Pascanu. Embracing change: Continual learning
     transigence. In ECCV, pages 532–547, 2018. 8                  in deep neural networks. Trends in cognitive sciences,
 [6] Arslan Chaudhry, Albert Gordo, Puneet Kumar Doka-             2020. 1, 4
     nia, Philip Torr, and David Lopez-Paz. Using hind-
                                                              [17] Tyler L Hayes, Nathan D Cahill, and Christopher
     sight to anchor past knowledge in continual learning.
                                                                   Kanan.     Memory efficient experience replay for
     arXiv preprint arXiv:2002.08165, 2(7), 2020. 2
                                                                   streaming learning. In ICRA, 2019. 2, 6
 [7] Arslan Chaudhry, Marc’Aurelio Ranzato, Marcus
                                                              [18] Edward J Hu, Yelong Shen, Phillip Wallis, Zeyuan
     Rohrbach, and Mohamed Elhoseiny.             Efficient
                                                                   Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, and
     lifelong learning with a-gem.          arXiv preprint
                                                                   Weizhu Chen. Lora: Low-rank adaptation of large
     arXiv:1812.00420, 2018. 2, 7
                                                                   language models. arXiv preprint arXiv:2106.09685,
 [8] Arslan Chaudhry, Marcus Rohrbach, Mohamed El-                 2021. 3
     hoseiny, Thalaiyasingam Ajanthan, Puneet K Doka-
                                                              [19] Zixuan Ke, Bing Liu, and Xingchang Huang. Contin-
     nia, Philip HS Torr, and Marc’Aurelio Ranzato. On
                                                                   ual learning of a mixed sequence of similar and dis-
     tiny episodic memories in continual learning. arXiv
                                                                   similar tasks. NeurIPS, 33, 2020. 1, 3, 5
     preprint arXiv:1902.10486, 2019. 1, 2, 6, 7
 [9] Matthias Delange, Rahaf Aljundi, Marc Masana,            [20] Diederik P Kingma and Jimmy Ba. Adam: A
     Sarah Parisot, Xu Jia, Ales Leonardis, Greg Slabaugh,         method for stochastic optimization. arXiv preprint
     and Tinne Tuytelaars. A continual learning survey:            arXiv:1412.6980, 2014. 7
     Defying forgetting in classification tasks. TPAMI,       [21] James Kirkpatrick, Razvan Pascanu, Neil Rabinowitz,
     2021. 5                                                       Joel Veness, Guillaume Desjardins, Andrei A Rusu,
[10] Alexey Dosovitskiy, Lucas Beyer, Alexander                    Kieran Milan, John Quan, Tiago Ramalho, Agnieszka
     Kolesnikov, Dirk Weissenborn, Xiaohua Zhai,                   Grabska-Barwinska, et al. Overcoming catastrophic
     Thomas Unterthiner, Mostafa Dehghani, Matthias                forgetting in neural networks. PNAS, 114(13):3521–
     Minderer, Georg Heigold, Sylvain Gelly, et al. An             3526, 2017. 2, 6, 7
     image is worth 16x16 words: Transformers for image       [22] Alex Krizhevsky, Geoffrey Hinton, et al. Learning
     recognition at scale. ICLR, 2021. 4                           multiple layers of features from tiny images. 2009.
[11] Alexey Dosovitskiy, Lucas Beyer, Alexander                    6, 12
     Kolesnikov, Dirk Weissenborn, Xiaohua Zhai,              [23] Dharshan Kumaran, Demis Hassabis, and James L
     Thomas Unterthiner, Mostafa Dehghani, Matthias                McClelland. What learning systems do intelligent
     Minderer, Georg Heigold, Sylvain Gelly, Jakob                 agents need? complementary learning systems theory
```

## PDF p. 10

```text
     updated. Trends in cognitive sciences, 20(7):512–534,      [37] Michael McCloskey and Neal J Cohen. Catastrophic
     2016. 1                                                         interference in connectionist networks: The sequential
[24] Yann LeCun. The mnist database of handwritten dig-              learning problem. In Psychology of learning and mo-
     its. http://yann. lecun. com/exdb/mnist/, 1998. 12              tivation, volume 24, pages 109–165. Elsevier, 1989.
                                                                     1
[25] Brian Lester, Rami Al-Rfou, and Noah Constant. The
     power of scale for parameter-efficient prompt tuning.      [38] Ninareh Mehrabi, Fred Morstatter, Nripsuta Saxena,
     arXiv preprint arXiv:2104.08691, 2021. 2, 3, 4                  Kristina Lerman, and Aram Galstyan. A survey on
                                                                     bias and fairness in machine learning. ACM Comput-
[26] Xilai Li, Yingbo Zhou, Tianfu Wu, Richard Socher,               ing Surveys (CSUR), 54(6):1–35, 2021. 3, 12
     and Caiming Xiong. Learn to grow: A continual struc-
     ture learning framework for overcoming catastrophic        [39] Sanket Vaibhav Mehta, Darshan Patil, Sarath Chandar,
     forgetting. In ICML, pages 3925–3934. PMLR, 2019.               and Emma Strubell. An empirical investigation of the
     1, 3                                                            role of pre-training in lifelong learning. ICML Work-
                                                                     shop on Theory and Foundation of Continual Learn-
[27] Xiang Lisa Li and Percy Liang. Prefix-tuning: Op-               ing, 2021. 12
     timizing continuous prompts for generation. arXiv
                                                                [40] Yuval Netzer, Tao Wang, Adam Coates, Alessandro
     preprint arXiv:2101.00190, 2021. 2, 3
                                                                     Bissacco, Bo Wu, and Andrew Y Ng. Reading digits
[28] Zhizhong Li and Derek Hoiem. Learning without for-              in natural images with unsupervised feature learning.
     getting. TPAMI, 40(12):2935–2947, 2017. 2, 6                    In NIPS, 2011. 12
[29] Pengfei Liu, Weizhe Yuan, Jinlan Fu, Zhengbao Jiang,       [41] Aaron van den Oord, Oriol Vinyals, and Koray
     Hiroaki Hayashi, and Graham Neubig. Pre-train,                  Kavukcuoglu. Neural discrete representation learning.
     prompt, and predict: A systematic survey of prompt-             arXiv preprint arXiv:1711.00937, 2017. 5
     ing methods in natural language processing. arXiv
                                                                [42] German I Parisi, Ronald Kemker, Jose L Part, Christo-
     preprint arXiv:2107.13586, 2021. 2, 3, 4
                                                                     pher Kanan, and Stefan Wermter. Continual lifelong
[30] Vincenzo Lomonaco and Davide Maltoni. Core50:                   learning with neural networks: A review. Neural Net-
     a new dataset and benchmark for continuous object               works, 113:54–71, 2019. 3
     recognition. In Conference on Robot Learning, 2017.        [43] Jonas Pfeiffer, Aishwarya Kamath, Andreas Rücklé,
     6, 7, 12                                                        Kyunghyun Cho, and Iryna Gurevych. Adapterfusion:
[31] Noel Loo, Siddharth Swaroop, and Richard E Turner.              Non-destructive task composition for transfer learn-
     Generalized variational continual learning. arXiv               ing. arXiv preprint arXiv:2005.00247, 2020. 3
     preprint arXiv:2011.12328, 2020. 3                         [44] Quang Pham, Chenghao Liu, and Steven Hoi. Dual-
[32] David Lopez-Paz and Marc’Aurelio Ranzato. Gradi-                net: Continual learning, fast and slow. NeurIPS, 2021.
     ent episodic memory for continual learning. NeurIPS,            3, 6
     2017. 5, 7                                                 [45] Quang Pham, Chenghao Liu, Doyen Sahoo, et al.
[33] Aleksander Madry, Aleksandar Makelov, Ludwig                    Contextual transformation networks for online contin-
     Schmidt, Dimitris Tsipras, and Adrian Vladu. To-                ual learning. In ICLR, 2020. 1, 3, 5
     wards deep learning models resistant to adversarial at-    [46] Ameya Prabhu, Philip HS Torr, and Puneet K Doka-
     tacks. arXiv preprint arXiv:1706.06083, 2017. 12                nia. Gdumb: A simple approach that questions our
[34] Zheda Mai, Ruiwen Li, Jihwan Jeong, David Quispe,               progress in continual learning. In ECCV, 2020. 5, 6, 7
     Hyunwoo Kim, and Scott Sanner. Online continual            [47] Colin Raffel, Noam Shazeer, Adam Roberts, Kather-
     learning in image classification: An empirical survey.          ine Lee, Sharan Narang, Michael Matena, Yanqi Zhou,
     arXiv preprint arXiv:2101.10423, 2021. 1, 2, 3, 5, 6,           Wei Li, and Peter J Liu. Exploring the limits of trans-
     7, 12                                                           fer learning with a unified text-to-text transformer.
[35] Arun Mallya and Svetlana Lazebnik. Packnet: Adding              JMLR, 21:1–67, 2020. 2, 3
     multiple tasks to a single network by iterative pruning.   [48] Dushyant Rao, Francesco Visin, Andrei Rusu, Raz-
     In CVPR, 2018. 3                                                van Pascanu, Yee Whye Teh, and Raia Hadsell. Con-
[36] James L McClelland, Bruce L McNaughton, and Ran-                tinual unsupervised representation learning. NeurIPS,
     dall C O’Reilly. Why there are complementary learn-             32, 2019. 3
     ing systems in the hippocampus and neocortex: in-          [49] Sylvestre-Alvise Rebuffi, Alexander Kolesnikov,
     sights from the successes and failures of connectionist         Georg Sperl, and Christoph H Lampert. icarl: In-
     models of learning and memory. Psychological re-                cremental classifier and representation learning. In
     view, 102(3):419, 1995. 1                                       CVPR, pages 2001–2010, 2017. 2
```

## PDF p. 11

```text
[50] Andrei A Rusu, Neil C Rabinowitz, Guillaume                     ing machine learning algorithms.      arXiv preprint
     Desjardins, Hubert Soyer, James Kirkpatrick, Ko-                arXiv:1708.07747, 2017. 12
     ray Kavukcuoglu, Razvan Pascanu, and Raia Had-             [63] Shipeng Yan, Jiangwei Xie, and Xuming He. Der:
     sell. Progressive neural networks. arXiv preprint               Dynamically expandable representation for class in-
     arXiv:1606.04671, 2016. 3                                       cremental learning. In CVPR, pages 3014–3023, 2021.
[51] Joan Serra, Didac Suris, Marius Miron, and Alexan-              3
     dros Karatzoglou. Overcoming catastrophic forgetting       [64] Jaehong Yoon, Eunho Yang, Jeongtae Lee, and
     with hard attention to the task. In ICML, pages 4548–           Sung Ju Hwang.          Lifelong learning with dy-
     4557. PMLR, 2018. 3                                             namically expandable networks.       arXiv preprint
[52] Murray Shanahan, Christos Kaplanis, and Jovana                  arXiv:1708.01547, 2017. 3
     Mitrović. Encoders and ensembles for task-free con-       [65] Friedemann Zenke, Ben Poole, and Surya Ganguli.
     tinual learning. arXiv preprint arXiv:2105.13327,               Continual learning through synaptic intelligence. In
     2021. 6, 7, 8, 12                                               ICML, 2017. 2
[53] Taylor Shin, Yasaman Razeghi, Robert L Logan IV,           [66] Chen Zeno, Itay Golan, Elad Hoffer, and Daniel
     Eric Wallace, and Sameer Singh.      Autoprompt:                Soudry. Task agnostic continual learning using online
     Eliciting knowledge from language models with                   variational bayes. arXiv preprint arXiv:1803.10123,
     automatically generated prompts. arXiv preprint                 2018. 5
     arXiv:2010.15980, 2020. 2                                  [67] Zizhao Zhang, Han Zhang, Long Zhao, Ting Chen, ,
[54] Reza Shokri and Vitaly Shmatikov.          Privacy-             Sercan Ö. Arık, and Tomas Pfister. Nested hierarchi-
     preserving deep learning. In Proc SIGSAC conference             cal transformer: Towards accurate, data-efficient and
     on computer and communications security, 2015. 1, 3             interpretable visual understanding. In AAAI, 2022. 5
[55] Gido M Van de Ven and Andreas S Tolias. Three              [68] Tingting Zhao, Zifeng Wang, Aria Masoomi, and Jen-
     scenarios for continual learning. arXiv preprint                nifer Dy. Deep bayesian unsupervised lifelong learn-
     arXiv:1904.07734, 2019. 5                                       ing. Neural Networks, 2022. 3
[56] Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob
     Uszkoreit, Llion Jones, Aidan N Gomez, Lukasz
     Kaiser, and Illia Polosukhin. Attention is all you need.
     NeurIPS, 2017. 4
[57] Tom Veniat, Ludovic Denoyer, and Marc’Aurelio
     Ranzato. Efficient continual learning with modu-
     lar networks and task-driven priors. arXiv preprint
     arXiv:2012.12631, 2020. 5
[58] Ruize Wang, Duyu Tang, Nan Duan, Zhongyu Wei,
     Xuanjing Huang, Guihong Cao, Daxin Jiang, Ming
     Zhou, et al. K-adapter: Infusing knowledge into
     pre-trained models with adapters. arXiv preprint
     arXiv:2002.01808, 2020. 3
[59] Zifeng Wang, Tong Jian, Kaushik Chowdhury, Yanzhi
     Wang, Jennifer Dy, and Stratis Ioannidis. Learn-
     prune-share for lifelong learning. In ICDM, 2020. 3
[60] Mitchell Wortsman, Vivek Ramanujan, Rosanne Liu,
     Aniruddha Kembhavi, Mohammad Rastegari, Jason
     Yosinski, and Ali Farhadi. Supermasks in superpo-
     sition. NeurIPS, 33:15173–15184, 2020. 3, 6
[61] Yue Wu, Yinpeng Chen, Lijuan Wang, Yuancheng Ye,
     Zicheng Liu, Yandong Guo, and Yun Fu. Large scale
     incremental learning. In CVPR, pages 374–382, 2019.
     2, 6
[62] Han Xiao, Kashif Rasul, and Roland Vollgraf.
     Fashion-mnist: a novel image dataset for benchmark-
```

## PDF p. 12

```text
A. Potential negative societal impact
   L2P is a strong continual learning method and has great potential to be applied in various fields. However, there are some
ways it could be misused. Our method takes a well-pretrained model as a backbone, thus any bias and fairness issues [38] in
the original model may be carried over during the continual learning process. We encourage any users to thoroughly check
the pretrained model to mitigate any bias and fairness issues. Moreover, the method could be deployed in safety-critical
applications, such as autonomous driving systems [15], which may present potential security issues in terms of adversarial
attacks [33]. We would recommend testing the robustness of our method in future work and design corresponding defense
techniques to deal with potential security concerns.

B. Limitations
    Although our method is demonstrated on vision models, it does not make any assumption of modalities. We leave explo-
ration on other modalities as future work. Additionally, L2P assumes there are pre-trained sequence-based models. While
they have become common assets and future directions in advanced communities, how to generalize our framework to other
vision architectures (e.g. ConvNet) could be an appealing research direction.
    How to achieve continual learning that can satisfy the real-world requirements is an important direction that remains
challenging. For example, the task-agnostic setting is known as the most challenging setting and is very close to real-
world scenarios. Although our method takes a step further towards this goal, however, the current commonly used Gaussian
scheduled CIFAR-100 is synthetic and still far from realistic. Thus, we think it also requires more complex benchmarks to
evaluate the ability of task-agnostic continual learning methods and push forward the advances of this real-world challenge.

C. Dataset details and licensing information
    Split CIFAR-100 (class-incremental). This dataset splits the original CIFAR-100 [22] into 10 tasks, 10 disjoint classes
per task. Since the tasks are from a single original dataset, they share some similarities and some classes could be from the
same superclass. Although CIFAR-100 is a simple image classification dataset, it remains quite challenging for continual
learning studies, especially in the class-incremental setting [34].
    5-datasets (class-incremental). We also use a challenging dataset proposed in [12]. This dataset consists of five image
classification datasets: CIFAR-10, MNIST [24], Fashion-MNIST [62], SVHN [40], and notMNIST [2]. Although each
dataset alone is not hard, the sequential training of them is fairly challenging even with ImageNet pre-trained models, since
models are susceptible to forgetting when the tasks are diverse [39].
    CORe50 (domain-incremental). This is a widely used dataset specifically designed for continual object recognition [30].
It is a collection of 50 objects collected in 11 distinct domains, where 8 of them (120,000 samples) are used for training, and
the rest are considered as a single test set (45,000). Methods are trained on each domain sequentially.
    Gaussian scheduled CIFAR-100 (task-agnostic). The distribution of data shifts gradually throughout the learning pro-
cess [52], the probability that a class is present in a batch follows a Gaussian distribution centered with intervals. There
is no explicit task boundaries between batches, thus requiring methods to be able to implicitly adapt to non-stationary data
distribution without utilizing any task-specific information during both training and inference.

  • CIFAR-10 and CIFAR-100 [22], Fashion-MNIST [62] are licensed under the MIT license.
  • MNIST [24] is licensed under the Creative Commons Attribution-Share Alike 3.0 license.

  • CORe50 [30] is under the Creative Commons Attribution 4.0 International license.
  • The licensing information is not available for SVHN [40], notMNIST [2].


D. Algorithm details
   To better illustrate our proposed method, we present a whole picture of the training procedure in Algorithm 1. Note that
for prediction, we simply replace loss calculation to label prediction. Optionally, we can replace the top-N keys lookup by
equation 4, when task boundary prior is known.
```

## PDF p. 13

```text
Algorithm 1: Learning to Prompt for Continual Learning (L2P)
 Input: Pre-trained input embedding layer fe , pre-trained self-attention layers fr , final classification layer gφ , number
  of tasks T , training set {(xti , yit )}ni=1
                                            t
                                               }Tt=1 , prompt pool P = {Pj }M                              M
                                                                            j=1 , prompt keys K = {Kj }j=1 , number of
  training epochs of the t-th task Et , learning rate η, balancing parameter λ
 Initialize: gφ , P, K
 for t = 1, · · · , T do
     for e = 1, · · · , Et do
         Draw a mini-batch B = {(xti , yit )}li=1
         Initialize the sets of chosen keys and prompts for current batch: KB = {}, PB = {}.
         for (x, y) in B do
              Calculate query feature q(x)
                                                                        PN
              Lookup top-N keys by solving Kx = argmin                     i=1 γ (q(x), ksi ) (equation 3)
                                                     {si }N
                                                          i=1 ⊆[1,M ]
           Select top-N prompts associated with the keys in Px
           Calculate the input embedding sequence xe = fe (x)
           Prepending xe with corresponding top-N prompts by xpP    = [Ps1 ; · · · ; PsN ; xe ] (equation 2)
           Calculate per sample loss Lx = L(gφ (fravg (xp )), y) + λ Kx γ (q(x), ksi ) (equation 5)
           Update sets of chosen keys and prompts: KB = KB ∪ Kx , PB = PB ∪ Px
       end
       Calculate per batch loss LB by accumulating Lx
       for (K, P ) in zip(KB , PB ) do
           Update K by K ← K − η∇K LB
           Update P by P ← P − η∇P LB
       end
       Update φ by φ ← φ − η∇φ LB
    end
 end
```
