import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  allKnowledgeCards, sourceCategories,
  type ClaimCard, type ConfusionCard, type DatasetCard, type EvidenceCard, type FormulaCard, type KnowledgeCard,
  type MethodCard, type PhaseCard, type SourceCategory, type SymbolCard,
} from '../data/knowledge';
import { evidence, evidenceById, termById, terms } from '../data/registry';

export type HubRequest = { termId?: string; evidenceId?: string; cardId?: string };
type RefKind = KnowledgeCard['kind'] | 'term' | 'paper source';
type RefField = { label: string; value: string };
type RefEntry = { id:string; kind:RefKind; title:string; summary:string; category:string; fields:RefField[]; scenes:string[]; related:string[]; evidenceIds:string[]; boundary?:string; keywords:string };

const kindLabels:Record<RefKind,string>={symbol:'符号',formula:'公式',dataset:'数据集',method:'方法',phase:'训练阶段',confusion:'常见误区',evidence:'论文证据',claim:'主张审计',term:'术语', 'paper source':'证据登记'};
const termAliases:Record<string,string>={
  theta_s:'symbol:theta_s', theta_o:'symbol:theta_o', theta_n:'symbol:theta_n', x_new:'symbol:x_new', y_old:'symbol:y_old', y_new:'symbol:y_new',
  temperature:'symbol:temperature', lambda_old:'symbol:lambda_old', shared_parameters:'symbol:theta_s', warm_up:'phase:warmup',
  joint_optimize:'phase:joint', joint_training:'method:joint_training',
};
const skippedDuplicateTerms=new Set(['shared_parameters','temperature','lambda_old','warm_up','joint_optimize','joint_training']);

function categoryForRegistry(value:string):string {
  const map:Record<string,string>={PAPER_FACT:'Paper fact',PAPER_RESULT:'Measured result',AUTHOR_INTERPRETATION:'Author interpretation',FUTURE_WORK:'Future work',IMPLEMENTATION_MAPPING:'Implementation mapping',GENERAL_BACKGROUND:'General Background',TEACHING_TOY:'Teaching Toy'};
  return map[value]||value.replace(/_/g,' ').toLowerCase();
}

function entryFromKnowledge(card:KnowledgeCard):RefEntry {
  const common={id:card.id,kind:card.kind,title:card.title,summary:card.summary,category:card.category,scenes:card.scenes,related:card.related||[],evidenceIds:card.evidence||[],boundary:card.boundary,keywords:`${card.title} ${card.summary} ${card.id}`};
  let fields:RefField[]=[];
  if(card.kind==='symbol') {const item=card as SymbolCard;fields=[['Symbol',item.symbol],['Meaning',item.summary],['Source category',item.category],['Runtime type',item.runtimeType],['Typical shape',item.typicalShape],['Created when',item.createdWhen],['Used when',item.usedWhen],['Trainable?',item.trainable],['Gradient sources',item.gradientSources],['Optimizer membership',item.optimizerMembership],['Common confusion',item.commonConfusion]].map(([label,value])=>({label,value}));}
  if(card.kind==='formula') {const item=card as FormulaCard;fields=[{label:'Expression',value:item.expression},{label:'Variables',value:item.variables.join(' · ')},{label:'Meaning',value:item.meaning},{label:'Code mapping',value:item.codeMapping}];}
  if(card.kind==='dataset') {const item=card as DatasetCard;fields=[{label:'Task type',value:item.taskType},{label:'Input type',value:item.inputType},{label:'Classes / labels',value:item.classes},{label:'Role in paper',value:item.paperRole},{label:'Paper-described relation',value:item.paperRelation},{label:'Why it matters',value:item.whyItMatters},{label:'Related experiments',value:item.experiments.join(' · ')}];}
  if(card.kind==='method') {const item=card as MethodCard;fields=[{label:'Old data required?',value:item.oldDataRequired},{label:'Old labels required?',value:item.oldLabelsRequired},{label:'Old model required?',value:item.oldModelRequired},{label:'Shared parameters trainable?',value:item.sharedTrainable},{label:'New head trainable?',value:item.newHeadTrainable},{label:'Old-response constraint?',value:item.oldResponseConstraint}];}
  if(card.kind==='phase') {const item=card as PhaseCard;fields=[{label:'Shared θₛ',value:item.thetaS},{label:'Old head θₒ',value:item.thetaO},{label:'New head θₙ',value:item.thetaN},{label:'Main action',value:item.mainAction}];}
  if(card.kind==='confusion') {const item=card as ConfusionCard;fields=[{label:'Question',value:item.question},{label:'Answer',value:item.answer}];}
  if(card.kind==='evidence') {const item=card as EvidenceCard;fields=[{label:'What it measures',value:item.measures},{label:'What it supports',value:item.supports},{label:'What it does not establish',value:item.doesNotEstablish},{label:'Paper location',value:item.location}];}
  if(card.kind==='claim') {const item=card as ClaimCard;fields=[{label:'Judgment',value:item.verdict},{label:'Supporting evidence',value:item.supportingEvidence.join(' · ')}];}
  const related=card.kind==='claim'?[...(card as ClaimCard).supportingEvidence,...(card.related||[])]:common.related;
  return {...common,fields,related,evidenceIds:[...new Set([...(card.evidence||[]),...(card.kind==='claim'?(card as ClaimCard).supportingEvidence:[])])],keywords:`${common.keywords} ${fields.map((field)=>field.value).join(' ')}`};
}

const knowledgeEntries=allKnowledgeCards.map(entryFromKnowledge);
const termEntries=terms.filter((term)=>!skippedDuplicateTerms.has(term.id)).map((term)=>({
  id:`term:${term.id}`,kind:'term' as const,title:term.label,summary:term.definition,category:categoryForRegistry(term.source_category),
  fields:[{label:'Full name',value:term.full_name},{label:'Definition',value:term.definition},{label:'Paper role',value:term.paper_role},{label:'Common confusion',value:term.confusion},{label:'Prerequisites',value:term.prerequisites.map((id)=>termById.get(id)?.label||id).join(' · ')||'None'}],
  scenes:[],related:term.prerequisites.map((id)=>`term:${id}`),evidenceIds:term.source_ref?[term.source_ref]:[],keywords:`${term.id} ${term.label} ${term.full_name} ${term.definition} ${term.paper_role} ${term.confusion}`,
}));
const paperSourceEntries=evidence.map((item)=>({
  id:`source:${item.id}`,kind:'paper source' as const,title:item.id,summary:item.text,category:categoryForRegistry(item.type),
  fields:[{label:'Evidence registry group',value:item.group},{label:'Evidence type',value:categoryForRegistry(item.type)},{label:'What the registry records',value:item.text},{label:'Paper location',value:item.location||'No paper location recorded'}],
  scenes:knowledgeEntries.filter((entry)=>entry.evidenceIds.includes(item.id)).flatMap((entry)=>entry.scenes).filter((value,index,array)=>array.indexOf(value)===index),
  related:knowledgeEntries.filter((entry)=>entry.evidenceIds.includes(item.id)).map((entry)=>entry.id),evidenceIds:[],keywords:`${item.id} ${item.group} ${item.type} ${item.text} ${item.location}`,
}));
const allEntries:RefEntry[]=[...knowledgeEntries,...termEntries,...paperSourceEntries];
const entriesById=new Map(allEntries.map((entry)=>[entry.id,entry]));
const kindOrder:RefKind[]=['symbol','formula','dataset','method','phase','confusion','evidence','claim','term','paper source'];
const categoryLabels=[...sourceCategories,'Paper fact','Measured result','Future work','Author interpretation','Implementation mapping','Teaching Toy','General Background'];

function resolveRequest(request:HubRequest):string {
  const direct=request.cardId||request.evidenceId||request.termId||'symbol:theta_s';
  if(entriesById.has(direct)) return direct;
  if(request.termId && termAliases[request.termId] && entriesById.has(termAliases[request.termId])) return termAliases[request.termId];
  if(request.termId && entriesById.has(`term:${request.termId}`)) return `term:${request.termId}`;
  if(request.evidenceId && evidenceById.has(request.evidenceId)) return `source:${request.evidenceId}`;
  return 'symbol:theta_s';
}

function resolveRelatedId(id:string) {
  if(entriesById.has(id)) return id;
  if(entriesById.has(`source:${id}`)) return `source:${id}`;
  if(entriesById.has(`term:${id}`)) return `term:${id}`;
  if(termAliases[id]) return termAliases[id];
  const symbol=allKnowledgeCards.find((card)=>card.kind==='symbol'&&(card as SymbolCard).symbol===id);
  if(symbol) return symbol.id;
  return id;
}

export function ReferenceHub({request,onClose}:{request:HubRequest|null;onClose:()=>void}) {
  const [selectedId,setSelectedId]=useState('symbol:theta_s');
  const [query,setQuery]=useState('');
  const [kindFilter,setKindFilter]=useState<RefKind|'all'>('all');
  const [categoryFilter,setCategoryFilter]=useState('all');
  const panelRef=useRef<HTMLElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const previousFocus=useRef<HTMLElement|null>(null);

  useEffect(()=>{
    if(!request) return;
    previousFocus.current=document.activeElement as HTMLElement|null;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    setSelectedId(resolveRequest(request));setQuery('');setKindFilter('all');setCategoryFilter('all');
    requestAnimationFrame(()=>closeRef.current?.focus());
    return ()=>{document.body.style.overflow=previousOverflow;previousFocus.current?.focus();};
  },[request]);

  const filteredEntries=useMemo(()=>allEntries.filter((entry)=>{
    const matchesKind=kindFilter==='all'||entry.kind===kindFilter;
    const matchesCategory=categoryFilter==='all'||entry.category===categoryFilter;
    const needle=query.trim().toLowerCase();
    return matchesKind&&matchesCategory&&(!needle||`${entry.id} ${entry.kind} ${entry.category} ${entry.keywords} ${entry.fields.map((field)=>`${field.label} ${field.value}`).join(' ')}`.toLowerCase().includes(needle));
  }).sort((a,b)=>{
    const needle=query.trim().toLowerCase();
    if(needle){const rank=(entry:RefEntry)=>{const title=entry.title.toLowerCase();const id=entry.id.toLowerCase();return title===needle||id===needle?0:title.startsWith(needle)||id.startsWith(needle)?1:title.includes(needle)?2:3;};const ranked=rank(a)-rank(b);if(ranked)return ranked;}
    return kindOrder.indexOf(a.kind)-kindOrder.indexOf(b.kind)||a.title.localeCompare(b.title);
  }),[categoryFilter,kindFilter,query]);
  const selected=entriesById.get(selectedId);

  useEffect(()=>{
    if(filteredEntries.length&&!filteredEntries.some((entry)=>entry.id===selectedId)) setSelectedId(filteredEntries[0].id);
  },[filteredEntries,selectedId]);

  if(!request) return null;
  const onDialogKeyDown=(event:React.KeyboardEvent<HTMLElement>)=>{
    if(event.key==='Escape'){event.stopPropagation();onClose();return;}
    if(event.key!=='Tab'||!panelRef.current)return;
    const focusable=[...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')];
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  const selectEntry=(id:string)=>{const resolved=resolveRelatedId(id);if(entriesById.has(resolved)){setSelectedId(resolved);return;}if(/^(00|[A-J])$/.test(id)){window.dispatchEvent(new CustomEvent('lwf:open-scene',{detail:id}));onClose();}};

  return <div className="v2-drawer-backdrop v2-reference-backdrop" onPointerDown={(event)=>{if(event.target===event.currentTarget)onClose();}}>
    <aside ref={panelRef} className="v2-reference-drawer v2-reference-hub" role="dialog" aria-modal="true" aria-labelledby="v2-reference-title" onKeyDown={onDialogKeyDown}>
      <header className="v2-drawer-header"><div><span className="v2-eyebrow">GLOBAL KNOWLEDGE INDEX</span><h2 id="v2-reference-title">Reference Hub</h2><p>符号 · 公式 · 数据集 · 方法 · 阶段 · 误区 · 证据</p></div><button ref={closeRef} className="v2-icon-button" type="button" onClick={onClose} aria-label="关闭 Reference Hub">×</button></header>
      <label className="v2-reference-search"><span className="v2-sr-only">搜索 Reference Hub</span><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="搜索 θ_s、Y_o、temperature、λ_o、MNIST、warm-up、Figure 7、Joint Training、backward、domain gap…" /></label>
      <div className="v2-hub-filter-row"><label>内容类型<select value={kindFilter} onChange={(event)=>setKindFilter(event.target.value as RefKind|'all')}><option value="all">全部类型 · {allEntries.length}</option>{kindOrder.map((kind)=><option key={kind} value={kind}>{kindLabels[kind]}</option>)}</select></label><label>来源分类<select value={categoryFilter} onChange={(event)=>setCategoryFilter(event.target.value)}><option value="all">全部来源类别</option>{[...new Set([...categoryLabels,...allEntries.map((entry)=>entry.category)])].map((category)=><option key={category} value={category}>{category}</option>)}</select></label><span>{filteredEntries.length} 条结果</span></div>
      <div className="v2-reference-columns v2-hub-columns">
        <nav className="v2-reference-list v2-hub-results" aria-label="分组参考条目">{groupedEntries(filteredEntries).map(([kind,entries])=><section key={kind} className="v2-hub-result-group"><h3>{kindLabels[kind]} · {entries.length}</h3>{entries.map((entry)=><button key={entry.id} type="button" className={entry.id===selectedId?'is-selected':''} onClick={()=>setSelectedId(entry.id)}><strong>{entry.title}</strong><small>{entry.id} · {entry.category}</small></button>)}</section>)}{filteredEntries.length===0?<p className="v2-empty-state">没有匹配条目。</p>:null}</nav>
        {selected?<EntryDetails entry={selected} onSelect={selectEntry}/>:<p className="v2-empty-state">选择左侧条目查看定义与交叉引用。</p>}
      </div>
      <footer className="v2-drawer-footer">Knowledge cards 来自 `src/data/knowledge.ts`；论文证据编号和原有术语来自项目登记文件。</footer>
    </aside>
  </div>;
}

function groupedEntries(entries:RefEntry[]):[RefKind,RefEntry[]][] {const groups=new Map<RefKind,RefEntry[]>();for(const entry of entries){const current=groups.get(entry.kind)||[];current.push(entry);groups.set(entry.kind,current);}return [...groups.entries()];}
function EntryDetails({entry,onSelect}:{entry:RefEntry;onSelect:(id:string)=>void}) {
  const relatedEntries=entry.related.map(resolveRelatedId).filter((id)=>entriesById.has(id)).filter((id,index,array)=>array.indexOf(id)===index);
  const sources=entry.evidenceIds.map(resolveRelatedId).filter((id)=>entriesById.has(id)).filter((id,index,array)=>array.indexOf(id)===index);
  return <article className="v2-reference-detail v2-hub-detail"><div className="v2-hub-entry-badges"><span className="v2-reference-category">{entry.category}</span><span className="v2-hub-kind">{kindLabels[entry.kind]}</span></div><h3>{entry.title}</h3><code className="v2-hub-id">{entry.id}</code><p className="v2-reference-fullname">{entry.summary}</p><dl>{entry.fields.map((field)=><div key={field.label}><dt>{field.label}</dt><dd>{field.value||'—'}</dd></div>)}{entry.scenes.length?<div><dt>Used in scenes</dt><dd>{entry.scenes.map((scene)=><button type="button" className="v2-hub-scene-link" key={scene} onClick={()=>onSelect(scene)}>Scene {scene}</button>)}</dd></div>:null}{entry.boundary?<div><dt>Boundary</dt><dd>{entry.boundary}</dd></div>:null}</dl>
    {relatedEntries.length||sources.length?<section className="v2-hub-related"><strong>Cross-reference</strong>{relatedEntries.length?<div><span>Related knowledge</span>{relatedEntries.map((id)=><button key={id} type="button" onClick={()=>onSelect(id)}>{entriesById.get(id)?.title||id} ↗</button>)}</div>:null}{sources.length?<div><span>Evidence records</span>{sources.map((id)=><button key={id} type="button" onClick={()=>onSelect(id)}>{entriesById.get(id)?.title||id} ↗</button>)}</div>:null}</section>:null}
    <a className="v2-evidence-link" href="https://arxiv.org/abs/1606.09282" target="_blank" rel="noreferrer">打开 LwF 原论文 ↗</a>
  </article>;
}
