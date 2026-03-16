"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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

const USERNAME_FORMAT_ERROR =
  "the format is invalid, and it must be 5-15 characters long, contain no special characters, and will not be case sensitive.";
const PROFILE_STORAGE_NOTICE = "Your profile and search history will be stored so your experience can be personalized.";

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

const toHistoryState = (rows) =>
  (rows || []).map((row) => ({
    id: row.id,
    key: row.food_key,
    foodName: row.food_name,
    result: row.response_json,
    lastUpdatedAt: row.last_updated_at
  }));

const denormalizeProfileToFilters = (profileRow) => {
  const profile = profileRow?.profile_json || {};
  const weightKg = typeof profile.weight_kg === "number" ? profile.weight_kg : null;
  const heightCm = typeof profile.height_cm === "number" ? profile.height_cm : null;
  const totalInches = heightCm ? Math.round(heightCm / 2.54) : null;
  const heightFt = totalInches !== null ? Math.floor(totalInches / 12) : "";
  const heightIn = totalInches !== null ? totalInches % 12 : "";
  const weightLb = weightKg ? Math.round(weightKg / 0.45359237) : "";
  const details = Array.isArray(profile.condition_details) ? profile.condition_details : [];

  return {
    name: profileRow?.display_name || "",
    conditions:
      details.length > 0
        ? details.map((item, index) => ({
            id: Date.now() + index,
            type: item.condition || "IBS",
            subtype: item.subtype || "IBS-M",
            severity: item.severity || "Moderate (regular symptoms)",
            details: item.details || ""
          }))
        : [{ id: Date.now(), type: "IBS", subtype: "IBS-M", severity: "Moderate (regular symptoms)", details: "" }],
    gender:
      typeof profile.gender === "string" && profile.gender.length
        ? `${profile.gender.charAt(0).toUpperCase()}${profile.gender.slice(1).toLowerCase()}`
        : "",
    age: typeof profile.age === "number" ? String(profile.age) : "",
    height_ft: heightFt === "" ? "" : String(heightFt),
    height_in: heightIn === "" ? "" : String(heightIn),
    weight_lb: weightLb === "" ? "" : String(weightLb),
    diet_type:
      typeof profile.diet_type === "string" && profile.diet_type.length
        ? profile.diet_type
            .split("-")
            .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
            .join("-")
        : "",
    notes: typeof profile.notes === "string" ? profile.notes : ""
  };
};

export default function Page() {
  const supabase = getSupabaseBrowserClient();
  const [authSession, setAuthSession] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasCurrentSessionSearch, setHasCurrentSessionSearch] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [selectedHistoryKey, setSelectedHistoryKey] = useState("");
  const [isSessionHistoryOpen, setIsSessionHistoryOpen] = useState(false);
  const [deletingHistoryIds, setDeletingHistoryIds] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFilters, setProfileFilters] = useState({
    name: "",
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
  const [isConfidenceModalOpen, setIsConfidenceModalOpen] = useState(false);
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
    if (lookupResult) return [];
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return FOOD_LIST.filter((food) => food.toLowerCase().includes(value)).slice(0, 8);
  }, [lookupResult, query]);

  const showTypeDemo = !query.trim() && !isInputFocused;
  const displayValue = showTypeDemo ? `${DEMO_TEXT.slice(0, demoLength)}│` : query;
  const loadingDisplayValue = `${LOADING_TEXT.slice(0, loadingTextLength)}│`;
  const isAnyLoading = isLoading || isAuthBootstrapping || authBusy || isSavingProfile;
  const hasPersistedHistory = sessionHistory.length > 0;
  const isCompactSearchLayout = hasCurrentSessionSearch || Boolean(lookupResult);
  const authFetch = useCallback(async (url, options = {}, tokenOverride = null) => {
    const token = tokenOverride || authSession?.access_token || "";
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  }, [authSession?.access_token]);
  const loadProfileAndHistory = useCallback(async (tokenOverride = null) => {
    const [profileResponse, historyResponse] = await Promise.all([
      authFetch("/api/profile", {}, tokenOverride),
      authFetch("/api/history", {}, tokenOverride)
    ]);
    const [profileData, historyData] = await Promise.all([profileResponse.json(), historyResponse.json()]);

    if (profileResponse.ok && profileData?.profile) {
      setProfileFilters((prev) => ({ ...prev, ...denormalizeProfileToFilters(profileData.profile) }));
    }

    if (historyResponse.ok) {
      const mapped = toHistoryState(historyData.history);
      setSessionHistory(mapped);
    } else {
      setSessionHistory([]);
    }
  }, [authFetch]);

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
    if (!isAnyLoading) {
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
  }, [isAnyLoading, isDeletingLoadingText, loadingTextLength]);

  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;
    const initAuth = async () => {
      setIsAuthBootstrapping(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data?.session) {
          setAuthSession(data.session);
          await loadProfileAndHistory(data.session.access_token);
        }
      } finally {
        if (!cancelled) {
          setIsAuthBootstrapping(false);
        }
      }
    };
    initAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setAuthSession(session || null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase, loadProfileAndHistory]);

  const completeAuthSession = async (session) => {
    if (!supabase) return;
    setIsAuthBootstrapping(true);
    try {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      setAuthSession(session);
      setAuthError("");
      setAuthPassword("");
      setAuthConfirmPassword("");
      setAuthUsername("");
      await loadProfileAndHistory(session.access_token);
    } finally {
      setIsAuthBootstrapping(false);
    }
  };

  const handleSignUp = async () => {
    setAuthError("");
    if (!/^[a-zA-Z0-9]{5,15}$/.test(authUsername.trim())) {
      setAuthError(USERNAME_FORMAT_ERROR);
      return;
    }
    setAuthBusy(true);
    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword,
          confirm_password: authConfirmPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data?.error || "Unable to create account.");
        return;
      }
      if (data?.session?.access_token && data?.session?.refresh_token) {
        await completeAuthSession(data.session);
      }
      setIsFilterModalOpen(true);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogin = async () => {
    setAuthError("");
    if (!/^[a-zA-Z0-9]{5,15}$/.test(authUsername.trim())) {
      setAuthError(USERNAME_FORMAT_ERROR);
      return;
    }
    setAuthBusy(true);
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data?.error || "Unable to log in.");
        return;
      }
      await completeAuthSession(data.session);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await fetch("/api/auth/sign-out", { method: "POST" });
    await supabase.auth.signOut();
    setAuthSession(null);
    setSessionHistory([]);
    setLookupResult(null);
    setLookupMessage("");
    setSelectedHistoryKey("");
    setHasCurrentSessionSearch(false);
    setIsSessionHistoryOpen(false);
    setIsFilterModalOpen(false);
  };

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

  const formatHistoryTimestamp = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `Last updated: ${date.toLocaleString()}`;
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
      .map((item) => {
        const detail = {
          condition: item.type,
          subtype: item.subtype || "",
          severity: item.severity ? item.severity.toLowerCase() : "",
          details: item.details?.trim() || ""
        };

        if (!detail.subtype) delete detail.subtype;
        if (!detail.severity) delete detail.severity;
        if (!detail.details) delete detail.details;
        return detail;
      });
    const conditionNames = [...new Set(conditionDetails.map((item) => item.condition))];
    const context = {
      conditions: conditionNames,
      condition_details: conditionDetails
    };

    const gender = profileFilters.gender.trim();
    const age = toNumericOrNull(profileFilters.age);
    const dietType = profileFilters.diet_type.trim();
    const notes = profileFilters.notes.trim();
    const displayName = profileFilters.name.trim();

    if (displayName) context.name = displayName;
    if (gender) context.gender = gender.toLowerCase();
    if (typeof age === "number") context.age = age;
    if (typeof heightCm === "number") context.height_cm = heightCm;
    if (typeof weightKg === "number") context.weight_kg = weightKg;
    if (dietType) context.diet_type = dietType.toLowerCase();
    if (notes) context.notes = notes;

    return context;
  };

  const runLookup = async (foodInput, { forceRefresh = false } = {}) => {
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
      const key = value.toLowerCase();
      const existing = sessionHistory.find((item) => item.key === key);

      if (existing && !forceRefresh) {
        setLookupResult(existing.result);
        setOpenSections(initialSectionState(Boolean(existing.result?.may_trigger_ibs)));
        setHasCurrentSessionSearch(true);
        setSelectedHistoryKey(existing.key);
        setQuery(existing.foodName);
        setIsSessionHistoryOpen(false);
        return;
      }

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
      setHasCurrentSessionSearch(true);
      const foodName = data.result.food_name || value;
      const normalizedKey = foodName.trim().toLowerCase();
      setQuery(foodName);
      setSelectedHistoryKey(normalizedKey);

      if (authSession?.access_token) {
        const saveResponse = await authFetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            food_name: foodName,
            food_key: normalizedKey,
            response_json: data.result
          })
        });

        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          const item = saveData.item;
          setSessionHistory((prev) => {
            const mapped = {
              id: item.id,
              key: item.food_key,
              foodName: item.food_name,
              result: item.response_json,
              lastUpdatedAt: item.last_updated_at
            };
            const filtered = prev.filter((entry) => entry.key !== mapped.key);
            return [mapped, ...filtered].slice(0, 20);
          });
        }
      }
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

  const handleRefreshLookup = async () => {
    await runLookup(query, { forceRefresh: true });
  };

  const handleHistorySelect = (key) => {
    const entry = sessionHistory.find((item) => item.key === key);
    if (!entry) return;
    setLookupResult(entry.result);
    setQuery(entry.foodName);
    setLookupMessage("");
    setHasCurrentSessionSearch(true);
    setSelectedHistoryKey(entry.key);
    setOpenSections(initialSectionState(Boolean(entry.result?.may_trigger_ibs)));
    setIsSessionHistoryOpen(false);
    setShowDropdown(false);
  };

  const handleDeleteHistoryItem = async (id, key) => {
    if (!id) return;
    if (deletingHistoryIds.includes(id)) return;
    setDeletingHistoryIds((prev) => [...prev, id]);
    try {
      const response = await authFetch(`/api/history/${id}`, { method: "DELETE" });
      if (!response.ok) return;
      setSessionHistory((prev) => prev.filter((item) => item.id !== id));
      if (selectedHistoryKey === key) {
        setSelectedHistoryKey("");
        setLookupResult(null);
      }
    } finally {
      setDeletingHistoryIds((prev) => prev.filter((value) => value !== id));
    }
  };

  const handleClearHistory = async () => {
    const response = await authFetch("/api/history", { method: "DELETE" });
    if (!response.ok) return;
    setSessionHistory([]);
    setSelectedHistoryKey("");
    setLookupResult(null);
    setIsSessionHistoryOpen(false);
  };

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleConfidenceClick = () => {
    setIsConfidenceModalOpen(true);
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
    setProfileMessage("");
  };

  const handleSaveHealthDetails = async () => {
    if (!authSession?.access_token) return;

    const payload = buildLookupContext();
    if (!Array.isArray(payload.conditions) || payload.conditions.length < 1) {
      setProfileMessage("At least 1 condition is required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await authFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: profileFilters.name.trim() || null,
          profile_json: payload
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setProfileMessage(data?.error || "Unable to save profile right now.");
        return;
      }

      setProfileFilters((prev) => ({
        ...prev,
        ...denormalizeProfileToFilters(data.profile)
      }));
      setProfileMessage("Saved.");
      setIsFilterModalOpen(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setProfileMessage("invalid password");
      return;
    }

    const response = await authFetch("/api/auth/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword })
    });
    const data = await response.json();

    if (!response.ok) {
      setProfileMessage(data?.error || "Unable to delete account right now.");
      return;
    }

    await handleLogout();
    setDeletePassword("");
  };

  if (!supabase) {
    return (
      <main className="page">
        <div className="authCard">
          <h1>GutCheck</h1>
          <p className="authError">
            Missing Supabase configuration. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
            (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) in your deployment environment, then rebuild.
          </p>
        </div>
      </main>
    );
  }

  if (!authSession) {
    return (
      <main className="page">
        {isAnyLoading ? (
          <div className="loadingOverlay" role="status" aria-live="polite" aria-label="Loading">
            <div className="loadingDots" aria-hidden="true">
              <span className="loadingDot" />
              <span className="loadingDot" />
              <span className="loadingDot" />
            </div>
            <p className="loadingLabel">{loadingDisplayValue}</p>
          </div>
        ) : null}
        <div className="authCard">
          <h1>GutCheck</h1>
          <p className="subtitle">Check it before you wreck it.</p>
          <div className="authToggleRow">
            <button
              type="button"
              className={`authToggleButton${authMode === "login" ? " isActive" : ""}`}
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`authToggleButton${authMode === "signup" ? " isActive" : ""}`}
              onClick={() => {
                setAuthMode("signup");
                setAuthError("");
              }}
            >
              Create Account
            </button>
          </div>
          <label className="authField">
            <span>Username</span>
            <input value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} autoComplete="off" />
          </label>
          <label className="authField">
            <span>Password</span>
            <input
              type="password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
            />
          </label>
          {authMode === "signup" ? (
            <label className="authField">
              <span>Confirm Password</span>
              <input
                type="password"
                value={authConfirmPassword}
                onChange={(event) => setAuthConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>
          ) : null}
          <p className="privacyNotice">{PROFILE_STORAGE_NOTICE}</p>
          {authError ? <p className="authError">{authError}</p> : null}
          <button
            type="button"
            className="authSubmitButton"
            onClick={authMode === "signup" ? handleSignUp : handleLogin}
            disabled={authBusy}
          >
            {authMode === "signup" ? "Create Account" : "Login"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`page${lookupResult ? " hasResult" : ""}`}>
      {isAnyLoading ? (
        <div className="loadingOverlay" role="status" aria-live="polite" aria-label="Loading">
          <div className="loadingDots" aria-hidden="true">
            <span className="loadingDot" />
            <span className="loadingDot" />
            <span className="loadingDot" />
          </div>
          <p className="loadingLabel">{loadingDisplayValue}</p>
        </div>
      ) : null}
      {isConfidenceModalOpen ? (
        <div
          className="confidenceModalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Confidence level"
          onClick={() => setIsConfidenceModalOpen(false)}
        >
          <div className="confidenceModalCard" onClick={(event) => event.stopPropagation()}>
            <p className="confidenceModalText">{`confidence in our response: ${confidenceScore}/3`}</p>
            <button type="button" className="confidenceModalClose" onClick={() => setIsConfidenceModalOpen(false)}>
              OK
            </button>
          </div>
        </div>
      ) : null}
      <div className={`container${lookupResult ? " hasResult" : ""}`}>
        <h1>GutCheck</h1>
        <p className="subtitle">Check it before you wreck it.</p>
        <div className="accountActionsRow">
          <button type="button" className="accountActionButton" onClick={handleLogout}>
            Log out
          </button>
        </div>

        <div className={`searchCard${isCompactSearchLayout ? " compact" : ""}`}>
          <div className={`searchBarRow${isCompactSearchLayout ? " compact" : ""}`}>
            <div className="searchCardControls">
              <button
                type="button"
                className="historyPeekButton"
                onClick={() => setIsSessionHistoryOpen((prev) => !prev)}
                aria-expanded={isSessionHistoryOpen}
                aria-label="Show history"
                title="History"
              >
                <Image className="historyIcon" src="/icons/history_clock.png" alt="" width={32} height={32} />
              </button>
              <button
                type="button"
                className="healthPeekButton"
                onClick={openHealthDetails}
                aria-label="Open health details"
                title="Health details"
              >
                <Image className="healthIcon" src="/icons/health_icon.png" alt="" width={32} height={32} />
              </button>
            </div>
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
                  if (!isCompactSearchLayout) {
                    setShowDropdown(true);
                  }
                  setLookupMessage("");
                }}
                onFocus={() => {
                  setIsInputFocused(true);
                  if (!isCompactSearchLayout) {
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
              {!isCompactSearchLayout && showDropdown && suggestions.length > 0 ? (
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
                <Image className="enterIcon" src="/icons/enter_button.png" alt="" width={30} height={30} aria-hidden="true" />
                <span className="srOnly">{isLoading ? "Looking up" : "Look up"}</span>
              </button>
            </div>
          </div>

        </div>

        {hasPersistedHistory && isSessionHistoryOpen && sessionHistory.length > 0 ? (
          <div className="sessionHistoryBlock">
            <div className="historyHeaderRow">
              <p className="historyTitle">Recent searches</p>
              <button type="button" className="historyClearButton" onClick={handleClearHistory}>
                Clear all
              </button>
            </div>
            <ul className="sessionHistoryMenu" aria-label="Session search history">
              {sessionHistory.map((item) => (
                <li key={item.id || item.key}>
                  <div
                    className={`sessionHistoryItem${item.key === selectedHistoryKey ? " isSelected" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleHistorySelect(item.key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleHistorySelect(item.key);
                      }
                    }}
                    aria-label={`Open ${item.foodName}`}
                  >
                    <div className="sessionHistoryMeta">
                      <button
                        type="button"
                        className="sessionHistoryOpenButton"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleHistorySelect(item.key);
                        }}
                      >
                        {item.foodName}
                      </button>
                      {item.lastUpdatedAt ? <span className="sessionHistoryTimestamp">{formatHistoryTimestamp(item.lastUpdatedAt)}</span> : null}
                    </div>
                    <button
                      type="button"
                      className="sessionHistoryDeleteButton"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteHistoryItem(item.id, item.key);
                      }}
                      aria-label={`Delete ${item.foodName}`}
                      disabled={deletingHistoryIds.includes(item.id)}
                    >
                      {deletingHistoryIds.includes(item.id) ? (
                        <span className="buttonLoadingDots" aria-hidden="true">
                          <span className="buttonLoadingDot" />
                          <span className="buttonLoadingDot" />
                          <span className="buttonLoadingDot" />
                        </span>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
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
                  <span>Name / nickname</span>
                  <input
                    type="text"
                    value={profileFilters.name}
                    onChange={(event) => setProfileFilters((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="How should GutCheck refer to you?"
                  />
                </label>
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

              <p className="privacyNotice">{PROFILE_STORAGE_NOTICE}</p>
              {profileMessage ? <p className="profileMessage">{profileMessage}</p> : null}

              <div className="filterActions">
                <button
                  type="button"
                  className={`filterActionButton${isSavingProfile ? " isSaving" : ""}`}
                  onClick={handleSaveHealthDetails}
                  disabled={isSavingProfile}
                >
                  Save
                </button>
              </div>

              <div className="deleteAccountPanel">
                <p className="deleteAccountTitle">Delete account permanently</p>
                <label className="filterField">
                  <span>Re-enter password</span>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    placeholder="Password"
                  />
                </label>
                <button type="button" className="deleteAccountButton" onClick={handleDeleteAccount}>
                  Delete account
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
                          <Image
                            key={index}
                            src="/icons/gold_star.png"
                            alt=""
                            width={28}
                            height={28}
                            className={`confidenceStar${index < confidenceScore ? " isActive" : ""}`}
                          />
                        ))}
                      </span>
                    </span>
                    <span className="srOnly">{`Confidence level ${confidenceScore} out of 3`}</span>
                  </button>
                  <button
                    type="button"
                    className="statusBadge resultStatusBubble resultMetricBubble refreshResultButton"
                    onClick={handleRefreshLookup}
                    disabled={isLoading}
                  >
                    Refresh response
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
