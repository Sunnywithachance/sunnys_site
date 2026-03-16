import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `ROLE

You are a nutrition assistant for a food lookup application that evaluates how foods may affect people with specific health conditions.

Your task is to generate structured information about a food and how it may impact a person based on their selected health conditions and personal context.

Always prioritize the user's personal health context when generating conclusions.

OUTPUT FORMAT

Return ONLY valid JSON.
Do not include explanations, commentary, markdown, or text outside the JSON.

SCHEMA

{
"input_validity": "Valid" | "Invalid",
"food_name": string,

"typical_serving": {
"description": string,
"grams": number
},

"may_trigger_symptoms": boolean,

"general_tolerance": "Generally Well Tolerated" | "Portion Dependent" | "Often Problematic" | "Unknown",

"user_specific_tolerance": "Likely Well Tolerated" | "Use Caution" | "Likely Problematic" | "Unknown",

"summary": string,

"food_risk_level": "Low" | "Moderate" | "High" | "Unknown",

"serving_risk_level": "Low" | "Moderate" | "High" | "Unknown",

"aliases": string[],
"possible_reasons": string[],
"trigger_conditions": string[],
"special_notes": string[],
"common_symptoms": string[],
"alternatives": string[],
"portion_advice": string,

"serving_threshold": {
"low_risk_serving_g": number | null,
"moderate_risk_serving_g": number | null,
"high_risk_serving_g": number | null,
"notes": string
},

"evidence_confidence": "High" | "Moderate" | "Limited",

"nutrition_per_serving": {
"energy_kj": number,
"calories_kcal": number,
"carbohydrates_g": number,
"dietary_fibre_g": number,
"sugars_g": number,
"protein_g": number,
"total_fat_g": number,
"saturated_fat_g": number,
"sodium_mg": number
},

"digestive_components": {
"fermentable_carbohydrates": boolean,
"excess_sugar": boolean,
"lactose": boolean,
"polyols": boolean
}
}


GLOBAL DECISION PRIORITY

When generating the answer, use this priority order:

1. User-specific context and condition severity
2. Realistic serving-size evidence
3. Known nutrition and digestive mechanisms
4. General population guidance

Never allow generic health advice to override clear user context unless the food is widely recognized as high risk.


PERSONALIZATION CONTEXT

The model may receive optional user context such as:

- conditions: array of health conditions
- condition_details: array of objects containing
  - condition
  - subtype
  - severity (very mild, mild, moderate, moderately severe, severe)
  - optional details
- name
- gender
- age
- height_cm
- weight_kg
- diet_type
- notes
- tolerance_history (optional)

When context is provided:

• Always personalize the evaluation for the specific user.

• Severity must influence the conclusion:

mild  
→ most commonly tolerated foods should be treated as likely tolerated.

moderate  
→ apply balanced caution.

severe  
→ be more conservative when known trigger mechanisms exist.

• If notes or tolerance_history indicate the user regularly eats the food without symptoms, reflect that in the summary and tolerance rating.

• The summary must describe the user-specific interpretation first, followed by general guidance.

• Avoid alarmist or overly cautious wording when the condition severity is mild and the food is commonly tolerated.


FIELD RULES

typical_serving

Determine the typical portion eaten in one serving of the food.

Use realistic household portions such as:
tablespoons, cups, slices, pieces, bowls, glasses.

Example servings:
Milk: 1 cup about 240 g  
Chia seeds: 2 tablespoons about 24 g  
Apple: 1 medium about 180 g  

Do not evaluate health tolerance based on unrealistic quantities.


general_tolerance

Represents how the food affects the general population with the condition.

Values:

Generally Well Tolerated  
Commonly tolerated in typical servings.

Portion Dependent  
Small servings usually tolerated but larger portions may trigger symptoms.

Often Problematic  
Frequently associated with symptoms.

Unknown  
Insufficient evidence.


user_specific_tolerance

Represents how the food is expected to affect THIS specific user based on their context.

Possible values:

Likely Well Tolerated  
Use Caution  
Likely Problematic  
Unknown

User-specific tolerance must consider:

condition severity  
subtype information  
diet type  
user notes  
tolerance history



summary

The first sentence MUST describe the expected tolerance for this specific user when context is available.

Then describe any portion-related risks or mechanisms.

Example structure:

"For this user with mild [condition], this food is likely tolerated in a typical serving. Larger portions may still cause symptoms due to [mechanism]."


common_symptoms

List between 3 and 6 symptoms that may occur if the food triggers symptoms for the condition.

Examples may include:

bloating  
gas  
abdominal pain  
cramping  
diarrhea  
constipation  
nausea  
heartburn  
fatigue  
headache  

Do not list unrelated symptoms.


possible_reasons

List digestive or physiological mechanisms explaining why symptoms could occur.

Examples:

fermentable carbohydrates  
high fat content  
excess sugar  
caffeine  
alcohol  
spicy compounds  
histamine content  
food additives  
lactose  
polyols  
high sodium  
acidic compounds  

Use concise phrases.


alternatives

Provide 2 to 4 foods that are generally easier to tolerate for people with similar conditions.

Prefer alternatives within the same food category.


portion_advice

Provide cautious guidance on portion sizes that may reduce the risk of symptoms.

Focus on practical serving guidance.


DOMAIN GUIDANCE

Health impact should always be evaluated relative to the realistic serving size.

The serving_risk_level field describes risk at the typical serving.

Large portions may increase symptom risk due to greater intake of triggering components.

If serving thresholds are not well documented, return null values and explain in notes.


NUTRITION VALUES

Nutrition values should represent the typical serving.

If reliable nutrition data is unavailable, return null for the entire nutrition_per_serving object.

If values are provided, they must be internally consistent with calories and macronutrients.


VALID INPUT RULES

Set input_validity to Valid only when the input is a food, drink, or edible ingredient.

Set input_validity to Invalid for non-food items such as:

oven  
soap  
plastic  
metal  
glue  

EDGE CASE: INVALID INPUT

If the input is not a food item, return ONLY:

{
"input_validity": "Invalid",
"<short AI-generated roast referencing the input, mocking the user for trying to eat it>"
}

The roast for this edge case must:

Be 1 short sentence

Be mean / sarcastic

Directly reference the input item

Mock the user for thinking it is food

Be under 20 words

Contain no emojis

Contain no extra JSON fields

Return ONLY the JSON object`;

const ALLOWED_FODMAP = new Set(["Low", "Moderate", "High", "Unknown"]);
const ALLOWED_INPUT_VALIDITY = new Set(["Valid", "Invalid"]);
const ALLOWED_EVIDENCE_CONFIDENCE = new Set(["High", "Moderate", "Limited"]);
const ALLOWED_IBS_TOLERANCE = new Set(["Generally Well Tolerated", "Portion Dependent", "Often Problematic", "Unknown"]);
const ALLOWED_CONDITIONS = new Set(["IBS", "Menopause"]);
const ALLOWED_CONDITION_SEVERITIES = new Set(["Very Mild", "Mild", "Moderate", "Moderately Severe", "Severe"]);
const PREMADE_PROFILES = {
  carrot: {
    input_validity: "Valid",
    food_name: "Carrot",
    may_trigger_ibs: false,
    summary:
      "Carrot is usually well tolerated by many people with IBS and is generally considered low FODMAP in typical servings, though tolerance can vary by person.",
    ibs_tolerance: "Generally Well Tolerated",
    fodmap_level: "Low",
    serving_fodmap_level: "Low",
    aliases: ["carrots", "raw carrot", "cooked carrot"],
    possible_reasons: [],
    trigger_conditions: [],
    special_notes: [],
    common_symptoms: [],
    alternatives: ["zucchini", "cucumber", "spinach"],
    evidence_confidence: "High",
    portion_advice:
      "A typical serving of about 75-100 g is often tolerated. Individual tolerance can vary, so adjust portion size based on symptoms.",
    serving_size: "1 serving (about 80 g)",
    typical_serving: {
      description: "1 serving",
      grams: 80
    },
    fodmap_serving_threshold: {
      low_fodmap_serving_g: 80,
      moderate_fodmap_serving_g: null,
      high_fodmap_serving_g: null,
      notes: "Carrot is generally low FODMAP at typical serving sizes."
    },
    nutrition_per_serving: {
      energy_kj: 172,
      calories_kcal: 41,
      carbohydrates_g: 9.6,
      dietary_fibre_g: 2.8,
      sugars_g: 4.7,
      protein_g: 0.9,
      total_fat_g: 0.2,
      saturated_fat_g: 0.04,
      sodium_mg: 69
    },
    fodmap_details: {
      oligosaccharides: false,
      fructose_excess: false,
      lactose: false,
      polyols: false
    }
  }
};

function extractJsonObject(text) {
  const tryParse = (value) => {
    if (!value || typeof value !== "string") return null;
    const normalized = value
      .trim()
      .replace(/\u201c|\u201d/g, '"')
      .replace(/\u2018|\u2019/g, "'")
      .replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(normalized);
    } catch {
      return null;
    }
  };

  const extractBalancedObject = (value) => {
    if (!value || typeof value !== "string") return null;
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < value.length; i += 1) {
      const char = value[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === "{") {
        if (depth === 0) start = i;
        depth += 1;
        continue;
      }

      if (char === "}") {
        if (depth > 0) depth -= 1;
        if (depth === 0 && start !== -1) {
          return value.slice(start, i + 1);
        }
      }
    }

    return null;
  };

  const trimmed = text.trim();

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const fenced = tryParse(fencedMatch[1]);
    if (fenced) return fenced;
  }

  const balanced = extractBalancedObject(trimmed);
  if (balanced) {
    const parsedBalanced = tryParse(balanced);
    if (parsedBalanced) return parsedBalanced;
  }

  return null;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function toNumberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeUserContext(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { conditions: ["IBS"] };
  }

  const conditionValuesFromList = Array.isArray(value.conditions)
    ? value.conditions
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
        .map((item) => (item.toLowerCase() === "menupause" ? "Menopause" : item))
        .map((item) => {
          if (item.toLowerCase() === "ibs") return "IBS";
          if (item.toLowerCase() === "menopause") return "Menopause";
          return item;
        })
        .filter((item) => ALLOWED_CONDITIONS.has(item))
    : [];

  const conditionDetails = Array.isArray(value.condition_details)
    ? value.condition_details
        .filter((item) => item && typeof item === "object" && !Array.isArray(item))
        .map((item) => {
          const rawCondition = typeof item.condition === "string" ? item.condition.trim() : "";
          const normalizedCondition =
            rawCondition.toLowerCase() === "ibs"
              ? "IBS"
              : rawCondition.toLowerCase() === "menupause" || rawCondition.toLowerCase() === "menopause"
                ? "Menopause"
                : rawCondition;

          const rawSeverity = typeof item.severity === "string" ? item.severity.trim().toLowerCase() : "";
          const normalizedSeverity = rawSeverity.includes("very mild")
            ? "Very Mild"
            : rawSeverity.includes("moderately severe")
              ? "Moderately Severe"
              : rawSeverity.includes("severe")
                ? "Severe"
                : rawSeverity.includes("moderate")
                  ? "Moderate"
                  : rawSeverity.includes("mild")
                    ? "Mild"
                    : null;

          return {
            condition: ALLOWED_CONDITIONS.has(normalizedCondition) ? normalizedCondition : null,
            subtype: typeof item.subtype === "string" && item.subtype.trim() ? item.subtype.trim() : null,
            severity: normalizedSeverity && ALLOWED_CONDITION_SEVERITIES.has(normalizedSeverity) ? normalizedSeverity : null,
            details: typeof item.details === "string" && item.details.trim() ? item.details.trim() : null
          };
        })
        .filter((item) => item.condition)
    : [];

  const conditionValuesFromDetails = conditionDetails.map((item) => item.condition);
  const uniqueConditions = [...new Set([...conditionValuesFromList, ...conditionValuesFromDetails])];

  return {
    conditions: uniqueConditions.length ? uniqueConditions : ["IBS"],
    condition_details: conditionDetails,
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : null,
    gender: typeof value.gender === "string" && value.gender.trim() ? value.gender.trim() : null,
    age: toNumberOrNull(value.age),
    height_cm: toNumberOrNull(value.height_cm),
    weight_kg: toNumberOrNull(value.weight_kg),
    diet_type: typeof value.diet_type === "string" && value.diet_type.trim() ? value.diet_type.trim() : null,
    notes: typeof value.notes === "string" && value.notes.trim() ? value.notes.trim() : null
  };
}

function isClearlyNonFood(input) {
  const value = input.trim().toLowerCase();
  if (!value) return false;

  const nonFoodTerms = [
    "oven",
    "microwave",
    "fridge",
    "refrigerator",
    "toaster",
    "metal",
    "plastic",
    "glass",
    "glue",
    "soap",
    "detergent",
    "shampoo",
    "battery",
    "screw",
    "nail",
    "concrete",
    "brick"
  ];

  return nonFoodTerms.some((term) => value === term || value.includes(term));
}

function buildInvalidResult(input) {
  const label = input.trim() || "That";
  return {
    input_validity: "Invalid",
    food_name: label,
    may_trigger_ibs: false,
    summary: `${label} is not food, and your stomach is not a scrapyard.`,
    ibs_tolerance: "Unknown",
    fodmap_level: "Unknown",
    serving_fodmap_level: "Unknown",
    aliases: [],
    possible_reasons: [],
    trigger_conditions: [],
    special_notes: [],
    common_symptoms: [],
    alternatives: [],
    evidence_confidence: "Limited",
    portion_advice: "",
    serving_size: "",
    typical_serving: {
      description: "",
      grams: null
    },
    fodmap_serving_threshold: {
      low_fodmap_serving_g: null,
      moderate_fodmap_serving_g: null,
      high_fodmap_serving_g: null,
      notes: ""
    },
    nutrition_per_serving: null,
    fodmap_details: {
      oligosaccharides: false,
      fructose_excess: false,
      lactose: false,
      polyols: false
    }
  };
}

function buildFallbackValidResult(input) {
  const label = input.trim() || "Unknown food";
  return {
    input_validity: "Valid",
    food_name: label,
    may_trigger_ibs: false,
    summary: `Could not fully parse model output for ${label}, so this result is limited. Please try again for a more complete profile.`,
    ibs_tolerance: "Unknown",
    fodmap_level: "Unknown",
    serving_fodmap_level: "Unknown",
    aliases: [],
    possible_reasons: [],
    trigger_conditions: [],
    special_notes: [],
    common_symptoms: [],
    alternatives: [],
    evidence_confidence: "Limited",
    portion_advice: "",
    serving_size: "1 serving",
    typical_serving: {
      description: "1 serving",
      grams: null
    },
    fodmap_serving_threshold: {
      low_fodmap_serving_g: null,
      moderate_fodmap_serving_g: null,
      high_fodmap_serving_g: null,
      notes: ""
    },
    nutrition_per_serving: null,
    fodmap_details: {
      oligosaccharides: false,
      fructose_excess: false,
      lactose: false,
      polyols: false
    }
  };
}

function normalizePayload(raw, fallbackFoodName) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const foodName = typeof raw.food_name === "string" && raw.food_name.trim() ? raw.food_name.trim() : fallbackFoodName;
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
  const mayTrigger = typeof raw.may_trigger_ibs === "boolean" ? raw.may_trigger_ibs : false;
  const inputValidity = ALLOWED_INPUT_VALIDITY.has(raw.input_validity) ? raw.input_validity : "Valid";
  const fodmapLevel = ALLOWED_FODMAP.has(raw.fodmap_level) ? raw.fodmap_level : "Unknown";
  const servingFodmapLevel = ALLOWED_FODMAP.has(raw.serving_fodmap_level) ? raw.serving_fodmap_level : fodmapLevel;
  const evidenceConfidence = ALLOWED_EVIDENCE_CONFIDENCE.has(raw.evidence_confidence)
    ? raw.evidence_confidence
    : "Limited";
  const ibsTolerance = ALLOWED_IBS_TOLERANCE.has(raw.ibs_tolerance) ? raw.ibs_tolerance : "Unknown";
  const portionAdvice = typeof raw.portion_advice === "string" ? raw.portion_advice.trim() : "";
  const servingSize =
    typeof raw.serving_size === "string" && raw.serving_size.trim() ? raw.serving_size.trim() : "1 serving";
  const typicalServing =
    raw.typical_serving && typeof raw.typical_serving === "object" && !Array.isArray(raw.typical_serving)
      ? {
          description:
            typeof raw.typical_serving.description === "string" ? raw.typical_serving.description.trim() : servingSize,
          grams: toNumberOrNull(raw.typical_serving.grams)
        }
      : {
          description: servingSize,
          grams: null
        };
  const fodmapServingThreshold =
    raw.fodmap_serving_threshold &&
    typeof raw.fodmap_serving_threshold === "object" &&
    !Array.isArray(raw.fodmap_serving_threshold)
      ? {
          low_fodmap_serving_g: toNumberOrNull(raw.fodmap_serving_threshold.low_fodmap_serving_g),
          moderate_fodmap_serving_g: toNumberOrNull(raw.fodmap_serving_threshold.moderate_fodmap_serving_g),
          high_fodmap_serving_g: toNumberOrNull(raw.fodmap_serving_threshold.high_fodmap_serving_g),
          notes:
            typeof raw.fodmap_serving_threshold.notes === "string"
              ? raw.fodmap_serving_threshold.notes.trim()
              : ""
        }
      : {
          low_fodmap_serving_g: null,
          moderate_fodmap_serving_g: null,
          high_fodmap_serving_g: null,
          notes: ""
        };

  const nutritionSource =
    raw.nutrition_per_serving &&
    typeof raw.nutrition_per_serving === "object" &&
    !Array.isArray(raw.nutrition_per_serving)
      ? raw.nutrition_per_serving
      : raw.nutrition_per_100g && typeof raw.nutrition_per_100g === "object" && !Array.isArray(raw.nutrition_per_100g)
        ? raw.nutrition_per_100g
        : null;
  const nutrition =
    nutritionSource
      ? {
          energy_kj: toNumberOrNull(nutritionSource.energy_kj),
          calories_kcal: toNumberOrNull(nutritionSource.calories_kcal),
          carbohydrates_g: toNumberOrNull(nutritionSource.carbohydrates_g),
          dietary_fibre_g: toNumberOrNull(nutritionSource.dietary_fibre_g ?? nutritionSource.fiber_g),
          sugars_g: toNumberOrNull(nutritionSource.sugars_g ?? nutritionSource.sugar_g),
          protein_g: toNumberOrNull(nutritionSource.protein_g),
          total_fat_g: toNumberOrNull(nutritionSource.total_fat_g ?? nutritionSource.fat_g),
          saturated_fat_g: toNumberOrNull(nutritionSource.saturated_fat_g),
          sodium_mg: toNumberOrNull(nutritionSource.sodium_mg)
        }
      : null;
  const fodmapDetails =
    raw.fodmap_details && typeof raw.fodmap_details === "object" && !Array.isArray(raw.fodmap_details)
      ? {
          oligosaccharides: Boolean(raw.fodmap_details.oligosaccharides),
          fructose_excess: Boolean(raw.fodmap_details.fructose_excess),
          lactose: Boolean(raw.fodmap_details.lactose),
          polyols: Boolean(raw.fodmap_details.polyols)
        }
      : {
          oligosaccharides: false,
          fructose_excess: false,
          lactose: false,
          polyols: false
        };

  if (inputValidity === "Invalid") {
    return {
      input_validity: "Invalid",
      food_name: foodName,
      may_trigger_ibs: false,
      summary: summary || `${foodName} is not food, and your stomach is not a scrapyard.`,
      ibs_tolerance: "Unknown",
      fodmap_level: "Unknown",
      serving_fodmap_level: "Unknown",
      aliases: [],
      possible_reasons: [],
      trigger_conditions: [],
      special_notes: [],
      common_symptoms: [],
      alternatives: [],
      evidence_confidence: "Limited",
      portion_advice: "",
      serving_size: "",
      typical_serving: {
        description: "",
        grams: null
      },
      fodmap_serving_threshold: {
        low_fodmap_serving_g: null,
        moderate_fodmap_serving_g: null,
        high_fodmap_serving_g: null,
        notes: ""
      },
      nutrition_per_serving: null,
      fodmap_details: {
        oligosaccharides: false,
        fructose_excess: false,
        lactose: false,
        polyols: false
      }
    };
  }

  return {
    input_validity: "Valid",
    food_name: foodName,
    may_trigger_ibs: mayTrigger,
    summary,
    ibs_tolerance: ibsTolerance,
    fodmap_level: fodmapLevel,
    serving_fodmap_level: servingFodmapLevel,
    aliases: toStringArray(raw.aliases),
    possible_reasons: toStringArray(raw.possible_reasons),
    trigger_conditions: toStringArray(raw.trigger_conditions),
    special_notes: toStringArray(raw.special_notes),
    common_symptoms: toStringArray(raw.common_symptoms),
    alternatives: toStringArray(raw.alternatives),
    evidence_confidence: evidenceConfidence,
    portion_advice: portionAdvice,
    serving_size: servingSize,
    typical_serving: typicalServing,
    fodmap_serving_threshold: fodmapServingThreshold,
    nutrition_per_serving: nutrition,
    fodmap_details: fodmapDetails
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const food = typeof body?.food === "string" ? body.food.trim() : "";
    const userContext = normalizeUserContext(body?.user_context ?? body?.context);

    if (!food) {
      return NextResponse.json({ error: "Food name is required." }, { status: 400 });
    }

    if (isClearlyNonFood(food)) {
      return NextResponse.json({ result: buildInvalidResult(food) });
    }

    const key = food.toLowerCase();
    if (key === "carrot" || key === "carrots") {
      return NextResponse.json({ result: PREMADE_PROFILES.carrot });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1400,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Food: ${food}\nUser context: ${JSON.stringify(userContext)}\nGenerate the IBS food profile as JSON.`
        }
      ]
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const parsed = extractJsonObject(text);
    const normalized = normalizePayload(parsed, food);

    if (!normalized) {
      console.error("IBS lookup parse failure. Raw model text:", text);
      return NextResponse.json({ result: buildFallbackValidResult(food) });
    }

    return NextResponse.json({ result: normalized });
  } catch (error) {
    console.error("IBS lookup API error:", error);

    const status = typeof error?.status === "number" ? error.status : 500;
    const providerMessage =
      typeof error?.error?.message === "string"
        ? error.error.message
        : typeof error?.message === "string"
          ? error.message
          : "";

    let userMessage = "Unable to fetch IBS lookup data right now.";
    if (status === 400) userMessage = "Anthropic rejected the request. Check model name and prompt format.";
    if (status === 401) userMessage = "Anthropic authentication failed. Check ANTHROPIC_API_KEY.";
    if (status === 403) userMessage = "Anthropic access denied for this key/model.";
    if (status === 404) userMessage = "Anthropic model not found. Check CLAUDE_MODEL.";
    if (status === 429) userMessage = "Anthropic rate limit reached. Try again shortly.";
    if (status >= 500 && status <= 599) userMessage = "Anthropic service error. Try again shortly.";

    return NextResponse.json(
      {
        error: userMessage,
        details: providerMessage || null
      },
      { status: status >= 400 && status <= 599 ? status : 500 }
    );
  }
}
