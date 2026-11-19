import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronRight,
  Coffee,
  Gift,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MapPin,
  Pause,
  Pencil,
  Play,
  Megaphone,
  Search,
  Save,
  Settings,
  ShieldCheck,
  Store,
  Trash2,
  TrendingUp,
  Utensils,
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
// Temporary launch-preview override. Set to false when Pro billing is enabled.
const PRO_ACCESS_BYPASS = true;

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
  [
    "INSIGHTS",
    [
      ["overview", "Overview", LayoutDashboard],
      ["customers", "Customers", Users],
    ],
  ],
  [
    "MANAGE",
    [
      ["posts", "Posts", Megaphone],
      ["promotions", "Offers", Gift],
      ["menu", "Menu", Utensils],
      ["venue", "My venue", Store],
    ],
  ],
  [
    "ACCOUNT",
    [
      ["claim", "Claim a venue", MapPin],
      ["settings", "Business settings", Settings],
    ],
  ],
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
          {nav.map(([group, items]) => (
            <div className="nav-group" key={group}>
              <span>{group}</span>
              {items.map(([id, label, Icon]) => (
                <button
                  className={page === id ? "active" : ""}
                  onClick={() => setPage(id)}
                  key={id}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <button className="logout" onClick={onLogout}>
          <LogOut size={17} />
          Sign out
        </button>
      </aside>
      <main className="content">
        {page === "overview" ? (
          <Dashboard business={business} />
        ) : page === "claim" ? (
          <Claim />
        ) : page === "venue" ? (
          <VenueProfile />
        ) : page === "posts" ? (
          <Posts />
        ) : page === "menu" ? (
          <Menu />
        ) : page === "customers" ? (
          <Customers business={business} />
        ) : page === "promotions" ? (
          <Promotions />
        ) : page === "settings" ? (
          <BusinessSettings business={business} />
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
function Dashboard({ business }) {
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
      <section className="metrics free-metrics">
        <Metric
          label="Profile views"
          value={money(s.profileViews)}
          delta="18.4% vs previous"
          Icon={BarChart3}
        />
        <Metric
          label="Menu views"
          value={money(s.mapActions)}
          delta="Guests exploring your menu"
          Icon={Utensils}
        />
        <Metric
          label="Drink logs"
          value={money(s.drinkLogs)}
          delta="12.1% vs previous"
          Icon={Coffee}
        />
      </section>
      <section
        className={
          "grid pro-area " +
          (business.plan === "Free" && !PRO_ACCESS_BYPASS ? "locked" : "")
        }
      >
        {business.plan === "Free" && !PRO_ACCESS_BYPASS && (
          <div className="pro-lock">
            <LockKeyhole size={28} />
            <span className="eyebrow">SIPLY PRO</span>
            <h2>Understand what brings guests back.</h2>
            <p>
              Unlock unique visitors, ratings, activity trends, local rank and
              returning-customer insights.
            </p>
            <button>Explore Pro</button>
          </div>
        )}
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
    [history, setHistory] = useState([]),
    [sent, setSent] = useState(false);
  useEffect(() => {
    request("/claims").then(setHistory);
  }, []);
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
          <div className="steps named-steps">
            <div>
              <span className={selected ? "done" : "active"}>1</span>
              <b>Find venue</b>
            </div>
            <i />
            <div>
              <span className={selected ? "active" : ""}>2</span>
              <b>Verify</b>
            </div>
            <i />
            <div>
              <span>3</span>
              <b>Submit</b>
            </div>
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
      <section className="panel claim-history">
        <div className="panel-head">
          <div>
            <span>CLAIM HISTORY</span>
            <h2>Your claims</h2>
          </div>
        </div>
        {history.map((x) => (
          <div className="claim-row" key={x.id}>
            <div>
              <strong>{x.venue_name}</strong>
              <span>
                {new Date(x.submitted_at).toLocaleDateString("en-GB")}
              </span>
            </div>
            <em className={`status ${x.status}`}>{x.status}</em>
          </div>
        ))}
      </section>
    </>
  );
}

function Posts() {
  const [posts, setPosts] = useState([]),
    [type, setType] = useState("update"),
    [editing, setEditing] = useState(null),
    [photo, setPhoto] = useState(null),
    [links, setLinks] = useState({ menu: [], offers: [] }),
    [linked, setLinked] = useState(""),
    [body, setBody] = useState("");
  const load = () =>
    Promise.all([
      request("/posts"),
      request("/menu"),
      request("/promotions"),
    ]).then(([p, m, o]) => {
      setPosts(p);
      setLinks({ menu: m, offers: o.filter((x) => x.status === "active") });
    });
  useEffect(() => {
    load();
  }, []);
  const publish = async () => {
    if (!body.trim()) return;
    if (editing) {
      await request(`/posts/${editing}`, {
        method: "PUT",
        body: JSON.stringify({ body }),
      });
    } else {
      await request("/posts", {
        method: "POST",
        body: JSON.stringify({
          type,
          body,
          linked_item_id: linked || null,
          photo_url: photo,
        }),
      });
    }
    setBody("");
    setPhoto(null);
    setLinked("");
    setEditing(null);
    await load();
  };
  const remove = async (id) => {
    if (!confirm("Delete this post?")) return;
    await request(`/posts/${id}`, { method: "DELETE" });
    await load();
  };
  const labels = {
    update: "Update",
    new_drink: "New drink",
    event: "Event",
    offer: "Offer",
  };
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">COMMUNITY</span>
          <h1>Posts.</h1>
          <p>Share venue news with followers and people nearby.</p>
        </div>
      </header>
      <section className="panel composer">
        <div className="composer-tabs">
          {Object.entries(labels).map(([id, label]) => (
            <button
              className={type === id ? "active" : ""}
              onClick={() => setType(id)}
              key={id}
            >
              {label}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          maxLength={500}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Write a ${labels[type].toLowerCase()}…`}
        />
        {type === "new_drink" && (
          <label className="composer-link">
            Link a menu item
            <select value={linked} onChange={(e) => setLinked(e.target.value)}>
              <option value="">Choose an item</option>
              {links.menu.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {type === "offer" && (
          <label className="composer-link">
            Link an active offer
            <select value={linked} onChange={(e) => setLinked(e.target.value)}>
              <option value="">Choose an offer</option>
              {links.offers.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="composer-foot">
          <label className="photo-action">
            <ImagePlus size={17} />
            {photo ? "Photo added" : "Add photo"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setPhoto(reader.result);
                reader.readAsDataURL(file);
              }}
            />
          </label>
          <span>{body.length}/500</span>
          <button className="primary-action" onClick={publish}>
            {editing ? "Save changes" : "Post to Siply"}
          </button>
        </div>
        <small>
          Posts appear on your venue and in the Community feed, labelled as a
          venue post.
        </small>
      </section>
      {photo && <img className="post-preview" src={photo} alt="Post preview" />}
      <section className="post-list">
        {posts.map((x) => (
          <article className="panel post-card" key={x.id}>
            <div>
              <span className="status">{labels[x.type]}</span>
              <small>
                {new Date(x.created_at).toLocaleDateString("en-GB")}
              </small>
            </div>
            <p>{x.body}</p>
            <footer>
              <span>{x.views} views</span>
              <button
                onClick={() => {
                  setEditing(x.id);
                  setBody(x.body);
                  setType(x.type);
                }}
              >
                <Pencil size={15} />
                Edit
              </button>
              <button onClick={() => remove(x.id)}>
                <Trash2 size={15} />
                Delete
              </button>
            </footer>
          </article>
        ))}
      </section>
    </>
  );
}

function Menu() {
  const [items, setItems] = useState([]),
    [editing, setEditing] = useState(null),
    [saved, setSaved] = useState(false);
  const load = () => request("/menu").then(setItems);
  useEffect(() => {
    load();
  }, []);
  const save = async (e) => {
    e.preventDefault();
    await request(`/menu/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        description: e.target.description.value,
        price_pence: Math.round(Number(e.target.price.value) * 100),
        unavailable: e.target.unavailable.checked,
        allergens: e.target.allergens.value
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        abv: e.target.abv.value ? Number(e.target.abv.value) : null,
        photo_url: null,
      }),
    });
    setSaved(true);
    await load();
    setTimeout(() => setSaved(false), 1500);
  };
  const groups = items.reduce(
    (a, x) => ((a[x.category] ??= []).push(x), a),
    {},
  );
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">MENU</span>
          <h1>Your drinks, kept consistent.</h1>
          <p>
            Names and categories stay locked so guest logs and ratings remain
            attached to the same item.
          </p>
        </div>
        <button className="secondary-action">Import menu</button>
      </header>
      <div className="locked-note">
        <LockKeyhole size={18} />
        <p>
          <strong>Menu identity is locked after setup.</strong> You can still
          update price, description, availability, allergens, ABV and photo.
        </p>
      </div>
      {editing && (
        <form className="panel menu-editor" onSubmit={save}>
          <div>
            <span className="eyebrow">EDIT ITEM</span>
            <h2>{editing.name}</h2>
            <small>{editing.category} · identity locked</small>
          </div>
          <label>
            Description
            <textarea name="description" defaultValue={editing.description} />
          </label>
          <label>
            Price (£)
            <input
              name="price"
              type="number"
              step="0.01"
              defaultValue={(editing.price_pence / 100).toFixed(2)}
            />
          </label>
          <label>
            Allergens
            <input
              name="allergens"
              defaultValue={JSON.parse(editing.allergens).join(", ")}
              placeholder="Milk, Egg, Sulphites"
            />
          </label>
          <label>
            ABV %
            <input
              name="abv"
              type="number"
              step="0.1"
              defaultValue={editing.abv ?? ""}
            />
          </label>
          <label className="check">
            <input
              name="unavailable"
              type="checkbox"
              defaultChecked={!!editing.unavailable}
            />
            Temporarily unavailable
          </label>
          <button>{saved ? "Saved" : "Save item"}</button>
        </form>
      )}
      {Object.entries(groups).map(([category, list]) => (
        <section className="menu-category" key={category}>
          <h2>{category}</h2>
          {list.map((x) => (
            <article className="menu-row" key={x.id}>
              <div className="menu-thumb">{x.name[0]}</div>
              <div>
                <strong>{x.name}</strong>
                <span>{x.description || "No description yet"}</span>
                <small>
                  {JSON.parse(x.allergens).length
                    ? "Contains: " + JSON.parse(x.allergens).join(", ")
                    : "No allergens listed"}
                  {x.abv ? ` · ${x.abv}% ABV` : ""}
                </small>
              </div>
              <b>£{(x.price_pence / 100).toFixed(2)}</b>
              {x.unavailable ? <em>Unavailable</em> : null}
              <button
                onClick={() => {
                  setEditing(x);
                  setSaved(false);
                }}
              >
                <Pencil size={15} />
                Edit
              </button>
            </article>
          ))}
        </section>
      ))}
    </>
  );
}

function VenueProfile() {
  const [v, setV] = useState(null),
    [saved, setSaved] = useState(false),
    [cover, setCover] = useState(null);
  useEffect(() => {
    request("/venue-profile").then(setV);
  }, []);
  if (!v) return <div className="loading">Opening your venue…</div>;
  const days = [
    ["mon", "Monday"],
    ["tue", "Tuesday"],
    ["wed", "Wednesday"],
    ["thu", "Thursday"],
    ["fri", "Friday"],
    ["sat", "Saturday"],
    ["sun", "Sunday"],
  ];
  const submit = async (e) => {
    e.preventDefault();
    const hours = {};
    days.forEach(
      ([id]) =>
        (hours[id] = {
          closed: e.target[`${id}_closed`].checked,
          open: e.target[`${id}_open`].value,
          close: e.target[`${id}_close`].value,
        }),
    );
    await request("/venue-profile", {
      method: "PUT",
      body: JSON.stringify({
        username: e.target.username.value,
        category: e.target.category.value,
        address: e.target.address.value,
        city: e.target.city.value,
        postcode: e.target.postcode.value,
        phone: e.target.phone.value,
        email: e.target.email.value,
        website: e.target.website.value,
        instagram: e.target.instagram.value,
        tiktok: e.target.tiktok.value,
        description: e.target.description.value,
        tags: e.target.tags.value
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        opening_hours: hours,
        cover_image: cover || v.cover_image,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">PUBLIC PROFILE</span>
          <h1>My venue.</h1>
          <p>Control what guests see for this verified location.</p>
        </div>
        <button className="secondary-action">View public listing</button>
      </header>
      <form className="venue-profile" onSubmit={submit}>
        <section className="panel profile-section">
          <label
            className="cover-upload"
            style={
              cover || v.cover_image
                ? {
                    backgroundImage: `linear-gradient(#0006,#0006),url(${cover || v.cover_image})`,
                  }
                : undefined
            }
          >
            <ImagePlus size={26} />
            <strong>Upload cover image</strong>
            <span>Crop and preview before publishing</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setCover(reader.result);
                reader.readAsDataURL(file);
              }}
            />
          </label>
          <div className="form-grid">
            <label>
              Username
              <input name="username" defaultValue={v.username} />
            </label>
            <label>
              Venue name
              <input value={v.name} disabled />
            </label>
            <label>
              Category
              <input name="category" defaultValue={v.category} />
            </label>
            <label>
              Phone
              <input name="phone" defaultValue={v.phone} />
            </label>
            <label>
              Address
              <input name="address" defaultValue={v.address} />
            </label>
            <label>
              City
              <input name="city" defaultValue={v.city} />
            </label>
            <label>
              Postcode
              <input name="postcode" defaultValue={v.postcode} />
            </label>
            <label>
              Email
              <input name="email" type="email" defaultValue={v.email} />
            </label>
            <label>
              Website
              <input name="website" defaultValue={v.website} />
            </label>
            <label>
              Instagram
              <input name="instagram" defaultValue={v.instagram} />
            </label>
            <label>
              TikTok
              <input name="tiktok" defaultValue={v.tiktok} />
            </label>
            <label className="wide">
              Description
              <textarea name="description" defaultValue={v.description} />
            </label>
            <label className="wide">
              Venue tags
              <input
                name="tags"
                defaultValue={v.tags.join(", ")}
                placeholder="Outdoor seating, Dog friendly, Live music"
              />
            </label>
          </div>
        </section>
        <section className="panel hours-section">
          <div className="panel-head">
            <div>
              <span>OPENING HOURS</span>
              <h2>When guests can visit</h2>
            </div>
            <button type="button" className="text-action">
              Copy Monday to all
            </button>
          </div>
          {days.map(([id, label]) => {
            const h = v.opening_hours[id] || {
              open: "09:00",
              close: "17:00",
              closed: false,
            };
            return (
              <div className="hours-row" key={id}>
                <strong>{label}</strong>
                <input
                  name={`${id}_open`}
                  type="time"
                  defaultValue={h.open}
                  disabled={h.closed}
                />
                <span>to</span>
                <input
                  name={`${id}_close`}
                  type="time"
                  defaultValue={h.close}
                  disabled={h.closed}
                />
                <label className="check">
                  <input
                    name={`${id}_closed`}
                    type="checkbox"
                    defaultChecked={h.closed}
                  />
                  Closed
                </label>
              </div>
            );
          })}
          <div className="special-hours">
            <CalendarDays />
            <div>
              <strong>Special and bank holiday hours</strong>
              <span>Add exceptions without changing your regular week.</span>
            </div>
            <button type="button">Add date</button>
          </div>
        </section>
        <button className="save-profile">
          {saved ? "Saved successfully" : "Save venue profile"}
          <Save size={17} />
        </button>
      </form>
    </>
  );
}

function Venues() {
  const [claims, setClaims] = useState([]),
    [owned, setOwned] = useState([]),
    [editing, setEditing] = useState(null),
    [saved, setSaved] = useState(false);
  const load = () =>
    Promise.all([request("/claims"), request("/venues")]).then(([a, b]) => {
      setClaims(a);
      setOwned(b);
    });
  useEffect(() => {
    load();
  }, []);
  const save = async (e) => {
    e.preventDefault();
    const updated = await request(`/venues/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        category: e.target.category.value,
        address: e.target.address.value,
        city: e.target.city.value,
        postcode: e.target.postcode.value,
      }),
    });
    setEditing(updated);
    setSaved(true);
    await load();
  };
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">PORTFOLIO</span>
          <h1>Your venues.</h1>
          <p>Manage verified locations and track claims in progress.</p>
        </div>
      </header>
      {editing && (
        <form className="panel venue-editor" onSubmit={save}>
          <div>
            <span className="eyebrow">PUBLIC LISTING</span>
            <h2>Edit {editing.name}</h2>
          </div>
          <label>
            Category
            <input name="category" defaultValue={editing.category} required />
          </label>
          <label>
            Address
            <input name="address" defaultValue={editing.address} required />
          </label>
          <label>
            City
            <input name="city" defaultValue={editing.city} required />
          </label>
          <label>
            Postcode
            <input name="postcode" defaultValue={editing.postcode} required />
          </label>
          <button>
            {saved ? "Saved" : "Save listing"}
            <Save size={16} />
          </button>
          <button
            type="button"
            className="text-action"
            onClick={() => setEditing(null)}
          >
            Close
          </button>
        </form>
      )}
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
              <button
                onClick={() =>
                  c.status === "approved" &&
                  setEditing(owned.find((v) => v.id === c.venue_id))
                }
              >
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

function Customers({ business }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    request("/customers").then(setData);
  }, []);
  if (!data) return <div className="loading">Reading guest signals…</div>;
  const cards = [
    [
      "Reachable guests",
      money(data.summary.reachable),
      "Followers you can engage",
    ],
    [
      "New this month",
      data.summary.new_this_month,
      "First-time venue visitors",
    ],
    ["Return rate", data.summary.return_rate + "%", "Guests who came back"],
    ["Average visits", data.summary.average_visits, "Per returning guest"],
  ];
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">CUSTOMER INSIGHTS</span>
          <h1>Build a loyal crowd.</h1>
          <p>
            Privacy-safe audience trends from activity at your verified venue.
          </p>
        </div>
      </header>
      <div
        className={
          "customer-pro " +
          (business.plan === "Free" && !PRO_ACCESS_BYPASS ? "locked" : "")
        }
      >
        {business.plan === "Free" && !PRO_ACCESS_BYPASS && (
          <div className="pro-lock">
            <LockKeyhole size={28} />
            <span className="eyebrow">SIPLY PRO</span>
            <h2>Know your regulars, without knowing their identities.</h2>
            <p>
              Unlock customer segments, guest actions and return-rate trends
              once your venue has enough aggregated data.
            </p>
            <button>Explore Pro</button>
          </div>
        )}
        <section className="metrics compact-metrics">
          {cards.map(([label, value, note]) => (
            <article className="metric" key={label}>
              <div>
                <span>{label}</span>
                <Users size={19} />
              </div>
              <strong>{value}</strong>
              <small>{note}</small>
            </article>
          ))}
        </section>
        <section className="customer-grid">
          <article className="panel">
            <div className="panel-head">
              <div>
                <span>AUDIENCE SEGMENTS</span>
                <h2>Who to bring back</h2>
              </div>
            </div>
            {data.segments.map((x) => (
              <div className="segment-row" key={x.name}>
                <div>
                  <strong>{x.name}</strong>
                  <span>{x.description}</span>
                </div>
                <b>{x.count}</b>
                <em className={x.change < 0 ? "down" : "up"}>
                  {x.change > 0 ? "+" : ""}
                  {x.change}%
                </em>
              </div>
            ))}
          </article>
          <article className="panel">
            <div className="panel-head">
              <div>
                <span>LAST 30 DAYS</span>
                <h2>Guest actions</h2>
              </div>
            </div>
            {data.activity.map((x) => (
              <div className="activity-row" key={x.label}>
                <span>{x.label}</span>
                <div className="line">
                  <i style={{ width: Math.min(100, x.count) + "%" }} />
                </div>
                <strong>{x.count}</strong>
              </div>
            ))}
            <div className="privacy-note">
              <ShieldCheck size={20} />
              <p>
                <strong>Built for trust.</strong>
                <br />
                Siply only shows aggregated trends—never private guest
                identities.
              </p>
            </div>
          </article>
        </section>
      </div>
    </>
  );
}

function Promotions() {
  const [offers, setOffers] = useState([]),
    [venues, setVenues] = useState([]),
    [open, setOpen] = useState(false),
    [template, setTemplate] = useState(""),
    [message, setMessage] = useState("");
  const load = () =>
    Promise.all([request("/promotions"), request("/venues")]).then(([a, b]) => {
      setOffers(a);
      setVenues(b);
    });
  useEffect(() => {
    load();
  }, []);
  const create = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await request("/promotions", {
        method: "POST",
        body: JSON.stringify({
          venue_id: e.target.venue.value,
          title: e.target.title.value,
          offer: e.target.offer.value,
          starts_at: new Date().toISOString().slice(0, 10),
          ends_at: e.target.ends.value,
          tag: e.target.tag.value,
          share_to_feed: e.target.share.checked,
        }),
      });
      setOpen(false);
      await load();
    } catch (x) {
      setMessage(x.message);
    }
  };
  const status = async (id, next) => {
    await request(`/promotions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    await load();
  };
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">GUEST GROWTH</span>
          <h1>Offers worth returning for.</h1>
          <p>Create targeted incentives and follow their performance.</p>
        </div>
        <button className="primary-action" onClick={() => setOpen(!open)}>
          {open ? "Close form" : "Create offer"}
        </button>
      </header>
      {open && (
        <form className="panel offer-form" onSubmit={create}>
          <div>
            <span className="eyebrow">NEW OFFER</span>
            <h2>Plan a promotion</h2>
          </div>
          <input type="hidden" name="venue" value={venues[0]?.id || ""} />
          <div className="offer-templates">
            <span>Start with a template</span>
            {[
              "Happy hour",
              "Student night",
              "2-for-1",
              "Meal deal",
              "Free item with purchase",
            ].map((x) => (
              <button type="button" onClick={() => setTemplate(x)} key={x}>
                {x}
              </button>
            ))}
          </div>
          <label>
            Campaign name
            <input
              name="title"
              required
              placeholder="Tuesday pick-me-up"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
          </label>
          <label>
            Guest offer
            <input
              name="offer"
              required
              placeholder="20% off hot drinks after 2pm"
            />
          </label>
          <label>
            Optional end date
            <input name="ends" type="date" />
          </label>
          <label>
            Offer tag
            <select name="tag">
              <option>Happy hour</option>
              <option>Student</option>
              <option>Food deal</option>
              <option>Event</option>
              <option>Other</option>
            </select>
          </label>
          <label className="check">
            <input name="share" type="checkbox" /> Also share to Community feed
          </label>
          {message && <div className="error">{message}</div>}
          <button>
            Save as draft <Save size={16} />
          </button>
        </form>
      )}
      <section className="offer-list">
        {offers.length === 0 ? (
          <div className="empty panel">
            <Gift size={42} />
            <h2>No offers yet</h2>
            <p>Create your first campaign to encourage a quieter-day visit.</p>
          </div>
        ) : (
          offers.map((x) => (
            <article className="panel offer-card" key={x.id}>
              <div className="offer-top">
                <span className={"status " + x.status}>{x.status}</span>
                <span>{x.tag || "Offer"}</span>
              </div>
              <h2>{x.title}</h2>
              <p>{x.offer}</p>
              <small>
                Live from {x.starts_at}
                {x.ends_at ? ` · Ends ${x.ends_at}` : " · No end date"}
              </small>
              <div className="offer-stats">
                <div>
                  <strong>{x.views}</strong>
                  <span>Views</span>
                </div>
                <div>
                  <strong>{x.saves}</strong>
                  <span>Saves</span>
                </div>
                <div>
                  <strong>{x.redemptions || "—"}</strong>
                  <span>
                    {x.redemptions
                      ? "Redemptions"
                      : "Redemption tracking unavailable"}
                  </span>
                </div>
              </div>
              <button
                className="offer-toggle"
                onClick={() =>
                  status(x.id, x.status === "active" ? "paused" : "active")
                }
              >
                {x.status === "active" ? (
                  <>
                    <Pause size={15} />
                    Pause offer
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    Publish offer
                  </>
                )}
              </button>
            </article>
          ))
        )}
      </section>
    </>
  );
}

function BusinessSettings({ business }) {
  const [settings, setSettings] = useState(null),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    request("/settings").then(setSettings);
  }, []);
  if (!settings)
    return <div className="loading">Opening business settings…</div>;
  const submit = async (e) => {
    e.preventDefault();
    await request("/settings", {
      method: "PUT",
      body: JSON.stringify({
        contact_name: e.target.contact.value,
        phone: e.target.phone.value,
        digest_frequency: e.target.digest.value,
        marketing_opt_in: e.target.marketing.checked,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  return (
    <>
      <header>
        <div>
          <span className="eyebrow">ACCOUNT & NOTIFICATIONS</span>
          <h1>Business settings.</h1>
          <p>
            Manage the people and updates connected to your Siply workspace.
          </p>
        </div>
      </header>
      <section className="settings-grid">
        <form className="panel settings-form" onSubmit={submit}>
          <div className="panel-head">
            <div>
              <span>PRIMARY CONTACT</span>
              <h2>Contact details</h2>
            </div>
          </div>
          <label>
            Contact name
            <input name="contact" defaultValue={settings.contact_name} />
          </label>
          <label>
            Business email
            <input value={business.email} disabled />
          </label>
          <label>
            Phone number
            <input name="phone" defaultValue={settings.phone} />
          </label>
          <label>
            Performance digest
            <select name="digest" defaultValue={settings.digest_frequency}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="off">Off</option>
            </select>
          </label>
          <label className="check">
            <input
              name="marketing"
              type="checkbox"
              defaultChecked={settings.marketing_opt_in}
            />
            <span>Send product news and partner opportunities</span>
          </label>
          <button>
            {saved ? "Saved successfully" : "Save changes"} <Save size={16} />
          </button>
        </form>
        <article className="panel account-card">
          <span className="eyebrow">WORKSPACE</span>
          <h2>{business.name}</h2>
          <p>{business.legal_name}</p>
          <div>
            <span>Plan</span>
            <strong>{business.plan}</strong>
          </div>
          <button className="upgrade-button">
            <LockKeyhole size={16} />
            Upgrade to Pro
          </button>
          <div>
            <span>Access</span>
            <strong>Verified partner</strong>
          </div>
          <div>
            <span>Security</span>
            <strong>7-day session</strong>
          </div>
          <div className="privacy-note">
            <ShieldCheck size={20} />
            <p>
              Venue and customer analytics are restricted to approved locations.
            </p>
          </div>
          <div className="account-actions">
            <button>Export my business data</button>
            <button className="danger-text">Delete business account</button>
          </div>
        </article>
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
