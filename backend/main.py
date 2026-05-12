from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json, os
from groq import Groq
import sqlalchemy as sa
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# ── CONFIG ──
GROQ_API_KEY = "PASTE_YOUR_KEY_HERE"
GROQ_MODEL   = "llama-3.3-70b-versatile"

# ── SQLITE DATABASE ──
DATABASE_URL = "sqlite:///./hcp_crm.db"
engine = sa.create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── DATABASE MODEL ──
class InteractionModel(Base):
    __tablename__ = "interactions"
    id               = sa.Column(sa.Integer, primary_key=True, index=True)
    hcp_name         = sa.Column(sa.String,  index=True, default="")
    interaction_type = sa.Column(sa.String,  default="Meeting")
    date             = sa.Column(sa.String,  default="")
    time             = sa.Column(sa.String,  default="")
    attendees        = sa.Column(sa.String,  default="[]")
    topics           = sa.Column(sa.Text,    default="")
    materials        = sa.Column(sa.String,  default="[]")
    samples          = sa.Column(sa.String,  default="[]")
    sentiment        = sa.Column(sa.String,  default="Neutral")
    outcomes         = sa.Column(sa.Text,    default="")
    follow_up        = sa.Column(sa.Text,    default="")
    ai_suggestions   = sa.Column(sa.String,  default="[]")
    created_at       = sa.Column(sa.String,  default="")

Base.metadata.create_all(bind=engine)

# ── GROQ CLIENT ──
client = Groq(api_key=GROQ_API_KEY)

# ── FASTAPI APP ──
app = FastAPI(title="HCP CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REQUEST MODELS ──
class ChatRequest(BaseModel):
    message: str

class InteractionCreate(BaseModel):
    hcp_name:         str  = ""
    interaction_type: str  = "Meeting"
    date:             str  = ""
    time:             str  = ""
    attendees:        list = []
    topics:           str  = ""
    materials:        list = []
    samples:          list = []
    sentiment:        str  = "Neutral"
    outcomes:         str  = ""
    follow_up:        str  = ""
    ai_suggestions:   list = []

class InteractionUpdate(BaseModel):
    hcp_name:         Optional[str] = None
    interaction_type: Optional[str] = None
    date:             Optional[str] = None
    topics:           Optional[str] = None
    sentiment:        Optional[str] = None
    outcomes:         Optional[str] = None
    follow_up:        Optional[str] = None

# ── ROOT ──
@app.get("/")
def root():
    return {"status": "ok", "message": "HCP CRM API running", "model": GROQ_MODEL}

# ── CHAT / AUTO FILL ──
@app.post("/chat")
async def chat(req: ChatRequest):
    prompt = f"""You are a pharma CRM assistant. Extract structured data from this text.

Text: "{req.message}"

Return ONLY valid JSON with exactly these fields:
{{
  "hcp_name": "doctor name or empty string",
  "date": "YYYY-MM-DD format or empty string",
  "interaction_type": "one of: Meeting, Call, Visit, Conference, Email, Advisory Board",
  "topics": "topics discussed",
  "sentiment": "one of: Positive, Neutral, Negative",
  "outcomes": "outcomes or agreements mentioned",
  "follow_up": "next steps mentioned",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "reply": "one sentence friendly confirmation"
}}

Rules:
- Extract doctor name after Dr. or Prof. or Doctor
- If date not mentioned use empty string
- Infer sentiment from tone: positive words = Positive, negative = Negative, else Neutral
- suggestions must be 3 practical pharma sales next steps
- Return ONLY the JSON object, no extra text, no markdown"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=500
        )
        content = response.choices[0].message.content.strip()
        content = content.replace("```json", "").replace("```", "").strip()
        
        # find JSON object in response
        start = content.find("{")
        end   = content.rfind("}") + 1
        if start != -1 and end > start:
            content = content[start:end]
        
        data = json.loads(content)
        return data

    except json.JSONDecodeError:
        return {
            "hcp_name":         "",
            "date":             "",
            "interaction_type": "Meeting",
            "topics":           req.message,
            "sentiment":        "Neutral",
            "outcomes":         "",
            "follow_up":        "",
            "suggestions":      [],
            "reply":            "Parsed with fallback. Please review fields."
        }
    except Exception as e:
        return {
            "hcp_name":         "",
            "date":             "",
            "interaction_type": "Meeting",
            "topics":           req.message,
            "sentiment":        "Neutral",
            "outcomes":         "",
            "follow_up":        "",
            "suggestions":      [],
            "reply":            f"Error: {str(e)}"
        }

# ── SAVE INTERACTION ──
@app.post("/interactions")
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    record = InteractionModel(
        hcp_name         = data.hcp_name,
        interaction_type = data.interaction_type,
        date             = data.date,
        time             = data.time,
        attendees        = json.dumps(data.attendees),
        topics           = data.topics,
        materials        = json.dumps(data.materials),
        samples          = json.dumps(data.samples),
        sentiment        = data.sentiment,
        outcomes         = data.outcomes,
        follow_up        = data.follow_up,
        ai_suggestions   = json.dumps(data.ai_suggestions),
        created_at       = str(datetime.utcnow())
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "status": "saved"}

# ── GET ALL INTERACTIONS ──
@app.get("/interactions")
def list_interactions(db: Session = Depends(get_db)):
    records = db.query(InteractionModel)\
                .order_by(InteractionModel.id.desc()).all()
    result = []
    for r in records:
        result.append({
            "id":               r.id,
            "hcp_name":         r.hcp_name,
            "interaction_type": r.interaction_type,
            "date":             r.date,
            "time":             r.time,
            "topics":           r.topics,
            "sentiment":        r.sentiment,
            "outcomes":         r.outcomes,
            "follow_up":        r.follow_up,
            "created_at":       r.created_at
        })
    return result

# ── GET ONE INTERACTION ──
@app.get("/interactions/{interaction_id}")
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    r = db.query(InteractionModel)\
          .filter(InteractionModel.id == interaction_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    return r

# ── UPDATE INTERACTION ──
@app.put("/interactions/{interaction_id}")
def update_interaction(
    interaction_id: int,
    data: InteractionUpdate,
    db: Session = Depends(get_db)
):
    r = db.query(InteractionModel)\
          .filter(InteractionModel.id == interaction_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(r, k, v)
    db.commit()
    return {"id": interaction_id, "status": "updated"}

# ── DELETE INTERACTION ──
@app.delete("/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    r = db.query(InteractionModel)\
          .filter(InteractionModel.id == interaction_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(r)
    db.commit()
    return {"id": interaction_id, "status": "deleted"}

# ── HISTORY ──
@app.get("/history")
def history(db: Session = Depends(get_db)):
    return list_interactions(db)

# ── SENTIMENT ANALYTICS ──
@app.get("/analytics/{hcp_name}")
def analytics(hcp_name: str, db: Session = Depends(get_db)):
    records = db.query(InteractionModel)\
                .filter(InteractionModel.hcp_name.ilike(f"%{hcp_name}%"))\
                .all()
    if not records:
        return {"message": "No data found"}
    score_map = {"Positive": 1, "Neutral": 0, "Negative": -1}
    scores    = [score_map.get(r.sentiment, 0) for r in records]
    avg       = sum(scores) / len(scores)
    return {
        "hcp_name":          hcp_name,
        "total_interactions": len(records),
        "average_sentiment":  round(avg, 2),
        "positive":          scores.count(1),
        "neutral":           scores.count(0),
        "negative":          scores.count(-1),
    }