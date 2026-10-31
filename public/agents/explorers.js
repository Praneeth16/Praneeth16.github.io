import { platformData } from './platform-data.js';
const byId = id => document.getElementById(id);
const put = (id,value) => { const node=byId(id);if(node)node.textContent=value; };
const link = (id,url) => {const node=byId(id);if(node)node.href=url;};
function select(selector,button){document.querySelectorAll(selector).forEach(node=>node.setAttribute('aria-pressed',String(node===button)));}
function bind(attribute,key,render){
 const selector=`[${attribute}]`;
 document.querySelectorAll(selector).forEach(button=>button.addEventListener('click',()=>{
  const item=key==='layers'?platformData.layers.find(row=>row.id===button.dataset.layer):platformData[key][Number(button.getAttribute(attribute))];
  if(!item)return;select(selector,button);render(item);
 }));
}
bind('data-layer','layers',item=>{put('layer-products',item.products);put('layer-name',item.name);put('layer-body',item.body);put('layer-artifact',item.artifact);link('layer-link',item.href);});
bind('data-context','context',item=>{put('context-product',item.product);put('context-title',item.title);put('context-body',item.body);put('context-sample',item.sample);link('context-link',item.href);});
bind('data-runtime','runtime',item=>{put('runtime-service',item.service);put('runtime-title',item.title);put('runtime-body',item.body);put('runtime-artifact',item.artifact);});
bind('data-analysis','analysis',item=>{put('analysis-title',item.title);put('analysis-body',item.body);put('analysis-code',item.code);put('analysis-artifact',item.artifact);});
bind('data-recipe','recipes',item=>{['title','body','model','compute','framework','output'].forEach(field=>put(`recipe-${field}`,item[field]));link('recipe-link',item.href);});
bind('data-serving','serving',item=>{['title','body','code','artifact'].forEach(field=>put(`serving-${field}`,item[field]));});
const article=byId('agent-article');const progress=byId('reading-progress');
function updateProgress(){if(!article||!progress)return;const range=article.offsetHeight-window.innerHeight;const fraction=(window.scrollY-article.offsetTop)/Math.max(range,1);progress.style.width=`${Math.max(0,Math.min(100,fraction*100))}%`;}
window.addEventListener('scroll',updateProgress,{passive:true});window.addEventListener('resize',updateProgress);updateProgress();
