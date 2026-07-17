from pathlib import Path

from .schema import CoursePlan


class EducationalPlanningExporter:
    FILENAME = "course_plan.json"

    def export(self, plan: CoursePlan, output_dir: str) -> str:
        path = Path(output_dir) / self.FILENAME
        plan.save(path)
        return str(path)
