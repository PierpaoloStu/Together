import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "together-v2";
const PIN_CODE = "4443";

const PROFILES = { io: { label: "Pierpaolo" }, martina: { label: "Martina" } };
const MONTHS = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

const fmt = (n) => new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n||0);
const CM = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const ML = (k) => { if(!k)return""; const[y,m]=k.split("-"); return `${MONTHS[parseInt(m)-1]} ${y}`; };
const TODAY = () => new Date().toISOString().slice(0,10);

const INIT = {
  categories: {"Stipendio":"Fisse"},
  loans: [],
  profiles: { io: { months: { [CM()]: { transactions: [], savings: 0 } } }, martina: { months: { [CM()]: { transactions: [], savings: 0 } } } }
};

const loadData = () => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(INIT)); } catch { return JSON.parse(JSON.stringify(INIT)); } };
const saveData = (d) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} };

const HomeIcon = ({size=24}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const WalletIcon = ({size=24}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/><circle cx="17" cy="14" r="2"/></svg>);
const UsersIcon = ({size=24}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const SettingsIcon = ({size=24}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/></svg>);
const PlusIcon = ({size=24}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);

const colors = { bg: "#fff", bgS: "#f5f5f5", text: "#000", sub: "#666", dim: "#999", border: "#e0e0e0", accent: "#0066ff", success: "#00cc88", danger: "#ff3333" };

export default function Together() {
  const [data, setData] = useState(() => loadData());
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [activeMonth, setActiveMonth] = useState(CM());
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const amountInputRef = useRef(null);
  const noteInputRef = useRef(null);
  const [form, setForm] = useState({type:"uscita",category:"",note:"",date:TODAY()});
  const [addModal, setAddModal] = useState(false);

  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  const save = useCallback((nd) => { setData(nd); saveData(nd); }, []);

  const handlePinInput = (digit) => {
    if(pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if(newPin.length === 4) {
        if(newPin === PIN_CODE) { setLocked(false); setPin(""); setPinError(false); }
        else { setPinError(true); setTimeout(() => { setPin(""); setPinError(false); }, 1000); }
      }
    }
  };

  const allMonths = () => { const s = new Set(); Object.values(data.profiles).forEach(p=>Object.keys(p.months||{}).forEach(m=>s.add(m))); return [...s].sort().reverse(); };
  const months = allMonths();

  const getProfileData = (who) => {
    const txs = data?.profiles?.[who]?.months?.[activeMonth]?.transactions || [];
    const savings = data?.profiles?.[who]?.months?.[activeMonth]?.savings || 0;
    const entrate = txs.filter(t=>t.type==="entrata").reduce((s,t)=>s+t.amount,0);
    const uscite = txs.filter(t=>t.type==="uscita").reduce((s,t)=>s+t.amount,0);
    return {txs,savings,entrate,uscite,saldo:entrate-uscite};
  };

  if(loading) return (<div style={{minHeight:"100vh",background:colors.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:colors.sub}}>Together</div></div>);

  if(locked) {
    return (
      <div style={{minHeight:"100vh",background:colors.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",maxWidth:280}}>
          <div style={{fontSize:"2.5rem",fontWeight:800,marginBottom:30}}>Together</div>
          <div style={{fontSize:"0.9rem",color:colors.sub,marginBottom:30}}>PIN per accedere</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:40}}>{[0,1,2,3].map(i=><div key={i} style={{width:12,height:12,borderRadius:"50%",background:pin.length>i?colors.accent:colors.border}}/>)}</div>
          {pinError && <div style={{color:colors.danger,fontSize:"0.85rem",marginBottom:20}}>PIN errato</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10,marginBottom:10}}>{[1,2,3,4,5,6,7,8,9].map(n=>(<button key={n} onClick={()=>handlePinInput(String(n))} style={{aspectRatio:"1",background:colors.bgS,border:`1px solid ${colors.border}`,borderRadius:12,fontSize:"1.2rem",fontWeight:600,cursor:"pointer"}}>{n}</button>))}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div/>
            <button onClick={()=>handlePinInput("0")} style={{aspectRatio:"1",background:colors.bgS,border:`1px solid ${colors.border}`,borderRadius:12,fontSize:"1.2rem",fontWeight:600,cursor:"pointer"}}>0</button>
            <button onClick={()=>setPin(p=>p.slice(0,-1))} style={{aspectRatio:"1",background:colors.bgS,border:`1px solid ${colors.border}`,borderRadius:12,fontSize:"1rem",color:colors.dim,cursor:"pointer"}}>⌫</button>
          </div>
        </div>
      </div>
    );
  }

  const ioData = getProfileData("io");
  const marData = getProfileData("martina");
  const coupData = { entrate: ioData.entrate + marData.entrate, uscite: ioData.uscite + marData.uscite, saldo: ioData.saldo + marData.saldo, savings: ioData.savings + marData.savings };

  const Card = ({children, style={}}) => (<div style={{background:colors.bg,border:`1px solid ${colors.border}`,borderRadius:16,padding:16,...style}}>{children}</div>);
  const inp = {width:"100%",background:colors.bgS,border:`1px solid ${colors.border}`,color:colors.text,borderRadius:12,padding:"14px 16px",fontSize:"1rem",boxSizing:"border-box",outline:"none"};
  const lbl = {fontSize:"0.75rem",color:colors.dim,textTransform:"uppercase",display:"block",marginBottom:8,fontWeight:600};

  return (
    <div style={{minHeight:"100vh",background:colors.bgS,color:colors.text,fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",paddingBottom:80}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>

        {activeTab==="home" && (
          <div>
            <div style={{padding:"24px 16px 16px",borderBottom:`1px solid ${colors.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontSize:"1.3rem",fontWeight:700}}>Together</div>
                <select value={activeMonth} onChange={e=>setActiveMonth(e.target.value)} style={{width:"auto",padding:"8px 12px",fontSize:"0.9rem",border:"none",background:colors.bgS,borderRadius:8,cursor:"pointer"}}>
                  {months.map(m=><option key={m} value={m}>{ML(m)}</option>)}
                </select>
              </div>
              <div><div style={{fontSize:"0.85rem",color:colors.dim,marginBottom:4}}>Saldo Coppia</div><div style={{fontSize:"2.5rem",fontWeight:700}}>{fmt(coupData.saldo)}</div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:20}}>
                <Card><div style={{fontSize:"0.75rem",color:colors.dim,marginBottom:6}}>Entrate</div><div style={{fontSize:"1.2rem",fontWeight:700,color:colors.success}}>{fmt(coupData.entrate)}</div></Card>
                <Card><div style={{fontSize:"0.75rem",color:colors.dim,marginBottom:6}}>Uscite</div><div style={{fontSize:"1.2rem",fontWeight:700,color:colors.danger}}>{fmt(coupData.uscite)}</div></Card>
              </div>
            </div>
            <div style={{padding:"20px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:"1rem",fontWeight:700}}>Transazioni</div>
                <button onClick={()=>setAddModal(true)} style={{width:44,height:44,borderRadius:"50%",background:colors.accent,border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><PlusIcon size={20}/></button>
              </div>
              {[...ioData.txs, ...marData.txs].filter(t=>t.type!=="risparmi").sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,10).map(tx=>(
                <div key={tx.id} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${colors.border}`}}>
                  <div><div style={{fontSize:"0.95rem",fontWeight:500}}>{tx.category}</div><div style={{fontSize:"0.75rem",color:colors.dim}}>{tx.date}</div></div>
                  <div style={{fontSize:"0.95rem",fontWeight:600,color:tx.type==="entrata"?colors.success:colors.danger}}>{tx.type==="entrata"?"+":"-"}{fmt(tx.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab==="wallet" && (
          <div style={{padding:"20px 16px"}}>
            <div style={{fontSize:"1.3rem",fontWeight:700,marginBottom:20}}>Portafoglio</div>
            <Card style={{marginBottom:20}}><div style={{fontSize:"0.75rem",color:colors.dim,marginBottom:8}}>Risparmi Totali</div><div style={{fontSize:"2rem",fontWeight:700}}>{fmt(coupData.savings)}</div></Card>
            <div style={{fontSize:"0.95rem",fontWeight:700,marginBottom:12}}>Dettaglio</div>
            <Card><div style={{display:"flex",justifyContent:"space-between",paddingBottom:12,borderBottom:`1px solid ${colors.border}`,marginBottom:12}}><div>Pierpaolo</div><div style={{fontWeight:600}}>{fmt(ioData.savings)}</div></div><div style={{display:"flex",justifyContent:"space-between"}}><div>Martina</div><div style={{fontWeight:600}}>{fmt(marData.savings)}</div></div></Card>
          </div>
        )}

        {activeTab==="people" && (
          <div style={{padding:"20px 16px"}}>
            <div style={{fontSize:"1.3rem",fontWeight:700,marginBottom:20}}>Profili</div>
            {["io", "martina"].map(prof=>{
              const pd = prof==="io"?ioData:marData;
              return (<Card key={prof} style={{marginBottom:12,cursor:"pointer"}} onClick={()=>{setSelectedProfile(prof);setActiveTab("profile");}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:"0.95rem",fontWeight:700,marginBottom:4}}>{PROFILES[prof].label}</div><div style={{fontSize:"0.85rem",color:colors.dim}}>Saldo: {fmt(pd.saldo)}</div></div>
                  <div style={{fontSize:"1.5rem"}}>{prof==="io"?"👤":"👩"}</div>
                </div>
              </Card>);
            })}
          </div>
        )}

        {activeTab==="settings" && (
          <div style={{padding:"20px 16px"}}>
            <div style={{fontSize:"1.3rem",fontWeight:700,marginBottom:20}}>Impostazioni</div>
            <Card><button onClick={()=>setLocked(true)} style={{width:"100%",padding:"16px",background:colors.bgS,border:"none",borderRadius:12,fontSize:"0.95rem",fontWeight:600,cursor:"pointer"}}>Esci</button></Card>
          </div>
        )}

        {activeTab==="profile" && selectedProfile && (
          <div style={{padding:"20px 16px"}}>
            <button onClick={()=>setActiveTab("people")} style={{marginBottom:20,padding:"10px 16px",background:colors.bgS,border:"none",borderRadius:10,cursor:"pointer"}}>← Indietro</button>
            <div style={{fontSize:"1.3rem",fontWeight:700,marginBottom:20}}>{PROFILES[selectedProfile].label}</div>
            <Card><div style={{marginBottom:16}}><div style={{fontSize:"0.75rem",color:colors.dim,marginBottom:4}}>Saldo</div><div style={{fontSize:"2rem",fontWeight:700}}>{fmt(getProfileData(selectedProfile).saldo)}</div></div><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:"0.75rem",color:colors.dim}}>Entrate</div><div style={{fontWeight:600}}>{fmt(getProfileData(selectedProfile).entrate)}</div></div><div><div style={{fontSize:"0.75rem",color:colors.dim}}>Uscite</div><div style={{fontWeight:600}}>{fmt(getProfileData(selectedProfile).uscite)}</div></div><div><div style={{fontSize:"0.75rem",color:colors.dim}}>Risparmi</div><div style={{fontWeight:600}}>{fmt(getProfileData(selectedProfile).savings)}</div></div></div></Card>
          </div>
        )}

      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:colors.bg,borderTop:`1px solid ${colors.border}`,display:"grid",gridTemplateColumns:"repeat(4, 1fr)"}}>
        {[
          {id:"home",icon:HomeIcon,label:"Home"},
          {id:"wallet",icon:WalletIcon,label:"Wallet"},
          {id:"people",icon:UsersIcon,label:"Profili"},
          {id:"settings",icon:SettingsIcon,label:"Impostazioni"}
        ].map(tab=>{
          const Icon = tab.icon;
          const active = activeTab===tab.id;
          return (<button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:12,background:"none",border:"none",cursor:"pointer",color:active?colors.accent:colors.dim,display:"flex",flexDirection:"column",alignItems:"center",gap:4,fontSize:"0.7rem"}}><Icon size={24}/><span>{tab.label}</span></button>);
        })}
      </div>

      {addModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9998,display:"flex",alignItems:"flex-end"}}>
          <div style={{width:"100%",background:colors.bg,borderRadius:"24px 24px 0 0",padding:"24px 16px 40px",maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontSize:"1.2rem",fontWeight:700}}>Aggiungi Transazione</div>
              <button onClick={()=>setAddModal(false)} style={{width:32,height:32,borderRadius:8,background:colors.bgS,border:"none",fontSize:"1.2rem",cursor:"pointer"}}>✕</button>
            </div>
            {!selectedProfile && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                {["io","martina"].map(p=>(<button key={p} onClick={()=>setSelectedProfile(p)} style={{padding:12,borderRadius:12,border:`2px solid ${colors.border}`,background:colors.bgS,fontWeight:600,cursor:"pointer"}}>{PROFILES[p].label}</button>))}
              </div>
            )}
            {selectedProfile && (
              <>
                <div style={{display:"flex",gap:8,marginBottom:16}}>
                  {["entrata","uscita","risparmi"].map(t=>(<button key={t} onClick={()=>setForm({...form,type:t})} style={{flex:1,padding:12,borderRadius:12,border:`2px solid ${form.type===t?colors.accent:colors.border}`,background:form.type===t?`${colors.accent}10`:colors.bgS,fontWeight:600,cursor:"pointer",color:form.type===t?colors.accent:colors.text,fontSize:"0.9rem"}}>{t==="entrata"?"Entrata":t==="uscita"?"Uscita":"Risparmio"}</button>))}
                </div>
                <div style={{marginBottom:16}}><label style={lbl}>IMPORTO</label><input ref={amountInputRef} style={inp} type="text" inputMode="decimal" placeholder="0,00"/></div>
                <div style={{marginBottom:16}}><label style={lbl}>CATEGORIA</label><select style={inp} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="">Seleziona...</option>{Object.keys(data.categories||{}).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div style={{marginBottom:16}}><label style={lbl}>DATA</label><input style={inp} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
                <div style={{marginBottom:20}}><label style={lbl}>NOTE</label><input ref={noteInputRef} style={inp} type="text" placeholder="Descrizione..."/></div>
                <button onClick={()=>setAddModal(false)} style={{width:"100%",padding:16,background:colors.accent,border:"none",borderRadius:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:"1rem"}}>Aggiungi</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
