import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
    try {
        const { imageData, expectedKanji } = await request.json();

        if (!imageData || !expectedKanji) {
            return NextResponse.json(
                { error: "Missing imageData or expectedKanji" },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                {
                    error: "Gemini API key not configured",
                    feedback: {
                        isRecognizable: false,
                        confidence: 0,
                        strokeOrderIssues: ["API key not configured - using local matching only"],
                        shapeIssues: [],
                        suggestions: ["Add GEMINI_API_KEY to your .env.local file to enable AI feedback"]
                    }
                },
                { status: 500 }
            );
        }

        // Remove data URL prefix to get base64 string
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `You are an expert Japanese kanji teacher analyzing a student's handwritten kanji.

Expected kanji: ${expectedKanji}

Please analyze this handwritten attempt and provide constructive feedback in the following JSON format:
{
  "isRecognizable": boolean (does the drawn kanji MATCH ${expectedKanji}? Return false if it's a different kanji or unrecognizable),
  "confidence": number (0-100, how well does it match ${expectedKanji}? If it's a different kanji, return 0),
  "strokeOrderIssues": string[] (specific stroke order problems, or empty array if correct),
  "strokeFormIssues": string[] (issues with individual stroke shapes/directions),
  "shapeIssues": string[] (overall shape, balance, proportion problems),
  "suggestions": string[] (2-3 specific, actionable tips for improvement)
}

IMPORTANT RULES:
1. If the student drew a DIFFERENT kanji than ${expectedKanji}, set isRecognizable to false and confidence to 0.
2. When the kanji is WRONG or doesn't match, you MUST still provide helpful suggestions. For example:
   - If they drew a different kanji, tell them which kanji it looks like and how ${expectedKanji} differs
   - Describe the key features of ${expectedKanji} they should focus on
   - Give specific guidance on what strokes or shapes to change
3. NEVER return empty arrays for suggestions when isRecognizable is false - always help them understand what went wrong!

Be encouraging and specific. Focus on what would help them improve most.
Return ONLY valid JSON, no other text.`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: "image/png",
                    data: base64Data,
                },
            },
            { text: prompt },
        ]);

        const response = await result.response;
        const text = response.text();

        // Parse JSON from response
        let feedback;
        try {
            // Try to extract JSON from response (sometimes it includes markdown code blocks)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                feedback = JSON.parse(jsonMatch[0]);
            } else {
                feedback = JSON.parse(text);
            }
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", text);
            return NextResponse.json(
                {
                    error: "Failed to parse AI response",
                    rawResponse: text,
                    feedback: {
                        isRecognizable: false,
                        confidence: 0,
                        strokeOrderIssues: [],
                        strokeFormIssues: [],
                        shapeIssues: [],
                        suggestions: ["AI analysis failed - try again"]
                    }
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error("Gemini API error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to analyze kanji",
                feedback: {
                    isRecognizable: false,
                    confidence: 0,
                    strokeOrderIssues: [],
                    strokeFormIssues: [],
                    shapeIssues: [],
                    suggestions: ["AI analysis temporarily unavailable"]
                }
            },
            { status: 500 }
        );
    }
}
