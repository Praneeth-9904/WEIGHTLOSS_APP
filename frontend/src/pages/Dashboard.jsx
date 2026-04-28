import { useState, useEffect } from "react";

export default function Dashboard() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    weight: "",
    height: "",
    goal: "lose",
    activity_level: "moderate",
    meals_per_day: "4",
    food_preference: "none"
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch the user's existing plan when they open the dashboard
  useEffect(() => {
    const fetchExistingPlan = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:8000/latest_plan", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.has_plan) {
            setResult(data.prediction);
          }
        }
      } catch (err) {
        console.error("No existing plan found");
      }
    };
    fetchExistingPlan();
  }, []);

  // 2. Handle user typing.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 3. Handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          age: parseInt(formData.age),
          gender: formData.gender,
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          goal: formData.goal,
          activity_level: formData.activity_level,
          meals_per_day: parseInt(formData.meals_per_day),
          food_preference: formData.food_preference
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch prediction");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 grid md:grid-cols-2 gap-8">
      {/* INPUT FORM SECTION */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Enter Your Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleInputChange} required className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-2 border rounded">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
              <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleInputChange} required className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Height (cm)</label>
              <input type="number" step="0.1" name="height" value={formData.height} onChange={handleInputChange} required className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Goal</label>
              <select name="goal" value={formData.goal} onChange={handleInputChange} className="w-full p-2 border rounded">
                <option value="lose">Weight Loss</option>
                <option value="maintain">Maintain</option>
                <option value="gain">Weight Gain</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Activity Level</label>
              <select name="activity_level" value={formData.activity_level} onChange={handleInputChange} className="w-full p-2 border rounded">
                <option value="sedentary">Sedentary</option>
                <option value="light">Lightly Active</option>
                <option value="moderate">Moderately Active</option>
                <option value="active">Very Active</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Meals Per Day</label>
              <select name="meals_per_day" value={formData.meals_per_day} onChange={handleInputChange} className="w-full p-2 border rounded">
                <option value="3">3 Meals (Standard)</option>
                <option value="4">4 Meals (+ 1 Snack)</option>
                <option value="5">5 Meals (+ 2 Snacks)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Food Preferences / Keywords</label>
            <input 
              type="text" 
              name="food_preference" 
              value={formData.food_preference} 
              onChange={handleInputChange} 
              placeholder="e.g., chicken, vegan, rice, eggs (or leave as 'none')" 
              className="w-full p-2 border rounded" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-600 text-white p-3 rounded font-bold hover:bg-teal-700 disabled:bg-teal-300 transition mt-4"
          >
            {loading ? "Generating Plan..." : "Generate Optimal Diet"}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>

      {/* RESULTS SECTION */}
      <div>
        {result ? (
          <div className="bg-teal-50 p-6 rounded-xl shadow border border-teal-100">
            <h2 className="text-2xl font-bold mb-4 text-teal-800">Your Optimized Plan</h2>
            <div className="mb-4">
              <p className="text-lg">Expected Adherence (HCMLP AI): 
                <span className="font-bold text-green-600 ml-2">{result.adherence_score}%</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded shadow-sm text-center">
                <p className="text-sm text-gray-500">Daily Calories</p>
                <p className="text-2xl font-bold">{result.recommended_calories}</p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm text-center">
                <p className="text-sm text-gray-500">Protein Target</p>
                <p className="text-2xl font-bold">{result.recommended_protein}g</p>
              </div>
            </div>
            
            <h3 className="font-bold mb-3 text-lg">Meal Distribution:</h3>
            <div className="space-y-4">
              {Object.entries(result.diet_plan).map(([mealName, mealData]) => (
                <div key={mealName} className="bg-white p-4 rounded shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold capitalize text-teal-700 text-lg">
                      {mealName === "breakfast" ? "🍳 " : mealName === "lunch" ? "🥗 " : mealName === "dinner" ? "🍽️ " : mealName === "morning_snack" || mealName === "afternoon_snack" ? "🍎 " : "🍎 "}
                      {mealName.replace("_", " ")}
                    </h4>
                    <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {mealData.macros}
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-gray-700 ml-2">
                    {mealData.foods.map((food, idx) => (
                      <li key={idx} className="text-sm">{food}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 text-gray-400 text-center">
            Fill out the form and click generate to see your AI-optimized diet plan here.
          </div>
        )}
      </div>
    </div>
  );
}