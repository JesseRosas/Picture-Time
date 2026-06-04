import { useState, useEffect, useRef } from "react";
import NavBar from "../components/NavBar";
import { uploadPhotos, createUser, getUsers, removeUser, changePassword } from "../lib/api";

const Section = ({ title, children }) => (
  <section className="card p-8">
    <h2 className="font-display text-2xl font-light text-stone-200 mb-6 flex items-center gap-3">
      <span className="w-6 h-px bg-gold-400 inline-block" /> {title}
    </h2>
    {children}
  </section>
);

export default function AdminPage() {
  const fileInputRef = useRef(null);

  // Upload
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadLog, setUploadLog] = useState([]);

  // Create user
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null);

  // Users list
  const [users, setUsers] = useState([]);

  // Password
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwResult, setPwResult] = useState(null);

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);

  // ── Upload ────────────────────────────────────────────────
  async function handleUpload() {
    if (!files.length) return;
    setUploading(true);
    setUploadLog([]);
    const fd = new FormData();
    files.forEach(f => fd.append("photos", f));
    if (caption) fd.append("caption", caption);
    try {
      const saved = await uploadPhotos(fd);
      setUploadLog([`✓ ${saved.length} photo${saved.length > 1 ? "s" : ""} uploaded`]);
      setFiles([]);
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadLog([`✗ ${err.message}`]);
    } finally {
      setUploading(false);
    }
  }

  // ── Create user ───────────────────────────────────────────
  async function handleCreateUser(e) {
    e.preventDefault();
    setCreating(true);
    setCreateResult(null);
    try {
      const newUser = await createUser(userForm);
      setUsers(prev => [...prev, newUser]);
      setCreateResult({ ok: true, name: newUser.name });
      setUserForm({ name: "", email: "", password: "" });
    } catch (err) {
      setCreateResult({ error: err.message });
    } finally {
      setCreating(false);
    }
  }

  // ── Remove user ───────────────────────────────────────────
  async function handleRemoveUser(id, name) {
    if (!window.confirm(`Remove ${name}? They will lose access immediately.`)) return;
    try {
      await removeUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  // ── Password change ───────────────────────────────────────
  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwResult(null);
    if (pwForm.next !== pwForm.confirm) {
      setPwResult({ error: "New passwords don't match" });
      return;
    }
    if (pwForm.next.length < 8) {
      setPwResult({ error: "New password must be at least 8 characters" });
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwResult({ ok: true });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwResult({ error: err.message });
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        <div>
          <h1 className="font-display text-5xl font-light text-stone-50 mb-1">Admin</h1>
          <p className="text-stone-500 text-sm">Manage photos, guests, and your account</p>
        </div>

        {/* ── Upload ── */}
        <Section title="Upload Photos">
          <div className="space-y-5">
            <div
              className="border-2 border-dashed border-stone-700 hover:border-stone-500 transition-colors p-8 text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => setFiles(Array.from(e.target.files))} />
              <svg className="w-8 h-8 mx-auto mb-3 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <p className="text-stone-500 text-sm">
                {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""} selected` : "Click to select photos"}
              </p>
            </div>
            <div>
              <label className="block text-xs text-stone-400 tracking-widest uppercase mb-2">Caption (optional)</label>
              <input type="text" value={caption} onChange={e => setCaption(e.target.value)} className="input-field" placeholder="Add a caption…" />
            </div>
            <button onClick={handleUpload} disabled={uploading || !files.length} className="btn-primary">
              {uploading ? "Uploading…" : `Upload ${files.length || ""} Photo${files.length !== 1 ? "s" : ""}`}
            </button>
            {uploadLog.map((msg, i) => (
              <p key={i} className={`text-sm ${msg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{msg}</p>
            ))}
          </div>
        </Section>

        {/* ── Add Guest ── */}
        <Section title="Add Guest">
          <form onSubmit={handleCreateUser} className="space-y-4 max-w-sm">
            <p className="text-stone-500 text-sm">
              Create an account for your guest. Share their email and password with them directly — they can change their password after logging in.
            </p>
            {[
              { key: "name", label: "Full Name", type: "text", placeholder: "Jane Smith" },
              { key: "email", label: "Email", type: "email", placeholder: "jane@example.com" },
              { key: "password", label: "Temporary Password", type: "text", placeholder: "Min. 8 characters" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-stone-400 tracking-widest uppercase mb-2">{label}</label>
                <input
                  type={type}
                  value={userForm[key]}
                  onChange={e => setUserForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input-field"
                  placeholder={placeholder}
                  minLength={key === "password" ? 8 : undefined}
                  required
                />
              </div>
            ))}

            {createResult?.ok && (
              <p className="text-green-400 text-sm">✓ Account created for {createResult.name}. Share their login details with them.</p>
            )}
            {createResult?.error && (
              <p className="text-red-400 text-sm">✗ {createResult.error}</p>
            )}

            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? "Creating…" : "Create Account"}
            </button>
          </form>
        </Section>

        {/* ── Users ── */}
        <Section title="Manage Users">
          {users.length === 0 ? (
            <p className="text-stone-600 text-sm">No users yet.</p>
          ) : (
            <div className="space-y-1">
              {users.map(u => (
                <div key={u._id} className="flex items-center justify-between py-3 border-b border-stone-800">
                  <div>
                    <p className="text-stone-200 text-sm flex items-center gap-2">
                      {u.name}
                      {u.isAdmin && (
                        <span className="text-xs border border-gold-400/40 text-gold-400 px-1.5 py-0.5">Admin</span>
                      )}
                    </p>
                    <p className="text-stone-500 text-xs mt-0.5">{u.email}</p>
                  </div>
                  {!u.isAdmin && (
                    <button
                      onClick={() => handleRemoveUser(u._id, u.name)}
                      className="text-xs text-stone-600 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Change Password ── */}
        <Section title="Change Password">
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
            {[
              { key: "current", label: "Current Password" },
              { key: "next", label: "New Password" },
              { key: "confirm", label: "Confirm New Password" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-stone-400 tracking-widest uppercase mb-2">{label}</label>
                <input
                  type="password"
                  value={pwForm[key]}
                  onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
            ))}
            {pwResult?.ok && <p className="text-green-400 text-sm">✓ Password changed successfully.</p>}
            {pwResult?.error && <p className="text-red-400 text-sm">✗ {pwResult.error}</p>}
            <button type="submit" disabled={pwLoading} className="btn-primary">
              {pwLoading ? "Saving…" : "Update Password"}
            </button>
          </form>
        </Section>
      </main>
    </div>
  );
}
