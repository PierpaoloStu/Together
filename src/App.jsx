import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "together-v1";
const THEME_KEY = "together-theme";
const PIN_CODE = "4443";

const PROFILES = {
  io:      { label: "Pierpaolo", color: "#6b9fff", colorLight: "#4a7fd9" },
  martina: { label: "Martina",   color: "#f47eb0", colorLight: "#d65a8f" },
};

const MACRO_AREAS = ["Fisse", "Variabili", "Straordinarie", "Piacere", "Risparmi"];

const MONTHS = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

const fmt = (n) => new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n||0);
const fmtP = (n) => `${Math.round(n)}%`;
const CM = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const ML = (k) => { if(!k)return""; const[y,m]=k.split("-"); return `${MONTHS[parseInt(m)-1]} ${y}`; };
const TODAY = () => new Date().toISOString().slice(0,10);

const INIT = {
  categories: {"Stipendio":"Fisse"},
  loans: [],
  profiles: {
    io: { months: { [CM()]: { transactions: [], savings: 0 } } },
    martina: { months: { [CM()]: { transactions: [], savings: 0 } } },
  }
};

const loadData = () => {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(INIT)); }
  catch { return JSON.parse(JSON.stringify(INIT)); }
};
const saveData = (d) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} };
const loadTheme = () => {
  try { 
    const saved = localStorage.getItem(THEME_KEY);
    if(saved) return saved;
    const hour = new Date().getHours();
    return (hour >= 19 || hour < 7) ? "dark" : "light";
  } catch { return "dark"; }
};
const saveTheme = (t) => { try { localStorage.setItem(THEME_KEY, t); } catch {} };

const TogetherLogo = ({size=120, isDark}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
    <svg width={size*0.8} height={size*0.5} viewBox="0 0 160 100" fill="none">
      <circle cx="40" cy="30" r="15" fill={isDark?"#6b9fff":"#4a7fd9"}/>
      <path d="M25,48 L25,75 M55,48 L55,75 M40,48 L40,85" stroke={isDark?"#6b9fff":"#4a7fd9"} strokeWidth="7" strokeLinecap="round"/>
      <circle cx="120" cy="30" r="15" fill={isDark?"#f47eb0":"#d65a8f"}/>
      <path d="M105,48 L105,75 M135,48 L135,75 M120,48 L120,85" stroke={isDark?"#f47eb0":"#d65a8f"} strokeWidth="7" strokeLinecap="round"/>
      <path d="M55,62 Q80,52 105,62" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <circle cx="80" cy="58" r="6" fill="#fbbf24"/>
    </svg>
    <div style={{fontFamily:"'SF Pro Display', -apple-system, sans-serif",fontSize:size*0.22,fontWeight:800,background:"linear-gradient(135deg, #6b9fff, #f47eb0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.02em"}}>Together</div>
  </div>
);

const SunIcon = ({size=20}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = ({size=20}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const MenuIcon = ({size=20}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CloseIcon = ({size=20}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const AmountInput = ({inputRef, style, lbl}) => (
  <div>
    <label style={lbl}>IMPORTO (€)</label>
    <input ref={inputRef} style={style} type="text" inputMode="decimal" autoComplete="off" defaultValue="" placeholder="0,00"/>
  </div>
);

const PieChart = ({data, colors, isDark, showMoney=false}) => {
  if(!data || data.length === 0) return null;
  const total = data.reduce((s,[,v])=>s+v, 0);
  if(total === 0) return null;
  
  let currentAngle = -90;
  const paths = data.map(([label, value], i) => {
    const percentage = value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
    const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
    const largeArc = angle > 180 ? 1 : 0;
    return <path key={label} d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={colors[i % colors.length]} opacity="0.9"/>;
  });
  
  return (
    <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
      <svg viewBox="0 0 100 100" style={{width:140,height:140,flexShrink:0}}>{paths}</svg>
      <div style={{flex:1,minWidth:180}}>
        {data.map(([label, value], i) => (
          <div key={label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:12,height:12,borderRadius:3,background:colors[i % colors.length],flexShrink:0}}/>
            <div style={{flex:1,fontSize:"0.8rem",color:isDark?"#ccc":"#333"}}>{label}</div>
            <div style={{fontSize:"0.75rem",fontWeight:600,color:isDark?"#aaa":"#666"}}>
              {showMoney ? fmt(value) : fmtP((value/total)*100)}
            </div>
          </div>
        ))}
        {showMoney && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${isDark?"#333":"#ddd"}`,fontSize:"0.85rem",fontWeight:700}}>Totale: {fmt(total)}</div>}
      </div>
    </div>
  );
};

export default function Together() {
  const [theme, setTheme] = useState(() => loadTheme());
  const [data, setData] = useState(() => loadData());
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  
  const [activeMonth, setActiveMonth] = useState(CM());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [view, setView] = useState("main");
  
  const amountInputRef = useRef(null);
  const [form, setForm] = useState({type:"uscita",category:"",note:"",date:TODAY()});
  const [toast, setToast] = useState(null);
  
  const [newCategoryModal, setNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryMacro, setNewCategoryMacro] = useState("Fisse");
  
  const [loansModal, setLoansModal] = useState(false);
  const [loanForm, setLoanForm] = useState({name:"",totalAmount:"",monthlyPayment:"",owner:"both"});
  
  const [newMonthModal, setNewMonthModal] = useState(false);
  const [newMonthKey, setNewMonthKey] = useState("");
  
  const [searchMacro, setSearchMacro] = useState("");

  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "#0a0a0a" : "#f8f9fa",
    card: isDark ? "#1a1a1a" : "#ffffff",
    border: isDark ? "#2a2a2a" : "#e5e7eb",
    text: isDark ? "#f0ede8" : "#111827",
    textSub: isDark ? "#9ca3af" : "#6b7280",
    textDim: isDark ? "#4b5563" : "#9ca3af",
    accent: isDark ? "#fbbf24" : "#f59e0b",
    success: isDark ? "#34d399" : "#10b981",
    danger: isDark ? "#f87171" : "#ef4444",
    header: isDark ? "rgba(15,15,15,0.9)" : "rgba(255,255,255,0.9)",
    input: isDark ? "#1f1f1f" : "#f9fafb",
    inputBorder: isDark ? "#374151" : "#d1d5db",
  };

  const save = useCallback((nd) => { setData(nd); saveData(nd); }, []);
  const toast_ = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null), 2500); };

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

  const ioStip = (data?.profiles?.io?.months?.[activeMonth]?.transactions || []).filter(t=>t.type==="entrata" && t.category==="Stipendio").reduce((s,t)=>s+t.amount,0);
  const marStip = (data?.profiles?.martina?.months?.[activeMonth]?.transactions || []).filter(t=>t.type==="entrata" && t.category==="Stipendio").reduce((s,t)=>s+t.amount,0);
  const totStip = ioStip + marStip;
  const pctIo = totStip>0 ? ioStip/totStip : 0.5;
  const pctMar = totStip>0 ? marStip/totStip : 0.5;

  const allMonths = () => {
    const s = new Set();
    Object.values(data.profiles).forEach(p=>Object.keys(p.months||{}).forEach(m=>s.add(m)));
    return [...s].sort().reverse();
  };

  const months = allMonths();

  const inp = {
    width:"100%",background:colors.input,border:`1px solid ${colors.inputBorder}`,color:colors.text,
    borderRadius:10,padding:"12px 14px",fontSize:"0.9rem",fontFamily:"'SF Pro Text', -apple-system, sans-serif",
    boxSizing:"border-box",outline:"none",transition:"border 0.2s"
  };
  const lbl = {fontSize:"0.7rem",color:colors.textSub,letterSpacing:"0.05em",textTransform:"uppercase",display:"block",marginBottom:6,fontWeight:600};

  const Card = ({children, style={}, onClick}) => (
    <div onClick={onClick} style={{
      background:isDark?"rgba(26,26,26,0.6)":"rgba(255,255,255,0.7)",
      backdropFilter:"blur(10px)",
      border:`1px solid ${colors.border}`,
      borderRadius:16,
      padding:20,
      boxShadow:isDark?"0 4px 12px rgba(0,0,0,0.3)":"0 2px 8px rgba(0,0,0,0.06)",
      transition:"all 0.3s",
      cursor:onClick?"pointer":"default",
      ...style
    }}>
      {children}
    </div>
  );

  const profColor = (who) => isDark ? PROFILES[who].color : PROFILES[who].colorLight;

  const macroColors = isDark
    ? {Fisse:"#ef4444",Variabili:"#f97316",Straordinarie:"#f59e0b",Piacere:"#a855f7",Risparmi:"#10b981"}
    : {Fisse:"#dc2626",Variabili:"#ea580c",Straordinarie:"#d97706",Piacere:"#9333ea",Risparmi:"#059669"};

  const pieColors = Object.values(macroColors);

  const addCategory = () => {
    if(!newCategoryName.trim()){ toast_("Inserisci un nome",false); return; }
    const nd=JSON.parse(JSON.stringify(data));
    if(!nd.categories) nd.categories={};
    if(nd.categories[newCategoryName.trim()]){ toast_("Categoria già esistente",false); return; }
    nd.categories[newCategoryName.trim()] = newCategoryMacro;
    save(nd);
    setNewCategoryName("");
    setNewCategoryModal(false);
    toast_("Categoria creata ✓");
  };

  const addTransaction = () => {
    const amountValue = amountInputRef.current?.value || "";
    if(!amountValue||!form.category){ toast_("Inserisci importo e categoria",false); return; }
    const amount = parseFloat(amountValue.replace(",","."));
    if(isNaN(amount)||amount<=0){ toast_("Importo non valido",false); return; }
    
    const nd=JSON.parse(JSON.stringify(data));
    const prof=nd.profiles[selectedProfile];
    if(!prof.months[activeMonth]) prof.months[activeMonth]={transactions:[],savings:0};
    
    const macroArea = nd.categories[form.category] || "";
    
    if(form.type==="risparmi"){
      prof.months[activeMonth].savings = (prof.months[activeMonth].savings||0) + amount;
      prof.months[activeMonth].transactions.push({id:Date.now().toString(),type:"risparmi",amount,category:form.category,note:form.note,date:form.date,macroArea:"Risparmi"});
      toast_("Risparmio aggiunto ✓");
    } else if(form.type==="uscita" && macroArea==="Risparmi"){
      prof.months[activeMonth].savings = (prof.months[activeMonth].savings||0) - amount;
      prof.months[activeMonth].transactions.push({id:Date.now().toString(),type:form.type,amount,category:form.category,note:form.note,date:form.date,macroArea});
      toast_("Prelievo da risparmi ✓");
    } else {
      prof.months[activeMonth].transactions.push({id:Date.now().toString(),type:form.type,amount,category:form.category,note:form.note,date:form.date,macroArea});
      toast_("Aggiunta ✓");
    }
    
    save(nd);
    if(amountInputRef.current) amountInputRef.current.value="";
    setForm({type:form.type,category:"",note:"",date:TODAY()});
  };

  const addLoan = () => {
    if(!loanForm.name||!loanForm.totalAmount||!loanForm.monthlyPayment){ toast_("Compila i campi",false); return; }
    const nd=JSON.parse(JSON.stringify(data));
    if(!nd.loans) nd.loans=[];
    nd.loans.push({
      id:Date.now().toString(),
      name:loanForm.name,
      totalAmount:parseFloat(loanForm.totalAmount.replace(",",".")),
      monthlyPayment:parseFloat(loanForm.monthlyPayment.replace(",",".")),
      paidAmount:0,
      owner:loanForm.owner
    });
    save(nd);
    setLoanForm({name:"",totalAmount:"",monthlyPayment:"",owner:"both"});
    toast_("Finanziamento aggiunto ✓");
  };

  const payLoan = (id) => {
    const nd=JSON.parse(JSON.stringify(data));
    const loan=nd.loans.find(l=>l.id===id);
    if(!loan) return;
    loan.paidAmount += loan.monthlyPayment;
    if(loan.paidAmount > loan.totalAmount) loan.paidAmount = loan.totalAmount;
    save(nd);
    toast_("Rata pagata ✓");
  };

  const deleteLoan = (id) => {
    const nd=JSON.parse(JSON.stringify(data));
    nd.loans=nd.loans.filter(l=>l.id!==id);
    save(nd);
    toast_("Eliminato");
  };

  const createNewMonth = () => {
    if(!newMonthKey){ toast_("Seleziona un mese",false); return; }
    const nd=JSON.parse(JSON.stringify(data));
    const prevMonth = months[1];
    ["io","martina"].forEach(who=>{
      if(!nd.profiles[who].months[newMonthKey]){
        const prevSav = prevMonth && nd.profiles[who].months[prevMonth] ? (nd.profiles[who].months[prevMonth].savings || 0) : 0;
        nd.profiles[who].months[newMonthKey]={transactions:[],savings:prevSav};
      }
    });
    save(nd);
    setActiveMonth(newMonthKey);
    setNewMonthModal(false);
    setNewMonthKey("");
    toast_(`${ML(newMonthKey)} creato ✓`);
  };

  const futureMonths = () => {
    const ex=new Set(allMonths());
    const opts=[];
    const d=new Date();
    for(let i=0;i<24;i++){
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!ex.has(key)) opts.push(key);
      d.setMonth(d.getMonth()+1);
    }
    return opts;
  };

  const getProfileData = (who) => {
    const txs = data?.profiles?.[who]?.months?.[activeMonth]?.transactions || [];
    const savings = data?.profiles?.[who]?.months?.[activeMonth]?.savings || 0;
    const entrate = txs.filter(t=>t.type==="entrata").reduce((s,t)=>s+t.amount,0);
    const uscite = txs.filter(t=>t.type==="uscita").reduce((s,t)=>s+t.amount,0);
    
    const byMacro = {};
    MACRO_AREAS.forEach(m=>byMacro[m]=0);
    txs.filter(t=>t.type==="uscita"&&t.macroArea).forEach(t=>{
      byMacro[t.macroArea] = (byMacro[t.macroArea]||0) + t.amount;
    });
    
    const stipendio = txs.filter(t=>t.type==="entrata"&&t.category==="Stipendio").reduce((s,t)=>s+t.amount,0);
    const p50 = stipendio * 0.5;
    const p30 = stipendio * 0.3;
    const p20 = stipendio * 0.2;
    
    const spent50 = (byMacro.Fisse||0) + (byMacro.Variabili||0) + (byMacro.Straordinarie||0);
    const spent30 = byMacro.Piacere||0;
    const spent20 = byMacro.Risparmi||0;
    
    return {txs,savings,entrate,uscite,byMacro,stipendio,p50,p30,p20,spent50,spent30,spent20,saldo:entrate-uscite};
  };

  if(loading) {
    return (
      <div style={{minHeight:"100vh",background:colors.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <TogetherLogo size={100} isDark={isDark}/>
      </div>
    );
  }

  if(locked) {
    return (
      <div style={{minHeight:"100vh",background:colors.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'SF Pro Text', -apple-system, sans-serif"}}>
        <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); }}`}</style>
        <div style={{textAlign:"center",padding:20,maxWidth:360,width:"100%"}}>
          <div style={{marginBottom:40}}>
            <TogetherLogo size={80} isDark={isDark}/>
            <div style={{fontSize:"0.85rem",color:colors.textSub,marginTop:20}}>Inserisci il PIN</div>
          </div>
          <div style={{display:"flex",gap:16,justifyContent:"center",marginBottom:40}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{width:16,height:16,borderRadius:"50%",background:pin.length>i?(pinError?colors.danger:colors.accent):colors.border,transition:"all 0.2s",animation:pinError?"shake 0.5s":""}}/>
            ))}
          </div>
          {pinError && <div style={{color:colors.danger,fontSize:"0.8rem",marginBottom:20,fontWeight:600}}>PIN errato</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:12,marginBottom:12}}>
            {[1,2,3,4,5,6,7,8,9].map(n=>(
              <button key={n} onClick={()=>handlePinInput(String(n))} style={{width:"100%",aspectRatio:"1",background:colors.card,border:`1px solid ${colors.border}`,borderRadius:16,fontSize:"1.5rem",fontWeight:600,color:colors.text,cursor:"pointer"}}>{n}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div/>
            <button onClick={()=>handlePinInput("0")} style={{width:"100%",aspectRatio:"1",background:colors.card,border:`1px solid ${colors.border}`,borderRadius:16,fontSize:"1.5rem",fontWeight:600,color:colors.text,cursor:"pointer"}}>0</button>
            <button onClick={()=>setPin(p=>p.slice(0,-1))} style={{width:"100%",aspectRatio:"1",background:colors.card,border:`1px solid ${colors.border}`,borderRadius:16,fontSize:"1.2rem",color:colors.textSub,cursor:"pointer"}}>⌫</button>
          </div>
        </div>
      </div>
    );
  }

  const ioData = getProfileData("io");
  const marData = getProfileData("martina");
  const coupData = {
    entrate: ioData.entrate + marData.entrate,
    uscite: ioData.uscite + marData.uscite,
    saldo: (ioData.entrate + marData.entrate) - (ioData.uscite + marData.uscite),
    savings: ioData.savings + marData.savings
  };

  return (
    <div style={{minHeight:"100vh",background:colors.bg,color:colors.text,fontFamily:"'SF Pro Text', -apple-system, sans-serif"}}>
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }} button:active { transform: scale(0.97); }`}</style>

      {toast && (
        <div style={{position:"fixed",top:20,right:20,zIndex:9999,background:toast.ok?(isDark?"rgba(26,58,42,0.95)":"rgba(232,245,238,0.95)"):(isDark?"rgba(58,26,26,0.95)":"rgba(253,232,232,0.95)"),backdropFilter:"blur(10px)",border:`1px solid ${toast.ok?colors.success+"60":colors.danger+"60"}`,color:toast.ok?colors.success:colors.danger,padding:"12px 20px",borderRadius:12,fontSize:"0.85rem",fontWeight:500,animation:"slideIn 0.3s"}}>
          {toast.msg}
        </div>
      )}

      {/* MODALS */}
      {newMonthModal && (
        <div style={{position:"fixed",inset:0,zIndex:8888,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}}>
          <Card style={{width:"100%",maxWidth:380}}>
            <div style={{fontSize:"0.75rem",color:colors.success,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16,fontWeight:700}}>+ Nuovo mese</div>
            <div style={{fontSize:"0.85rem",color:colors.textSub,marginBottom:20}}>Risparmi portati dal mese precedente</div>
            <select value={newMonthKey} onChange={e=>setNewMonthKey(e.target.value)} style={{...inp,marginBottom:20}}>
              <option value="">Scegli...</option>
              {futureMonths().map(m=><option key={m} value={m}>{ML(m)}</option>)}
            </select>
            <div style={{display:"flex",gap:12}}>
              <button onClick={createNewMonth} style={{flex:1,padding:"12px 0",background:colors.success,border:"none",color:"#fff",borderRadius:10,cursor:"pointer",fontSize:"0.85rem",fontWeight:700}}>CREA</button>
              <button onClick={()=>{setNewMonthModal(false);setNewMonthKey("");}} style={{padding:"12px 18px",background:colors.card,border:`1px solid ${colors.border}`,color:colors.textSub,borderRadius:10,cursor:"pointer",fontWeight:600}}>Annulla</button>
            </div>
          </Card>
        </div>
      )}

      {newCategoryModal && (
        <div style={{position:"fixed",inset:0,zIndex:8888,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}}>
          <Card style={{width:"100%",maxWidth:380}}>
            <div style={{fontSize:"0.75rem",color:colors.success,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16,fontWeight:700}}>+ Categoria</div>
            <div style={{marginBottom:12}}>
              <label style={lbl}>NOME</label>
              <input style={inp} type="text" value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} placeholder="es: Affitto"/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={lbl}>MACROAREA</label>
              <select style={inp} value={newCategoryMacro} onChange={e=>setNewCategoryMacro(e.target.value)}>
                {MACRO_AREAS.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:12}}>
              <button onClick={addCategory} style={{flex:1,padding:"12px 0",background:colors.success,border:"none",color:"#fff",borderRadius:10,cursor:"pointer",fontSize:"0.85rem",fontWeight:700}}>CREA</button>
              <button onClick={()=>{setNewCategoryModal(false);setNewCategoryName("");}} style={{padding:"12px 18px",background:colors.card,border:`1px solid ${colors.border}`,color:colors.textSub,borderRadius:10,cursor:"pointer",fontWeight:600}}>Annulla</button>
            </div>
          </Card>
        </div>
      )}

      {loansModal && (
        <div style={{position:"fixed",inset:0,zIndex:8888,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)",overflowY:"auto"}}>
          <Card style={{width:"100%",maxWidth:600,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:"0.8rem",color:colors.accent,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:20,fontWeight:700}}>💳 Finanziamenti</div>
            {(data?.loans||[]).length>0 && (
              <div style={{marginBottom:24}}>
                {data.loans.map(loan=>{
                  const rem=loan.totalAmount-loan.paidAmount;
                  const prog=(loan.paidAmount/loan.totalAmount)*100;
                  return (
                    <div key={loan.id} style={{marginBottom:16,padding:16,background:colors.input,borderRadius:12,border:`1px solid ${colors.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                        <div style={{fontSize:"0.9rem",fontWeight:700}}>{loan.name}</div>
                        <button onClick={()=>deleteLoan(loan.id)} style={{background:isDark?"rgba(248,113,113,0.15)":"rgba(239,68,68,0.15)",border:`1px solid ${colors.danger}60`,color:colors.danger,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:"0.7rem"}}>×</button>
                      </div>
                      <div style={{fontSize:"0.75rem",marginBottom:10}}>
                        Pagato: {fmt(loan.paidAmount)} / {fmt(loan.totalAmount)} · Residuo: {fmt(rem)}
                      </div>
                      <div style={{background:isDark?"#0f0f0f":"#f0f0f0",borderRadius:6,height:8,marginBottom:10,overflow:"hidden"}}>
                        <div style={{height:"100%",background:colors.success,width:`${prog}%`,borderRadius:6}}/>
                      </div>
                      <button onClick={()=>payLoan(loan.id)} disabled={rem<=0} style={{background:rem>0?colors.success:colors.border,border:"none",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:rem>0?"pointer":"not-allowed",fontSize:"0.75rem"}}>Paga {fmt(loan.monthlyPayment)}</button>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{borderTop:`1px solid ${colors.border}`,paddingTop:20}}>
              <input style={{...inp,marginBottom:12}} type="text" value={loanForm.name} onChange={e=>setLoanForm({...loanForm,name:e.target.value})} placeholder="Nome"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <input style={inp} type="text" inputMode="decimal" value={loanForm.totalAmount} onChange={e=>setLoanForm({...loanForm,totalAmount:e.target.value})} placeholder="Totale"/>
                <input style={inp} type="text" inputMode="decimal" value={loanForm.monthlyPayment} onChange={e=>setLoanForm({...loanForm,monthlyPayment:e.target.value})} placeholder="Rata"/>
              </div>
              <button onClick={addLoan} style={{width:"100%",padding:"12px 0",background:colors.success,border:"none",color:"#fff",borderRadius:10,cursor:"pointer",fontSize:"0.85rem",fontWeight:700,marginBottom:12}}>AGGIUNGI</button>
              <button onClick={()=>setLoansModal(false)} style={{width:"100%",padding:"12px 0",background:colors.card,border:`1px solid ${colors.border}`,color:colors.textSub,borderRadius:10,cursor:"pointer",fontWeight:600}}>Chiudi</button>
            </div>
          </Card>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:colors.header,borderBottom:`1px solid ${colors.border}`,padding:"16px 20px",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(20px)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>setSidebarOpen(true)} style={{width:44,height:44,borderRadius:10,background:colors.card,border:`1px solid ${colors.border}`,color:colors.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <MenuIcon/>
          </button>
          <TogetherLogo size={80} isDark={isDark}/>
          <select value={activeMonth} onChange={e=>setActiveMonth(e.target.value)} style={{...inp,padding:"10px 12px",fontSize:"0.75rem",width:"auto"}}>
            {months.map(m=><option key={m} value={m}>{ML(m)}</option>)}
          </select>
        </div>
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}} onClick={()=>setSidebarOpen(false)}/>
          <div style={{position:"fixed",left:0,top:0,bottom:0,width:280,zIndex:9999,background:colors.card,boxShadow:"4px 0 20px rgba(0,0,0,0.3)",overflowY:"auto"}}>
            <div style={{padding:20,borderBottom:`1px solid ${colors.border}`,display:"flex",justifyContent:"space-between"}}>
              <div style={{fontSize:"0.9rem",fontWeight:700}}>Menu</div>
              <button onClick={()=>setSidebarOpen(false)} style={{width:36,height:36,borderRadius:8,background:colors.input,border:`1px solid ${colors.border}`,color:colors.textSub,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <CloseIcon size={18}/>
              </button>
            </div>
            <div style={{padding:20}}>
              <button onClick={()=>{setNewMonthModal(true);setSidebarOpen(false);}} style={{width:"100%",textAlign:"left",padding:"12px 16px",marginBottom:12,background:isDark?"rgba(52,211,153,0.15)":"rgba(16,185,129,0.15)",border:`1px solid ${colors.success}60`,borderRadius:10,cursor:"pointer",fontSize:"0.85rem",fontWeight:700,color:colors.success}}>+ Nuovo Mese</button>
              <button onClick={()=>{setLoansModal(true);setSidebarOpen(false);}} style={{width:"100%",textAlign:"left",padding:"12px 16px",marginBottom:12,background:colors.input,border:`1px solid ${colors.border}`,borderRadius:10,cursor:"pointer",fontSize:"0.85rem",fontWeight:600,color:colors.text}}>💳 Finanziamenti</button>
              <button onClick={()=>{toggleTheme();setSidebarOpen(false);}} style={{width:"100%",textAlign:"left",padding:"12px 16px",background:colors.input,border:`1px solid ${colors.border}`,borderRadius:10,cursor:"pointer",fontSize:"0.85rem",fontWeight:600,color:colors.text,display:"flex",alignItems:"center",gap:10}}>
                {isDark?<SunIcon size={18}/>:<MoonIcon size={18}/>}
                <span>{isDark?"Light":"Dark"} Mode</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* MAIN */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}}>
        
        {view==="main" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <Card onClick={()=>{setSelectedProfile("io");setView("profile");}} style={{cursor:"pointer",aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:"3rem",marginBottom:10}}>👤</div>
                <div style={{fontSize:"1rem",fontWeight:700,color:profColor("io"),marginBottom:6}}>Pierpaolo</div>
                <div style={{fontSize:"0.75rem",color:colors.textSub}}>Saldo: <strong style={{color:ioData.saldo>=0?colors.success:colors.danger}}>{fmt(ioData.saldo)}</strong></div>
              </Card>
              
              <Card onClick={()=>{setSelectedProfile("martina");setView("profile");}} style={{cursor:"pointer",aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:"3rem",marginBottom:10}}>👩</div>
                <div style={{fontSize:"1rem",fontWeight:700,color:profColor("martina"),marginBottom:6}}>Martina</div>
                <div style={{fontSize:"0.75rem",color:colors.textSub}}>Saldo: <strong style={{color:marData.saldo>=0?colors.success:colors.danger}}>{fmt(marData.saldo)}</strong></div>
              </Card>
            </div>

            <Card onClick={()=>{setSelectedProfile(null);setView("couple");}} style={{cursor:"pointer",padding:24}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{fontSize:"2.5rem"}}>💑</div>
                  <div>
                    <div style={{fontSize:"1.1rem",fontWeight:700,color:colors.accent,marginBottom:2}}>Insieme</div>
                    <div style={{fontSize:"0.75rem",color:colors.textSub}}>Vista combinata</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"0.7rem",color:colors.textSub,marginBottom:4}}>Saldo Coppia</div>
                  <div style={{fontSize:"1.3rem",fontWeight:700,color:coupData.saldo>=0?colors.success:colors.danger}}>{fmt(coupData.saldo)}</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {view==="profile" && selectedProfile && (
          <div>
            <button onClick={()=>setView("main")} style={{marginBottom:20,padding:"10px 16px",background:colors.card,border:`1px solid ${colors.border}`,color:colors.text,borderRadius:10,cursor:"pointer"}}>← Indietro</button>
            
            <div style={{fontSize:"1.2rem",fontWeight:700,marginBottom:20,color:profColor(selectedProfile)}}>{PROFILES[selectedProfile].label}</div>
            
            {/* Metodo 50/30/20 */}
            {(() => {
              const d = selectedProfile==="io"?ioData:marData;
              if(d.stipendio===0) return <Card style={{marginBottom:20}}><div style={{textAlign:"center",color:colors.textDim,padding:20}}>Inserisci stipendio per 50/30/20</div></Card>;
              return (
                <Card style={{marginBottom:20}}>
                  <div style={{fontSize:"0.75rem",color:colors.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14,fontWeight:700}}>Metodo 50/30/20 - Stipendio {fmt(d.stipendio)}</div>
                  <div style={{display:"grid",gap:10}}>
                    {[
                      {label:"50% Essenziale",budget:d.p50,spent:d.spent50},
                      {label:"30% Piacere",budget:d.p30,spent:d.spent30},
                      {label:"20% Risparmi",budget:d.p20,spent:d.spent20,inverse:true}
                    ].map(({label,budget,spent,inverse})=>{
                      const pct=(spent/budget)*100;
                      const over=inverse?(spent<budget):(spent>budget);
                      return (
                        <div key={label} style={{padding:12,background:colors.input,borderRadius:10}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:"0.75rem"}}>
                            <span>{label}</span>
                            <span style={{fontWeight:700,color:over?colors.danger:colors.success}}>{fmt(spent)} / {fmt(budget)}</span>
                          </div>
                          <div style={{background:isDark?"#0f0f0f":"#f0f0f0",borderRadius:6,height:6,overflow:"hidden"}}>
                            <div style={{height:"100%",background:over?colors.danger:colors.success,width:`${Math.min(pct,100)}%`,borderRadius:6}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })()}

            {/* Add transaction */}
            <Card style={{marginBottom:20}}>
              <div style={{fontSize:"0.7rem",color:profColor(selectedProfile),letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14,fontWeight:700}}>+ Aggiungi</div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                {["entrata","uscita","risparmi"].map(t=>(
                  <button key={t} onClick={()=>setForm({...form,type:t})} style={{flex:1,padding:"10px 0",borderRadius:10,fontSize:"0.75rem",fontWeight:600,background:form.type===t?(t==="entrata"?(isDark?"rgba(52,211,153,0.15)":"rgba(16,185,129,0.15)"):t==="risparmi"?(isDark?"rgba(251,191,36,0.15)":"rgba(245,158,11,0.15)"):(isDark?"rgba(248,113,113,0.15)":"rgba(239,68,68,0.15)")):"transparent",border:`2px solid ${form.type===t?(t==="entrata"?colors.success:t==="risparmi"?colors.accent:colors.danger):colors.border}`,color:form.type===t?(t==="entrata"?colors.success:t==="risparmi"?colors.accent:colors.danger):colors.textSub,cursor:"pointer"}}>
                    {t==="entrata"?"↑":t==="risparmi"?"💰":"↓"}
                  </button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <AmountInput inputRef={amountInputRef} style={inp} lbl={lbl}/>
                <div><label style={lbl}>DATA</label><input style={inp} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
              </div>
              <div style={{marginBottom:12}}>
                <label style={lbl}>CATEGORIA</label>
                <div style={{display:"flex",gap:8}}>
                  <select style={{...inp,flex:1}} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    <option value="">Seleziona...</option>
                    {Object.keys(data.categories||{}).map(c=><option key={c} value={c}>{c} ({data.categories[c]})</option>)}
                  </select>
                  <button onClick={()=>setNewCategoryModal(true)} style={{padding:"12px 14px",background:colors.success,border:"none",color:"#fff",borderRadius:10,cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>+</button>
                </div>
              </div>
              <button onClick={addTransaction} style={{width:"100%",padding:"14px 0",background:profColor(selectedProfile),border:"none",color:"#fff",borderRadius:10,cursor:"pointer",fontSize:"0.85rem",fontWeight:700}}>AGGIUNGI</button>
            </Card>

            {/* Macro stats */}
            <Card>
              <div style={{fontSize:"0.7rem",color:colors.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14,fontWeight:700}}>Macroaree</div>
              {(() => {
                const d=selectedProfile==="io"?ioData:marData;
                const macroData=Object.entries(d.byMacro).filter(([k,v])=>v>0&&k!=="Risparmi");
                if(macroData.length===0) return <div style={{textAlign:"center",color:colors.textDim,padding:20}}>Nessun dato</div>;
                return <PieChart data={macroData} colors={pieColors} isDark={isDark} showMoney={true}/>;
              })()}
            </Card>
          </div>
        )}

        {view==="couple" && (
          <div>
            <button onClick={()=>setView("main")} style={{marginBottom:20,padding:"10px 16px",background:colors.card,border:`1px solid ${colors.border}`,color:colors.text,borderRadius:10,cursor:"pointer"}}>← Indietro</button>
            <div style={{fontSize:"1.2rem",fontWeight:700,marginBottom:20,color:colors.accent}}>Vista Insieme</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:12}}>
              {[{l:"Entrate",v:coupData.entrate,c:colors.success},{l:"Uscite",v:coupData.uscite,c:colors.danger},{l:"Saldo",v:coupData.saldo,c:coupData.saldo>=0?colors.accent:colors.danger},{l:"Risparmi",v:coupData.savings,c:colors.accent}].map(({l,v,c})=>(
                <Card key={l} style={{padding:16}}>
                  <div style={{fontSize:"0.65rem",color:colors.textDim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>{l}</div>
                  <div style={{fontSize:"1rem",color:c,fontWeight:700}}>{fmt(v)}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
