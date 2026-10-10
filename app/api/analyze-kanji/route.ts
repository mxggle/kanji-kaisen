import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { MAX_IMAGE_DATA_LENGTH, normalizeFeedback, parseAnalyzeRequest } from "@/lib/kanji-feedback";
import { createRateLimiter } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const isAllowed = createRateLimiter({ limit: 15, windowMs: 60_000 });

// Leaves room for the JSON wrapper around the image data.
const MAX_BODY_LENGTH = MAX_IMAGE_DATA_LENGTH + 1_000;

const stringList: ResponseSchema = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };

const FEEDBACK_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        isRecognizable: { type: SchemaType.BOOLEAN },
        confidence: { type: SchemaType.NUMBER },
        strokeOrderIssues: stringList,
        strokeFormIssues: stringList,
        shapeIssues: stringList,
        suggestions: stringList,
    },
    required: [
        "isRecognizable",
        "confidence",
        "strokeOrderIssues",
        "strokeFormIssues",
        "shapeIssues",
        "suggestions",
    ],
};

function getClientKey(request: NextRequest) {
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }

    if (!isAllowed(getClientKey(request))) {
        return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const declaredLength = Number(request.headers.get("content-length"));
    if (declaredLength > MAX_BODY_LENGTH) {
        return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
    }

    let input;
    try {
        const body = await request.text();
        if (body.length > MAX_BODY_LENGTH) {
            return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
        }
        input = parseAnalyzeRequest(JSON.parse(body));
    } catch {
        input = null;
    }

    if (!input) {
        return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const { imageData, expectedKanji } = input;

    try {
        // Remove data URL prefix to get base64 string
        const base64Data = imageData.replace(/^data:image\/png;base64,/, "");

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: FEEDBACK_SCHEMA,
            },
        });

        const prompt = `You are an expert Japanese kanji teacher analyzing a student's handwritten kanji.

Expected kanji: ${expectedKanji}

Analyze this handwritten attempt and provide constructive feedback:
- isRecognizable: does the drawn kanji MATCH ${expectedKanji}? false if it's a different kanji or unrecognizable.
- confidence: 0-100, how well does it match ${expectedKanji}? If it's a different kanji, return 0.
- strokeOrderIssues: specific stroke order problems, or empty if correct.
- strokeFormIssues: issues with individual stroke shapes/directions.
- shapeIssues: overall shape, balance, proportion problems.
- suggestions: 2-3 specific, actionable tips for improvement.

IMPORTANT RULES:
1. If the student drew a DIFFERENT kanji than ${expectedKanji}, set isRecognizable to false and confidence to 0.
2. When the kanji is WRONG or doesn't match, you MUST still provide helpful suggestions. For example:
   - If they drew a different kanji, tell them which kanji it looks like and how ${expectedKanji} differs
   - Describe the key features of ${expectedKanji} they should focus on
   - Give specific guidance on what strokes or shapes to change
3. NEVER return empty suggestions when isRecognizable is false - always help them understand what went wrong!

Be encouraging and specific. Focus on what would help them improve most.`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: "image/png",
                    data: base64Data,
                },
            },
            { text: prompt },
        ]);

        const text = result.response.text();

        let feedback;
        try {
            feedback = normalizeFeedback(JSON.parse(text));
        } catch {
            feedback = null;
        }

        if (!feedback) {
            console.error("Unexpected Gemini response:", text);
            return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
        }

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error("Gemini API error:", error);
        return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
    }
}
