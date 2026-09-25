import metadata from '../generated/article-meta.json';
import systemOne from '../generated/system-one/article-meta.json';
import rss from '@astrojs/rss';
export async function GET(context){return rss({title:'Praneeth Paikray',description:'Experiments and explanations on building AI systems.',site:context.site,items:[{title:'WTF Is a System One Model?',description:systemOne.subtitle,pubDate:new Date('2026-09-26T00:00:00Z'),link:'/blog/wtf-is-a-system-one-model/',categories:['Jev','Routing','Evaluation']},{title:'Adapting Jev to Your Domain with GEPA',description:metadata.subtitle,pubDate:new Date('2026-09-20T00:00:00Z'),link:'/blog/adapting-jev-with-gepa/',categories:['Jev','GEPA','Evaluation']} ]});}
