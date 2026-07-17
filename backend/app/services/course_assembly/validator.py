from .exceptions import AssemblyError
from .schema import FinalCourse


class CourseAssemblyValidator:
    def validate(self, course: FinalCourse) -> None:
        if not course.modules:
            raise AssemblyError("Final course has zero modules.")
        if not course.statistics:
            raise AssemblyError("Final course has no statistics.")
        if course.statistics.total_lessons == 0:
            raise AssemblyError("Final course has zero lessons.")
        if course.statistics.total_word_count == 0:
            raise AssemblyError("Final course has zero word count - invalid.")

        for lesson_id, prereqs in course.dependencies.items():
            for prereq_id in prereqs:
                if prereq_id not in course.dependencies:
                    raise AssemblyError(
                        f"Dependency graph has an edge to unknown lesson: {prereq_id}"
                    )
