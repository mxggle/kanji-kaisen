// Story data for categories and radicals
// Each story explains the meaning, origin, and importance of learning these elements

export interface CategoryStory {
    name: string;
    title: string;
    description: string;
    whyItMatters: string;
    learningTip: string;
    commonPatterns: string[];
    icon: string; // emoji or symbol
}

export interface RadicalStory {
    key: string; // romaji identifier
    char: string;
    name: string;
    meaning: string;
    origin: string; // pictographic/etymological origin
    story: string; // memorable mnemonic story
    position: string; // where it typically appears in kanji
    transformsMeaning: string; // how it affects kanji meaning
    exampleKanji: Array<{
        char: string;
        meaning: string;
        explanation: string;
    }>;
}

// ==========================================
// CATEGORY STORIES
// ==========================================

export const CATEGORY_STORIES: Record<string, CategoryStory> = {
    "Nature & Elements": {
        name: "Nature & Elements",
        title: "The World Around Us",
        description: "These radicals represent the fundamental elements of the natural world—water, fire, earth, wood, mountains, and celestial bodies. Ancient Chinese scholars observed nature closely and created symbols that captured the essence of each element.",
        whyItMatters: "Nature radicals are among the most common in Japanese kanji. Understanding them unlocks hundreds of characters related to weather, geography, materials, and natural phenomena. When you see 氵(water), 火 (fire), or 木 (tree/wood), you'll immediately have a clue about the kanji's meaning.",
        learningTip: "Many nature radicals evolved from pictographs. Try to see the original image: 山 looks like three mountain peaks, 川 shows flowing water, and 火 depicts flames rising. Visualizing these connections makes them unforgettable.",
        commonPatterns: [
            "氵(sanzui) - water radical on the left means liquid, flowing, or wet",
            "火/灬 (hi/rekka) - fire radical indicates heat, burning, or cooking",
            "木 (ki) - tree radical relates to wood, plants, or organic things",
            "土 (tsuchi) - earth radical connects to ground, place, or construction"
        ],
        icon: "🌿"
    },
    "Human Body & People": {
        name: "Human Body & People",
        title: "The Human Experience",
        description: "These radicals depict parts of the human body, human figures, and relationships between people. From 人 (person) to 心 (heart/mind), these symbols connect us to the most intimate aspects of being human.",
        whyItMatters: "Human-related radicals appear in kanji about emotions, actions, relationships, and society. The 亻(ninben - person radical) alone appears in over 100 common kanji! Understanding 心 (heart) radicals helps you read emotional vocabulary.",
        learningTip: "Notice how body parts often become simplified when used as radicals. 人 becomes 亻 on the left side, 手 becomes 扌, and 心 becomes 忄. Learning these transformations is key to recognizing radicals in context.",
        commonPatterns: [
            "亻(ninben) - person on the left indicates human actions or qualities",
            "扌(tehen) - hand radical means touching, making, or manipulating",
            "目 (me) - eye radical relates to seeing, watching, or appearance",
            "口 (kuchi) - mouth radical connects to speaking, eating, or openings"
        ],
        icon: "👤"
    },
    "Action & Movement": {
        name: "Action & Movement",
        title: "Motion and Change",
        description: "These radicals capture the essence of movement, action, and transformation. From walking (辶) to stopping (止), they represent the dynamic nature of life and change.",
        whyItMatters: "Action radicals are essential for understanding verbs and describing what people do. The 辶 (shinnyou - movement radical) appears in many common kanji like 道 (way), 進 (advance), and 運 (carry). Mastering these unlocks action vocabulary.",
        learningTip: "Many action radicals show feet or legs in motion. 辶 (shinnyou) sweeps along the bottom like a path being walked. 走 (run) shows a person with moving legs. Imagine the motion to remember them.",
        commonPatterns: [
            "辶 (shinnyou) - movement radical indicates traveling or paths",
            "止 (tomeru) - stop radical means halting or footsteps",
            "力 (chikara) - power radical relates to strength or effort",
            "彳 (gyouninben) - step radical indicates walking or streets"
        ],
        icon: "🏃"
    },
    "Structures & Home": {
        name: "Structures & Home",
        title: "Shelter and Civilization",
        description: "These radicals represent buildings, roofs, enclosures, and the spaces humans create. From the roof radical 宀 to the gate 門, they show how we shape our environment.",
        whyItMatters: "Structure radicals help you understand kanji about buildings, rooms, safety, and civilization. When you see 宀 (roof) on top of a character, you know it relates to houses, protection, or what's inside. 門 (gate) indicates entrances or barriers.",
        learningTip: "Structure radicals often 'contain' other elements, just like real buildings contain things. The 囗 (kunigamae - enclosure) literally wraps around other components. Think of radicals as the 'container' and inner parts as 'contents.'",
        commonPatterns: [
            "宀 (ukanmuri) - roof radical means houses, protection, or family",
            "門 (mongamae) - gate radical indicates entrances or barriers",
            "广 (madare) - cliff/building radical relates to structures",
            "囗 (kunigamae) - enclosure radical means surrounded or contained"
        ],
        icon: "🏠"
    },
    "Animals & Wildlife": {
        name: "Animals & Wildlife",
        title: "Creatures of the World",
        description: "These radicals depict animals from everyday life—dogs, horses, fish, birds, and insects. Ancient people observed these creatures and found ways to represent their essential characteristics.",
        whyItMatters: "Animal radicals appear in kanji about specific animals, animal behaviors, and metaphors derived from animal traits. The 犭 (kemonohen - animal radical) appears in many creature-related kanji. Understanding these helps with nature vocabulary.",
        learningTip: "Many animal radicals were originally pictographs. 馬 (horse) shows the head, mane, and legs. 魚 (fish) depicts a fish with scales and tail. 鳥 (bird) shows feathers and claws. Look for the original animal shapes!",
        commonPatterns: [
            "犭 (kemonohen) - beast radical indicates four-legged animals",
            "鳥 (tori) - bird radical means flying creatures",
            "魚 (uo) - fish radical relates to aquatic life",
            "虫 (mushi) - insect radical includes bugs and small creatures"
        ],
        icon: "🦊"
    },
    "Tools & Weapons": {
        name: "Tools & Weapons",
        title: "Instruments of Creation and Conflict",
        description: "These radicals represent the tools humans use—from agricultural implements to weapons, containers to vehicles. They reflect humanity's ingenuity in solving problems and surviving.",
        whyItMatters: "Tool radicals help you understand kanji about making things, cutting, measuring, and technology. The 刂 (rittou - knife radical) appears in many kanji about cutting or dividing. 車 (kuruma - wheel/cart) relates to vehicles and transportation.",
        learningTip: "Tool radicals often suggest what the kanji 'does.' 刂 (knife) means cutting or separating. 弓 (bow) relates to shooting or bending. 斤 (axe) indicates chopping or weight. Think about what action the tool performs.",
        commonPatterns: [
            "刂 (rittou) - knife radical means cutting or dividing",
            "弓 (yumi) - bow radical relates to bending or shooting",
            "車 (kuruma) - cart radical indicates vehicles or wheels",
            "金 (kane) - metal radical means metals or money"
        ],
        icon: "⚔️"
    },
    "Communication & Thought": {
        name: "Communication & Thought",
        title: "Mind and Expression",
        description: "These radicals capture the human capacity for thought, speech, and communication. From 言 (words) to 心 (heart/mind), they represent our inner world and how we share it.",
        whyItMatters: "Communication radicals are essential for vocabulary about speaking, thinking, reading, and writing. The 言 (gonben - speech radical) appears in verbs like 話す (talk), 読む (read), and 語る (tell). These are fundamental for language learning.",
        learningTip: "訁(gonben) is the simplified form of 言 used on the left side of kanji. When you see it, think 'words' or 'language.' Similarly, 心 (and its variants 忄 and ⺗) all relate to emotions and thoughts.",
        commonPatterns: [
            "訁/言 (gonben) - speech radical means words, language, or telling",
            "心/忄 (kokoro) - heart radical relates to emotions and thoughts",
            "見 (miru) - see radical indicates observing or appearance",
            "音 (oto) - sound radical means noise or music"
        ],
        icon: "💭"
    },
    "Textiles, Plants & Food": {
        name: "Textiles, Plants & Food",
        title: "Sustenance and Craft",
        description: "These radicals represent the essentials of daily life—plants we eat, fibers we weave, and grains we cultivate. They connect us to agriculture, cooking, and craftsmanship.",
        whyItMatters: "These radicals unlock vocabulary about food, clothing, and agriculture. The 艹 (kusakanmuri - grass/plant radical) tops many plant-related kanji. 糸 (thread) appears in fabric and fine-work vocabulary. 食 (food) relates to eating and meals.",
        learningTip: "艹 (kusakanmuri) sits on TOP of kanji like grass grows on top of the earth. When you see this 'grass crown,' think plants, vegetables, or flowers. Similarly, 米 (rice) relates to Japan's most important grain and appears in 'fine' or 'detailed' meanings.",
        commonPatterns: [
            "艹 (kusakanmuri) - grass radical means plants or vegetation",
            "糸 (ito) - thread radical relates to fabric, tying, or fine things",
            "食/飠 (shoku) - food radical means eating or meals",
            "禾 (nogihen) - grain radical indicates cereals or agriculture"
        ],
        icon: "🌾"
    },
    "States & Attributes": {
        name: "States & Attributes",
        title: "Qualities and Conditions",
        description: "These radicals describe states of being, colors, sizes, and qualities. They help us express what things are like—big or small, colored or plain, good or bad.",
        whyItMatters: "State radicals are crucial for adjectives and descriptions. Understanding 大 (big), 小 (small), 長 (long), and color radicals helps you build descriptive vocabulary. These radicals often form the core meaning of the kanji they appear in.",
        learningTip: "Many state radicals are standalone kanji too. 大 means 'big' as a kanji and as a radical. 赤 means 'red' both ways. When you learn these radicals, you're often learning kanji simultaneously!",
        commonPatterns: [
            "大 (dai) - big radical means large or great",
            "小 (shou) - small radical indicates tiny or few",
            "白 (shiro) - white radical relates to blank or pure",
            "青 (ao) - blue/green radical indicates young or fresh"
        ],
        icon: "✨"
    },
    "Time & Sequence": {
        name: "Time & Sequence",
        title: "The Flow of Time",
        description: "These radicals mark time, order, and sequence. From celestial bodies that early humans used to track days to symbols of beginning and ending, they connect us to time's passage.",
        whyItMatters: "Time radicals help you understand kanji about when things happen. 日 (sun/day) appears in days of the week and time expressions. 月 (moon/month) relates to months and periods. These are essential for calendars and schedules.",
        learningTip: "日 (sun/day) and 月 (moon/month) are among the first kanji taught because they're so fundamental. Notice that 月 also appears as the 'flesh/body' radical (月 nikuzuki) in body-related kanji—context tells you which meaning applies.",
        commonPatterns: [
            "日 (hi/nichi) - sun radical means day, time, or sunlight",
            "月 (tsuki) - moon radical indicates month or period",
            "夕 (yuube) - evening radical means night or twilight",
            "十 (juu) - ten radical relates to numbers and completion"
        ],
        icon: "⏰"
    }
};

// ==========================================
// RADICAL STORIES (Selected important radicals)
// ==========================================

export const RADICAL_STORIES: Record<string, RadicalStory> = {
    // Nature & Elements
    "sanzui": {
        key: "sanzui",
        char: "氵",
        name: "Sanzui",
        meaning: "Water (3 drops)",
        origin: "This radical evolved from the kanji 水 (mizu - water). The three strokes represent droplets of water falling or flowing.",
        story: "Imagine three raindrops falling—that's sanzui! Whenever you see these three dots on the left side of a kanji, think of water, liquids, or anything that flows.",
        position: "Always appears on the LEFT side of kanji",
        transformsMeaning: "Adds the sense of water, liquid, wetness, or flowing to the kanji's meaning",
        exampleKanji: [
            { char: "海", meaning: "sea, ocean", explanation: "Water + 'every' = the water that's everywhere" },
            { char: "泳", meaning: "swim", explanation: "Water + long movement = moving through water" },
            { char: "涙", meaning: "tears", explanation: "Water from the eyes = tears" }
        ]
    },
    "hi_fire": {
        key: "hi_fire",
        char: "火",
        name: "Hi (Fire)",
        meaning: "Fire, flame",
        origin: "This is a pictograph of flames rising upward. The character shows a fire with sparks flying off to the sides.",
        story: "Look at 火 and see the campfire! The central stroke is the main flame, and the side strokes are sparks dancing in the wind. Fire brings warmth but also danger.",
        position: "Can appear as a standalone kanji or on the left/bottom of compounds",
        transformsMeaning: "Indicates burning, heat, cooking, or intense energy/passion",
        exampleKanji: [
            { char: "炎", meaning: "flame, blaze", explanation: "Fire + fire stacked = intense flames" },
            { char: "焼", meaning: "burn, roast", explanation: "Fire transforms food through cooking" },
            { char: "灯", meaning: "lamp, light", explanation: "Fire that provides light" }
        ]
    },
    "rekka": {
        key: "rekka",
        char: "灬",
        name: "Rekka",
        meaning: "Fire (4 dots)",
        origin: "This is an alternate form of the fire radical, showing four flames or embers burning beneath something.",
        story: "These four dots are flames under a cooking pot! When you see 灬 at the bottom of a kanji, imagine a fire heating something from below.",
        position: "Always appears at the BOTTOM of kanji",
        transformsMeaning: "Indicates heating, cooking, or being affected by fire",
        exampleKanji: [
            { char: "熱", meaning: "heat, fever", explanation: "Something intensely hot from flames below" },
            { char: "煮", meaning: "boil, cook", explanation: "Cooking over flames" },
            { char: "照", meaning: "illuminate", explanation: "Light and heat spreading outward" }
        ]
    },
    "ki": {
        key: "ki",
        char: "木",
        name: "Ki",
        meaning: "Tree, wood",
        origin: "This is a pictograph of a tree with a trunk (vertical line), branches (top horizontal), and roots (bottom strokes spreading).",
        story: "Stand before a great tree and see 木! The vertical line is the strong trunk, the top strokes are branches reaching for the sky, and the bottom is roots gripping the earth.",
        position: "Appears alone, on the left (kihen 木), or combined with others",
        transformsMeaning: "Relates to trees, wood, forests, or things made from wood",
        exampleKanji: [
            { char: "林", meaning: "grove, forest", explanation: "Two trees = a small forest" },
            { char: "森", meaning: "forest", explanation: "Three trees = a deep forest" },
            { char: "本", meaning: "book, origin", explanation: "A tree with roots marked = the root/origin" }
        ]
    },
    "tsuchi": {
        key: "tsuchi",
        char: "土",
        name: "Tsuchi",
        meaning: "Earth, soil, ground",
        origin: "This pictograph shows a mound of earth or the ground. The bottom line is the earth's surface, and the cross represents piled soil.",
        story: "Imagine a cross planted in the ground—that's 土! It shows a stake or plant marking the earth, reminding us of farming and construction.",
        position: "Appears alone, on the left (tsuchihen), or at the bottom",
        transformsMeaning: "Relates to ground, soil, places, or construction",
        exampleKanji: [
            { char: "地", meaning: "ground, earth", explanation: "The actual ground we stand on" },
            { char: "場", meaning: "place, location", explanation: "A designated piece of earth" },
            { char: "坂", meaning: "slope, hill", explanation: "Earth that rises up = a slope" }
        ]
    },
    "yama": {
        key: "yama",
        char: "山",
        name: "Yama",
        meaning: "Mountain",
        origin: "A pictograph of three mountain peaks rising against the sky. The original Chinese form clearly showed a mountain range.",
        story: "Three peaks reaching for the sky—that's 山! Japan is covered with mountains, making this one of the most important nature kanji.",
        position: "Appears alone or on the left/top of compounds",
        transformsMeaning: "Indicates mountains, height, or wild/natural places",
        exampleKanji: [
            { char: "岩", meaning: "rock, boulder", explanation: "The stone of mountains" },
            { char: "島", meaning: "island", explanation: "A mountain rising from the sea" },
            { char: "峠", meaning: "mountain pass", explanation: "Going up, over, and down a mountain" }
        ]
    },

    // Human Body & People
    "ninben": {
        key: "ninben",
        char: "亻",
        name: "Ninben",
        meaning: "Person (standing)",
        origin: "This is a simplified form of 人 (hito - person) used when the radical appears on the left side of kanji.",
        story: "See the person standing tall with legs apart? That's ninben! When it appears on the left, the kanji usually describes something people do, feel, or are.",
        position: "Always appears on the LEFT side of kanji",
        transformsMeaning: "Indicates human actions, qualities, or relationships",
        exampleKanji: [
            { char: "休", meaning: "rest", explanation: "A person leaning against a tree = resting" },
            { char: "作", meaning: "make, create", explanation: "A person using their hands to create" },
            { char: "住", meaning: "live, dwell", explanation: "A person staying in one place" }
        ]
    },
    "hito": {
        key: "hito",
        char: "人",
        name: "Hito",
        meaning: "Person, human",
        origin: "A pictograph showing a person in profile, with two legs walking. It represents a human being in its most basic form.",
        story: "Two lines leaning on each other for support—that's 人! It shows how humans need each other, two people supporting one another.",
        position: "Appears at the top (hitoyane), or as a standalone kanji",
        transformsMeaning: "Represents people, humanity, or someone",
        exampleKanji: [
            { char: "大", meaning: "big", explanation: "A person with arms spread wide = big" },
            { char: "入", meaning: "enter", explanation: "A person stepping into something" },
            { char: "今", meaning: "now", explanation: "A person gathering (the present moment)" }
        ]
    },
    "kokoro": {
        key: "kokoro",
        char: "心",
        name: "Kokoro",
        meaning: "Heart, mind, spirit",
        origin: "Originally a pictograph of the human heart with its chambers and blood vessels. It came to represent both the physical heart and the emotional/mental self.",
        story: "The ancient character looked like a heart with arteries. Today, 心 represents not just the organ but our feelings, thoughts, and spirit—the center of who we are.",
        position: "Appears at the bottom, or as 忄 (risshinben) on the left",
        transformsMeaning: "Relates to emotions, thoughts, feelings, or mental states",
        exampleKanji: [
            { char: "思", meaning: "think", explanation: "The brain and heart working together" },
            { char: "愛", meaning: "love", explanation: "The feeling of the heart reaching out" },
            { char: "忘", meaning: "forget", explanation: "When the heart loses something" }
        ]
    },
    "risshinben": {
        key: "risshinben",
        char: "忄",
        name: "Risshinben",
        meaning: "Heart/mind (standing)",
        origin: "This is 心 (heart) compressed into vertical form to fit on the left side of kanji. The three strokes represent the heart's essential meaning.",
        story: "When the heart moves to the left side of a kanji, it squeezes into this vertical form. Think of it as the heart standing up, ready for action!",
        position: "Always appears on the LEFT side of kanji",
        transformsMeaning: "Indicates emotional or psychological states",
        exampleKanji: [
            { char: "悲", meaning: "sad", explanation: "An emotion from the heart" },
            { char: "快", meaning: "pleasant", explanation: "A good feeling in the heart" },
            { char: "情", meaning: "emotion, feeling", explanation: "What arises from the heart" }
        ]
    },
    "te": {
        key: "te",
        char: "手",
        name: "Te",
        meaning: "Hand",
        origin: "A pictograph of an open hand with fingers spread. The original form clearly showed five fingers extending from a palm.",
        story: "Five fingers spreading from a wrist—that's the hand radical! Hands make, hold, and touch everything around us.",
        position: "Appears alone or as 扌 (tehen) on the left",
        transformsMeaning: "Relates to hands, touching, making, or manipulating",
        exampleKanji: [
            { char: "持", meaning: "hold, have", explanation: "The hand grasping something" },
            { char: "打", meaning: "hit, strike", explanation: "The hand making impact" },
            { char: "投", meaning: "throw", explanation: "The hand releasing something" }
        ]
    },
    "tehen": {
        key: "tehen",
        char: "扌",
        name: "Tehen",
        meaning: "Hand (side form)",
        origin: "This is 手 (hand) compressed into three strokes to fit on the left side of kanji.",
        story: "When the hand moves to the left of a kanji, it becomes three quick strokes—like a hand reaching out to grab something!",
        position: "Always appears on the LEFT side of kanji",
        transformsMeaning: "Indicates actions done with hands",
        exampleKanji: [
            { char: "押", meaning: "push", explanation: "Hand pressing against something" },
            { char: "拾", meaning: "pick up", explanation: "Hand gathering from the ground" },
            { char: "描", meaning: "draw, describe", explanation: "Hand creating images" }
        ]
    },
    "me": {
        key: "me",
        char: "目",
        name: "Me",
        meaning: "Eye",
        origin: "A pictograph of an eye turned vertical. The original form was a horizontal eye shape, but it rotated 90 degrees over time.",
        story: "This is an eye standing upright! The inside lines represent the iris and pupil. Eyes see, observe, and understand.",
        position: "Appears alone, on the left, or at various positions",
        transformsMeaning: "Relates to seeing, looking, appearance, or attention",
        exampleKanji: [
            { char: "見", meaning: "see, look", explanation: "An eye on legs, actively looking" },
            { char: "眠", meaning: "sleep", explanation: "When the eyes close" },
            { char: "相", meaning: "mutual, aspect", explanation: "Looking at trees = observing" }
        ]
    },
    "kuchi": {
        key: "kuchi",
        char: "口",
        name: "Kuchi",
        meaning: "Mouth, opening",
        origin: "A pictograph of an open mouth. The simple square shape represents any kind of opening or the act of speaking.",
        story: "A simple square like an open mouth! 口 appears in kanji about speaking, eating, and openings of all kinds.",
        position: "Appears on the left, right, or inside other characters",
        transformsMeaning: "Relates to speech, eating, or openings/entries",
        exampleKanji: [
            { char: "言", meaning: "say, word", explanation: "Mouth with sounds coming out" },
            { char: "食", meaning: "eat, food", explanation: "Mouth taking in nourishment" },
            { char: "品", meaning: "goods, quality", explanation: "Many mouths = many items" }
        ]
    },

    // Action & Movement
    "shinnyou": {
        key: "shinnyou",
        char: "辶",
        name: "Shinnyou",
        meaning: "Road, movement, advance",
        origin: "Combines elements showing a foot and a crossroad, representing walking or traveling along a path.",
        story: "This swooping radical at the bottom is the road you walk on! It curves like a path, carrying the meaning of movement and progress.",
        position: "Always appears at the BOTTOM-LEFT, wrapping under the character",
        transformsMeaning: "Indicates travel, paths, progress, or going toward something",
        exampleKanji: [
            { char: "道", meaning: "way, road", explanation: "The path that leads somewhere" },
            { char: "進", meaning: "advance, proceed", explanation: "Moving forward on the path" },
            { char: "遠", meaning: "far, distant", explanation: "A long path to walk" }
        ]
    },
    "chikara": {
        key: "chikara",
        char: "力",
        name: "Chikara",
        meaning: "Power, strength",
        origin: "A pictograph of a flexed arm showing muscle, or a plow being pushed through soil—both representing applied strength.",
        story: "Flex your arm and see the muscle! That's 力, representing human strength and effort. It appears in kanji about power, effort, and ability.",
        position: "Appears on the right side or as part of compounds",
        transformsMeaning: "Indicates strength, effort, ability, or force",
        exampleKanji: [
            { char: "動", meaning: "move", explanation: "Heavy things + power = movement" },
            { char: "働", meaning: "work", explanation: "A person applying power = working" },
            { char: "助", meaning: "help", explanation: "Adding power to someone's efforts" }
        ]
    },
    "tomeru": {
        key: "tomeru",
        char: "止",
        name: "Tomeru",
        meaning: "Stop, halt",
        origin: "A pictograph of a foot at rest, no longer walking. The bottom shows toes, showing a foot that has stopped.",
        story: "A foot that has stopped walking! The character shows toes pointing up, at rest. When you see 止, think of pausing or ending.",
        position: "Appears at the bottom or within compounds",
        transformsMeaning: "Indicates stopping, staying, or ceasing motion",
        exampleKanji: [
            { char: "歩", meaning: "walk, step", explanation: "Feet stopping and starting = walking" },
            { char: "正", meaning: "correct", explanation: "Stopping at the right place" },
            { char: "歴", meaning: "history", explanation: "The stopping points of time" }
        ]
    },

    // Structures & Home
    "ukanmuri": {
        key: "ukanmuri",
        char: "宀",
        name: "Ukanmuri",
        meaning: "Roof, house",
        origin: "A pictograph of a roof covering and protecting what's beneath it. The original form clearly showed a house or shelter.",
        story: "A roof over your head! This radical sits on top of kanji like a protective covering, showing that something is housed or protected.",
        position: "Always appears on TOP of kanji",
        transformsMeaning: "Indicates houses, buildings, protection, or family matters",
        exampleKanji: [
            { char: "家", meaning: "house, family", explanation: "A roof over pigs (wealth) = home" },
            { char: "安", meaning: "safe, peaceful", explanation: "A woman under a roof = safety" },
            { char: "室", meaning: "room", explanation: "A protected space under a roof" }
        ]
    },
    "mongamae": {
        key: "mongamae",
        char: "門",
        name: "Mongamae",
        meaning: "Gate, door",
        origin: "A pictograph of a traditional gate with two doors. You can see the two door panels and the frame.",
        story: "Two doors of a great gate! This radical encloses other elements like a doorway contains what passes through it.",
        position: "Surrounds other elements like a frame",
        transformsMeaning: "Indicates gates, openings, or things related to entrances",
        exampleKanji: [
            { char: "開", meaning: "open", explanation: "Opening the gate doors" },
            { char: "閉", meaning: "close, shut", explanation: "Closing the gate" },
            { char: "間", meaning: "between, space", explanation: "The gap between the gate doors" }
        ]
    },
    "kunigamae": {
        key: "kunigamae",
        char: "囗",
        name: "Kunigamae",
        meaning: "Enclosure, border",
        origin: "A simple enclosure representing boundaries, walls, or contained areas.",
        story: "A complete enclosure like walls or a border! This radical wraps around other elements, containing them like a fence or national border.",
        position: "Surrounds other elements completely",
        transformsMeaning: "Indicates enclosure, containment, or bounded areas",
        exampleKanji: [
            { char: "国", meaning: "country", explanation: "Land enclosed by borders" },
            { char: "園", meaning: "garden, park", explanation: "An enclosed growing space" },
            { char: "図", meaning: "diagram, map", explanation: "Information bounded in a frame" }
        ]
    },

    // Animals & Wildlife
    "kemonohen": {
        key: "kemonohen",
        char: "犭",
        name: "Kemonohen",
        meaning: "Beast, animal",
        origin: "Derived from 犬 (inu - dog), simplified to three strokes when appearing on the left side of kanji.",
        story: "This radical comes from 'dog' but represents all four-legged mammals. When you see it, think of wild or domestic beasts!",
        position: "Always appears on the LEFT side of kanji",
        transformsMeaning: "Indicates mammals, animal behaviors, or wild traits",
        exampleKanji: [
            { char: "猫", meaning: "cat", explanation: "A beast that sleeps in the field" },
            { char: "狼", meaning: "wolf", explanation: "A fierce wild beast" },
            { char: "狭", meaning: "narrow", explanation: "Squeezed like trapped animals" }
        ]
    },
    "tori": {
        key: "tori",
        char: "鳥",
        name: "Tori",
        meaning: "Bird",
        origin: "A detailed pictograph of a bird with a head, eye, wings, and tail feathers.",
        story: "See the bird with its eye, wings, and tail! This beautiful character shows a bird in profile, ready to take flight.",
        position: "Appears on the right side or as a standalone",
        transformsMeaning: "Indicates birds or flying creatures",
        exampleKanji: [
            { char: "鳴", meaning: "cry, chirp", explanation: "A bird opening its mouth to sing" },
            { char: "鶏", meaning: "chicken", explanation: "A domestic bird" },
            { char: "島", meaning: "island", explanation: "Where birds rest on the mountain in the sea" }
        ]
    },
    "uo": {
        key: "uo",
        char: "魚",
        name: "Uo",
        meaning: "Fish",
        origin: "A pictograph of a fish with a head, scales (田 shape), and tail (灬 dots are fins/tail).",
        story: "A fish swimming through water! The top is the head, the middle shows the scaled body, and the bottom dots are the tail fin.",
        position: "Appears on the left or as a standalone",
        transformsMeaning: "Indicates fish or seafood",
        exampleKanji: [
            { char: "鮮", meaning: "fresh", explanation: "Fish and sheep (both fresh foods)" },
            { char: "鯨", meaning: "whale", explanation: "The capital fish = the biggest" },
            { char: "鯛", meaning: "sea bream", explanation: "A celebratory fish" }
        ]
    },
    "mushi": {
        key: "mushi",
        char: "虫",
        name: "Mushi",
        meaning: "Insect, bug, worm",
        origin: "A pictograph of a snake or worm with a distinct head. Despite meaning 'insect,' it originally depicted crawling creatures.",
        story: "A wriggly creature with a head! This radical covers insects, worms, reptiles, and small crawling animals.",
        position: "Appears on the left or bottom of kanji",
        transformsMeaning: "Indicates insects, small creatures, or creepy-crawlies",
        exampleKanji: [
            { char: "蛇", meaning: "snake", explanation: "A dangerous creeping creature" },
            { char: "蝶", meaning: "butterfly", explanation: "A beautiful flying insect" },
            { char: "蚊", meaning: "mosquito", explanation: "A small buzzing pest" }
        ]
    },

    // Tools & Weapons
    "rittou": {
        key: "rittou",
        char: "刂",
        name: "Rittou",
        meaning: "Knife, blade",
        origin: "A simplified form of 刀 (katana - sword), appearing as two strokes on the right side of kanji.",
        story: "A blade standing upright! This radical shows cutting implements and appears in kanji about dividing, separating, or cutting.",
        position: "Always appears on the RIGHT side of kanji",
        transformsMeaning: "Indicates cutting, dividing, or sharpness",
        exampleKanji: [
            { char: "切", meaning: "cut", explanation: "A blade doing its work" },
            { char: "刻", meaning: "carve, engrave", explanation: "Knife marking deeply" },
            { char: "別", meaning: "separate, different", explanation: "Cut apart = separated" }
        ]
    },
    "katana": {
        key: "katana",
        char: "刀",
        name: "Katana",
        meaning: "Sword, blade",
        origin: "A pictograph of a curved sword or knife. The curved shape shows the blade with its edge.",
        story: "A curved samurai sword! The katana radical represents blades and cutting tools, carrying warrior spirit.",
        position: "Appears at various positions in kanji",
        transformsMeaning: "Indicates swords, cutting, or sharpness",
        exampleKanji: [
            { char: "刃", meaning: "blade, edge", explanation: "The sharp part of the sword" },
            { char: "初", meaning: "first, beginning", explanation: "The first cut (of cloth to make clothes)" },
            { char: "分", meaning: "divide, part", explanation: "Sword cutting something in half" }
        ]
    },
    "yumi": {
        key: "yumi",
        char: "弓",
        name: "Yumi",
        meaning: "Bow (archery)",
        origin: "A pictograph of a curved bow used for shooting arrows. The curve shows the bow bent and ready to fire.",
        story: "A drawn bow, curved and ready to shoot! This elegant curve represents archery and anything that bends or stretches.",
        position: "Appears on the left (yumihen) or in various positions",
        transformsMeaning: "Indicates bows, bending, stretching, or tension",
        exampleKanji: [
            { char: "引", meaning: "pull, draw", explanation: "Drawing back the bow string" },
            { char: "強", meaning: "strong", explanation: "The strength to draw a bow" },
            { char: "張", meaning: "stretch, spread", explanation: "A bow at full stretch" }
        ]
    },
    "kuruma": {
        key: "kuruma",
        char: "車",
        name: "Kuruma",
        meaning: "Cart, wheel, vehicle",
        origin: "A pictograph of a cart seen from above. The top and bottom show the wheels, and the middle shows the axle and body.",
        story: "A cart with wheels on top and bottom! Looking down on an ancient cart, you see the wheels and axle that make it roll.",
        position: "Appears on the left (kurumahen) or as a standalone",
        transformsMeaning: "Indicates vehicles, wheels, or transportation",
        exampleKanji: [
            { char: "転", meaning: "turn, roll", explanation: "Wheels turning around" },
            { char: "軽", meaning: "light (weight)", explanation: "An easy-to-push cart" },
            { char: "輪", meaning: "wheel, ring", explanation: "The round parts that roll" }
        ]
    },

    // Communication & Thought
    "gonben": {
        key: "gonben",
        char: "言",
        name: "Gonben",
        meaning: "Speech, words, say",
        origin: "Shows a mouth (口) with sound waves (lines above) coming out. It represents spoken language and communication.",
        story: "Words flowing from a mouth! The lines radiating up show sound emerging, making this the radical of speech and language.",
        position: "Appears on the left as 訁 or at various positions",
        transformsMeaning: "Indicates speaking, language, or communication",
        exampleKanji: [
            { char: "話", meaning: "talk, story", explanation: "Words in the tongue" },
            { char: "語", meaning: "language, word", explanation: "The five mouths of complete speech" },
            { char: "読", meaning: "read", explanation: "Speaking words from text" }
        ]
    },
    "oto": {
        key: "oto",
        char: "音",
        name: "Oto",
        meaning: "Sound, noise",
        origin: "Shows 言 (word) with an additional mark, representing sound or music—audible but not necessarily speech.",
        story: "A sound emerging! Unlike 言 which is words, 音 is any sound—music, noise, or echoes in the world.",
        position: "Appears as a component in compounds",
        transformsMeaning: "Indicates sounds, music, or audible phenomena",
        exampleKanji: [
            { char: "意", meaning: "meaning, mind", explanation: "Sound reaching the heart = understanding" },
            { char: "暗", meaning: "dark", explanation: "Sun hidden, only sound remains" },
            { char: "韻", meaning: "rhyme", explanation: "The sound that matches" }
        ]
    },

    // Textiles, Plants & Food
    "kusakanmuri": {
        key: "kusakanmuri",
        char: "艹",
        name: "Kusakanmuri",
        meaning: "Grass, plants",
        origin: "Shows grass or plants sprouting from the ground. The two curved lines represent growing vegetation.",
        story: "Grass growing on top! Like a crown of green on the earth, this radical appears above kanji related to plants and vegetation.",
        position: "Always appears on TOP of kanji",
        transformsMeaning: "Indicates plants, vegetation, or green growing things",
        exampleKanji: [
            { char: "花", meaning: "flower", explanation: "A plant that changes and transforms" },
            { char: "草", meaning: "grass", explanation: "The early growth of plants" },
            { char: "茶", meaning: "tea", explanation: "Plants made into a drink" }
        ]
    },
    "ito": {
        key: "ito",
        char: "糸",
        name: "Ito",
        meaning: "Thread, silk",
        origin: "Shows silk threads twisted together. The top shows the cocoon, and the strokes below show threads being drawn out.",
        story: "Silk threads spun from cocoons! This intricate radical represents fine work, weaving, and anything delicate or connected.",
        position: "Appears on the left (itohen) or in compounds",
        transformsMeaning: "Indicates thread, cloth, connection, or fine details",
        exampleKanji: [
            { char: "紙", meaning: "paper", explanation: "Made from plant fibers like thread" },
            { char: "終", meaning: "end", explanation: "The last thread of a fabric" },
            { char: "続", meaning: "continue", explanation: "Thread that keeps going" }
        ]
    },
    "shokuhen": {
        key: "shokuhen",
        char: "飠",
        name: "Shokuhen",
        meaning: "Food, eating",
        origin: "A simplified form of 食 (taberu - eat), showing a covered container of food or a person taking a meal.",
        story: "A container of food ready to eat! This radical indicates anything related to meals, eating, or nourishment.",
        position: "Appears on the LEFT side of kanji",
        transformsMeaning: "Indicates food, eating, or meals",
        exampleKanji: [
            { char: "飲", meaning: "drink", explanation: "Taking liquid food" },
            { char: "飯", meaning: "rice, meal", explanation: "The basic food of Japan" },
            { char: "館", meaning: "building, hall", explanation: "A place where food is served" }
        ]
    },
    "kome": {
        key: "kome",
        char: "米",
        name: "Kome",
        meaning: "Rice",
        origin: "A pictograph showing a rice plant with grains scattering in all four directions from the stalk.",
        story: "Rice grains on the stalk! Japan's most important food, 米 shows the four directions rice feeds the world.",
        position: "Appears on the left (komehen) or in various positions",
        transformsMeaning: "Indicates rice, or metaphorically 'fine details'",
        exampleKanji: [
            { char: "粉", meaning: "powder, flour", explanation: "Rice ground into fine particles" },
            { char: "精", meaning: "refined, spirit", explanation: "Rice polished to purity" },
            { char: "料", meaning: "fee, material", explanation: "Rice measured out = ingredients" }
        ]
    },

    // States & Attributes
    "dai": {
        key: "dai",
        char: "大",
        name: "Dai",
        meaning: "Big, large, great",
        origin: "A pictograph of a person with arms and legs spread wide, showing 'big' or 'great.'",
        story: "A person stretching out to look as large as possible! Arms wide, legs spread—that's 大, the kanji of bigness.",
        position: "Appears in various positions in compounds",
        transformsMeaning: "Indicates large size, greatness, or importance",
        exampleKanji: [
            { char: "太", meaning: "thick, great", explanation: "Big with a dot for emphasis" },
            { char: "天", meaning: "heaven, sky", explanation: "Above the big person = the sky" },
            { char: "犬", meaning: "dog", explanation: "A big loyal animal (with a small mark)" }
        ]
    },
    "shou": {
        key: "shou",
        char: "小",
        name: "Shou",
        meaning: "Small, little",
        origin: "Shows something being divided into smaller and smaller parts. The strokes converge to a point, showing reduction.",
        story: "Getting smaller and smaller! The strokes come together to a tiny point, showing smallness and few.",
        position: "Appears on top or in various positions",
        transformsMeaning: "Indicates small size, youth, or few",
        exampleKanji: [
            { char: "少", meaning: "few, little", explanation: "Small in number" },
            { char: "省", meaning: "examine, omit", explanation: "Making smaller by removing" },
            { char: "尖", meaning: "sharp, pointed", explanation: "Small at the tip = pointed" }
        ]
    },
    "shiro": {
        key: "shiro",
        char: "白",
        name: "Shiro",
        meaning: "White, blank",
        origin: "Shows the sun just beginning to rise, creating the first white light of day. Alternatively, it may represent a blank or clean surface.",
        story: "The first light of dawn! When the sun peeks over the horizon, everything glows white. 白 is purity and emptiness.",
        position: "Appears on the left or in various positions",
        transformsMeaning: "Indicates white color, purity, or blank/empty",
        exampleKanji: [
            { char: "百", meaning: "hundred", explanation: "White + one = many (hundred)" },
            { char: "的", meaning: "target, -like", explanation: "A white target to aim at" },
            { char: "皇", meaning: "emperor", explanation: "The white (pure) king above" }
        ]
    },

    // Time & Sequence  
    "hi": {
        key: "hi",
        char: "日",
        name: "Hi / Nichi",
        meaning: "Sun, day",
        origin: "A pictograph of the sun—originally a circle with a dot in the center, simplified to a rectangle.",
        story: "The sun in the sky! This simple box was once a circle, representing the life-giving sun and each day it rises.",
        position: "Appears on the left (hihen), top, or as a standalone",
        transformsMeaning: "Indicates sun, day, time, or dates",
        exampleKanji: [
            { char: "明", meaning: "bright", explanation: "Sun + moon = brightness" },
            { char: "時", meaning: "time", explanation: "Sun at the temple marking hours" },
            { char: "早", meaning: "early", explanation: "The sun at the first line (horizon)" }
        ]
    },
    "tsuki": {
        key: "tsuki",
        char: "月",
        name: "Tsuki",
        meaning: "Moon, month",
        origin: "A pictograph of the crescent moon. The inside lines originally showed the moon's surface features.",
        story: "The crescent moon in the night sky! 月 marks not just nights but months, as ancient people counted time by lunar cycles.",
        position: "Appears on the left or as a standalone",
        transformsMeaning: "Indicates moon, month, or (as nikuzuki) body parts",
        exampleKanji: [
            { char: "明", meaning: "bright", explanation: "Moon + sun = full brightness" },
            { char: "期", meaning: "period, term", explanation: "The span of time" },
            { char: "朝", meaning: "morning", explanation: "When moon (night) meets sun (day)" }
        ]
    },
    "yuube": {
        key: "yuube",
        char: "夕",
        name: "Yuube",
        meaning: "Evening, night",
        origin: "A pictograph of the moon just appearing—half visible as twilight falls. It shows the transition from day to night.",
        story: "The moon appearing as darkness falls! 夕 is that magical time between day and night, when shadows grow long.",
        position: "Appears on the left or in compounds",
        transformsMeaning: "Indicates evening, night, or twilight",
        exampleKanji: [
            { char: "外", meaning: "outside", explanation: "Evening is time to go out" },
            { char: "名", meaning: "name", explanation: "Calling in the dim evening" },
            { char: "多", meaning: "many", explanation: "Many evenings = abundance" }
        ]
    }
};

// Helper function to get story by radical key
export function getRadicalStory(key: string): RadicalStory | undefined {
    return RADICAL_STORIES[key];
}

// Helper function to get category story
export function getCategoryStory(category: string): CategoryStory | undefined {
    return CATEGORY_STORIES[category];
}

// Get radical story by radical character
export function getRadicalStoryByChar(char: string): RadicalStory | undefined {
    return Object.values(RADICAL_STORIES).find(story => story.char === char);
}
