import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  Building2,
  ChevronRight,
  Coffee,
  Gift,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Search,
  Settings,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import "./styles.css";

const API = "http://localhost:8401/api";
const request = async (path, options = {}) => {
  const r = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.siplyBusinessToken || ""}`,
      ...options.headers,
    },
  });
  if (!r.ok) throw new Error((await r.json()).detail || "Something went wrong");
  return r.json();
};
const money = (n) => new Intl.NumberFormat("en-GB").format(n || 0);

function Login({ onLogin }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: e.target.email.value,
          password: e.target.password.value,
        }),
      });
      localStorage.siplyBusinessToken = data.token;
      onLogin(data.business);
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login">
      <section className="login-copy">
        <div className="brand">
          <img src="/siply-logo.png" alt="Siply" />
          <b>BUSINESS</b>
        </div>
        <p className="eyebrow">THE OPERATING SYSTEM FOR GREAT VENUES</p>
        <h1>
          Turn every pour into <em>better business.</em>
        </h1>
        <p>
          Claim your place on Siply, understand what guests love, and bring them
          back with offers worth returning for.
        </p>
        <div className="proof">
          <div>
            <strong>Know</strong>
            <span>what guests order</span>
          </div>
          <div>
            <strong>Grow</strong>
            <span>repeat visits</span>
          </div>
          <div>
            <strong>Own</strong>
            <span>your venue profile</span>
          </div>
        </div>
      </section>
      <section className="login-card">
        <div className="cup-logo">
          <img src="/siply-logo.png" alt="Siply" />
        </div>
        <span className="eyebrow">VENUE PARTNER ACCESS</span>
        <h2>Welcome back.</h2>
        <p>Sign in to manage your claimed locations.</p>
        <form onSubmit={submit}>
          <label>
            Business email
            <input
              name="email"
              defaultValue="owner@northstarcoffee.co.uk"
              type="email"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              defaultValue="SiplyBusiness!"
              type="password"
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button disabled={busy}>
            {busy ? "Signing in…" : "Enter Siply Business"}
            <ChevronRight size={18} />
          </button>
        </form>
        <small>
          <ShieldCheck size={14} /> Verified businesses only · Secure workspace
        </small>
      </section>
    </main>
  );
}

const nav = [
  ["overview", "Overview", LayoutDashboard],
  ["venues", "My venues", Store],
  ["claim", "Claim a venue", MapPin],
  ["customers", "Customers", Users],
  ["promotions", "Offers", Megaphone],
  ["settings", "Business settings", Settings],
];
function Shell({ business, onLogout }) {
  const [page, setPage] = useState("overview");
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <img src="/siply-logo.png" alt="Siply" />
          <b>BUSINESS</b>
        </div>
        <div className="business-chip">
          <div>N</div>
          <p>
            <strong>{business.name}</strong>
            <small>{business.plan} partner</small>
          </p>
        </div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              className={page === id ? "active" : ""}
              onClick={() => setPage(id)}
              key={id}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <button className="logout" onClick={onLogout}>
          <LogOut size={17} />
          Sign out
        </button>
      </aside>
      <main className="content">
        {page === "overview" ? (
          <Dashboard />
        ) : page === "claim" ? (
          <Claim />
        ) : page === "venues" ? (
          <Venues />
        ) : (
          <Coming page={page} />
        )}
      </main>
    </div>
  );
}

function Metric({ label, value, delta, Icon }) {
  return (
    <article className="metric">
      <div>
        <span>{label}</span>
        <Icon size={19} />
      </div>
      <strong>{value}</strong>
      <small className="up">
        <TrendingUp size={13} />
        {delta}
      </small>
    </article>
  );
}
function Dashboard() {
  const [data, setData] = useState(null),
    [period, setPeriod] = useState("30d");
  useEffect(() => {
    request("/dashboard?period=" + period).then(setData);
  }, [period]);
  if (!data) return <div className="loading">Pouring your insights…</div>;
  const s = data.summary;
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">BUSINESS OVERVIEW</span>
          <h1>Good morning, North Star.</h1>
          <p>
            Here’s how guests are finding, choosing and returning to your venue.
          </p>
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </header>
      <div className="venue-banner">
        <div className="venue-icon">
          <Coffee />
        </div>
        <div>
          <strong>North Star Coffee</strong>
          <span>
            <MapPin size={13} />
            44 Queen Street, Glasgow · Verified venue
          </span>
        </div>
        <button>
          View public listing <ChevronRight size={15} />
        </button>
      </div>
      <section className="metrics">
        <Metric
          label="Profile views"
          value={money(s.profileViews)}
          delta="18.4% vs previous"
          Icon={BarChart3}
        />
        <Metric
          label="Drink logs"
          value={money(s.drinkLogs)}
          delta="12.1% vs previous"
          Icon={Coffee}
        />
        <Metric
          label="Unique visitors"
          value={money(s.uniqueVisitors)}
          delta="9.8% vs previous"
          Icon={Users}
        />
        <Metric
          label="Average rating"
          value={s.averageRating + "/5"}
          delta="Top 8% locally"
          Icon={TrendingUp}
        />
      </section>
      <section className="grid">
        <article className="panel chart">
          <div className="panel-head">
            <div>
              <span>DISCOVERY & VISITS</span>
              <h2>Guest activity</h2>
            </div>
            <span className="legend">
              ● Views &nbsp; <i>●</i> Visits
            </span>
          </div>
          <div className="bars">
            {data.series.map((x, i) => (
              <div className="bar-group" key={x.label}>
                <div
                  className="bar views"
                  style={{ height: Math.max(25, x.views / 5) }}
                />
                <div
                  className="bar visits"
                  style={{ height: Math.max(14, x.visits * 1.5) }}
                />
                <span>{x.label}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel audience">
          <div className="panel-head">
            <div>
              <span>AUDIENCE</span>
              <h2>Who came back</h2>
            </div>
          </div>
          <div className="donut">
            <div>
              <strong>
                {Math.round(
                  (data.audience.returning /
                    (data.audience.new + data.audience.returning)) *
                    100,
                )}
                %
              </strong>
              <span>returning</span>
            </div>
          </div>
          <div className="audience-row">
            <span>New visitors</span>
            <strong>{data.audience.new}</strong>
          </div>
          <div className="audience-row">
            <span>Returning visitors</span>
            <strong>{data.audience.returning}</strong>
          </div>
          <div className="audience-row">
            <span>Siply followers</span>
            <strong>{data.audience.followers}</strong>
          </div>
        </article>
        <article className="panel popular">
          <div className="panel-head">
            <div>
              <span>MENU INTELLIGENCE</span>
              <h2>What guests love</h2>
            </div>
            <button>View drinks</button>
          </div>
          {data.popular.map((x, i) => (
            <div className="rank" key={x.name}>
              <b>0{i + 1}</b>
              <div>
                <strong>{x.name}</strong>
                <span>{x.logs} logs this period</span>
              </div>
              <em>{x.rating}</em>
            </div>
          ))}
        </article>
        <article className="panel busy">
          <div className="panel-head">
            <div>
              <span>STAFFING SIGNAL</span>
              <h2>Your busiest windows</h2>
            </div>
          </div>
          {data.busyHours.map((x) => (
            <div className="busy-row" key={x.day}>
              <div>
                <strong>{x.day}</strong>
                <span>{x.time}</span>
              </div>
              <div className="line">
                <i style={{ width: x.visits + "%" }} />
              </div>
              <b>{x.visits}</b>
            </div>
          ))}
          <div className="tip">
            <Gift size={18} />
            <p>
              <strong>Opportunity:</strong> Tuesday afternoons are quiet. Try a
              Siply-only offer to build traffic.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}

function Claim() {
  const [q, setQ] = useState(""),
    [items, setItems] = useState([]),
    [selected, setSelected] = useState(null),
    [sent, setSent] = useState(false);
  const search = () =>
    request("/venues/search?q=" + encodeURIComponent(q)).then(setItems);
  const submit = async (e) => {
    e.preventDefault();
    await request("/claims", {
      method: "POST",
      body: JSON.stringify({
        venue_id: selected.id,
        role: e.target.role.value,
        evidence_type: e.target.evidence.value,
        evidence_note: e.target.note.value,
      }),
    });
    setSent(true);
  };
  if (sent)
    return (
      <div className="success">
        <ShieldCheck size={48} />
        <span className="eyebrow">CLAIM SUBMITTED</span>
        <h1>We’re verifying your venue.</h1>
        <p>
          The Siply team will review your evidence. Most claims are completed
          within two working days.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setSelected(null);
          }}
        >
          Claim another venue
        </button>
      </div>
    );
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">VENUE OWNERSHIP</span>
          <h1>Claim your place on Siply.</h1>
          <p>
            Find the listing guests already see, then prove you represent the
            business.
          </p>
        </div>
      </header>
      <div className="claim-layout">
        <section className="panel claim-search">
          <div className="steps">
            <span className={selected ? "done" : "active"}>1</span>
            <i />
            <span className={selected ? "active" : ""}>2</span>
            <i />
            <span>3</span>
          </div>
          <label className="search">
            <Search size={19} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search venue name, city or postcode"
            />
            <button onClick={search}>Search</button>
          </label>
          <div className="results">
            {items.map((v) => (
              <button
                className={selected?.id === v.id ? "selected" : ""}
                disabled={v.claimed}
                onClick={() => setSelected(v)}
                key={v.id}
              >
                <div className="pin">
                  <Building2 />
                </div>
                <p>
                  <strong>{v.name}</strong>
                  <span>
                    {v.category} · {v.address}, {v.city}
                  </span>
                </p>
                <em>{v.claimed ? "Already claimed" : "Select"}</em>
              </button>
            ))}
          </div>
        </section>
        <section className="panel claim-form">
          {!selected ? (
            <div className="empty">
              <MapPin size={42} />
              <h2>Select a venue</h2>
              <p>Your verification form will appear here.</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <span className="eyebrow">CLAIMING</span>
              <h2>{selected.name}</h2>
              <p>
                {selected.address}, {selected.city}
              </p>
              <label>
                Your relationship
                <select name="role">
                  <option>Owner</option>
                  <option>Manager</option>
                  <option>Marketing</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Verification method
                <select name="evidence">
                  <option value="business_email">Business-domain email</option>
                  <option value="document">Official business document</option>
                  <option value="phone">Venue phone call</option>
                  <option value="website">Website verification</option>
                </select>
              </label>
              <label>
                Evidence details
                <textarea
                  name="note"
                  required
                  minLength="3"
                  placeholder="Tell us how we can verify your connection to this venue"
                />
              </label>
              <button>
                Submit secure claim <ChevronRight size={17} />
              </button>
              <small>
                <ShieldCheck size={14} />
                Your evidence is only used for ownership verification.
              </small>
            </form>
          )}
        </section>
      </div>
    </>
  );
}

function Venues() {
  const [claims, setClaims] = useState([]);
  useEffect(() => {
    request("/claims").then(setClaims);
  }, []);
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">PORTFOLIO</span>
          <h1>Your venues.</h1>
          <p>Manage verified locations and track claims in progress.</p>
        </div>
      </header>
      <section className="venue-cards">
        {claims.map((c) => (
          <article className="venue-card" key={c.id}>
            <div className="venue-photo">{c.venue_name[0]}</div>
            <div>
              <span className={"status " + c.status}>{c.status}</span>
              <h2>{c.venue_name}</h2>
              <p>
                {c.address}, {c.city}
              </p>
              <button>
                {c.status === "approved" ? "Manage venue" : "View claim"}
                <ChevronRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
function Coming({ page }) {
  return (
    <div className="coming">
      <Store size={46} />
      <span className="eyebrow">SIPLY BUSINESS</span>
      <h1>{page[0].toUpperCase() + page.slice(1)}</h1>
      <p>This workspace is ready for the next service module.</p>
    </div>
  );
}
function App() {
  const [business, setBusiness] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    request("/me")
      .then(setBusiness)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="loading">Opening Siply Business…</div>;
  if (!business) return <Login onLogin={setBusiness} />;
  return (
    <Shell
      business={business}
      onLogout={() => {
        delete localStorage.siplyBusinessToken;
        setBusiness(null);
      }}
    />
  );
}
createRoot(document.getElementById("root")).render(<App />);
