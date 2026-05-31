import { useState, useEffect } from 'react';
import { useAuth }             from '../../context/AuthContext';
import { nutritionAPI }        from '../../api';
import Spinner from '../../components/common/Spinner';
import toast   from 'react-hot-toast';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const MacroBar = ({ label, value, max, color }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">{label}</span>
            <span className="text-white font-medium">{value}g</span>
        </div>
        <div className="h-2 bg-dark rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all ${color}`}
                style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
            />
        </div>
    </div>
);

const NutritionPage = () => {
    const { user }     = useAuth();
    const today        = new Date().toISOString().split('T')[0];

    const [selectedDate,  setSelectedDate]  = useState(today);
    const [dailyLog,      setDailyLog]      = useState(null);
    const [searchQuery,   setSearchQuery]   = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching,     setSearching]     = useState(false);
    const [loading,       setLoading]       = useState(true);
    const [selectedMeal,  setSelectedMeal]  = useState('Breakfast');
    const [selectedFood,  setSelectedFood]  = useState(null);
    const [quantity,      setQuantity]      = useState(100);
    const [logging,       setLogging]       = useState(false);

    useEffect(() => {
        fetchDailyLog();
    }, [selectedDate]);

    const fetchDailyLog = async () => {
        try {
            setLoading(true);
            const res = await nutritionAPI.getDailyLog(user._id, selectedDate);
            setDailyLog(res.data);
        } catch {
            toast.error('Failed to load nutrition data');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await nutritionAPI.search(searchQuery);
            setSearchResults(res.data);
        } catch {
            toast.error('Food search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleLogFood = async () => {
        if (!selectedFood) return toast.error('Select a food first');
        setLogging(true);
        try {
            await nutritionAPI.logFood({
                date:          selectedDate,
                mealType:      selectedMeal,
                foodName:      selectedFood.label,
                quantity,
                unit:          'g',
                calories:      selectedFood.nutrients.calories,
                protein:       selectedFood.nutrients.protein,
                carbohydrates: selectedFood.nutrients.carbs,
                fat:           selectedFood.nutrients.fat,
            });
            toast.success('Food logged!');
            setSelectedFood(null);
            setSearchResults([]);
            setSearchQuery('');
            fetchDailyLog();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log food');
        } finally {
            setLogging(false);
        }
    };

    const handleDelete = async (entryId) => {
        try {
            await nutritionAPI.deleteEntry(entryId);
            toast.success('Entry removed');
            fetchDailyLog();
        } catch {
            toast.error('Failed to delete entry');
        }
    };

    const totals = dailyLog?.totals || {
        calories: 0, protein: 0, carbohydrates: 0, fat: 0,
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">🥗 Nutrition</h1>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-card border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
            </div>

            {/* Daily Summary */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">📊 Daily Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Calories', value: totals.calories, unit: 'kcal', color: 'text-orange-400' },
                        { label: 'Protein',  value: totals.protein,  unit: 'g',    color: 'text-red-400'    },
                        { label: 'Carbs',    value: totals.carbohydrates, unit: 'g', color: 'text-yellow-400' },
                        { label: 'Fat',      value: totals.fat,      unit: 'g',    color: 'text-blue-400'   },
                    ].map((macro) => (
                        <div key={macro.label} className="bg-dark rounded-xl p-4 text-center">
                            <p className={`text-2xl font-bold ${macro.color}`}>
                                {macro.value}
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                                {macro.label} ({macro.unit})
                            </p>
                        </div>
                    ))}
                </div>

                {/* Macro Bars */}
                <div className="space-y-3">
                    <MacroBar label="Protein"       value={totals.protein}       max={200} color="bg-red-400"    />
                    <MacroBar label="Carbohydrates" value={totals.carbohydrates} max={300} color="bg-yellow-400" />
                    <MacroBar label="Fat"           value={totals.fat}           max={100} color="bg-blue-400"   />
                </div>
            </div>

            {/* Food Search */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-semibold">🔍 Add Food</h2>

                {/* Meal selector */}
                <div className="flex gap-2 flex-wrap">
                    {MEALS.map((meal) => (
                        <button
                            key={meal}
                            onClick={() => setSelectedMeal(meal)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                                selectedMeal === meal
                                    ? 'bg-primary border-primary text-white'
                                    : 'bg-dark border-border text-slate-400 hover:border-primary'
                            }`}
                        >
                            {meal}
                        </button>
                    ))}
                </div>

                {/* Search bar */}
                <div className="flex gap-2">
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search for a food... e.g. banana, chicken"
                        className="flex-1 bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={searching}
                        className="bg-primary text-white px-5 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {searching ? <Spinner size="sm" /> : 'Search'}
                    </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {searchResults.map((food) => (
                            <div
                                key={food.fdcId}
                                onClick={() => setSelectedFood(food)}
                                className={`p-3 rounded-xl border cursor-pointer transition ${
                                    selectedFood?.fdcId === food.fdcId
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border bg-dark hover:border-primary'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-white text-sm font-medium">
                                        {food.label}
                                    </p>
                                    <span className="text-orange-400 text-sm font-bold">
                                        {food.nutrients.calories} kcal
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs mt-1">
                                    P: {food.nutrients.protein}g ·
                                    C: {food.nutrients.carbs}g ·
                                    F: {food.nutrients.fat}g
                                    <span className="ml-1">(per 100g)</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Log selected food */}
                {selectedFood && (
                    <div className="bg-dark border border-primary rounded-xl p-4 space-y-3">
                        <p className="text-white font-medium">
                            Selected: {selectedFood.label}
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-slate-400 text-xs mb-1">
                                    Quantity (grams)
                                </label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-orange-400 font-bold text-lg">
                                    {Math.round(selectedFood.nutrients.calories * quantity / 100)} kcal
                                </p>
                                <p className="text-slate-400 text-xs">
                                    for {quantity}g
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogFood}
                            disabled={logging}
                            className="w-full bg-primary text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {logging ? <Spinner size="sm" /> : `Add to ${selectedMeal}`}
                        </button>
                    </div>
                )}
            </div>

            {/* Daily Meals */}
            <div className="space-y-4">
                {MEALS.map((meal) => {
                    const entries = dailyLog?.grouped?.[meal] || [];
                    return (
                        <div
                            key={meal}
                            className="bg-card border border-border rounded-2xl p-5"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-white font-semibold">{meal}</h3>
                                <span className="text-slate-400 text-sm">
                                    {entries.reduce((a, e) => a + e.calories, 0)} kcal
                                </span>
                            </div>

                            {entries.length === 0 ? (
                                <p className="text-slate-600 text-sm">Nothing logged yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {entries.map((entry) => (
                                        <div
                                            key={entry._id}
                                            className="flex items-center justify-between bg-dark rounded-lg px-4 py-2"
                                        >
                                            <div>
                                                <p className="text-white text-sm">
                                                    {entry.foodName}
                                                </p>
                                                <p className="text-slate-500 text-xs">
                                                    {entry.quantity}{entry.unit} · P:{entry.protein}g C:{entry.carbohydrates}g F:{entry.fat}g
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-orange-400 text-sm font-medium">
                                                    {entry.calories} kcal
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(entry._id)}
                                                    className="text-slate-600 hover:text-red-400 transition"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NutritionPage;