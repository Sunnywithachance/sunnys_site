"use client";

import { useMemo, useState } from "react";

const FOOD_LIST = [
  "Artichoke",
  "Asparagus",
  "Beetroot",
  "Bell Pepper",
  "Broccoli",
  "Brussels Sprouts",
  "Carrot",
  "Cauliflower",
  "Celery",
  "Chard",
  "Collard Greens",
  "Corn",
  "Cucumber",
  "Eggplant",
  "Fennel",
  "Garlic",
  "Green Beans",
  "Kale",
  "Leek",
  "Lettuce",
  "Mushroom",
  "Okra",
  "Onion",
  "Parsnip",
  "Peas",
  "Potato",
  "Pumpkin",
  "Radish",
  "Spinach",
  "Sweet Potato",
  "Tomato",
  "Turnip",
  "Zucchini"
];

export default function Page() {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const suggestions = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];

    return FOOD_LIST.filter((food) => food.toLowerCase().includes(value)).slice(0, 8);
  }, [query]);

  const handleSelect = (food) => {
    setQuery(food);
    setShowDropdown(false);
  };

  return (
    <main className="page">
      <div className="container">
        <h1>start typing</h1>
        <div className="inputWrap">
          <input
            type="text"
            placeholder="Type a food name..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            autoComplete="off"
          />

          {showDropdown && suggestions.length > 0 ? (
            <ul className="suggestions" aria-label="Food suggestions">
              {suggestions.map((food) => (
                <li key={food}>
                  <button type="button" onClick={() => handleSelect(food)}>
                    {food}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </main>
  );
}
