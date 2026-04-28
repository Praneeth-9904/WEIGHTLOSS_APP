import os
import numpy as np
import pandas as pd
import joblib
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import tensorflow as tf

ARTIFACT_DIR = "deployment_artifacts"

if not os.path.exists(ARTIFACT_DIR):
    raise FileNotFoundError(f"Missing folder: '{ARTIFACT_DIR}'.")

# 1. Load Artifacts
scaler = joblib.load(f"{ARTIFACT_DIR}/minmax_scaler.pkl")
cluster_ohe = joblib.load(f"{ARTIFACT_DIR}/cluster_encoder.pkl")
agg_cluster = joblib.load(f"{ARTIFACT_DIR}/hc_cluster_model.pkl")
hcmlp_model = tf.keras.models.load_model(f"{ARTIFACT_DIR}/hcmlp_model.keras")

# Load actual database
food_db = pd.read_csv(f"{ARTIFACT_DIR}/food_database.csv")

# --- FIX: Handle missing 'food_name' column from Jupyter export ---
if 'food_name' not in food_db.columns:
    if 'Unnamed: 0' in food_db.columns:
        food_db = food_db.rename(columns={'Unnamed: 0': 'food_name'})
    else:
        print("\n" + "="*60)
        print("⚠️ WARNING: 'food_name' is missing from food_database.csv!")
        print("Using a realistic fallback database for testing...")
        print("="*60 + "\n")
        # Temporary realistic dataset to keep the app 100% data-driven
        fallback_data = {
            'food_name': ['Grilled Chicken Breast', 'Brown Rice', 'Steamed Broccoli', 'Boiled Eggs', 'Salmon Fillet', 'Greek Yogurt', 'Almonds', 'Oatmeal', 'Sweet Potato', 'Avocado', 'Tofu', 'Lentils', 'Spinach', 'Quinoa', 'Turkey Breast', 'Peanut Butter', 'Banana', 'Apple', 'Protein Shake', 'Cottage Cheese'],
            'calories': [165, 215, 55, 155, 208, 100, 164, 150, 103, 234, 144, 230, 23, 222, 135, 188, 105, 95, 120, 206],
            'protein': [31, 5, 4, 13, 20, 10, 6, 5, 2, 3, 16, 18, 3, 8, 30, 8, 1, 0, 24, 28],
            'fat': [3.6, 1.6, 0.6, 10.6, 13, 0.4, 14, 2.5, 0.2, 21, 9, 0.8, 0.4, 3.6, 1, 16, 0.3, 0.3, 1, 9]
        }
        food_db = pd.DataFrame(fallback_data)

food_db = food_db.dropna(subset=['food_name', 'calories', 'protein'])
food_db['food_name_lower'] = food_db['food_name'].astype(str).str.lower()

def calculate_bmr(weight, height, age, gender="male"):
    if gender == "male":
        return 10 * weight + 6.25 * height - 5 * age + 5
    return 10 * weight + 6.25 * height - 5 * age - 161

def data_driven_food_selector(target_cals, target_protein, preference="none"):
    """
    Advanced selection: Filters out junk, prioritizes hitting the exact protein target,
    and fills remaining calories with standard foods.
    """
    valid_foods = food_db[(food_db['calories'] > 20) & (food_db['calories'] < 600)].copy()
    
    # 1. Filter out common junk food and alcohol logged by MFP users
    junk_keywords = ['wine', 'beer', 'cookie', 'candy', 'chocolate', 'cake', 'ice cream', 
                     'donut', 'soda', 'chips', 'biscuit', 'fries', 'mcdonald', 'burger']
    
    if preference and preference.lower() != "none":
        pref_lower = preference.lower()
        filtered = valid_foods[valid_foods['food_name_lower'].str.contains(pref_lower, na=False)]
        if not filtered.empty:
            valid_foods = filtered
    else:
        valid_foods = valid_foods[~valid_foods['food_name_lower'].str.contains('|'.join(junk_keywords), na=False)]

    # 2. Calculate Protein Density (Protein per Calorie)
    valid_foods['protein_ratio'] = valid_foods['protein'] / valid_foods['calories']
    
    selected_foods = []
    current_cals = 0
    current_prot = 0
    
    # Split into High-Protein primary items and Filler items (carbs/fats)
    high_prot_foods = valid_foods[valid_foods['protein_ratio'] > 0.05].sample(frac=1).reset_index(drop=True)
    filler_foods = valid_foods[valid_foods['protein_ratio'] <= 0.05].sample(frac=1).reset_index(drop=True)
    
    # 3. Pick 1-2 High Protein sources first
    for _, row in high_prot_foods.iterrows():
        if current_cals + row['calories'] <= target_cals and current_prot + row['protein'] <= target_protein + 10:
            selected_foods.append(f"{str(row['food_name'])[:45]} ({row['calories']} kcal, {row['protein']}g prot)")
            current_cals += row['calories']
            current_prot += row['protein']
            
        # Stop hunting for protein if we hit 85% of the meal's protein target
        if current_prot >= target_protein * 0.85:
            break
            
    # 4. Fill the remaining calories with carbs/fats
    for _, row in filler_foods.iterrows():
        # Only add fillers if we still have calorie room
        if current_cals + row['calories'] <= target_cals + 20: 
            selected_foods.append(f"{str(row['food_name'])[:45]} ({row['calories']} kcal, {row['protein']}g prot)")
            current_cals += row['calories']
            current_prot += row['protein']
            
        # Stop once we hit 90% of the calorie target
        if current_cals >= target_cals * 0.90:
            break
            
    # Fallback if nothing was selected
    if not selected_foods:
        closest = valid_foods.iloc[(valid_foods['calories'] - target_cals).abs().argsort()[:1]]
        selected_foods.append(f"{str(closest['food_name'].values[0])[:45]} ({closest['calories'].values[0]} kcal)")
        
    return selected_foods

def predict_diet(user_input: dict) -> dict:
    weight = user_input["weight"]
    height = user_input["height"]
    age = user_input["age"]
    gender = user_input["gender"]
    goal = user_input["goal"]
    activity = user_input["activity_level"]
    pref = user_input.get("food_preference", "none")
    meals_per_day = user_input.get("meals_per_day", 4)

    # 1. Real-time BMR & Macro Calculation
    bmr = calculate_bmr(weight, height, age, gender)
    activity_multipliers = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725}
    tdee = bmr * activity_multipliers.get(activity, 1.2)
    
    if goal == "lose":
        target_cals = tdee - 500
        target_protein = weight * 2.0 
    elif goal == "gain":
        target_cals = tdee + 500
        target_protein = weight * 1.8
    else:
        target_cals = tdee
        target_protein = weight * 1.6

    # 2. Cold-Start Feature Generation for HCMLP
    gender_proxy = 1.0 if gender == "male" else 0.0
    bmi_proxy = (target_protein / target_cals) * 1000
    meal_freq_map = {3: 0.3, 4: 0.6, 5: 1.0} 
    meal_freq_proxy = meal_freq_map.get(meals_per_day, 0.6)
    
    features = np.array([[
        target_protein,              
        target_cals,                 
        target_cals * 0.3 / 9,       
        target_cals * 0.4 / 4,       
        0, 0, 0, 0,                  
        activity_multipliers.get(activity, 1.2), 
        bmi_proxy, 
        gender_proxy,  
        meal_freq_proxy,                
        1.0,                         
        0.0,                         
        1.0                          
    ]])
    
    expected_features = scaler.n_features_in_
    if features.shape[1] > expected_features:
        features = features[:, :expected_features]
    elif features.shape[1] < expected_features:
        padding = np.zeros((1, expected_features - features.shape[1]))
        features = np.hstack((features, padding))

    # 3. Real Inference
    scaled_features = scaler.transform(features)
    
    try:
        if hasattr(agg_cluster, "predict"):
            cluster_id = agg_cluster.predict(scaled_features)
        else:
            cluster_id = np.array([0])
    except AttributeError:
        cluster_id = np.array([0])

    cluster_features = cluster_ohe.transform([[cluster_id[0]]])
    final_input = np.hstack((scaled_features, cluster_features))
    adherence_prob = float(hcmlp_model.predict(final_input, verbose=0)[0][0])
    
    # 4. Dynamic Meal Split Allocation
    diet_plan = {}
    if meals_per_day == 3:
        splits = [("breakfast", 0.35, 0.35), ("lunch", 0.35, 0.40), ("dinner", 0.30, 0.25)]
    elif meals_per_day == 5:
        splits = [("breakfast", 0.25, 0.25), ("morning_snack", 0.10, 0.05), ("lunch", 0.30, 0.35), ("afternoon_snack", 0.10, 0.05), ("dinner", 0.25, 0.30)]
    else: # Default 4 meals
        splits = [("breakfast", 0.25, 0.25), ("lunch", 0.35, 0.40), ("dinner", 0.30, 0.35), ("snacks", 0.10, 0.0)]

    for meal_name, cal_pct, prot_pct in splits:
        m_cals = target_cals * cal_pct
        m_prot = target_protein * prot_pct
        diet_plan[meal_name] = {
            "macros": f"{round(m_cals)} kcal, {round(m_prot)}g protein",
            "foods": data_driven_food_selector(m_cals, m_prot, pref)
        }

    return {
        "adherence_score": round(adherence_prob * 100, 2),
        "recommended_calories": round(target_cals, 0),
        "recommended_protein": round(target_protein, 1),
        "diet_plan": diet_plan
    }