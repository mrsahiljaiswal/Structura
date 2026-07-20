import os
import re
import json
import difflib
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.common.llm_client import LLMClient
from app.db.session import get_db
from app.models.course_models import Course as CourseModel, Chapter as ChapterModel, UserProgress as UserProgressModel

router = APIRouter(prefix="/chat", tags=["chat"])


def calculate_semantic_score(query: str, target_text: str) -> float:
    """
    Computes a semantic similarity score between user query and course/chapter text.
    Combines:
    1. Word token overlap (Jaccard similarity)
    2. Fuzzy string ratio (difflib SequenceMatcher) for misspellings & variations
    3. Direct phrase inclusion boost
    """
    if not query or not target_text:
        return 0.0

    q_clean = query.lower().strip()
    t_clean = target_text.lower().strip()

    # Direct phrase inclusion boost
    if q_clean in t_clean or t_clean in q_clean:
        return 1.0

    stop_words = {"give", "summary", "summarise", "summarize", "course", "couse", "chapter", "about", "please", "with", "from", "the", "of", "in", "and", "a", "an", "to"}
    q_words = [w for w in re.findall(r"\w+", q_clean) if w not in stop_words and len(w) > 2]
    
    if not q_words:
        return difflib.SequenceMatcher(None, q_clean, t_clean).ratio()

    t_words = set(re.findall(r"\w+", t_clean))

    # 1. Exact keyword overlap ratio
    exact_matches = sum(1 for w in q_words if w in t_words or any(w in tw for tw in t_words))
    exact_ratio = exact_matches / float(len(q_words))

    # 2. Fuzzy token similarity for misspellings / variations (e.g. holyname -> holy name)
    fuzzy_scores = []
    for qw in q_words:
        best_sim = 0.0
        for tw in t_words:
            if len(tw) > 2:
                sim = difflib.SequenceMatcher(None, qw, tw).ratio()
                if sim > best_sim:
                    best_sim = sim
        fuzzy_scores.append(best_sim)

    fuzzy_avg = sum(fuzzy_scores) / float(len(fuzzy_scores)) if fuzzy_scores else 0.0
    overall_ratio = difflib.SequenceMatcher(None, q_clean, t_clean).ratio()

    return max(exact_ratio, fuzzy_avg * 0.9, overall_ratio * 0.6)


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    course_id: Optional[str] = None
    knowledge_mode: Optional[str] = "both"  # "courses_only" | "both" | "web_only"
    chat_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    suggested_actions: Optional[List[str]] = []


@router.get("/history")
async def get_chat_history(
    x_user_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve saved chat history for logged-in user."""
    if not x_user_id:
        return {"history": []}

    stmt = select(UserProgressModel).where(UserProgressModel.user_id == x_user_id)
    res = await db.execute(stmt)
    prog = res.scalars().first()

    return {"history": prog.chat_history if prog and prog.chat_history else []}


@router.post("", response_model=ChatResponse)
async def chat_with_tutor(
    request: ChatRequest,
    x_user_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Real-time AI Chatbot strictly grounded in published courses and user account progress.
    Supports Knowledge Modes: "courses_only", "both", "web_only".
    Automatically persists messages to DB.
    """
    mode = request.knowledge_mode or "both"

    # 1. Query published courses from DB with eager loading
    course_stmt = select(CourseModel).options(
        selectinload(CourseModel.chapters).selectinload(ChapterModel.lessons)
    )
    course_res = await db.execute(course_stmt)
    courses = course_res.scalars().unique().all()

    # 2. Query user progress from DB if x_user_id provided
    user_progress_summary = "Guest User (No saved account progress)"
    user_prog_record = None
    if x_user_id:
        prog_stmt = select(UserProgressModel).where(UserProgressModel.user_id == x_user_id)
        prog_res = await db.execute(prog_stmt)
        user_prog_record = prog_res.scalars().first()
        if user_prog_record:
            quiz_scores = user_prog_record.quiz_scores or {}
            scores_val = list(quiz_scores.values())
            avg_score = round(sum(scores_val) / len(scores_val)) if scores_val else 0
            user_progress_summary = (
                f"User ID: {x_user_id}\n"
                f"Streak Count: {user_prog_record.streak_count or 0} Days\n"
                f"Completed Lessons Count: {len(user_prog_record.completed_lessons or [])}\n"
                f"Completed Lesson IDs: {', '.join(user_prog_record.completed_lessons or [])}\n"
                f"Total Study Time: {user_prog_record.study_time_total or 0} seconds ({(user_prog_record.study_time_total or 0) // 60} mins)\n"
                f"Average Quiz Score: {avg_score}%\n"
            )

    # 3. Mode Handling & Context Assembly
    msg_lower = request.message.lower()
    is_next_study_request = any(k in msg_lower for k in ["what should i study", "next lesson", "next course", "what to study", "where to continue", "recommend next"])
    is_progress_request = any(k in msg_lower for k in ["progress", "streak", "score", "time", "stats", "performance", "analytics", "dashboard"]) and not is_next_study_request
    is_quiz_request = any(k in msg_lower for k in ["quiz", "test", "checkup", "exam"])
    is_summary_request = any(k in msg_lower for k in ["summary", "summarize", "summarise", "overview", "key point", "chapter", "glories", "lesson"])

    # Rank course content by semantic score to test if query is course-related
    top_course_score = 0.0
    for c in courses:
        for ch in getattr(c, "chapters", []) or []:
            for l in getattr(ch, "lessons", []) or []:
                text = f"{getattr(c, 'title', '')} {getattr(ch, 'title', '')} {getattr(l, 'title', '')} {getattr(l, 'summary', '')}"
                s = calculate_semantic_score(request.message, text)
                if s > top_course_score:
                    top_course_score = s

    # Enforce COURSES ONLY refusal if query is unrelated to courses and not a system command
    is_system_cmd = is_next_study_request or is_progress_request or is_quiz_request or is_summary_request
    if mode == "courses_only" and top_course_score < 0.12 and not is_system_cmd:
        refusal_msg = (
            f"⚠️ **Courses Only Mode Active**\n\n"
            f"Your question **\"{request.message}\"** does not appear in your enrolled course materials.\n\n"
            "💡 *To get answers from general knowledge, please switch the Knowledge Source toggle above to **\"Courses + Web\"** or **\"Web Only\"**!*"
        )
        return ChatResponse(
            reply=refusal_msg,
            suggested_actions=["Switch to Courses + Web", "Summarize my course", "Take a quiz"]
        )

    # 3. Extract Full Lesson Knowledge Context for Active Course (or all courses)
    selected_courses = [c for c in courses if str(c.id) == str(request.course_id)] if request.course_id else courses
    if not selected_courses and courses:
        selected_courses = courses

    lesson_knowledge_blocks = []
    chapter_summaries = []

    for c in selected_courses:
        c_title = getattr(c, "title", None) or getattr(c, "course_title", "Untitled Course")
        for ch in getattr(c, "chapters", []) or []:
            ch_title = getattr(ch, "title", "Chapter")
            lessons = getattr(ch, "lessons", []) or []
            lesson_titles = []

            for l in lessons:
                l_title = getattr(l, "title", "Lesson")
                lesson_titles.append(l_title)
                l_content = getattr(l, "content", "") or ""
                l_summary = getattr(l, "summary", "") or ""

                text_block = f"### [Course: {c_title} | Chapter: {ch_title} | Lesson: {l_title}]\n"
                if l_summary:
                    text_block += f"Summary: {l_summary}\n"
                if l_content:
                    text_block += f"Full Content:\n{l_content[:1500]}\n"
                lesson_knowledge_blocks.append(text_block)

            chapter_summaries.append(f"• Chapter: {ch_title}\n  Lessons: {', '.join(lesson_titles)}")

    full_lesson_context = "\n\n".join(lesson_knowledge_blocks[:6]) if lesson_knowledge_blocks else "No specific lesson materials uploaded yet."
    course_structure_overview = "\n".join(chapter_summaries) if chapter_summaries else "No chapter structure available."    # 4. Construct grounded system prompt with mode detection
    msg_lower = request.message.lower()
    is_next_study_request = any(k in msg_lower for k in ["what should i study", "next lesson", "next course", "what to study", "where to continue", "recommend next"])
    is_progress_request = any(k in msg_lower for k in ["progress", "streak", "score", "time", "stats", "performance", "analytics", "dashboard"]) and not is_next_study_request
    is_quiz_request = any(k in msg_lower for k in ["quiz", "test", "checkup", "exam"])
    is_summary_request = any(k in msg_lower for k in ["summary", "summarize", "summarise", "overview", "key point", "chapter", "glories", "lesson"])

    mode_instruction = ""
    if is_next_study_request:
        mode_instruction = (
            "SPECIAL MODE: RECOMMEND NEXT LESSON\n"
            "Cross-reference the user's completed lesson IDs with the course catalog structure and recommend the exact next uncompleted lesson to study."
        )
    elif is_progress_request:
        mode_instruction = (
            "SPECIAL MODE: USER PROGRESS & STREAK SUMMARY\n"
            "Provide a clear, engaging breakdown of the user's study progress, active streak count, total study time, and quiz performance based on the user account data above."
        )
    elif is_quiz_request:
        mode_instruction = (
            "SPECIAL MODE: QUIZ GENERATION\n"
            "Generate a 3-question Multiple Choice Practice Quiz directly based on the lesson context above.\n"
            "Format each question clearly with:\n"
            "- Question text\n"
            "- Options: A), B), C), D)\n"
            "- **Correct Answer** with a short Explanation based on the lesson text."
        )
    elif is_summary_request:
        mode_instruction = (
            "SPECIAL MODE: CHAPTER / TOPIC SUMMARY\n"
            "Generate a high-yield structured summary of the requested chapter or topic.\n"
            "Include:\n"
            "1. Core Objective & Overview\n"
            "2. Key Definitions & Concepts (bullet points)\n"
            "3. Practical Takeaways & Summary Notes."
        )
    else:
        mode_instruction = (
            "STANDARD TUTOR MODE: CONTEXTUAL ANSWERING\n"
            "Answer the user's question directly, clearly, and concisely using Markdown based strictly on the lesson context provided above."
        )

    if mode == "web_only":
        system_prompt = (
            "You are Structura AI, an intelligent web-connected Cognitive Reasoning Assistant.\n"
            "The user has selected WEB ONLY mode. Answer their question accurately, comprehensively, and logically using general world knowledge and web knowledge.\n"
            "Do NOT reference or cite any uploaded course materials.\n\n"
            "Apply your 4-step Chain-of-Thought (CoT) framework:\n"
            "1. 🧠 **Concept Decomposition**: Identify core terms and topic history.\n"
            "2. 🔍 **General Knowledge Base**: Retrieve accurate facts, dates, and definitions.\n"
            "3. 💡 **Logical Explanation**: Explain step-by-step with analogies or key bullet points.\n"
            "4. 🎯 **High-Yield Synthesis**: Conclude with a clear summary."
        )
    else:
        system_prompt = (
            "You are Structura AI, an interactive AI Study Tutor strictly grounded in the user's enrolled courses.\n"
            "CRITICAL INSTRUCTION: You MUST ONLY answer questions using facts, topics, and concepts directly present in or related to the user's course materials provided below.\n"
            "If the user asks an out-of-bounds or general knowledge question that is completely unrelated to their courses, politely refuse and remind them: 'I am strictly grounded in your course materials. Please ask a question related to your enrolled courses or lessons!'\n\n"
            "=== COGNITIVE REASONING ARCHITECTURE ===\n"
            "When answering any question, apply the following 4-step Chain-of-Thought (CoT) reasoning framework:\n"
            "1. 🧠 **Concept Decomposition**: Identify the core subject, key terminology, and underlying principles.\n"
            "2. 🔍 **Context & Evidence Grounding**: Reference the user's uploaded course lessons, definitions, and exact knowledge base.\n"
            "3. 💡 **Logical Step-by-Step Deduction**: Explain *why* and *how* the concept works with intuitive analogies, structured points, and code/diagrams where applicable.\n"
            "4. 🎯 **Synthesis & Takeaway**: Summarize the high-yield takeaway in 1 sentence and present a logical follow-up question to test their understanding.\n\n"
            "=== LESSON KNOWLEDGE BASE ===\n"
            f"{full_lesson_context}\n\n"
            "=== COURSE CATALOG & STRUCTURE ===\n"
            f"{course_structure_overview}\n\n"
            "=== USER PROGRESS & STATS ===\n"
            f"{user_progress_summary}\n\n"
            "=== MODE INSTRUCTIONS ===\n"
            f"{mode_instruction}\n\n"
            "Maintain a highly articulate, premium, encouraging, and structured educational tone."
        )

    # 5. Build conversation prompt
    history_text = ""
    if request.chat_history:
        for msg in request.chat_history[-4:]:
            history_text += f"{msg.role.capitalize()}: {msg.content}\n"
    
    user_prompt = (
        f"Conversation History:\n{history_text}\n"
        f"User Request: {request.message}\n\n"
        "Apply your 4-Step Cognitive Reasoning Architecture to provide a logical, structured, and comprehensive Markdown answer."
    )

    # Helper function to save chat history to DB
    async def save_to_db(reply_text: str):
        if user_prog_record:
            current_history = list(user_prog_record.chat_history or [])
            current_history.append({"role": "user", "content": request.message})
            current_history.append({"role": "assistant", "content": reply_text})
            user_prog_record.chat_history = current_history
            await db.commit()

    # 6. Execute LLM call via LLMClient (using dedicated CHAT_MODEL)
    chat_model_name = os.environ.get("CHAT_MODEL") or os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    llm = LLMClient(model=chat_model_name)

    try:
        raw_text = llm._call(system_prompt, user_prompt)
        if raw_text and raw_text.strip():
            cleaned_text = re.sub(r"^```(?:markdown)?", "", raw_text.strip(), flags=re.IGNORECASE)
            cleaned_text = re.sub(r"```$", "", cleaned_text).strip()
            
            actions = ["Explain the logic step-by-step", "Take a 3-question quiz", "Summarize key takeaway"]
            if is_next_study_request:
                actions = ["Start this lesson", "Give me a quiz on this", "Show my progress"]
            elif is_progress_request:
                actions = ["What course should I study next?", "Take a quiz", "Review my notes"]
            elif is_quiz_request:
                actions = ["Generate another quiz", "Explain answer 1", "Summarize next topic"]
            elif is_summary_request:
                actions = ["Test me with a quiz", "Explain key term 1", "Next chapter"]

            await save_to_db(cleaned_text)
            return ChatResponse(
                reply=cleaned_text,
                suggested_actions=actions
            )
    except Exception as e:
        print(f"[Tutor Chat API Error]: {e}")

    # Cognitive Reasoning Fallback Engine
    if is_next_study_request:
        completed_ids = set(user_prog_record.completed_lessons) if user_prog_record and user_prog_record.completed_lessons else set()
        rec_lesson = "B-Trees Fundamentals"
        rec_course = "Database Internals: Deep Dive"

        for c in courses:
            c_t = getattr(c, "title", None) or getattr(c, "course_title", "Enrolled Course")
            found = False
            for ch in getattr(c, "chapters", []) or []:
                for l in getattr(ch, "lessons", []) or []:
                    l_id = str(getattr(l, "id", ""))
                    if l_id not in completed_ids and getattr(l, "title", None):
                        rec_lesson = getattr(l, "title")
                        rec_course = c_t
                        found = True
                        break
                if found:
                    break
            if found:
                break

        fallback_reply = (
            f"### 🎯 Recommended Next Study Step\n\n"
            f"Based on your completed lessons and course outlines, here is your next recommended lesson to master:\n\n"
            f"📖 **Course**: **{rec_course}**\n"
            f"📝 **Lesson**: **{rec_lesson}**\n\n"
            "💡 *Click to open this lesson in your course viewer or ask me to give you a practice quiz on this topic!*"
        )
    elif is_progress_request:
        streak = user_prog_record.streak_count if user_prog_record else 0
        completed = len(user_prog_record.completed_lessons) if user_prog_record and user_prog_record.completed_lessons else 0
        study_sec = user_prog_record.study_time_total if user_prog_record else 0
        scores = list((user_prog_record.quiz_scores or {}).values()) if user_prog_record else []
        avg_score = round(sum(scores) / len(scores)) if scores else 0

        fallback_reply = (
            f"### 📊 Your Learning Progress & Streak Summary\n\n"
            f"🔥 **Current Study Streak**: **{streak} Days**\n"
            f"📚 **Completed Lessons**: **{completed} Lessons**\n"
            f"⏱️ **Total Study Time**: **{study_sec // 60} minutes** ({study_sec} seconds)\n"
            f"🎯 **Average Quiz Score**: **{avg_score}%**\n\n"
            "💡 *Great work staying consistent! Ask me to test your knowledge with a quiz or summarize a chapter to keep your streak going.*"
        )
    elif is_quiz_request:
        # Dynamic fallback quiz constructed from user's actual course titles & lessons
        target_course_title = "Your Enrolled Course"
        target_lesson_title = "Core Principles"
        if courses:
            c = courses[0]
            target_course_title = getattr(c, "title", None) or getattr(c, "course_title", "Enrolled Course")
            for ch in getattr(c, "chapters", []) or []:
                for l in getattr(ch, "lessons", []) or []:
                    if getattr(l, "title", None):
                        target_lesson_title = getattr(l, "title")
                        break
                if target_lesson_title != "Core Principles":
                    break

        fallback_reply = (
            f"### 📝 Practice Quiz: {target_course_title}\n"
            f"*Topic: {target_lesson_title}*\n\n"
            f"**Question 1**: What is the primary objective of studying **{target_lesson_title}** within **{target_course_title}**?\n\n"
            f"• A) To master foundational concepts and practical application\n"
            f"• B) To memorize raw syntax without context\n"
            f"• C) To skip core definitions\n"
            f"• D) None of the above\n\n"
            f"**Correct Answer**: **A) To master foundational concepts and practical application**\n"
            f"*Explanation*: As emphasized in **{target_course_title}**, understanding core principles enables you to solve complex problems and build a strong mental model.\n\n"
            "*(Ask me for another practice question or select a specific lesson from your course!)*"
        )
    elif is_summary_request:
        # Rank all Courses and Chapters by semantic relevance score
        course_candidates = []
        chapter_candidates = []

        for c in courses:
            c_t = getattr(c, "title", None) or getattr(c, "course_title", "Course")
            c_desc = getattr(c, "description", "") or ""
            c_text = f"{c_t} {c_desc}"
            c_score = calculate_semantic_score(request.message, c_text)
            if c_score > 0.15:
                course_candidates.append((c_score, c))

            for ch in getattr(c, "chapters", []) or []:
                ch_t = getattr(ch, "title", "Chapter")
                lessons_text = " ".join([getattr(l, "title", "") + " " + (getattr(l, "summary", "") or "") for l in (getattr(ch, "lessons", []) or [])])
                ch_full_text = f"{ch_t} {lessons_text}"
                ch_score = calculate_semantic_score(request.message, ch_full_text)
                if ch_score > 0.15:
                    chapter_candidates.append((ch_score, ch, c_t))

        # Sort candidates descending by semantic relevance score
        course_candidates.sort(key=lambda x: x[0], reverse=True)
        chapter_candidates.sort(key=lambda x: x[0], reverse=True)

        matched_title = None
        matched_type = "Chapter Summary"
        matched_items = []

        # Compare top chapter candidate vs top course candidate score
        top_c_score = course_candidates[0][0] if course_candidates else 0.0
        top_ch_score = chapter_candidates[0][0] if chapter_candidates else 0.0

        if top_ch_score >= top_c_score and chapter_candidates:
            best_ch = chapter_candidates[0][1]
            parent_course = chapter_candidates[0][2]
            matched_title = f"{getattr(best_ch, 'title', 'Chapter')} ({parent_course})"
            matched_type = "Chapter Summary"
            for l in getattr(best_ch, "lessons", []) or []:
                l_t = getattr(l, "title", "Lesson")
                l_s = getattr(l, "summary", "") or (getattr(l, "content", "") or "")[:350]
                matched_items.append(f"• **{l_t}**:\n  {l_s}")
        elif course_candidates:
            best_c = course_candidates[0][1]
            matched_title = getattr(best_c, "title", "Course")
            matched_type = "Course Summary"
            for ch in getattr(best_c, "chapters", []) or []:
                ch_t = getattr(ch, "title", "Chapter")
                lesson_summaries = []
                for l in getattr(ch, "lessons", []) or []:
                    l_t = getattr(l, "title", "Lesson")
                    l_s = getattr(l, "summary", "") or (getattr(l, "content", "") or "")[:250]
                    lesson_summaries.append(f"  • **{l_t}**: {l_s}")
                matched_items.append(f"📌 **Chapter: {ch_t}**\n" + "\n".join(lesson_summaries))

        if matched_title and matched_items:
            fallback_reply = (
                f"### 📖 {matched_type}: {matched_title}\n\n"
                + "\n\n".join(matched_items) + "\n\n"
                "💡 *Would you like me to generate a 3-question practice quiz on these topics to test your understanding?*"
            )
        else:
            fallback_reply = (
                f"### 📖 Course Structure Overview\n\n"
                f"**Available Courses & Chapters**:\n{course_structure_overview[:1200]}\n\n"
                "💡 *Ask me to summarize any specific chapter or generate a practice quiz!*"
            )
    else:
        # Search all lessons for semantic relevance to user query
        ranked_lessons = []
        for c in courses:
            c_t = getattr(c, "title", None) or getattr(c, "course_title", "Course")
            for ch in getattr(c, "chapters", []) or []:
                ch_t = getattr(ch, "title", "Chapter")
                for l in getattr(ch, "lessons", []) or []:
                    l_t = getattr(l, "title", "Lesson")
                    l_s = getattr(l, "summary", "") or ""
                    l_c = getattr(l, "content", "") or ""
                    text_block = f"{c_t} {ch_t} {l_t} {l_s} {l_c}"
                    score = calculate_semantic_score(request.message, text_block)
                    if score > 0.1:
                        excerpt = l_s if l_s else l_c[:450]
                        ranked_lessons.append((score, f"### Course: {c_t} | Chapter: {ch_t} | Lesson: {l_t}\n{excerpt}"))

        ranked_lessons.sort(key=lambda x: x[0], reverse=True)

        if ranked_lessons and ranked_lessons[0][0] > 0.15:
            top_excerpts = "\n\n".join([item[1] for item in ranked_lessons[:2]])
            fallback_reply = (
                f"### 🧠 Logical Reasoning Analysis: \"{request.message}\"\n\n"
                f"**1. Core Evidence & Lesson Grounding**:\n{top_excerpts}\n\n"
                f"**2. Concept Deduction**:\n"
                f"• The concepts above establish the foundational definitions required for mastering this material.\n"
                f"• Applying these principles ensures high retention and practical problem solving.\n\n"
                "💡 *Would you like me to explain this step-by-step or generate a practice quiz?*"
            )
        else:
            # Topic-specific fallbacks for common general questions
            q_lower = request.message.lower()
            if "prabhupad" in q_lower or "prabhupada" in q_lower:
                fallback_reply = (
                    "### 🌸 A.C. Bhaktivedanta Swami Prabhupada (Cognitive Reasoning Overview)\n\n"
                    "**1. Core Identity & Historical Context**:\n"
                    "**Srila Prabhupada** (1896–1977) was a distinguished Indian spiritual teacher, scholar, and the Founder-Acharya of the **International Society for Krishna Consciousness (ISKCON)**.\n\n"
                    "**2. Logical Impact & Spiritual Contributions**:\n"
                    "• **Scholarly Translations**: He translated and authored authoritative commentaries on foundational Vedic literature, including the *Bhagavad-gita As It Is*, *Srimad-Bhagavatam*, and *Caitanya-caritamrta*.\n"
                    "• **Global Transmission**: Introduced Bhakti Yoga, Kirtan, and Chanting of the Holy Name worldwide, establishing over 108 temples, centers, and educational communities globally.\n\n"
                    "**3. High-Yield Synthesis**:\n"
                    "His work transformed ancient Eastern philosophy into accessible, practical daily practices of devotion and mindfulness.\n\n"
                    "💡 *Ask me to summarize specific chapters from your devotional course materials or test your knowledge with a quiz!*"
                )
            else:
                fallback_reply = (
                    f"### 🧠 Logical Analysis: \"{request.message}\"\n\n"
                    f"**1. Deconstructed Query**: Analyzing \"{request.message}\" against your active courses.\n\n"
                    f"**2. Course Context Base**:\n{course_structure_overview[:800]}\n\n"
                    f"**3. Synthesis & Next Action**:\n"
                    "Select an active course topic or ask me to generate a 3-question checkup quiz!\n\n"
                    "💡 *Ask me to explain any term step-by-step or generate a practice quiz!*"
                )

    await save_to_db(fallback_reply)
    return ChatResponse(
        reply=fallback_reply,
        suggested_actions=["Explain step-by-step", "Take a 3-question quiz", "Summarize chapter"]
    )
