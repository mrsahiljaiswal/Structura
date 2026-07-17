from pathlib import Path

from .schema import FinalCourse


class CourseAssemblyExporter:
    FILENAME = "final_course.json"

    def export(self, course: FinalCourse, output_dir: str) -> str:
        path = Path(output_dir) / self.FILENAME
        course.save(path)
        return str(path)


class PostgreSQLExporter:
    """
    Placeholder for PostgreSQL persistence. In a real system, this would
    connect to a database and insert the course, modules, chapters, lessons,
    and metadata.
    """

    def export(self, course: FinalCourse, connection_string: str) -> str:
        # This is where you'd do something like:
        # engine = create_engine(connection_string)
        # with Session(engine) as session:
        #     course_row = Course(title=..., ...)
        #     session.add(course_row)
        #     for module in course.modules:
        #         ...
        #     session.commit()
        # return course_row.id
        raise NotImplementedError(
            "PostgreSQL export is not yet implemented. Use CourseAssemblyExporter "
            "for JSON export instead."
        )
