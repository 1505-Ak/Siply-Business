from __future__ import annotations

import hashlib
import secrets
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
    connection = sqlite3.connect(DB_PATH)
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
        """)
        c.execute("INSERT OR IGNORE INTO businesses VALUES (?,?,?,?,?,?,?)", ("biz-northstar", "North Star Coffee", "North Star Coffee Ltd", "owner@northstarcoffee.co.uk", hash_password("SiplyBusiness!"), "Growth", now()))
        venues = [
            ("venue-northstar", "North Star Coffee", "Specialty coffee", "44 Queen Street", "Glasgow", "G1 3DS", 55.8609, -4.2514, 1),
            ("venue-lime-tap", "The Lime Tap", "Cocktail bar", "12 Merchant Lane", "Glasgow", "G1 1AA", 55.8586, -4.2462, 0),
            ("venue-copper-fox", "Copper Fox Kitchen", "Restaurant", "8 Argyle Street", "Glasgow", "G2 8DL", 55.8581, -4.2557, 0),
            ("venue-sunday", "Slow Sunday Café", "Café", "21 Byres Road", "Glasgow", "G11 5RD", 55.8724, -4.2972, 0),
        ]
        c.executemany("INSERT OR IGNORE INTO venues VALUES (?,?,?,?,?,?,?,?,?)", venues)
        c.execute("INSERT OR IGNORE INTO claims VALUES (?,?,?,?,?,?,?,?,?)", ("claim-approved", "biz-northstar", "venue-northstar", "Owner", "business_email", "Domain email verified", "approved", now(), now()))


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
    ends_at: str


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


@app.get("/api/dashboard")
def dashboard(period: Literal["7d", "30d", "90d"] = "30d", connection=Depends(db), business=Depends(current_business)):
    venues = scoped_venues(connection, business["id"])
    if not venues: return {"venues": [], "summary": {}, "series": [], "popular": [], "returning": []}
    multiplier = {"7d": .28, "30d": 1, "90d": 2.75}[period]
    base = {"profileViews": 2847, "mapActions": 936, "drinkLogs": 412, "uniqueVisitors": 318, "returningVisitors": 126, "saves": 227, "averageRating": 4.6, "posts": 184}
    summary = {key: round(value * multiplier) if isinstance(value, int) else value for key, value in base.items()}
    series = [{"label": f"W{i+1}", "views": round((480 + i*73 + (i%2)*120)*multiplier), "visits": round((58 + i*9)*multiplier)} for i in range(6)]
    return {"venues": [dict(v) for v in venues], "period": period, "summary": summary, "series": series, "popular": [{"name":"Flat White","logs":96,"rating":4.8},{"name":"Iced Matcha","logs":73,"rating":4.7},{"name":"V60 Filter","logs":61,"rating":4.9},{"name":"Espresso","logs":48,"rating":4.5}], "busyHours":[{"day":"Saturday","time":"11:00–14:00","visits":74},{"day":"Friday","time":"15:00–18:00","visits":63},{"day":"Sunday","time":"10:00–13:00","visits":57}], "audience":{"new":192,"returning":126,"followers":584}}


@app.get("/api/promotions")
def promotions(connection=Depends(db), business=Depends(current_business)):
    return [dict(row) for row in connection.execute("SELECT * FROM promotions WHERE business_id=? ORDER BY starts_at DESC", (business["id"],)).fetchall()]


@app.post("/api/promotions", status_code=201)
def create_promotion(payload: PromotionCreate, connection=Depends(db), business=Depends(current_business)):
    approved = connection.execute("SELECT 1 FROM claims WHERE business_id=? AND venue_id=? AND status='approved'", (business["id"], payload.venue_id)).fetchone()
    if not approved: raise HTTPException(403, "Only approved venue owners can publish offers")
    promo_id = f"promo-{secrets.token_hex(6)}"
    connection.execute("INSERT INTO promotions VALUES (?,?,?,?,?,?,?,?,?,?,?)", (promo_id, business["id"], payload.venue_id, payload.title, payload.offer, payload.starts_at, payload.ends_at, "draft", 0, 0, 0)); connection.commit()
    return {"id": promo_id, "status": "draft"}

