from __future__ import annotations

import hashlib
import secrets
import json
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

DB_PATH = Path(__file__).with_name("siply_business.db")
app = FastAPI(title="Siply Business API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3400", "http://127.0.0.1:3400"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def db():
    connection = sqlite3.connect(DB_PATH, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
    finally:
        connection.close()


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(value: str) -> str:
    return hashlib.sha256(f"siply-business::{value}".encode()).hexdigest()


def setup() -> None:
    with sqlite3.connect(DB_PATH) as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS businesses (id TEXT PRIMARY KEY, name TEXT NOT NULL, legal_name TEXT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, plan TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, business_id TEXT NOT NULL, expires_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS venues (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL, postcode TEXT, latitude REAL, longitude REAL, claimed INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS claims (id TEXT PRIMARY KEY, business_id TEXT NOT NULL, venue_id TEXT NOT NULL, role TEXT NOT NULL, evidence_type TEXT NOT NULL, evidence_note TEXT, status TEXT NOT NULL, submitted_at TEXT NOT NULL, reviewed_at TEXT);
        CREATE TABLE IF NOT EXISTS promotions (id TEXT PRIMARY KEY, business_id TEXT NOT NULL, venue_id TEXT NOT NULL, title TEXT NOT NULL, offer TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, status TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, saves INTEGER NOT NULL DEFAULT 0, redemptions INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS business_settings (business_id TEXT PRIMARY KEY, contact_name TEXT NOT NULL, phone TEXT, digest_frequency TEXT NOT NULL DEFAULT 'weekly', marketing_opt_in INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, business_id TEXT NOT NULL, venue_id TEXT NOT NULL, type TEXT NOT NULL, body TEXT NOT NULL, photo_url TEXT, linked_item_id TEXT, status TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY, venue_id TEXT NOT NULL, category TEXT NOT NULL, name TEXT NOT NULL, description TEXT, price_pence INTEGER NOT NULL, unavailable INTEGER NOT NULL DEFAULT 0, allergens TEXT NOT NULL DEFAULT '[]', abv REAL, photo_url TEXT, locked INTEGER NOT NULL DEFAULT 1);
        CREATE TABLE IF NOT EXISTS venue_profiles (venue_id TEXT PRIMARY KEY, username TEXT NOT NULL, phone TEXT, email TEXT, website TEXT, instagram TEXT, tiktok TEXT, description TEXT, tags TEXT NOT NULL DEFAULT '[]', opening_hours TEXT NOT NULL DEFAULT '{}', cover_image TEXT);
        """)
        for statement in ("ALTER TABLE promotions ADD COLUMN tag TEXT", "ALTER TABLE promotions ADD COLUMN share_to_feed INTEGER NOT NULL DEFAULT 0", "ALTER TABLE menu_items ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0", "ALTER TABLE menu_items ADD COLUMN log_count INTEGER NOT NULL DEFAULT 0", "ALTER TABLE menu_items ADD COLUMN rating_count INTEGER NOT NULL DEFAULT 0"):
            try: c.execute(statement)
            except sqlite3.OperationalError: pass
        c.execute("INSERT OR IGNORE INTO businesses VALUES (?,?,?,?,?,?,?)", ("biz-northstar", "North Star Coffee", "North Star Coffee Ltd", "owner@northstarcoffee.co.uk", hash_password("SiplyBusiness!"), "Growth", now()))
        c.execute("UPDATE businesses SET plan='Free' WHERE id='biz-northstar' AND plan='Growth'")
        venues = [
            ("venue-northstar", "North Star Coffee", "Specialty coffee", "44 Queen Street", "Glasgow", "G1 3DS", 55.8609, -4.2514, 1),
            ("venue-lime-tap", "The Lime Tap", "Cocktail bar", "12 Merchant Lane", "Glasgow", "G1 1AA", 55.8586, -4.2462, 0),
            ("venue-copper-fox", "Copper Fox Kitchen", "Restaurant", "8 Argyle Street", "Glasgow", "G2 8DL", 55.8581, -4.2557, 0),
            ("venue-sunday", "Slow Sunday Café", "Café", "21 Byres Road", "Glasgow", "G11 5RD", 55.8724, -4.2972, 0),
        ]
        c.executemany("INSERT OR IGNORE INTO venues VALUES (?,?,?,?,?,?,?,?,?)", venues)
        c.execute("INSERT OR IGNORE INTO claims VALUES (?,?,?,?,?,?,?,?,?)", ("claim-approved", "biz-northstar", "venue-northstar", "Owner", "business_email", "Domain email verified", "approved", now(), now()))
        c.execute("INSERT OR IGNORE INTO business_settings VALUES (?,?,?,?,?)", ("biz-northstar", "Venue Owner", "+44 141 555 0132", "weekly", 1))
        c.execute("UPDATE business_settings SET contact_name='Ashoka' WHERE business_id='biz-northstar' AND contact_name='Venue Owner'")
        c.execute("INSERT OR IGNORE INTO promotions (id,business_id,venue_id,title,offer,starts_at,ends_at,status,views,saves,redemptions,tag,share_to_feed) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", ("promo-welcome", "biz-northstar", "venue-northstar", "Tuesday pick-me-up", "20% off any hot drink after 2pm", "2026-11-17", "2026-12-17", "active", 684, 91, 34, "Happy hour", 1))
        c.execute("INSERT OR IGNORE INTO venue_profiles VALUES (?,?,?,?,?,?,?,?,?,?,?)", ("venue-northstar", "northstarcoffee", "+44 141 555 0132", "hello@northstarcoffee.example", "https://northstarcoffee.example", "northstarcoffee", "", "Independent specialty coffee, seasonal drinks and a warm Glasgow welcome.", json.dumps(["Dog friendly", "Outdoor seating", "Wi-Fi"]), json.dumps({d:{"closed": d=="mon", "open":"08:00", "close":"17:00"} for d in ["mon","tue","wed","thu","fri","sat","sun"]}), None))
        menu = [
            ("menu-flat-white","venue-northstar","Coffee","Flat White","Double espresso with silky steamed milk",380,0,"[\"Milk\"]",None,None,1),
            ("menu-espresso","venue-northstar","Coffee","Espresso","House espresso, served short",280,0,"[]",None,None,1),
            ("menu-matcha","venue-northstar","Seasonal","Iced Matcha","Ceremonial matcha, oat milk and ice",450,0,"[]",None,None,1),
            ("menu-ginger","venue-northstar","Soft drinks","Fever-Tree Ginger Beer","",320,0,"[]",0.0,None,1),
        ]
        c.executemany("INSERT OR IGNORE INTO menu_items (id,venue_id,category,name,description,price_pence,unavailable,allergens,abv,photo_url,locked) VALUES (?,?,?,?,?,?,?,?,?,?,?)", menu)
        c.execute("UPDATE menu_items SET log_count=96,rating_count=24 WHERE id='menu-flat-white' AND log_count=0 AND rating_count=0")
        posts = [
            ("post-welcome","biz-northstar","venue-northstar","new_drink","Our iced matcha is back for the season.",None,"menu-matcha","published",184,now(),now()),
            ("post-weekend","biz-northstar","venue-northstar","update","Weekend opening hours are now live—come say hello.",None,None,"published",121,now(),now()),
        ]
        c.executemany("INSERT OR IGNORE INTO posts VALUES (?,?,?,?,?,?,?,?,?,?,?)", posts)


setup()


class Login(BaseModel):
    email: EmailStr
    password: str


class ClaimCreate(BaseModel):
    venue_id: str
    role: Literal["Owner", "Manager", "Marketing", "Other"]
    evidence_type: Literal["business_email", "document", "phone", "website"]
    evidence_note: str = Field(min_length=3, max_length=500)


class PromotionCreate(BaseModel):
    venue_id: str
    title: str = Field(min_length=3, max_length=80)
    offer: str = Field(min_length=3, max_length=160)
    starts_at: str
    ends_at: str = ""
    tag: Literal["Happy hour", "Student", "Food deal", "Event", "Other"] = "Other"
    share_to_feed: bool = False


class PromotionStatus(BaseModel):
    status: Literal["draft", "active", "paused", "ended"]


class VenueUpdate(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    address: str = Field(min_length=3, max_length=140)
    city: str = Field(min_length=2, max_length=80)
    postcode: str = Field(min_length=2, max_length=16)


class SettingsUpdate(BaseModel):
    contact_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(max_length=30)
    digest_frequency: Literal["daily", "weekly", "monthly", "off"]
    marketing_opt_in: bool


class PostCreate(BaseModel):
    type: Literal["update", "new_drink", "event", "offer", "other"]
    body: str = Field(min_length=1, max_length=500)
    linked_item_id: str | None = None
    photo_url: str | None = None


class PostUpdate(BaseModel):
    body: str = Field(min_length=1, max_length=500)


class MenuUpdate(BaseModel):
    description: str = Field(max_length=500)
    price_pence: int = Field(ge=0, le=100000)
    unavailable: bool
    allergens: list[str] = []
    abv: float | None = Field(default=None, ge=0, le=100)
    photo_url: str | None = None


class MenuCreate(MenuUpdate):
    name: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=80)


class MenuVisibility(BaseModel):
    hidden: bool


class VenueProfileUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    category: str = Field(min_length=2, max_length=80)
    address: str = Field(min_length=3, max_length=140)
    city: str = Field(min_length=2, max_length=80)
    postcode: str = Field(min_length=2, max_length=16)
    phone: str = Field(max_length=30)
    email: EmailStr
    website: str = Field(max_length=200)
    instagram: str = Field(max_length=80)
    tiktok: str = Field(max_length=80)
    description: str = Field(max_length=1000)
    tags: list[str]
    opening_hours: dict
    cover_image: str | None = None


def current_business(authorization: str | None = Header(default=None), connection=Depends(db)):
    token = (authorization or "").removeprefix("Bearer ").strip()
    row = connection.execute("SELECT b.* FROM sessions s JOIN businesses b ON b.id=s.business_id WHERE s.token=? AND s.expires_at>?", (token, now())).fetchone()
    if not row:
        raise HTTPException(401, "Sign in to Siply Business")
    return dict(row)


@app.get("/api/health")
def health(): return {"ok": True, "service": "siply-business"}


@app.post("/api/auth/login")
def login(payload: Login, connection=Depends(db)):
    business = connection.execute("SELECT * FROM businesses WHERE email=?", (payload.email.lower(),)).fetchone()
    if not business or business["password_hash"] != hash_password(payload.password):
        raise HTTPException(401, "Incorrect business email or password")
    token = secrets.token_urlsafe(32)
    expiry = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    connection.execute("INSERT INTO sessions VALUES (?,?,?)", (token, business["id"], expiry)); connection.commit()
    return {"token": token, "business": {k: business[k] for k in ("id", "name", "legal_name", "email", "plan")}}


@app.get("/api/me")
def me(business=Depends(current_business)): return {k: business[k] for k in ("id", "name", "legal_name", "email", "plan")}


@app.get("/api/venues/search")
def venue_search(q: str = "", connection=Depends(db), business=Depends(current_business)):
    rows = connection.execute("SELECT * FROM venues WHERE lower(name) LIKE ? OR lower(city) LIKE ? OR lower(postcode) LIKE ? ORDER BY claimed, name LIMIT 20", tuple([f"%{q.lower()}%"] * 3)).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/claims")
def claims(connection=Depends(db), business=Depends(current_business)):
    rows = connection.execute("SELECT c.*,v.name venue_name,v.address,v.city FROM claims c JOIN venues v ON v.id=c.venue_id WHERE c.business_id=? ORDER BY c.submitted_at DESC", (business["id"],)).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/claims", status_code=201)
def create_claim(payload: ClaimCreate, connection=Depends(db), business=Depends(current_business)):
    venue = connection.execute("SELECT * FROM venues WHERE id=?", (payload.venue_id,)).fetchone()
    if not venue: raise HTTPException(404, "Venue not found")
    if venue["claimed"]: raise HTTPException(409, "This venue is already claimed")
    existing = connection.execute("SELECT id FROM claims WHERE business_id=? AND venue_id=? AND status IN ('pending','approved')", (business["id"], payload.venue_id)).fetchone()
    if existing: raise HTTPException(409, "You already have an active claim for this venue")
    claim_id = f"claim-{secrets.token_hex(6)}"
    connection.execute("INSERT INTO claims VALUES (?,?,?,?,?,?,?,?,?)", (claim_id, business["id"], payload.venue_id, payload.role, payload.evidence_type, payload.evidence_note, "pending", now(), None)); connection.commit()
    return {"id": claim_id, "status": "pending"}


def scoped_venues(connection, business_id: str):
    return connection.execute("SELECT v.* FROM claims c JOIN venues v ON v.id=c.venue_id WHERE c.business_id=? AND c.status='approved'", (business_id,)).fetchall()


@app.get("/api/venues")
def owned_venues(connection=Depends(db), business=Depends(current_business)):
    return [dict(row) for row in scoped_venues(connection, business["id"])]


@app.put("/api/venues/{venue_id}")
def update_venue(venue_id: str, payload: VenueUpdate, connection=Depends(db), business=Depends(current_business)):
    owned = connection.execute("SELECT 1 FROM claims WHERE business_id=? AND venue_id=? AND status='approved'", (business["id"], venue_id)).fetchone()
    if not owned: raise HTTPException(403, "You can only edit verified venues")
    connection.execute("UPDATE venues SET category=?,address=?,city=?,postcode=? WHERE id=?", (payload.category, payload.address, payload.city, payload.postcode, venue_id)); connection.commit()
    return dict(connection.execute("SELECT * FROM venues WHERE id=?", (venue_id,)).fetchone())


@app.get("/api/dashboard")
def dashboard(period: Literal["7d", "30d", "90d"] = "30d", connection=Depends(db), business=Depends(current_business)):
    venues = scoped_venues(connection, business["id"])
    if not venues: return {"venues": [], "summary": {}, "series": [], "popular": [], "returning": []}
    multiplier = {"7d": .28, "30d": 1, "90d": 2.75}[period]
    base = {"profileViews": 2847, "mapActions": 936, "drinkLogs": 412, "uniqueVisitors": 318, "returningVisitors": 126, "saves": 227, "averageRating": 4.6, "posts": 184}
    summary = {key: round(value * multiplier) if isinstance(value, int) else value for key, value in base.items()}
    series = [{"label": f"W{i+1}", "views": round((480 + i*73 + (i%2)*120)*multiplier), "visits": round((58 + i*9)*multiplier)} for i in range(6)]
    return {"venues": [dict(v) for v in venues], "period": period, "summary": summary, "series": series, "popular": [{"name":"Flat White","logs":96,"rating":4.8},{"name":"Iced Matcha","logs":73,"rating":4.7},{"name":"V60 Filter","logs":61,"rating":4.9},{"name":"Espresso","logs":48,"rating":4.5}], "busyHours":[{"day":"Saturday","time":"11:00–14:00","visits":74},{"day":"Friday","time":"15:00–18:00","visits":63}], "audience": None if business["plan"] == "Free" else {"new":192,"returning":126,"followers":584}}


@app.get("/api/promotions")
def promotions(connection=Depends(db), business=Depends(current_business)):
    rows=[]
    for row in connection.execute("SELECT * FROM promotions WHERE business_id=? ORDER BY starts_at DESC", (business["id"],)).fetchall():
        item=dict(row); item.pop("redemptions", None); rows.append(item)
    return rows


@app.post("/api/promotions", status_code=201)
def create_promotion(payload: PromotionCreate, connection=Depends(db), business=Depends(current_business)):
    approved = connection.execute("SELECT 1 FROM claims WHERE business_id=? AND venue_id=? AND status='approved'", (business["id"], payload.venue_id)).fetchone()
    if not approved: raise HTTPException(403, "Only approved venue owners can publish offers")
    promo_id = f"promo-{secrets.token_hex(6)}"
    connection.execute("INSERT INTO promotions (id,business_id,venue_id,title,offer,starts_at,ends_at,status,views,saves,redemptions,tag,share_to_feed) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", (promo_id, business["id"], payload.venue_id, payload.title, payload.offer, payload.starts_at, payload.ends_at, "draft", 0, 0, 0, payload.tag, int(payload.share_to_feed))); connection.commit()
    return {"id": promo_id, "status": "draft"}


@app.patch("/api/promotions/{promotion_id}")
def update_promotion_status(promotion_id: str, payload: PromotionStatus, connection=Depends(db), business=Depends(current_business)):
    row = connection.execute("SELECT * FROM promotions WHERE id=? AND business_id=?", (promotion_id, business["id"])).fetchone()
    if not row: raise HTTPException(404, "Offer not found")
    connection.execute("UPDATE promotions SET status=? WHERE id=?", (payload.status, promotion_id)); connection.commit()
    return {"id": promotion_id, "status": payload.status}


@app.get("/api/customers")
def customers(connection=Depends(db), business=Depends(current_business)):
    if business["plan"] == "Free": return {"locked": True}
    if not scoped_venues(connection, business["id"]): return {"segments": [], "activity": []}
    return {
        "summary": {"reachable": 584, "new_this_month": 72, "return_rate": 40, "average_visits": 2.7},
        "segments": [
            {"name": "Regulars", "description": "Visited 3+ times in 60 days", "count": 126, "change": 12},
            {"name": "New guests", "description": "First visit in the last 30 days", "count": 192, "change": 18},
            {"name": "At risk", "description": "No return visit in 45 days", "count": 48, "change": -6},
            {"name": "Siply followers", "description": "Following your venue profile", "count": 584, "change": 9},
        ],
        "activity": [
            {"label": "Saved your venue", "count": 91}, {"label": "Logged a drink", "count": 74},
            {"label": "Redeemed an offer", "count": 34}, {"label": "Left a rating", "count": 27},
        ],
    }


@app.get("/api/posts")
def posts(connection=Depends(db), business=Depends(current_business)):
    return [dict(row) for row in connection.execute("SELECT * FROM posts WHERE business_id=? ORDER BY created_at DESC", (business["id"],)).fetchall()]


@app.post("/api/posts", status_code=201)
def create_post(payload: PostCreate, connection=Depends(db), business=Depends(current_business)):
    venue = scoped_venues(connection, business["id"])
    if not venue: raise HTTPException(403, "Claim a venue before posting")
    post_id = f"post-{secrets.token_hex(6)}"
    connection.execute("INSERT INTO posts VALUES (?,?,?,?,?,?,?,?,?,?,?)", (post_id,business["id"],venue[0]["id"],payload.type,payload.body,payload.photo_url,payload.linked_item_id,"published",0,now(),now())); connection.commit()
    return {"id":post_id,"status":"published"}


@app.put("/api/posts/{post_id}")
def update_post(post_id: str, payload: PostUpdate, connection=Depends(db), business=Depends(current_business)):
    if not connection.execute("SELECT 1 FROM posts WHERE id=? AND business_id=?",(post_id,business["id"])).fetchone(): raise HTTPException(404,"Post not found")
    connection.execute("UPDATE posts SET body=?,updated_at=? WHERE id=?",(payload.body,now(),post_id)); connection.commit(); return {"saved":True}


@app.delete("/api/posts/{post_id}", status_code=204)
def delete_post(post_id: str, connection=Depends(db), business=Depends(current_business)):
    connection.execute("DELETE FROM posts WHERE id=? AND business_id=?",(post_id,business["id"])); connection.commit()


@app.get("/api/menu")
def menu(connection=Depends(db), business=Depends(current_business)):
    venues=scoped_venues(connection,business["id"])
    if not venues:return []
    return [dict(row) for row in connection.execute("SELECT * FROM menu_items WHERE venue_id=? ORDER BY category,name",(venues[0]["id"],)).fetchall()]


@app.put("/api/menu/{item_id}")
def update_menu_item(item_id: str,payload:MenuUpdate,connection=Depends(db),business=Depends(current_business)):
    venues=scoped_venues(connection,business["id"]); ids=[v["id"] for v in venues]
    row=connection.execute("SELECT * FROM menu_items WHERE id=?",(item_id,)).fetchone()
    if not row or row["venue_id"] not in ids: raise HTTPException(404,"Menu item not found")
    connection.execute("UPDATE menu_items SET description=?,price_pence=?,unavailable=?,allergens=?,abv=?,photo_url=? WHERE id=?",(payload.description,payload.price_pence,int(payload.unavailable),json.dumps(payload.allergens),payload.abv,payload.photo_url,item_id)); connection.commit(); return {"saved":True}


@app.post("/api/menu", status_code=201)
def create_menu_item(payload:MenuCreate,connection=Depends(db),business=Depends(current_business)):
    venues=scoped_venues(connection,business["id"])
    if not venues: raise HTTPException(403,"No verified venue")
    venue_id=venues[0]["id"]
    duplicate=connection.execute("SELECT 1 FROM menu_items WHERE venue_id=? AND lower(name)=lower(?)",(venue_id,payload.name)).fetchone()
    if duplicate: raise HTTPException(409,"A menu item with this name already exists")
    item_id=f"menu-{secrets.token_hex(6)}"
    connection.execute("INSERT INTO menu_items (id,venue_id,category,name,description,price_pence,unavailable,allergens,abv,photo_url,locked,hidden,log_count,rating_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(item_id,venue_id,payload.category,payload.name,payload.description,payload.price_pence,int(payload.unavailable),json.dumps(payload.allergens),payload.abv,payload.photo_url,1,0,0,0));connection.commit();return {"id":item_id}


@app.patch("/api/menu/{item_id}/visibility")
def set_menu_visibility(item_id:str,payload:MenuVisibility,connection=Depends(db),business=Depends(current_business)):
    venues=scoped_venues(connection,business["id"]); ids=[v["id"] for v in venues]
    row=connection.execute("SELECT * FROM menu_items WHERE id=?",(item_id,)).fetchone()
    if not row or row["venue_id"] not in ids: raise HTTPException(404,"Menu item not found")
    connection.execute("UPDATE menu_items SET hidden=? WHERE id=?",(int(payload.hidden),item_id));connection.commit();return {"hidden":payload.hidden}


@app.delete("/api/menu/{item_id}", status_code=204)
def delete_menu_item(item_id:str,connection=Depends(db),business=Depends(current_business)):
    venues=scoped_venues(connection,business["id"]); ids=[v["id"] for v in venues]
    row=connection.execute("SELECT * FROM menu_items WHERE id=?",(item_id,)).fetchone()
    if not row or row["venue_id"] not in ids: raise HTTPException(404,"Menu item not found")
    if row["log_count"] or row["rating_count"]: raise HTTPException(409,"This item has guest activity and can only be hidden")
    connection.execute("DELETE FROM menu_items WHERE id=?",(item_id,));connection.commit()


@app.get("/api/venue-profile")
def venue_profile(connection=Depends(db),business=Depends(current_business)):
    venues=scoped_venues(connection,business["id"])
    if not venues: raise HTTPException(404,"No verified venue")
    venue=dict(venues[0]); profile=connection.execute("SELECT * FROM venue_profiles WHERE venue_id=?",(venue["id"],)).fetchone()
    result={**venue,**dict(profile)}; result["tags"]=json.loads(result["tags"]); result["opening_hours"]=json.loads(result["opening_hours"]); return result


@app.put("/api/venue-profile")
def update_venue_profile(payload:VenueProfileUpdate,connection=Depends(db),business=Depends(current_business)):
    venues=scoped_venues(connection,business["id"])
    if not venues: raise HTTPException(404,"No verified venue")
    venue_id=venues[0]["id"]
    connection.execute("UPDATE venues SET category=?,address=?,city=?,postcode=? WHERE id=?",(payload.category,payload.address,payload.city,payload.postcode,venue_id))
    connection.execute("UPDATE venue_profiles SET username=?,phone=?,email=?,website=?,instagram=?,tiktok=?,description=?,tags=?,opening_hours=?,cover_image=? WHERE venue_id=?",(payload.username,payload.phone,str(payload.email),payload.website,payload.instagram,payload.tiktok,payload.description,json.dumps(payload.tags),json.dumps(payload.opening_hours),payload.cover_image,venue_id)); connection.commit(); return {"saved":True}


@app.get("/api/settings")
def get_settings(connection=Depends(db), business=Depends(current_business)):
    row = connection.execute("SELECT * FROM business_settings WHERE business_id=?", (business["id"],)).fetchone()
    return {**dict(row), "marketing_opt_in": bool(row["marketing_opt_in"])}


@app.put("/api/settings")
def update_settings(payload: SettingsUpdate, connection=Depends(db), business=Depends(current_business)):
    connection.execute("UPDATE business_settings SET contact_name=?,phone=?,digest_frequency=?,marketing_opt_in=? WHERE business_id=?", (payload.contact_name, payload.phone, payload.digest_frequency, int(payload.marketing_opt_in), business["id"])); connection.commit()
    return {"saved": True}
