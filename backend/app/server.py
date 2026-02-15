"""
DragonFit API - Gym Training Tracker
"""
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx
from io import BytesIO
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from bson import ObjectId

app = FastAPI(title="DragonFit API")

origins = [
    "https://dragon-fit-frontend.vercel.app",
]
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
MONGO_URL = os.environ['MONGO_URL']
# DB_NAME = os.environ.get("DB_NAME", "dragonfit")
client = MongoClient(MONGO_URL)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get("JWT_SECRET", "dragonfit_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Pydantic Models ---

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None

class ExerciseBase(BaseModel):
    name: str
    sets: str = ""  # e.g. "3x10-12"
    notes: str = ""

class ExerciseLog(BaseModel):
    weight: str = ""  # e.g. "80kg"
    reps: str = ""    # e.g. "10,10,8"
    notes: str = ""

class TrainingDayBase(BaseModel):
    day_number: int
    name: str  # e.g. "Pull 1"
    exercises: List[ExerciseBase] = []

class WorkoutCreate(BaseModel):
    name: str
    description: str = ""
    days: List[TrainingDayBase] = []

class WorkoutUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    days: Optional[List[TrainingDayBase]] = None

class SessionLogEntry(BaseModel):
    exercise_index: int
    weight: str
    reps: str
    notes: str = ""

class SessionCreate(BaseModel):
    workout_id: str
    day_index: int
    date: Optional[str] = None
    exercises: List[SessionLogEntry] = []

# --- Auth Helpers ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(request: Request) -> User:
    # Try cookie first, then Authorization header
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's an OAuth session token
    session = db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        user = db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if user:
            return User(**user)
    
    # Try JWT token
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.users.find_one({"user_id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Auth Endpoints ---

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    if db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": get_password_hash(user_data.password),
        "picture": None,
        "created_at": datetime.now(timezone.utc)
    }
    db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user_id})
    return {
        "token": token,
        "user": {"user_id": user_id, "email": user_data.email, "name": user_data.name}
    }

@app.post("/api/auth/login")
async def login(user_data: UserLogin, response: Response):
    user = db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["user_id"]})
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    return {
        "token": token,
        "user": {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture")}
    }

@app.post("/api/auth/session")
async def create_session(request: Request, response: Response):
    """Process OAuth session_id and create local session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Exchange session_id for user data
    async with httpx.AsyncClient() as client_http:
        try:
            resp = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            oauth_data = resp.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")
    
    email = oauth_data.get("email")
    name = oauth_data.get("name")
    picture = oauth_data.get("picture")
    session_token = oauth_data.get("session_token")
    
    # Find or create user
    existing_user = db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "password_hash": None,
            "created_at": datetime.now(timezone.utc)
        })
    
    # Store session
    db.user_sessions.delete_many({"user_id": user_id})
    db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    return {
        "user": {"user_id": user_id, "email": email, "name": name, "picture": picture},
        "token": session_token
    }

@app.get("/api/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return user

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# --- Workout Endpoints ---

@app.get("/api/workouts")
async def get_workouts(user: User = Depends(get_current_user)):
    workouts = list(db.workouts.find({"user_id": user.user_id}, {"_id": 0}))
    return workouts

@app.post("/api/workouts")
async def create_workout(workout: WorkoutCreate, user: User = Depends(get_current_user)):
    workout_id = f"workout_{uuid.uuid4().hex[:12]}"
    workout_doc = {
        "workout_id": workout_id,
        "user_id": user.user_id,
        "name": workout.name,
        "description": workout.description,
        "days": [day.model_dump() for day in workout.days],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.workouts.insert_one(workout_doc)
    workout_doc.pop("_id", None)
    return workout_doc

@app.get("/api/workouts/{workout_id}")
async def get_workout(workout_id: str, user: User = Depends(get_current_user)):
    workout = db.workouts.find_one(
        {"workout_id": workout_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout

@app.put("/api/workouts/{workout_id}")
async def update_workout(workout_id: str, workout: WorkoutUpdate, user: User = Depends(get_current_user)):
    existing = db.workouts.find_one({"workout_id": workout_id, "user_id": user.user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    update_data = {}
    if workout.name is not None:
        update_data["name"] = workout.name
    if workout.description is not None:
        update_data["description"] = workout.description
    if workout.days is not None:
        update_data["days"] = [day.model_dump() for day in workout.days]
    
    if update_data:
        db.workouts.update_one({"workout_id": workout_id}, {"$set": update_data})
    
    updated = db.workouts.find_one({"workout_id": workout_id}, {"_id": 0})
    return updated

@app.delete("/api/workouts/{workout_id}")
async def delete_workout(workout_id: str, user: User = Depends(get_current_user)):
    result = db.workouts.delete_one({"workout_id": workout_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workout not found")
    # Also delete related sessions
    db.training_sessions.delete_many({"workout_id": workout_id, "user_id": user.user_id})
    return {"message": "Workout deleted"}

# --- Training Session Endpoints ---

@app.get("/api/sessions")
async def get_sessions(workout_id: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {"user_id": user.user_id}
    if workout_id:
        query["workout_id"] = workout_id
    sessions = list(db.training_sessions.find(query, {"_id": 0}).sort("date", -1))
    return sessions

@app.post("/api/sessions")
async def create_session(session: SessionCreate, user: User = Depends(get_current_user)):
    # Verify workout exists
    workout = db.workouts.find_one({"workout_id": session.workout_id, "user_id": user.user_id})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    session_id = f"session_{uuid.uuid4().hex[:12]}"
    session_doc = {
        "session_id": session_id,
        "user_id": user.user_id,
        "workout_id": session.workout_id,
        "workout_name": workout["name"],
        "day_index": session.day_index,
        "day_name": workout["days"][session.day_index]["name"] if session.day_index < len(workout["days"]) else "",
        "date": session.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "exercises": [e.model_dump() for e in session.exercises],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.training_sessions.insert_one(session_doc)
    session_doc.pop("_id", None)
    return session_doc

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str, user: User = Depends(get_current_user)):
    session = db.training_sessions.find_one(
        {"session_id": session_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, user: User = Depends(get_current_user)):
    result = db.training_sessions.delete_one({"session_id": session_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}

# --- Progress/Stats Endpoints ---

@app.get("/api/progress")
async def get_progress(user: User = Depends(get_current_user)):
    """Get progress data for charts"""
    sessions = list(db.training_sessions.find({"user_id": user.user_id}, {"_id": 0}).sort("date", 1))
    
    # Group by workout and exercise
    progress_data = {}
    for session in sessions:
        workout_id = session["workout_id"]
        if workout_id not in progress_data:
            progress_data[workout_id] = {
                "workout_name": session.get("workout_name", ""),
                "sessions_count": 0,
                "exercises": {}
            }
        progress_data[workout_id]["sessions_count"] += 1
        
        for ex in session.get("exercises", []):
            ex_idx = ex["exercise_index"]
            if ex_idx not in progress_data[workout_id]["exercises"]:
                progress_data[workout_id]["exercises"][ex_idx] = []
            
            # Parse weight (extract first number)
            weight_str = ex.get("weight", "0")
            try:
                weight = float(weight_str.replace("kg", "").replace(",", ".").split("x")[0].strip())
            except:
                weight = 0
            
            progress_data[workout_id]["exercises"][ex_idx].append({
                "date": session["date"],
                "weight": weight,
                "reps": ex.get("reps", "")
            })
    
    return progress_data

@app.get("/api/stats")
async def get_stats(user: User = Depends(get_current_user)):
    """Get general statistics"""
    total_workouts = db.workouts.count_documents({"user_id": user.user_id})
    total_sessions = db.training_sessions.count_documents({"user_id": user.user_id})
    
    # Sessions this week
    week_start = (datetime.now(timezone.utc) - timedelta(days=datetime.now(timezone.utc).weekday())).strftime("%Y-%m-%d")
    sessions_this_week = db.training_sessions.count_documents({
        "user_id": user.user_id,
        "date": {"$gte": week_start}
    })
    
    # Calculate total volume (simplified)
    all_sessions = list(db.training_sessions.find({"user_id": user.user_id}, {"_id": 0}))
    total_volume = 0
    for session in all_sessions:
        for ex in session.get("exercises", []):
            try:
                weight = float(ex.get("weight", "0").replace("kg", "").replace(",", ".").split("x")[0].strip())
                reps_str = ex.get("reps", "0")
                reps = sum([int(r.strip()) for r in reps_str.split(",") if r.strip().isdigit()])
                total_volume += weight * reps
            except:
                pass
    
    return {
        "total_workouts": total_workouts,
        "total_sessions": total_sessions,
        "sessions_this_week": sessions_this_week,
        "total_volume": round(total_volume, 1)
    }

# --- Export Endpoints ---

@app.get("/api/export/excel/{workout_id}")
async def export_excel(workout_id: str, user: User = Depends(get_current_user)):
    workout = db.workouts.find_one({"workout_id": workout_id, "user_id": user.user_id}, {"_id": 0})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    sessions = list(db.training_sessions.find(
        {"workout_id": workout_id, "user_id": user.user_id},
        {"_id": 0}
    ).sort("date", 1))
    
    wb = Workbook()
    ws = wb.active
    ws.title = workout["name"][:31]  # Excel sheet name limit
    
    # Header
    ws.append(["DragonFit - " + workout["name"]])
    ws.append([])
    
    for day in workout.get("days", []):
        ws.append([f"Día {day['day_number']}: {day['name']}"])
        ws.append(["Ejercicio", "Series/Reps", "Notas"] + [s["date"] for s in sessions if s.get("day_index") == day["day_number"]-1])
        
        for i, exercise in enumerate(day.get("exercises", [])):
            row = [exercise["name"], exercise.get("sets", ""), exercise.get("notes", "")]
            # Add session data
            for session in sessions:
                if session.get("day_index") == day["day_number"]-1:
                    ex_data = next((e for e in session.get("exercises", []) if e["exercise_index"] == i), None)
                    if ex_data:
                        row.append(f"{ex_data.get('weight', '')} - {ex_data.get('reps', '')}")
                    else:
                        row.append("")
            ws.append(row)
        ws.append([])
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=DragonFit_{workout['name']}.xlsx"}
    )

@app.get("/api/export/pdf/{workout_id}")
async def export_pdf(workout_id: str, user: User = Depends(get_current_user)):
    workout = db.workouts.find_one({"workout_id": workout_id, "user_id": user.user_id}, {"_id": 0})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    sessions = list(db.training_sessions.find(
        {"workout_id": workout_id, "user_id": user.user_id},
        {"_id": 0}
    ).sort("date", -1).limit(10))
    
    output = BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#22c55e')
    )
    
    elements.append(Paragraph(f"DragonFit - {workout['name']}", title_style))
    elements.append(Spacer(1, 20))
    
    for day in workout.get("days", []):
        elements.append(Paragraph(f"Día {day['day_number']}: {day['name']}", styles['Heading2']))
        
        table_data = [["Ejercicio", "Series/Reps", "Notas"]]
        for exercise in day.get("exercises", []):
            table_data.append([exercise["name"], exercise.get("sets", ""), exercise.get("notes", "")])
        
        table = Table(table_data, colWidths=[200, 100, 150])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#18181b')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#27272a'))
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))
    
    doc.build(elements)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=DragonFit_{workout['name']}.pdf"}
    )

@app.get("/api/health")
async def health():
    return {"status": "healthy", "app": "DragonFit"}

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str, user=Depends(get_current_user)):

    # 1️⃣ Buscar sesión
    session = db.sessions.find_one({
        "session_id": session_id,
        "user_id": user["user_id"]
    })

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 2️⃣ Convertir ObjectId para que FastAPI pueda serializarlo
    session["_id"] = str(session["_id"])

    # 3️⃣ Buscar workout para obtener nombres de ejercicios
    workout = db.workouts.find_one({
        "workout_id": session["workout_id"],
        "user_id": user["user_id"]
    })

    if workout:
        # Añadir nombre de ejercicio a cada registro
        for exercise in session["exercises"]:
            index = exercise.get("exercise_index")

            if (
                "days" in workout
                and session["day_index"] < len(workout["days"])
                and index < len(workout["days"][session["day_index"]]["exercises"])
            ):
                exercise["exercise_name"] = workout["days"][session["day_index"]]["exercises"][index]["name"]
            else:
                exercise["exercise_name"] = "Ejercicio"

    return session
