VALIDATION_PROMPT = """
Before generating the JSON verify:

✓ Every learning unit is assigned exactly once.

✓ Every lesson has one clear learning objective.

✓ No duplicate lesson titles.

✓ No duplicate chapter titles.

✓ No duplicate module titles.

✓ No repeated concepts.

✓ No repeated explanations.

✓ No repeated examples.

✓ No repeated definitions.

✓ Chapters are cohesive.

✓ Modules are independent.

✓ Prerequisites always appear before dependent lessons.

✓ Lesson duration is balanced.

✓ Chapter size is balanced.
"""