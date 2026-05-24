import { useState, useEffect, useCallback } from "react"
import { supabase } from "./supabase.js"

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const ROLES = { admin:"Gestor", supervisor:"Supervisor", leader:"Líder", secretary:"Secretário", member:"Membro" }
const ROLE_COLORS = { admin:"#1e40af", supervisor:"#7c3aed", leader:"#059669", secretary:"#d97706", member:"#64748b" }
const DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"]
const STATUS_LIST = ["Visitante","Membro","Interessado","Afastado"]

function fmtDate(d) { if(!d) return "—"; try { const [y,m,day]=d.split("-"); return `${day}/${m}/${y}`; } catch { return d; } }
function calcAge(dob) { if(!dob) return null; const b=new Date(dob),n=new Date(); let a=n.getFullYear()-b.getFullYear(); if(n.getMonth()<b.getMonth()||(n.getMonth()===b.getMonth()&&n.getDate()<b.getDate())) a--; return a; }
function fmtCPF(v) { const d=v.replace(/\D/g,""); if(d.length>9) return d.slice(0,3)+"."+d.slice(3,6)+"."+d.slice(6,9)+"-"+d.slice(9,11); if(d.length>6) return d.slice(0,3)+"."+d.slice(3,6)+"."+d.slice(6); if(d.length>3) return d.slice(0,3)+"."+d.slice(3); return d; }
function normCPF(v) { return v.replace(/\D/g,""); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function btoa64(s) { return btoa(s); }
function atob64(s) { try { return atob(s); } catch { return s; } }

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    {name==="church"&&<><path d="M12 2v5M9.5 4.5h5M5 10h14M5 10v10h5v-5h4v5h5V10M12 7v3"/></>}
    {name==="users"&&<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}
    {name==="user-plus"&&<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>}
    {name==="check-circle"&&<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
    {name==="bar-chart"&&<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>}
    {name==="send"&&<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}
    {name==="log-out"&&<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}
    {name==="x"&&<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
    {name==="plus"&&<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
    {name==="trash"&&<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></>}
    {name==="edit"&&<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}
    {name==="grid"&&<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>}
    {name==="bell"&&<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}
    {name==="arrow-left"&&<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>}
    {name==="history"&&<><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></>}
    {name==="key"&&<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>}
    {name==="copy"&&<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
    {name==="inbox"&&<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>}
    {name==="gauge"&&<><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M12 2a10 10 0 0 1 7.39 16.56M12 2A10 10 0 0 0 4.61 18.56"/><line x1="12" y1="12" x2="16" y2="8"/></>}
    {name==="calendar"&&<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
    {name==="check"&&<polyline points="20 6 9 17 4 12"/>}
    {name==="eye"&&<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
    {name==="eye-off"&&<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}
    {name==="search"&&<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}
    {name==="refresh"&&<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}
    {name==="home"&&<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
  </svg>
)

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
const Avatar = ({ name, size=36, color="#1e40af" }) => {
  const initials = name ? name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase() : "?"
  return <div style={{width:size,height:size,borderRadius:"50%",background:color+"20",border:`2px solid ${color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:800,color,flexShrink:0}}>{initials}</div>
}

const Badge = ({ label, color="#1e40af" }) => (
  <span style={{background:color+"18",color,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,letterSpacing:"0.02em",whiteSpace:"nowrap"}}>{label}</span>
)

const Btn = ({ children, onClick, variant="primary", size="md", full=false, disabled=false, icon=null, style:extra={} }) => {
  const variants = {
    primary:{background:"#1e40af",color:"#fff",border:"none"},
    secondary:{background:"#f1f5f9",color:"#334155",border:"none"},
    danger:{background:"#fee2e2",color:"#991b1b",border:"none"},
    success:{background:"#dcfce7",color:"#166534",border:"none"},
    ghost:{background:"transparent",color:"#64748b",border:"1.5px solid #e2e8f0"},
  }
  return (
    <button disabled={disabled} onClick={onClick} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,borderRadius:12,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",transition:"all 0.15s",opacity:disabled?0.5:1,width:full?"100%":"auto",fontSize:size==="sm"?13:15,padding:size==="sm"?"8px 14px":"12px 20px",...variants[variant],...extra}}>
      {icon && <Icon name={icon} size={size==="sm"?14:16}/>}{children}
    </button>
  )
}

const Inp = ({ label, value, onChange, type="text", placeholder="", required=false, readOnly=false }) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}{required&&<span style={{color:"#ef4444",marginLeft:3}}>*</span>}</label>}
    <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} readOnly={readOnly}
      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"'Outfit',sans-serif",background:readOnly?"#f8fafc":"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"}}/>
  </div>
)

const Sel = ({ label, value, onChange, options, required=false }) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}{required&&<span style={{color:"#ef4444",marginLeft:3}}>*</span>}</label>}
    <select value={value||""} onChange={e=>onChange(e.target.value)} required={required} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"'Outfit',sans-serif",background:"#fff",color:"#1e293b",outline:"none"}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

const Card = ({ children, style:extra={} }) => (
  <div style={{background:"#fff",borderRadius:16,border:"1.5px solid #f1f5f9",padding:"16px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)",...extra}}>{children}</div>
)

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px 14px",borderBottom:"1.5px solid #f1f5f9",flexShrink:0}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:800,color:"#0f172a"}}>{title}</h3>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:6,cursor:"pointer",display:"flex",color:"#64748b"}}><Icon name="x" size={16}/></button>
        </div>
        <div style={{overflowY:"auto",padding:"16px 18px 28px",flex:1}}>{children}</div>
      </div>
    </div>
  )
}

const Toast = ({ msg, type="success" }) => {
  if (!msg) return null
  const colors = {success:["#dcfce7","#166534"],error:["#fee2e2","#991b1b"],info:["#dbeafe","#1e40af"]}
  const [bg,color] = colors[type]||colors.info
  return <div style={{position:"fixed",bottom:24,left:16,right:16,background:bg,color,borderRadius:12,padding:"12px 16px",fontWeight:700,fontSize:14,zIndex:9999,textAlign:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}>{msg}</div>
}

const Stat = ({ label, value, color="#1e40af", icon }) => (
  <div style={{background:"#fff",borderRadius:14,border:"1.5px solid #f1f5f9",padding:"14px",textAlign:"center",flex:1}}>
    {icon && <div style={{background:color+"15",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",color}}><Icon name={icon} size={18}/></div>}
    <div style={{fontSize:26,fontWeight:900,color,lineHeight:1}}>{value}</div>
    <div style={{fontSize:11,color:"#94a3b8",marginTop:4,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>{label}</div>
  </div>
)

const Loader = () => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 0",flexDirection:"column",gap:12}}>
    <div style={{width:32,height:32,border:"3px solid #e2e8f0",borderTopColor:"#1e40af",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
    <span style={{color:"#94a3b8",fontSize:13,fontWeight:600}}>Carregando...</span>
  </div>
)

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [page, setPage] = useState("login")
  const [toast, setToast] = useState({msg:"",type:"success"})
  const [loading, setLoading] = useState(false)

  const showToast = useCallback((msg, type="success") => {
    setToast({msg,type})
    setTimeout(()=>setToast({msg:"",type:"success"}),3500)
  },[])

  function doLogout() { setSession(null); setPage("login") }

  function doLogin(user) {
    setSession(user)
    const map = {admin:"admin",supervisor:"supervisor",leader:"leader",secretary:"secretary",member:"member"}
    setPage(map[user.role]||"member")
  }

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"'Outfit',sans-serif",maxWidth:480,margin:"0 auto",position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        input,select,textarea{font-family:'Outfit',sans-serif}
      `}</style>
      <Toast msg={toast.msg} type={toast.type}/>

      {page==="login" && <LoginPage onLogin={doLogin} showToast={showToast}/>}
      {page==="admin" && <AdminDashboard session={session} logout={doLogout} showToast={showToast}/>}
      {page==="secretary" && <SecretaryDashboard session={session} logout={doLogout} showToast={showToast}/>}
      {page==="leader" && <LeaderDashboard session={session} logout={doLogout} showToast={showToast}/>}
      {page==="supervisor" && <SupervisorDashboard session={session} logout={doLogout} showToast={showToast}/>}
      {page==="member" && <MemberPortal session={session} logout={doLogout}/>}
    </div>
  )
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, showToast }) {
  const [cpf, setCpf] = useState("")
  const [pw, setPw] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

async function handleLogin(e) {
    e.preventDefault()
    setErr(""); setLoading(true)
    const norm = cpf.replace(/\D/g, "")
    const { data:d1 } = await supabase.from("users").select("*").eq("cpf", norm).single()
    const { data:d2 } = await supabase.from("users").select("*").eq("cpf", cpf).single()
    const data = d1 || d2
    if (!data) { setErr("CPF não encontrado"); setLoading(false); return }
    const stored = atob64(data.password_hash)
    if (stored !== pw) { setErr("Senha incorreta"); setLoading(false); return }
    setLoading(false)
    onLogin(data)
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",background:"linear-gradient(145deg,#0f172a 0%,#1e3a5f 100%)"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:72,height:72,borderRadius:20,background:"rgba(255,255,255,0.1)",border:"1.5px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",color:"#93c5fd"}}>
          <Icon name="church" size={34}/>
        </div>
        <h1 style={{color:"#f0f9ff",fontSize:22,fontWeight:900,margin:"0 0 4px"}}>Gestão de Células</h1>
        <p style={{color:"#7dd3fc",fontSize:13,margin:0,fontWeight:500}}>Promessa Lago dos Peixes</p>
      </div>
      <div style={{background:"rgba(255,255,255,0.07)",backdropFilter:"blur(20px)",borderRadius:20,border:"1.5px solid rgba(255,255,255,0.1)",padding:"28px 24px",width:"100%",maxWidth:380}}>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#7dd3fc",marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>CPF</label>
            <input value={cpf} onChange={e=>setCpf(fmtCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} required style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 16px",fontSize:15,color:"#f0f9ff",outline:"none",fontFamily:"'Outfit',sans-serif"}}/>
          </div>
          <div style={{marginBottom:8,position:"relative"}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#7dd3fc",marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>Senha</label>
            <input value={pw} onChange={e=>setPw(e.target.value)} type={showPw?"text":"password"} placeholder="Digite sua senha" required style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 44px 12px 16px",fontSize:15,color:"#f0f9ff",outline:"none",fontFamily:"'Outfit',sans-serif"}}/>
            <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:"absolute",right:12,bottom:10,background:"none",border:"none",cursor:"pointer",color:"#7dd3fc",display:"flex"}}><Icon name={showPw?"eye-off":"eye"} size={18}/></button>
          </div>
          {err && <p style={{color:"#fca5a5",fontSize:13,margin:"8px 0",fontWeight:600}}>{err}</p>}
          <button type="submit" disabled={loading} style={{width:"100%",background:"#2563eb",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:800,padding:"13px 0",cursor:loading?"wait":"pointer",marginTop:16,fontFamily:"'Outfit',sans-serif",opacity:loading?0.7:1}}>
            {loading?"Entrando...":"Entrar"}
          </button>
        </form>
        <p style={{color:"#93c5fd",fontSize:12,textAlign:"center",marginTop:16,opacity:0.7}}>Primeiro acesso: CPF 15909815709 • senha 123456</p>
      </div>
    </div>
  )
}

// ─── HOOK: useData (fetch + realtime) ─────────────────────────────────────────
function useTable(table, filter=null) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    let q = supabase.from(table).select("*").order("created_at", {ascending:false})
    if (filter) q = q.eq(filter.col, filter.val)
    const { data:rows } = await q
    setData(rows||[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const ch = supabase.channel(`rt_${table}_${filter?.val||"all"}`)
      .on("postgres_changes", {event:"*",schema:"public",table}, ()=>load())
      .subscribe()
    return ()=>supabase.removeChannel(ch)
  },[table, filter?.val])

  return { data, loading, reload:load }
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ title, subtitle, logout, extra=null }) {
  return (
    <header style={{background:"#0f172a",padding:"16px 18px",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{color:"#f0f9ff",fontSize:16,fontWeight:800}}>{title}</div>
          {subtitle&&<div style={{color:"#7dd3fc",fontSize:12,fontWeight:500,marginTop:2}}>{subtitle}</div>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {extra}
          <button onClick={logout} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"7px 12px",cursor:"pointer",color:"#cbd5e1",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600}}>
            <Icon name="log-out" size={15}/>Sair
          </button>
        </div>
      </div>
    </header>
  )
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ session, logout, showToast }) {
  const [tab, setTab] = useState("dashboard")
  const tabs = [
    {id:"dashboard",label:"Painel",icon:"gauge"},
    {id:"cells",label:"Células",icon:"grid"},
    {id:"members",label:"Membros",icon:"users"},
    {id:"attendance",label:"Presença",icon:"check-circle"},
    {id:"reports",label:"Relatórios",icon:"bar-chart"},
    {id:"notifications",label:"Avisos",icon:"bell"},
    {id:"requests",label:"Solicits.",icon:"inbox"},
    {id:"logs",label:"Auditoria",icon:"history"},
  ]
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <header style={{background:"#0f172a",padding:"14px 18px 0",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div><div style={{color:"#f0f9ff",fontSize:16,fontWeight:800}}>Painel do Gestor</div>
            <div style={{color:"#7dd3fc",fontSize:12}}>{session?.name}</div>
          </div>
          <button onClick={logout} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"7px 12px",cursor:"pointer",color:"#cbd5e1",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600}}>
            <Icon name="log-out" size={15}/>Sair
          </button>
        </div>
        <div style={{display:"flex",gap:1,overflowX:"auto",paddingBottom:2}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?"rgba(37,99,235,0.85)":"transparent",border:"none",borderRadius:"8px 8px 0 0",padding:"7px 10px 10px",cursor:"pointer",color:tab===t.id?"#fff":"#94a3b8",fontSize:10,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:50,flexShrink:0,transition:"all 0.15s"}}>
              <Icon name={t.icon} size={15}/><span>{t.label}</span>
            </button>
          ))}
        </div>
      </header>
      <div style={{flex:1,padding:"16px 16px 80px",overflowY:"auto",animation:"fadeIn 0.2s ease"}}>
        {tab==="dashboard" && <AdminOverview session={session} showToast={showToast} setTab={setTab}/>}
        {tab==="cells" && <CellsPanel session={session} showToast={showToast}/>}
        {tab==="members" && <MembersPanel session={session} showToast={showToast}/>}
        {tab==="attendance" && <AttendancePanel session={session} showToast={showToast}/>}
        {tab==="reports" && <ReportsPanel/>}
        {tab==="notifications" && <NotificationsPanel session={session} showToast={showToast}/>}
        {tab==="requests" && <RequestsPanel session={session} showToast={showToast}/>}
        {tab==="logs" && <LogsPanel/>}
      </div>
    </div>
  )
}

function AdminOverview({ session, showToast, setTab }) {
  const { data:cells } = useTable("cells")
  const { data:members } = useTable("members")
  const { data:notifs } = useTable("notifications")
  const baptized = members.filter(m=>m.baptism_date).length
  const pending = notifs.filter(n=>n.type==="request"&&n.status==="pending").length
  return (
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Visão Geral</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <Stat label="Células" value={cells.length} color="#2563eb" icon="grid"/>
        <Stat label="Membros" value={members.length} color="#059669" icon="users"/>
        <Stat label="Batizados" value={baptized} color="#d97706" icon="check-circle"/>
        <Stat label="Pendências" value={pending} color="#7c3aed" icon="inbox"/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Btn full icon="grid" onClick={()=>setTab("cells")}>Gerenciar Células</Btn>
        <Btn full variant="secondary" icon="users" onClick={()=>setTab("members")}>Gerenciar Membros</Btn>
        <Btn full variant="secondary" icon="check-circle" onClick={()=>setTab("attendance")}>Registrar Presença</Btn>
      </div>
    </div>
  )
}

// ─── CELLS PANEL ──────────────────────────────────────────────────────────────
function CellsPanel({ session, showToast }) {
  const { data:cells, loading, reload } = useTable("cells")
  const { data:members } = useTable("members")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [linkModal, setLinkModal] = useState(null)
  const emptyForm = {name:"",day:"Quarta",time:"19:30",neighborhood:"",street:"",number:"",cep:"",leader_id:"",secretary_id:"",host_id:"",supervisor_id:""}
  const [form, setForm] = useState(emptyForm)
  const f = k => v => setForm(p=>({...p,[k]:v}))

  function openEdit(c) { setForm({name:c.name,day:c.day||"Quarta",time:c.time||"",neighborhood:c.neighborhood||"",street:c.street||"",number:c.number||"",cep:c.cep||"",leader_id:c.leader_id||"",secretary_id:c.secretary_id||"",host_id:c.host_id||"",supervisor_id:c.supervisor_id||""}); setEditing(c.id); setModal(true) }

  async function searchCep(cep) {
    const c=cep.replace(/\D/g,""); if(c.length!==8) return
    try { const r=await fetch(`https://viacep.com.br/ws/${c}/json/`); const d=await r.json(); if(!d.erro){setForm(p=>({...p,street:d.logradouro||"",neighborhood:d.bairro||""}))}} catch {}
  }

  async function save() {
    if (!form.name.trim()) { showToast("Nome é obrigatório","error"); return }
    const payload = {...form, name:form.name.trim().toUpperCase()}
    if (editing) {
      await supabase.from("cells").update(payload).eq("id",editing)
      await addLog(session,"update",`Célula atualizada: ${form.name}`)
      showToast("Célula atualizada!")
    } else {
      await supabase.from("cells").insert(payload)
      await addLog(session,"create",`Célula criada: ${form.name}`)
      showToast("Célula criada!")
    }
    setModal(false); setEditing(null); setForm(emptyForm)
  }

  async function del() {
    await supabase.from("cells").delete().eq("id",deleteId)
    await addLog(session,"delete","Célula removida")
    showToast("Célula removida"); setDeleteId(null)
  }

  const mOpts = [{value:"",label:"— Nenhum —"},...members.map(m=>({value:m.id,label:m.name}))]

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Células</h2>
        <Btn icon="plus" size="sm" onClick={()=>{setForm(emptyForm);setEditing(null);setModal(true)}}>Nova</Btn>
      </div>
      {loading && <Loader/>}
      {!loading && cells.length===0 && <Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhuma célula cadastrada</p></Card>}
      {cells.map(cell=>{
        const mc = members.filter(m=>m.cell_id===cell.id).length
        const leader = members.find(m=>m.id===cell.leader_id)
        const secretary = members.find(m=>m.id===cell.secretary_id)
        const url = `${window.location.origin}${window.location.pathname}?signup=${cell.signup_token}`
        return (
          <Card key={cell.id} style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
              <div><div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{cell.name}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{cell.neighborhood||"—"} • {cell.day} às {cell.time||"—"}</div>
              </div>
              <div style={{display:"flex",gap:5}}>
                <button onClick={()=>setLinkModal(url)} style={{background:"#f0fdf4",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#059669"}}><Icon name="copy" size={14}/></button>
                <button onClick={()=>openEdit(cell)} style={{background:"#eff6ff",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#2563eb"}}><Icon name="edit" size={14}/></button>
                <button onClick={()=>setDeleteId(cell.id)} style={{background:"#fef2f2",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#dc2626"}}><Icon name="trash" size={14}/></button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12,color:"#64748b"}}>
              <span>👤 Líder: <b style={{color:"#334155"}}>{leader?.name||"—"}</b></span>
              <span>✍️ Secret.: <b style={{color:"#334155"}}>{secretary?.name||"—"}</b></span>
              <span>👥 Membros: <b style={{color:"#334155"}}>{mc}</b></span>
              <span>📍 {cell.street?`${cell.street}, ${cell.number||"s/n"}`:"Endereço n/d"}</span>
            </div>
          </Card>
        )
      })}

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Editar Célula":"Nova Célula"}>
        <Inp label="Nome" value={form.name} onChange={v=>f("name")(v.toUpperCase())} required/>
        <Sel label="Dia" value={form.day} onChange={f("day")} options={DAYS.map(d=>({value:d,label:d}))}/>
        <Inp label="Horário" type="time" value={form.time} onChange={f("time")}/>
        <Inp label="CEP" value={form.cep} onChange={v=>{f("cep")(v);searchCep(v)}} placeholder="00000-000" maxLength={9}/>
        <Inp label="Rua/Avenida" value={form.street} onChange={f("street")}/>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
          <Inp label="Bairro" value={form.neighborhood} onChange={f("neighborhood")}/>
          <Inp label="Número" value={form.number} onChange={f("number")}/>
        </div>
        <Sel label="Líder" value={form.leader_id} onChange={f("leader_id")} options={mOpts}/>
        <Sel label="Secretário" value={form.secretary_id} onChange={f("secretary_id")} options={mOpts}/>
        <Sel label="Anfitrião" value={form.host_id} onChange={f("host_id")} options={mOpts}/>
        <Sel label="Supervisor" value={form.supervisor_id} onChange={f("supervisor_id")} options={mOpts}/>
        <Btn full onClick={save} style={{marginTop:8}}>{editing?"Salvar Alterações":"Criar Célula"}</Btn>
      </Modal>

      <Modal open={!!linkModal} onClose={()=>setLinkModal(null)} title="Link de Cadastro">
        <p style={{fontSize:13,color:"#64748b",marginBottom:12}}>Compartilhe com novos membros para se cadastrarem:</p>
        <div style={{background:"#f8fafc",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#334155",wordBreak:"break-all",border:"1.5px solid #e2e8f0",marginBottom:14}}>{linkModal}</div>
        <Btn full icon="copy" onClick={()=>{navigator.clipboard.writeText(linkModal||"");showToast("Link copiado!")}}>Copiar Link</Btn>
      </Modal>

      {deleteId && <Modal open title="Confirmar Exclusão" onClose={()=>setDeleteId(null)}>
        <p style={{color:"#64748b",marginBottom:16}}>Tem certeza que deseja remover esta célula?</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Btn variant="ghost" onClick={()=>setDeleteId(null)}>Cancelar</Btn>
          <Btn variant="danger" onClick={del}>Excluir</Btn>
        </div>
      </Modal>}
    </div>
  )
}

// ─── MEMBERS PANEL ────────────────────────────────────────────────────────────
function MembersPanel({ session, showToast }) {
  const { data:members, loading } = useTable("members")
  const { data:cells } = useTable("cells")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [pwModal, setPwModal] = useState(null)
  const [newPw, setNewPw] = useState("")
  const [search, setSearch] = useState("")
  const emptyForm = {name:"",cpf:"",dob:"",age:"",gender:"Masculino",phone:"",email:"",neighborhood:"",cell_id:"",status:"Visitante",role:"member",baptism_date:"",invited_by:"",father_name:"",mother_name:"",spouse_name:""}
  const [form, setForm] = useState(emptyForm)
  const f = k => v => setForm(p=>({...p,[k]:v}))

  function openEdit(m) { setForm({name:m.name,cpf:m.cpf||"",dob:m.dob||"",age:m.age||"",gender:m.gender||"Masculino",phone:m.phone||"",email:m.email||"",neighborhood:m.neighborhood||"",cell_id:m.cell_id||"",status:m.status||"Visitante",role:m.role||"member",baptism_date:m.baptism_date||"",invited_by:m.invited_by||"",father_name:m.father_name||"",mother_name:m.mother_name||"",spouse_name:m.spouse_name||""}); setEditing(m.id); setModal(true) }

  async function save() {
    if (!form.name.trim()) { showToast("Nome é obrigatório","error"); return }
    const payload = {...form, name:form.name.trim().toUpperCase(), cpf:normCPF(form.cpf), age:form.dob?calcAge(form.dob):(parseInt(form.age)||0)}
    if (editing) {
      await supabase.from("members").update(payload).eq("id",editing)
      await supabase.from("users").update({role:form.role,cell_id:form.cell_id}).eq("member_id",editing)
      await addLog(session,"update",`Membro atualizado: ${form.name}`)
      showToast("Membro atualizado!")
    } else {
      const {data:newM} = await supabase.from("members").insert(payload).select().single()
      if (newM) {
        await supabase.from("users").insert({member_id:newM.id,cpf:normCPF(form.cpf)||`TMP_${newM.id}`,password_hash:btoa64("123456"),name:form.name.trim().toUpperCase(),role:form.role,cell_id:form.cell_id})
        await addLog(session,"create",`Membro criado: ${form.name}`)
        showToast("Membro criado! Senha padrão: 123456")
      }
    }
    setModal(false); setEditing(null); setForm(emptyForm)
  }

  async function del() {
    await supabase.from("users").delete().eq("member_id",deleteId)
    await supabase.from("members").delete().eq("id",deleteId)
    await addLog(session,"delete","Membro removido")
    showToast("Membro removido"); setDeleteId(null)
  }

  async function resetPw() {
    if (newPw.length<6) { showToast("Senha muito curta","error"); return }
    await supabase.from("users").update({password_hash:btoa64(newPw)}).eq("member_id",pwModal)
    showToast("Senha redefinida!"); setPwModal(null); setNewPw("")
  }

  const filtered = members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||(m.phone||"").includes(search))
  const cOpts = [{value:"",label:"— Sem célula —"},...cells.map(c=>({value:c.id,label:c.name}))]
  const rOpts = Object.entries(ROLES).map(([v,l])=>({value:v,label:l}))

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Membros <span style={{fontSize:13,color:"#94a3b8",fontWeight:600}}>({members.length})</span></h2>
        <Btn icon="plus" size="sm" onClick={()=>{setForm(emptyForm);setEditing(null);setModal(true)}}>Novo</Btn>
      </div>
      <div style={{position:"relative",marginBottom:12}}>
        <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",pointerEvents:"none"}}><Icon name="search" size={15}/></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome ou telefone..." style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px 10px 36px",fontSize:14,outline:"none"}}/>
      </div>
      {loading && <Loader/>}
      {!loading && filtered.length===0 && <Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhum membro encontrado</p></Card>}
      {filtered.map(m=>{
        const cell = cells.find(c=>c.id===m.cell_id)
        const sc = m.status==="Membro"?"#059669":m.status==="Visitante"?"#2563eb":m.status==="Afastado"?"#dc2626":"#d97706"
        return (
          <Card key={m.id} style={{marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
              <Avatar name={m.name} size={40} color={ROLE_COLORS[m.role]||"#64748b"}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
                <div style={{fontSize:12,color:"#94a3b8"}}>{cell?.name||"Sem célula"} • {m.phone||"—"}</div>
              </div>
              <Badge label={m.status} color={sc}/>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              <Badge label={ROLES[m.role]||"Membro"} color={ROLE_COLORS[m.role]||"#64748b"}/>
              {m.baptism_date&&<Badge label="Batizado" color="#d97706"/>}
              {m.age&&<span style={{fontSize:11,color:"#94a3b8"}}>{m.age} anos</span>}
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
              <button onClick={()=>{setPwModal(m.id);setNewPw("")}} style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"5px 10px",cursor:"pointer",color:"#64748b",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><Icon name="key" size={12}/>Senha</button>
              <button onClick={()=>openEdit(m)} style={{background:"#eff6ff",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#2563eb"}}><Icon name="edit" size={14}/></button>
              <button onClick={()=>setDeleteId(m.id)} style={{background:"#fef2f2",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#dc2626"}}><Icon name="trash" size={14}/></button>
            </div>
          </Card>
        )
      })}

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Editar Membro":"Novo Membro"}>
        <Inp label="Nome Completo" value={form.name} onChange={v=>f("name")(v.toUpperCase())} required/>
        <Sel label="Status" value={form.status} onChange={f("status")} options={STATUS_LIST.map(s=>({value:s,label:s}))}/>
        <Sel label="Função/Perfil" value={form.role} onChange={f("role")} options={rOpts}/>
        <Inp label="CPF" value={form.cpf} onChange={v=>f("cpf")(fmtCPF(v))} placeholder="000.000.000-00"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Nasc." type="date" value={form.dob} onChange={v=>{f("dob")(v);f("age")(calcAge(v)||"")}}/>
          <Inp label="Idade" value={form.age} onChange={f("age")} type="number" readOnly={!!form.dob}/>
        </div>
        <Sel label="Sexo" value={form.gender} onChange={f("gender")} options={["Masculino","Feminino"].map(s=>({value:s,label:s}))}/>
        <Inp label="Telefone (WhatsApp)" value={form.phone} onChange={f("phone")} placeholder="(00) 00000-0000"/>
        <Inp label="E-mail" type="email" value={form.email} onChange={f("email")}/>
        <Inp label="Bairro" value={form.neighborhood} onChange={v=>f("neighborhood")(v.toUpperCase())}/>
        <Sel label="Célula" value={form.cell_id} onChange={f("cell_id")} options={cOpts}/>
        <Inp label="Convidado por" value={form.invited_by} onChange={v=>f("invited_by")(v.toUpperCase())}/>
        <Inp label="Data do Batismo" type="date" value={form.baptism_date} onChange={f("baptism_date")}/>
        <div style={{borderTop:"1.5px solid #f1f5f9",margin:"8px 0",paddingTop:10}}>
          <p style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>Família</p>
          <Inp label="Nome do Pai" value={form.father_name} onChange={v=>f("father_name")(v.toUpperCase())}/>
          <Inp label="Nome da Mãe" value={form.mother_name} onChange={v=>f("mother_name")(v.toUpperCase())}/>
          <Inp label="Cônjuge" value={form.spouse_name} onChange={v=>f("spouse_name")(v.toUpperCase())}/>
        </div>
        <Btn full onClick={save} style={{marginTop:8}}>{editing?"Salvar Alterações":"Criar Membro"}</Btn>
      </Modal>

      {pwModal&&<Modal open title="Redefinir Senha" onClose={()=>setPwModal(null)}>
        <p style={{fontSize:13,color:"#64748b",marginBottom:12}}>Nova senha para este membro:</p>
        <Inp label="Nova Senha" type="password" value={newPw} onChange={setNewPw} placeholder="Mínimo 6 caracteres"/>
        <Btn full onClick={resetPw}>Redefinir Senha</Btn>
      </Modal>}

      {deleteId&&<Modal open title="Confirmar Exclusão" onClose={()=>setDeleteId(null)}>
        <p style={{color:"#64748b",marginBottom:16}}>Remover este membro e seu acesso ao sistema?</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Btn variant="ghost" onClick={()=>setDeleteId(null)}>Cancelar</Btn>
          <Btn variant="danger" onClick={del}>Excluir</Btn>
        </div>
      </Modal>}
    </div>
  )
}

// ─── ATTENDANCE PANEL ─────────────────────────────────────────────────────────
function AttendancePanel({ session, showToast }) {
  const { data:cells } = useTable("cells")
  const { data:members } = useTable("members")
  const { data:allAtt, reload } = useTable("attendance")
  const [cellId, setCellId] = useState("")
  const [date, setDate] = useState(todayStr())
  const [theme, setTheme] = useState("")
  const [marks, setMarks] = useState({})
  const [saving, setSaving] = useState(false)

  const cellMembers = members.filter(m=>m.cell_id===cellId)
  const presentCount = Object.values(marks).filter(v=>v==="Presente").length
  const pct = cellMembers.length ? Math.round(presentCount/cellMembers.length*100) : 0

  async function save() {
    if (!cellId||!date) { showToast("Selecione célula e data","error"); return }
    setSaving(true)
    const records = cellMembers.map(m=>({member_id:m.id,member_name:m.name,cell_id:cellId,date,theme,status:marks[m.id]||"Ausente",recorded_by:session.id}))
    await supabase.from("attendance").insert(records)
    await addLog(session,"create",`Presença registrada: ${date}`)
    showToast("Presença salva!"); setSaving(false); setMarks({})
  }

  const grouped = {}
  allAtt.filter(a=>a.cell_id===cellId).forEach(a=>{ if(!grouped[a.date]) grouped[a.date]=[]; grouped[a.date].push(a) })
  const recentDates = Object.keys(grouped).sort().reverse().slice(0,5)

  return (
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Registrar Presença</h2>
      <Card style={{marginBottom:14}}>
        <Sel label="Célula" value={cellId} onChange={v=>{setCellId(v);setMarks({})}} options={[{value:"",label:"Selecione a célula..."},...cells.map(c=>({value:c.id,label:c.name}))]}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Data" type="date" value={date} onChange={setDate}/>
          <Inp label="Tema" value={theme} onChange={setTheme} placeholder="Opcional"/>
        </div>
      </Card>

      {cellMembers.length>0&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:700,color:"#64748b"}}>Chamada ({cellMembers.length})</span>
            <span style={{fontSize:14,fontWeight:900,color:pct>=75?"#059669":pct>=50?"#d97706":"#dc2626"}}>{presentCount}/{cellMembers.length} • {pct}%</span>
          </div>
          {cellMembers.map(m=>{
            const s=marks[m.id]
            return (
              <Card key={m.id} style={{marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <Avatar name={m.name} size={32} color="#2563eb"/>
                  <span style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{m.name}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                  {["Presente","Ausente","Justificado"].map(v=>(
                    <button key={v} onClick={()=>setMarks(p=>({...p,[m.id]:v}))} style={{padding:"8px 4px",borderRadius:8,fontSize:12,fontWeight:700,border:`1.5px solid ${s===v?(v==="Presente"?"#059669":v==="Ausente"?"#dc2626":"#d97706"):"#e2e8f0"}`,background:s===v?(v==="Presente"?"#dcfce7":v==="Ausente"?"#fee2e2":"#fef3c7"):"#f8fafc",color:s===v?(v==="Presente"?"#166534":v==="Ausente"?"#991b1b":"#92400e"):"#64748b",cursor:"pointer"}}>
                      {v==="Presente"?"✓ Presente":v==="Ausente"?"✗ Ausente":"? Justif."}
                    </button>
                  ))}
                </div>
              </Card>
            )
          })}
          <Btn full onClick={save} disabled={saving} icon="check" style={{marginTop:12}}>{saving?"Salvando...":"Salvar Presença"}</Btn>
        </>
      )}

      {recentDates.length>0&&(
        <div style={{marginTop:24}}>
          <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:10}}>Histórico Recente</h3>
          {recentDates.map(d=>{
            const items=grouped[d]; const p=items.filter(i=>i.status==="Presente").length
            return (
              <div key={d} style={{background:"#f8fafc",borderRadius:10,padding:"10px 14px",marginBottom:6,border:"1.5px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:13,fontWeight:700,color:"#334155"}}>{fmtDate(d)}</div>
                  {items[0]?.theme&&<div style={{fontSize:11,color:"#94a3b8"}}>{items[0].theme}</div>}
                </div>
                <div style={{display:"flex",gap:6}}>
                  <Badge label={`✓ ${p}`} color="#059669"/>
                  <Badge label={`✗ ${items.length-p}`} color="#dc2626"/>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── REPORTS PANEL ────────────────────────────────────────────────────────────
function ReportsPanel() {
  const { data:members } = useTable("members")
  const { data:cells } = useTable("cells")
  const { data:attendance } = useTable("attendance")

  const Bar = ({value,max,color}) => (
    <div style={{height:8,background:"#f1f5f9",borderRadius:4,overflow:"hidden",flex:1}}>
      <div style={{height:"100%",width:`${max?Math.round(value/max*100):0}%`,background:color,borderRadius:4}}/>
    </div>
  )

  const genderData = members.reduce((a,m)=>{a[m.gender||"N/I"]=(a[m.gender||"N/I"]||0)+1;return a},{})
  const statusData = members.reduce((a,m)=>{a[m.status||"N/I"]=(a[m.status||"N/I"]||0)+1;return a},{})
  const cellData = cells.map(c=>({name:c.name,count:members.filter(m=>m.cell_id===c.id).length})).sort((a,b)=>b.count-a.count)
  const baptized = members.filter(m=>m.baptism_date).length

  const attByMember = {}
  attendance.forEach(a=>{
    if(!attByMember[a.member_id]) attByMember[a.member_id]={name:a.member_name,total:0,present:0}
    attByMember[a.member_id].total++
    if(a.status==="Presente") attByMember[a.member_id].present++
  })
  const attList = Object.values(attByMember).sort((a,b)=>(b.present/b.total||0)-(a.present/a.total||0)).slice(0,15)

  return (
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Relatórios</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <Stat label="Membros" value={members.length} color="#2563eb" icon="users"/>
        <Stat label="Batizados" value={baptized} color="#d97706" icon="check-circle"/>
        <Stat label="Células" value={cells.length} color="#059669" icon="grid"/>
        <Stat label="Encontros" value={[...new Set(attendance.map(a=>a.date))].length} color="#7c3aed" icon="calendar"/>
      </div>

      {[
        {title:"Por Sexo",data:genderData,color:"#2563eb"},
        {title:"Por Status",data:statusData,color:"#059669"}
      ].map(({title,data,color})=>(
        <Card key={title} style={{marginBottom:12}}>
          <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>{title}</h3>
          {Object.entries(data).map(([k,v])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:600,color:"#334155",minWidth:90}}>{k}</span>
              <Bar value={v} max={members.length} color={color}/>
              <span style={{fontSize:12,fontWeight:700,color,minWidth:24,textAlign:"right"}}>{v}</span>
            </div>
          ))}
        </Card>
      ))}

      <Card style={{marginBottom:12}}>
        <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Membros por Célula</h3>
        {cellData.map(({name,count})=>(
          <div key={name} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontSize:12,fontWeight:600,color:"#334155",minWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
            <Bar value={count} max={Math.max(...cellData.map(c=>c.count),1)} color="#7c3aed"/>
            <span style={{fontSize:12,fontWeight:700,color:"#7c3aed",minWidth:24,textAlign:"right"}}>{count}</span>
          </div>
        ))}
        {cellData.length===0&&<p style={{color:"#94a3b8",fontSize:13,margin:0}}>Sem dados</p>}
      </Card>

      {attList.length>0&&(
        <Card>
          <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Frequência Individual</h3>
          {attList.map(({name,total,present})=>{
            const pct=Math.round(present/total*100)
            const color=pct>=75?"#059669":pct>=50?"#d97706":"#dc2626"
            return (
              <div key={name} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:600,color:"#334155",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                  <span style={{fontSize:12,fontWeight:800,color,marginLeft:8}}>{pct}%</span>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden",flex:1}}>
                    <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:10,color:"#94a3b8",flexShrink:0}}>{present}/{total}</span>
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────
function NotificationsPanel({ session, showToast }) {
  const { data:cells } = useTable("cells")
  const { data:members } = useTable("members")
  const { data:notifs } = useTable("notifications")
  const [form, setForm] = useState({title:"",message:"",target:"all",cell_id:"",channels:{sms:false,whatsapp:true,email:false}})
  const f = k => v => setForm(p=>({...p,[k]:v}))

  const hist = notifs.filter(n=>n.type==="notification")

  async function send() {
    if (!form.title||!form.message) { showToast("Título e mensagem obrigatórios","error"); return }
    const channels = Object.entries(form.channels).filter(([,v])=>v).map(([k])=>k.toUpperCase())
    if (!channels.length) { showToast("Selecione ao menos um canal","error"); return }
    const targets = form.target==="all" ? members : members.filter(m=>m.cell_id===form.cell_id)
    await supabase.from("notifications").insert({type:"notification",title:form.title,message:form.message,channels,target:form.target,cell_id:form.cell_id||null,target_count:targets.length,sent_by:session.id})
    await addLog(session,"create",`Notificação: ${form.title} → ${targets.length} membros`)
    showToast(`Notificação enviada para ${targets.length} membros!`)
    setForm(p=>({...p,title:"",message:""}))
  }

  return (
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Enviar Notificações</h2>
      <Card style={{marginBottom:14}}>
        <Sel label="Enviar para" value={form.target} onChange={f("target")} options={[{value:"all",label:"Todos os membros"},{value:"cell",label:"Uma célula específica"}]}/>
        {form.target==="cell"&&<Sel label="Célula" value={form.cell_id} onChange={f("cell_id")} options={cells.map(c=>({value:c.id,label:c.name}))}/>}
        <Inp label="Título" value={form.title} onChange={f("title")} placeholder="Ex: Encontro cancelado" required/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}>Mensagem</label>
          <textarea value={form.message} onChange={e=>f("message")(e.target.value)} placeholder="Escreva a mensagem..." rows={4} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"'Outfit',sans-serif",resize:"vertical",outline:"none"}}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8,letterSpacing:"0.05em",textTransform:"uppercase"}}>Canais</label>
          <div style={{display:"flex",gap:8}}>
            {["sms","whatsapp","email"].map(ch=>(
              <button key={ch} onClick={()=>setForm(p=>({...p,channels:{...p.channels,[ch]:!p.channels[ch]}}))} style={{flex:1,padding:"10px 6px",borderRadius:10,border:`1.5px solid ${form.channels[ch]?"#2563eb":"#e2e8f0"}`,background:form.channels[ch]?"#eff6ff":"#f8fafc",color:form.channels[ch]?"#1e40af":"#94a3b8",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                {ch==="sms"?"📱 SMS":ch==="whatsapp"?"💬 WhatsApp":"📧 E-mail"}
              </button>
            ))}
          </div>
        </div>
        <Btn full icon="send" onClick={send}>Enviar</Btn>
      </Card>

      <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:10}}>Histórico</h3>
      {hist.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhuma notificação enviada</p></Card>}
      {hist.map(n=>(
        <Card key={n.id} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:13,fontWeight:800,color:"#0f172a"}}>{n.title}</span>
            <span style={{fontSize:11,color:"#94a3b8"}}>{fmtDate(n.sent_at?.split("T")[0])}</span>
          </div>
          <p style={{fontSize:12,color:"#64748b",margin:"0 0 8px",lineHeight:1.5}}>{n.message}</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {n.channels?.map(c=><Badge key={c} label={c} color="#2563eb"/>)}
            <Badge label={`${n.target_count} membros`} color="#059669"/>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── REQUESTS PANEL ───────────────────────────────────────────────────────────
function RequestsPanel({ session, showToast }) {
  const { data:requests } = useTable("notifications")
  const reqs = requests.filter(n=>n.type==="request")
  const sc = {pending:"#d97706",approved:"#059669",rejected:"#dc2626"}
  const sl = {pending:"Pendente",approved:"Aprovado",rejected:"Rejeitado"}

  async function resolve(id, status) {
    await supabase.from("notifications").update({status,resolved_by:session.id,resolved_at:new Date().toISOString()}).eq("id",id)
    await addLog(session,"update",`Solicitação ${status==="approved"?"aprovada":"rejeitada"}`)
    showToast(status==="approved"?"Aprovado!":"Rejeitado")
  }

  return (
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Solicitações</h2>
      {reqs.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhuma solicitação</p></Card>}
      {reqs.map(r=>(
        <Card key={r.id} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{r.title}</span>
            <Badge label={sl[r.status]||r.status} color={sc[r.status]||"#64748b"}/>
          </div>
          <p style={{fontSize:12,color:"#64748b",margin:"0 0 8px"}}>{r.message}</p>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:8}}>De: {r.from_name||"—"} • {fmtDate(r.sent_at?.split("T")[0])}</div>
          {r.status==="pending"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <Btn variant="success" size="sm" onClick={()=>resolve(r.id,"approved")}>✓ Aprovar</Btn>
              <Btn variant="danger" size="sm" onClick={()=>resolve(r.id,"rejected")}>✗ Rejeitar</Btn>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

// ─── LOGS PANEL ───────────────────────────────────────────────────────────────
function LogsPanel() {
  const { data:logs, loading } = useTable("logs")
  const emoji = {create:"➕",update:"✏️",delete:"🗑️"}
  return (
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Auditoria</h2>
      {loading&&<Loader/>}
      {!loading&&logs.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhum registro</p></Card>}
      {logs.map(log=>(
        <div key={log.id} style={{background:"#f8fafc",borderRadius:10,padding:"10px 14px",marginBottom:6,border:"1.5px solid #f1f5f9"}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
            <span>{emoji[log.action]||"📝"}</span>
            <span style={{fontSize:12,fontWeight:700,color:"#334155"}}>{log.detail}</span>
          </div>
          <span style={{fontSize:11,color:"#94a3b8"}}>{new Date(log.created_at).toLocaleString("pt-BR")}</span>
        </div>
      ))}
    </div>
  )
}

// ─── SECRETARY DASHBOARD ──────────────────────────────────────────────────────
function SecretaryDashboard({ session, logout, showToast }) {
  const [sub, setSub] = useState("home")
  const { data:cells } = useTable("cells")
  const { data:members } = useTable("members")
  const { data:attendance } = useTable("attendance")
  const cell = cells.find(c=>c.id===session.cell_id)
  const cellMembers = members.filter(m=>m.cell_id===session.cell_id)
  const lastDate = [...new Set(attendance.filter(a=>a.cell_id===session.cell_id).map(a=>a.date))].sort().reverse()[0]
  const presentCount = attendance.filter(a=>a.date===lastDate&&a.status==="Presente"&&a.cell_id===session.cell_id).length

  const menu = [
    {id:"members",icon:"users",label:"Membros",desc:"Gerenciar cadastros",color:"#059669"},
    {id:"attendance",icon:"check-circle",label:"Presença",desc:"Registrar reunião",color:"#2563eb"},
    {id:"reports",icon:"bar-chart",label:"Relatórios",desc:"Frequência e dados",color:"#d97706"},
    {id:"notifications",icon:"send",label:"Avisos",desc:"Enviar comunicados",color:"#7c3aed"},
  ]

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header title={cell?.name||"Minha Célula"} subtitle={`${cell?.neighborhood||""} • ${cell?.day||""} • Secretário`} logout={logout}/>
      {sub==="home"?(
        <div style={{flex:1,padding:"16px 16px 80px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            <Stat label="Membros" value={cellMembers.length} color="#059669" icon="users"/>
            <Stat label="Presentes (últ.)" value={presentCount} color="#2563eb" icon="check-circle"/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {menu.map(item=>(
              <button key={item.id} onClick={()=>setSub(item.id)} style={{background:"#fff",borderRadius:16,border:"1.5px solid #f1f5f9",padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{width:46,height:46,borderRadius:12,background:item.color+"15",display:"flex",alignItems:"center",justifyContent:"center",color:item.color,flexShrink:0}}><Icon name={item.icon} size={22}/></div>
                <div><div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{item.label}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{item.desc}</div></div>
              </button>
            ))}
          </div>
        </div>
      ):(
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"12px 16px",borderBottom:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",gap:10,background:"#fff"}}>
            <button onClick={()=>setSub("home")} style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:6,cursor:"pointer",color:"#64748b",display:"flex"}}><Icon name="arrow-left" size={16}/></button>
            <span style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>{menu.find(i=>i.id===sub)?.label}</span>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>
            {sub==="members"&&<MembersPanel session={session} showToast={showToast}/>}
            {sub==="attendance"&&<AttendancePanel session={session} showToast={showToast}/>}
            {sub==="reports"&&<ReportsPanel/>}
            {sub==="notifications"&&<NotificationsPanel session={session} showToast={showToast}/>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── LEADER DASHBOARD ─────────────────────────────────────────────────────────
function LeaderDashboard({ session, logout, showToast }) {
  const [sub, setSub] = useState("home")
  const { data:cells } = useTable("cells")
  const { data:members } = useTable("members")
  const { data:attendance } = useTable("attendance")
  const cell = cells.find(c=>c.id===session.cell_id)
  const cellMembers = members.filter(m=>m.cell_id===session.cell_id)
  const cellAtt = attendance.filter(a=>a.cell_id===session.cell_id)
  const attByM = {}
  cellAtt.forEach(a=>{if(!attByM[a.member_id])attByM[a.member_id]={name:a.member_name,total:0,present:0};attByM[a.member_id].total++;if(a.status==="Presente")attByM[a.member_id].present++})

  const menu = [
    {id:"members",icon:"users",label:"Membros",desc:"Ver todos",color:"#2563eb"},
    {id:"frequency",icon:"bar-chart",label:"Frequência",desc:"Relatórios",color:"#059669"},
    {id:"notifications",icon:"send",label:"Avisos",desc:"Enviar comunicados",color:"#7c3aed"},
  ]

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header title={cell?.name||"Minha Célula"} subtitle="Líder" logout={logout}/>
      {sub==="home"?(
        <div style={{flex:1,padding:"16px 16px 80px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            <Stat label="Membros" value={cellMembers.length} color="#2563eb" icon="users"/>
            <Stat label="Encontros" value={[...new Set(cellAtt.map(a=>a.date))].length} color="#059669" icon="calendar"/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {menu.map(item=>(
              <button key={item.id} onClick={()=>setSub(item.id)} style={{background:"#fff",borderRadius:16,border:"1.5px solid #f1f5f9",padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{width:46,height:46,borderRadius:12,background:item.color+"15",display:"flex",alignItems:"center",justifyContent:"center",color:item.color,flexShrink:0}}><Icon name={item.icon} size={22}/></div>
                <div><div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{item.label}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{item.desc}</div></div>
              </button>
            ))}
          </div>
        </div>
      ):(
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"12px 16px",borderBottom:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",gap:10,background:"#fff"}}>
            <button onClick={()=>setSub("home")} style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:6,cursor:"pointer",color:"#64748b",display:"flex"}}><Icon name="arrow-left" size={16}/></button>
            <span style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>{menu.find(i=>i.id===sub)?.label}</span>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>
            {sub==="members"&&(
              <div>
                {cellMembers.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhum membro</p></Card>}
                {cellMembers.map(m=>(
                  <Card key={m.id} style={{marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <Avatar name={m.name} size={36} color={ROLE_COLORS[m.role]||"#64748b"}/>
                      <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{m.name}</div>
                        <div style={{fontSize:12,color:"#94a3b8"}}>{m.phone||"—"} • {m.status}</div>
                      </div>
                      {m.baptism_date&&<Badge label="Batizado" color="#d97706"/>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {sub==="frequency"&&(
              <div>
                {Object.values(attByM).length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhum dado ainda</p></Card>}
                {Object.values(attByM).sort((a,b)=>(b.present/b.total)-(a.present/a.total)).map(({name,total,present})=>{
                  const pct=Math.round(present/total*100)
                  const color=pct>=75?"#059669":pct>=50?"#d97706":"#dc2626"
                  return (
                    <Card key={name} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{name}</span>
                        <span style={{fontSize:14,fontWeight:800,color}}>{pct}%</span>
                      </div>
                      <div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3}}/>
                      </div>
                      <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{present}/{total} encontros</div>
                    </Card>
                  )
                })}
              </div>
            )}
            {sub==="notifications"&&<NotificationsPanel session={session} showToast={showToast}/>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SUPERVISOR DASHBOARD ─────────────────────────────────────────────────────
function SupervisorDashboard({ session, logout, showToast }) {
  const { data:cells } = useTable("cells")
  const { data:members } = useTable("members")
  const supervised = cells.filter(c=>c.supervisor_id===session.member_id||c.supervisor_id===session.id)

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header title="Supervisor" subtitle={session.name} logout={logout}/>
      <div style={{flex:1,padding:"16px 16px 80px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          <Stat label="Células" value={supervised.length} color="#7c3aed" icon="grid"/>
          <Stat label="Membros" value={members.filter(m=>supervised.some(c=>c.id===m.cell_id)).length} color="#2563eb" icon="users"/>
        </div>
        <h3 style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:12}}>Células Supervisionadas</h3>
        {supervised.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhuma célula atribuída ainda</p></Card>}
        {supervised.map(cell=>{
          const mc=members.filter(m=>m.cell_id===cell.id)
          const leader=members.find(m=>m.id===cell.leader_id)
          return (
            <Card key={cell.id} style={{marginBottom:10}}>
              <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:4}}>{cell.name}</div>
              <div style={{fontSize:12,color:"#64748b",marginBottom:8}}>{cell.neighborhood} • {cell.day} às {cell.time}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12,color:"#64748b"}}>
                <span>👤 <b style={{color:"#334155"}}>{leader?.name||"—"}</b></span>
                <span>👥 <b style={{color:"#334155"}}>{mc.length} membros</b></span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── MEMBER PORTAL ────────────────────────────────────────────────────────────
function MemberPortal({ session, logout }) {
  const { data:cells } = useTable("cells")
  const { data:members } = useTable("members")
  const { data:attendance } = useTable("attendance")

  const member = members.find(m=>m.id===session.member_id)
  const cell = member ? cells.find(c=>c.id===member.cell_id) : null
  const myAtt = attendance.filter(a=>a.member_id===session.member_id).sort((a,b)=>b.date.localeCompare(a.date))
  const pct = myAtt.length ? Math.round(myAtt.filter(a=>a.status==="Presente").length/myAtt.length*100) : 0

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",padding:"28px 18px 24px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Avatar name={member?.name||session?.name||"?"} size={46} color="#7dd3fc"/>
            <div><div style={{color:"#f0f9ff",fontSize:16,fontWeight:800}}>{member?.name||session?.name}</div>
              <div style={{color:"#7dd3fc",fontSize:12}}>{cell?.name||"Sem célula"}</div>
            </div>
          </div>
          <button onClick={logout} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,padding:8,cursor:"pointer",color:"#93c5fd",display:"flex"}}><Icon name="log-out" size={18}/></button>
        </div>
        {myAtt.length>0&&(
          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:14,padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{color:"#93c5fd",fontSize:12,fontWeight:600}}>Minha Frequência</span>
              <span style={{color:"#f0f9ff",fontSize:14,fontWeight:800}}>{pct}%</span>
            </div>
            <div style={{height:6,background:"rgba(255,255,255,0.1)",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:pct>=75?"#34d399":pct>=50?"#fbbf24":"#f87171",borderRadius:3}}/>
            </div>
            <div style={{fontSize:11,color:"#7dd3fc",marginTop:6}}>{myAtt.filter(a=>a.status==="Presente").length} de {myAtt.length} encontros</div>
          </div>
        )}
      </div>
      <div style={{flex:1,padding:"16px 16px 80px",overflowY:"auto"}}>
        {member&&(
          <Card style={{marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Meus Dados</h3>
            {[["Telefone",member.phone],["E-mail",member.email],["Bairro",member.neighborhood],["Status",member.status],["Batizado",member.baptism_date?`Sim (${fmtDate(member.baptism_date)})`:"Não"],["Célula",cell?.name]].map(([k,v])=>v?(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                <span style={{color:"#94a3b8",fontWeight:600}}>{k}</span>
                <span style={{color:"#334155",fontWeight:700,textAlign:"right",maxWidth:"60%"}}>{v}</span>
              </div>
            ):null)}
          </Card>
        )}
        <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:10}}>Histórico de Presença</h3>
        {myAtt.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0,fontSize:13}}>Nenhum encontro registrado</p></Card>}
        {myAtt.map(a=>{
          const sc=a.status==="Presente"?"#059669":a.status==="Ausente"?"#dc2626":"#d97706"
          const si=a.status==="Presente"?"✓":a.status==="Ausente"?"✗":"?"
          return (
            <div key={a.id} style={{background:"#fff",borderRadius:12,padding:"12px 14px",marginBottom:6,border:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:34,height:34,borderRadius:10,background:sc+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:sc,flexShrink:0}}>{si}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{fmtDate(a.date)}</div>
                {a.theme&&<div style={{fontSize:11,color:"#94a3b8"}}>{a.theme}</div>}
              </div>
              <Badge label={a.status} color={sc}/>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
async function addLog(session, action, detail) {
  await supabase.from("logs").insert({action,detail,user_id:session?.id})
}
