from .exceptions import PlanningError
from .schema import CoursePlan


class EducationalPlanningValidator:
    def validate(self, plan: CoursePlan) -> None:
        if not plan.modules:
            raise PlanningError("Course plan has zero modules.")
        lesson_ids = set()
        for module in plan.modules:
            if not module.chapters:
                raise PlanningError(f"Module '{module.title}' has zero chapters.")
            for chapter in module.chapters:
                if not chapter.lessons:
                    raise PlanningError(f"Chapter '{chapter.title}' has zero lessons.")
                for lesson in chapter.lessons:
                    if not lesson.learning_unit_ids:
                        raise PlanningError(f"Lesson '{lesson.title}' references no learning units.")
                    lesson_ids.add(lesson.lesson_id)

        for module in plan.modules:
            for chapter in module.chapters:
                for lesson in chapter.lessons:
                    for prereq in lesson.prerequisites:
                        if prereq not in lesson_ids:
                            raise PlanningError(
                                f"Lesson '{lesson.lesson_id}' has an unknown prerequisite: {prereq}"
                            )
