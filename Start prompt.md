DICE Project Handover for Claude Code
Guiding Document (Not Implementation Spec)

What You're Building & Why
Project: DICE (Decision Intelligence Content Evaluator)
The Problem:
Schibsted needs to systematically test which AI models (Claude, GPT-4, Gemini) produce the best marketing content (subject lines, CTAs, push notifications) for different use cases. Currently there's no way to do this scientifically.
The Solution:
Build a web app where marketing teams can:

Select a pre-defined content template (e.g. "Aftonbladet sports subject line")
Choose which AI model to use
Provide variables (topic, audience segment)
Get generated content
Rate the quality
Everything gets logged automatically for later analysis

Why This Matters:

2.5M monthly users across 7 Nordic news brands
Need data-driven decisions on which AI models to use in production
Budget: 3M SEK project (AI DIE)
Team of 15-25 users testing content


Critical Requirements (Non-Negotiable)
1. Multiple AI Model Support ⚠️ CRITICAL
Must support:

Anthropic (Claude Sonnet 4, Claude Opus 4, Claude Haiku 4)
OpenAI (GPT-4, GPT-4o, GPT-4 Turbo)
Google (Gemini Pro)
Future: Schibsted internal model (custom endpoint)

Why: The entire point is comparing models. This is the core feature.
2. Locked Prompt Templates ⚠️ CRITICAL
Users CANNOT write freeform prompts.
Why: For scientific comparison, prompts must be controlled. If User A writes "make subject line" and User B writes "create engaging subject line under 50 chars", we can't compare results.
How it works:

Users select from dropdown of templates (stored in LangFuse)
Users only provide variables (topic, audience segment)
Template + variables = final prompt
User never sees or edits the actual prompt

Example:
User sees:
  Template: "Subject Line - Aftonbladet Sports"
  Topic: [Champions League final]
  Segment: [Football fans]
  
Behind scenes:
  LangFuse template gets compiled with variables
  Full prompt sent to AI (user never sees this)
3. Automatic Logging ⚠️ CRITICAL
Zero manual documentation.
Every generation must capture:

Who generated it (user email)
When (timestamp)
Which template + version
Which model
What variables were provided
What was generated
How many tokens
How much it cost
User's rating (if they rated it)

Storage: Both Supabase (for queries/UI) AND LangFuse (for analytics)
4. User Authentication

Google OAuth (Supabase Auth or other authentication)
How do we work with RLS - by user, by brand, by campaign? (Row Level Security)
Some roles should be able to see all, some roles should be super admin with access to everything
5. Rating System
Users must be able to rate generated content. Choose what works best:

Thumbs up/down (simple)
1-5 stars (more granular)
Optional comment field


Technology Stack (Required Tools)
You MUST Use These:
yamlFrontend/Deployment:
  - Next.js 14 (App Router, TypeScript)
  - Vercel (deployment)


Backend/APIs:
  - Next.js API Routes (serverless functions)
  - Portkey (AI gateway - handles multiple models)
  - LangFuse (prompt management + logging)
  - Supabase (PostgreSQL + Auth)

LLM Providers:
  - Anthropic API
  - OpenAI API
  - Google AI API

If possible it would be intersting to see if we can fetch the content from braze via a API identifier or similar in order to be able to fetch the body content for generation of subject lines etc. (This is not a must it is a nice to have and could be pushed down on the prio list)
```

**Why these are locked:**
- User has accounts already
- Architecture discussion determined these are best fit
- Changing these would invalidate previous planning

### **You Can Choose Implementation Details:**

✅ Exact file structure
✅ Component organization  
✅ Database schema specifics (as long as it captures required data)
✅ UI/UX design
✅ Error handling approach
✅ Validation libraries
✅ Additional helper functions
✅ Additional database tables if needed
✅ Additional API routes beyond the minimum

---

## How The System Should Work (Logical Flow)

### **User Flow:**
```
1. User logs in (Google OAuth via Supabase or other authentication)
   ↓
2. User goes to "Generate" page
   ↓
3. User selects:
   - Template (from dropdown)
   - Model (Claude vs GPT vs Gemini)
   - Provides variables (topic, segment, etc.)
   ↓
4. User clicks "Generate"
   ↓
5. System:
   - Fetches template from LangFuse
   - Compiles template with user's variables
   - Sends to Portkey (which routes to correct model)
   - Portkey automatically logs to LangFuse
   - Saves full record to Supabase
   ↓
6. User sees result
   ↓
7. User rates it (1-5 stars or thumbs)
   ↓
8. Rating saved to both Supabase and LangFuse
```

### **Data Flow:**
```
Frontend (Next.js UI)
  ↓ API call
Backend (Next.js API route)
  ↓ Fetches template
LangFuse (get prompt template)
  ↓ Compiles prompt
Backend
  ↓ Generates content
Portkey (routes to Claude/GPT/Gemini)
  ↓ Auto-logs
LangFuse (trace logged)
  ↓ Saves generation
Backend → Supabase (full record saved)
  ↓ Returns result
Frontend (shows content + rating widget)
```

---

## Required API Endpoints (Minimum)

You need **at least** these API routes:

### `POST /api/generate`
**Purpose:** Generate content

**Inputs:**
- template_id (string)
- model (string - which AI model)
- variables (object - user-provided values)

**Process:**
1. Authenticate user (Supabase)
2. Get template from LangFuse
3. Compile template with variables
4. Generate via Portkey
5. Log to Supabase + LangFuse
6. Return result

**Output:**
- generated_content (string)
- generation_id (uuid)
- tokens, cost, model used

### `POST /api/rate`
**Purpose:** Rate a generation

**Inputs:**
- generation_id (uuid)
- rating (1-5 integer)
- comment (optional string)

**Process:**
1. Authenticate user
2. Verify user owns this generation
3. Update Supabase record
4. Update LangFuse score
5. Return success

**You can add more API routes as needed** (templates list, history, etc.)

---

## Database Requirements

### **You need to store (at minimum):**

**Generations table:**
- Identity: id, created_at
- User info: user_id, user_email
- Template info: template_id, template_version
- Inputs: user_variables (JSON), compiled_prompt (text)
- Model: which model used
- Outputs: generated_content (text)
- Metrics: tokens, cost, duration
- Evaluation: rating, rating_comment
- References: langfuse_trace_id, portkey_request_id

**Users/Profiles:**
- Extends Supabase auth.users
- Role (data_science, crm_ops, brand_manager)
- Brands they can access

**Implementation details are up to you:**
- Exact column names
- Additional indexes
- Additional tables if you need them
- JSON structure for metadata
- RLS policies (as long as users can only see their own data)

---

## LangFuse Prompt Templates (Starting Point)

Create these templates in LangFuse. User might do this manually or you can help.

### Template 1: Subject Line - Aftonbladet Sports
```
Purpose: Generate sports subject lines for Aftonbladet (Swedish sports news)
Variables: topic, segment
Requirements: Max 50 chars, Swedish language, energetic tone
```

### Template 2: Subject Line - VG Politics  
```
Purpose: Generate political subject lines for VG (Norwegian politics)
Variables: topic, segment
Requirements: Max 60 chars, Norwegian language, credible tone
```

### Template 3: Push Notification - Breaking News
```
Purpose: Breaking news push notifications
Variables: topic, brand, language
Requirements: Max 120 chars, urgent but not sensational
You don't need to write the exact prompts - the user or you can create these in LangFuse dashboard. Just know they exist and how to fetch them.

Portkey Configuration Approach
Virtual Keys needed:

anthropic-main → Routes to Claude models
openai-main → Routes to GPT models
google-main → Routes to Gemini models

Fallback strategy:
Primary: Claude Sonnet (fast, cheap)
Fallback: GPT-4o (if Claude is down)
User will configure these in Portkey dashboard. Your code just needs to call Portkey with the right model name.

What Success Looks Like
Phase 1 Success:

 User can log in with Google
 User can select template + model
 User can provide variables
 Content generates successfully
 User can rate the result
 Everything logs to Supabase automatically
 Everything logs to LangFuse automatically
 Deployed to Vercel and team can access it

If these work, Phase 1 is done. Implementation details don't matter.
Phase 2+:

Rate limiting
Better UI/UX
More templates
History page
Export features
Analytics


Environment Variables Required
User will provide these credentials. You need to use them:
bash# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Portkey
PORTKEY_API_KEY=

# LangFuse  
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com

# Optional (Portkey uses virtual keys, but good to have)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
```

---

## What You Can Change

### ✅ **Feel free to:**
- Organize files however makes sense
- Create additional database tables
- Add helper functions and utilities
- Choose UI component library (shadcn/ui, headless UI, plain Tailwind)
- Implement error handling your way
- Add middleware for auth
- Create additional API routes
- Choose validation approach (Zod, Yup, custom)
- Organize components however you want
- Add types and interfaces as needed
- Implement rate limiting if/when needed
- Structure the UI layout

### ❌ **Don't change:**
- The core tools (Portkey, LangFuse, Supabase, Next.js)
- The requirement for locked templates
- The requirement for multi-model support
- The requirement for automatic logging
- The core user flow

---

## Important Context

### **User Profile:**
- "Vibe coder" - prefers AI-assisted development
- Comfortable with Next.js, Supabase, Vercel
- NOT a senior developer with 10 years experience
- Wants to iterate and learn, not copy-paste code

### **User's Needs:**
- Clear explanations of what you're building
- Ability to understand and modify the code later
- Not over-engineered
- Actually works in production

### **Project Context:**
- Part of larger 3M SEK initiative
- Needs to be done in weeks, not months
- Will be used by real users immediately
- Needs to be maintainable

---

## Getting Started Checklist

**Before you start building:**

1. ✅ User has Supabase project created
2. ✅ User has Portkey account + API key
3. ✅ User has LangFuse account + API keys
4. ✅ User has LLM provider API keys
5. ✅ User has credentials in CREDENTIALS.txt file

**Then you can:**

1. Set up Next.js project
2. Configure environment variables
3. Set up Supabase auth
4. Create database schema
5. Build core API route (generate)
6. Build basic UI
7. Test end-to-end
8. Deploy to Vercel

---

## Questions You Might Need To Ask User

During implementation, you might need to ask:

- "Should we add a 'history' page now or later?"
- "Do you want 1-5 stars or thumbs up/down for ratings?"
- "Should Data Science role see all generations or just their own?"
- "What should happen if Portkey is down - show error or queue request?"
- "Do you want to create LangFuse templates now or test with hardcoded prompts first?"

**Ask when you need clarity. Don't assume.**

---

## Tone & Approach

Build this like you're a senior developer helping a colleague:
- Explain what you're doing and why
- Ask for input on decisions
- Suggest better approaches if you see them
- Don't overcomplicate
- Make it maintainable
- Test as you go
- Deploy early, iterate often

**Remember: The user wants to learn and understand, not just have code appear.**

---

## Success Criteria Summary

**Minimum Viable Product:**
```
✅ Authentication works (Google OAuth)
✅ User can select template
✅ User can select model (Claude, GPT-4, Gemini)
✅ User can provide variables
✅ Content generates via Portkey
✅ Result displays
✅ User can rate result
✅ Everything logs to Supabase
✅ Everything logs to LangFuse  
✅ Deployed and accessible
If these work = Phase 1 success. Ship it.

Final Notes
This is a guide, not a specification.
Use your judgment:

If you see a better way to structure something, do it
If you need an extra database table, create it
If the file structure should be different, organize it differently
If error handling needs a specific approach, implement it
If you need helper functions, create them

Stick to requirements:

Multi-model support (non-negotiable)
Locked templates (non-negotiable)
Automatic logging (non-negotiable)
The core tech stack (non-negotiable)

When in doubt, ask the user.

That's It - Now Build It! 🎲
Good luck! The user is ready to work with you in Claude Code.