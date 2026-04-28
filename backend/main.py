from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
import jwt
from datetime import datetime

# Local imports from your project files
from auth_utils import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from schemas import UserInput, DietResponse, UserAuth, FoodLogEntry
from database import users_collection, food_logs_collection, predictions_collection
from ml_model import predict_diet

# Initialize the app
app = FastAPI(title="Diet AI Optimization API")

# --- CORS SETUP ---
# This is required so your React frontend (port 5173) can talk to FastAPI (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your live React app to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTHENTICATION ROUTES ---

@app.post("/register")
async def register_user(user: UserAuth):
    existing_user = await users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_pw = get_password_hash(user.password)
    user_dict = {"username": user.username, "password": hashed_pw, "created_at": datetime.utcnow()}
    await users_collection.insert_one(user_dict)
    return {"message": "User created successfully"}

@app.post("/login")
async def login_user(user: UserAuth):
    db_user = await users_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# --- MIDDLEWARE DEPENDENCY FOR PROTECTED ROUTES ---
# This acts as a guard. If a route has this, the user MUST be logged in.

async def get_current_user(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    try:
        token = token.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


# --- CORE ML PREDICTION ROUTES ---

@app.post("/predict", response_model=DietResponse)
async def get_prediction(user_input: UserInput, username: str = Depends(get_current_user)):
    try:
        # 1. Run the data through your HCMLP model
        prediction = predict_diet(user_input.dict())
        
        # 2. Save the result to MongoDB, attached to this specific user
        record = {
            "username": username,
            "input": user_input.dict(),
            "prediction": prediction,
            "timestamp": datetime.utcnow()
        }
        await predictions_collection.insert_one(record)

        return prediction
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/latest_plan")
async def get_latest_plan(username: str = Depends(get_current_user)):
    # Find the most recent prediction for this user so it stays on their dashboard
    latest = await predictions_collection.find_one(
        {"username": username}, 
        sort=[("timestamp", -1)]
    )
    if not latest:
        return {"has_plan": False}
    
    # We strip the MongoDB ObjectId because it cannot be sent to React natively
    latest["_id"] = str(latest["_id"])
    latest["has_plan"] = True
    return latest


# --- FOOD LOGGING ROUTES ---

@app.post("/log_food")
async def log_food(entry: FoodLogEntry, username: str = Depends(get_current_user)):
    log_dict = entry.dict()
    log_dict["username"] = username
    log_dict["timestamp"] = datetime.utcnow()
    await food_logs_collection.insert_one(log_dict)
    return {"message": "Food logged successfully"}

@app.get("/my_logs")
async def get_my_logs(username: str = Depends(get_current_user)):
    # Retrieve logs for the logged-in user, sorted by date (newest first)
    cursor = food_logs_collection.find({"username": username}).sort("date", -1)
    logs = await cursor.to_list(length=100)
    
    # Convert ObjectId to string so React can read it
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs