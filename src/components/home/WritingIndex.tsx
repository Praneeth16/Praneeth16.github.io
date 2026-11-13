import { useEffect, useState } from 'react';
import {createAgent,registerTools} from '@ui-sdk/react/agent';
import { SegmentedControl, SegmentedControlItem } from '@ui-sdk/react/segmented-control';
type Essay={number:string;type:string;title:string;summary:string;href:string;date:string;tag:string};
export default function WritingIndex({essays}:{essays:Essay[]}) {
  useEffect(()=>registerTools(createAgent(),{allow:()=>true}),[]);
  const [view,setView]=useState<string|null>('all');
  const shown=essays.filter(e=>view==='all'||(view==='stories'?['Visual story','Interactive essay'].includes(e.type):['Benchmark','Interactive study'].includes(e.type)));
  return <>
    <div className="hs-filter-row"><SegmentedControl aria-label="Filter writing" value={view} onValueChange={setView} className="hs-filters"><SegmentedControlItem value="all">All writing</SegmentedControlItem><SegmentedControlItem value="stories">Visual essays</SegmentedControlItem><SegmentedControlItem value="studies">Experiments</SegmentedControlItem></SegmentedControl><span aria-live="polite" className="hs-count">{shown.length} pieces</span></div>
    <div className="hs-essays">{shown.map(post=><a key={post.href} className="hs-essay" href={post.href}><span className="hs-essay-num">{post.number}</span><div className="hs-essay-main"><span className="hs-essay-type">{post.type}</span><h3>{post.title}</h3><p>{post.summary}</p></div><div className="hs-essay-date"><time>{post.date}</time><span>{post.tag}</span></div><span className="hs-essay-arrow" aria-hidden="true">↗</span></a>)}</div>
  </>;
}
