from __future__ import annotations

from .schema import (
    CoursePlan,
    PlannedModule,
    PlannedChapter,
    PlannedLesson,
)


class CoursePlanParser:

    @staticmethod
    def parse(data: dict) -> CoursePlan:

        modules = []

        for module in data["modules"]:

            chapters = []

            for chapter in module["chapters"]:

                lessons = [
                    PlannedLesson(**lesson)
                    for lesson in chapter["lessons"]
                ]

                chapters.append(
                    PlannedChapter(
                        chapter_id=chapter["chapter_id"],
                        title=chapter["title"],
                        lessons=lessons,
                    )
                )

            modules.append(
                PlannedModule(
                    module_id=module["module_id"],
                    title=module["title"],
                    chapters=chapters,
                )
            )

        return CoursePlan(
            course_title=data["course_title"],
            description=data["description"],
            modules=modules,
        )