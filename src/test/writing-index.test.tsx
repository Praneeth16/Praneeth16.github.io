import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createAgent} from '@ui-sdk/react/agent';
import {expect,test} from 'vitest';
import WritingIndex from '../components/home/WritingIndex';
const essays=[
 {number:'01',type:'Visual story',title:'Story',summary:'Story summary',href:'/story/',date:'2 Nov 2026',tag:'Scenes'},
 {number:'02',type:'Benchmark',title:'Study',summary:'Study summary',href:'/study/',date:'1 Nov 2026',tag:'Models'},
];
const agent=createAgent();
test('keyboard filters change the visible reading list and retain selection',async()=>{
 const user=userEvent.setup();render(<WritingIndex essays={essays}/>);
 expect(screen.getAllByRole('link')).toHaveLength(2);
 await user.tab();expect(document.activeElement).toBe(screen.getByRole('radio',{name:'All writing'}));
 await user.keyboard('{ArrowRight}');expect(screen.getAllByRole('link')).toHaveLength(1);expect(screen.getByRole('link').getAttribute('href')).toBe('/story/');
 await user.keyboard('{ArrowRight}');expect(screen.getByRole('link').getAttribute('href')).toBe('/study/');
 await user.keyboard('{ArrowLeft}{ArrowLeft}');expect(screen.getAllByRole('link')).toHaveLength(2);
});
test('agent can discover choices and filter the actual list',async()=>{
 render(<WritingIndex essays={essays}/>);
 const entries=agent.snapshot().filter(e=>!e.offPage&&e.component!=='more');
 expect(entries.every(e=>Boolean(e.label))).toBe(true);
 const filter=entries.find(e=>e.label==='Filter writing');expect(filter).toBeTruthy();
 console.log(JSON.stringify(filter));
 await act(async()=>{const result=await agent.act({steps:[{ref:'Filter writing',action:'setValue',args:['Experiments']}]});expect(result.ok,result.error?.message).toBe(true)});
 expect(screen.getAllByRole('link')).toHaveLength(1);expect(screen.getByRole('link').getAttribute('href')).toBe('/study/');
});
