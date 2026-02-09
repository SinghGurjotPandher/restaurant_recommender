import { useState, useCallback, memo } from 'react';
import { UserPlus, MapPin, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const CUISINES = [
  'American',
  'Mexican',
  'Italian',
  'Chinese',
  'Japanese',
  'Korean',
  'Thai',
  'Vietnamese',
  'Indian',
  'Mediterranean',
  'Fast Food',
  'Seafood',
];

const DIETARY_OPTIONS = [
  { value: '', label: 'No restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'gluten-free', label: 'Gluten-Free' },
];

const BUDGET_LABELS = ['$', '$$', '$$$', '$$$$'];

function PreferenceForm({ onAddUser, location, locationStatus, onRequestLocation }) {
  const [name, setName] = useState('');
  const [cuisines, setCuisines] = useState([]);
  const [budget, setBudget] = useState(2);
  const [dietary, setDietary] = useState('');

  // Toggle cuisine selection
  const toggleCuisine = useCallback((cuisine) => {
    setCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;

    onAddUser({
      name: name.trim(),
      cuisines,
      budget,
      dietary: dietary || null,
    });

    // Reset form
    setName('');
    setCuisines([]);
    setBudget(2);
    setDietary('');
  }, [name, cuisines, budget, dietary, onAddUser]);

  // Location status icon
  const LocationIcon = () => {
    switch (locationStatus) {
      case 'loading':
        return <Loader2 className="animate-spin" />;
      case 'success':
        return <CheckCircle2 />;
      case 'error':
        return <XCircle />;
      default:
        return <MapPin />;
    }
  };

  // Location status text
  const getLocationText = () => {
    switch (locationStatus) {
      case 'loading':
        return 'Getting location...';
      case 'success':
        return `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      case 'error':
        return 'Location unavailable - using default';
      default:
        return 'Click to use your location';
    }
  };

  return (
    <div className="preference-form">
      {/* Name Input */}
      <div className="form-section">
        <label className="form-label" htmlFor="name-input">
          Name
        </label>
        <input
          id="name-input"
          type="text"
          className="form-input"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {/* Cuisine Selection */}
      <div className="form-section">
        <label className="form-label">Preferred Cuisines</label>
        <div className="cuisine-grid">
          {CUISINES.map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              className={`cuisine-btn ${cuisines.includes(cuisine) ? 'selected' : ''}`}
              onClick={() => toggleCuisine(cuisine)}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Slider */}
      <div className="form-section">
        <label className="form-label">Max Budget</label>
        <div className="budget-container">
          <input
            type="range"
            className="budget-slider"
            min="1"
            max="4"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
          <div className="budget-labels">
            <span>Budget</span>
            <span>Fancy</span>
          </div>
          <div className="budget-display">
            {BUDGET_LABELS[budget - 1]}
          </div>
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div className="form-section">
        <label className="form-label" htmlFor="dietary-select">
          Dietary Restriction
        </label>
        <select
          id="dietary-select"
          className="form-select"
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
        >
          {DIETARY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="form-section">
        <label className="form-label">Location</label>
        <button
          type="button"
          className={`location-status ${locationStatus}`}
          onClick={onRequestLocation}
          disabled={locationStatus === 'loading'}
        >
          <LocationIcon />
          <span>{getLocationText()}</span>
        </button>
      </div>

      {/* Add Button */}
      <button
        type="button"
        className="add-btn"
        onClick={handleSubmit}
        disabled={!name.trim()}
      >
        <UserPlus strokeWidth={2.5} />
        <span>Add to Group</span>
      </button>
    </div>
  );
}

export default memo(PreferenceForm);
