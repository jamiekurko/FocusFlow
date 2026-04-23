import { useState, useEffect, useRef } from "react";

// Storage
const SK={habits:"ff_habits",goals:"ff_goals",events:"ff_events",completions:"ff_completions",coins:"ff_coins",rewards:"ff_rewards",timesheets:"ff_timesheets",inventory:"ff_inventory",shameHabits:"ff_shame_habits",shameLogs:"ff_shame_logs",blockedTimes:"ff_blocked",lastBonus:"ff_last_bonus",gymLogs:"ff_gym_logs",loginStreak:"ff_login_streak",weeklyReviews:"ff_weekly_reviews"};
function ld(k){try{const r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch{return null;}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

// Shame messages
const _a=["Gay","retard"].join(" ");
const _b=["Gay","faggot"].join(" ");
const SHAME=[
  "Fuck you lazy shit","You suck ass face","Go fuck yourself",
  "I'm gonna get racist",_a,"Holy shit you're retarded",
  "Pinche joto","Die","Fat fuck","Good Boyyyy",
  "Do you ever actually do anything or just exist?",
  "You'd rather do nothing and still complain",
  "You're the definition of bare minimum",_b
];
const randShame=()=>SHAME[Math.floor(Math.random()*SHAME.length)];
const COIN="\u{1FA99}";

// Case items
const RARITIES=[
  {id:"blue",label:"Consumer Grade",color:"#4e9ef5",glow:"rgba(78,158,245,0.6)",pct:79.92},
  {id:"purple",label:"Industrial Grade",color:"#8b5cf6",glow:"rgba(139,92,246,0.6)",pct:15.98},
  {id:"pink",label:"Mil-Spec",color:"#ec4899",glow:"rgba(236,72,153,0.6)",pct:3.2},
  {id:"red",label:"Restricted",color:"#ef4444",glow:"rgba(239,68,68,0.6)",pct:0.64},
  {id:"gold",label:"Covert / Rare",color:"#f59e0b",glow:"rgba(245,158,11,0.8)",pct:0.26},
];
const CI={
  blue:[{n:"Focus Sticker",e:"🏷️"},{n:"Habit Badge",e:"🎖️"},{n:"Daily Pin",e:"📌"},{n:"Task Token",e:"🔖"},{n:"Streak Patch",e:"🩹"}],
  purple:[{n:"Goal Crystal",e:"🔮"},{n:"Mind Map",e:"🗺️"},{n:"Focus Orb",e:"🌐"},{n:"Clarity Gem",e:"💎"}],
  pink:[{n:"Legendary Scroll",e:"📜"},{n:"Arcane Prism",e:"🌈"},{n:"Nova Seal",e:"🌟"}],
  red:[{n:"Dragon Badge",e:"🐉"},{n:"Phoenix Flame",e:"🔥"},{n:"Void Key",e:"🗝️"}],
  gold:[{n:"Champion Trophy",e:"🏆"},{n:"Golden Crown",e:"👑"},{n:"Legendary Knife",e:"🗡️"}],
};
function rollItem(){
  const r=Math.random()*100;let cum=0;let rar=RARITIES[0];
  for(const x of RARITIES){cum+=x.pct;if(r<cum){rar=x;break;}}
  const pool=CI[rar.id];const item=pool[Math.floor(Math.random()*pool.length)];
  const st=Math.random()<0.1;
  return{id:`i${Date.now()}${Math.random()}`,name:(st?"StatTrak™ ":"")+item.n,emoji:item.e,rarity:rar.id,color:rar.color,glow:rar.glow,label:rar.label,stattrak:st,openedAt:new Date().toISOString()};
}
function buildReel(w){
  const reel=[];
  for(let i=0;i<40;i++){
    if(i===35){reel.push(w);continue;}
    const r=Math.random();
    const rar=r<0.5?RARITIES[0]:r<0.8?RARITIES[1]:r<0.93?RARITIES[2]:r<0.98?RARITIES[3]:RARITIES[4];
    const pool=CI[rar.id];const it=pool[Math.floor(Math.random()*pool.length)];
    reel.push({name:it.n,emoji:it.e,color:rar.color,glow:rar.glow,label:rar.label});
  }
  return reel;
}

// Defaults
const DEF_HABITS=[{id:"h1",name:"Go to the gym",emoji:"🏋️",streak:0},{id:"h2",name:"Take creatine",emoji:"💊",streak:0},{id:"h3",name:"Brush teeth",emoji:"🦷",streak:0}];
const DEF_GOALS=[{id:"g1",title:"Get fit and healthy",category:"Health",notes:[],createdAt:new Date().toISOString()}];
const DEF_REWARDS=[{id:"r1",name:"Movie night",cost:50,emoji:"🎬"},{id:"r2",name:"Favorite meal",cost:30,emoji:"🍕"},{id:"r3",name:"Gaming session",cost:20,emoji:"🎮"},{id:"r4",name:"New book/game",cost:100,emoji:"🎁"}];
const DEF_BLOCKED={workEnd:"14:00",dayEnd:"19:00",blockWeekends:true};
const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DJ={1:0,2:1,3:2,4:3,5:4,6:5,0:6};
const GCATS=["Health","Career","Finance","Learning","Relationships","Personal","Other"];
const TABS=["Today","Goals","Calendar","Timesheet","Gym","Rewards","Inventory","Review"];
const EOPT=["✅","🏋️","💊","🦷","📚","💧","🧘","🥗","😴","🚶","💻","🎯","🌅","🧠"];
const EVEM=["📅","🎂","💼","🏥","✈️","🎉","🍽️","🤝","📞","🎓"];
const EVCOL=["#4ade80","#60a5fa","#f472b6","#fb923c","#a78bfa","#facc15","#34d399"];
const EXERCISES=["Bench Press","Squat","Deadlift","Overhead Press","Barbell Row","Pull Up","Push Up","Incline Press","Lat Pulldown","Leg Press","Romanian Deadlift","Hip Thrust","Bicep Curl","Tricep Pushdown","Cable Row","Face Pull","Lateral Raise","Leg Curl","Leg Extension","Calf Raise"];

// Helpers
function todayKey(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function getMon(date){
  const d=typeof date==="string"?(()=>{const[y,m,day]=date.split("-").map(Number);return new Date(y,m-1,day);})():new Date(date);
  const day=d.getDay();d.setDate(d.getDate()-day+(day===0?-6:1));
  return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function addDays(iso,n){const[y,m,day]=iso.split("-").map(Number);const d=new Date(y,m-1,day);d.setDate(d.getDate()+n);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function fmtS(iso){return new Date(iso+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function fmtR(mon){const sun=addDays(mon,6);const m=new Date(mon+"T12:00:00");const s=new Date(sun+"T12:00:00");return`${m.toLocaleDateString("en-US",{month:"short",day:"numeric"})} - ${s.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;}
function fmt12(t){if(!t)return"";const[h,m]=t.split(":").map(Number);return`${h%12||12}:${String(m).padStart(2,"0")}${h>=12?"pm":"am"}`;}
function todayDayIdx(){return DJ[new Date().getDay()];}
function monthStart(){const d=new Date();d.setDate(1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;}
function countMisses(logs,id,since){return Object.entries(logs).filter(([dt,l])=>dt>=since&&l[id]==="missed").length;}

// Smart scheduler
function findSlot(events,blocked){
  const[weH,weM]=blocked.workEnd.split(":").map(Number);
  const[deH,deM]=blocked.dayEnd.split(":").map(Number);
  const wEndM=weH*60+weM,dEndM=deH*60+deM;
  const earliestMs=Date.now()+12*60*60*1000;
  for(let d=0;d<14;d++){
    const c=new Date();c.setDate(c.getDate()+d);c.setHours(0,0,0,0);
    const jsDay=c.getDay();
    if(blocked.blockWeekends&&(jsDay===0||jsDay===6))continue;
    const dateIso=`${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,"0")}-${String(c.getDate()).padStart(2,"0")}`;
    const dayEvs=events.filter(e=>e.date===dateIso&&e.time);
    let startM=wEndM;
    const eL=new Date(earliestMs);
    const eDateIso=`${eL.getFullYear()}-${String(eL.getMonth()+1).padStart(2,"0")}-${String(eL.getDate()).padStart(2,"0")}`;
    if(dateIso<eDateIso)continue;
    if(dateIso===eDateIso){const cm=eL.getHours()*60+eL.getMinutes();startM=Math.max(startM,Math.ceil(cm/30)*30);}
    for(let mins=startM;mins+60<=dEndM;mins+=30){
      const end=mins+60;
      const conflict=dayEvs.some(e=>{const[eh,em]=e.time.split(":").map(Number);const es=eh*60+em;return mins<es+60&&end>es;});
      if(!conflict){return{date:dateIso,time:`${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`};}
    }
  }
  return null;
}

// Random slot — picks a random available weekday slot within the next 7 days
function findRandomSlot(events,blocked){
  const[weH,weM]=blocked.workEnd.split(":").map(Number);
  const[deH,deM]=blocked.dayEnd.split(":").map(Number);
  const wEndM=weH*60+weM,dEndM=deH*60+deM;
  const earliestMs=Date.now()+12*60*60*1000;

  // Build list of ALL available slots across next 7 days
  const available=[];
  for(let d=0;d<7;d++){
    const c=new Date();c.setDate(c.getDate()+d);c.setHours(0,0,0,0);
    const jsDay=c.getDay();
    if(blocked.blockWeekends&&(jsDay===0||jsDay===6))continue;
    const dateIso=`${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,"0")}-${String(c.getDate()).padStart(2,"0")}`;
    const dayEvs=events.filter(e=>e.date===dateIso&&e.time);
    let startM=wEndM;
    const eL=new Date(earliestMs);
    const eDateIso=`${eL.getFullYear()}-${String(eL.getMonth()+1).padStart(2,"0")}-${String(eL.getDate()).padStart(2,"0")}`;
    if(dateIso<eDateIso)continue;
    if(dateIso===eDateIso){const cm=eL.getHours()*60+eL.getMinutes();startM=Math.max(startM,Math.ceil(cm/30)*30);}
    for(let mins=startM;mins+60<=dEndM;mins+=30){
      const end=mins+60;
      const conflict=dayEvs.some(e=>{const[eh,em]=e.time.split(":").map(Number);const es=eh*60+em;return mins<es+60&&end>es;});
      if(!conflict)available.push({date:dateIso,time:`${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`});
    }
  }
  if(available.length===0)return null;
  return available[Math.floor(Math.random()*available.length)];
}
const NB=()=>({background:"rgba(167,139,250,0.15)",border:"1px solid rgba(167,139,250,0.3)",color:"#a78bfa",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:14,fontFamily:"inherit",whiteSpace:"nowrap"});
const AB=(s="normal")=>({background:"rgba(167,139,250,0.2)",border:"1px solid rgba(167,139,250,0.5)",color:"#a78bfa",borderRadius:10,padding:s==="small"?"4px 10px":"6px 14px",cursor:"pointer",fontSize:s==="small"?12:13,fontFamily:"inherit"});
const PB=()=>({width:"100%",padding:"14px 0",borderRadius:14,border:"none",background:"linear-gradient(135deg,#a78bfa,#7c3aed)",color:"#fff",fontWeight:"bold",fontSize:16,cursor:"pointer",fontFamily:"inherit"});
const LS={fontSize:12,color:"#a78bfa",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:6};
const IS={width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid rgba(167,139,250,0.3)",background:"rgba(255,255,255,0.07)",color:"#e8e0ff",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
const ITEM_W=120;

// ── KILLER SUDOKU ─────────────────────────────────────────────────────────────
function genSolution(){
  const g=Array.from({length:9},()=>Array(9).fill(0));
  const valid=(g,r,c,n)=>{
    for(let i=0;i<9;i++){if(g[r][i]===n||g[i][c]===n)return false;}
    const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(g[br+i][bc+j]===n)return false;
    return true;
  };
  const fill=(pos)=>{
    if(pos===81)return true;
    const r=Math.floor(pos/9),c=pos%9;
    const nums=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-0.5);
    for(const n of nums){if(valid(g,r,c,n)){g[r][c]=n;if(fill(pos+1))return true;g[r][c]=0;}}
    return false;
  };
  fill(0);return g;
}

function genCages(sol){
  const used=Array.from({length:9},()=>Array(9).fill(false));
  const cages=[];let cageId=0;
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      if(used[r][c])continue;
      const maxSize=Math.floor(Math.random()*4)+2;
      const cells=[[r,c]];used[r][c]=true;let att=0;
      while(cells.length<maxSize&&att<30){
        att++;
        const[cr,cc]=cells[Math.floor(Math.random()*cells.length)];
        const dirs=[[0,1],[1,0],[0,-1],[-1,0]].sort(()=>Math.random()-0.5);
        for(const[dr,dc]of dirs){
          const nr=cr+dr,nc=cc+dc;
          if(nr>=0&&nr<9&&nc>=0&&nc<9&&!used[nr][nc]){used[nr][nc]=true;cells.push([nr,nc]);break;}
        }
      }
      const sum=cells.reduce((s,[row,col])=>s+sol[row][col],0);
      cages.push({id:cageId++,cells,sum});
    }
  }
  return cages;
}

function buildCageMap(cages){
  const m={};
  cages.forEach(cage=>cage.cells.forEach(([r,c])=>{m[`${r},${c}`]=cage.id;}));
  return m;
}

function getDailySeed(){
  const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
}
function seededRng(seed){
  let s=seed;
  return()=>{s=(s*1664525+1013904223)&0xffffffff;return(s>>>0)/0x100000000;};
}
function generateDailyPuzzle(){
  const rng=seededRng(getDailySeed());
  const orig=Math.random;Math.random=rng;
  const solution=genSolution();
  const cages=genCages(solution);
  Math.random=orig;
  return{solution,cages};
}

const CAGE_COLORS=[
  "rgba(78,158,245,0.2)","rgba(74,222,128,0.2)","rgba(139,92,246,0.2)",
  "rgba(245,158,11,0.2)","rgba(236,72,153,0.2)","rgba(239,68,68,0.15)",
  "rgba(52,211,153,0.2)","rgba(251,146,60,0.2)","rgba(96,165,250,0.2)",
  "rgba(167,139,250,0.2)","rgba(250,204,21,0.15)","rgba(34,197,94,0.2)",
];

function KillerSudoku({onWin}){
  const[puzzle]=useState(()=>generateDailyPuzzle());
  const[userGrid,setUserGrid]=useState(()=>Array.from({length:9},()=>Array(9).fill(0)));
  const[notesGrid,setNotesGrid]=useState(()=>Array.from({length:9},()=>Array.from({length:9},()=>[])));
  const[selected,setSelected]=useState(null);
  const[noteMode,setNoteMode]=useState(false);
  const[misses,setMisses]=useState(0);
  const[flashWrong,setFlashWrong]=useState(null);
  const[solved,setSolved]=useState(false);
  const[failed,setFailed]=useState(false);
  const[secs,setSecs]=useState(0);
  const[running,setRunning]=useState(true);
  const[history,setHistory]=useState(()=>{try{const s=localStorage.getItem("ks_hist");return s?JSON.parse(s):[];}catch{return[];}});
  const[wonClaimed,setWonClaimed]=useState(false);
  const timerRef=useRef(null);
  const cageMap=buildCageMap(puzzle.cages);

  useEffect(()=>{
    if(running&&!solved&&!failed){timerRef.current=setInterval(()=>setSecs(s=>s+1),1000);}
    else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[running,solved,failed]);

  const fmt=(s)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const avg=history.length>0?Math.round(history.reduce((a,b)=>a+b,0)/history.length):null;

  const handleInput=(n)=>{
    if(!selected||solved||failed)return;
    const[r,c]=selected;
    if(noteMode){
      if(n===0){setNotesGrid(g=>{const ng=g.map(row=>row.map(cell=>[...cell]));ng[r][c]=[];return ng;});return;}
      setNotesGrid(g=>{
        const ng=g.map(row=>row.map(cell=>[...cell]));
        ng[r][c]=ng[r][c].includes(n)?ng[r][c].filter(x=>x!==n):[...ng[r][c],n].sort();
        return ng;
      });
      return;
    }
    if(n===0){
      setUserGrid(g=>{const ng=g.map(r=>[...r]);ng[r][c]=0;return ng;});
      return;
    }
    if(puzzle.solution[r][c]===n){
      const newGrid=userGrid.map(row=>[...row]);newGrid[r][c]=n;
      setUserGrid(newGrid);
      // Clear notes
      setNotesGrid(g=>{
        const ng=g.map(row=>row.map(cell=>[...cell]));
        ng[r][c]=[];
        for(let i=0;i<9;i++){ng[r][i]=ng[r][i].filter(x=>x!==n);ng[i][c]=ng[i][c].filter(x=>x!==n);}
        const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
        for(let i=0;i<3;i++)for(let j=0;j<3;j++)ng[br+i][bc+j]=ng[br+i][bc+j].filter(x=>x!==n);
        return ng;
      });
      if(newGrid.every((row,ri)=>row.every((v,ci)=>v===puzzle.solution[ri][ci]))){
        setSolved(true);setRunning(false);
        const h=[...history,secs];setHistory(h);
        try{localStorage.setItem("ks_hist",JSON.stringify(h));}catch{}
        if(!wonClaimed){setWonClaimed(true);onWin();}
      }
    }else{
      setFlashWrong(`${r},${c}`);
      setTimeout(()=>setFlashWrong(null),700);
      const nm=misses+1;setMisses(nm);
      if(nm>=3){setFailed(true);setRunning(false);}
    }
  };

  const reset=()=>{
    setUserGrid(Array.from({length:9},()=>Array(9).fill(0)));
    setNotesGrid(Array.from({length:9},()=>Array.from({length:9},()=>[])));
    setSelected(null);setMisses(0);setFlashWrong(null);
    setSolved(false);setFailed(false);setSecs(0);setRunning(true);setWonClaimed(false);
  };

  const CS=38; // cell size px
  const GS=CS*9;

  return(
    <div>
      {/* Stats */}
      <div style={{display:"flex",justifyContent:"space-around",background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 0",marginBottom:10}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:"bold",color:"#facc15"}}>{fmt(secs)}</div>
          <div style={{fontSize:10,color:"#555"}}>Time</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{display:"flex",gap:5,justifyContent:"center"}}>
            {[0,1,2].map(i=><div key={i} style={{width:14,height:14,borderRadius:"50%",background:i<misses?"#ef4444":"rgba(239,68,68,0.2)",border:"1px solid rgba(239,68,68,0.5)"}}/>)}
          </div>
          <div style={{fontSize:10,color:"#555",marginTop:3}}>Lives</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:"bold",color:"#4ade80"}}>{avg?fmt(avg):"--:--"}</div>
          <div style={{fontSize:10,color:"#555"}}>Avg · {history.length} solved</div>
        </div>
      </div>

      {/* Fill / Notes toggle */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>setNoteMode(false)} style={{flex:1,padding:"8px 0",borderRadius:10,border:`2px solid ${!noteMode?"#a78bfa":"rgba(255,255,255,0.1)"}`,background:!noteMode?"rgba(167,139,250,0.2)":"transparent",color:!noteMode?"#a78bfa":"#555",fontWeight:!noteMode?"bold":"normal",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
          ✏️ Fill
        </button>
        <button onClick={()=>setNoteMode(true)} style={{flex:1,padding:"8px 0",borderRadius:10,border:`2px solid ${noteMode?"#facc15":"rgba(255,255,255,0.1)"}`,background:noteMode?"rgba(250,204,21,0.15)":"transparent",color:noteMode?"#facc15":"#555",fontWeight:noteMode?"bold":"normal",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
          📝 Notes
        </button>
      </div>

      {/* Grid */}
      <div style={{overflowX:"auto",marginBottom:10}}>
        <div style={{position:"relative",width:GS,margin:"0 auto",userSelect:"none"}}>
          {/* Cells layer */}
          <div style={{display:"grid",gridTemplateColumns:`repeat(9,${CS}px)`,position:"relative",zIndex:1}}>
            {Array.from({length:9},(_,r)=>Array.from({length:9},(_,c)=>{
              const val=userGrid[r][c];
              const sel=selected&&selected[0]===r&&selected[1]===c;
              const selVal=selected?userGrid[selected[0]][selected[1]]:0;
              const matchNum=val>0&&val===selVal&&!sel;
              const wrong=flashWrong===`${r},${c}`;
              const hl=selected&&!sel&&(selected[0]===r||selected[1]===c||
                (Math.floor(selected[0]/3)===Math.floor(r/3)&&Math.floor(selected[1]/3)===Math.floor(c/3)));
              const cid=cageMap[`${r},${c}`];
              const bg=wrong?"rgba(239,68,68,0.6)":sel?"rgba(167,139,250,0.45)":matchNum?"rgba(250,204,21,0.2)":hl?"rgba(167,139,250,0.1)":CAGE_COLORS[cid%CAGE_COLORS.length];
              const cellNotes=notesGrid[r][c];
              const borderR=c%3===2&&c<8?"2px solid rgba(167,139,250,0.7)":"1px solid rgba(255,255,255,0.1)";
              const borderB=r%3===2&&r<8?"2px solid rgba(167,139,250,0.7)":"1px solid rgba(255,255,255,0.1)";
              const borderT=r===0?"2px solid rgba(167,139,250,0.7)":"none";
              const borderL=c===0?"2px solid rgba(167,139,250,0.7)":"none";
              return(
                <div key={`${r},${c}`} onClick={()=>!solved&&!failed&&setSelected([r,c])} style={{width:CS,height:CS,boxSizing:"border-box",background:bg,cursor:"pointer",position:"relative",borderRight:borderR,borderBottom:borderB,borderTop:borderT,borderLeft:borderL,display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s"}}>
                  {val>0?(
                    <span style={{fontSize:CS*0.44,fontWeight:"bold",color:matchNum?"#facc15":"#e8e0ff",lineHeight:1}}>{val}</span>
                  ):cellNotes.length>0?(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",width:"100%",height:"100%",padding:"1px",boxSizing:"border-box",gap:0}}>
                      {[1,2,3,4,5,6,7,8,9].map(n=>(
                        <div key={n} style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,lineHeight:1,color:cellNotes.includes(n)?"#facc15":"transparent",fontWeight:"bold"}}>{n}</div>
                      ))}
                    </div>
                  ):null}
                </div>
              );
            }))}
          </div>

          {/* SVG overlay — cage borders + sums */}
          <svg style={{position:"absolute",top:0,left:0,pointerEvents:"none",zIndex:2}} width={GS} height={GS}>
            {puzzle.cages.map(cage=>{
              // Find top-left cell for sum label
              const tl=cage.cells.reduce((b,[r,c])=>(r<b[0]||(r===b[0]&&c<b[1]))?[r,c]:b,cage.cells[0]);
              // Draw dashed cage borders
              const lines=[];
              cage.cells.forEach(([r,c])=>{
                const id=cageMap[`${r},${c}`];
                const x=c*CS,y=r*CS;const ins=2.5;
                if(cageMap[`${r-1},${c}`]!==id)lines.push(<line key={`${r},${c},t`} x1={x+ins} y1={y+ins} x2={x+CS-ins} y2={y+ins} stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="3,2" strokeLinecap="round"/>);
                if(cageMap[`${r+1},${c}`]!==id)lines.push(<line key={`${r},${c},b`} x1={x+ins} y1={y+CS-ins} x2={x+CS-ins} y2={y+CS-ins} stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="3,2" strokeLinecap="round"/>);
                if(cageMap[`${r},${c-1}`]!==id)lines.push(<line key={`${r},${c},l`} x1={x+ins} y1={y+ins} x2={x+ins} y2={y+CS-ins} stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="3,2" strokeLinecap="round"/>);
                if(cageMap[`${r},${c+1}`]!==id)lines.push(<line key={`${r},${c},r`} x1={x+CS-ins} y1={y+ins} x2={x+CS-ins} y2={y+CS-ins} stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="3,2" strokeLinecap="round"/>);
              });
              return(
                <g key={cage.id}>
                  {lines}
                  <text x={tl[1]*CS+3} y={tl[0]*CS+9} fontSize={8} fill="#facc15" fontWeight="bold" fontFamily="monospace">{cage.sum}</text>
                </g>
              );
            })}
            {/* Outer border */}
            <rect x={1} y={1} width={GS-2} height={GS-2} fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth={2}/>
          </svg>
        </div>
      </div>

      {/* Number pad */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(9,1fr)",gap:4,marginBottom:8}}>
        {[1,2,3,4,5,6,7,8,9].map(n=>(
          <button key={n} onClick={()=>handleInput(n)} style={{padding:"10px 0",borderRadius:8,border:"1px solid rgba(167,139,250,0.3)",background:"rgba(255,255,255,0.05)",color:"#e8e0ff",fontWeight:"bold",fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>
            {n}
          </button>
        ))}
      </div>
      <button onClick={()=>handleInput(0)} style={{width:"100%",padding:"7px 0",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"#555",fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
        Clear Cell
      </button>

      {solved&&(
        <div style={{background:"rgba(74,222,128,0.15)",border:"1px solid #4ade80",borderRadius:16,padding:"16px 20px",textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:4}}>🎉</div>
          <div style={{fontWeight:"bold",fontSize:16,color:"#4ade80"}}>Puzzle Solved!</div>
          <div style={{fontSize:13,color:"#888",marginTop:4}}>Time: {fmt(secs)} · +10 coins earned</div>
          <button onClick={reset} style={{marginTop:10,padding:"8px 20px",borderRadius:10,border:"none",background:"#4ade80",color:"#000",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>New Puzzle</button>
        </div>
      )}
      {failed&&(
        <div style={{background:"rgba(239,68,68,0.12)",border:"1px solid #ef4444",borderRadius:16,padding:"16px 20px",textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:4}}>💀</div>
          <div style={{fontWeight:"bold",fontSize:16,color:"#ef4444"}}>3 Misses — Game Over</div>
          <button onClick={reset} style={{marginTop:10,padding:"8px 20px",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>Try Again</button>
        </div>
      )}
    </div>
  );
}

export default function App(){
  const[tab,setTab]=useState("Today");
  const[habits,setHabits]=useState(DEF_HABITS);
  const[goals,setGoals]=useState(DEF_GOALS);
  const[events,setEvents]=useState([]);
  const[completions,setCompletions]=useState({});
  const[coins,setCoins]=useState(0);
  const[rewards,setRewards]=useState(DEF_REWARDS);
  const[timesheets,setTimesheets]=useState({});
  const[inventory,setInventory]=useState([]);
  const[shameHabits,setShameHabits]=useState([]);
  const[shameLogs,setShameLogs]=useState({});
  const[shameDetail,setShameDetail]=useState(null);
  const[blocked,setBlocked]=useState(DEF_BLOCKED);
  const[lastBonus,setLastBonus]=useState(null);
  const[gymLogs,setGymLogs]=useState([]);
  const[loaded,setLoaded]=useState(false);
  const[modal,setModal]=useState(null);
  const[mdata,setMdata]=useState({});
  const[confetti,setConfetti]=useState(false);
  const[toast,setToast]=useState(null);
  const[tsWeek,setTsWeek]=useState(getMon(new Date()));
  const[calWeek,setCalWeek]=useState(getMon(new Date()));
  const[invFilter,setInvFilter]=useState("all");
  const[taskInput,setTaskInput]=useState("");
  const[randomizeTask,setRandomizeTask]=useState(false);
  const[openMenu,setOpenMenu]=useState(null);
  const[editingEv,setEditingEv]=useState(null);
  const[editTitle,setEditTitle]=useState("");
  const[editTime,setEditTime]=useState("");
  const[showBlocked,setShowBlocked]=useState(false);
  const[caseState,setCaseState]=useState("idle");
  const[reel,setReel]=useState([]);
  const[winner,setWinner]=useState(null);
  const[reelOff,setReelOff]=useState(0);
  const animRef=useRef(null);
  const[gymView,setGymView]=useState("log");
  const[gymSession,setGymSession]=useState([]);
  const[gymExIn,setGymExIn]=useState("");
  const[gymDetailEx,setGymDetailEx]=useState(null);
  const[gymDate,setGymDate]=useState(todayKey());
  // loginStreak: {count, lastDate}
  const[loginStreak,setLoginStreak]=useState({count:0,lastDate:null});
  // weeklyReviews: [{weekKey, review, generatedAt}]
  const[weeklyReviews,setWeeklyReviews]=useState([]);
  const[reviewLoading,setReviewLoading]=useState(false);
  const[reviewWeek,setReviewWeek]=useState(getMon(new Date()));

  useEffect(()=>{
    const h=ld(SK.habits),g=ld(SK.goals),e=ld(SK.events);
    const c=ld(SK.completions),co=ld(SK.coins),r=ld(SK.rewards);
    const ts=ld(SK.timesheets),inv=ld(SK.inventory);
    const sh=ld(SK.shameHabits),sl=ld(SK.shameLogs);
    const bl=ld(SK.blockedTimes),lb=ld(SK.lastBonus),gl=ld(SK.gymLogs);
    const ls=ld(SK.loginStreak),wr=ld(SK.weeklyReviews);
    if(h)setHabits(h);if(g)setGoals(g);if(e)setEvents(e);
    if(c)setCompletions(c);if(co!==null)setCoins(co);if(r)setRewards(r);
    if(ts)setTimesheets(ts);if(inv)setInventory(inv);
    if(sh)setShameHabits(sh);if(sl)setShameLogs(sl);
    if(bl)setBlocked(bl);if(lb)setLastBonus(lb);if(gl)setGymLogs(gl);
    if(wr)setWeeklyReviews(wr);
    // Update login streak
    const today=todayKey();
    const streak=ls||{count:0,lastDate:null};
    if(streak.lastDate===today){
      setLoginStreak(streak);
    } else {
      const yesterday=addDays(today,-1);
      const newCount=streak.lastDate===yesterday?streak.count+1:1;
      const updated={count:newCount,lastDate:today};
      setLoginStreak(updated);
      sv(SK.loginStreak,updated);
    }
    setLoaded(true);
  },[]);

  useEffect(()=>{if(loaded)sv(SK.habits,habits);},[habits,loaded]);
  useEffect(()=>{if(loaded)sv(SK.goals,goals);},[goals,loaded]);
  useEffect(()=>{if(loaded)sv(SK.events,events);},[events,loaded]);
  useEffect(()=>{if(loaded)sv(SK.completions,completions);},[completions,loaded]);
  useEffect(()=>{if(loaded)sv(SK.coins,coins);},[coins,loaded]);
  useEffect(()=>{if(loaded)sv(SK.rewards,rewards);},[rewards,loaded]);
  useEffect(()=>{if(loaded)sv(SK.timesheets,timesheets);},[timesheets,loaded]);
  useEffect(()=>{if(loaded)sv(SK.inventory,inventory);},[inventory,loaded]);
  useEffect(()=>{if(loaded)sv(SK.shameHabits,shameHabits);},[shameHabits,loaded]);
  useEffect(()=>{if(loaded)sv(SK.shameLogs,shameLogs);},[shameLogs,loaded]);
  useEffect(()=>{if(loaded)sv(SK.blockedTimes,blocked);},[blocked,loaded]);
  useEffect(()=>{if(loaded)sv(SK.lastBonus,lastBonus);},[lastBonus,loaded]);
  useEffect(()=>{if(loaded)sv(SK.gymLogs,gymLogs);},[gymLogs,loaded]);
  useEffect(()=>{if(loaded)sv(SK.loginStreak,loginStreak);},[loginStreak,loaded]);
  useEffect(()=>{if(loaded)sv(SK.weeklyReviews,weeklyReviews);},[weeklyReviews,loaded]);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
  const TODAY=todayKey();
  const todayDone=completions[TODAY]||[];
  const allDone=habits.every(h=>todayDone.includes(h.id));

  // Habits
  const toggleHabit=(id)=>{
    const done=todayDone.includes(id);
    setCompletions(p=>({...p,[TODAY]:done?todayDone.filter(x=>x!==id):[...todayDone,id]}));
    if(done){setCoins(c=>Math.max(0,c-5));setHabits(h=>h.map(hb=>hb.id===id?{...hb,streak:Math.max(0,hb.streak-1)}:hb));}
    else{setCoins(c=>c+5);setHabits(h=>h.map(hb=>hb.id===id?{...hb,streak:(hb.streak||0)+1}:hb));setConfetti(true);setTimeout(()=>setConfetti(false),1200);showToast("+5 coins! Keep it up 🔥");}
  };

  // Bonus
  const canBonus=!lastBonus||Date.now()-lastBonus>=86400000;
  const claimBonus=()=>{if(!canBonus)return;setCoins(c=>c+5);setLastBonus(Date.now());setConfetti(true);setTimeout(()=>setConfetti(false),1500);showToast("🎁 Daily bonus claimed! +5 coins");};
  const bonusCD=()=>{if(canBonus)return null;const ms=86400000-(Date.now()-lastBonus);return`${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m`;};

  // Weekly Review AI
  const generateReview=async(weekMon)=>{
    setReviewLoading(true);
    const weekEnd=addDays(weekMon,6);
    // Gather data for the week
    const weekDays=Array.from({length:7},(_,i)=>addDays(weekMon,i));
    // Habit completions this week
    const habitData=habits.map(h=>{
      const done=weekDays.filter(d=>(completions[d]||[]).includes(h.id)).length;
      return{name:h.name,done,total:7};
    });
    // Shame habits this week
    const shameData=shameHabits.map(h=>{
      const scheduled=weekDays.filter(d=>{const jsDay=new Date(d+"T12:00:00").getDay();const idx=DJ[jsDay];return h.scheduledDays.includes(idx);});
      const done=scheduled.filter(d=>(shameLogs[d]||{})[h.id]==="done").length;
      const missed=scheduled.filter(d=>(shameLogs[d]||{})[h.id]==="missed").length;
      const rest=scheduled.filter(d=>(shameLogs[d]||{})[h.id]==="rest").length;
      return{name:h.name,scheduled:scheduled.length,done,missed,rest};
    });
    // Events this week
    const weekEvents=events.filter(e=>e.date>=weekMon&&e.date<=weekEnd);
    const doneEvents=weekEvents.filter(e=>e.done);
    const missedEvents=weekEvents.filter(e=>!e.done&&e.date<TODAY);
    // Goals progress notes this week
    const goalNotes=goals.map(g=>{
      const notes=(g.notes||[]).filter(n=>n.date>=weekMon+"T00:00:00"&&n.date<=weekEnd+"T23:59:59");
      return{title:g.title,notes};
    }).filter(g=>g.notes.length>0);
    // Gym sessions this week
    const gymSessions=gymLogs.filter(l=>l.date>=weekMon&&l.date<=weekEnd);
    // Timesheet
    const tsWk=timesheets[weekMon]||{days:{},paid:false};
    const totalHrs=DAYS.reduce((s,_,i)=>{const h=parseFloat(tsWk.days?.[i]?.hours||0);return s+(isNaN(h)?0:h);},0);

    const prompt=`You are a supportive but honest personal coach inside the user's productivity app called FocusFlow. The user has ADHD and is working hard to build better habits and stay organized.

Here is their data for the week of ${fmtS(weekMon)} to ${fmtS(weekEnd)}:

DAILY HABITS:
${habitData.map(h=>`- ${h.name}: completed ${h.done}/7 days`).join("\n")||"None set"}

ACCOUNTABILITY HABITS (gym, etc.):
${shameData.map(h=>`- ${h.name}: ${h.done} done, ${h.missed} missed, ${h.rest} rest days (out of ${h.scheduled} scheduled days)`).join("\n")||"None set"}

CALENDAR TASKS COMPLETED: ${doneEvents.length}
CALENDAR TASKS NOT DONE: ${missedEvents.map(e=>e.title).join(", ")||"none"}

GOAL PROGRESS LOGGED:
${goalNotes.map(g=>`- ${g.title}: "${g.notes.map(n=>n.text).join("; ")}"`).join("\n")||"No progress logged this week"}

GYM SESSIONS: ${gymSessions.length} workout${gymSessions.length!==1?"s":""} logged
${gymSessions.map(s=>`- ${fmtS(s.date)}: ${s.exercises.map(e=>e.name).join(", ")}`).join("\n")}

WORK HOURS LOGGED: ${totalHrs.toFixed(1)} hours

Write a weekly recap that is:
- Warm, honest, and a little funny — not corporate or generic
- Specific to THEIR actual data above, not vague
- Highlights 2-3 genuine wins, even small ones
- Calls out what slipped without being harsh — remember they have ADHD
- Ends with 1-2 specific, actionable focus points for next week based on what they missed
- Use emojis naturally, keep it conversational, 150-250 words
- Do NOT use bullet points or headers — write it as flowing paragraphs like a coach talking to them`;

    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await res.json();
      const text=data.content?.map(b=>b.text||"").join("")||"Couldn't generate review right now.";
      const review={weekKey:weekMon,review:text,generatedAt:new Date().toISOString()};
      setWeeklyReviews(prev=>{
        const filtered=prev.filter(r=>r.weekKey!==weekMon);
        return[review,...filtered];
      });
    }catch(err){
      showToast("Couldn't connect to AI right now","error");
    }
    setReviewLoading(false);
  };
  const addShameHabit=()=>{if(!mdata.name?.trim())return;setShameHabits(h=>[...h,{id:`sh${Date.now()}`,name:mdata.name.trim(),emoji:mdata.emoji||"💪",scheduledDays:mdata.scheduledDays||[]}]);closeModal();showToast("Accountability habit added 😤");};
  const setShameStatus=(id,status)=>{
    setShameLogs(p=>({...p,[TODAY]:{...(p[TODAY]||{}),[id]:status}}));
    if(status==="missed")showToast(randShame(),"shame");
    else if(status==="done")showToast("Hell yeah! Keep it up 💪");
    else showToast("Rest day logged. Don't abuse it 👀");
  };
  const getShameStatus=(id)=>(shameLogs[TODAY]||{})[id]||null;
  const isToday=(h)=>h.scheduledDays.includes(todayDayIdx());
  const mStart=monthStart();
  const mtMisses=(id)=>countMisses(shameLogs,id,mStart);
  const atMisses=(id)=>countMisses(shameLogs,id,"2000-01-01");
  const shameHistory=(id)=>Object.entries(shameLogs).filter(([,l])=>l[id]).map(([dt,l])=>({date:dt,status:l[id]})).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
  const totalMissesToday=shameHabits.filter(h=>isToday(h)&&getShameStatus(h.id)==="missed").length;

  // Modals
  const openModal=(type,data={})=>{setModal(type);setMdata(data);};
  const closeModal=()=>{setModal(null);setMdata({});};
  const addHabit=()=>{if(!mdata.name?.trim())return;setHabits(h=>[...h,{id:`h${Date.now()}`,name:mdata.name.trim(),emoji:mdata.emoji||"✅",streak:0}]);closeModal();};
  const addGoal=()=>{if(!mdata.title?.trim())return;setGoals(g=>[...g,{id:`g${Date.now()}`,title:mdata.title.trim(),category:mdata.category||"Personal",notes:[],createdAt:new Date().toISOString()}]);closeModal();};
  const addWeekNote=()=>{const n={id:Date.now(),text:mdata.note?.trim(),date:new Date().toISOString()};if(!n.text)return;setGoals(g=>g.map(goal=>goal.id===mdata.goalId?{...goal,notes:[...(goal.notes||[]),n]}:goal));closeModal();showToast("Progress logged! 📝");};
  const addEvent=()=>{if(!mdata.title?.trim()||!mdata.date)return;setEvents(e=>[...e,{id:`e${Date.now()}`,title:mdata.title.trim(),date:mdata.date,time:mdata.time||"",emoji:mdata.emoji||"📅",color:mdata.color||"#4ade80",done:false,auto:false}].sort((a,b)=>a.date.localeCompare(b.date)));closeModal();showToast("Event added!");};
  const addReward=()=>{if(!mdata.name?.trim()||!mdata.cost)return;setRewards(r=>[...r,{id:`r${Date.now()}`,name:mdata.name.trim(),cost:parseInt(mdata.cost),emoji:mdata.emoji||"🎁"}]);closeModal();};
  const redeemReward=(rw)=>{if(coins<rw.cost){showToast("Not enough coins!","error");return;}setCoins(c=>c-rw.cost);setConfetti(true);setTimeout(()=>setConfetti(false),1800);showToast(`Redeemed: ${rw.name} 🎉`);};

  // Calendar
  const scheduleTask=()=>{
    const title=taskInput.trim();if(!title){showToast("Type a task first!","error");return;}
    const slot=randomizeTask?findRandomSlot(events,blocked):findSlot(events,blocked);
    if(!slot){showToast("No open slots found!","error");return;}
    setEvents(e=>[...e,{id:`e${Date.now()}`,title,date:slot.date,time:slot.time,emoji:"📋",color:"#fb923c",done:false,auto:true}].sort((a,b)=>a.date.localeCompare(b.date)));
    setTaskInput("");setCalWeek(getMon(slot.date));
    showToast(`Scheduled for ${fmtS(slot.date)} at ${fmt12(slot.time)} ${randomizeTask?"🎲":"📋"}`);
  };
  const markDone=(id)=>{setEvents(e=>e.map(ev=>ev.id===id?{...ev,done:true}:ev));setCoins(c=>c+5);setConfetti(true);setTimeout(()=>setConfetti(false),1500);showToast("+5 coins! Task complete 🎉");setOpenMenu(null);};
  const delEv=(id)=>{setEvents(e=>e.filter(ev=>ev.id!==id));setOpenMenu(null);};
  const startEdit=(ev)=>{setEditingEv(ev.id);setEditTitle(ev.title);setEditTime(ev.time||"");setOpenMenu(null);};
  const saveEdit=(id)=>{setEvents(e=>e.map(ev=>ev.id===id?{...ev,title:editTitle,time:editTime}:ev));setEditingEv(null);};

  // Timesheet
  const getWk=(mon)=>timesheets[mon]||{days:{},paid:false};
  const updDay=(mon,i,f,v)=>setTimesheets(p=>{const wk=p[mon]||{days:{},paid:false};return{...p,[mon]:{...wk,days:{...wk.days,[i]:{...(wk.days[i]||{hours:"",notes:""}),[f]:v}}}};});
  const togglePaid=(mon)=>setTimesheets(p=>{const wk=p[mon]||{days:{},paid:false};const np=!wk.paid;if(np){setConfetti(true);setTimeout(()=>setConfetti(false),1800);showToast("Payday!");}return{...p,[mon]:{...wk,paid:np}};});
  const wkHrs=(mon)=>DAYS.reduce((s,_,i)=>{const h=parseFloat(getWk(mon).days?.[i]?.hours||0);return s+(isNaN(h)?0:h);},0);

  // Case
  const openCase=()=>{
    if(caseState!=="idle")return;if(coins<5){showToast("Need 5 coins!","error");return;}
    setCoins(c=>c-5);const w=rollItem();setReel(buildReel(w));setWinner(w);setCaseState("spinning");setReelOff(0);
    const target=35*ITEM_W+ITEM_W/2-180+Math.floor(Math.random()*80)-40;
    let start=null;const dur=4000;const ease=t=>1-Math.pow(1-t,4);
    function anim(ts){
      if(!start)start=ts;const p=Math.min((ts-start)/dur,1);setReelOff(ease(p)*target);
      if(p<1){animRef.current=requestAnimationFrame(anim);}
      else{setCaseState("reveal");setInventory(inv=>[w,...inv]);if(["pink","red","gold"].includes(w.rarity)){setConfetti(true);setTimeout(()=>setConfetti(false),2500);}showToast(`${w.stattrak?"StatTrak™ ":""}${w.name}!`);}
    }
    animRef.current=requestAnimationFrame(anim);
  };

  // Gym
  const addEx=()=>{
    const name=gymExIn.trim();if(!name)return;
    if(gymSession.find(e=>e.name.toLowerCase()===name.toLowerCase())){showToast("Already added!","error");return;}
    setGymSession(s=>[...s,{name,sets:[{reps:"",weight:""}]}]);setGymExIn("");
  };
  const updSet=(ei,si,f,v)=>setGymSession(s=>s.map((ex,i)=>i!==ei?ex:{...ex,sets:ex.sets.map((st,j)=>j!==si?st:{...st,[f]:v})}));
  const addSet=(ei)=>setGymSession(s=>s.map((ex,i)=>i!==ei?ex:{...ex,sets:[...ex.sets,{reps:"",weight:""}]}));
  const remSet=(ei,si)=>setGymSession(s=>s.map((ex,i)=>i!==ei?ex:{...ex,sets:ex.sets.filter((_,j)=>j!==si)}));
  const remEx=(ei)=>setGymSession(s=>s.filter((_,i)=>i!==ei));
  const saveSession=()=>{
    const clean=gymSession.map(ex=>({...ex,sets:ex.sets.filter(s=>s.reps&&s.weight)})).filter(ex=>ex.sets.length>0);
    if(clean.length===0){showToast("Add reps & weight first!","error");return;}
    setGymLogs(l=>[{id:`gym${Date.now()}`,date:gymDate,exercises:clean},...l].sort((a,b)=>b.date.localeCompare(a.date)));
    setGymSession([]);setGymDate(todayKey());setConfetti(true);setTimeout(()=>setConfetti(false),1500);showToast(`Workout logged! ${clean.length} exercise${clean.length>1?"s":""} 💪`);
  };
  const allExNames=()=>{const n=new Set();gymLogs.forEach(l=>l.exercises.forEach(e=>n.add(e.name)));return[...n].sort();};
  const mkKey=d=>d.slice(0,7);
  const getProgress=(name)=>{
    const bm={};
    gymLogs.forEach(log=>{
      const ex=log.exercises.find(e=>e.name.toLowerCase()===name.toLowerCase());if(!ex)return;
      const mk=mkKey(log.date);
      const mw=Math.max(...ex.sets.map(s=>parseFloat(s.weight)||0));
      const vol=ex.sets.reduce((s,st)=>(parseFloat(st.reps)||0)*(parseFloat(st.weight)||0)+s,0);
      if(!bm[mk]){bm[mk]={maxWeight:mw,volume:vol,month:mk};}
      else{if(mw>bm[mk].maxWeight)bm[mk].maxWeight=mw;bm[mk].volume+=vol;}
    });
    return Object.values(bm).sort((a,b)=>a.month.localeCompare(b.month));
  };
  const getPR=(name)=>{let pr=0;gymLogs.forEach(l=>{const ex=l.exercises.find(e=>e.name.toLowerCase()===name.toLowerCase());if(ex)ex.sets.forEach(s=>{const w=parseFloat(s.weight)||0;if(w>pr)pr=w;});});return pr;};
  const getExHist=(name)=>gymLogs.filter(l=>l.exercises.some(e=>e.name.toLowerCase()===name.toLowerCase())).map(l=>({date:l.date,sets:l.exercises.find(e=>e.name.toLowerCase()===name.toLowerCase()).sets})).slice(0,10);
  const fmtMon=(mk)=>{const[y,m]=mk.split("-");return new Date(parseInt(y),parseInt(m)-1,1).toLocaleDateString("en-US",{month:"short",year:"numeric"});};

  const filtInv=invFilter==="all"?inventory:invFilter==="stattrak"?inventory.filter(i=>i.stattrak):inventory.filter(i=>i.rarity===invFilter);
  const upcoming=events.filter(e=>e.date>=TODAY&&!e.done).slice(0,3);
  const tsData=getWk(tsWeek);const tsTotal=wkHrs(tsWeek);const isCurWk=tsWeek===getMon(new Date());
  const SSS={done:{bg:"rgba(74,222,128,0.15)",bd:"rgba(74,222,128,0.5)",c:"#4ade80"},rest:{bg:"rgba(250,204,21,0.12)",bd:"rgba(250,204,21,0.4)",c:"#facc15"},missed:{bg:"rgba(239,68,68,0.15)",bd:"rgba(239,68,68,0.5)",c:"#ef4444"},null:{bg:"rgba(255,255,255,0.04)",bd:"rgba(255,255,255,0.1)",c:"#888"}};

  return (
    <div onClick={()=>setOpenMenu(null)} style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f0c29,#1a1a3e,#0f0c29)",fontFamily:"Georgia,serif",color:"#e8e0ff",position:"relative"}}>
      {/* Stars */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        {[...Array(25)].map((_,i)=>(
          <div key={i} style={{position:"absolute",width:2,height:2,borderRadius:"50%",background:"white",opacity:0.3,left:`${(i*37)%100}%`,top:`${(i*53)%100}%`}}/>
        ))}
      </div>

      {/* Confetti */}
      {confetti && (
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999}}>
          {[...Array(20)].map((_,i)=>(
            <div key={i} style={{position:"absolute",left:`${(i*17)%100}%`,top:`${(i*13)%60}%`,width:10,height:10,borderRadius:i%2===0?"50%":"2px",background:["#facc15","#4ade80","#60a5fa","#f472b6","#fb923c"][i%5],animation:"fall 1.6s ease-out forwards",animationDelay:`${(i*0.05).toFixed(2)}s`}}/>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.type==="error"?"#ef4444":toast.type==="shame"?"#1a0a0a":"#4ade80",color:toast.type==="shame"?"#ef4444":"#000",border:toast.type==="shame"?"2px solid #ef4444":"none",padding:"10px 22px",borderRadius:30,fontWeight:"bold",fontSize:14,zIndex:1000,boxShadow:"0 4px 24px rgba(0,0,0,0.5)",maxWidth:"90vw",textAlign:"center",animation:"slideDown 0.3s ease"}}>
          {toast.msg}
        </div>
      )}

      <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"0 0 80px 0"}}>
        {/* Header */}
        <div style={{padding:"28px 20px 0",textAlign:"center"}}>
          <div style={{fontSize:11,letterSpacing:4,color:"#a78bfa",textTransform:"uppercase",marginBottom:4}}>Your Daily Companion</div>
          <h1 style={{margin:0,fontSize:32,fontWeight:"bold",color:"#fff"}}>Focus<span style={{color:"#a78bfa"}}>Flow</span></h1>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:12,flexWrap:"wrap"}}>
            <div style={{background:"rgba(167,139,250,0.15)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:20,padding:"6px 18px",fontSize:14}}>{COIN} <strong style={{color:"#facc15"}}>{coins}</strong> coins</div>
            <div style={{background:"rgba(74,222,128,0.12)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:20,padding:"6px 18px",fontSize:14}}>{allDone?"🔥 All done!":`✅ ${todayDone.length}/${habits.length} today`}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",margin:"16px 16px 0",background:"rgba(255,255,255,0.05)",borderRadius:16,padding:4,gap:2,overflowX:"auto",scrollbarWidth:"none"}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:"0 0 auto",padding:"10px 12px",border:"none",borderRadius:12,cursor:"pointer",background:tab===t?"rgba(167,139,250,0.9)":"transparent",color:tab===t?"#0f0c29":"#a78bfa",fontWeight:tab===t?"bold":"normal",fontSize:12,fontFamily:"inherit",whiteSpace:"nowrap"}}>
              {t}
            </button>
          ))}
        </div>

        <div style={{padding:"16px 16px 0"}}>

          {/* TODAY */}
          {tab==="Today" && (
            <div>
              <div style={{fontSize:12,color:"#a78bfa",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>
                {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
              </div>

              {/* Daily bonus */}
              <button onClick={claimBonus} disabled={!canBonus} style={{width:"100%",marginBottom:16,padding:"14px 20px",borderRadius:16,border:`2px solid ${canBonus?"#facc15":"rgba(255,255,255,0.08)"}`,background:canBonus?"rgba(250,204,21,0.1)":"rgba(255,255,255,0.03)",cursor:canBonus?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"inherit"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:28}}>{canBonus?"🎁":"🔒"}</span>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontWeight:"bold",fontSize:15,color:canBonus?"#facc15":"#555"}}>Daily Login Bonus</div>
                    <div style={{fontSize:12,color:canBonus?"#a78bfa":"#444"}}>{canBonus?"Tap to claim +5 coins!":`Next bonus in ${bonusCD()}`}</div>
                  </div>
                </div>
                {canBonus && <div style={{background:"#facc15",color:"#000",fontWeight:"bold",fontSize:14,borderRadius:10,padding:"6px 14px"}}>+5 {COIN}</div>}
              </button>

              {/* Login streak */}
              <div style={{display:"flex",alignItems:"center",gap:12,background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:14,padding:"10px 16px",marginBottom:16}}>
                <span style={{fontSize:24}}>📅</span>
                <div>
                  <div style={{fontWeight:"bold",fontSize:15,color:"#a78bfa"}}>{loginStreak.count} day login streak</div>
                  <div style={{fontSize:12,color:"#666"}}>{loginStreak.count>=7?"🔥 On fire! Keep it going!":loginStreak.count>=3?"💪 Building momentum!":"Open the app every day to build your streak"}</div>
                </div>
              </div>

              {allDone && <div style={{background:"linear-gradient(90deg,rgba(74,222,128,0.2),rgba(167,139,250,0.2))",border:"1px solid #4ade80",borderRadius:16,padding:"14px 18px",marginBottom:16,textAlign:"center"}}>🎉 <strong>All habits complete!</strong></div>}

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontWeight:"bold",fontSize:16}}>Daily Habits</span>
                <button onClick={()=>openModal("habit")} style={AB()}>+ Add</button>
              </div>

              {habits.map(h=>{
                const done=todayDone.includes(h.id);
                return (
                  <div key={h.id} style={{display:"flex",alignItems:"center",gap:14,background:done?"rgba(74,222,128,0.12)":"rgba(239,68,68,0.1)",border:`1px solid ${done?"rgba(74,222,128,0.4)":"rgba(239,68,68,0.4)"}`,borderRadius:16,padding:"14px 16px",marginBottom:10}}>
                    <button onClick={()=>toggleHabit(h.id)} style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${done?"#4ade80":"#ef4444"}`,background:done?"#4ade80":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{done?"✓":""}</button>
                    <span style={{fontSize:22}}>{h.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:"bold",textDecoration:done?"line-through":"none",opacity:done?0.7:1}}>{h.name}</div>
                      <div style={{fontSize:12,color:done?"#4ade80":"#ef4444"}}>{done?"Done today":"Not done yet"} · 🔥 {h.streak} day streak</div>
                    </div>
                    <button onClick={()=>setHabits(hs=>hs.filter(hb=>hb.id!==h.id))} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:16}}>×</button>
                  </div>
                );
              })}

              {/* Accountability */}
              <div style={{marginTop:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontWeight:"bold",fontSize:16}}>💀 Accountability</span>
                    {totalMissesToday>0 && <div style={{background:"#ef4444",color:"#fff",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:"bold"}}>{totalMissesToday} miss{totalMissesToday>1?"es":""} today</div>}
                  </div>
                  <button onClick={()=>openModal("shameHabit")} style={AB()}>+ Add</button>
                </div>

                {shameHabits.length===0 && <div style={{textAlign:"center",color:"#444",fontSize:13,fontStyle:"italic",padding:"16px 0"}}>No accountability habits yet.</div>}

                {shameHabits.map(h=>{
                  const sched=isToday(h);const status=getShameStatus(h.id);
                  const ss=SSS[status]||SSS["null"];
                  const mt=mtMisses(h.id);const at=atMisses(h.id);
                  return (
                    <div key={h.id} style={{background:sched?ss.bg:"rgba(255,255,255,0.03)",border:`1px solid ${sched?ss.bd:"rgba(255,255,255,0.07)"}`,borderRadius:16,padding:"14px 16px",marginBottom:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <span style={{fontSize:22}}>{h.emoji}</span>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontWeight:"bold",fontSize:15}}>{h.name}</span>
                            {!sched && <span style={{fontSize:11,color:"#555",background:"rgba(255,255,255,0.06)",borderRadius:6,padding:"1px 7px"}}>Not today</span>}
                          </div>
                          <div style={{fontSize:11,color:"#666",marginTop:2}}>Days: {h.scheduledDays.length>0?h.scheduledDays.map(d=>DS[d]).join(", "):"None set"}</div>
                          <div style={{display:"flex",gap:10,marginTop:4}}>
                            <span style={{fontSize:11,color:mt>0?"#ef4444":"#555"}}>📅 {mt} miss{mt!==1?"es":""} this month</span>
                            <span style={{fontSize:11,color:at>3?"#ef4444":"#555"}}>☠️ {at} all time</span>
                          </div>
                        </div>
                        <button onClick={()=>setShameDetail(h.id)} style={{background:"none",border:"1px solid rgba(255,255,255,0.12)",color:"#666",borderRadius:8,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>History</button>
                        <button onClick={()=>setShameHabits(hs=>hs.filter(hh=>hh.id!==h.id))} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:16}}>×</button>
                      </div>
                      {sched && (
                        <div style={{display:"flex",gap:8,marginTop:12}}>
                          {["done","rest","missed"].map(s=>{
                            const labels={done:"✅ Done",rest:"😴 Rest",missed:"💀 Missed"};
                            const colors={done:"#4ade80",rest:"#facc15",missed:"#ef4444"};
                            const active=status===s;
                            return (
                              <button key={s} onClick={()=>setShameStatus(h.id,s)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:`2px solid ${active?colors[s]:"rgba(255,255,255,0.1)"}`,background:active?`${colors[s]}22`:"transparent",color:active?colors[s]:"#555",fontSize:12,fontWeight:active?"bold":"normal",cursor:"pointer",fontFamily:"inherit"}}>
                                {labels[s]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Upcoming events */}
              {upcoming.length>0 && (
                <div style={{marginTop:20}}>
                  <div style={{fontWeight:"bold",fontSize:16,marginBottom:10}}>📅 Coming Up</div>
                  {upcoming.map(ev=>(
                    <div key={ev.id} style={{display:"flex",gap:12,alignItems:"center",background:"rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 14px",marginBottom:8,borderLeft:`3px solid ${ev.color}`}}>
                      <span style={{fontSize:20}}>{ev.emoji}</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:"bold",fontSize:14}}>{ev.title}</div>
                        <div style={{fontSize:12,color:"#a78bfa"}}>{fmtS(ev.date)}{ev.time?` · ${fmt12(ev.time)}`:""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GOALS */}
          {tab==="Goals" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:"bold",fontSize:18}}>My Goals</span>
                <button onClick={()=>openModal("goal")} style={AB()}>+ New Goal</button>
              </div>
              {goals.map(goal=>(
                <div key={goal.id} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:18,padding:16,marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontWeight:"bold",fontSize:17}}>{goal.title}</div>
                      <div style={{fontSize:12,color:"#a78bfa",marginTop:2}}><span style={{background:"rgba(167,139,250,0.2)",borderRadius:8,padding:"2px 8px"}}>{goal.category}</span> · {fmtS(goal.createdAt)}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>openModal("weekNote",{goalId:goal.id,goalTitle:goal.title})} style={AB("small")}>+ Log</button>
                      <button onClick={()=>setGoals(g=>g.filter(gg=>gg.id!==goal.id))} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:18}}>×</button>
                    </div>
                  </div>
                  {goal.notes?.length>0 ? (
                    <div style={{marginTop:12}}>
                      <div style={{fontSize:12,color:"#a78bfa",marginBottom:6}}>PROGRESS LOG</div>
                      {[...goal.notes].reverse().slice(0,3).map(n=>(
                        <div key={n.id} style={{background:"rgba(167,139,250,0.1)",borderRadius:10,padding:"8px 12px",marginBottom:6,fontSize:13}}>
                          <div style={{color:"#a78bfa",fontSize:11,marginBottom:2}}>{fmtS(n.date)}</div>
                          {n.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{marginTop:10,fontSize:13,color:"#555",fontStyle:"italic"}}>No progress logged yet.</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CALENDAR */}
          {tab==="Calendar" && (
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <button onClick={()=>setCalWeek(w=>addDays(w,-7))} style={NB()}>Prev</button>
                <div style={{textAlign:"center",flex:1,padding:"0 8px"}}>
                  <div style={{fontWeight:"bold",fontSize:14}}>{fmtR(calWeek)}</div>
                  {calWeek===getMon(new Date()) && <div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>THIS WEEK</div>}
                </div>
                <button onClick={()=>setCalWeek(w=>addDays(w,7))} style={NB()}>Next</button>
              </div>

              {/* Smart scheduler */}
              <div style={{background:"rgba(251,146,60,0.08)",border:"1px solid rgba(251,146,60,0.3)",borderRadius:16,padding:14,marginBottom:14}}>
                <div style={{fontSize:12,color:"#fb923c",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>📋 Schedule a Task</div>
                <div style={{display:"flex",gap:8}}>
                  <input value={taskInput} onChange={e=>setTaskInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&scheduleTask()} placeholder="e.g. Reconnect subwoofer in car..." style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1px solid rgba(251,146,60,0.4)",background:"rgba(255,255,255,0.06)",color:"#e8e0ff",fontSize:14,fontFamily:"inherit",outline:"none"}}/>
                  <button onClick={scheduleTask} style={{padding:"10px 16px",borderRadius:12,border:"none",background:"#fb923c",color:"#000",fontWeight:"bold",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Schedule</button>
                </div>
                <div style={{fontSize:11,color:"#666",marginTop:6}}>Next open weekday slot after {fmt12(blocked.workEnd)} · no weekends · nothing after {fmt12(blocked.dayEnd)}</div>
                {/* Randomize toggle */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10,padding:"10px 12px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:`1px solid ${randomizeTask?"rgba(251,146,60,0.4)":"rgba(255,255,255,0.08)"}`}}>
                  <button onClick={()=>setRandomizeTask(r=>!r)} style={{width:22,height:22,borderRadius:6,border:`2px solid ${randomizeTask?"#fb923c":"rgba(255,255,255,0.2)"}`,background:randomizeTask?"#fb923c":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#000"}}>
                    {randomizeTask?"✓":""}
                  </button>
                  <div>
                    <div style={{fontSize:13,color:randomizeTask?"#fb923c":"#888",fontWeight:randomizeTask?"bold":"normal"}}>🎲 Randomize day & time</div>
                    <div style={{fontSize:11,color:"#555",marginTop:1}}>Spreads tasks across random slots within the next 7 days</div>
                  </div>
                </div>
                <button onClick={()=>setShowBlocked(s=>!s)} style={{background:"none",border:"none",color:"#fb923c",fontSize:11,cursor:"pointer",fontFamily:"inherit",marginTop:4,padding:0,textDecoration:"underline"}}>{showBlocked?"Hide":"Edit"} blocked times</button>
                {showBlocked && (
                  <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={{...LS,color:"#fb923c"}}>Work ends</label>
                      <input type="time" value={blocked.workEnd} onChange={e=>setBlocked(b=>({...b,workEnd:e.target.value}))} style={{...IS,fontSize:13,padding:"8px 10px"}}/>
                    </div>
                    <div>
                      <label style={{...LS,color:"#fb923c"}}>Day ends</label>
                      <input type="time" value={blocked.dayEnd} onChange={e=>setBlocked(b=>({...b,dayEnd:e.target.value}))} style={{...IS,fontSize:13,padding:"8px 10px"}}/>
                    </div>
                    <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:10}}>
                      <button onClick={()=>setBlocked(b=>({...b,blockWeekends:!b.blockWeekends}))} style={{width:22,height:22,borderRadius:6,border:`2px solid ${blocked.blockWeekends?"#fb923c":"rgba(255,255,255,0.2)"}`,background:blocked.blockWeekends?"#fb923c":"transparent",cursor:"pointer",flexShrink:0}}/>
                      <span style={{fontSize:13}}>Block weekends</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
                <button onClick={()=>openModal("event")} style={AB()}>+ Manual Event</button>
              </div>

              {DS.map((ds,i)=>{
                const dateIso=addDays(calWeek,i);const isToday=dateIso===TODAY;const isPast=dateIso<TODAY;
                const dayEvs=events.filter(ev=>ev.date===dateIso).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
                return (
                  <div key={i} style={{background:isToday?"rgba(167,139,250,0.12)":isPast?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)",border:`1px solid ${isToday?"rgba(167,139,250,0.5)":"rgba(255,255,255,0.08)"}`,borderRadius:16,padding:"12px 14px",marginBottom:10,opacity:isPast?0.65:1}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:dayEvs.length>0?10:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:"50%",background:isToday?"#a78bfa":"rgba(255,255,255,0.07)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <div style={{fontSize:9,color:isToday?"#0f0c29":"#a78bfa",fontWeight:"bold"}}>{ds.toUpperCase()}</div>
                          <div style={{fontSize:14,fontWeight:"bold",color:isToday?"#0f0c29":"#e8e0ff"}}>{new Date(dateIso+"T12:00:00").getDate()}</div>
                        </div>
                        <span style={{fontSize:12,color:"#a78bfa"}}>{isToday?"Today":dayEvs.length>0?`${dayEvs.length} event${dayEvs.length>1?"s":""}`:""}</span>
                      </div>
                      <button onClick={()=>openModal("event",{date:dateIso})} style={{background:"none",border:"1px solid rgba(167,139,250,0.3)",color:"#a78bfa",borderRadius:8,padding:"3px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+</button>
                    </div>
                    {dayEvs.map(ev=>(
                      <div key={ev.id} style={{background:ev.done?"rgba(74,222,128,0.08)":ev.auto?"rgba(251,146,60,0.1)":"rgba(255,255,255,0.06)",borderLeft:`3px solid ${ev.done?"#4ade80":ev.color}`,borderRadius:10,padding:"8px 12px",marginBottom:6,opacity:ev.done?0.6:1,position:"relative"}}>
                        {editingEv===ev.id ? (
                          <div>
                            <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} style={{...IS,fontSize:13,padding:"6px 10px",marginBottom:6}}/>
                            <div style={{display:"flex",gap:8,alignItems:"center"}}>
                              <input type="time" value={editTime} onChange={e=>setEditTime(e.target.value)} style={{...IS,width:"auto",fontSize:13,padding:"6px 10px"}}/>
                              <button onClick={()=>saveEdit(ev.id)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:"#a78bfa",color:"#000",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Save</button>
                              <button onClick={()=>setEditingEv(null)} style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"none",color:"#888",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:16}}>{ev.done?"✅":ev.emoji}</span>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:"bold",fontSize:14,textDecoration:ev.done?"line-through":"none"}}>{ev.title}</div>
                              <div style={{fontSize:12,color:ev.auto?"#fb923c":"#a78bfa"}}>
                                {ev.time && `🕐 ${fmt12(ev.time)}`}
                                {ev.auto && <span style={{marginLeft:6,fontSize:10,background:"rgba(251,146,60,0.2)",borderRadius:4,padding:"1px 6px"}}>auto</span>}
                              </div>
                            </div>
                            {!ev.done && (
                              <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
                                <button onClick={()=>setOpenMenu(openMenu===ev.id?null:ev.id)} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:18,padding:"2px 6px"}}>...</button>
                                {openMenu===ev.id && (
                                  <div style={{position:"absolute",right:0,top:"100%",marginTop:4,background:"#1a1a3e",border:"1px solid rgba(167,139,250,0.4)",borderRadius:12,padding:"6px 0",zIndex:100,minWidth:150,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
                                    <button onClick={()=>markDone(ev.id)} style={{display:"block",width:"100%",padding:"9px 16px",background:"none",border:"none",color:"#4ade80",cursor:"pointer",fontFamily:"inherit",fontSize:13,textAlign:"left"}}>Mark done +5 coins</button>
                                    <button onClick={()=>startEdit(ev)} style={{display:"block",width:"100%",padding:"9px 16px",background:"none",border:"none",color:"#a78bfa",cursor:"pointer",fontFamily:"inherit",fontSize:13,textAlign:"left"}}>Edit</button>
                                    <button onClick={()=>delEv(ev.id)} style={{display:"block",width:"100%",padding:"9px 16px",background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontFamily:"inherit",fontSize:13,textAlign:"left"}}>Delete</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* TIMESHEET */}
          {tab==="Timesheet" && (
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <button onClick={()=>setTsWeek(w=>addDays(w,-7))} style={NB()}>Prev</button>
                <div style={{textAlign:"center",flex:1,padding:"0 10px"}}>
                  <div style={{fontWeight:"bold",fontSize:14}}>{fmtR(tsWeek)}</div>
                  {isCurWk && <div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>CURRENT WEEK</div>}
                </div>
                <button onClick={()=>setTsWeek(w=>addDays(w,7))} style={NB()}>Next</button>
              </div>
              <div style={{display:"flex",gap:10,marginBottom:16}}>
                <div style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"14px 16px",textAlign:"center"}}>
                  <div style={{fontSize:26,fontWeight:"bold",color:"#facc15"}}>{tsTotal.toFixed(1)}</div>
                  <div style={{fontSize:12,color:"#a78bfa"}}>Total Hours</div>
                </div>
                <button onClick={()=>togglePaid(tsWeek)} style={{flex:1,borderRadius:14,border:`2px solid ${tsData.paid?"#4ade80":"rgba(255,255,255,0.15)"}`,background:tsData.paid?"rgba(74,222,128,0.2)":"rgba(255,255,255,0.04)",color:tsData.paid?"#4ade80":"#888",fontWeight:"bold",fontSize:16,cursor:"pointer",fontFamily:"inherit",padding:"14px 0"}}>
                  {tsData.paid?"Paid":"Mark Paid"}
                </button>
              </div>
              {DAYS.map((day,i)=>{
                const dateIso=addDays(tsWeek,i);const isToday=dateIso===TODAY;const dd=tsData.days?.[i]||{hours:"",notes:""};
                return (
                  <div key={day} style={{background:isToday?"rgba(167,139,250,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${isToday?"rgba(167,139,250,0.5)":"rgba(255,255,255,0.08)"}`,borderRadius:16,padding:"14px 16px",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                      <div style={{minWidth:70}}>
                        <div style={{fontWeight:"bold",fontSize:14,color:isToday?"#a78bfa":"#e8e0ff"}}>{DS[i]}</div>
                        <div style={{fontSize:11,color:"#a78bfa"}}>{fmtS(dateIso)}</div>
                      </div>
                      <input type="number" min="0" max="24" step="0.5" placeholder="0" value={dd.hours} onChange={e=>updDay(tsWeek,i,"hours",e.target.value)} style={{width:62,padding:"8px 10px",borderRadius:10,border:"1px solid rgba(167,139,250,0.3)",background:"rgba(255,255,255,0.08)",color:"#e8e0ff",fontSize:16,fontFamily:"inherit",outline:"none",textAlign:"center"}}/>
                      <span style={{fontSize:13,color:"#a78bfa"}}>hrs</span>
                      {isToday && <span style={{fontSize:11,background:"rgba(167,139,250,0.3)",borderRadius:6,padding:"2px 8px",color:"#c4b5fd"}}>Today</span>}
                    </div>
                    <textarea placeholder="What did you work on?" value={dd.notes} onChange={e=>updDay(tsWeek,i,"notes",e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#e8e0ff",fontSize:13,fontFamily:"inherit",outline:"none",resize:"none",height:50,boxSizing:"border-box"}}/>
                  </div>
                );
              })}
            </div>
          )}

          {/* GYM */}
          {tab==="Gym" && (
            <div>
              <div style={{display:"flex",gap:8,marginBottom:18}}>
                {["log","progress"].map(v=>(
                  <button key={v} onClick={()=>setGymView(v)} style={{flex:1,padding:"10px 0",borderRadius:12,border:`2px solid ${gymView===v?"#4ade80":"rgba(255,255,255,0.1)"}`,background:gymView===v?"rgba(74,222,128,0.15)":"transparent",color:gymView===v?"#4ade80":"#666",fontWeight:gymView===v?"bold":"normal",cursor:"pointer",fontFamily:"inherit",fontSize:14}}>
                    {v==="log"?"💪 Log Workout":"📈 Progress"}
                  </button>
                ))}
              </div>

              {gymView==="log" && (
                <div>
                  {/* Date picker */}
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:12,color:"#4ade80",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Workout Date</div>
                    <input type="date" value={gymDate} onChange={e=>setGymDate(e.target.value)} style={{...IS,border:"1px solid rgba(74,222,128,0.3)",fontSize:14}}/>
                    {gymDate!==todayKey() && <div style={{fontSize:12,color:"#fb923c",marginTop:6}}>📋 Logging for {fmtS(gymDate)} — backfilling from notes?</div>}
                  </div>

                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:12,color:"#4ade80",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Add Exercise</div>
                    <div style={{display:"flex",gap:8,marginBottom:8}}>
                      <input value={gymExIn} onChange={e=>setGymExIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEx()} placeholder="Exercise name..." style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1px solid rgba(74,222,128,0.3)",background:"rgba(255,255,255,0.06)",color:"#e8e0ff",fontSize:14,fontFamily:"inherit",outline:"none"}}/>
                      <button onClick={addEx} style={{padding:"10px 16px",borderRadius:12,border:"none",background:"#4ade80",color:"#000",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>Add</button>
                    </div>
                    <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",paddingBottom:4}}>
                      {EXERCISES.filter(e=>!gymSession.find(s=>s.name.toLowerCase()===e.toLowerCase())).slice(0,12).map(ex=>(
                        <button key={ex} onClick={()=>setGymExIn(ex)} style={{flexShrink:0,padding:"4px 12px",borderRadius:20,border:"1px solid rgba(74,222,128,0.25)",background:"rgba(74,222,128,0.07)",color:"#4ade80",fontSize:11,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{ex}</button>
                      ))}
                    </div>
                  </div>

                  {gymSession.length===0 && <div style={{textAlign:"center",color:"#444",fontSize:13,fontStyle:"italic",padding:"20px 0"}}>No exercises added yet.</div>}

                  {gymSession.map((ex,ei)=>(
                    <div key={ei} style={{background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:16,padding:"14px 16px",marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                        <div style={{fontWeight:"bold",fontSize:16,color:"#4ade80"}}>{ex.name}</div>
                        <button onClick={()=>remEx(ei)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:18}}>×</button>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"32px 1fr 1fr 32px",gap:6,marginBottom:6}}>
                        <div style={{fontSize:11,color:"#666",textAlign:"center"}}>Set</div>
                        <div style={{fontSize:11,color:"#666",textAlign:"center"}}>Reps</div>
                        <div style={{fontSize:11,color:"#666",textAlign:"center"}}>Weight (lbs)</div>
                        <div/>
                      </div>
                      {ex.sets.map((set,si)=>(
                        <div key={si} style={{display:"grid",gridTemplateColumns:"32px 1fr 1fr 32px",gap:6,marginBottom:6,alignItems:"center"}}>
                          <div style={{fontSize:12,color:"#666",textAlign:"center",fontWeight:"bold"}}>{si+1}</div>
                          <input type="number" min="0" placeholder="10" value={set.reps} onChange={e=>updSet(ei,si,"reps",e.target.value)} style={{padding:"8px 10px",borderRadius:10,border:"1px solid rgba(74,222,128,0.25)",background:"rgba(255,255,255,0.07)",color:"#e8e0ff",fontSize:14,fontFamily:"inherit",outline:"none",textAlign:"center",width:"100%",boxSizing:"border-box"}}/>
                          <input type="number" min="0" step="2.5" placeholder="135" value={set.weight} onChange={e=>updSet(ei,si,"weight",e.target.value)} style={{padding:"8px 10px",borderRadius:10,border:"1px solid rgba(74,222,128,0.25)",background:"rgba(255,255,255,0.07)",color:"#e8e0ff",fontSize:14,fontFamily:"inherit",outline:"none",textAlign:"center",width:"100%",boxSizing:"border-box"}}/>
                          <button onClick={()=>remSet(ei,si)} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:16,textAlign:"center"}}>×</button>
                        </div>
                      ))}
                      <button onClick={()=>addSet(ei)} style={{width:"100%",marginTop:6,padding:"7px 0",borderRadius:10,border:"1px dashed rgba(74,222,128,0.3)",background:"transparent",color:"#4ade80",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>+ Add Set</button>
                    </div>
                  ))}

                  {gymSession.length>0 && (
                    <button onClick={saveSession} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#000",fontWeight:"bold",fontSize:16,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
                      Save Workout
                    </button>
                  )}

                  {gymLogs.length>0 && (
                    <div style={{marginTop:24}}>
                      <div style={{fontSize:12,color:"#4ade80",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Recent Workouts</div>
                      {gymLogs.slice(0,5).map(log=>(
                        <div key={log.id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"12px 14px",marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                            <div style={{fontWeight:"bold",fontSize:14}}>{fmtS(log.date)}</div>
                            <div style={{fontSize:12,color:"#666"}}>{log.exercises.length} exercise{log.exercises.length>1?"s":""}</div>
                          </div>
                          {log.exercises.map((ex,ei)=>{
                            const mw=Math.max(...ex.sets.map(s=>parseFloat(s.weight)||0));
                            const vol=ex.sets.reduce((sum,s)=>(parseFloat(s.reps)||0)*(parseFloat(s.weight)||0)+sum,0);
                            return (
                              <div key={ei} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:ei>0?"1px solid rgba(255,255,255,0.05)":"none"}}>
                                <span style={{fontSize:13,color:"#a78bfa"}}>{ex.name}</span>
                                <span style={{fontSize:12,color:"#888"}}>{ex.sets.length} sets · {mw}lbs max · {vol.toLocaleString()}lbs vol</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {gymView==="progress" && (
                <div>
                  {allExNames().length===0 && <div style={{textAlign:"center",color:"#444",fontSize:13,fontStyle:"italic",padding:"40px 20px"}}>No workouts logged yet. Go to Log Workout to get started!</div>}

                  {gymDetailEx ? (
                    <div>
                      <button onClick={()=>setGymDetailEx(null)} style={{background:"none",border:"none",color:"#4ade80",cursor:"pointer",fontFamily:"inherit",fontSize:14,marginBottom:16,padding:0}}>
                        &larr; Back to all exercises
                      </button>
                      <div style={{fontWeight:"bold",fontSize:20,marginBottom:4}}>{gymDetailEx}</div>
                      <div style={{fontSize:13,color:"#4ade80",marginBottom:16}}>PR: {getPR(gymDetailEx)} lbs</div>

                      {(() => {
                        const prog=getProgress(gymDetailEx);
                        if(prog.length<1)return null;
                        const maxW=Math.max(...prog.map(p=>p.maxWeight));
                        return (
                          <div style={{marginBottom:20}}>
                            <div style={{fontSize:12,color:"#666",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Max Weight by Month</div>
                            {prog.map((p,pi)=>{
                              const prev=prog[pi-1];
                              const diff=prev?p.maxWeight-prev.maxWeight:0;
                              const barW=maxW>0?Math.round((p.maxWeight/maxW)*100):0;
                              return (
                                <div key={p.month} style={{marginBottom:10}}>
                                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                                    <span style={{fontSize:13}}>{fmtMon(p.month)}</span>
                                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                                      {diff!==0 && <span style={{fontSize:12,color:diff>0?"#4ade80":"#ef4444",fontWeight:"bold"}}>{diff>0?"+":""}{diff}lbs</span>}
                                      <span style={{fontSize:13,fontWeight:"bold",color:"#4ade80"}}>{p.maxWeight}lbs</span>
                                    </div>
                                  </div>
                                  <div style={{height:8,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}>
                                    <div style={{height:"100%",width:`${barW}%`,background:"linear-gradient(90deg,#4ade80,#22c55e)",borderRadius:4}}/>
                                  </div>
                                  <div style={{fontSize:11,color:"#555",marginTop:2}}>Volume: {p.volume.toLocaleString()}lbs</div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      <div style={{fontSize:12,color:"#666",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Session History</div>
                      {getExHist(gymDetailEx).map((entry,i)=>(
                        <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                          <div style={{fontWeight:"bold",fontSize:13,color:"#a78bfa",marginBottom:6}}>{fmtS(entry.date)}</div>
                          {entry.sets.map((s,si)=>(
                            <div key={si} style={{display:"flex",gap:16,fontSize:13,color:"#888",padding:"2px 0"}}>
                              <span>Set {si+1}</span>
                              <span>{s.reps} reps</span>
                              <span style={{color:"#4ade80"}}>{s.weight}lbs</span>
                              <span>vol: {(parseFloat(s.reps)||0)*(parseFloat(s.weight)||0)}lbs</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {allExNames().map(name=>{
                        const prog=getProgress(name);
                        const pr=getPR(name);
                        const latest=prog[prog.length-1];
                        const prev=prog[prog.length-2];
                        const diff=latest&&prev?latest.maxWeight-prev.maxWeight:null;
                        return (
                          <button key={name} onClick={()=>setGymDetailEx(name)} style={{width:"100%",background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:16,padding:"14px 16px",marginBottom:10,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                              <div>
                                <div style={{fontWeight:"bold",fontSize:15,color:"#e8e0ff",marginBottom:4}}>{name}</div>
                                <div style={{fontSize:12,color:"#666"}}>{prog.length} month{prog.length!==1?"s":""} · PR: {pr}lbs</div>
                              </div>
                              {diff!==null && (
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontSize:13,fontWeight:"bold",color:diff>0?"#4ade80":diff<0?"#ef4444":"#888"}}>{diff>0?"+":""}{diff}lbs</div>
                                  <div style={{fontSize:10,color:"#555"}}>vs last month</div>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* REWARDS */}
          {tab==="Rewards" && (
            <div>
              <div style={{background:"linear-gradient(135deg,rgba(250,204,21,0.2),rgba(167,139,250,0.2))",border:"1px solid rgba(250,204,21,0.4)",borderRadius:18,padding:20,marginBottom:20,textAlign:"center"}}>
                <div style={{fontSize:40}}>{COIN}</div>
                <div style={{fontSize:36,fontWeight:"bold",color:"#facc15"}}>{coins}</div>
                <div style={{fontSize:14,color:"#a78bfa"}}>coins earned</div>
                <div style={{fontSize:12,color:"#666",marginTop:6}}>+5 per habit · +5 per completed task</div>
              </div>

              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:20,padding:20,marginBottom:24}}>
                <div style={{textAlign:"center",marginBottom:16}}>
                  <div style={{fontSize:26,marginBottom:4}}>🎰</div>
                  <div style={{fontWeight:"bold",fontSize:18}}>FocusFlow Case</div>
                  <div style={{fontSize:12,color:"#a78bfa",marginTop:2}}>5 coins per open</div>
                </div>
                <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap",justifyContent:"center"}}>
                  {RARITIES.map(r=>(
                    <div key={r.id} style={{background:`${r.color}22`,border:`1px solid ${r.color}66`,borderRadius:8,padding:"3px 10px",fontSize:11,color:r.color,fontWeight:"bold"}}>{r.pct}%</div>
                  ))}
                </div>
                {(caseState==="spinning"||caseState==="reveal") && (
                  <div style={{position:"relative",marginBottom:16,overflow:"hidden",borderRadius:12,border:"2px solid rgba(167,139,250,0.4)"}}>
                    <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:3,background:"#facc15",zIndex:10,transform:"translateX(-50%)",boxShadow:"0 0 10px #facc15"}}/>
                    <div style={{position:"absolute",left:0,top:0,bottom:0,width:80,background:"linear-gradient(90deg,#0f0c29,transparent)",zIndex:5}}/>
                    <div style={{position:"absolute",right:0,top:0,bottom:0,width:80,background:"linear-gradient(270deg,#0f0c29,transparent)",zIndex:5}}/>
                    <div style={{display:"flex",gap:6,padding:"8px 6px",transform:`translateX(${-reelOff}px)`,willChange:"transform",width:"fit-content"}}>
                      {reel.map((item,idx)=>(
                        <div key={idx} style={{width:ITEM_W,flexShrink:0,background:`${item.color}22`,border:`2px solid ${item.color}`,borderRadius:12,padding:"10px 8px",textAlign:"center",boxShadow:caseState==="reveal"&&idx===35?`0 0 20px ${item.glow}`:"none"}}>
                          <div style={{fontSize:28}}>{item.emoji}</div>
                          <div style={{fontSize:10,color:item.color,fontWeight:"bold",lineHeight:1.2,marginTop:4}}>{item.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {caseState==="reveal" && winner && (
                  <div style={{background:`linear-gradient(135deg,${winner.color}33,${winner.color}11)`,border:`2px solid ${winner.color}`,borderRadius:16,padding:"16px 20px",marginBottom:16,textAlign:"center",boxShadow:`0 0 30px ${winner.glow}`}}>
                    <div style={{fontSize:40,marginBottom:6}}>{winner.emoji}</div>
                    <div style={{fontWeight:"bold",fontSize:17,color:winner.color}}>{winner.name}</div>
                    {winner.stattrak && <div style={{fontSize:12,color:"#fb923c",fontWeight:"bold",marginTop:4}}>StatTrak</div>}
                    <div style={{fontSize:12,color:"#888",marginTop:4}}>{winner.label}</div>
                  </div>
                )}
                {caseState==="idle" && (
                  <button onClick={openCase} disabled={coins<5} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",background:coins>=5?"linear-gradient(135deg,#f59e0b,#d97706)":"#333",color:coins>=5?"#000":"#666",fontWeight:"bold",fontSize:16,cursor:coins>=5?"pointer":"not-allowed",fontFamily:"inherit"}}>
                    Open Case - 5 coins
                  </button>
                )}
                {caseState==="spinning" && <div style={{textAlign:"center",color:"#a78bfa",fontStyle:"italic",padding:"12px 0"}}>Rolling...</div>}
                {caseState==="reveal" && (
                  <button onClick={openCase} disabled={coins<5} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",background:coins>=5?"linear-gradient(135deg,#f59e0b,#d97706)":"#333",color:coins>=5?"#000":"#666",fontWeight:"bold",fontSize:16,cursor:coins>=5?"pointer":"not-allowed",fontFamily:"inherit"}}>
                    Open Another - 5 coins
                  </button>
                )}
              </div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <span style={{fontWeight:"bold",fontSize:18}}>Daily Killer Sudoku</span>
                <span style={{fontSize:12,color:"#a78bfa"}}>Beat it for +10 {COIN}</span>
              </div>
              <KillerSudoku onWin={()=>{setCoins(c=>c+10);setConfetti(true);setTimeout(()=>setConfetti(false),2500);showToast("Sudoku solved! +10 coins!");}} />
            </div>
          )}

          {/* INVENTORY */}
          {tab==="Inventory" && (
            <div>
              <div style={{fontWeight:"bold",fontSize:18,marginBottom:6}}>My Inventory</div>
              <div style={{fontSize:13,color:"#a78bfa",marginBottom:14}}>{inventory.length} item{inventory.length!==1?"s":""} from cases</div>
              <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",scrollbarWidth:"none",paddingBottom:4}}>
                {[{id:"all",label:"All"},{id:"stattrak",label:"StatTrak"},...RARITIES.map(r=>({id:r.id,label:r.label,color:r.color}))].map(f=>(
                  <button key={f.id} onClick={()=>setInvFilter(f.id)} style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:`1px solid ${invFilter===f.id?(f.color||"#a78bfa"):"rgba(255,255,255,0.1)"}`,background:invFilter===f.id?`${f.color||"#a78bfa"}33`:"transparent",color:invFilter===f.id?(f.color||"#a78bfa"):"#888",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:invFilter===f.id?"bold":"normal"}}>
                    {f.label}
                  </button>
                ))}
              </div>
              {filtInv.length===0 && <div style={{textAlign:"center",color:"#444",padding:"40px 20px",fontStyle:"italic"}}>{inventory.length===0?"No items yet — open some cases!":"No items match this filter."}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {filtInv.map((item,idx)=>(
                  <div key={item.id||idx} style={{background:`${item.color}18`,border:`1.5px solid ${item.color}66`,borderRadius:14,padding:"14px 12px",textAlign:"center",position:"relative"}}>
                    {item.stattrak && <div style={{position:"absolute",top:8,right:8,fontSize:9,color:"#fb923c",fontWeight:"bold",background:"rgba(251,146,60,0.2)",borderRadius:4,padding:"1px 5px"}}>ST</div>}
                    <div style={{fontSize:32,marginBottom:6}}>{item.emoji}</div>
                    <div style={{fontSize:12,fontWeight:"bold",color:item.color,marginBottom:2}}>{item.name}</div>
                    <div style={{fontSize:10,color:"#666",marginTop:4}}>{item.label}</div>
                    {item.openedAt && <div style={{fontSize:10,color:"#444",marginTop:2}}>{fmtS(item.openedAt)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEW */}
          {tab==="Review" && (()=>{
            const weekEnd=addDays(reviewWeek,6);
            const existingReview=weeklyReviews.find(r=>r.weekKey===reviewWeek);
            const isCurrentWeek=reviewWeek===getMon(new Date());
            return (
              <div>
                <div style={{textAlign:"center",marginBottom:20}}>
                  <div style={{fontSize:28,marginBottom:6}}>🤖</div>
                  <div style={{fontWeight:"bold",fontSize:20,marginBottom:4}}>Weekly Review</div>
                  <div style={{fontSize:13,color:"#a78bfa"}}>Your AI coach breaks down how you did</div>
                </div>

                {/* Week selector */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <button onClick={()=>setReviewWeek(w=>addDays(w,-7))} style={NB()}>Prev</button>
                  <div style={{textAlign:"center",flex:1,padding:"0 8px"}}>
                    <div style={{fontWeight:"bold",fontSize:14}}>{fmtS(reviewWeek)} - {fmtS(weekEnd)}</div>
                    {isCurrentWeek && <div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>THIS WEEK</div>}
                  </div>
                  <button onClick={()=>setReviewWeek(w=>addDays(w,7))} style={NB()}>Next</button>
                </div>

                {/* Quick stats for the week */}
                {(()=>{
                  const weekDays=Array.from({length:7},(_,i)=>addDays(reviewWeek,i));
                  const habitDaysCompleted=habits.map(h=>weekDays.filter(d=>(completions[d]||[]).includes(h.id)).length);
                  const totalPossible=habits.length*7;
                  const totalDone=habitDaysCompleted.reduce((a,b)=>a+b,0);
                  const pct=totalPossible>0?Math.round((totalDone/totalPossible)*100):0;
                  const gymCount=gymLogs.filter(l=>l.date>=reviewWeek&&l.date<=weekEnd).length;
                  const missedThisWeek=shameHabits.reduce((sum,h)=>{
                    return sum+weekDays.filter(d=>(shameLogs[d]||{})[h.id]==="missed").length;
                  },0);
                  const evDone=events.filter(e=>e.date>=reviewWeek&&e.date<=weekEnd&&e.done).length;
                  return (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                      <div style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:14,padding:"14px",textAlign:"center"}}>
                        <div style={{fontSize:26,fontWeight:"bold",color:"#a78bfa"}}>{pct}%</div>
                        <div style={{fontSize:11,color:"#888"}}>Habit completion</div>
                      </div>
                      <div style={{background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:14,padding:"14px",textAlign:"center"}}>
                        <div style={{fontSize:26,fontWeight:"bold",color:"#4ade80"}}>{gymCount}</div>
                        <div style={{fontSize:11,color:"#888"}}>Gym sessions</div>
                      </div>
                      <div style={{background:evDone>0?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${evDone>0?"rgba(74,222,128,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:14,padding:"14px",textAlign:"center"}}>
                        <div style={{fontSize:26,fontWeight:"bold",color:evDone>0?"#4ade80":"#555"}}>{evDone}</div>
                        <div style={{fontSize:11,color:"#888"}}>Tasks completed</div>
                      </div>
                      <div style={{background:missedThisWeek>0?"rgba(239,68,68,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${missedThisWeek>0?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:14,padding:"14px",textAlign:"center"}}>
                        <div style={{fontSize:26,fontWeight:"bold",color:missedThisWeek>0?"#ef4444":"#555"}}>{missedThisWeek}</div>
                        <div style={{fontSize:11,color:"#888"}}>Accountability misses</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Generate / show review */}
                {existingReview ? (
                  <div>
                    <div style={{background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:18,padding:20,marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                        <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#a78bfa,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🤖</div>
                        <div>
                          <div style={{fontWeight:"bold",fontSize:14,color:"#a78bfa"}}>Your AI Coach</div>
                          <div style={{fontSize:11,color:"#555"}}>Generated {fmtS(existingReview.generatedAt)}</div>
                        </div>
                      </div>
                      <div style={{fontSize:14,lineHeight:1.7,color:"#e8e0ff",whiteSpace:"pre-wrap"}}>{existingReview.review}</div>
                    </div>
                    <button onClick={()=>generateReview(reviewWeek)} disabled={reviewLoading} style={{width:"100%",padding:"12px 0",borderRadius:14,border:"1px solid rgba(167,139,250,0.3)",background:"transparent",color:"#a78bfa",fontSize:14,cursor:reviewLoading?"wait":"pointer",fontFamily:"inherit"}}>
                      {reviewLoading?"Generating...":"Regenerate Review"}
                    </button>
                  </div>
                ) : (
                  <div style={{textAlign:"center"}}>
                    <div style={{color:"#555",fontSize:13,marginBottom:20,lineHeight:1.6}}>
                      {isCurrentWeek
                        ? "Ready to see how your week went? Tap below and your AI coach will give you a full breakdown based on your actual data."
                        : "No review generated for this week yet. Tap below to generate one."}
                    </div>
                    <button onClick={()=>generateReview(reviewWeek)} disabled={reviewLoading} style={{width:"100%",padding:"16px 0",borderRadius:14,border:"none",background:reviewLoading?"#333":"linear-gradient(135deg,#a78bfa,#7c3aed)",color:reviewLoading?"#666":"#fff",fontWeight:"bold",fontSize:16,cursor:reviewLoading?"wait":"pointer",fontFamily:"inherit"}}>
                      {reviewLoading ? (
                        "Analyzing your week..."
                      ) : (
                        "Generate My Weekly Review"
                      )}
                    </button>
                    {reviewLoading && <div style={{fontSize:12,color:"#a78bfa",marginTop:12,fontStyle:"italic"}}>Your coach is looking at your habits, gym sessions, goals, and accountability data...</div>}
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>

      {/* Shame detail modal */}
      {shameDetail && (()=>{
        const h=shameHabits.find(x=>x.id===shameDetail);
        if(!h)return null;
        const hist=shameHistory(h.id);const mt=mtMisses(h.id);const at=atMisses(h.id);
        return (
          <div onClick={()=>setShameDetail(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(180deg,#1a0a0a,#0f0c29)",border:"2px solid rgba(239,68,68,0.4)",borderRadius:"24px 24px 0 0",padding:24,width:"100%",maxWidth:480,maxHeight:"80vh",overflowY:"auto"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                <span style={{fontSize:28}}>{h.emoji}</span>
                <div>
                  <div style={{fontWeight:"bold",fontSize:18}}>{h.name}</div>
                  <div style={{fontSize:12,color:"#a78bfa"}}>Days: {h.scheduledDays.map(d=>DS[d]).join(", ")||"None"}</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                <div style={{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:14,padding:14,textAlign:"center"}}>
                  <div style={{fontSize:28,fontWeight:"bold",color:"#ef4444"}}>{mt}</div>
                  <div style={{fontSize:12,color:"#888"}}>This month</div>
                </div>
                <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:14,padding:14,textAlign:"center"}}>
                  <div style={{fontSize:28,fontWeight:"bold",color:"#ef4444"}}>{at}</div>
                  <div style={{fontSize:12,color:"#888"}}>All time</div>
                </div>
              </div>
              {at>0 && <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:12,padding:"12px 16px",marginBottom:20,textAlign:"center",fontSize:14,color:"#ef4444",fontStyle:"italic"}}>{at>=10?`${at} misses. Absolutely disgusting.`:at>=5?`${at} misses? Come on.`:"You're building a bad reputation."}</div>}
              <div style={{fontSize:12,color:"#a78bfa",marginBottom:10}}>RECENT HISTORY</div>
              {hist.length===0 && <div style={{color:"#444",fontSize:13,fontStyle:"italic",textAlign:"center",padding:"16px 0"}}>No history yet.</div>}
              {hist.map(({date,status})=>(
                <div key={date} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:10,marginBottom:6}}>
                  <span style={{fontSize:13,color:"#888"}}>{fmtS(date)}</span>
                  <span style={{fontSize:13,fontWeight:"bold",color:status==="missed"?"#ef4444":status==="done"?"#4ade80":"#facc15"}}>{status==="done"?"Done":status==="rest"?"Rest":"Missed"}</span>
                </div>
              ))}
              <button onClick={()=>setShameDetail(null)} style={{width:"100%",marginTop:16,background:"none",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 0",color:"#888",cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Close</button>
            </div>
          </div>
        );
      })()}

      {/* Modals */}
      {modal && (
        <div onClick={closeModal} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(180deg,#1a1a3e,#0f0c29)",border:"1px solid rgba(167,139,250,0.4)",borderRadius:"24px 24px 0 0",padding:24,width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto"}}>

            {modal==="shameHabit" && (
              <div>
                <h3 style={{margin:"0 0 4px",fontSize:20}}>Add Accountability Habit</h3>
                <div style={{fontSize:13,color:"#a78bfa",marginBottom:16}}>This will shame you when you miss it.</div>
                <div style={{marginBottom:12}}>
                  <label style={LS}>Habit name</label>
                  <input style={IS} placeholder="e.g. Go to the gym" value={mdata.name||""} onChange={e=>setMdata(d=>({...d,name:e.target.value}))}/>
                </div>
                <div style={{marginBottom:12}}>
                  <label style={LS}>Emoji</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:6}}>
                    {EOPT.map(em=>(
                      <button key={em} onClick={()=>setMdata(d=>({...d,emoji:em}))} style={{fontSize:22,background:mdata.emoji===em?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.05)",border:`1px solid ${mdata.emoji===em?"#a78bfa":"transparent"}`,borderRadius:10,padding:"6px 10px",cursor:"pointer"}}>{em}</button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={LS}>Which days?</label>
                  <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                    {DS.map((d,i)=>{
                      const sel=(mdata.scheduledDays||[]).includes(i);
                      return (
                        <button key={i} onClick={()=>{const cur=mdata.scheduledDays||[];setMdata(dd=>({...dd,scheduledDays:sel?cur.filter(x=>x!==i):[...cur,i]}));}} style={{padding:"8px 12px",borderRadius:10,border:`2px solid ${sel?"#a78bfa":"rgba(255,255,255,0.12)"}`,background:sel?"rgba(167,139,250,0.3)":"transparent",color:sel?"#a78bfa":"#666",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button onClick={addShameHabit} style={PB()}>Add Accountability Habit</button>
              </div>
            )}

            {modal==="habit" && (
              <div>
                <h3 style={{margin:"0 0 16px",fontSize:20}}>New Daily Habit</h3>
                <div style={{marginBottom:12}}>
                  <label style={LS}>Habit name</label>
                  <input style={IS} placeholder="e.g. Drink 8 glasses of water" value={mdata.name||""} onChange={e=>setMdata(d=>({...d,name:e.target.value}))}/>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={LS}>Emoji</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:6}}>
                    {EOPT.map(em=>(
                      <button key={em} onClick={()=>setMdata(d=>({...d,emoji:em}))} style={{fontSize:22,background:mdata.emoji===em?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.05)",border:`1px solid ${mdata.emoji===em?"#a78bfa":"transparent"}`,borderRadius:10,padding:"6px 10px",cursor:"pointer"}}>{em}</button>
                    ))}
                  </div>
                </div>
                <button onClick={addHabit} style={PB()}>Add Habit</button>
              </div>
            )}

            {modal==="goal" && (
              <div>
                <h3 style={{margin:"0 0 16px",fontSize:20}}>New Goal</h3>
                <div style={{marginBottom:12}}>
                  <label style={LS}>Goal title</label>
                  <input style={IS} placeholder="e.g. Run a 5K this year" value={mdata.title||""} onChange={e=>setMdata(d=>({...d,title:e.target.value}))}/>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={LS}>Category</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:6}}>
                    {GCATS.map(cat=>(
                      <button key={cat} onClick={()=>setMdata(d=>({...d,category:cat}))} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:13,background:mdata.category===cat?"#a78bfa":"rgba(255,255,255,0.08)",color:mdata.category===cat?"#000":"#e8e0ff",fontFamily:"inherit"}}>{cat}</button>
                    ))}
                  </div>
                </div>
                <button onClick={addGoal} style={PB()}>Add Goal</button>
              </div>
            )}

            {modal==="weekNote" && (
              <div>
                <h3 style={{margin:"0 0 4px",fontSize:20}}>Log Progress</h3>
                <div style={{color:"#a78bfa",fontSize:14,marginBottom:16}}>{mdata.goalTitle}</div>
                <div style={{marginBottom:16}}>
                  <label style={LS}>What did you do this week?</label>
                  <textarea style={{...IS,height:120,resize:"none"}} placeholder="e.g. Went to the gym 3 times..." value={mdata.note||""} onChange={e=>setMdata(d=>({...d,note:e.target.value}))}/>
                </div>
                <button onClick={addWeekNote} style={PB()}>Save Progress</button>
              </div>
            )}

            {modal==="event" && (
              <div>
                <h3 style={{margin:"0 0 16px",fontSize:20}}>New Event</h3>
                <div style={{marginBottom:12}}>
                  <label style={LS}>Title</label>
                  <input style={IS} placeholder="e.g. Doctor's appointment" value={mdata.title||""} onChange={e=>setMdata(d=>({...d,title:e.target.value}))}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div>
                    <label style={LS}>Date</label>
                    <input type="date" style={IS} value={mdata.date||""} onChange={e=>setMdata(d=>({...d,date:e.target.value}))}/>
                  </div>
                  <div>
                    <label style={LS}>Time</label>
                    <input type="time" style={IS} value={mdata.time||""} onChange={e=>setMdata(d=>({...d,time:e.target.value}))}/>
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  <label style={LS}>Emoji</label>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
                    {EVEM.map(em=>(
                      <button key={em} onClick={()=>setMdata(d=>({...d,emoji:em}))} style={{fontSize:20,background:mdata.emoji===em?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.05)",border:`1px solid ${mdata.emoji===em?"#a78bfa":"transparent"}`,borderRadius:8,padding:"5px 8px",cursor:"pointer"}}>{em}</button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={LS}>Color</label>
                  <div style={{display:"flex",gap:8,marginTop:6}}>
                    {EVCOL.map(col=>(
                      <button key={col} onClick={()=>setMdata(d=>({...d,color:col}))} style={{width:28,height:28,borderRadius:"50%",background:col,border:mdata.color===col?"3px solid white":"3px solid transparent",cursor:"pointer"}}/>
                    ))}
                  </div>
                </div>
                <button onClick={addEvent} style={PB()}>Add Event</button>
              </div>
            )}

            {modal==="reward" && (
              <div>
                <h3 style={{margin:"0 0 16px",fontSize:20}}>Custom Reward</h3>
                <div style={{marginBottom:12}}>
                  <label style={LS}>Reward name</label>
                  <input style={IS} placeholder="e.g. Weekend trip" value={mdata.name||""} onChange={e=>setMdata(d=>({...d,name:e.target.value}))}/>
                </div>
                <div style={{marginBottom:12}}>
                  <label style={LS}>Coin cost</label>
                  <input type="number" style={IS} placeholder="e.g. 200" value={mdata.cost||""} onChange={e=>setMdata(d=>({...d,cost:e.target.value}))}/>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={LS}>Emoji</label>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
                    {["🎁","🍕","🎬","🎮","🛍️","✈️","🏖️","🎂","🍦","💆"].map(em=>(
                      <button key={em} onClick={()=>setMdata(d=>({...d,emoji:em}))} style={{fontSize:20,background:mdata.emoji===em?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.05)",border:`1px solid ${mdata.emoji===em?"#a78bfa":"transparent"}`,borderRadius:8,padding:"5px 8px",cursor:"pointer"}}>{em}</button>
                    ))}
                  </div>
                </div>
                <button onClick={addReward} style={PB()}>Add Reward</button>
              </div>
            )}

            <button onClick={closeModal} style={{width:"100%",marginTop:12,background:"none",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"10px 0",color:"#888",cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fall{from{transform:translateY(0) rotate(0deg);opacity:1;}to{transform:translateY(150px) rotate(360deg);opacity:0;}}
        @keyframes slideDown{from{transform:translateX(-50%) translateY(-20px);opacity:0;}to{transform:translateX(-50%) translateY(0);opacity:1;}}
        input[type="date"]::-webkit-calendar-picker-indicator,input[type="time"]::-webkit-calendar-picker-indicator{filter:invert(1);}
        textarea::-webkit-scrollbar,div::-webkit-scrollbar{display:none;}
        *{-webkit-tap-highlight-color:transparent;}
      `}</style>
    </div>
  );
}
