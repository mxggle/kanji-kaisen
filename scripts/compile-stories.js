const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Helper to parse markdown sections
function parseMarkdownSections(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
        if (line.startsWith('## ')) {
            if (currentSection) {
                sections[currentSection] = currentContent.join('\n').trim();
            }
            currentSection = line.substring(3).trim();
            currentContent = [];
        } else if (currentSection) {
            currentContent.push(line);
        }
    }

    if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
}

// Compile all stories to JSON
function compileStories() {
    const output = {
        categories: {},
        radicals: {}
    };

    // Load category stories
    const categories = [
        'Nature & Elements',
        'Human Body & People',
        'Action & Movement',
        'Structures & Home',
        'Animals & Wildlife',
        'Tools & Weapons',
        'Communication & Thought',
        'Textiles, Plants & Food',
        'States & Attributes',
        'Time & Sequence'
    ];

    categories.forEach(category => {
        try {
            const fileName = category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
            const filePath = path.join(__dirname, '../lib/stories/categories', `${fileName}.md`);

            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const { data, content } = matter(fileContent);
                const sections = parseMarkdownSections(content);

                const commonPatterns = [];
                if (sections['Common Patterns']) {
                    const lines = sections['Common Patterns'].split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                            const text = line.trim().substring(1).trim();
                            const cleanedText = text.replace(/^\*\*/g, '').replace(/\*\*/g, '');
                            commonPatterns.push(cleanedText);
                        }
                    }
                }

                output.categories[category] = {
                    name: data.name || category,
                    title: data.title || '',
                    description: sections['Description'] || '',
                    whyItMatters: sections['Why It Matters'] || '',
                    learningTip: sections['Learning Tip'] || '',
                    commonPatterns,
                    icon: data.icon || '📚'
                };
            }
        } catch (error) {
            console.error(`Error loading category ${category}:`, error);
        }
    });

    // Load all radical stories
    try {
        const radicalsDir = path.join(__dirname, '../lib/stories/radicals');

        if (fs.existsSync(radicalsDir)) {
            const files = fs.readdirSync(radicalsDir);

            for (const file of files) {
                if (!file.endsWith('.md')) continue;

                try {
                    const key = file.replace('.md', '');
                    const filePath = path.join(radicalsDir, file);
                    const fileContent = fs.readFileSync(filePath, 'utf-8');
                    const { data, content } = matter(fileContent);
                    const sections = parseMarkdownSections(content);

                    const exampleKanji = [];
                    if (sections['Example Kanji']) {
                        const exampleText = sections['Example Kanji'];
                        const exampleRegex = /###\s*([^\s(]+)\s*\(([^)]+)\)\s*\n\n([^\n#]+)/g;
                        let match;

                        while ((match = exampleRegex.exec(exampleText)) !== null) {
                            exampleKanji.push({
                                char: match[1].trim(),
                                meaning: match[2].trim(),
                                explanation: match[3].trim()
                            });
                        }
                    }

                    const finalKey = data.key || key;
                    output.radicals[finalKey] = {
                        key: finalKey,
                        char: data.char || '',
                        name: data.name || key,
                        meaning: data.meaning || '',
                        origin: sections['Origin'] || '',
                        story: sections['Story'] || '',
                        position: sections['Position'] || '',
                        transformsMeaning: sections['Transforms Meaning'] || '',
                        exampleKanji
                    };
                } catch (error) {
                    console.error(`Error loading radical ${file}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error loading radical stories:', error);
    }

    // Write to compiled JSON
    const outputPath = path.join(__dirname, '../lib/compiled-stories.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`✅ Compiled ${Object.keys(output.categories).length} category stories`);
    console.log(`✅ Compiled ${Object.keys(output.radicals).length} radical stories`);
    console.log(`📝 Output: ${outputPath}`);
}

// Run compilation
compileStories();
