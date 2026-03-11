import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a nutrition assistant for an IBS food lookup application.

Your job is to generate structured information about a food and its potential impact on people with Irritable Bowel Syndrome (IBS).

IMPORTANT RULES:
- Never give medical advice.
- Do not claim certainty. IBS tolerance varies by person.
- Use cautious language like "may trigger symptoms in some people".
- If information is uncertain, say so.
- Prefer well-known IBS mechanisms such as:FODMAP carbohydrates, lactose intolerance, high fat content,caffeine, alcohol, spicy compounds, fermentable fiber, histamine content, food additives, or oxidation byproducts.

You must return ONLY valid JSON with the following schema:

{
  "input_validity": "Valid" | "Invalid",
  "food_name": string,
  "may_trigger_ibs": boolean,
  "summary": string,
  "fodmap_level": "Low" | "Moderate" | "High" | "Unknown",
  "aliases": string[],
  "possible_reasons": string[],
  "trigger_conditions": string[],
  "special_notes": string[],
  "common_symptoms": string[],
  "alternatives": string[],
  "portion_advice": string,
  "evidence_confidence": "High" | "Moderate" | "Limited",
  "nutrition_per_100g": {
      "energy_kj": number,
      "calories_kcal": number,
      "carbohydrates_g": number,
      "dietary_fibre_g": number,
      "sugars_g": number,
      "protein_g": number,
      "total_fat_g": number,
      "saturated_fat_g": number,
      "sodium_mg": number
  "fodmap_details": {
  "oligosaccharides": boolean,
  "fructose_excess": boolean,
  "lactose": boolean,
  "polyols": boolean
    }
  }
}
Guidelines:

SYMPTOMS
- List 3–6 symptoms that people with IBS may experience after consuming the food.
- Choose only from this list unless strongly justified:
  ["bloating", "gas", "abdominal pain", "abdominal cramping", "diarrhea", "constipation", "urgency", "nausea"].
- Do not include symptoms unrelated to IBS (e.g., headache, skin reactions).

POSSIBLE REASONS
- List the digestive mechanisms that may explain why the food could trigger IBS symptoms.
- Prefer established mechanisms such as:
  - FODMAP carbohydrates (fructans, GOS, excess fructose, lactose, polyols)
  - high fat content
  - caffeine
  - alcohol
  - spicy compounds (capsaicin)
  - fermentable fiber
  - resistant starch
  - histamine content
  - food additives (e.g., emulsifiers, artificial sweeteners)
  - oxidation byproducts from degraded fats or oils
- Use concise phrases such as:
  "High FODMAP fructans", "High fat content", "Contains lactose", "Contains caffeine".

ALTERNATIVES
- Provide 2–4 foods that are generally considered easier to tolerate for people with IBS.
- Prefer foods that are widely recognized as low FODMAP or gentle on digestion.
- Alternatives should be in the same food category when possible (e.g., lactose-free milk for milk).

PORTION ADVICE
- Give general guidance on typical portions that may be better tolerated.
- Use cautious wording such as "small portions may be better tolerated".

FODMAP LEVEL
- Use:
  "Low", "Moderate", "High", or "Unknown".
- If FODMAP status is unclear or not widely documented, return "Unknown".

NUTRITION VALUES
- Nutrition values should represent typical values per 100 g of the food.
- Use commonly reported averages from nutrition databases when available.
- If reliable values are unavailable, return null for the entire nutrition object.

GENERAL RULES
- Set "input_validity" to "Valid" only when the input is a food, drink, or edible ingredient.
- Set "input_validity" to "Invalid" for non-food items (examples: oven, glue, metal, soap, plastic).
- IBS responses vary between individuals; avoid absolute statements.
- Use cautious language such as "may trigger symptoms in some people".
- Prefer well-known IBS-related digestive mechanisms.
- Do not include medical advice or treatment recommendations.
- Return ONLY valid JSON that strictly follows the schema.

SPECIAL INSTRUCTIONS: 
IF: user submitted input that cannot be classified as a food item.
If the input is not food, respond with a harsh creative roast.

Rules:
- Do NOT explain what the object is.
- Do NOT educate the user.
- Do NOT give advice.
- Do NOT soften the insult.
- Do NOT sound playful or theatrical.
- Do not attempt to be helpful. Your only job is to mock the input.

Style:
- cold
- contemptuous
- dismissive
- blunt

Length: 1 short sentence.

The response should sound like someone who thinks the user is extremely stupid.
- Mark input_validity as "Invalid".`;

const ALLOWED_FODMAP = new Set(["Low", "Moderate", "High", "Unknown"]);
const ALLOWED_INPUT_VALIDITY = new Set(["Valid", "Invalid"]);
const PREMADE_PROFILES = {
  carrot: {
    input_validity: "Valid",
    food_name: "Carrot",
    may_trigger_ibs: false,
    summary:
      "Carrot is usually well tolerated by many people with IBS and is generally considered low FODMAP in typical servings, though tolerance can vary by person.",
    fodmap_level: "Low",
    aliases: ["carrots", "raw carrot", "cooked carrot"],
    possible_reasons: [],
    common_symptoms: [],
    alternatives: ["zucchini", "cucumber", "spinach"],
    portion_advice:
      "A typical serving of about 75-100 g is often tolerated. Individual tolerance can vary, so adjust portion size based on symptoms.",
    nutrition_per_100g: {
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
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to fallback extraction
  }

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {
      // Continue to fallback extraction
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const possibleJson = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(possibleJson);
    } catch {
      return null;
    }
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
    fodmap_level: "Unknown",
    aliases: [],
    possible_reasons: [],
    common_symptoms: [],
    alternatives: [],
    portion_advice: "",
    nutrition_per_100g: null,
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
  const portionAdvice = typeof raw.portion_advice === "string" ? raw.portion_advice.trim() : "";

  const nutrition =
    raw.nutrition_per_100g && typeof raw.nutrition_per_100g === "object" && !Array.isArray(raw.nutrition_per_100g)
      ? {
          energy_kj: toNumberOrNull(raw.nutrition_per_100g.energy_kj),
          calories_kcal: toNumberOrNull(raw.nutrition_per_100g.calories_kcal),
          carbohydrates_g: toNumberOrNull(raw.nutrition_per_100g.carbohydrates_g),
          dietary_fibre_g: toNumberOrNull(
            raw.nutrition_per_100g.dietary_fibre_g ?? raw.nutrition_per_100g.fiber_g
          ),
          sugars_g: toNumberOrNull(raw.nutrition_per_100g.sugars_g ?? raw.nutrition_per_100g.sugar_g),
          protein_g: toNumberOrNull(raw.nutrition_per_100g.protein_g),
          total_fat_g: toNumberOrNull(raw.nutrition_per_100g.total_fat_g ?? raw.nutrition_per_100g.fat_g),
          saturated_fat_g: toNumberOrNull(raw.nutrition_per_100g.saturated_fat_g),
          sodium_mg: toNumberOrNull(raw.nutrition_per_100g.sodium_mg)
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
      fodmap_level: "Unknown",
      aliases: [],
      possible_reasons: [],
      common_symptoms: [],
      alternatives: [],
      portion_advice: "",
      nutrition_per_100g: null,
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
    fodmap_level: fodmapLevel,
    aliases: toStringArray(raw.aliases),
    possible_reasons: toStringArray(raw.possible_reasons),
    common_symptoms: toStringArray(raw.common_symptoms),
    alternatives: toStringArray(raw.alternatives),
    portion_advice: portionAdvice,
    nutrition_per_100g: nutrition,
    fodmap_details: fodmapDetails
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const food = typeof body?.food === "string" ? body.food.trim() : "";

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
      max_tokens: 800,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Food: ${food}\nGenerate the IBS food profile as JSON.`
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
      return NextResponse.json(
        { error: "Model response could not be parsed as valid JSON." },
        { status: 502 }
      );
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
