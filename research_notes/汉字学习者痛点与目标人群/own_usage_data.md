# Kanji Kaisen: evidence about current users from its own data and code

Research date: 2026-10-31. Scope: first-party data (ops MCP tools, repo, live site, feedback board, GitHub). Read-only; no individual accounts were inspected.

**Main finding:** none of the sources checked give usable usage numbers for Kanji Kaisen. The `katachi-ops` tools report on a different product, Katachi, a Japanese verb-conjugation trainer. Kanji Kaisen's own analytics (Vercel Web Analytics custom events and Supabase accounts) exist, but nothing in this session can read them. Public feedback amounts to two posts with one upvote each.

## Q1. Do the katachi-ops MCP tools report on Kanji Kaisen? What do they show?

### Takeaway
No. The katachi-ops tools cover **Katachi**, a separate Japanese verb-conjugation practice site, so its traffic, account and funnel numbers must not be used as Kanji Kaisen data. Katachi is at most an adjacent signal about a similar audience, and the report writer should label it that way if it is used at all.

### Cited Findings
- **Evidence that it is a different product:** the tool's top production paths are `/`, `/progress`, `/conjugation-guide`, `/challenge`, `/learn-japanese-conjugations`, `/conjugation-guide/godan-ichidan-kaeru-kiru`, `/conjugation-guide/potential-form-rareru` and `/conjugation-guide/te-form-iku`. One referrer is `katachi.nihongo.day`. — [katachi-ops get_traffic, 28 days, 2026-10-03 to 2026-10-30 (MCP tool output)](mcp://katachi-ops/get_traffic)
- None of those routes exist in Kanji Kaisen. Its routes are `/`, `/kanji/[char]`, `/radicals`, `/radical/[key]`, `/categories`, `/category/[slug]`, `/browse`, `/search`, `/my-list`, `/study`, `/practice`, `/about` and `/settings`. — [README.md](file:///Users/harry/code/kanji-kaisen/README.md)
- The tool's practice types are `daily`, `weakness`, `sentence` and `free`. It also tracks "four starter forms", per-form accuracy, an answer mode (typed input vs. upgraded) and daily goals. Kanji Kaisen's practice model is different: checkpoints with memorize → quiz → trace → AI handwriting challenge phases, plus flashcards and a meaning quiz. — [katachi-ops get_overview / tool descriptions](mcp://katachi-ops/get_overview); [README.md](file:///Users/harry/code/kanji-kaisen/README.md)
- The word "katachi" appears nowhere in the Kanji Kaisen repo (searched with grep, excluding node_modules). — [repo /Users/harry/code/kanji-kaisen](file:///Users/harry/code/kanji-kaisen)
- The metrics doc `katachi://docs/metrics` could not be read: no MCP resource-reading tool was available in this session. The caveats below come from the server's own instructions: unavailable or null means unknown, not zero; accounts count synced Supabase accounts only, in JST days, so guest and offline practice is invisible and activity is a lower bound; visitors are Vercel provider uniques in UTC days and a different population from accounts, so accounts ÷ visitors is not a conversion rate and daily visitors must not be summed; behavior "visits" are not people. — [katachi-ops server instructions](mcp://katachi-ops)
- **Katachi aggregates only (NOT Kanji Kaisen), 28 JST days from 2026-10-03 to 2026-10-30:**
  - Accounts: 69 total, 53 verified, 50 new, 37 active, 13 repeat, 252 completions.
  - Learner language setting: zh 42 (31 active), other 6, en 1, ko 1.
  - Vercel traffic: 1,197 visitors and 2,868 pageviews for the period, 64% of visitors on mobile (765) and 34% on desktop (407).
  - Named referrers: l.threads.com 162 visitors, v2ex.com 117, google.com 12, reddit.com 9, Bing CN 8, WeChat 9. "Unknown" accounts for 899 visitors.
  - Traffic spikes on 10-16 (159 visitors) and 10-26/27/29 (102 to 130 visitors).
  - Source: [katachi-ops get_overview and get_traffic, 28 days ending 2026-10-30](mcp://katachi-ops/get_overview)

### Inferences
- The developer's workspace includes a sibling Japanese-learning product whose measured users are mostly Chinese-language learners arriving from Chinese-speaking communities (Threads, V2EX, WeChat), mostly on mobile. If Kanji Kaisen draws from the same communities, this hints at a zh-speaking audience. That is an inference only: nothing shows Kanji Kaisen's audience matches Katachi's. The repo does not establish that the two products share an owner, although the tool sits in this user's session.
- get_growth, get_behavior and list_accounts were deliberately not called for funnel groups A–E, onboarding or retention, because the data would describe Katachi, not Kanji Kaisen.

### Gaps
- No ops tool, export or report in this session covers Kanji Kaisen's own Vercel Analytics (visitors, pageviews, custom events) or its Supabase `user_app_state` accounts. As a result, Kanji Kaisen's traffic, sign-ups, feature usage, funnel groups A–E, onboarding, drop-off and retention are all **unknown, not zero**.
- The `reports/` folder in the repo is empty, and the plans contain no traffic or user numbers.

## Q2. What does the repo show about analytics events, features and the intended audience?

### Takeaway
The deployed site (v1.1.0, `main`) tracks a gamified practice funnel: learning modal, quiz, handwriting, challenge pass/fail, hearts and feedback clicks. The unreleased v2.0.0 pivot branch adds atlas events (search, kanji and radical views, saves, tracing, study sessions) so that Phase 3 decisions can be made from analytics. The plans state an intended audience of English-speaking, search-driven learners. They explicitly defer a Chinese locale until traffic data supports one.

### Cited Findings
- `trackEvent(name, props)` wraps `@vercel/analytics` `track()` and runs on the client only. `<Analytics />` is mounted in `app/layout.tsx` on both `main` and the pivot branch, so all custom events go to Vercel Web Analytics. There is no other analytics backend. — [lib/analytics.ts](file:///Users/harry/code/kanji-kaisen/lib/analytics.ts); [app/layout.tsx](file:///Users/harry/code/kanji-kaisen/app/layout.tsx)
- **Events live on `main` (deployed v1.1.0):**
  - Pages and modal: `learn_page_viewed`, `category_page_viewed`, `category_story_opened`, `checkpoint_opened`, `checkpoint_completed`, `learning_modal_opened`, `learning_phase_viewed`.
  - Quiz: `quiz_started`, `quiz_answered`, `quiz_completed`.
  - Practice and handwriting: `practice_started`, `handwriting_started`, `handwriting_submitted`, `handwriting_skipped`, `handwriting_auto_skipped`, `handwriting_skipped_for_today`.
  - Challenge: `challenge_submitted`, `challenge_passed`, `challenge_failed`, `challenge_canvas_cleared`, `challenge_peek_used`, `challenge_continue_clicked`, `challenge_practice_again_clicked`, `challenge_retry_clicked`.
  - Hearts and feedback: `heart_lost`, `out_of_hearts`, `feedback_clicked` (4 call sites).
  - Source: [git grep on main branch, app/ and components/](file:///Users/harry/code/kanji-kaisen)
- **Events added on the pivot branch (v2.0.0, not yet deployed):** `search_performed` (includes the raw query text, result count and source), `kanji_viewed` (kanji, JLPT, radical), `radical_viewed`, `kanji_saved`, `kanji_status_changed`, `trace_used` (start and completed), `study_started` (source, mode, deck size) and `study_completed`. The branch drops `heart_lost` and `out_of_hearts` along with the hearts feature. — [components/Atlas/*, components/Study/StudySession.tsx, app/kanji/[char]/page.tsx, app/radical/[key]/page.tsx, app/search/page.tsx](file:///Users/harry/code/kanji-kaisen/components); [pivot plan step 2.7](file:///Users/harry/code/kanji-kaisen/docs/superpowers/plans/2026-10-24-kanji-atlas-pivot.md)
- **Feature history:**
  - v0.1.0 (2026-01-09): basic kanji display.
  - v1.0.0 (2026-01-16): three-phase learning flow, 214 radical stories, Vercel Web Analytics.
  - v1.1.0 (2026-04-24): Supabase magic-link login and sync.
  - v2.0.0 (2026-10-24, branch only): 2,223 static kanji pages, 230 radical pages, 10 themes, browse and search, My list, Study (flashcards and meaning quiz), hearts removed, account UI hidden.
  - Source: [CHANGELOG.md](file:///Users/harry/code/kanji-kaisen/CHANGELOG.md)
- The live site at kanji-kaisen.harrysui.me still serves v1.1.0. It is a marketing landing page with a "Start Your Journey" button to `/learn` that promises an AI "Sensei" stroke analyzer, quizzes, a progress dashboard and spaced repetition. The audience it names is generic kanji learners, with no level or nationality given. — [https://kanji-kaisen.harrysui.me/](https://kanji-kaisen.harrysui.me/)
- The pivot work sits on `claude/zen-sagan-9123o5`. `main`'s latest commit is dated 2026-08-10. — [git log](file:///Users/harry/code/kanji-kaisen)
- **Stated audience and strategy in the pivot plan:**
  - Growth "should come from search traffic: one indexable page per kanji, per radical and per theme".
  - The owner's decision is "**English first.** UI and content stay English. No Chinese locale in this plan."
  - Login is hidden, but "existing signed-in users keep syncing", which implies some existing account holders.
  - Source: [2026-10-24-kanji-atlas-pivot.md](file:///Users/harry/code/kanji-kaisen/docs/superpowers/plans/2026-10-24-kanji-atlas-pivot.md)
- **Why the plan pivots, based on a product review rather than usage data:** the practice flow is "heavy (up to 40 screens per checkpoint, no saved progress mid-checkpoint), punishing (hearts lost on wrong answers and even on AI request errors, then locked for the day), and partly broken (12 checkpoints can't be finished)". — [pivot plan, "Why"](file:///Users/harry/code/kanji-kaisen/docs/superpowers/plans/2026-10-24-kanji-atlas-pivot.md)
- **Phase 3 is deferred until there is data. Each candidate is tied to a signal:**
  - SRS: watch `study_completed` and `kanji_status_changed`.
  - **Chinese locale**: watch traffic by country and `search_performed` queries in Chinese.
  - AI handwriting critique: watch `trace_used` completion.
  - Syncing My list: watch list sizes and returning users.
  - Slimming `/practice`: depends on whether it keeps meaningful traffic.
  - Source: [pivot plan, "Phase 3 candidates"](file:///Users/harry/code/kanji-kaisen/docs/superpowers/plans/2026-10-24-kanji-atlas-pivot.md)
- The Supabase design (2026-04-24) assumes "Existing users may already have meaningful data in browser localStorage". Progress lives mainly in localStorage and syncs only for users who log in. — [2026-04-24-supabase-auth-sync-design.md](file:///Users/harry/code/kanji-kaisen/docs/superpowers/specs/2026-04-24-supabase-auth-sync-design.md)

### Inferences
- The event coverage on the deployed site would let someone with Vercel dashboard access answer drop-off questions for the classic path: checkpoint opened → quiz → handwriting → challenge pass/fail, handwriting skips, and `out_of_hearts` locks. Those numbers were not reachable here.
- Who uses Kanji Kaisen today matters for the "English first" decision. The plan itself treats Chinese-speaker demand as an open question to settle with country and query data.
- Because most state is in localStorage and login is optional (and hidden in v2), Supabase account counts would badly undercount actual learners.

### Gaps
- No actual counts exist for any event, page or country. Vercel Analytics data for this project was not accessible: there is no Kanji Kaisen ops MCP, no export in the repo, and no Vercel API access was set up.
- The number of Supabase accounts is unknown.
- There is no evidence on users' native language, JLPT level or device mix for Kanji Kaisen.

## Q3. What do the public feedback board and GitHub issues contain?

### Takeaway
Almost nothing. The Featurebase board has two posts, each with one upvote, both about six months old and both about navigation and course structure. GitHub has no issues, only PRs. There is no meaningful user-request signal.

### Cited Findings
- **Featurebase board posts:**
  - "Change the Home page so it is no longer the Hero page": make the Learn page the home page so clicking the logo doesn't interrupt learning. 1 upvote, status Planned, about 6 months old.
  - "Adjust the course strucutre" (typo as posted): no description, 1 upvote, status New request, about 6 months old.
  - Source: [https://kanjikaisen.featurebase.app/](https://kanjikaisen.featurebase.app/)
- The feedback board is linked from the footer, the Settings page, the learning modal and the About page, each with a `feedback_clicked` event. — [components/Footer.tsx, app/settings/page.tsx, components/Learning/LearningModal.tsx, app/about/page.tsx](file:///Users/harry/code/kanji-kaisen/components/Footer.tsx)
- **GitHub (mxggle/kanji-kaisen):**
  - Issues are enabled, but `gh issue list --state all` returns none. The `open_issues_count` of 2 is PRs #10 and #11.
  - The repo has 6 stars, 1 fork and 0 watchers, and was created 2026-01-10.
  - All 11 PRs are by the developer or agent branches. Open PRs: #10 "Fix stuck lessons, unfair heart loss, sync data loss…" and #11 "Add sitemap, robots and per-kanji page metadata".
  - Source: [https://github.com/mxggle/kanji-kaisen](https://github.com/mxggle/kanji-kaisen) (via `gh` CLI)

### Inferences
- The first board request matches the v2.0.0 pivot, which replaces the hero page with a search-first home. Both posts may come from the developer or a very small number of early users. That cannot be verified, and identities were not checked.
- The near-empty board and issue tracker, plus 6 GitHub stars, suggest a very small engaged user base. They prove nothing about passive visitors.

### Gaps
- Featurebase comment counts and post authors were not shown, and authors were deliberately not sought.
- No other feedback channels (email, social posts, reviews) were found in the repo.
