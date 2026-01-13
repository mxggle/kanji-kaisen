const fs = require('fs');
const path = require('path');

// Load the radical category map
const radicalCategoryMap = require('../lib/radical-category-map.json');

// Load existing stories to get data
const existingStoriesPath = path.join(__dirname, '../lib/stories.ts');
const existingStories = fs.readFileSync(existingStoriesPath, 'utf-8');

// Helper function to extract story data from the TypeScript file
function extractExistingStory(key) {
    const regex = new RegExp(`"${key}":\\s*{([\\s\\S]*?)}(?=,?\\s*(?:"[^"]+"|\\}))`);
    const match = existingStories.match(regex);
    if (!match) return null;

    const storyText = match[1];

    // Extract fields
    const extract = (field) => {
        const fieldRegex = new RegExp(`${field}:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
        const fieldMatch = storyText.match(fieldRegex);
        return fieldMatch ? fieldMatch[1].replace(/\\"/g, '"') : '';
    };

    const extractArray = (field) => {
        const arrayRegex = new RegExp(`${field}:\\s*\\[([\\s\\S]*?)\\]`);
        const arrayMatch = storyText.match(arrayRegex);
        if (!arrayMatch) return [];

        const items = [];
        const itemRegex = /{([^}]+)}/g;
        let itemMatch;
        while ((itemMatch = itemRegex.exec(arrayMatch[1])) !== null) {
            const item = {};
            const charMatch = itemMatch[1].match(/char:\\s*"([^"]*)"/);
            const meaningMatch = itemMatch[1].match(/meaning:\\s*"([^"]*)"/);
            const explanationMatch = itemMatch[1].match(/explanation:\\s*"([^"]*)"/);

            if (charMatch) item.char = charMatch[1];
            if (meaningMatch) item.meaning = meaningMatch[1];
            if (explanationMatch) item.explanation = explanationMatch[1];

            items.push(item);
        }
        return items;
    };

    return {
        key,
        char: extract('char'),
        name: extract('name'),
        meaning: extract('meaning'),
        origin: extract('origin'),
        story: extract('story'),
        position: extract('position'),
        transformsMeaning: extract('transformsMeaning'),
        exampleKanji: extractArray('exampleKanji')
    };
}

// Generate markdown content for a radical
function generateMarkdown(story) {
    const { key, char, name, meaning, origin, story: storyText, position, transformsMeaning, exampleKanji, category } = story;

    let md = `---
key: "${key}"
char: "${char}"
name: "${name}"
meaning: "${meaning}"
category: "${category}"
---

## Origin

${origin}

## Story

${storyText}

## Position

${position}

## Transforms Meaning

${transformsMeaning}

## Example Kanji
`;

    exampleKanji.forEach(example => {
        md += `\n### ${example.char} (${example.meaning})\n\n${example.explanation}\n`;
    });

    return md;
}

// Generate a default story for radicals without existing stories
function generateDefaultStory(key, category) {
    // This is a placeholder - in a real scenario, you'd use AI or manual curation
    return {
        key,
        char: '?',
        name: key.charAt(0).toUpperCase() + key.slice(1),
        meaning: `${key} radical`,
        origin: `The ${key} radical represents an important component in Japanese kanji.`,
        story: `Think of ${key} as a key building block that helps you understand related kanji characters.`,
        position: 'Various positions in kanji',
        transformsMeaning: `Adds meaning related to ${key} when appearing in kanji`,
        exampleKanji: [
            { char: '?', meaning: 'example', explanation: 'Example kanji using this radical' },
            { char: '?', meaning: 'example', explanation: 'Another example kanji' },
            { char: '?', meaning: 'example', explanation: 'Third example kanji' }
        ],
        category
    };
}

// Main generation function
async function generateAllRadicalMarkdowns() {
    const radicalsDir = path.join(__dirname, '../lib/stories/radicals');

    // Ensure directory exists
    if (!fs.existsSync(radicalsDir)) {
        fs.mkdirSync(radicalsDir, { recursive: true });
    }

    let created = 0;
    let skipped = 0;

    for (const [key, category] of Object.entries(radicalCategoryMap)) {
        const outputPath = path.join(radicalsDir, `${key}.md`);

        // Skip if already exists
        if (fs.existsSync(outputPath)) {
            skipped++;
            continue;
        }

        // Try to extract existing story
        let story = extractExistingStory(key);

        // If no existing story, generate default
        if (!story || !story.char) {
            story = generateDefaultStory(key, category);
        } else {
            story.category = category;
        }

        // Generate markdown
        const markdown = generateMarkdown(story);

        // Write file
        fs.writeFileSync(outputPath, markdown, 'utf-8');
        created++;
    }

    console.log(`✅ Generated ${created} radical markdown files`);
    console.log(`⏭️  Skipped ${skipped} existing files`);
    console.log(`📊 Total radicals: ${Object.keys(radicalCategoryMap).length}`);
}

// Run the script
generateAllRadicalMarkdowns().catch(console.error);
