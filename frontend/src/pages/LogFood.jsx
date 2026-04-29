import { useState, useEffect } from "react";

export default function LogFood() {
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    meal_type: "Breakfast",
    food_item: "",
    calories: "",
    protein: ""
  });

  const fetchLogs = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("weightlossapp-production.up.railway.app/my_logs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setLogs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("weightlossapp-production.up.railway.app/log_food", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          calories: parseInt(formData.calories),
          protein: parseFloat(formData.protein)
        }),
      });
      if (res.ok) {
        setFormData({ ...formData, food_item: "", calories: "", protein: "" });
        fetchLogs(); // Refresh the list
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 grid md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Log Your Meal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Meal Type</label>
              <select value={formData.meal_type} onChange={(e) => setFormData({...formData, meal_type: e.target.value})} className="w-full p-2 border rounded">
                <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Food Item</label>
            <input type="text" value={formData.food_item} onChange={(e) => setFormData({...formData, food_item: e.target.value})} required placeholder="e.g., Grilled Chicken" className="w-full p-2 border rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Calories (kcal)</label>
              <input type="number" value={formData.calories} onChange={(e) => setFormData({...formData, calories: e.target.value})} required className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Protein (g)</label>
              <input type="number" step="0.1" value={formData.protein} onChange={(e) => setFormData({...formData, protein: e.target.value})} required className="w-full p-2 border rounded" />
            </div>
          </div>
          <button type="submit" className="w-full bg-teal-600 text-white p-3 rounded font-bold hover:bg-teal-700 transition">Save Log</button>
        </form>
      </div>

      <div className="bg-teal-50 p-6 rounded-xl shadow border border-teal-100 h-96 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-teal-800">Your History</h2>
        {logs.length === 0 ? <p className="text-gray-500">No meals logged yet.</p> : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log._id} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-teal-700">{log.meal_type} - {log.date}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{log.calories} kcal | {log.protein}g prot</span>
                </div>
                <p className="text-gray-800">{log.food_item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}