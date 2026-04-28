from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class UserInput(BaseModel):
    age: int = Field(..., gt=10, lt=100)
    gender: str = Field(..., description="'male' or 'female'")
    weight: float = Field(..., description="Weight in kg")
    height: float = Field(..., description="Height in cm")
    goal: str = Field(..., description="'lose', 'maintain', or 'gain'")
    activity_level: str = Field(..., description="'sedentary', 'light', 'moderate', 'active'")
    food_preference: Optional[str] = "none"
    meals_per_day: int = Field(4, description="Number of meals: 3, 4, or 5") # NEW

class MealPlan(BaseModel):
    macros: str
    foods: List[str]

class DietResponse(BaseModel):
    adherence_score: float
    recommended_calories: float
    recommended_protein: float
    diet_plan: Dict[str, MealPlan]
class UserAuth(BaseModel):
    username: str
    password: str

class FoodLogEntry(BaseModel):
    date: str # Format: YYYY-MM-DD
    meal_type: str # Breakfast, Lunch, Dinner, Snack
    food_item: str
    calories: int
    protein: float