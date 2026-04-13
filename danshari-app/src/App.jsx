import { useState, useRef, useEffect } from "react";

const MONTHS_CN = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
const WEEKDAYS = ["日","一","二","三","四","五","六"];
const DISPOSE_METHODS = ["二手平台出售","捐赠","回收","扔掉","送给朋友","其他"];

const C = {
  bg: "#E9F3FD",           // light blue-grey page background
  card: "#FFFFFF",         // pure white floating cards
  primary: "#434951",      // primary button color
  primaryLight: "#D6E8F5", // very light blue tint
  accent: "#6AACDB",
  text: "#1A2535",         // near-black
  textMid: "#6B7C93",
  textLight: "#9DAFC4",
  border: "rgba(255,255,255,0.0)", // borderless — shadow only
  danger: "#D96B6B",
  green: "#5BBF8A",
};

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }
function makeDateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function uid() { return Math.random().toString(36).slice(2, 10); }

async function recognizeAndGenerateSticker(imageBase64) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
          { type: "text", text: `Identify the main object. Reply ONLY with JSON, no markdown:\n{"name":"Chinese 2-4 chars","emoji":"1 emoji","color":"#hex","bg":"#lighthex"}` }
        ]
      }]
    })
  });
  const data = await response.json();
  const text = data.content.map(i => i.text || "").join("");
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return { name: "物品", emoji: "📦", color: "#434951", bg: "#EBEBEC" }; }
}

// card style helper
const card = (extra = {}) => ({
  background: C.card,
  borderRadius: 40,
  boxShadow: "0 2px 16px rgba(74,130,196,0.10), 0 1px 4px rgba(0,0,0,0.06)",
  ...extra,
});

function BackBar({ onBack, title, subtitle, right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"16px 20px", gap:12 }}>
      <button onClick={onBack} style={{ width:36, height:36, borderRadius:100, background:C.card, border:"none", cursor:"pointer", color:C.textMid, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 1px 6px rgba(0,0,0,0.08)" }}>←</button>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:C.textLight, marginTop:1 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

// TOP-LEVEL — must not be inside App
function FormPanel({ img, sticker, recognizing, form, setForm, onSave, saveLabel, extraTop }) {
  return (
    <div style={{ padding:"0 16px 40px" }}>
      {extraTop}

      {/* Photo card */}
      <div style={{ ...card(), overflow:"hidden", marginBottom:16, position:"relative" }}>
        {img
          ? <img src={img} alt="" style={{ width:"100%", height:210, objectFit:"cover", display:"block" }} />
          : <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center", fontSize:52, background:C.primaryLight }}>📦</div>
        }
        <div style={{ position:"absolute", bottom:12, right:12 }}>
          {recognizing
            ? <div className="shimmer" style={{ width:52, height:52, borderRadius:14 }} />
            : <div className="pop" style={{ width:52, height:52, borderRadius:14, background:sticker?.bg||C.primaryLight, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontSize:22, border:`2px solid ${sticker?.color||C.primary}`, boxShadow:"0 2px 10px rgba(0,0,0,0.18)" }}>
                {sticker?.emoji||"📦"}
                <div style={{ fontSize:7, color:C.primary, marginTop:1 }}>{sticker?.name}</div>
              </div>
          }
        </div>
        {recognizing && (
          <div style={{ position:"absolute", bottom:18, left:14, fontSize:11, color:"#fff", background:"rgba(26,37,53,0.45)", borderRadius:8, padding:"3px 9px" }}>
            <span className="spin">⟳</span> AI 识别中…
          </div>
        )}
      </div>

      {/* Form card */}
      <div style={{ ...card(), padding:"20px 18px", display:"flex", flexDirection:"column", gap:18 }}>
        <div>
          <div style={{ fontSize:10, color:C.textLight, letterSpacing:1.5, marginBottom:8, textTransform:"uppercase" }}>物品名称</div>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder={recognizing ? "识别完成后自动填入…" : "输入名称"}
            style={{ width:"100%", padding:"11px 13px", borderRadius:12, border:"1.5px solid #E4ECF4", background:"#F6F9FC", fontSize:15, color:C.text, fontFamily:"inherit", outline:"none" }}
          />
        </div>

        <div>
          <div style={{ fontSize:10, color:C.textLight, letterSpacing:1.5, marginBottom:8, textTransform:"uppercase" }}>丢弃途径</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {DISPOSE_METHODS.map(m => (
              <button key={m} className="press" onClick={() => setForm(f => ({ ...f, method: m }))} style={{
                padding:"8px 13px", borderRadius:100, fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600, transition:"all 0.15s",
                background: form.method===m ? C.primary : "#F0F5FA",
                color: form.method===m ? "#fff" : C.textMid,
                border: "none",
                boxShadow: form.method===m ? "0 2px 8px rgba(74,144,196,0.3)" : "none",
              }}>{m}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:10, color:C.textLight, letterSpacing:1.5, marginBottom:8, textTransform:"uppercase" }}>所得收入 (¥)</div>
          <input
            type="number"
            value={form.income}
            onChange={e => setForm(f => ({ ...f, income: e.target.value }))}
            placeholder="0"
            style={{ width:"100%", padding:"11px 13px", borderRadius:12, border:"1.5px solid #E4ECF4", background:"#F6F9FC", fontSize:15, color:C.text, fontFamily:"inherit", outline:"none" }}
          />
        </div>

        <button className="press" onClick={onSave} style={{
          background: C.primary, color:"#fff", border:"none", borderRadius:100, padding:"14px",
          fontSize:15, fontWeight:700, cursor:"pointer", opacity: recognizing ? 0.65 : 1,
          boxShadow:"0 4px 14px rgba(74,144,196,0.35)"
        }}>
          {recognizing ? "识别中，可先保存…" : saveLabel}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('danshari_items');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem('danshari_items', JSON.stringify(items)); }
    catch {}
  }, [items]);
  const [view, setView] = useState("calendar");
  const [selDate, setSelDate] = useState(null);
  const [selItem, setSelItem] = useState(null);
  const [addStep, setAddStep] = useState("photo");
  const [img, setImg] = useState(null);
  const [sticker, setSticker] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [form, setForm] = useState({ name:"", method:DISPOSE_METHODS[0], income:"" });

  const cameraRef = useRef();
  const galleryRef = useRef();

  function getDateItems(key) { return items[key] || []; }
  function prevMonth() { if (month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }
  function nextMonth() { if (month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }

  function handleDayClick(day) {
    const key = makeDateKey(year, month, day);
    const sd = { year, month, day, key };
    setSelDate(sd);
    if ((items[key]||[]).length === 0) openAdd(sd);
    else setView("dayList");
  }

  function openAdd(sd) {
    setImg(null); setSticker(null); setRecognizing(false);
    setForm({ name:"", method:DISPOSE_METHODS[0], income:"" });
    setAddStep("photo");
    if (sd) setSelDate(sd);
    setView("add");
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const preview = ev.target.result;
      setImg(preview); setSticker(null); setRecognizing(true); setAddStep("details");
      try {
        const s = await recognizeAndGenerateSticker(preview.split(",")[1]);
        setSticker(s); setForm(f => ({ ...f, name: s.name }));
      } catch {
        setSticker({ name:"物品", emoji:"📦", color:C.primary, bg:C.primaryLight });
      } finally { setRecognizing(false); }
    };
    reader.readAsDataURL(file);
  }

  function saveNew() {
    const newItem = { id:uid(), ...(sticker||{emoji:"📦",color:C.primary,bg:C.primaryLight}), name:form.name||sticker?.name||"物品", method:form.method, income:parseFloat(form.income)||0, image:img, date:selDate.key };
    setItems(prev => ({ ...prev, [selDate.key]: [...(prev[selDate.key]||[]), newItem] }));
    setView("dayList");
  }

  function openEdit(item) {
    setSelItem(item); setImg(item.image||null);
    setSticker({ emoji:item.emoji, color:item.color, bg:item.bg, name:item.name });
    setForm({ name:item.name, method:item.method, income:item.income>0?String(item.income):"" });
    setAddStep("details"); setRecognizing(false); setView("edit");
  }

  function saveEdit() {
    const updated = { ...selItem, ...(sticker||{}), name:form.name||selItem.name, method:form.method, income:parseFloat(form.income)||0, image:img };
    setItems(prev => ({ ...prev, [selDate.key]:(prev[selDate.key]||[]).map(it=>it.id===selItem.id?updated:it) }));
    setSelItem(updated); setView("detail");
  }

  function deleteItem(item) {
    setItems(prev => {
      const filtered = (prev[item.date]||[]).filter(it=>it.id!==item.id);
      const next = { ...prev };
      if (filtered.length===0) delete next[item.date]; else next[item.date]=filtered;
      return next;
    });
    setView("dayList");
  }

  const allItems = Object.values(items).flat();
  const totalIncome = allItems.reduce((s,i)=>s+(i.income||0),0);
  const monthPrefix = `${year}-${String(month+1).padStart(2,"0")}`;
  const monthItems = allItems.filter(i=>i.date.startsWith(monthPrefix));

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"HuiWen,'Songti SC',Georgia,serif", color:C.text }}>
      <style>{`
        @font-face {
          font-family: 'HuiWen';
          src: url('/汇文明朝体.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        *{box-sizing:border-box;margin:0;padding:0;} html,body{overscroll-behavior:none;overscroll-behavior-y:none;background:#E9F3FD;}
        
        .fade{animation:fadeUp 0.25s ease;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .pop{animation:pop 0.35s cubic-bezier(.34,1.56,.64,1);}
        @keyframes pop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
        .press{transition:transform 0.12s,opacity 0.12s;cursor:pointer;}
        .press:active{transform:scale(0.94);opacity:0.8;}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .shimmer{background:linear-gradient(90deg,#D6E8F5 25%,#EAF3FA 50%,#D6E8F5 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
        @keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite;display:inline-block;}
        input:focus{border-color:#434951 !important;background:#fff !important;}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ padding:"20px 20px 24px", background:C.bg }}>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:11, color:C.textLight, letterSpacing:2, textTransform:"uppercase", marginBottom:3 }}>当断则断   该扔就扔</div>
            <div style={{ fontSize:26, fontWeight:800, color:C.text, letterSpacing:-0.5 }}>每日一轻</div>
          </div>
          <button className="press" onClick={()=>setView(view==="summary"?"calendar":"summary")} style={{
            ...card(), border:"none", padding:"8px 16px", fontSize:12, fontWeight:700,
            color: view==="summary" ? C.primary : C.textMid, cursor:"pointer"
          }}>{view==="summary"?"← 日历":"总结"}</button>
        </div>
      </div>

      {/* ── CALENDAR ── */}
      {view==="calendar" && (
        <div className="fade" style={{ paddingBottom:80 }}>

          {/* Calendar card — full width, month nav inside */}
          <div style={{ background:C.card, boxShadow:"0 2px 16px rgba(74,130,196,0.10)", borderRadius:40, padding:"16px 16px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <button onClick={prevMonth} className="press" style={{ width:34, height:34, border:"none", fontSize:18, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:100, background:"#F0F5FA", cursor:"pointer" }}>‹</button>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:800, color:C.text }}>{MONTHS_CN[month]}</div>
                <div style={{ fontSize:11, color:C.textLight, letterSpacing:2 }}>{year}</div>
              </div>
              <button onClick={nextMonth} className="press" style={{ width:34, height:34, border:"none", fontSize:18, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:100, background:"#F0F5FA", cursor:"pointer" }}>›</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:8 }}>
              {WEEKDAYS.map(d=>(
                <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:C.textLight, letterSpacing:0.8, textTransform:"uppercase" }}>{d}</div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5 }}>
              {Array(getFirstDayOfMonth(year,month)).fill(null).map((_,i)=><div key={`e${i}`}/>)}
              {Array(getDaysInMonth(year,month)).fill(null).map((_,i)=>{
                const day=i+1;
                const key=makeDateKey(year,month,day);
                const dayItems=getDateItems(key);
                const first=dayItems[0];
                const count=dayItems.length;
                const isToday=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===day;
                const isFuture=new Date(year,month,day)>today;
                return (
                  <div key={day} className="press" onClick={()=>!isFuture&&handleDayClick(day)} style={{
                    aspectRatio:"1", borderRadius:12, overflow:"hidden", position:"relative",
                    opacity:isFuture?0.2:1, cursor:isFuture?"default":"pointer",
                    background: first?.image ? "transparent" : count>0 ? C.primaryLight : "transparent",
                    borderRadius: 12,
                    outline: "none",
                  }}>
                    {first?.image && <img src={first.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />}
                    {count>0 && !first?.image && <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{first.emoji}</div>}
                    {count===0 && <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {!isToday && <span style={{ fontSize:12, color:C.textMid }}>{day}</span>}
                    </div>}
                    {count>1 && <div style={{ position:"absolute", top:2, right:2, background:"rgba(26,37,53,0.6)", color:"#fff", fontSize:7, borderRadius:5, padding:"1px 3px", fontWeight:700 }}>{count}</div>}
                    {isToday && (
                      <>
                        <svg viewBox="0 0 90 94" style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
                          <path d="M39.7535 2.60938C42.661 -0.203365 47.2756 -0.203364 50.1832 2.60938L54.1705 6.4668C56.0548 8.2897 58.6751 9.14157 61.2711 8.77441L66.7642 7.99707C70.7698 7.43051 74.5037 10.1434 75.2027 14.1279L76.1607 19.5928C76.6138 22.1749 78.2335 24.4031 80.5494 25.6318L85.4507 28.2324C89.024 30.1285 90.4497 34.5171 88.6734 38.1514L86.2369 43.1357C85.0855 45.4912 85.0855 48.2471 86.2369 50.6025L88.6734 55.5869C90.4497 59.2212 89.024 63.6098 85.4507 65.5059L80.5494 68.1064C78.2335 69.3352 76.6138 71.5633 76.1607 74.1455L75.2027 79.6104C74.5037 83.5949 70.7698 86.3078 66.7642 85.7412L61.2711 84.9639C58.6751 84.5967 56.0548 85.4486 54.1705 87.2715L50.1832 91.1289C47.2756 93.9416 42.661 93.9416 39.7535 91.1289L35.7662 87.2715C33.8818 85.4486 31.2615 84.5967 28.6656 84.9639L23.1724 85.7412C19.1669 86.3078 15.4329 83.5949 14.7339 79.6104L13.7759 74.1455C13.3229 71.5633 11.7031 69.3352 9.38727 68.1064L4.4859 65.5059C0.912633 63.6098 -0.513071 59.2212 1.26324 55.5869L3.69977 50.6025C4.85117 48.2471 4.85117 45.4912 3.69977 43.1357L1.26324 38.1514C-0.513072 34.5171 0.912634 30.1285 4.4859 28.2324L9.38727 25.6318C11.7031 24.4031 13.3229 22.1749 13.7759 19.5928L14.7339 14.1279C15.4329 10.1434 19.1669 7.43051 23.1724 7.99707L28.6656 8.77441C31.2615 9.14157 33.8818 8.2897 35.7662 6.4668L39.7535 2.60938Z" fill="#EEF4FB" stroke="#434951"/>
                        </svg>
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
                          <span style={{ fontSize:12, color:"#434951", fontWeight:800 }}>{day}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats card — full width, 2px gap below calendar */}
          <div style={{ background:C.card, boxShadow:"0 2px 16px rgba(74,130,196,0.08)", marginTop:2, borderRadius:40, padding:"16px 20px", display:"flex", justifyContent:"space-around", alignItems:"center" }}>
            {[
              { val:monthItems.length, label:"本月已弃" },
              { val:`¥${monthItems.reduce((s,i)=>s+(i.income||0),0).toFixed(0)}`, label:"本月收入" },
              { val:allItems.length, label:"累计已弃" },
            ].map((s,i,arr)=>(
              <div key={i} style={{ display:"flex", flex:1 }}>
                <div style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:C.text }}>{s.val}</div>
                  <div style={{ fontSize:10, color:C.textLight, marginTop:2, letterSpacing:0.3 }}>{s.label}</div>
                </div>
                {i < arr.length-1 && <div style={{ width:1, background:"#EEF2F7", alignSelf:"stretch" }} />}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ padding:"14px 16px 0" }}>
            <button className="press" onClick={()=>handleDayClick(today.getDate())} style={{
              width:"100%", padding:"15px",
              background:"#434951", color:"#fff", border:"none", borderRadius:100,
              fontSize:15, fontWeight:700, letterSpacing:0.5,
              boxShadow:"0 6px 20px rgba(67,73,81,0.3)"
            }}>+ 记录今日断舍离</button>

          </div>
        </div>
      )}

      {/* ── DAY LIST ── */}
      {view==="dayList" && selDate && (
        <div className="fade" style={{ paddingBottom:60 }}>
          <BackBar
            onBack={()=>setView("calendar")}
            title={`${selDate.year}年${selDate.month+1}月${selDate.day}日`}
            subtitle={`${getDateItems(selDate.key).length} 件已丢弃`}
            right={
              <button className="press" onClick={()=>openAdd(selDate)} style={{ ...card(), border:"none", padding:"8px 16px", fontSize:13, fontWeight:700, color:C.primary, cursor:"pointer" }}>+ 新增</button>
            }
          />
          <div style={{ padding:"4px 16px", display:"flex", flexDirection:"column", gap:10 }}>
            {getDateItems(selDate.key).length===0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:C.textLight }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🌤️</div>
                <div style={{ fontSize:14, marginBottom:16 }}>今天还没有记录</div>
                <button className="press" onClick={()=>openAdd(selDate)} style={{ background:C.primary, color:"#fff", border:"none", borderRadius:100, padding:"10px 28px", fontSize:14, fontWeight:700, boxShadow:"0 4px 14px rgba(74,144,196,0.35)" }}>立即记录</button>
              </div>
            ) : getDateItems(selDate.key).map(item=>(
              <div key={item.id} className="press" onClick={()=>{setSelItem(item);setView("detail");}} style={{ ...card(), display:"flex", alignItems:"center", overflow:"hidden" }}>
                <div style={{ width:70, height:70, flexShrink:0, background:item.bg||C.primaryLight, overflow:"hidden" }}>
                  {item.image ? <img src={item.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>{item.emoji}</div>}
                </div>
                <div style={{ flex:1, padding:"0 14px", minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{item.name}</div>
                  <div style={{ fontSize:11, color:C.textLight, marginTop:3 }}>{item.method}</div>
                </div>
                {item.income>0 && <div style={{ fontSize:14, fontWeight:800, color:C.primary, paddingRight:8 }}>+¥{item.income}</div>}
                <div style={{ color:C.textLight, fontSize:16, paddingRight:14 }}>›</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DETAIL ── */}
      {view==="detail" && selItem && (
        <div className="fade" style={{ paddingBottom:60 }}>
          <BackBar
            onBack={()=>setView("dayList")}
            title="物品详情"
            right={<button className="press" onClick={()=>openEdit(selItem)} style={{ ...card(), border:"none", padding:"8px 16px", fontSize:13, fontWeight:700, color:C.textMid, cursor:"pointer" }}>编辑</button>}
          />

          {/* Hero */}
          <div style={{ margin:"0 16px 16px", ...card(), overflow:"hidden" }}>
            <div style={{ width:"100%", height:240, background:C.primaryLight, position:"relative" }}>
              {selItem.image
                ? <img src={selItem.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <div style={{ fontSize:60 }}>{selItem.emoji}</div>
                    <div style={{ fontSize:12, color:C.textLight }}>暂无照片</div>
                  </div>
              }
              <div style={{ position:"absolute", bottom:14, right:14, width:56, height:56, borderRadius:14, background:selItem.bg||"rgba(255,255,255,0.95)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontSize:24, border:`2px solid ${selItem.color||C.primary}`, boxShadow:"0 2px 10px rgba(0,0,0,0.15)" }}>
                {selItem.emoji}
                <div style={{ fontSize:7, color:C.primary, marginTop:1 }}>{selItem.name}</div>
              </div>
            </div>

            <div style={{ padding:"18px 18px 20px" }}>
              <div style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:2 }}>{selItem.name}</div>
              <div style={{ fontSize:11, color:C.textLight, marginBottom:18 }}>AI 生成贴纸</div>

              {[
                { label:"丢弃日期", value:selItem.date },
                { label:"丢弃途径", value:selItem.method },
                { label:"所得收入", value:selItem.income>0?`¥ ${selItem.income.toFixed(2)}`:"无" },
              ].map(row=>(
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid #F0F4F8" }}>
                  <div style={{ fontSize:13, color:C.textMid }}>{row.label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:row.label==="所得收入"&&selItem.income>0?C.primary:C.text }}>{row.value}</div>
                </div>
              ))}

              <button className="press" onClick={()=>deleteItem(selItem)} style={{ width:"100%", marginTop:22, padding:"13px", background:"#FFF0F0", color:C.danger, border:"none", borderRadius:100, fontSize:15, fontWeight:700 }}>
                删除此记录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ── */}
      {view==="add" && (
        <div className="fade" style={{ paddingBottom:40 }}>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:"none" }} />
          <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
          <BackBar onBack={()=>setView("calendar")} title={`${selDate?.year}年${selDate?.month+1}月${selDate?.day}日`} subtitle="记录今日所弃之物" />

          {addStep==="photo" && (
            <div style={{ padding:"8px 16px 24px" }}>
              <div style={{ ...card(), padding:"52px 20px", textAlign:"center", marginBottom:16 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📷</div>
                <div style={{ fontSize:15, color:C.textMid, marginBottom:4 }}>拍下你要丢弃的物品</div>
                <div style={{ fontSize:11, color:C.textLight }}>AI 将自动识别并生成贴纸</div>
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <button className="press" onClick={()=>cameraRef.current.click()} style={{ flex:1, padding:"14px 0", borderRadius:100, background:C.primary, color:"#fff", border:"none", fontSize:15, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(74,144,196,0.35)" }}>📷 拍照</button>
                <button className="press" onClick={()=>galleryRef.current.click()} style={{ flex:1, padding:"14px 0", borderRadius:100, background:C.card, color:C.primary, border:"none", fontSize:15, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 2px 10px rgba(0,0,0,0.08)" }}>🖼️ 相册</button>
              </div>
            </div>
          )}

          {addStep==="details" && <FormPanel img={img} sticker={sticker} recognizing={recognizing} form={form} setForm={setForm} onSave={saveNew} saveLabel="完成记录 ✓" />}
        </div>
      )}

      {/* ── EDIT ── */}
      {view==="edit" && selItem && (
        <div className="fade" style={{ paddingBottom:40 }}>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:"none" }} />
          <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
          <BackBar onBack={()=>setView("detail")} title="编辑记录" />
          <FormPanel img={img} sticker={sticker} recognizing={recognizing} form={form} setForm={setForm} onSave={saveEdit} saveLabel="保存修改 ✓"
            extraTop={
              <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                <button className="press" onClick={()=>cameraRef.current.click()} style={{ flex:1, padding:"10px", borderRadius:100, background:C.card, color:C.primary, border:"none", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:"0 1px 6px rgba(0,0,0,0.08)" }}>📷 重新拍照</button>
                <button className="press" onClick={()=>galleryRef.current.click()} style={{ flex:1, padding:"10px", borderRadius:100, background:C.card, color:C.primary, border:"none", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:"0 1px 6px rgba(0,0,0,0.08)" }}>🖼️ 换图</button>
              </div>
            }
          />
        </div>
      )}

      {/* ── SUMMARY ── */}
      {view==="summary" && (
        <div className="fade" style={{ padding:"16px 16px 60px" }}>
          {/* Hero card */}
          <div style={{ background:"#434951", borderRadius:24, padding:"28px 24px", color:"#fff", marginBottom:14 }}>
            <div style={{ fontSize:10, letterSpacing:2.5, opacity:0.75, marginBottom:16, textTransform:"uppercase" }}>断舍离成就</div>
            <div style={{ display:"flex", justifyContent:"space-around" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:46, fontWeight:800, lineHeight:1 }}>{allItems.length}</div>
                <div style={{ fontSize:11, opacity:0.8, marginTop:4 }}>累计丢弃</div>
              </div>
              <div style={{ width:1, background:"rgba(255,255,255,0.25)" }}/>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:46, fontWeight:800, lineHeight:1 }}>¥{totalIncome.toFixed(0)}</div>
                <div style={{ fontSize:11, opacity:0.8, marginTop:4 }}>累计收入</div>
              </div>
            </div>
          </div>

          {/* Sticker wall */}
          {allItems.length>0 && (
            <div style={{ ...card(), padding:"16px", marginBottom:14 }}>
              <div style={{ fontSize:10, color:C.textLight, letterSpacing:1.5, marginBottom:12, textTransform:"uppercase" }}>所有贴纸</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {allItems.map((item,i)=>(
                  item.image
                    ? <div key={i} style={{ width:50, height:50, borderRadius:12, overflow:"hidden", border:`2px solid ${item.color||C.primary}` }}><img src={item.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>
                    : <div key={i} style={{ width:50, height:50, borderRadius:12, background:item.bg||C.primaryLight, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`2px solid ${item.color||C.primary}`, fontSize:20 }}>
                        {item.emoji}
                        <div style={{ fontSize:7, color:C.primary, marginTop:1 }}>{item.name}</div>
                      </div>
                ))}
              </div>
            </div>
          )}

          {allItems.length===0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:C.textLight }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🌿</div>
              <div style={{ fontSize:14 }}>还没有记录</div>
              <div style={{ fontSize:11, marginTop:6 }}>从日历页面开始你的第一次断舍离</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:10, color:C.textLight, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" }}>记录明细</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[...allItems].reverse().map((item,i)=>{
                  const parts=item.date.split("-");
                  return (
                    <div key={i} className="press" onClick={()=>{ setSelDate({year:parseInt(parts[0]),month:parseInt(parts[1])-1,day:parseInt(parts[2]),key:item.date}); setSelItem(item); setView("detail"); }} style={{ ...card(), display:"flex", alignItems:"center", overflow:"hidden" }}>
                      <div style={{ width:58, height:58, flexShrink:0, background:item.bg||C.primaryLight, overflow:"hidden" }}>
                        {item.image ? <img src={item.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{item.emoji}</div>}
                      </div>
                      <div style={{ flex:1, padding:"0 12px", minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700 }}>{item.name}</div>
                        <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{item.date} · {item.method}</div>
                      </div>
                      {item.income>0 && <div style={{ fontSize:14, fontWeight:800, color:C.primary, paddingRight:10 }}>+¥{item.income}</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}