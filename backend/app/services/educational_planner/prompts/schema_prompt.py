SCHEMA_PROMPT = """
Return ONLY valid JSON.

The JSON MUST exactly match this schema.

{
  "course_title": "...",
  "description": "...",
  "modules": [
    {
      "module_id": "...",
      "title": "...",
      "chapters": [
        {
          "chapter_id": "...",
          "title": "...",
          "lessons": [
            {
              "lesson_id": "...",
              "title": "...",
              "learning_unit_ids": [],
              "learning_objectives": [],
              "estimated_minutes": 15,
              "difficulty": "Beginner",
              "prerequisites": []
            }
          ]
        }
      ]
    }
  ]
}

NEVER generate:

module_title

chapter_title

lesson_title

learning_units

Use ONLY:

title

learning_unit_ids

Return raw JSON only.
"""