import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyInviteToken, register } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [tokenStatus, setTokenStatus] = useState("checking"); // checking | valid | invalid
  const [prefillEmail, setPrefillEmail] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setTokenStatus("invalid"); return; }
    verifyInviteToken(token)
      .then(data => { setTokenStatus("valid"); setPrefillEmail(data.email); setForm(f => ({ ...f, email: data.email })); })
      .catch(() => setTokenStatus("invalid"));
  }, [token]); 



  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token: jwt, user } = await register({ ...form, token });
      signIn(jwt, user);
      navigate("/gallery");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (tokenStatus === "checking") {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border border-gold-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (tokenStatus === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-4xl mb-4 text-red-400">✕</div>
          <h1 className="font-display text-2xl text-stone-200 mb-2">Invalid Invite</h1>
          <p className="text-stone-500 text-sm">This link is invalid or has already been used. Contact your host.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="fixed inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(ellipse at 80% 50%, rgba(212,168,83,0.08) 0%, transparent 60%)" }} />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-block border border-gold-400/40 text-gold-400 text-xs tracking-widest uppercase px-4 py-1.5 mb-6">You're Invited</div>
          <h1 className="font-display text-3xl font-light text-stone-50 mb-2">Create Your Account</h1>
          <p className="text-stone-500 text-sm">Set up your access to the private gallery</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {["name", "email", "password"].map(field => (
            <div key={field}>
              <label className="block text-xs text-stone-400 tracking-widest uppercase mb-2">{field === "name" ? "Your Name" : field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="input-field"
                placeholder={field === "name" ? "Jane Smith" : field === "email" ? "you@example.com" : "Min. 8 characters"}
                minLength={field === "password" ? 8 : undefined}
                required
              />
            </div>
          ))}

          {error && <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 px-4 py-3">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Create Account & Enter Gallery"}
          </button>
        </form>
      </div>
    </div>
  );
}
