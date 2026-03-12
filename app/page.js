"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

const NUTRIENT_ROWS = [
  { key: "energy", label: "Energy", unit: "kcal/kJ" },
  { key: "total_fat_g", label: "Total Fat", unit: "g" },
  { key: "saturated_fat_g", label: "Saturated Fat", unit: "g" },
  { key: "carbohydrates_g", label: "Carbs", unit: "g" },
  { key: "sugars_g", label: "Sugars", unit: "g" },
  { key: "protein_g", label: "Protein", unit: "g" },
  { key: "sodium_mg", label: "Salt/Sodium", unit: "mg" },
  { key: "dietary_fibre_g", label: "Dietary Fibre", unit: "g" }
];
const QUICK_FOODS = ["carrots", "cream cheese", "avocado", "coffee", "olive oil", "milk chocolate"];
const DEMO_TEXT = "Tromboncino squash";
const DEMO_TRIM_COUNT = 17;
const LOADING_TEXT = "lemme see";
const LOADING_TRIM_COUNT = 9;
const CONDITION_OPTIONS = ["IBS", "Menopause"];
const CONDITION_SEVERITY_OPTIONS = [
  "Very mild (occasional symptoms)",
  "Mild (noticeable but manageable)",
  "Moderate (regular symptoms)",
  "Moderately severe (frequent disruption)",
  "Severe (major daily impact)"
];
const CONDITION_SUBTYPE_OPTIONS = {
  IBS: ["IBS-C", "IBS-D", "IBS-M", "IBS-U"],
  Menopause: ["Perimenopause", "Postmenopause", "Surgical menopause", "Unknown stage"]
};
const initialSectionState = (mayTriggerIbs) => ({
  summary: true,
  details: true,
  advice: true,
  nutrition: true
});

const parsePortionAdvice = (text) => {
  if (!text || typeof text !== "string") {
    return { portion: "Not specified", explanation: "" };
  }

  const trimmed = text.trim();
  const rangeMatch = trimmed.match(/(\d+\s*(?:-\s*\d+)?\s*[a-zA-Z]+)/);
  const parenMatch = trimmed.match(/\(([^)]+)\)/);

  const portion = parenMatch?.[1] || rangeMatch?.[1] || "Not specified";
  const explanation = trimmed.replace(/\(([^)]+)\)/, "").trim();

  return { portion, explanation: explanation || trimmed };
};

export default function Page() {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [selectedHistoryKey, setSelectedHistoryKey] = useState("");
  const [isSessionHistoryOpen, setIsSessionHistoryOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [hasCompletedHealthDetails, setHasCompletedHealthDetails] = useState(false);
  const [profileFilters, setProfileFilters] = useState({
    conditions: [{ id: 1, type: "IBS", subtype: "IBS-M", severity: "Moderate (regular symptoms)", details: "" }],
    gender: "",
    age: "",
    height_ft: "",
    height_in: "",
    weight_lb: "",
    diet_type: "",
    notes: ""
  });
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [demoLength, setDemoLength] = useState(DEMO_TEXT.length);
  const [isDeletingDemo, setIsDeletingDemo] = useState(false);
  const [loadingTextLength, setLoadingTextLength] = useState(LOADING_TEXT.length);
  const [isDeletingLoadingText, setIsDeletingLoadingText] = useState(false);
  const [openSections, setOpenSections] = useState(initialSectionState(false));
  const inputRef = useRef(null);
  const portionAdviceParsed = parsePortionAdvice(lookupResult?.portion_advice);
  const isInvalidInput = lookupResult?.input_validity === "Invalid";
  const confidenceScore = lookupResult?.evidence_confidence === "High" ? 3 : lookupResult?.evidence_confidence === "Moderate" ? 2 : 1;
  const nutritionData = lookupResult?.nutrition_per_serving ?? lookupResult?.nutrition_per_100g ?? null;
  const nutritionServingLabel = lookupResult?.serving_size?.trim() || "1 serving";
  const fodmapDetails = [
    { key: "oligosaccharides", label: "Oligo", value: Boolean(lookupResult?.fodmap_details?.oligosaccharides) },
    { key: "fructose_excess", label: "Fruct.", value: Boolean(lookupResult?.fodmap_details?.fructose_excess) },
    { key: "lactose", label: "Lact.", value: Boolean(lookupResult?.fodmap_details?.lactose) },
    { key: "polyols", label: "Polyo.", value: Boolean(lookupResult?.fodmap_details?.polyols) }
  ];

  const suggestions = useMemo(() => {
    if (hasSearchedOnce) return [];
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return FOOD_LIST.filter((food) => food.toLowerCase().includes(value)).slice(0, 8);
  }, [hasSearchedOnce, query]);

  const showTypeDemo = !query.trim() && !isInputFocused;
  const displayValue = showTypeDemo ? `${DEMO_TEXT.slice(0, demoLength)}│` : query;
  const loadingDisplayValue = `${LOADING_TEXT.slice(0, loadingTextLength)}│`;

  useEffect(() => {
    if (query.trim() || isInputFocused) return;

    const fullLength = DEMO_TEXT.length;
    const minLength = Math.max(fullLength - DEMO_TRIM_COUNT, 0);
    const typingSpeed = isDeletingDemo ? 60 : 95;
    const edgePause = 700;

    const timeout = setTimeout(() => {
      if (isDeletingDemo) {
        if (demoLength > minLength) {
          setDemoLength((prev) => prev - 1);
        } else {
          setIsDeletingDemo(false);
        }
      } else {
        if (demoLength < fullLength) {
          setDemoLength((prev) => prev + 1);
        } else {
          setIsDeletingDemo(true);
        }
      }
    }, demoLength === fullLength || demoLength === minLength ? edgePause : typingSpeed);

    return () => clearTimeout(timeout);
  }, [demoLength, isDeletingDemo, isInputFocused, query]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTextLength(LOADING_TEXT.length);
      setIsDeletingLoadingText(false);
      return;
    }

    const fullLength = LOADING_TEXT.length;
    const minLength = Math.max(fullLength - LOADING_TRIM_COUNT, 0);
    const typingSpeed = isDeletingLoadingText ? 60 : 95;
    const edgePause = 700;

    const timeout = setTimeout(() => {
      if (isDeletingLoadingText) {
        if (loadingTextLength > minLength) {
          setLoadingTextLength((prev) => prev - 1);
        } else {
          setIsDeletingLoadingText(false);
        }
      } else {
        if (loadingTextLength < fullLength) {
          setLoadingTextLength((prev) => prev + 1);
        } else {
          setIsDeletingLoadingText(true);
        }
      }
    }, loadingTextLength === fullLength || loadingTextLength === minLength ? edgePause : typingSpeed);

    return () => clearTimeout(timeout);
  }, [isLoading, isDeletingLoadingText, loadingTextLength]);

  const handleSelect = (food) => {
    setQuery(food);
    setShowDropdown(false);
  };

  const formatNutrientValue = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  };

  const formatEnergyValue = (nutrition) => {
    const kcal = formatNutrientValue(nutrition?.calories_kcal);
    const kj = formatNutrientValue(nutrition?.energy_kj);
    if (kcal === "—" && kj === "—") return "—";
    return `${kcal === "—" ? "—" : kcal}/${kj === "—" ? "—" : kj}`;
  };

  const buildLookupContext = () => {
    const toNumericOrNull = (value) => {
      if (value === "" || value === null || value === undefined) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const feet = toNumericOrNull(profileFilters.height_ft);
    const inches = toNumericOrNull(profileFilters.height_in);
    const pounds = toNumericOrNull(profileFilters.weight_lb);

    const totalInches =
      (typeof feet === "number" ? feet * 12 : 0) +
      (typeof inches === "number" ? inches : 0);
    const heightCm = totalInches > 0 ? Number((totalInches * 2.54).toFixed(1)) : null;
    const weightKg = typeof pounds === "number" && pounds > 0 ? Number((pounds * 0.45359237).toFixed(1)) : null;

    const conditionDetails = profileFilters.conditions
      .filter((item) => item && typeof item.type === "string" && item.type.trim())
      .map((item) => ({
        condition: item.type,
        subtype: item.subtype || null,
        severity: item.severity ? item.severity.toLowerCase() : null,
        details: item.details?.trim() || null
      }));
    const conditionNames = [...new Set(conditionDetails.map((item) => item.condition))];

    return {
      conditions: conditionNames,
      condition_details: conditionDetails,
      gender: profileFilters.gender.trim() ? profileFilters.gender.trim().toLowerCase() : null,
      age: toNumericOrNull(profileFilters.age),
      height_cm: heightCm,
      weight_kg: weightKg,
      diet_type: profileFilters.diet_type.trim() ? profileFilters.diet_type.trim().toLowerCase() : null,
      notes: profileFilters.notes.trim() || null
    };
  };

  const runLookup = async (foodInput) => {
    const value = foodInput.trim();
    if (!value) {
      setLookupResult(null);
      setLookupMessage("Type a vegetable first.");
      return;
    }

    setIsLoading(true);
    setLookupMessage("");
    setLookupResult(null);
    setShowDropdown(false);

    try {
      const response = await fetch("/api/ibs-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: value, user_context: buildLookupContext() })
      });

      const data = await response.json();

      if (!response.ok) {
        setLookupMessage(data.error || "Lookup failed. Please try again.");
        return;
      }

      setLookupResult(data.result);
      setOpenSections(initialSectionState(Boolean(data.result?.may_trigger_ibs)));
      setHasSearchedOnce(true);
      const foodName = data.result.food_name || value;
      const key = foodName.toLowerCase();
      setQuery(foodName);
      setSelectedHistoryKey(key);
      setSessionHistory((prev) => {
        const filtered = prev.filter((item) => item.key !== key);
        return [{ key, foodName, result: data.result }, ...filtered];
      });
      setIsSessionHistoryOpen(false);
    } catch {
      setLookupMessage("Could not reach the lookup service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLookup = async () => {
    await runLookup(query);
  };

  const handleQuickFood = async (food) => {
    setQuery(food);
    await runLookup(food);
  };

  const handleHistorySelect = (key) => {
    const entry = sessionHistory.find((item) => item.key === key);
    if (!entry) return;
    setLookupResult(entry.result);
    setQuery(entry.foodName);
    setLookupMessage("");
    setHasSearchedOnce(true);
    setSelectedHistoryKey(entry.key);
    setOpenSections(initialSectionState(Boolean(entry.result?.may_trigger_ibs)));
    setIsSessionHistoryOpen(false);
    setShowDropdown(false);
  };

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleConfidenceClick = () => {
    if (typeof window !== "undefined") {
      window.alert(`confidence level is ${confidenceScore}/3`);
    }
  };

  const addConditionEntry = () => {
    const nextId = Date.now() + Math.floor(Math.random() * 1000);
    setProfileFilters((prev) => {
      return {
        ...prev,
        conditions: [
          ...prev.conditions,
          { id: nextId, type: "IBS", subtype: "IBS-M", severity: "Moderate (regular symptoms)", details: "" }
        ]
      };
    });
  };

  const updateConditionEntry = (id, updates) => {
    setProfileFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.map((item) => (item.id === id ? { ...item, ...updates } : item))
    }));
  };

  const removeConditionEntry = (id) => {
    setProfileFilters((prev) => {
      const next = prev.conditions.filter((item) => item.id !== id);
      return {
        ...prev,
        conditions: next.length
          ? next
          : [{ id: Date.now(), type: "IBS", subtype: "IBS-M", severity: "Moderate (regular symptoms)", details: "" }]
      };
    });
  };

  const openHealthDetails = () => {
    setIsFilterModalOpen(true);
    setIsSessionHistoryOpen(false);
  };

  const handleSaveHealthDetails = () => {
    setIsFilterModalOpen(false);
    if (!hasCompletedHealthDetails) {
      setHasCompletedHealthDetails(true);
    }
  };

  return (
    <main className={`page${hasSearchedOnce ? " hasResult" : ""}`}>
      {!hasCompletedHealthDetails ? (
        <div className="onboardingOverlay" aria-live="polite">
          <div className="onboardingCard">
            <h1 className="onboardingTitle">GUTCHECK.</h1>
            <button type="button" className="startButton" onClick={openHealthDetails}>
              lets get started
            </button>
          </div>
        </div>
      ) : null}
      {isLoading ? (
        <div className="loadingOverlay" role="status" aria-live="polite" aria-label="Loading result">
          <div className="loadingDots" aria-hidden="true">
            <span className="loadingDot" />
            <span className="loadingDot" />
            <span className="loadingDot" />
          </div>
          <p className="loadingLabel">{loadingDisplayValue}</p>
        </div>
      ) : null}
      <div className={`container${hasSearchedOnce ? " hasResult" : ""}`}>
        <h1>GutCheck.</h1>
        <p className="subtitle">Check it before you wreck it.</p>

        <div className={`searchCard${hasSearchedOnce ? " compact" : ""}`}>
          {hasSearchedOnce ? (
            <div className="searchCardControls">
              {sessionHistory.length > 0 ? (
                <button
                  type="button"
                  className="historyPeekButton"
                  onClick={() => setIsSessionHistoryOpen((prev) => !prev)}
                  aria-expanded={isSessionHistoryOpen}
                  aria-label="Show history"
                  title="History"
                >
                  <img className="historyIcon" src="/icons/history-clock.svg" alt="" />
                </button>
              ) : null}
              {hasCompletedHealthDetails ? (
                <button
                  type="button"
                  className="healthPeekButton"
                  onClick={openHealthDetails}
                  aria-label="Open health details"
                  title="Health details"
                >
                  <img className="healthIcon" src="/icons/health-heart.svg" alt="" />
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="inputWrap">
            <input
              ref={inputRef}
              className="queryInput"
              type="search"
              enterKeyHint="search"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              placeholder="Search to GutCheck…"
              value={displayValue}
              onChange={(event) => {
                setQuery(event.target.value);
                if (!hasSearchedOnce) {
                  setShowDropdown(true);
                }
                setLookupMessage("");
              }}
              onFocus={() => {
                setIsInputFocused(true);
                if (!hasSearchedOnce) {
                  setShowDropdown(true);
                }
              }}
              onBlur={() => setIsInputFocused(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleLookup();
                }
              }}
              autoComplete="off"
            />
            {!hasSearchedOnce && showDropdown && suggestions.length > 0 ? (
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

          <div className="sendRow">
            <button
              className={`lookupButton${isLoading ? " isLoading" : ""}`}
              type="button"
              onClick={handleLookup}
              disabled={isLoading}
              aria-label="Look up food"
              title="Look up food"
            >
              <span className="enterIcon" aria-hidden="true">
                ↩
              </span>
              <span className="srOnly">{isLoading ? "Looking up" : "Look up"}</span>
            </button>
          </div>

          {!hasSearchedOnce ? <div className="chipRow">
            {QUICK_FOODS.map((food) => (
              <button
                key={food}
                type="button"
                className="metaChip"
                onClick={() => handleQuickFood(food)}
                disabled={isLoading}
              >
                {food}
              </button>
            ))}
          </div> : null}
        </div>

        {hasSearchedOnce && isSessionHistoryOpen && sessionHistory.length > 0 ? (
          <ul className="sessionHistoryMenu" aria-label="Session search history">
            {sessionHistory.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={`sessionHistoryItem${item.key === selectedHistoryKey ? " isSelected" : ""}`}
                  onClick={() => handleHistorySelect(item.key)}
                >
                  {item.foodName}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {lookupMessage ? <p className="lookupMessage">{lookupMessage}</p> : null}

        {isFilterModalOpen ? (
          <div className="filterModalOverlay" role="dialog" aria-modal="true" aria-label="Health details">
            <div className="filterModalCard">
              <h2 className="filterModalTitle">Health details</h2>

              <div className="filterSection">
                <div className="filterSectionHeader">
                  <p className="filterLabel">Add condition</p>
                  <button type="button" className="addConditionButton" onClick={addConditionEntry} aria-label="Add condition">
                    +
                  </button>
                </div>
                <div className="conditionEntryList">
                  {profileFilters.conditions.map((condition) => (
                    <div className="conditionEntryCard" key={condition.id}>
                      <div className="conditionEntryTop">
                        <label className="filterField">
                          <span>Condition</span>
                          <select
                            value={condition.type}
                            onChange={(event) => {
                              const nextType = event.target.value;
                              const subtypeOptions = CONDITION_SUBTYPE_OPTIONS[nextType] || [];
                              updateConditionEntry(condition.id, {
                                type: nextType,
                                subtype: subtypeOptions[0] || ""
                              });
                            }}
                          >
                            {CONDITION_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="filterField">
                          <span>Severity</span>
                          <select
                            value={condition.severity || "Moderate (regular symptoms)"}
                            onChange={(event) => updateConditionEntry(condition.id, { severity: event.target.value })}
                          >
                            {CONDITION_SEVERITY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          className="removeConditionButton"
                          onClick={() => removeConditionEntry(condition.id)}
                          aria-label="Remove condition"
                        >
                          ×
                        </button>
                      </div>
                      <div className="conditionEntryGrid">
                        <label className="filterField">
                          <span>Subtype</span>
                          <select
                            value={condition.subtype}
                            onChange={(event) => updateConditionEntry(condition.id, { subtype: event.target.value })}
                          >
                            {(CONDITION_SUBTYPE_OPTIONS[condition.type] || ["Unknown"]).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="filterField">
                          <span>Details (optional)</span>
                          <input
                            type="text"
                            value={condition.details}
                            onChange={(event) => updateConditionEntry(condition.id, { details: event.target.value })}
                            placeholder={condition.type === "IBS" ? "e.g. flare-ups after large meals" : "e.g. hot flashes, sleep changes"}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="filterFieldGrid">
                <label className="filterField">
                  <span>Gender</span>
                  <select
                    value={profileFilters.gender}
                    onChange={(event) => setProfileFilters((prev) => ({ ...prev, gender: event.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </label>
                <label className="filterField">
                  <span>Age</span>
                  <input
                    type="number"
                    min="0"
                    value={profileFilters.age}
                    onChange={(event) => setProfileFilters((prev) => ({ ...prev, age: event.target.value }))}
                    placeholder="e.g. 34"
                  />
                </label>
                <label className="filterField">
                  <span>Height (ft)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={profileFilters.height_ft}
                    onChange={(event) => setProfileFilters((prev) => ({ ...prev, height_ft: event.target.value }))}
                    placeholder="e.g. 5"
                  />
                </label>
                <label className="filterField">
                  <span>Height (in)</span>
                  <input
                    type="number"
                    min="0"
                    max="11"
                    step="1"
                    value={profileFilters.height_in}
                    onChange={(event) => setProfileFilters((prev) => ({ ...prev, height_in: event.target.value }))}
                    placeholder="e.g. 7"
                  />
                </label>
                <label className="filterField">
                  <span>Weight (lb)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={profileFilters.weight_lb}
                    onChange={(event) => setProfileFilters((prev) => ({ ...prev, weight_lb: event.target.value }))}
                    placeholder="e.g. 140"
                  />
                </label>
                <label className="filterField">
                  <span>Diet type</span>
                  <select
                    value={profileFilters.diet_type}
                    onChange={(event) => setProfileFilters((prev) => ({ ...prev, diet_type: event.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="Omnivore">Omnivore</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Pescatarian">Pescatarian</option>
                    <option value="Keto">Keto</option>
                    <option value="Gluten-free">Gluten-free</option>
                    <option value="Dairy-free">Dairy-free</option>
                  </select>
                </label>
              </div>

              <label className="filterField filterFieldNotes">
                <span>Other notes</span>
                <textarea
                  rows={3}
                  value={profileFilters.notes}
                  onChange={(event) => setProfileFilters((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Anything else relevant for food tolerance."
                />
              </label>

              <div className="filterActions">
                <button type="button" className="filterActionButton" onClick={handleSaveHealthDetails}>
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {lookupResult ? (
          <div className="resultBubble" aria-live="polite">
            <div className="resultHeader">
              {!isInvalidInput ? (
                <>
                  <span className={lookupResult.may_trigger_ibs ? "statusBadge statusWarn resultStatusBubble resultMetricBubble" : "statusBadge statusSafe resultStatusBubble resultMetricBubble"}>
                    <span className="metricText">
                      {lookupResult.may_trigger_ibs ? "May trigger IBS" : "Usually better tolerated"}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="statusBadge resultStatusBubble resultMetricBubble confidenceBubble"
                    onClick={handleConfidenceClick}
                    aria-label={`Evidence confidence ${confidenceScore} out of 3`}
                    title={`Evidence confidence ${confidenceScore} out of 3`}
                  >
                    <span className="confidenceInner" aria-hidden="true">
                      <span className="confidenceStars">
                        {[0, 1, 2].map((index) => (
                          <img
                            key={index}
                            src="/icons/gold_star.png"
                            alt=""
                            className={`confidenceStar${index < confidenceScore ? " isActive" : ""}`}
                          />
                        ))}
                      </span>
                    </span>
                    <span className="srOnly">{`Confidence level ${confidenceScore} out of 3`}</span>
                  </button>
                </>
              ) : null}
            </div>

            <section className="infoSection sectionAmber">
              <button
                type="button"
                className="sectionHeader"
                onClick={() => toggleSection("summary")}
                aria-expanded={openSections.summary}
              >
                <span>Summary</span>
                <span className={`sectionArrow${openSections.summary ? " isOpen" : ""}`}>▾</span>
              </button>
              {openSections.summary ? (
                <div className="sectionBody">
                  <div className="contentCards contentCardsSingle contentCardsSummary">
                    <article className="contentCard">
                      <p className="contentCardBody">{lookupResult.summary}</p>
                    </article>
                  </div>
                </div>
              ) : null}
            </section>

            {!isInvalidInput ? (
              <section className="infoSection sectionBlue">
                <button
                  type="button"
                  className="sectionHeader"
                  onClick={() => toggleSection("details")}
                  aria-expanded={openSections.details}
                >
                  <span>Details</span>
                  <span className={`sectionArrow${openSections.details ? " isOpen" : ""}`}>▾</span>
                </button>
                {openSections.details ? (
                  <div className="sectionBody">
                    <div className="contentCards contentCardsDetails">
                      <article className="contentCard">
                        <h3 className="contentCardHeader">FODMAP Level</h3>
                        <p
                          className={`contentCardBody fodmapValue ${
                            lookupResult.fodmap_level === "Low"
                              ? "isLow"
                              : lookupResult.fodmap_level === "Moderate"
                                ? "isModerate"
                                : lookupResult.fodmap_level === "High"
                                  ? "isHigh"
                                  : "isUnknown"
                          }`}
                        >
                          {lookupResult.fodmap_level || "Unknown"}
                        </p>
                        <div className="fodmapDetailsGrid" role="list" aria-label="FODMAP details">
                          {fodmapDetails.map((detail) => (
                            <div className="fodmapDetailItem" role="listitem" key={detail.key}>
                              <span className="fodmapDetailLabel">{detail.label}</span>
                              <span className={`fodmapDetailValue${detail.value ? " isTrue" : " isFalse"}`}>
                                {detail.value ? "Yes" : "No"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </article>
                      <article className="contentCard">
                        <h3 className="contentCardHeader">Also known as</h3>
                        <p className="contentCardBody">
                          {lookupResult.aliases?.length ? lookupResult.aliases.join(", ") : "None listed"}
                        </p>
                      </article>
                      <article className="contentCard">
                        <h3 className="contentCardHeader">Alternatives</h3>
                        <p className="contentCardBody">
                          {lookupResult.alternatives?.length ? lookupResult.alternatives.join(", ") : "None listed"}
                        </p>
                      </article>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {!isInvalidInput ? (
              <section className="infoSection sectionLilac">
                <button
                  type="button"
                  className="sectionHeader"
                  onClick={() => toggleSection("advice")}
                  aria-expanded={openSections.advice}
                >
                  <span>Portion advice</span>
                  <span className={`sectionArrow${openSections.advice ? " isOpen" : ""}`}>▾</span>
                </button>
                {openSections.advice ? (
                  <div className="sectionBody">
                    <div className="contentCards contentCardsAdvice">
                      <article className="contentCard">
                        <h3 className="contentCardHeader">Suggested portion</h3>
                        <p className="contentCardBody">{portionAdviceParsed.portion}</p>
                      </article>
                      <article className="contentCard">
                        <h3 className="contentCardHeader">Explanation</h3>
                        <p className="contentCardBody">{portionAdviceParsed.explanation}</p>
                      </article>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {!isInvalidInput ? (
              <section className="infoSection sectionSky">
                <button
                  type="button"
                  className="sectionHeader"
                  onClick={() => toggleSection("nutrition")}
                  aria-expanded={openSections.nutrition}
                >
                  <span>{`Nutritional contents (per ${nutritionServingLabel})`}</span>
                  <span className={`sectionArrow${openSections.nutrition ? " isOpen" : ""}`}>▾</span>
                </button>
                {openSections.nutrition ? (
                  <div className="sectionBody">
                    {nutritionData ? (
                      <div className="nutritionCards" role="list" aria-label={`Nutritional values per ${nutritionServingLabel}`}>
                        {NUTRIENT_ROWS.map((row) => (
                          <article className="nutritionCard" role="listitem" key={row.key}>
                            <header className="nutritionCardHeader">{`${row.label} (${row.unit})`}</header>
                            <p className="nutritionCardValue">
                              {row.key === "energy"
                                ? formatEnergyValue(nutritionData)
                                : formatNutrientValue(nutritionData[row.key])}
                            </p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="resultNote">Nutrition values were not available.</p>
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
