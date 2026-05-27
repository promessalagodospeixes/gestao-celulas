import { useState, useEffect, useCallback } from "react"
import { supabase } from "./supabase.js"

const ROLES = { admin:"Gestor", supervisor:"Supervisor", leader:"Líder", secretary:"Secretário", member:"Membro" }
const ROLE_COLORS = { admin:"#1e40af", supervisor:"#7c3aed", leader:"#059669", secretary:"#d97706", member:"#64748b" }
const DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"]
const STATUS_LIST = ["Visitante","Membro"]
const CELL_FUNCTIONS = ["Líder","Secretário","Líder em Treinamento","Anfitrião"]
const FREQUENCIES = ["Semanal","Quinzenal","Mensal"]
const REACTIONS = ["🙏","❤️","🔥","✝️","😭","🙌"]

function fmtDate(d){if(!d)return"—";try{const[y,m,day]=d.split("-");return`${day}/${m}/${y}`}catch{return d}}
function calcAge(dob){if(!dob)return null;const b=new Date(dob),n=new Date();let a=n.getFullYear()-b.getFullYear();if(n.getMonth()<b.getMonth()||(n.getMonth()===b.getMonth()&&n.getDate()<b.getDate()))a--;return a}
function fmtCPF(v){const d=v.replace(/\D/g,"");if(d.length>9)return d.slice(0,3)+"."+d.slice(3,6)+"."+d.slice(6,9)+"-"+d.slice(9,11);if(d.length>6)return d.slice(0,3)+"."+d.slice(3,6)+"."+d.slice(6);if(d.length>3)return d.slice(0,3)+"."+d.slice(3);return d}
function todayStr(){return new Date().toISOString().split("T")[0]}
function btoa64(s){return btoa(unescape(encodeURIComponent(s)))}
function atob64(s){try{return decodeURIComponent(escape(atob(s)))}catch{return s}}
function getMonthBirthday(dob){if(!dob)return null;return parseInt(dob.split("-")[1])}
function getCurrentMonth(){return new Date().getMonth()+1}
function getNextMeetingDate(day){
  const dayMap={"Segunda":1,"Terça":2,"Quarta":3,"Quinta":4,"Sexta":5,"Sábado":6,"Domingo":0}
  const target=dayMap[day]??3
  const today=new Date()
  const diff=(target-today.getDay()+7)%7
  const next=new Date(today)
  next.setDate(today.getDate()+(diff===0?7:diff))
  return next.toISOString().split("T")[0]
}

const Icon=({name,size=18})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    {name==="church"&&<><path d="M12 2v5M9.5 4.5h5M5 10h14M5 10v10h5v-5h4v5h5V10M12 7v3"/></>}
    {name==="users"&&<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}
    {name==="check-circle"&&<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
    {name==="bar-chart"&&<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>}
    {name==="send"&&<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}
    {name==="log-out"&&<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}
    {name==="x"&&<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
    {name==="plus"&&<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
    {name==="trash"&&<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></>}
    {name==="edit"&&<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}
    {name==="grid"&&<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>}
    {name==="arrow-left"&&<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>}
    {name==="history"&&<><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></>}
    {name==="key"&&<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>}
    {name==="inbox"&&<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>}
    {name==="gauge"&&<><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M12 2a10 10 0 0 1 7.39 16.56M12 2A10 10 0 0 0 4.61 18.56"/><line x1="12" y1="12" x2="16" y2="8"/></>}
    {name==="calendar"&&<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
    {name==="check"&&<polyline points="20 6 9 17 4 12"/>}
    {name==="eye"&&<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
    {name==="eye-off"&&<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}
    {name==="search"&&<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}
    {name==="shield"&&<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>}
    {name==="cake"&&<><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20M7 8v2M12 8v2M17 8v2"/></>}
    {name==="target"&&<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>}
    {name==="message"&&<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}
    {name==="event"&&<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
    {name==="id-card"&&<><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 9h4M14 12h4M14 15h2"/></>}
    {name==="pause"&&<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>}
    {name==="play"&&<><polygon points="5 3 19 12 5 21 5 3"/></>}
    {name==="link"&&<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>}
    {name==="comment"&&<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}
    {name==="repeat"&&<><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>}
    {name==="edit2"&&<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>}
  </svg>
)

const Avatar=({name,photo,size=36,color="#1e40af"})=>{
  if(photo)return<img src={photo} alt={name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`2px solid ${color}30`}}/>
  const initials=name?name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase():"?"
  return<div style={{width:size,height:size,borderRadius:"50%",background:color+"20",border:`2px solid ${color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:800,color,flexShrink:0}}>{initials}</div>
}
const Badge=({label,color="#1e40af"})=>(<span style={{background:color+"18",color,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{label}</span>)
const Btn=({children,onClick,variant="primary",size="md",full=false,disabled=false,icon=null,style:extra={}})=>{
  const variants={primary:{background:"#1e40af",color:"#fff",border:"none"},secondary:{background:"#f1f5f9",color:"#334155",border:"none"},danger:{background:"#fee2e2",color:"#991b1b",border:"none"},success:{background:"#dcfce7",color:"#166534",border:"none"},ghost:{background:"transparent",color:"#64748b",border:"1.5px solid #e2e8f0"},warning:{background:"#fef3c7",color:"#92400e",border:"none"}}
  return<button disabled={disabled} onClick={onClick} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,borderRadius:12,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",transition:"all 0.15s",opacity:disabled?0.5:1,width:full?"100%":"auto",fontSize:size==="sm"?13:15,padding:size==="sm"?"8px 14px":"12px 20px",...variants[variant],...extra}}>{icon&&<Icon name={icon} size={size==="sm"?14:16}/>}{children}</button>
}
const Inp=({label,value,onChange,type="text",placeholder="",required=false,readOnly=false})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}{required&&<span style={{color:"#ef4444",marginLeft:3}}>*</span>}</label>}
    <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} readOnly={readOnly} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"'Outfit',sans-serif",background:readOnly?"#f8fafc":"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"}}/>
  </div>
)
const Sel=({label,value,onChange,options,required=false})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}{required&&<span style={{color:"#ef4444",marginLeft:3}}>*</span>}</label>}
    <select value={value||""} onChange={e=>onChange(e.target.value)} required={required} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"'Outfit',sans-serif",background:"#fff",color:"#1e293b",outline:"none"}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
  </div>
)
const Textarea=({label,value,onChange,placeholder="",rows=3})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</label>}
    <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"'Outfit',sans-serif",background:"#fff",color:"#1e293b",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
  </div>
)
const Card=({children,style:extra={}})=>(<div style={{background:"#fff",borderRadius:16,border:"1.5px solid #f1f5f9",padding:"16px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)",...extra}}>{children}</div>)
const Modal=({open,onClose,title,children})=>{
  if(!open)return null
  return(
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
const Toast=({msg,type="success"})=>{
  if(!msg)return null
  const colors={success:["#dcfce7","#166534"],error:["#fee2e2","#991b1b"],info:["#dbeafe","#1e40af"]}
  const[bg,color]=colors[type]||colors.info
  return<div style={{position:"fixed",bottom:24,left:16,right:16,background:bg,color,borderRadius:12,padding:"12px 16px",fontWeight:700,fontSize:14,zIndex:9999,textAlign:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}>{msg}</div>
}
const Stat=({label,value,color="#1e40af",icon})=>(
  <div style={{background:"#fff",borderRadius:14,border:"1.5px solid #f1f5f9",padding:"14px",textAlign:"center",flex:1}}>
    {icon&&<div style={{background:color+"15",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",color}}><Icon name={icon} size={18}/></div>}
    <div style={{fontSize:26,fontWeight:900,color,lineHeight:1}}>{value}</div>
    <div style={{fontSize:11,color:"#94a3b8",marginTop:4,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>{label}</div>
  </div>
)
const Loader=()=>(<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 0",flexDirection:"column",gap:12}}><div style={{width:32,height:32,border:"3px solid #e2e8f0",borderTopColor:"#1e40af",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><span style={{color:"#94a3b8",fontSize:13,fontWeight:600}}>Carregando...</span></div>)
const ProgressBar=({value,max,color="#1e40af"})=>{
  const pct=max>0?Math.min(Math.round(value/max*100),100):0
  return(<div><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:"#64748b",fontWeight:600}}>{value} de {max}</span><span style={{fontSize:12,fontWeight:800,color}}>{pct}%</span></div><div style={{height:8,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4,transition:"width 0.5s"}}/></div></div>)
}

function LGPDModal({onAccept}){
  const[c1,setC1]=useState(false)
  const[c2,setC2]=useState(false)
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:460,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{background:"#1e40af",padding:"20px 20px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{background:"rgba(255,255,255,0.2)",borderRadius:10,padding:8,display:"flex",color:"#fff"}}><Icon name="shield" size={20}/></div>
            <h2 style={{color:"#fff",fontSize:18,fontWeight:900,margin:0}}>Termos e Privacidade</h2>
          </div>
          <p style={{color:"#bfdbfe",fontSize:13,margin:0}}>Leia e aceite para continuar</p>
        </div>
        <div style={{overflowY:"auto",padding:"20px",flex:1}}>
          <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16,border:"1.5px solid #e2e8f0"}}>
            <p style={{fontSize:13,fontWeight:800,color:"#0f172a",marginBottom:8}}>📋 Política de Dados — LGPD</p>
            <p style={{fontSize:13,color:"#475569",lineHeight:1.6,margin:0}}>Coletamos seus dados pessoais (nome, CPF, telefone, e-mail, endereço e informações familiares) para organizar e gerenciar as células da nossa igreja. Seus dados são usados exclusivamente para fins administrativos internos. Apenas gestores, líderes, secretários e supervisores autorizados têm acesso. Você pode solicitar a correção ou exclusão dos seus dados a qualquer momento falando com o líder da sua célula.</p>
          </div>
          <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:20,border:"1.5px solid #e2e8f0"}}>
            <p style={{fontSize:13,fontWeight:800,color:"#0f172a",marginBottom:8}}>📸 Uso de Imagem e Vídeo</p>
            <p style={{fontSize:13,color:"#475569",lineHeight:1.6,margin:0}}>Durante os encontros e eventos da célula, podemos registrar fotos e vídeos. Essas imagens podem ser usadas para comunicação interna entre os membros e também nas redes sociais oficiais da igreja. Caso não queira que sua imagem seja divulgada, informe ao líder da sua célula.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[[c1,setC1,"Li e concordo com a Política de Dados (LGPD) e autorizo o armazenamento dos meus dados pessoais."],[c2,setC2,"Autorizo o uso da minha imagem em fotos e vídeos dos encontros para uso interno e nas redes sociais da igreja."]].map(([checked,setChecked,text],i)=>(
              <label key={i} style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",background:checked?"#eff6ff":"#f8fafc",border:`1.5px solid ${checked?"#2563eb":"#e2e8f0"}`,borderRadius:12,padding:14}}>
                <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} style={{marginTop:2,width:16,height:16,flexShrink:0}}/>
                <span style={{fontSize:13,color:"#334155",fontWeight:600,lineHeight:1.5}}>{text}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{padding:"16px 20px",borderTop:"1.5px solid #f1f5f9"}}>
          <Btn full disabled={!c1||!c2} onClick={onAccept}>{c1&&c2?"✓ Concordo e quero continuar":"Marque as opções acima para continuar"}</Btn>
        </div>
      </div>
    </div>
  )
}

export default function App(){
  const[session,setSession]=useState(null)
  const[page,setPage]=useState("login")
  const[toast,setToast]=useState({msg:"",type:"success"})
  const[showLGPD,setShowLGPD]=useState(false)
  const[pendingSession,setPendingSession]=useState(null)
  const showToast=useCallback((msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast({msg:"",type:"success"}),3500)},[])
  function doLogout(){setSession(null);setPage("login")}
  async function doLogin(user){
    if(user.active===false)return
    if(!user.lgpd_accepted){setPendingSession(user);setShowLGPD(true);return}
    startSession(user)
  }
  async function handleLGPDAccept(){
    if(!pendingSession)return
    await supabase.from("users").update({lgpd_accepted:true,lgpd_accepted_at:new Date().toISOString()}).eq("id",pendingSession.id)
    setShowLGPD(false);startSession({...pendingSession,lgpd_accepted:true});setPendingSession(null)
  }
  function startSession(user){
    setSession(user)
    const map={admin:"admin",supervisor:"supervisor",leader:"leader",secretary:"secretary",member:"member"}
    setPage(map[user.role]||"member")
  }
  return(
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"'Outfit',sans-serif",maxWidth:480,margin:"0 auto",position:"relative"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}input,select,textarea{font-family:'Outfit',sans-serif}`}</style>
      <Toast msg={toast.msg} type={toast.type}/>
      {showLGPD&&<LGPDModal onAccept={handleLGPDAccept}/>}
      {page==="login"&&<LoginPage onLogin={doLogin} showToast={showToast}/>}
      {page==="admin"&&<AdminDashboard session={session} logout={doLogout} showToast={showToast}/>}
      {page==="secretary"&&<LeaderSecretaryDashboard session={session} logout={doLogout} showToast={showToast}/>}
      {page==="leader"&&<LeaderSecretaryDashboard session={session} logout={doLogout} showToast={showToast}/>}
      {page==="supervisor"&&<SupervisorDashboard session={session} logout={doLogout} showToast={showToast}/>}
      {page==="member"&&<MemberPortal session={session} logout={doLogout} showToast={showToast}/>}
    </div>
  )
}

function LoginPage({onLogin,showToast}){
  const[cpf,setCpf]=useState("")
  const[pw,setPw]=useState("")
  const[showPw,setShowPw]=useState(false)
  const[err,setErr]=useState("")
  const[loading,setLoading]=useState(false)
  async function handleLogin(e){
    e.preventDefault();setErr("");setLoading(true)
    const cf=fmtCPF(cpf.replace(/\D/g,""))
    const cn=cpf.replace(/\D/g,"")
    let{data}=await supabase.from("users").select("*").eq("cpf",cf).single()
    if(!data){const r2=await supabase.from("users").select("*").eq("cpf",cn).single();data=r2.data}
    if(!data){setErr("CPF não encontrado");setLoading(false);return}
    if(data.active===false){setErr("Entre em contato com o líder da sua célula.");setLoading(false);return}
    if(atob64(data.password_hash)!==pw){setErr("Senha incorreta");setLoading(false);return}
    setLoading(false);onLogin(data)
  }
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",background:"linear-gradient(145deg,#0f172a 0%,#1e3a5f 100%)"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:72,height:72,borderRadius:20,background:"rgba(255,255,255,0.1)",border:"1.5px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",color:"#93c5fd"}}><Icon name="church" size={34}/></div>
        <h1 style={{color:"#f0f9ff",fontSize:22,fontWeight:900,margin:"0 0 4px"}}>Gestão de Células</h1>
        <p style={{color:"#7dd3fc",fontSize:13,margin:0,fontWeight:500}}>Promessa Lago dos Peixes</p>
      </div>
      <div style={{background:"rgba(255,255,255,0.07)",backdropFilter:"blur(20px)",borderRadius:20,border:"1.5px solid rgba(255,255,255,0.1)",padding:"28px 24px",width:"100%",maxWidth:380}}>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#7dd3fc",marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>CPF</label>
            <input value={cpf} onChange={e=>setCpf(e.target.value)} placeholder="000.000.000-00" maxLength={14} required style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 16px",fontSize:15,color:"#f0f9ff",outline:"none",fontFamily:"'Outfit',sans-serif"}}/>
          </div>
          <div style={{marginBottom:8,position:"relative"}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#7dd3fc",marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>Senha</label>
            <input value={pw} onChange={e=>setPw(e.target.value)} type={showPw?"text":"password"} placeholder="Digite sua senha" required style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 44px 12px 16px",fontSize:15,color:"#f0f9ff",outline:"none",fontFamily:"'Outfit',sans-serif"}}/>
            <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:"absolute",right:12,bottom:10,background:"none",border:"none",cursor:"pointer",color:"#7dd3fc",display:"flex"}}><Icon name={showPw?"eye-off":"eye"} size={18}/></button>
          </div>
          {err&&<p style={{color:"#fca5a5",fontSize:13,margin:"8px 0",fontWeight:600}}>{err}</p>}
          <button type="submit" disabled={loading} style={{width:"100%",background:"#2563eb",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:800,padding:"13px 0",cursor:loading?"wait":"pointer",marginTop:16,fontFamily:"'Outfit',sans-serif",opacity:loading?0.7:1}}>{loading?"Entrando...":"Entrar"}</button>
        </form>
        <p style={{color:"#93c5fd",fontSize:12,textAlign:"center",marginTop:16,opacity:0.7}}>Digite seu CPF e senha para entrar</p>
      </div>
    </div>
  )
}

function useTable(table,filter=null){
  const[data,setData]=useState([])
  const[loading,setLoading]=useState(true)
  async function load(){
    setLoading(true)
    let q=supabase.from(table).select("*").order("created_at",{ascending:false})
    if(filter)q=q.eq(filter.col,filter.val)
    const{data:rows}=await q
    setData(rows||[]);setLoading(false)
  }
  useEffect(()=>{
    load()
    const ch=supabase.channel(`rt_${table}_${filter?.val||"all"}_${Date.now()}`).on("postgres_changes",{event:"*",schema:"public",table},()=>load()).subscribe()
    return()=>supabase.removeChannel(ch)
  },[table,filter?.val])
  return{data,loading,reload:load}
}
async function addLog(session,action,detail){await supabase.from("logs").insert({action,detail,user_id:session?.id})}

function ChangePasswordModal({open,onClose,session,showToast}){
  const[oldPw,setOldPw]=useState("")
  const[newPw,setNewPw]=useState("")
  const[confirmPw,setConfirmPw]=useState("")
  async function save(){
    if(newPw.length<6){showToast("Mínimo 6 caracteres","error");return}
    if(newPw!==confirmPw){showToast("Senhas não conferem","error");return}
    const{data}=await supabase.from("users").select("password_hash").eq("id",session.id).single()
    if(!data||atob64(data.password_hash)!==oldPw){showToast("Senha atual incorreta","error");return}
    await supabase.from("users").update({password_hash:btoa64(newPw)}).eq("id",session.id)
    showToast("Senha alterada!");setOldPw("");setNewPw("");setConfirmPw("");onClose()
  }
  return(
    <Modal open={open} onClose={onClose} title="Alterar Senha">
      <Inp label="Senha Atual" type="password" value={oldPw} onChange={setOldPw} placeholder="Senha atual"/>
      <Inp label="Nova Senha" type="password" value={newPw} onChange={setNewPw} placeholder="Mínimo 6 caracteres"/>
      <Inp label="Confirmar Nova Senha" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="Repita a nova senha"/>
      <Btn full onClick={save} icon="key">Alterar Senha</Btn>
    </Modal>
  )
}

function MemberSearchModal({open,onClose,members,onSelect,title="Buscar Membro"}){
  const[search,setSearch]=useState("")
  const filtered=members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||(m.phone||"").includes(search))
  return(
    <Modal open={open} onClose={onClose} title={title}>
      <div style={{position:"relative",marginBottom:12}}>
        <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",pointerEvents:"none"}}><Icon name="search" size={15}/></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar pelo nome..." autoFocus style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px 10px 36px",fontSize:14,outline:"none"}}/>
      </div>
      {filtered.slice(0,10).map(m=>(
        <button key={m.id} onClick={()=>{onSelect(m);onClose()}} style={{width:"100%",textAlign:"left",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",cursor:"pointer",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
          <Avatar name={m.name} photo={m.photo_url} size={32} color="#2563eb"/>
          <div><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{m.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>{m.phone||"—"}</div></div>
        </button>
      ))}
      {filtered.length===0&&<p style={{color:"#94a3b8",textAlign:"center",fontSize:13}}>Nenhum membro encontrado</p>}
    </Modal>
  )
}

function AdminDashboard({session,logout,showToast}){
  const[tab,setTab]=useState("dashboard")
  const[showChangePw,setShowChangePw]=useState(false)
  const tabs=[
    {id:"dashboard",label:"Painel",icon:"gauge"},{id:"cells",label:"Células",icon:"grid"},
    {id:"members",label:"Membros",icon:"users"},{id:"attendance",label:"Presença",icon:"check-circle"},
    {id:"events",label:"Eventos",icon:"event"},{id:"reports",label:"Relatórios",icon:"bar-chart"},
    {id:"messages",label:"Mensagens",icon:"message"},{id:"requests",label:"Solicits.",icon:"inbox"},
    {id:"logs",label:"Auditoria",icon:"history"},
  ]
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <header style={{background:"#0f172a",padding:"14px 18px 0",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div><div style={{color:"#f0f9ff",fontSize:16,fontWeight:800}}>Painel do Gestor</div><div style={{color:"#7dd3fc",fontSize:12}}>{session?.name}</div></div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowChangePw(true)} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"7px 10px",cursor:"pointer",color:"#cbd5e1",display:"flex"}}><Icon name="key" size={15}/></button>
            <button onClick={logout} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"7px 12px",cursor:"pointer",color:"#cbd5e1",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600}}><Icon name="log-out" size={15}/>Sair</button>
          </div>
        </div>
        <div style={{display:"flex",gap:1,overflowX:"auto",paddingBottom:2}}>
          {tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?"rgba(37,99,235,0.85)":"transparent",border:"none",borderRadius:"8px 8px 0 0",padding:"7px 10px 10px",cursor:"pointer",color:tab===t.id?"#fff":"#94a3b8",fontSize:10,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:50,flexShrink:0}}><Icon name={t.icon} size={15}/><span>{t.label}</span></button>))}
        </div>
      </header>
      <div style={{flex:1,padding:"16px 16px 80px",overflowY:"auto"}}>
        {tab==="dashboard"&&<AdminOverview session={session} showToast={showToast} setTab={setTab}/>}
        {tab==="cells"&&<CellsPanel session={session} showToast={showToast}/>}
        {tab==="members"&&<MembersPanel session={session} showToast={showToast}/>}
        {tab==="attendance"&&<AttendancePanel session={session} showToast={showToast}/>}
        {tab==="events"&&<EventsPanel session={session} showToast={showToast}/>}
        {tab==="reports"&&<ReportsPanel/>}
        {tab==="messages"&&<MessagesPanel session={session} showToast={showToast}/>}
        {tab==="requests"&&<AllRequestsPanel session={session} showToast={showToast}/>}
        {tab==="logs"&&<LogsPanel/>}
      </div>
      <ChangePasswordModal open={showChangePw} onClose={()=>setShowChangePw(false)} session={session} showToast={showToast}/>
    </div>
  )
}

function AdminOverview({session,showToast,setTab}){
  const{data:cells}=useTable("cells")
  const{data:members}=useTable("members")
  const{data:requests}=useTable("inactivation_requests")
  const{data:cellReqs}=useTable("cell_change_requests")
  const activeCells=cells.filter(c=>c.active!==false)
  const activeMembers=members.filter(m=>m.status==="Membro")
  const baptized=members.filter(m=>m.baptized).length
  const pending=requests.filter(r=>r.status==="pending").length+cellReqs.filter(r=>r.status==="pending").length
  const currentMonth=getCurrentMonth()
  const birthdays=members.filter(m=>m.birth_date&&getMonthBirthday(m.birth_date)===currentMonth)
  const nextMeetings=cells.filter(c=>c.active!==false&&c.next_meeting_date).sort((a,b)=>a.next_meeting_date.localeCompare(b.next_meeting_date)).slice(0,3)
  return(
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Visão Geral</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <Stat label="Células" value={activeCells.length} color="#2563eb" icon="grid"/>
        <Stat label="Membros" value={activeMembers.length} color="#059669" icon="users"/>
        <Stat label="Batizados" value={baptized} color="#d97706" icon="check-circle"/>
        <Stat label="Pendências" value={pending} color="#dc2626" icon="inbox"/>
      </div>
      {nextMeetings.length>0&&(
        <Card style={{marginBottom:14,border:"1.5px solid #bfdbfe",background:"#eff6ff"}}>
          <div style={{fontSize:14,fontWeight:800,color:"#1e40af",marginBottom:10}}>📅 Próximos Encontros</div>
          {nextMeetings.map(c=>(<div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderTop:"1px solid #bfdbfe"}}><span style={{fontSize:13,fontWeight:700,color:"#1e40af"}}>{c.name}</span><div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:"#1e40af"}}>{fmtDate(c.next_meeting_date)}</div><div style={{fontSize:11,color:"#3b82f6"}}>{c.time||""} • {c.frequency||"Semanal"}</div></div></div>))}
        </Card>
      )}
      {birthdays.length>0&&(
        <Card style={{marginBottom:14,border:"1.5px solid #fde68a",background:"#fffbeb"}}>
          <div style={{fontSize:14,fontWeight:800,color:"#92400e",marginBottom:10}}>🎂 Aniversariantes do Mês</div>
          {birthdays.map(m=>(<div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderTop:"1px solid #fde68a"}}><Avatar name={m.name} photo={m.photo_url} size={28} color="#d97706"/><div><div style={{fontSize:13,fontWeight:700,color:"#92400e"}}>{m.name}</div><div style={{fontSize:11,color:"#b45309"}}>{fmtDate(m.birth_date)}{m.age?` • ${m.age} anos`:""}</div></div></div>))}
        </Card>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Btn full icon="grid" onClick={()=>setTab("cells")}>Gerenciar Células</Btn>
        <Btn full variant="secondary" icon="users" onClick={()=>setTab("members")}>Gerenciar Membros</Btn>
        <Btn full variant="secondary" icon="check-circle" onClick={()=>setTab("attendance")}>Registrar Presença</Btn>
        <Btn full variant="secondary" icon="event" onClick={()=>setTab("events")}>Gerenciar Eventos</Btn>
      </div>
    </div>
  )
}

function CellsPanel({session,showToast}){
  const{data:cells,loading}=useTable("cells")
  const{data:members}=useTable("members")
  const[modal,setModal]=useState(false)
  const[editing,setEditing]=useState(null)
  const[deleteId,setDeleteId]=useState(null)
  const[memberSearch,setMemberSearch]=useState(null)
  const emptyForm={name:"",day:"Quarta",time:"19:30",neighborhood:"",street:"",number:"",cep:"",started_at:"",growth_goal:"",active:true,frequency:"Semanal",reminder_hours:24,reminder_channels:[],auto_create_meetings:true,leaders_ids:[],secretaries_ids:[],trainees_ids:[],hosts_ids:[],supervisor_id:""}
  const[form,setForm]=useState(emptyForm)
  const f=k=>v=>setForm(p=>({...p,[k]:v}))

  function openEdit(c){
    setForm({name:c.name,day:c.day||"Quarta",time:c.time||"",neighborhood:c.neighborhood||"",street:c.street||"",number:c.number||"",cep:c.cep||"",started_at:c.started_at||"",growth_goal:c.growth_goal||"",active:c.active!==false,frequency:c.frequency||"Semanal",reminder_hours:c.reminder_hours||24,reminder_channels:c.reminder_channels||[],auto_create_meetings:c.auto_create_meetings!==false,leaders_ids:c.leaders_ids||[],secretaries_ids:c.secretaries_ids||[],trainees_ids:c.trainees_ids||[],hosts_ids:c.hosts_ids||[],supervisor_id:c.supervisor_id||""})
    setEditing(c.id);setModal(true)
  }

  function toggleChannel(ch){setForm(p=>({...p,reminder_channels:p.reminder_channels.includes(ch)?p.reminder_channels.filter(c=>c!==ch):[...p.reminder_channels,ch]}))}
  function toggleFuncMember(field,id){setForm(p=>({...p,[field]:p[field].includes(id)?p[field].filter(i=>i!==id):[...p[field],id]}))}

  async function searchCep(cep){
    const c=cep.replace(/\D/g,"");if(c.length!==8)return
    try{const r=await fetch(`https://viacep.com.br/ws/${c}/json/`);const d=await r.json();if(!d.erro){setForm(p=>({...p,street:d.logradouro||"",neighborhood:d.bairro||""}))}}catch{}
  }

  async function save(){
    if(!form.name.trim()){showToast("Nome é obrigatório","error");return}
    const nextDate=form.auto_create_meetings?getNextMeetingDate(form.day):null
    const payload={name:form.name.trim().toUpperCase(),day:form.day,time:form.time,neighborhood:form.neighborhood,street:form.street,number:form.number,cep:form.cep,supervisor_id:form.supervisor_id||null,started_at:form.started_at||null,growth_goal:parseInt(form.growth_goal)||0,active:form.active,frequency:form.frequency,reminder_hours:parseInt(form.reminder_hours)||24,reminder_channels:form.reminder_channels,auto_create_meetings:form.auto_create_meetings,next_meeting_date:nextDate,leaders_ids:form.leaders_ids,secretaries_ids:form.secretaries_ids,trainees_ids:form.trainees_ids,hosts_ids:form.hosts_ids}
    // Update user roles based on cell functions
    if(editing){
      const{error}=await supabase.from("cells").update(payload).eq("id",editing)
      if(error){showToast("Erro: "+error.message,"error");return}
      await addLog(session,"update",`Célula atualizada: ${form.name}`)
      showToast("Célula atualizada!")
    }else{
      const{error}=await supabase.from("cells").insert(payload)
      if(error){showToast("Erro: "+error.message,"error");return}
      await addLog(session,"create",`Célula criada: ${form.name}`)
      showToast("Célula criada!")
    }
    // Sync user roles
    for(const id of form.leaders_ids) await supabase.from("users").update({role:"leader",cell_id:editing}).eq("member_id",id)
    for(const id of form.secretaries_ids) await supabase.from("users").update({role:"secretary",cell_id:editing}).eq("member_id",id)
    setModal(false);setEditing(null);setForm(emptyForm)
  }

  async function toggleActive(cell){await supabase.from("cells").update({active:!cell.active}).eq("id",cell.id);showToast(cell.active?"Célula inativada":"Célula reativada!")}
  async function del(){await supabase.from("cells").delete().eq("id",deleteId);showToast("Célula removida");setDeleteId(null)}

  const mOpts=[{value:"",label:"— Nenhum —"},...members.filter(m=>m.status==="Membro").map(m=>({value:m.id,label:m.name}))]

  function FuncSection({field,label,color}){
    const ids=form[field]||[]
    const mems=members.filter(m=>ids.includes(m.id))
    return(
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <label style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</label>
          <button type="button" onClick={()=>setMemberSearch({field,label})} style={{background:color+"15",border:"none",borderRadius:8,padding:"4px 10px",cursor:"pointer",color,fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:4}}><Icon name="plus" size={12}/>Adicionar</button>
        </div>
        {mems.length===0&&<p style={{fontSize:12,color:"#94a3b8",margin:0}}>Nenhum {label.toLowerCase()} definido</p>}
        {mems.map(m=>(
          <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:color+"10",borderRadius:8,marginBottom:4}}>
            <Avatar name={m.name} size={24} color={color}/>
            <span style={{fontSize:13,fontWeight:600,color:"#334155",flex:1}}>{m.name}</span>
            <button type="button" onClick={()=>toggleFuncMember(field,m.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",display:"flex"}}><Icon name="x" size={14}/></button>
          </div>
        ))}
      </div>
    )
  }

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Células</h2>
        <Btn icon="plus" size="sm" onClick={()=>{setForm(emptyForm);setEditing(null);setModal(true)}}>Nova</Btn>
      </div>
      {loading&&<Loader/>}
      {!loading&&cells.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhuma célula cadastrada</p></Card>}
      {cells.map(cell=>{
        const mc=members.filter(m=>m.cell_id===cell.id&&m.status==="Membro").length
        const visitors=members.filter(m=>m.cell_id===cell.id&&m.status==="Visitante").length
        const leaders=members.filter(m=>cell.leaders_ids?.includes(m.id))
        const isActive=cell.active!==false
        return(
          <Card key={cell.id} style={{marginBottom:10,opacity:isActive?1:0.6,border:isActive?"1.5px solid #f1f5f9":"1.5px solid #fecaca"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{cell.name}</div>
                  {!isActive&&<Badge label="Inativa" color="#dc2626"/>}
                </div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{cell.neighborhood||"—"} • {cell.day} às {cell.time||"—"}</div>
                {cell.frequency&&<div style={{fontSize:11,color:"#7c3aed",marginTop:2}}>🔄 {cell.frequency}{cell.next_meeting_date?` • Próximo: ${fmtDate(cell.next_meeting_date)}`:""}</div>}
              </div>
              <div style={{display:"flex",gap:5}}>
                <button onClick={()=>openEdit(cell)} style={{background:"#eff6ff",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#2563eb"}}><Icon name="edit" size={14}/></button>
                <button onClick={()=>toggleActive(cell)} style={{background:isActive?"#fef3c7":"#dcfce7",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:isActive?"#d97706":"#059669"}}><Icon name={isActive?"pause":"play"} size={14}/></button>
                {session?.role==="admin"&&<button onClick={()=>setDeleteId(cell.id)} style={{background:"#fef2f2",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#dc2626"}}><Icon name="trash" size={14}/></button>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12,color:"#64748b",marginBottom:8}}>
              <span>👤 Líderes: <b style={{color:"#334155"}}>{leaders.length>0?leaders.map(l=>l.name.split(" ")[0]).join(", "):"—"}</b></span>
              <span>👥 Membros: <b style={{color:"#334155"}}>{mc}</b></span>
              <span>👋 Visitantes: <b style={{color:"#334155"}}>{visitors}</b></span>
              {cell.growth_goal>0&&<span>🎯 Meta: <b style={{color:"#334155"}}>{cell.growth_goal}</b></span>}
            </div>
            {cell.growth_goal>0&&<ProgressBar value={mc} max={cell.growth_goal} color="#2563eb"/>}
            {cell.started_at&&<div style={{fontSize:11,color:"#94a3b8",marginTop:8}}>📅 Iniciada em: {fmtDate(cell.started_at)}</div>}
          </Card>
        )
      })}

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Editar Célula":"Nova Célula"}>
        <Inp label="Nome" value={form.name} onChange={v=>f("name")(v.toUpperCase())} required/>
        <Sel label="Dia da Semana" value={form.day} onChange={f("day")} options={DAYS.map(d=>({value:d,label:d}))}/>
        <Inp label="Horário" type="time" value={form.time} onChange={f("time")}/>
        <Sel label="Periodicidade" value={form.frequency} onChange={f("frequency")} options={FREQUENCIES.map(fr=>({value:fr,label:fr}))}/>
        <div style={{marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}><input type="checkbox" checked={form.auto_create_meetings} onChange={e=>f("auto_create_meetings")(e.target.checked)} style={{width:16,height:16}}/><span style={{fontSize:13,fontWeight:600,color:"#334155"}}>Criar encontros automaticamente</span></label></div>
        <Inp label="Data de Início" type="date" value={form.started_at} onChange={f("started_at")}/>
        <Inp label="Meta de Membros" type="number" value={form.growth_goal} onChange={f("growth_goal")} placeholder="Ex: 20"/>
        <div style={{marginBottom:14,background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:12,padding:14}}>
          <p style={{fontSize:12,fontWeight:700,color:"#166534",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>🔔 Lembrete Automático</p>
          <Inp label="Enviar X horas antes" type="number" value={form.reminder_hours} onChange={f("reminder_hours")} placeholder="Ex: 24"/>
          <div style={{display:"flex",gap:8}}>
            {["SMS","WhatsApp","Email"].map(ch=>(<button key={ch} type="button" onClick={()=>toggleChannel(ch)} style={{flex:1,padding:"8px 4px",borderRadius:10,fontSize:12,fontWeight:700,border:`1.5px solid ${form.reminder_channels.includes(ch)?"#059669":"#e2e8f0"}`,background:form.reminder_channels.includes(ch)?"#dcfce7":"#f8fafc",color:form.reminder_channels.includes(ch)?"#166534":"#64748b",cursor:"pointer"}}>{ch==="SMS"?"📱":ch==="WhatsApp"?"💬":"📧"} {ch}</button>))}
          </div>
        </div>
        <Inp label="CEP" value={form.cep} onChange={v=>{f("cep")(v);searchCep(v)}} placeholder="00000-000"/>
        <Inp label="Rua/Avenida" value={form.street} onChange={f("street")}/>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
          <Inp label="Bairro" value={form.neighborhood} onChange={f("neighborhood")}/>
          <Inp label="Número" value={form.number} onChange={f("number")}/>
        </div>
        <Sel label="Supervisor" value={form.supervisor_id} onChange={f("supervisor_id")} options={mOpts}/>
        <div style={{borderTop:"1.5px solid #f1f5f9",margin:"12px 0",paddingTop:12}}>
          <p style={{fontSize:12,fontWeight:800,color:"#0f172a",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>Funções na Célula</p>
          <FuncSection field="leaders_ids" label="Líderes" color="#059669"/>
          <FuncSection field="secretaries_ids" label="Secretários" color="#d97706"/>
          <FuncSection field="trainees_ids" label="Líderes em Treinamento" color="#7c3aed"/>
          <FuncSection field="hosts_ids" label="Anfitriões" color="#0891b2"/>
        </div>
        <div style={{marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}><input type="checkbox" checked={form.active} onChange={e=>f("active")(e.target.checked)} style={{width:16,height:16}}/><span style={{fontSize:13,fontWeight:600,color:"#334155"}}>Célula ativa</span></label></div>
        <Btn full onClick={save} style={{marginTop:8}}>{editing?"Salvar Alterações":"Criar Célula"}</Btn>
      </Modal>

      {memberSearch&&(
        <MemberSearchModal open title={`Adicionar ${memberSearch.label}`} members={members.filter(m=>m.status==="Membro"&&!form[memberSearch.field].includes(m.id))} onSelect={m=>toggleFuncMember(memberSearch.field,m.id)} onClose={()=>setMemberSearch(null)}/>
      )}

      {deleteId&&<Modal open title="Confirmar Exclusão" onClose={()=>setDeleteId(null)}>
        <p style={{color:"#64748b",marginBottom:16}}>Tem certeza? Esta ação não pode ser desfeita.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Btn variant="ghost" onClick={()=>setDeleteId(null)}>Cancelar</Btn><Btn variant="danger" onClick={del}>Excluir</Btn></div>
      </Modal>}
    </div>
  )
}

function MembersPanel({session,showToast}){
  const{data:members,loading}=useTable("members")
  const{data:cells}=useTable("cells")
  const[modal,setModal]=useState(false)
  const[editing,setEditing]=useState(null)
  const[deleteId,setDeleteId]=useState(null)
  const[pwModal,setPwModal]=useState(null)
  const[newPw,setNewPw]=useState("")
  const[search,setSearch]=useState("")
  const[cardModal,setCardModal]=useState(null)
  const[showFamilySearch,setShowFamilySearch]=useState(false)
  const[familyField,setFamilyField]=useState(null)

  const emptyForm={name:"",cpf:"",birth_date:"",age:"",gender:"Masculino",phone:"",email:"",neighborhood:"",cell_id:"",status:"Visitante",baptized:false,baptism_date:"",invited_by:"",father_name:"",mother_name:"",spouse_name:"",photo_url:""}
  const[form,setForm]=useState(emptyForm)
  const f=k=>v=>setForm(p=>({...p,[k]:v}))

  function openEdit(m){
    setForm({name:m.name,cpf:m.cpf||"",birth_date:m.birth_date||"",age:m.age||"",gender:m.gender||"Masculino",phone:m.phone||"",email:m.email||"",neighborhood:m.neighborhood||"",cell_id:m.cell_id||"",status:m.status||"Visitante",baptized:m.baptized||false,baptism_date:m.baptism_date||"",invited_by:m.invited_by||"",father_name:m.father_name||"",mother_name:m.mother_name||"",spouse_name:m.spouse_name||"",photo_url:m.photo_url||""})
    setEditing(m.id);setModal(true)
  }

  async function save(){
    if(!form.name.trim()){showToast("Nome é obrigatório","error");return}
    if(form.status==="Membro"&&!form.cpf.replace(/\D/g,"")){showToast("CPF obrigatório para Membros","error");return}
    const cpfNorm=form.cpf.replace(/\D/g,"")
    const payload={name:form.name.trim().toUpperCase(),cpf:cpfNorm||null,age:form.birth_date?calcAge(form.birth_date):(parseInt(form.age)||0),birth_date:form.birth_date||null,gender:form.gender,phone:form.phone,email:form.email,neighborhood:form.neighborhood,cell_id:form.cell_id||null,status:form.status,role:"member",baptized:form.baptized,baptism_date:form.baptized&&form.baptism_date?form.baptism_date:null,invited_by:form.invited_by,father_name:form.father_name,mother_name:form.mother_name,spouse_name:form.spouse_name,photo_url:form.photo_url}
    if(editing){
      const{error}=await supabase.from("members").update(payload).eq("id",editing)
      if(error){showToast("Erro: "+error.message,"error");return}
      if(form.spouse_name){const spouse=members.find(m=>m.name===form.spouse_name);if(spouse&&spouse.spouse_name!==form.name)await supabase.from("members").update({spouse_name:form.name}).eq("id",spouse.id)}
      await addLog(session,"update",`Membro atualizado: ${form.name}`)
      showToast("Membro atualizado!")
    }else{
      const{data:newM,error}=await supabase.from("members").insert(payload).select().single()
      if(error){showToast("Erro: "+error.message,"error");return}
      if(newM&&cpfNorm){
        await supabase.from("users").insert({member_id:newM.id,cpf:cpfNorm,password_hash:btoa64("123456"),name:form.name.trim().toUpperCase(),role:"member",cell_id:form.cell_id||null,active:true})
        if(form.spouse_name){const spouse=members.find(m=>m.name===form.spouse_name);if(spouse)await supabase.from("members").update({spouse_name:form.name}).eq("id",spouse.id)}
        showToast("Membro criado! Senha padrão: 123456")
      }else if(newM){
        showToast("Visitante cadastrado! (sem acesso ao sistema)")
      }
      await addLog(session,"create",`Membro criado: ${form.name}`)
    }
    setModal(false);setEditing(null);setForm(emptyForm)
  }

  async function del(){
    if(session?.role!=="admin"){showToast("Apenas o gestor pode excluir","error");return}
    await supabase.from("users").delete().eq("member_id",deleteId)
    await supabase.from("members").delete().eq("id",deleteId)
    await addLog(session,"delete","Membro removido")
    showToast("Membro removido");setDeleteId(null)
  }

  async function resetPw(){
    if(newPw.length<6){showToast("Senha muito curta","error");return}
    await supabase.from("users").update({password_hash:btoa64(newPw)}).eq("member_id",pwModal)
    showToast("Senha redefinida!");setPwModal(null);setNewPw("")
  }

  async function toggleActive(m){
    const{data:user}=await supabase.from("users").select("id,active").eq("member_id",m.id).single()
    const isActive=user?.active!==false
    await supabase.from("users").update({active:!isActive}).eq("member_id",m.id)
    showToast(isActive?"Membro inativado!":"Membro reativado!")
  }

  const filtered=members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||(m.phone||"").includes(search))
  const cOpts=[{value:"",label:"— Sem célula —"},...cells.map(c=>({value:c.id,label:c.name}))]

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Membros <span style={{fontSize:13,color:"#94a3b8",fontWeight:600}}>({members.filter(m=>m.status==="Membro").length} membros, {members.filter(m=>m.status==="Visitante").length} visitantes)</span></h2>
        <Btn icon="plus" size="sm" onClick={()=>{setForm(emptyForm);setEditing(null);setModal(true)}}>Novo</Btn>
      </div>
      <div style={{position:"relative",marginBottom:12}}>
        <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",pointerEvents:"none"}}><Icon name="search" size={15}/></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome ou telefone..." style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px 10px 36px",fontSize:14,outline:"none"}}/>
      </div>
      {loading&&<Loader/>}
      {!loading&&filtered.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhum encontrado</p></Card>}
      {filtered.map(m=>{
        const cell=cells.find(c=>c.id===m.cell_id)
        const sc=m.status==="Membro"?"#059669":"#2563eb"
        return(
          <Card key={m.id} style={{marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
              <Avatar name={m.name} photo={m.photo_url} size={40} color={sc}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
                <div style={{fontSize:12,color:"#94a3b8"}}>{cell?.name||"Sem célula"} • {m.phone||"—"}</div>
              </div>
              <Badge label={m.status} color={sc}/>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {m.baptized&&<Badge label="✓ Batizado" color="#d97706"/>}
              {m.age&&<span style={{fontSize:11,color:"#94a3b8"}}>{m.age} anos</span>}
              {!m.cpf&&<Badge label="Sem CPF" color="#94a3b8"/>}
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"flex-end",flexWrap:"wrap"}}>
              <button onClick={()=>setCardModal(m)} style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"5px 8px",cursor:"pointer",color:"#64748b",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:3}}><Icon name="id-card" size={12}/>Carteirinha</button>
              {session?.role==="admin"&&m.cpf&&<button onClick={()=>{setPwModal(m.id);setNewPw("")}} style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"5px 8px",cursor:"pointer",color:"#64748b",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:3}}><Icon name="key" size={12}/>Senha</button>}
              <button onClick={()=>openEdit(m)} style={{background:"#eff6ff",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#2563eb"}}><Icon name="edit" size={14}/></button>
              {m.cpf&&<button onClick={()=>toggleActive(m)} style={{background:"#fef3c7",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#d97706"}}><Icon name="pause" size={14}/></button>}
              {session?.role==="admin"&&<button onClick={()=>setDeleteId(m.id)} style={{background:"#fef2f2",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#dc2626"}}><Icon name="trash" size={14}/></button>}
            </div>
          </Card>
        )
      })}

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Editar Cadastro":"Novo Cadastro"}>
        <Inp label="Nome Completo" value={form.name} onChange={v=>f("name")(v.toUpperCase())} required/>
        <Sel label="Status" value={form.status} onChange={f("status")} options={STATUS_LIST.map(s=>({value:s,label:s}))}/>
        {form.status==="Membro"&&<Inp label="CPF *obrigatório para acesso" value={form.cpf} onChange={v=>f("cpf")(fmtCPF(v))} placeholder="000.000.000-00" required/>}
        {form.status==="Visitante"&&<Inp label="CPF (opcional)" value={form.cpf} onChange={v=>f("cpf")(fmtCPF(v))} placeholder="000.000.000-00"/>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Data de Nascimento" type="date" value={form.birth_date} onChange={v=>{f("birth_date")(v);f("age")(calcAge(v)||"")}}/>
          <Inp label="Idade" value={form.age} onChange={f("age")} type="number" readOnly={!!form.birth_date}/>
        </div>
        <Sel label="Sexo" value={form.gender} onChange={f("gender")} options={["Masculino","Feminino"].map(s=>({value:s,label:s}))}/>
        <Inp label="Telefone (WhatsApp)" value={form.phone} onChange={f("phone")} placeholder="(00) 00000-0000"/>
        <Inp label="E-mail" type="email" value={form.email} onChange={f("email")}/>
        <Inp label="Bairro" value={form.neighborhood} onChange={v=>f("neighborhood")(v.toUpperCase())}/>
        <Sel label="Célula" value={form.cell_id} onChange={f("cell_id")} options={cOpts}/>
        <Inp label="Convidado por" value={form.invited_by} onChange={v=>f("invited_by")(v.toUpperCase())}/>
        <Inp label="URL da Foto (link)" value={form.photo_url} onChange={f("photo_url")} placeholder="https://..."/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8,letterSpacing:"0.05em",textTransform:"uppercase"}}>Batismo</label>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <button type="button" onClick={()=>f("baptized")(true)} style={{flex:1,padding:"8px",borderRadius:10,fontSize:13,fontWeight:700,border:`1.5px solid ${form.baptized?"#059669":"#e2e8f0"}`,background:form.baptized?"#dcfce7":"#f8fafc",color:form.baptized?"#166534":"#64748b",cursor:"pointer"}}>✓ Batizado</button>
            <button type="button" onClick={()=>{f("baptized")(false);f("baptism_date")("")}} style={{flex:1,padding:"8px",borderRadius:10,fontSize:13,fontWeight:700,border:`1.5px solid ${!form.baptized?"#dc2626":"#e2e8f0"}`,background:!form.baptized?"#fee2e2":"#f8fafc",color:!form.baptized?"#991b1b":"#64748b",cursor:"pointer"}}>✗ Não batizado</button>
          </div>
          {form.baptized&&<Inp label="Data do Batismo (opcional)" type="date" value={form.baptism_date} onChange={f("baptism_date")}/>}
        </div>
        <div style={{borderTop:"1.5px solid #f1f5f9",margin:"8px 0",paddingTop:10}}>
          <p style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>Família</p>
          {[["father_name","Pai"],["mother_name","Mãe"],["spouse_name","Cônjuge"]].map(([field,label])=>(
            <div key={field} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</label>
              <div style={{display:"flex",gap:8}}>
                <input value={form[field]||""} onChange={e=>f(field)(e.target.value.toUpperCase())} placeholder={`Nome do ${label.toLowerCase()}`} style={{flex:1,border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none"}}/>
                <button type="button" onClick={()=>{setFamilyField(field);setShowFamilySearch(true)}} style={{background:"#eff6ff",border:"none",borderRadius:10,padding:"10px 12px",cursor:"pointer",color:"#2563eb",display:"flex",alignItems:"center"}}><Icon name="search" size={14}/></button>
              </div>
            </div>
          ))}
        </div>
        <Btn full onClick={save} style={{marginTop:8}}>{editing?"Salvar Alterações":"Cadastrar"}</Btn>
      </Modal>

      <MemberSearchModal open={showFamilySearch} title="Buscar Familiar" members={members} onSelect={m=>setForm(p=>({...p,[familyField]:m.name}))} onClose={()=>setShowFamilySearch(false)}/>

      {cardModal&&<MemberCard member={cardModal} cells={cells} onClose={()=>setCardModal(null)}/>}
      {pwModal&&<Modal open title="Redefinir Senha" onClose={()=>setPwModal(null)}><Inp label="Nova Senha" type="password" value={newPw} onChange={setNewPw} placeholder="Mínimo 6 caracteres"/><Btn full onClick={resetPw}>Redefinir Senha</Btn></Modal>}
      {deleteId&&<Modal open title="Confirmar Exclusão" onClose={()=>setDeleteId(null)}><p style={{color:"#64748b",marginBottom:16}}>Remover permanentemente?</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Btn variant="ghost" onClick={()=>setDeleteId(null)}>Cancelar</Btn><Btn variant="danger" onClick={del}>Excluir</Btn></div></Modal>}
    </div>
  )
}

function MemberCard({member,cells,onClose}){
  const cell=cells.find(c=>c.id===member.cell_id)
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.8)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:340,overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#1e40af,#1e3a5f)",padding:"24px 20px",textAlign:"center"}}>
          <div style={{margin:"0 auto 12px"}}><Avatar name={member.name} photo={member.photo_url} size={72} color="#7dd3fc"/></div>
          <div style={{color:"#fff",fontSize:16,fontWeight:900,marginBottom:4}}>{member.name}</div>
          <div style={{color:"#bfdbfe",fontSize:12}}>{member.status}</div>
        </div>
        <div style={{padding:"16px 20px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{textAlign:"center",background:"#f8fafc",borderRadius:10,padding:10}}><div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Célula</div><div style={{fontSize:13,fontWeight:800,color:"#0f172a",marginTop:2}}>{cell?.name||"—"}</div></div>
            <div style={{textAlign:"center",background:"#f8fafc",borderRadius:10,padding:10}}><div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Status</div><div style={{fontSize:13,fontWeight:800,color:"#059669",marginTop:2}}>{member.status}</div></div>
          </div>
          {member.baptized&&<div style={{background:"#fef3c7",borderRadius:10,padding:"8px 12px",marginBottom:12,textAlign:"center"}}><span style={{fontSize:13,fontWeight:700,color:"#92400e"}}>✓ Batizado{member.baptism_date?` em ${fmtDate(member.baptism_date)}`:""}</span></div>}
          <div style={{fontSize:11,color:"#94a3b8",textAlign:"center",marginBottom:12}}>Promessa Lago dos Peixes</div>
          <Btn full variant="ghost" onClick={onClose}>Fechar</Btn>
        </div>
      </div>
    </div>
  )
}

function AttendancePanel({session,showToast}){
  const{data:cells}=useTable("cells")
  const{data:members}=useTable("members")
  const{data:allAtt}=useTable("attendance")
  const[cellId,setCellId]=useState("")
  const[date,setDate]=useState(todayStr())
  const[theme,setTheme]=useState("")
  const[preacher,setPreacher]=useState("")
  const[songs,setSongs]=useState("")
  const[photosLink,setPhotosLink]=useState("")
  const[marks,setMarks]=useState({})
  const[saving,setSaving]=useState(false)
  const[commentsModal,setCommentsModal]=useState(null)
  const[preacherSearch,setPreacherSearch]=useState(false)

  const cellMembers=members.filter(m=>m.cell_id===cellId&&m.status==="Membro")
  const presentCount=Object.values(marks).filter(v=>v==="Presente").length
  const pct=cellMembers.length?Math.round(presentCount/cellMembers.length*100):0

  async function save(){
    if(!cellId||!date){showToast("Selecione célula e data","error");return}
    setSaving(true)
    const records=cellMembers.map(m=>({member_id:m.id,member_name:m.name,cell_id:cellId,date,theme,preacher,songs,photos_link:photosLink,status:marks[m.id]||"Ausente",recorded_by:session.id}))
    const{error}=await supabase.from("attendance").insert(records)
    if(error){showToast("Erro: "+error.message,"error");setSaving(false);return}
    const cell=cells.find(c=>c.id===cellId)
    if(cell?.auto_create_meetings){
      const nextDate=getNextMeetingDate(cell.day)
      await supabase.from("cells").update({next_meeting_date:nextDate}).eq("id",cellId)
    }
    await addLog(session,"create",`Presença registrada: ${date}`)
    showToast("Presença salva!");setSaving(false);setMarks({})
    setTheme("");setPreacher("");setSongs("");setPhotosLink("")
  }

  const grouped={}
  allAtt.filter(a=>a.cell_id===cellId).forEach(a=>{if(!grouped[a.date])grouped[a.date]=[];grouped[a.date].push(a)})
  const recentDates=Object.keys(grouped).sort().reverse().slice(0,5)

  // Filter cells based on role
  const myCells=session?.role==="admin"||session?.role==="supervisor"?cells:cells.filter(c=>c.id===session?.cell_id)

  return(
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Registrar Presença</h2>
      <Card style={{marginBottom:14}}>
        <Sel label="Célula" value={cellId} onChange={v=>{setCellId(v);setMarks({})}} options={[{value:"",label:"Selecione a célula..."},...myCells.filter(c=>c.active!==false).map(c=>({value:c.id,label:`${c.name}${c.next_meeting_date?` • próx: ${fmtDate(c.next_meeting_date)}`:""}`}))]}/>
        <Inp label="Data do Encontro" type="date" value={date} onChange={setDate}/>
        <Inp label="Tema da Palavra" value={theme} onChange={setTheme} placeholder="Tema do encontro"/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}>Quem passou a Palavra</label>
          <div style={{display:"flex",gap:8}}>
            <input value={preacher} onChange={e=>setPreacher(e.target.value)} placeholder="Nome do pregador" style={{flex:1,border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none"}}/>
            <button type="button" onClick={()=>setPreacherSearch(true)} style={{background:"#eff6ff",border:"none",borderRadius:10,padding:"10px 12px",cursor:"pointer",color:"#2563eb",display:"flex",alignItems:"center"}}><Icon name="search" size={14}/></button>
          </div>
        </div>
        <Textarea label="Músicas Cantadas" value={songs} onChange={setSongs} placeholder="Liste as músicas..." rows={2}/>
        <Inp label="Link das Fotos" value={photosLink} onChange={setPhotosLink} placeholder="https://..."/>
      </Card>

      {cellMembers.length>0&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:700,color:"#64748b"}}>Chamada ({cellMembers.length} membros)</span>
            <span style={{fontSize:14,fontWeight:900,color:pct>=75?"#059669":pct>=50?"#d97706":"#dc2626"}}>{presentCount}/{cellMembers.length} • {pct}%</span>
          </div>
          {cellMembers.map(m=>{
            const s=marks[m.id]
            return(
              <Card key={m.id} style={{marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <Avatar name={m.name} photo={m.photo_url} size={32} color="#2563eb"/>
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

      {cellId&&cellMembers.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0,fontSize:13}}>Nenhum membro nesta célula</p></Card>}

      {recentDates.length>0&&(
        <div style={{marginTop:24}}>
          <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:10}}>Histórico Recente</h3>
          {recentDates.map(d=>{
            const items=grouped[d];const p=items.filter(i=>i.status==="Presente").length;const item=items[0]
            return(
              <Card key={d} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:"#334155"}}>{fmtDate(d)}</div>
                    {item?.theme&&<div style={{fontSize:11,color:"#64748b",marginTop:2}}>📖 {item.theme}</div>}
                    {item?.preacher&&<div style={{fontSize:11,color:"#64748b"}}>🎤 {item.preacher}</div>}
                    {item?.songs&&<div style={{fontSize:11,color:"#64748b"}}>🎵 {item.songs}</div>}
                  </div>
                  <div style={{display:"flex",gap:4,flexDirection:"column",alignItems:"flex-end"}}>
                    <div style={{display:"flex",gap:4}}><Badge label={`✓ ${p}`} color="#059669"/><Badge label={`✗ ${items.length-p}`} color="#dc2626"/></div>
                    {item?.photos_link&&<a href={item.photos_link} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#2563eb",fontWeight:600,display:"flex",alignItems:"center",gap:3,textDecoration:"none"}}><Icon name="link" size={11}/>Fotos</a>}
                    <button onClick={()=>setCommentsModal({date:d,cellId})} style={{background:"#f0fdf4",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",color:"#059669",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:3}}><Icon name="comment" size={11}/>Comentários</button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <MemberSearchModal open={preacherSearch} title="Quem passou a Palavra?" members={members.filter(m=>m.cell_id===cellId||!cellId)} onSelect={m=>setPreacher(m.name)} onClose={()=>setPreacherSearch(false)}/>
      {commentsModal&&<CommentsModal date={commentsModal.date} cellId={commentsModal.cellId} session={session} showToast={showToast} onClose={()=>setCommentsModal(null)}/>}
    </div>
  )
}

function CommentsModal({date,cellId,session,showToast,onClose}){
  const{data:comments,reload}=useTable("meeting_comments",{col:"attendance_date",val:date})
  const cellComments=comments.filter(c=>c.cell_id===cellId)
  const[newComment,setNewComment]=useState("")
  const[reaction,setReaction]=useState("")
  async function addComment(){
    if(!newComment.trim()){showToast("Escreva um comentário","error");return}
    await supabase.from("meeting_comments").insert({attendance_date:date,cell_id:cellId,member_id:session.member_id||null,member_name:session.name,comment:newComment.trim(),reaction})
    setNewComment("");setReaction("");reload();showToast("Comentário adicionado!")
  }
  return(
    <Modal open title={`Comentários • ${fmtDate(date)}`} onClose={onClose}>
      <Textarea value={newComment} onChange={setNewComment} placeholder="Como foi o encontro? Compartilhe algo que te tocou..." rows={3}/>
      <div style={{marginBottom:12}}>
        <p style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Reação</p>
        <div style={{display:"flex",gap:8}}>{REACTIONS.map(r=>(<button key={r} onClick={()=>setReaction(r===reaction?"":r)} style={{fontSize:20,background:reaction===r?"#eff6ff":"#f8fafc",border:`1.5px solid ${reaction===r?"#2563eb":"#e2e8f0"}`,borderRadius:10,padding:"6px 10px",cursor:"pointer"}}>{r}</button>))}</div>
      </div>
      <Btn full onClick={addComment} icon="send" style={{marginBottom:16}}>Comentar</Btn>
      <div style={{borderTop:"1.5px solid #f1f5f9",paddingTop:14}}>
        <p style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:10}}>{cellComments.length} comentário(s)</p>
        {cellComments.length===0&&<p style={{color:"#94a3b8",fontSize:13,textAlign:"center"}}>Nenhum comentário ainda 😊</p>}
        {cellComments.map(c=>(<div key={c.id} style={{background:"#f8fafc",borderRadius:12,padding:"10px 14px",marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{c.member_name}</span><div style={{display:"flex",alignItems:"center",gap:6}}>{c.reaction&&<span style={{fontSize:16}}>{c.reaction}</span>}<span style={{fontSize:11,color:"#94a3b8"}}>{new Date(c.created_at).toLocaleString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span></div></div><p style={{fontSize:13,color:"#475569",margin:0,lineHeight:1.5}}>{c.comment}</p></div>))}
      </div>
    </Modal>
  )
}

function EventsPanel({session,showToast}){
  const{data:events,loading}=useTable("events")
  const{data:cells}=useTable("cells")
  const{data:members}=useTable("members")
  const{data:eventAtt}=useTable("event_attendance")
  const[modal,setModal]=useState(false)
  const[editing,setEditing]=useState(null)
  const[attModal,setAttModal]=useState(null)
  const[marks,setMarks]=useState({})
  const emptyForm={title:"",description:"",date:"",time:"",location:"",cell_id:"",type:"Evento",photos_link:""}
  const[form,setForm]=useState(emptyForm)
  const f=k=>v=>setForm(p=>({...p,[k]:v}))
  async function save(){
    if(!form.title||!form.date){showToast("Título e data obrigatórios","error");return}
    const payload={...form,cell_id:form.cell_id||null,created_by:session.id}
    if(editing){await supabase.from("events").update(payload).eq("id",editing);showToast("Evento atualizado!")}
    else{await supabase.from("events").insert(payload);showToast("Evento criado!")}
    setModal(false);setEditing(null);setForm(emptyForm)
  }
  async function saveAtt(eventId){
    const records=Object.entries(marks).map(([mid,status])=>({event_id:eventId,member_id:mid,member_name:members.find(m=>m.id===mid)?.name||"",status}))
    if(records.length>0)await supabase.from("event_attendance").insert(records)
    showToast("Presença salva!");setAttModal(null);setMarks({})
  }
  const cOpts=[{value:"",label:"— Todos —"},...cells.map(c=>({value:c.id,label:c.name}))]
  const eventTypes=["Evento","Culto","Retiro","Confraternização","Batismo","Outro"]
  const myCells=session?.role==="admin"||session?.role==="supervisor"?cells:cells.filter(c=>c.id===session?.cell_id)
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Eventos</h2>
        <Btn icon="plus" size="sm" onClick={()=>{setForm(emptyForm);setEditing(null);setModal(true)}}>Novo</Btn>
      </div>
      {loading&&<Loader/>}
      {!loading&&events.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhum evento</p></Card>}
      {events.map(ev=>{
        const cell=cells.find(c=>c.id===ev.cell_id)
        const attCount=eventAtt.filter(a=>a.event_id===ev.id&&a.status==="Presente").length
        return(<Card key={ev.id} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div><div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{ev.title}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{fmtDate(ev.date)}{ev.time&&` às ${ev.time}`}</div>{ev.location&&<div style={{fontSize:12,color:"#64748b"}}>📍 {ev.location}</div>}{cell&&<div style={{fontSize:12,color:"#64748b"}}>🏠 {cell.name}</div>}</div>
            <div style={{display:"flex",gap:4,flexDirection:"column",alignItems:"flex-end"}}><Badge label={ev.type} color="#7c3aed"/>{attCount>0&&<Badge label={`✓ ${attCount}`} color="#059669"/>}</div>
          </div>
          {ev.description&&<p style={{fontSize:12,color:"#64748b",margin:"0 0 8px"}}>{ev.description}</p>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button onClick={()=>{setAttModal(ev);setMarks({})}} style={{background:"#eff6ff",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",color:"#2563eb",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><Icon name="check-circle" size={12}/>Presença</button>
            {ev.photos_link&&<a href={ev.photos_link} target="_blank" rel="noopener noreferrer" style={{background:"#f0fdf4",border:"none",borderRadius:8,padding:"5px 10px",color:"#059669",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4,textDecoration:"none"}}><Icon name="link" size={12}/>Fotos</a>}
            <button onClick={()=>{setForm({title:ev.title,description:ev.description||"",date:ev.date,time:ev.time||"",location:ev.location||"",cell_id:ev.cell_id||"",type:ev.type,photos_link:ev.photos_link||""});setEditing(ev.id);setModal(true)}} style={{background:"#fef3c7",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",color:"#d97706",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><Icon name="edit" size={12}/>Editar</button>
          </div>
        </Card>)
      })}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Editar Evento":"Novo Evento"}>
        <Inp label="Título" value={form.title} onChange={f("title")} required placeholder="Nome do evento"/>
        <Sel label="Tipo" value={form.type} onChange={f("type")} options={eventTypes.map(t=>({value:t,label:t}))}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Inp label="Data" type="date" value={form.date} onChange={f("date")} required/><Inp label="Horário" type="time" value={form.time} onChange={f("time")}/></div>
        <Inp label="Local" value={form.location} onChange={f("location")} placeholder="Endereço ou nome do local"/>
        <Sel label="Célula (opcional)" value={form.cell_id} onChange={f("cell_id")} options={[{value:"",label:"— Geral —"},...myCells.map(c=>({value:c.id,label:c.name}))]}/>
        <Textarea label="Descrição" value={form.description} onChange={f("description")} placeholder="Detalhes do evento..."/>
        <Inp label="Link das Fotos" value={form.photos_link} onChange={f("photos_link")} placeholder="https://..."/>
        <Btn full onClick={save}>{editing?"Salvar Alterações":"Criar Evento"}</Btn>
      </Modal>
      {attModal&&(
        <Modal open title={`Presença — ${attModal.title}`} onClose={()=>{setAttModal(null);setMarks({})}}>
          {(attModal.cell_id?members.filter(m=>m.cell_id===attModal.cell_id&&m.status==="Membro"):members.filter(m=>m.status==="Membro")).map(m=>{
            const s=marks[m.id]
            return(
              <div key={m.id} style={{marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:6}}>{m.name}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {["Presente","Ausente"].map(v=>(
                    <button key={v} onClick={()=>setMarks(p=>({...p,[m.id]:v}))} style={{padding:"6px",borderRadius:8,fontSize:12,fontWeight:700,border:`1.5px solid ${s===v?(v==="Presente"?"#059669":"#dc2626"):"#e2e8f0"}`,background:s===v?(v==="Presente"?"#dcfce7":"#fee2e2"):"#f8fafc",color:s===v?(v==="Presente"?"#166634":"#991b1b"):"#64748b",cursor:"pointer"}}>
                      {v==="Presente"?"✓ Presente":"✗ Ausente"}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <Btn full onClick={()=>saveAtt(attModal.id)} style={{marginTop:12}}>Salvar Presença</Btn>
        </Modal>
      )}
    </div>
  )
}

function ReportsPanel(){
  const{data:members}=useTable("members")
  const{data:cells}=useTable("cells")
  const{data:attendance}=useTable("attendance")
  const Bar=({value,max,color})=>(<div style={{height:8,background:"#f1f5f9",borderRadius:4,overflow:"hidden",flex:1}}><div style={{height:"100%",width:`${max?Math.round(value/max*100):0}%`,background:color,borderRadius:4}}/></div>)
  const activeMembers=members.filter(m=>m.status==="Membro")
  const visitors=members.filter(m=>m.status==="Visitante")
  const baptized=members.filter(m=>m.baptized).length
  const cellData=cells.map(c=>({name:c.name,count:members.filter(m=>m.cell_id===c.id&&m.status==="Membro").length,visitors:members.filter(m=>m.cell_id===c.id&&m.status==="Visitante").length,goal:c.growth_goal||0,active:c.active!==false})).sort((a,b)=>b.count-a.count)
  const currentMonth=getCurrentMonth()
  const birthdays=members.filter(m=>m.birth_date&&getMonthBirthday(m.birth_date)===currentMonth)
  const genderData=activeMembers.reduce((a,m)=>{a[m.gender||"N/I"]=(a[m.gender||"N/I"]||0)+1;return a},{})
  const attByMember={}
  attendance.forEach(a=>{if(!attByMember[a.member_id])attByMember[a.member_id]={name:a.member_name,total:0,present:0};attByMember[a.member_id].total++;if(a.status==="Presente")attByMember[a.member_id].present++})
  const attList=Object.values(attByMember).sort((a,b)=>(b.present/b.total||0)-(a.present/a.total||0)).slice(0,15)
  return(
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Relatórios</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <Stat label="Membros" value={activeMembers.length} color="#2563eb" icon="users"/>
        <Stat label="Visitantes" value={visitors.length} color="#7c3aed" icon="user-plus"/>
        <Stat label="Batizados" value={baptized} color="#d97706" icon="check-circle"/>
        <Stat label="Células" value={cells.filter(c=>c.active!==false).length} color="#059669" icon="grid"/>
      </div>
      {birthdays.length>0&&(<Card style={{marginBottom:12,border:"1.5px solid #fde68a",background:"#fffbeb"}}><h3 style={{fontSize:14,fontWeight:800,color:"#92400e",marginBottom:10}}>🎂 Aniversariantes do Mês</h3>{birthdays.map(m=>(<div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderTop:"1px solid #fde68a"}}><Avatar name={m.name} photo={m.photo_url} size={28} color="#d97706"/><div><div style={{fontSize:13,fontWeight:700,color:"#92400e"}}>{m.name}</div><div style={{fontSize:11,color:"#b45309"}}>{fmtDate(m.birth_date)}</div></div></div>))}</Card>)}
      <Card style={{marginBottom:12}}><h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>🎯 Meta por Célula</h3>{cellData.map(({name,count,visitors,goal,active})=>(<div key={name} style={{marginBottom:12,opacity:active?1:0.5}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:700,color:"#334155"}}>{name}{!active&&" (inativa)"}</span><span style={{fontSize:12,color:"#64748b"}}>{count} membros{visitors>0?` + ${visitors} visit.`:""}{goal>0?`/${goal}`:""}</span></div>{goal>0?<ProgressBar value={count} max={goal} color="#2563eb"/>:<div style={{height:8,background:"#f1f5f9",borderRadius:4}}/>}</div>))}</Card>
      <Card style={{marginBottom:12}}><h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Por Sexo (membros)</h3>{Object.entries(genderData).map(([k,v])=>(<div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:12,fontWeight:600,color:"#334155",minWidth:90}}>{k}</span><Bar value={v} max={activeMembers.length} color="#2563eb"/><span style={{fontSize:12,fontWeight:700,color:"#2563eb",minWidth:24,textAlign:"right"}}>{v}</span></div>))}</Card>
      {attList.length>0&&(<Card><h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Frequência Individual</h3>{attList.map(({name,total,present})=>{const pct=Math.round(present/total*100);const color=pct>=75?"#059669":pct>=50?"#d97706":"#dc2626";return(<div key={name} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#334155",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span><span style={{fontSize:12,fontWeight:800,color,marginLeft:8}}>{pct}%</span></div><div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden",flex:1}}><div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3}}/></div><span style={{fontSize:10,color:"#94a3b8",flexShrink:0}}>{present}/{total}</span></div></div>)})}</Card>)}
    </div>
  )
}

function MessagesPanel({session,showToast}){
  const{data:cells}=useTable("cells")
  const{data:members}=useTable("members")
  const{data:msgs}=useTable("messages")
  const[form,setForm]=useState({title:"",body:"",target_type:"all",target_cell_id:"",target_role:"",channels:{sms:false,whatsapp:true,email:false}})
  const f=k=>v=>setForm(p=>({...p,[k]:v}))
  const isAdmin=session?.role==="admin"
  const isSupervisor=session?.role==="supervisor"
  const targetOptions=[{value:"all",label:"Todos os membros"},{value:"cell",label:"Uma célula específica"},...((isAdmin||isSupervisor)?[{value:"role",label:"Por função"}]:[])]
  const roleOptions=[{value:"leader",label:"Apenas Líderes"},{value:"secretary",label:"Apenas Secretários"},{value:"supervisor",label:"Apenas Supervisores"}]
  function getTargetCount(){
    if(form.target_type==="all")return members.filter(m=>m.status==="Membro").length
    if(form.target_type==="cell"&&form.target_cell_id)return members.filter(m=>m.cell_id===form.target_cell_id&&m.status==="Membro").length
    if(form.target_type==="role"&&form.target_role)return members.filter(m=>m.role===form.target_role).length
    return 0
  }
  async function send(){
    if(!form.title||!form.body){showToast("Título e mensagem obrigatórios","error");return}
    const channels=Object.entries(form.channels).filter(([,v])=>v).map(([k])=>k.toUpperCase())
    if(!channels.length){showToast("Selecione ao menos um canal","error");return}
    await supabase.from("messages").insert({title:form.title,body:form.body,channels,sent_by:session.id,sent_by_name:session.name,target_type:form.target_type,target_cell_id:form.target_cell_id||null,target_role:form.target_role,target_count:getTargetCount()})
    showToast(`Mensagem registrada para ${getTargetCount()} pessoas!`)
    setForm(p=>({...p,title:"",body:""}))
  }
  const myCells=isAdmin?cells:cells.filter(c=>c.id===session?.cell_id)
  return(
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Mensagens</h2>
      <Card style={{marginBottom:14}}>
        <Sel label="Enviar para" value={form.target_type} onChange={f("target_type")} options={targetOptions}/>
        {form.target_type==="cell"&&<Sel label="Célula" value={form.target_cell_id} onChange={f("target_cell_id")} options={[{value:"",label:"Selecione..."},...myCells.map(c=>({value:c.id,label:c.name}))]}/>}
        {form.target_type==="role"&&<Sel label="Função" value={form.target_role} onChange={f("target_role")} options={roleOptions}/>}
        <Inp label="Título" value={form.title} onChange={f("title")} placeholder="Ex: Encontro desta semana" required/>
        <Textarea label="Mensagem" value={form.body} onChange={f("body")} placeholder="Escreva a mensagem..." rows={4}/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8,letterSpacing:"0.05em",textTransform:"uppercase"}}>Canais</label>
          <div style={{display:"flex",gap:8}}>{["sms","whatsapp","email"].map(ch=>(<button key={ch} onClick={()=>setForm(p=>({...p,channels:{...p.channels,[ch]:!p.channels[ch]}}))} style={{flex:1,padding:"10px 6px",borderRadius:10,border:`1.5px solid ${form.channels[ch]?"#2563eb":"#e2e8f0"}`,background:form.channels[ch]?"#eff6ff":"#f8fafc",color:form.channels[ch]?"#1e40af":"#94a3b8",fontSize:12,fontWeight:700,cursor:"pointer"}}>{ch==="sms"?"📱 SMS":ch==="whatsapp"?"💬 WhatsApp":"📧 E-mail"}</button>))}</div>
        </div>
        {getTargetCount()>0&&<div style={{background:"#eff6ff",borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:13,color:"#1e40af",fontWeight:600}}>📤 Para {getTargetCount()} pessoa(s)</div>}
        <Btn full icon="send" onClick={send}>Enviar Mensagem</Btn>
      </Card>
      <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:10}}>Histórico</h3>
      {msgs.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhuma mensagem</p></Card>}
      {msgs.map(m=>(<Card key={m.id} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:800,color:"#0f172a"}}>{m.title}</span><span style={{fontSize:11,color:"#94a3b8"}}>{fmtDate(m.created_at?.split("T")[0])}</span></div><p style={{fontSize:12,color:"#64748b",margin:"0 0 8px",lineHeight:1.5}}>{m.body}</p><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{m.channels?.map(c=><Badge key={c} label={c} color="#2563eb"/>)}<Badge label={`${m.target_count} pessoas`} color="#059669"/><Badge label={m.sent_by_name} color="#64748b"/></div></Card>))}
    </div>
  )
}

function AllRequestsPanel({session,showToast}){
  const{data:inactReqs}=useTable("inactivation_requests")
  const{data:cellReqs}=useTable("cell_change_requests")
  const{data:members}=useTable("members")
  const{data:cells}=useTable("cells")
  const[tab,setTab]=useState("inativacao")
  const[modal,setModal]=useState(false)
  const[cellModal,setCellModal]=useState(false)
  const[form,setForm]=useState({member_id:"",reason:""})
  const[cellForm,setCellForm]=useState({cell_id:"",field_name:"",requested_value:"",reason:""})
  const canResolve=session?.role==="admin"||session?.role==="supervisor"
  const sc={pending:"#d97706",approved:"#059669",rejected:"#dc2626"}
  const sl={pending:"Pendente",approved:"Aprovado",rejected:"Rejeitado"}

  async function createInactReq(){
    if(!form.member_id||!form.reason){showToast("Preencha todos os campos","error");return}
    const member=members.find(m=>m.id===form.member_id)
    await supabase.from("inactivation_requests").insert({member_id:form.member_id,member_name:member?.name||"",cell_id:member?.cell_id||null,reason:form.reason,requested_by:session.id,requested_by_name:session.name,status:"pending"})
    showToast("Solicitação enviada!");setModal(false);setForm({member_id:"",reason:""})
  }

  async function createCellReq(){
    if(!cellForm.cell_id||!cellForm.field_name||!cellForm.requested_value){showToast("Preencha todos os campos","error");return}
    const cell=cells.find(c=>c.id===cellForm.cell_id)
    await supabase.from("cell_change_requests").insert({cell_id:cellForm.cell_id,cell_name:cell?.name||"",requested_by:session.id,requested_by_name:session.name,field_name:cellForm.field_name,requested_value:cellForm.requested_value,reason:cellForm.reason,status:"pending"})
    showToast("Solicitação enviada!");setCellModal(false);setCellForm({cell_id:"",field_name:"",requested_value:"",reason:""})
  }

  async function resolveInact(id,status){
    await supabase.from("inactivation_requests").update({status,resolved_by:session.id,resolved_at:new Date().toISOString()}).eq("id",id)
    if(status==="approved"){const req=inactReqs.find(r=>r.id===id);if(req){await supabase.from("members").update({status:"Membro"}).eq("id",req.member_id);await supabase.from("users").update({active:false}).eq("member_id",req.member_id)}}
    showToast(status==="approved"?"Aprovado! Membro inativado.":"Rejeitado")
  }

  async function resolveCellReq(id,status){
    await supabase.from("cell_change_requests").update({status,resolved_by:session.id,resolved_at:new Date().toISOString()}).eq("id",id)
    showToast(status==="approved"?"Aprovado!":"Rejeitado")
  }

  const mOpts=[{value:"",label:"Selecione o membro..."},...members.filter(m=>m.status==="Membro").map(m=>({value:m.id,label:m.name}))]
  const myCells=session?.role==="admin"?cells:cells.filter(c=>c.id===session?.cell_id)
  const cellOpts=[{value:"",label:"Selecione a célula..."},...myCells.map(c=>({value:c.id,label:c.name}))]
  const fieldOpts=[{value:"",label:"Selecione o campo..."},{value:"Endereço",label:"Endereço"},{value:"Horário",label:"Horário"},{value:"Dia da semana",label:"Dia da semana"},{value:"Anfitrião",label:"Anfitrião"},{value:"Outro",label:"Outro"}]

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",margin:0}}>Solicitações</h2>
        <div style={{display:"flex",gap:6}}>
          <Btn icon="plus" size="sm" variant="secondary" onClick={()=>setCellModal(true)}>Célula</Btn>
          <Btn icon="plus" size="sm" onClick={()=>setModal(true)}>Inativação</Btn>
        </div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:14,background:"#f1f5f9",borderRadius:10,padding:4}}>
        {[["inativacao","Inativações"],["celula","Alterações de Célula"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px",borderRadius:8,fontSize:13,fontWeight:700,border:"none",cursor:"pointer",background:tab===id?"#fff":"transparent",color:tab===id?"#0f172a":"#64748b"}}>{label}</button>
        ))}
      </div>

      {tab==="inativacao"&&(
        <div>
          {inactReqs.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhuma solicitação</p></Card>}
          {inactReqs.map(r=>(<Card key={r.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div><span style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{r.member_name}</span><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Por: {r.requested_by_name}</div></div><Badge label={sl[r.status]||r.status} color={sc[r.status]||"#64748b"}/></div><p style={{fontSize:12,color:"#64748b",margin:"0 0 8px"}}>Motivo: {r.reason}</p><div style={{fontSize:11,color:"#94a3b8",marginBottom:8}}>{fmtDate(r.created_at?.split("T")[0])}</div>{r.status==="pending"&&canResolve&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><Btn variant="success" size="sm" onClick={()=>resolveInact(r.id,"approved")}>✓ Aprovar</Btn><Btn variant="danger" size="sm" onClick={()=>resolveInact(r.id,"rejected")}>✗ Rejeitar</Btn></div>)}</Card>))}
        </div>
      )}

      {tab==="celula"&&(
        <div>
          {cellReqs.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhuma solicitação</p></Card>}
          {cellReqs.map(r=>(<Card key={r.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div><span style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{r.cell_name}</span><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Por: {r.requested_by_name}</div></div><Badge label={sl[r.status]||r.status} color={sc[r.status]||"#64748b"}/></div><p style={{fontSize:12,color:"#64748b",margin:"0 0 4px"}}>Campo: <b>{r.field_name}</b></p><p style={{fontSize:12,color:"#64748b",margin:"0 0 4px"}}>Novo valor: <b>{r.requested_value}</b></p>{r.reason&&<p style={{fontSize:12,color:"#64748b",margin:"0 0 8px"}}>Motivo: {r.reason}</p>}<div style={{fontSize:11,color:"#94a3b8",marginBottom:8}}>{fmtDate(r.created_at?.split("T")[0])}</div>{r.status==="pending"&&canResolve&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><Btn variant="success" size="sm" onClick={()=>resolveCellReq(r.id,"approved")}>✓ Aprovar</Btn><Btn variant="danger" size="sm" onClick={()=>resolveCellReq(r.id,"rejected")}>✗ Rejeitar</Btn></div>)}</Card>))}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Solicitar Inativação de Membro">
        <Sel label="Membro" value={form.member_id} onChange={v=>setForm(p=>({...p,member_id:v}))} options={mOpts}/>
        <Textarea label="Motivo" value={form.reason} onChange={v=>setForm(p=>({...p,reason:v}))} placeholder="Explique o motivo..."/>
        <Btn full onClick={createInactReq}>Enviar Solicitação</Btn>
      </Modal>

      <Modal open={cellModal} onClose={()=>setCellModal(false)} title="Solicitar Alteração na Célula">
        <Sel label="Célula" value={cellForm.cell_id} onChange={v=>setCellForm(p=>({...p,cell_id:v}))} options={cellOpts}/>
        <Sel label="Campo a alterar" value={cellForm.field_name} onChange={v=>setCellForm(p=>({...p,field_name:v}))} options={fieldOpts}/>
        <Inp label="Novo valor" value={cellForm.requested_value} onChange={v=>setCellForm(p=>({...p,requested_value:v}))} placeholder="Ex: Rua das Flores, 123"/>
        <Textarea label="Motivo (opcional)" value={cellForm.reason} onChange={v=>setCellForm(p=>({...p,reason:v}))} placeholder="Explique o motivo..." rows={2}/>
        <Btn full onClick={createCellReq}>Enviar Solicitação</Btn>
      </Modal>
    </div>
  )
}

function LogsPanel(){
  const{data:logs,loading}=useTable("logs")
  const emoji={create:"➕",update:"✏️",delete:"🗑️"}
  return(
    <div>
      <h2 style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Auditoria</h2>
      {loading&&<Loader/>}
      {!loading&&logs.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhum registro</p></Card>}
      {logs.map(log=>(<div key={log.id} style={{background:"#f8fafc",borderRadius:10,padding:"10px 14px",marginBottom:6,border:"1.5px solid #f1f5f9"}}><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}><span>{emoji[log.action]||"📝"}</span><span style={{fontSize:12,fontWeight:700,color:"#334155"}}>{log.detail}</span></div><span style={{fontSize:11,color:"#94a3b8"}}>{new Date(log.created_at).toLocaleString("pt-BR")}</span></div>))}
    </div>
  )
}

function LeaderSecretaryDashboard({session,logout,showToast}){
  const[sub,setSub]=useState("home")
  const[showChangePw,setShowChangePw]=useState(false)
  const{data:cells}=useTable("cells")
  const{data:members}=useTable("members")
  const{data:attendance}=useTable("attendance")
  const cell=cells.find(c=>c.id===session.cell_id)
  const cellMembers=members.filter(m=>m.cell_id===session.cell_id&&m.status==="Membro")
  const cellVisitors=members.filter(m=>m.cell_id===session.cell_id&&m.status==="Visitante")
  const cellAtt=attendance.filter(a=>a.cell_id===session.cell_id)
  const lastDate=[...new Set(cellAtt.map(a=>a.date))].sort().reverse()[0]
  const presentCount=cellAtt.filter(a=>a.date===lastDate&&a.status==="Presente").length
  const roleLabel=session.role==="secretary"?"Secretário":"Líder"

  const menu=[
    {id:"members",icon:"users",label:"Membros",desc:`${cellMembers.length} membros, ${cellVisitors.length} visitantes`,color:"#059669"},
    {id:"attendance",icon:"check-circle",label:"Presença",desc:"Registrar encontro",color:"#2563eb"},
    {id:"events",icon:"event",label:"Eventos",desc:"Gerenciar eventos",color:"#7c3aed"},
    {id:"reports",icon:"bar-chart",label:"Relatórios",desc:"Frequência e dados",color:"#d97706"},
    {id:"messages",icon:"message",label:"Mensagens",desc:"Enviar comunicados",color:"#0891b2"},
    {id:"requests",icon:"inbox",label:"Solicitações",desc:"Inativações e alterações",color:"#dc2626"},
  ]

  function renderSub(){
    if(sub==="members")return<MembersPanel session={session} showToast={showToast}/>
    if(sub==="attendance")return<AttendancePanel session={session} showToast={showToast}/>
    if(sub==="events")return<EventsPanel session={session} showToast={showToast}/>
    if(sub==="reports")return<ReportsPanel/>
    if(sub==="messages")return<MessagesPanel session={session} showToast={showToast}/>
    if(sub==="requests")return<AllRequestsPanel session={session} showToast={showToast}/>
    return null
  }

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <header style={{background:"#0f172a",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{color:"#f0f9ff",fontSize:16,fontWeight:800}}>{cell?.name||"Minha Célula"}</div><div style={{color:"#7dd3fc",fontSize:12}}>{roleLabel} • {session.name}</div></div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowChangePw(true)} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"7px 10px",cursor:"pointer",color:"#cbd5e1",display:"flex"}}><Icon name="key" size={15}/></button>
          <button onClick={logout} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"7px 12px",cursor:"pointer",color:"#cbd5e1",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600}}><Icon name="log-out" size={15}/>Sair</button>
        </div>
      </header>
      {sub==="home"?(
        <div style={{flex:1,padding:"16px 16px 80px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <Stat label="Membros" value={cellMembers.length} color="#059669" icon="users"/>
            <Stat label="Presentes (últ.)" value={presentCount} color="#2563eb" icon="check-circle"/>
          </div>
          {cell?.growth_goal>0&&(
            <Card style={{marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:"#334155",marginBottom:8}}>🎯 Meta de Crescimento</div>
              <ProgressBar value={cellMembers.length} max={cell.growth_goal} color="#2563eb"/>
              {cellVisitors.length>0&&<div style={{fontSize:11,color:"#7c3aed",marginTop:6}}>+ {cellVisitors.length} visitante(s) potencial(ais)</div>}
            </Card>
          )}
          {cell?.next_meeting_date&&(
            <Card style={{marginBottom:16,border:"1.5px solid #bfdbfe",background:"#eff6ff"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#1e40af"}}>📅 Próximo Encontro</div>
              <div style={{fontSize:16,fontWeight:900,color:"#1e40af",marginTop:4}}>{fmtDate(cell.next_meeting_date)} às {cell.time}</div>
              <div style={{fontSize:12,color:"#3b82f6",marginTop:2}}>{cell.frequency||"Semanal"} • {cell.neighborhood}</div>
            </Card>
          )}
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
          <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>{renderSub()}</div>
        </div>
      )}
      <ChangePasswordModal open={showChangePw} onClose={()=>setShowChangePw(false)} session={session} showToast={showToast}/>
    </div>
  )
}

function SupervisorDashboard({session,logout,showToast}){
  const[sub,setSub]=useState("home")
  const[showChangePw,setShowChangePw]=useState(false)
  const{data:cells}=useTable("cells")
  const{data:members}=useTable("members")
  const{data:requests}=useTable("inactivation_requests")
  const{data:cellReqs}=useTable("cell_change_requests")
  const supervised=cells.filter(c=>c.supervisor_id===session.member_id||c.supervisor_id===session.id)
  const pendingCount=requests.filter(r=>r.status==="pending").length+cellReqs.filter(r=>r.status==="pending").length
  const menu=[
    {id:"cells",icon:"grid",label:"Células",desc:`${supervised.length} células supervisionadas`,color:"#2563eb"},
    {id:"requests",icon:"inbox",label:"Solicitações",desc:`${pendingCount} pendente(s)`,color:"#dc2626"},
    {id:"messages",icon:"message",label:"Mensagens",desc:"Comunicar com líderes",color:"#7c3aed"},
    {id:"reports",icon:"bar-chart",label:"Relatórios",desc:"Visão geral",color:"#059669"},
  ]

  function CellsView(){
    return(<div>
      {supervised.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Nenhuma célula atribuída</p></Card>}
      {supervised.map(cell=>{
        const mc=members.filter(m=>m.cell_id===cell.id&&m.status==="Membro")
        const leaders=members.filter(m=>cell.leaders_ids?.includes(m.id))
        return(<Card key={cell.id} style={{marginBottom:10}}>
          <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:4}}>{cell.name}</div>
          <div style={{fontSize:12,color:"#64748b",marginBottom:4}}>{cell.neighborhood} • {cell.day} às {cell.time}</div>
          {cell.frequency&&<div style={{fontSize:11,color:"#7c3aed",marginBottom:8}}>🔄 {cell.frequency}{cell.next_meeting_date?` • Próximo: ${fmtDate(cell.next_meeting_date)}`:""}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12,color:"#64748b",marginBottom:8}}>
            <span>👤 <b style={{color:"#334155"}}>{leaders.length>0?leaders[0].name.split(" ")[0]:"—"}</b></span>
            <span>👥 <b style={{color:"#334155"}}>{mc.length} membros</b></span>
          </div>
          {cell.growth_goal>0&&<ProgressBar value={mc.length} max={cell.growth_goal} color="#7c3aed"/>}
        </Card>)
      })}
    </div>)
  }

  function renderSub(){
    if(sub==="cells")return<CellsView/>
    if(sub==="requests")return<AllRequestsPanel session={session} showToast={showToast}/>
    if(sub==="messages")return<MessagesPanel session={session} showToast={showToast}/>
    if(sub==="reports")return<ReportsPanel/>
    return null
  }

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <header style={{background:"#0f172a",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{color:"#f0f9ff",fontSize:16,fontWeight:800}}>Supervisor</div><div style={{color:"#7dd3fc",fontSize:12}}>{session.name}</div></div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowChangePw(true)} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"7px 10px",cursor:"pointer",color:"#cbd5e1",display:"flex"}}><Icon name="key" size={15}/></button>
          <button onClick={logout} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"7px 12px",cursor:"pointer",color:"#cbd5e1",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600}}><Icon name="log-out" size={15}/>Sair</button>
        </div>
      </header>
      {sub==="home"?(
        <div style={{flex:1,padding:"16px 16px 80px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            <Stat label="Células" value={supervised.length} color="#7c3aed" icon="grid"/>
            <Stat label="Pendências" value={pendingCount} color="#dc2626" icon="inbox"/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {menu.map(item=>(<button key={item.id} onClick={()=>setSub(item.id)} style={{background:"#fff",borderRadius:16,border:"1.5px solid #f1f5f9",padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}><div style={{width:46,height:46,borderRadius:12,background:item.color+"15",display:"flex",alignItems:"center",justifyContent:"center",color:item.color,flexShrink:0}}><Icon name={item.icon} size={22}/></div><div><div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{item.label}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{item.desc}</div></div></button>))}
          </div>
        </div>
      ):(
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"12px 16px",borderBottom:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",gap:10,background:"#fff"}}>
            <button onClick={()=>setSub("home")} style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:6,cursor:"pointer",color:"#64748b",display:"flex"}}><Icon name="arrow-left" size={16}/></button>
            <span style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>{menu.find(i=>i.id===sub)?.label}</span>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>{renderSub()}</div>
        </div>
      )}
      <ChangePasswordModal open={showChangePw} onClose={()=>setShowChangePw(false)} session={session} showToast={showToast}/>
    </div>
  )
}

function MemberPortal({session,logout,showToast}){
  const[tab,setTab]=useState("dados")
  const[showChangePw,setShowChangePw]=useState(false)
  const[commentsModal,setCommentsModal]=useState(null)
  const{data:cells}=useTable("cells")
  const{data:members}=useTable("members")
  const{data:attendance}=useTable("attendance")
  const member=members.find(m=>m.id===session.member_id)
  const cell=member?cells.find(c=>c.id===member.cell_id):null
  const cellMembers=cell?members.filter(m=>m.cell_id===cell.id&&m.status==="Membro"):[]
  const leaders=cell?members.filter(m=>cell.leaders_ids?.includes(m.id)):[]
  const myAtt=attendance.filter(a=>a.member_id===session.member_id).sort((a,b)=>b.date.localeCompare(a.date))
  const pct=myAtt.length?Math.round(myAtt.filter(a=>a.status==="Presente").length/myAtt.length*100):0
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",padding:"24px 18px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Avatar name={member?.name||session?.name||"?"} photo={member?.photo_url} size={46} color="#7dd3fc"/>
            <div><div style={{color:"#f0f9ff",fontSize:16,fontWeight:800}}>{member?.name||session?.name}</div><div style={{color:"#7dd3fc",fontSize:12}}>{cell?.name||"Sem célula"}</div></div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setShowChangePw(true)} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,padding:8,cursor:"pointer",color:"#93c5fd",display:"flex"}}><Icon name="key" size={16}/></button>
            <button onClick={logout} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,padding:8,cursor:"pointer",color:"#93c5fd",display:"flex"}}><Icon name="log-out" size={16}/></button>
          </div>
        </div>
        <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.08)",borderRadius:12,padding:3}}>
          {[["dados","Meus Dados"],["celula","Minha Célula"],["presenca","Presença"]].map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px 4px",borderRadius:10,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",background:tab===id?"#fff":"transparent",color:tab===id?"#1e40af":"#93c5fd",transition:"all 0.15s"}}>{label}</button>))}
        </div>
      </div>
      <div style={{flex:1,padding:"16px 16px 80px",overflowY:"auto"}}>
        {tab==="dados"&&member&&(
          <div>
            <Card style={{marginBottom:12}}>
              <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Informações Pessoais</h3>
              {[["Telefone",member.phone],["E-mail",member.email],["Bairro",member.neighborhood],["Status",member.status],["Batizado",member.baptized?`✓ Sim${member.baptism_date?` (${fmtDate(member.baptism_date)})`:""}`:member.baptized===false?"✗ Não":"—"],["Nascimento",fmtDate(member.birth_date)],["Idade",member.age?`${member.age} anos`:null]].map(([k,v])=>v?(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}><span style={{color:"#94a3b8",fontWeight:600}}>{k}</span><span style={{color:"#334155",fontWeight:700,textAlign:"right",maxWidth:"60%"}}>{v}</span></div>):null)}
            </Card>
            {(member.father_name||member.mother_name||member.spouse_name)&&(
              <Card>
                <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Família</h3>
                {member.father_name&&<div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}><span style={{color:"#94a3b8",fontWeight:600}}>Pai</span><span style={{color:"#334155",fontWeight:700}}>{member.father_name}</span></div>}
                {member.mother_name&&<div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}><span style={{color:"#94a3b8",fontWeight:600}}>Mãe</span><span style={{color:"#334155",fontWeight:700}}>{member.mother_name}</span></div>}
                {member.spouse_name&&<div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",fontSize:13}}><span style={{color:"#94a3b8",fontWeight:600}}>Cônjuge</span><span style={{color:"#334155",fontWeight:700}}>{member.spouse_name}</span></div>}
              </Card>
            )}
          </div>
        )}
        {tab==="celula"&&(
          <div>
            {cell?(<>
              <Card style={{marginBottom:12}}>
                <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Minha Célula</h3>
                {[["Nome",cell.name],["Dia",cell.day],["Horário",cell.time],["Periodicidade",cell.frequency],["Próximo encontro",fmtDate(cell.next_meeting_date)],["Bairro",cell.neighborhood],["Endereço",cell.street?`${cell.street}, ${cell.number||"s/n"}`:"—"],["Líderes",leaders.length>0?leaders.map(l=>l.name.split(" ")[0]).join(", "):"—"],["Membros",cellMembers.length.toString()],["Início",fmtDate(cell.started_at)]].map(([k,v])=>v&&v!=="—"?(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}><span style={{color:"#94a3b8",fontWeight:600}}>{k}</span><span style={{color:"#334155",fontWeight:700,textAlign:"right"}}>{v}</span></div>):null)}
              </Card>
              {cell.growth_goal>0&&(<Card><h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>🎯 Meta de Crescimento</h3><ProgressBar value={cellMembers.length} max={cell.growth_goal} color="#2563eb"/><p style={{fontSize:12,color:"#64748b",marginTop:8,textAlign:"center"}}>A célula quer chegar em {cell.growth_goal} membros!</p></Card>)}
            </>):(<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0}}>Você não está em nenhuma célula</p></Card>)}
          </div>
        )}
        {tab==="presenca"&&(
          <div>
            {myAtt.length>0&&(<Card style={{marginBottom:12,background:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"1.5px solid #bfdbfe"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,fontWeight:700,color:"#1e40af"}}>Minha Frequência</span><span style={{fontSize:18,fontWeight:900,color:pct>=75?"#059669":pct>=50?"#d97706":"#dc2626"}}>{pct}%</span></div><div style={{height:8,background:"rgba(255,255,255,0.5)",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct>=75?"#059669":pct>=50?"#d97706":"#dc2626",borderRadius:4}}/></div><div style={{fontSize:12,color:"#3b82f6",marginTop:6}}>{myAtt.filter(a=>a.status==="Presente").length} presenças de {myAtt.length} encontros</div></Card>)}
            {myAtt.length===0&&<Card><p style={{color:"#94a3b8",textAlign:"center",margin:0,fontSize:13}}>Nenhum encontro registrado</p></Card>}
            {myAtt.map(a=>{
              const sc=a.status==="Presente"?"#059669":a.status==="Ausente"?"#dc2626":"#d97706"
              const si=a.status==="Presente"?"✓":a.status==="Ausente"?"✗":"?"
              return(<Card key={a.id} style={{marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:34,height:34,borderRadius:10,background:sc+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:sc,flexShrink:0}}>{si}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{fmtDate(a.date)}</div>{a.theme&&<div style={{fontSize:11,color:"#64748b"}}>📖 {a.theme}</div>}{a.preacher&&<div style={{fontSize:11,color:"#64748b"}}>🎤 {a.preacher}</div>}</div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}><Badge label={a.status} color={sc}/>{a.status==="Presente"&&(<button onClick={()=>setCommentsModal({date:a.date,cellId:a.cell_id})} style={{background:"#f0fdf4",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",color:"#059669",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:3}}><Icon name="comment" size={11}/>Comentar</button>)}</div></div></Card>)
            })}
          </div>
        )}
      </div>
      {commentsModal&&<CommentsModal date={commentsModal.date} cellId={commentsModal.cellId} session={session} showToast={showToast} onClose={()=>setCommentsModal(null)}/>}
      <ChangePasswordModal open={showChangePw} onClose={()=>setShowChangePw(false)} session={session} showToast={showToast}/>
    </div>
  )
}
