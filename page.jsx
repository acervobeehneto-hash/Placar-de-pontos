import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus, Trophy, Medal, Crown, Lock, Unlock, Settings, X, Check, RotateCcw, Users, Award, Eye, ShieldCheck } from "lucide-react";

const DATA_KEY = "placar-roxo:data";
const SETTINGS_KEY = "placar-roxo:settings";
const DEFAULT_PIN = "20091621";
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function App() {
  const [title, setTitle] = useState("Placar de Pontos");
  const [users, setUsers] = useState([]);
  const [step, setStep] = useState(1);
  const [loaded, setLoaded] = useState(false);

  const [pin, setPin] = useState(DEFAULT_PIN);
  const [unlocked, setUnlocked] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [settingsMsg, setSettingsMsg] = useState("");

  const [newName, setNewName] = useState("");
  const [newPoints, setNewPoints] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [flash, setFlash] = useState({ id: null, n: 0 });

  const nameRef = useRef(null);
  const hasStorage = typeof window !== "undefined" && window.storage;

  useEffect(() => {
    (async () => {
      if (hasStorage) {
        try { const s = await window.storage.get(SETTINGS_KEY, true); if (s && s.value) { const d = JSON.parse(s.value); if (d.pin) setPin(d.pin); } } catch (e) {}
        try {
          const r = await window.storage.get(DATA_KEY, true);
          if (r && r.value) {
            const d = JSON.parse(r.value);
            if (Array.isArray(d.users)) setUsers(d.users);
            if (typeof d.step === "number") setStep(d.step);
            if (typeof d.title === "string") setTitle(d.title);
          }
        } catch (e) {}
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !hasStorage) return;
    (async () => { try { await window.storage.set(DATA_KEY, JSON.stringify({ users, step, title }), true); } catch (e) {} })();
  }, [users, step, title, loaded]);

  const total = users.reduce((a, u) => a + u.points, 0);
  const ranked = [...users].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  const rankMap = {};
  ranked.forEach((u, i) => (rankMap[u.id] = i + 1));
  const leader = ranked[0] && ranked[0].points > 0 ? ranked[0] : null;

  function addUser() {
    const n = newName.trim(); if (!n) { if (nameRef.current) nameRef.current.focus(); return; }
    const p = parseInt(newPoints, 10);
    setUsers((u) => [...u, { id: newId(), name: n, points: isNaN(p) ? 0 : p }]);
    setNewName(""); setNewPoints(""); if (nameRef.current) nameRef.current.focus();
  }
  function change(id, d) { setUsers((us) => us.map((u) => u.id === id ? { ...u, points: u.points + d } : u)); setFlash((f) => ({ id, n: f.n + 1 })); }
  function startScore(u) { setEditingId(u.id); setEditingValue(String(u.points)); }
  function commitScore(id) { const v = parseInt(editingValue, 10); setUsers((us) => us.map((u) => u.id === id ? { ...u, points: isNaN(v) ? 0 : v } : u)); setEditingId(null); }
  function startRename(u) { setRenamingId(u.id); setRenameValue(u.name); }
  function commitRename(id) { const n = renameValue.trim(); setUsers((us) => us.map((u) => u.id === id ? { ...u, name: n || u.name } : u)); setRenamingId(null); }
  function remove(id) { setUsers((us) => us.filter((u) => u.id !== id)); setConfirmDelete(null); }
  function reset() { setUsers([]); setConfirmReset(false); }

  function tryLogin() {
    if (loginInput === pin) { setUnlocked(true); setShowLogin(false); setLoginInput(""); setLoginError(false); }
    else { setLoginError(true); setLoginInput(""); }
  }
  function saveNewPin() {
    if (!newPinInput) { setSettingsMsg("Digite uma senha."); return; }
    if (newPinInput !== newPinConfirm) { setSettingsMsg("As senhas não coincidem."); return; }
    (async () => {
      if (hasStorage) { try { await window.storage.set(SETTINGS_KEY, JSON.stringify({ pin: newPinInput }), true); } catch (e) {} }
      setPin(newPinInput); setNewPinInput(""); setNewPinConfirm(""); setSettingsMsg("Senha alterada!");
      setTimeout(() => { setShowSettings(false); setSettingsMsg(""); }, 1200);
    })();
  }

  const medal = (u) => { if (!(u.points > 0)) return ""; const r = rankMap[u.id]; return r === 1 ? "gold" : r === 2 ? "silver" : r === 3 ? "bronze" : ""; };

  if (!loaded) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#fff", fontFamily: "system-ui", background: "#150E2B" }}>Carregando…</div>;

  return (
    <div className="root">
      <style>{CSS}</style>
      <div className="wrap">

        <div className={"banner " + (unlocked ? "adm" : "view")}>
          {unlocked ? (
            <>
              <div className="banner-l"><ShieldCheck size={18} /> <span><strong>Modo ADM</strong> — você pode editar</span></div>
              <button className="banner-btn" onClick={() => setUnlocked(false)}><Lock size={15} /> Sair</button>
            </>
          ) : (
            <>
              <div className="banner-l"><Eye size={18} /> <span><strong>Somente leitura</strong> — entre como ADM para editar</span></div>
              <button className="banner-btn" onClick={() => { setShowLogin(true); setLoginError(false); setLoginInput(""); }}><Unlock size={15} /> Entrar como ADM</button>
            </>
          )}
        </div>

        <div className="head">
          <div className="eyebrow"><Trophy size={13} /> PLACAR</div>
          {editingTitle && unlocked ? (
            <input className="title-in" value={titleDraft} autoFocus maxLength={48} onFocus={(e) => e.target.select()}
              onChange={(e) => setTitleDraft(e.target.value)} onBlur={() => { setTitle(titleDraft.trim() || title); setEditingTitle(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") { setTitle(titleDraft.trim() || title); setEditingTitle(false); } if (e.key === "Escape") setEditingTitle(false); }} />
          ) : (
            <h1 className="title" onClick={() => { if (unlocked) { setTitleDraft(title); setEditingTitle(true); } }} style={{ cursor: unlocked ? "pointer" : "default" }}>{title}</h1>
          )}
        </div>

        <div className="stats">
          <div className="stat"><div className="stat-l"><Users size={12} /> Participantes</div><div className="stat-v">{users.length}</div></div>
          <div className="stat"><div className="stat-l"><Award size={12} /> Total de pontos</div><div className="stat-v">{total}</div></div>
          <div className="stat lead"><div className="stat-l"><Crown size={12} /> Líder</div><div className="stat-v name">{leader ? leader.name : "—"}</div></div>
        </div>

        {unlocked && (
          <div className="add">
            <input ref={nameRef} className="in name" placeholder="Nome do participante" value={newName} maxLength={40}
              onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addUser()} />
            <input className="in pts" type="number" placeholder="0" value={newPoints}
              onChange={(e) => setNewPoints(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addUser()} />
            <button className="btn-primary" onClick={addUser}><Plus size={18} /> Adicionar</button>
          </div>
        )}

        {ranked.length === 0 ? (
          <div className="empty"><Users size={36} /><h3>Nenhum participante ainda</h3><p>{unlocked ? "Adicione o primeiro participante acima." : "Entre como ADM para adicionar participantes."}</p></div>
        ) : (
          <div className="list">
            {ranked.map((u, i) => (
              <div key={u.id} className={"card " + medal(u)} style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}>
                <div className="card-top">
                  <div className={"rank " + medal(u)}>
                    {medal(u) === "gold" ? <Trophy size={18} /> : (medal(u) === "silver" || medal(u) === "bronze") ? <Medal size={18} /> : rankMap[u.id]}
                  </div>
                  {renamingId === u.id && unlocked ? (
                    <input className="name-in" value={renameValue} autoFocus maxLength={40} onFocus={(e) => e.target.select()}
                      onChange={(e) => setRenameValue(e.target.value)} onBlur={() => commitRename(u.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitRename(u.id); if (e.key === "Escape") setRenamingId(null); }} />
                  ) : (
                    <div className="pname" onClick={() => { if (unlocked) startRename(u); }} style={{ cursor: unlocked ? "pointer" : "default" }}><span>{u.name}</span></div>
                  )}
                  {!unlocked && <span className={"score " + medal(u)} style={{ cursor: "default" }}>{u.points}</span>}
                  {unlocked && (confirmDelete === u.id ? (
                    <span className="del-confirm">
                      <button className="mini yes" onClick={() => remove(u.id)}><Check size={15} /></button>
                      <button className="mini no" onClick={() => setConfirmDelete(null)}><X size={15} /></button>
                    </span>
                  ) : (
                    <button className="del" onClick={() => setConfirmDelete(u.id)}><X size={17} /></button>
                  ))}
                </div>
                {unlocked && (
                  <div className="card-bot">
                    <button className="step" onClick={() => change(u.id, -step)}><Minus size={20} /></button>
                    {editingId === u.id ? (
                      <input className="score-in" type="number" value={editingValue} autoFocus onFocus={(e) => e.target.select()}
                        onChange={(e) => setEditingValue(e.target.value)} onBlur={() => commitScore(u.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitScore(u.id); if (e.key === "Escape") setEditingId(null); }} />
                    ) : (
                      <span key={flash.id === u.id ? "f" + flash.n : "b"} className={"score " + medal(u)} style={{ animation: flash.id === u.id ? "pop .45s ease" : undefined, cursor: "pointer" }} onClick={() => startScore(u)}>{u.points}</span>
                    )}
                    <button className="step" onClick={() => change(u.id, step)}><Plus size={20} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {unlocked && (
          <div className="controls">
            <div className="cgroup">
              <span className="clabel">Incremento dos botões</span>
              {[1, 5, 10].map((s) => (<button key={s} className={"chip " + (step === s ? "on" : "")} onClick={() => setStep(s)}>+{s}</button>))}
            </div>
            <div className="cgroup">
              <button className="ctrl-btn" onClick={() => { setShowSettings(true); setSettingsMsg(""); setNewPinInput(""); setNewPinConfirm(""); }}><Settings size={15} /> Mudar senha</button>
              {confirmReset ? (
                <button className="ctrl-btn danger" onClick={reset} onBlur={() => setConfirmReset(false)} autoFocus><Check size={15} /> Confirmar</button>
              ) : (
                <button className="ctrl-btn danger" onClick={() => setConfirmReset(true)} disabled={users.length === 0}><RotateCcw size={15} /> Limpar tudo</button>
              )}
            </div>
          </div>
        )}

        <div className="share">
          <strong>🔗 Como funciona:</strong> envie o link desta página para quem quiser. Todos conseguem <strong>ver</strong> o placar ao vivo. Só quem tem a <strong>senha de ADM</strong> consegue adicionar e alterar pontos.
        </div>
      </div>

      {showLogin && (
        <div className="overlay" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon"><Lock size={38} /></div>
            <h2>Entrar como ADM</h2>
            <p className="modal-sub">Digite a senha para poder editar o placar</p>
            <input className={"modal-in " + (loginError ? "err" : "")} type="password" placeholder="Senha de ADM" value={loginInput} autoFocus
              onChange={(e) => { setLoginInput(e.target.value); setLoginError(false); }} onKeyDown={(e) => e.key === "Enter" && tryLogin()} />
            {loginError && <p className="err-msg">Senha incorreta. Tente novamente.</p>}
            <div className="modal-actions">
              <button className="btn-primary full" onClick={tryLogin}><Unlock size={17} /> Entrar</button>
              <button className="btn-ghost" onClick={() => setShowLogin(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon"><Settings size={38} /></div>
            <h2>Mudar senha de ADM</h2>
            <p className="modal-sub">A nova senha valerá para todos</p>
            <input className="modal-in" type="password" placeholder="Nova senha" value={newPinInput} onChange={(e) => setNewPinInput(e.target.value)} maxLength={30} />
            <input className="modal-in" type="password" placeholder="Confirmar nova senha" value={newPinConfirm} onChange={(e) => setNewPinConfirm(e.target.value)} maxLength={30} onKeyDown={(e) => e.key === "Enter" && saveNewPin()} />
            {settingsMsg && <p className={"set-msg " + (settingsMsg.includes("alterada") ? "ok" : "err")}>{settingsMsg}</p>}
            <div className="modal-actions">
              <button className="btn-primary full" onClick={saveNewPin}><Check size={17} /> Salvar</button>
              <button className="btn-ghost" onClick={() => setShowSettings(false)}>Cancelar</button>
            </div>
            <p className="warn">⚠️ Guarde a nova senha. Sem ela, ninguém consegue editar.</p>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

* { box-sizing: border-box; }

.root {
  --p:#8B5CF6; --p-br:#A78BFA; --p-lt:#C4B5FD; --p-dk:#6D28D9;
  --bg1:#1A1036; --bg2:#0F0A20; --surf:#241838; --surf2:#2E2046; --raised:#382A55;
  --bd:rgba(167,139,250,0.16); --bd-soft:rgba(255,255,255,0.07);
  --tx:#FFFFFF; --mut:#B9B2D0; --faint:#8A82A3;
  --gold:#FFD43B; --gold-bg:rgba(255,212,59,0.14); --gold-bd:rgba(255,212,59,0.5);
  --silver:#D6DBE3; --silver-bg:rgba(214,219,227,0.12); --silver-bd:rgba(214,219,227,0.45);
  --bronze:#D08B5B; --bronze-bg:rgba(208,139,91,0.14); --bronze-bd:rgba(208,139,91,0.5);
  --danger:#F0816A;
  min-height: 100vh; font-family: 'Outfit', system-ui, sans-serif; color: var(--tx);
  background: radial-gradient(1100px 500px at 50% -10%, rgba(139,92,246,0.18), transparent 60%), linear-gradient(180deg, var(--bg1), var(--bg2));
  padding: 20px 16px 56px; -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 680px; margin: 0 auto; }

.banner { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 14px; margin-bottom: 24px; font-size: 14px; flex-wrap: wrap; }
.banner.view { background: rgba(255,255,255,0.05); border: 1px solid var(--bd-soft); color: var(--mut); }
.banner.adm { background: linear-gradient(90deg, rgba(139,92,246,0.22), rgba(139,92,246,0.08)); border: 1px solid var(--bd); color: var(--tx); }
.banner-l { display: flex; align-items: center; gap: 9px; }
.banner.view .banner-l svg { color: var(--p-br); }
.banner.adm .banner-l svg { color: var(--p-lt); }
.banner-l strong { color: var(--tx); font-weight: 600; }
.banner-btn { display: flex; align-items: center; gap: 7px; background: var(--p); color: #fff; border: none; border-radius: 10px; padding: 9px 14px; font-family: 'Outfit'; font-weight: 600; font-size: 13px; cursor: pointer; transition: filter .15s, transform .08s; white-space: nowrap; }
.banner-btn:hover { filter: brightness(1.1); }
.banner-btn:active { transform: scale(.97); }
.banner.adm .banner-btn { background: rgba(255,255,255,0.13); }

.head { margin-bottom: 22px; }
.eyebrow { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--p-br); }
.title { font-family: 'Outfit'; font-weight: 800; font-size: clamp(32px, 9vw, 48px); line-height: 1.05; letter-spacing: -0.02em; margin: 10px 0 0; color: var(--tx); }
.title-in { font-family: 'Outfit'; font-weight: 800; font-size: clamp(32px, 9vw, 48px); line-height: 1.05; letter-spacing: -0.02em; margin: 10px 0 0; background: var(--bg2); border: 2px solid var(--p-dk); border-radius: 12px; color: var(--tx); padding: 4px 12px; outline: none; width: 100%; }

.stats { display: flex; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
.stat { flex: 1; min-width: 100px; background: var(--surf); border: 1px solid var(--bd-soft); border-radius: 14px; padding: 12px 14px; }
.stat-l { display: flex; align-items: center; gap: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mut); }
.stat-l svg { color: var(--p-br); }
.stat-v { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 24px; margin-top: 5px; color: var(--tx); }
.stat-v.name { font-family: 'Outfit'; font-weight: 700; font-size: 19px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat.lead .stat-v.name { color: var(--gold); }

.add { display: flex; gap: 10px; flex-wrap: wrap; background: var(--surf); border: 1px solid var(--bd); border-radius: 16px; padding: 12px; margin-bottom: 18px; }
.in { background: var(--bg2); border: 1px solid var(--bd-soft); border-radius: 11px; padding: 13px 14px; color: var(--tx); font-family: 'Outfit'; font-size: 16px; outline: none; transition: border-color .15s, box-shadow .15s; }
.in::placeholder { color: var(--faint); }
.in:focus { border-color: var(--p); box-shadow: 0 0 0 3px rgba(139,92,246,0.18); }
.in.name { flex: 1; min-width: 160px; }
.in.pts { width: 84px; text-align: center; font-family: 'JetBrains Mono'; }
.btn-primary { display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(180deg, var(--p-br), var(--p)); color: #fff; border: none; border-radius: 11px; padding: 13px 18px; font-family: 'Outfit'; font-weight: 700; font-size: 15px; cursor: pointer; transition: filter .15s, transform .08s; box-shadow: 0 6px 18px rgba(139,92,246,0.3); }
.btn-primary:hover { filter: brightness(1.08); }
.btn-primary:active { transform: scale(.98); }
.btn-primary.full { width: 100%; }

.empty { text-align: center; padding: 46px 20px; border: 1px dashed var(--bd-soft); border-radius: 16px; color: var(--mut); }
.empty svg { color: var(--faint); margin-bottom: 10px; }
.empty h3 { font-family: 'Outfit'; font-weight: 700; font-size: 19px; color: var(--tx); margin: 6px 0; }
.empty p { font-size: 14px; margin: 0; }

.list { display: flex; flex-direction: column; gap: 10px; }
.card { background: var(--surf); border: 1px solid var(--bd-soft); border-radius: 16px; padding: 13px 14px; animation: up .42s ease both; position: relative; overflow: hidden; transition: border-color .2s; }
.card.gold { border-color: var(--gold-bd); background: linear-gradient(180deg, var(--gold-bg), transparent), var(--surf); box-shadow: 0 8px 28px rgba(255,212,59,0.1); }
.card.silver { border-color: var(--silver-bd); background: linear-gradient(180deg, var(--silver-bg), transparent), var(--surf); }
.card.bronze { border-color: var(--bronze-bd); background: linear-gradient(180deg, var(--bronze-bg), transparent), var(--surf); }
.card.gold::before, .card.silver::before, .card.bronze::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
.card.gold::before { background: var(--gold); }
.card.silver::before { background: var(--silver); }
.card.bronze::before { background: var(--bronze); }

.card-top { display: flex; align-items: center; gap: 12px; }
.rank { width: 40px; height: 40px; flex: none; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--raised); color: var(--mut); font-family: 'JetBrains Mono'; font-weight: 700; font-size: 16px; }
.rank.gold { background: var(--gold-bg); color: var(--gold); }
.rank.silver { background: var(--silver-bg); color: var(--silver); }
.rank.bronze { background: var(--bronze-bg); color: var(--bronze); }
.pname { flex: 1; min-width: 0; font-size: 18px; font-weight: 600; color: var(--tx); }
.pname span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.name-in { flex: 1; min-width: 0; font-family: 'Outfit'; font-size: 18px; font-weight: 600; background: var(--bg2); border: 2px solid var(--p-dk); border-radius: 9px; color: var(--tx); padding: 6px 10px; outline: none; }

.score { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 30px; color: var(--tx); min-width: 50px; text-align: right; }
.score.gold { color: var(--gold); }
.score.silver { color: var(--silver); }
.score.bronze { color: var(--bronze); }

.del { flex: none; width: 34px; height: 34px; border-radius: 9px; background: transparent; border: none; color: var(--faint); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color .15s, background .15s; }
.del:hover { color: var(--danger); background: rgba(240,129,106,0.12); }
.del-confirm { display: flex; gap: 6px; }
.mini { width: 34px; height: 34px; border-radius: 9px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.mini.yes { background: rgba(240,129,106,0.2); color: var(--danger); }
.mini.no { background: var(--raised); color: var(--mut); }

.card-bot { display: flex; align-items: center; justify-content: center; gap: clamp(20px, 8vw, 48px); margin-top: 13px; padding-top: 13px; border-top: 1px solid var(--bd-soft); }
.step { width: 50px; height: 50px; flex: none; border-radius: 14px; border: 1px solid var(--bd-soft); background: var(--raised); color: var(--tx); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform .08s, background .15s; }
.step:hover { background: var(--surf2); }
.step:active { transform: scale(.9); }
.card-bot .score { font-size: 34px; min-width: 64px; text-align: center; }
.score-in { width: 120px; text-align: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 30px; background: var(--bg2); border: 2px solid var(--p-dk); border-radius: 12px; color: var(--tx); padding: 5px; outline: none; }

.controls { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--bd-soft); display: flex; flex-wrap: wrap; gap: 14px 16px; align-items: center; justify-content: space-between; }
.cgroup { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.clabel { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mut); }
.chip { background: var(--surf); border: 1px solid var(--bd-soft); color: var(--mut); border-radius: 9px; padding: 8px 13px; font-family: 'JetBrains Mono'; font-weight: 500; font-size: 14px; cursor: pointer; transition: all .15s; }
.chip:hover { color: var(--tx); border-color: var(--bd); }
.chip.on { background: rgba(139,92,246,0.18); border-color: var(--p); color: var(--p-lt); }
.ctrl-btn { display: flex; align-items: center; gap: 7px; background: var(--surf); border: 1px solid var(--bd-soft); color: var(--mut); border-radius: 9px; padding: 9px 13px; font-family: 'Outfit'; font-weight: 500; font-size: 13px; cursor: pointer; transition: all .15s; }
.ctrl-btn:hover { color: var(--tx); border-color: var(--bd); }
.ctrl-btn.danger:hover { color: var(--danger); border-color: rgba(240,129,106,0.4); }
.ctrl-btn:disabled { opacity: .4; cursor: not-allowed; }

.share { margin-top: 28px; padding: 15px 16px; background: rgba(139,92,246,0.1); border-left: 3px solid var(--p); border-radius: 10px; font-size: 13px; line-height: 1.55; color: var(--mut); }
.share strong { color: var(--tx); font-weight: 600; }

.overlay { position: fixed; inset: 0; background: rgba(8,4,18,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal { background: var(--surf2); border: 1px solid var(--bd); border-radius: 20px; padding: 28px 24px; max-width: 360px; width: 100%; text-align: center; animation: up .25s ease both; }
.modal-icon { display: inline-flex; align-items: center; justify-content: center; width: 70px; height: 70px; border-radius: 20px; background: rgba(139,92,246,0.16); color: var(--p-lt); margin-bottom: 16px; }
.modal h2 { font-family: 'Outfit'; font-weight: 700; font-size: 22px; color: var(--tx); margin: 0 0 6px; }
.modal-sub { font-size: 14px; color: var(--mut); margin: 0 0 20px; }
.modal-in { width: 100%; background: var(--bg2); border: 1px solid var(--bd-soft); border-radius: 11px; padding: 13px 14px; color: var(--tx); font-family: 'Outfit'; font-size: 16px; outline: none; margin-bottom: 12px; transition: border-color .15s, box-shadow .15s; }
.modal-in:focus { border-color: var(--p); box-shadow: 0 0 0 3px rgba(139,92,246,0.18); }
.modal-in.err { border-color: var(--danger); }
.err-msg { color: var(--danger); font-size: 13px; margin: 0 0 12px; text-align: left; }
.set-msg { font-size: 13px; margin: 0 0 12px; }
.set-msg.ok { color: #7DD3A0; }
.set-msg.err { color: var(--danger); }
.modal-actions { display: flex; flex-direction: column; gap: 9px; margin-top: 6px; }
.btn-ghost { background: transparent; border: 1px solid var(--bd-soft); color: var(--mut); border-radius: 11px; padding: 12px; font-family: 'Outfit'; font-weight: 600; font-size: 14px; cursor: pointer; transition: all .15s; }
.btn-ghost:hover { color: var(--tx); border-color: var(--bd); }
.warn { font-size: 12px; color: var(--faint); margin: 16px 0 0; line-height: 1.4; }

@keyframes up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes pop { 0% { transform: scale(1); } 30% { transform: scale(1.3); } 100% { transform: scale(1); } }

@media (max-width: 480px) {
  .root { padding: 16px 12px 48px; }
  .in.name { min-width: 100%; }
  .in.pts { flex: 1; width: auto; min-width: 0; }
}
`;
