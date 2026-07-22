"""
Structura Pipeline Orchestrator

Chains all 10 modules in the correct sequence:
  1. Document Extraction (PDF → raw structure)
  2. Document Normalization (raw → clean blocks)
  3. Document Understanding (classify document type)
  4. Document Structure (build hierarchy)
  5. Knowledge Extraction (extract concepts)
  6. Semantic Segmentation (build learning units)
  7. Educational Planning (create curriculum)
  8. Lesson Authoring (write lessons independently)
  9. Educational Review (QA gate before persistence)
  10. Course Assembly (aggregate & persist)

Usage:
    from app.pipeline.orchestrator import StructuraPipeline
    
    pipeline = StructuraPipeline(output_dir="/tmp/course_output")
    final_course = pipeline.run(pdf_path="textbook.pdf", course_title="Database Internals")
"""

from __future__ import annotations

from pathlib import Path

from app.common.llm_client import LLMClient
from app.services.course_assembly.exporter import CourseAssemblyExporter
from app.services.course_assembly.service import CourseAssemblyService
from app.services.course_assembly.validator import CourseAssemblyValidator
from app.services.document_extraction.exporter import DocumentExtractionExporter
from app.services.document_extraction.service import DocumentExtractionService
from app.services.document_extraction.validator import DocumentExtractionValidator
from app.services.document_normalization.exporter import DocumentNormalizationExporter
from app.services.document_normalization.service import DocumentNormalizationService
from app.services.document_normalization.validator import DocumentNormalizationValidator
from app.services.document_structure.exporter import DocumentStructureExporter
from app.services.document_structure.service import DocumentStructureService
from app.services.document_structure.validator import DocumentStructureValidator
from app.services.document_understanding.exporter import DocumentUnderstandingExporter
from app.services.document_understanding.service import DocumentUnderstandingService
from app.services.document_understanding.validator import DocumentUnderstandingValidator
from app.services.educational_planner.exporter import EducationalPlanningExporter
from app.services.educational_planner.service import EducationalPlanningService
from app.services.educational_planner.validator import EducationalPlanningValidator
from app.services.knowledge_extraction.exporter import KnowledgeExtractionExporter
from app.services.knowledge_extraction.service import KnowledgeExtractionService
from app.services.knowledge_extraction.validator import KnowledgeExtractionValidator
from app.services.lesson_authoring.exporter import LessonAuthoringExporter
from app.services.lesson_authoring.service import LessonAuthoringService
from app.services.lesson_authoring.validator import LessonAuthoringValidator
from app.services.lesson_review.exporter import EducationalReviewExporter
from app.services.lesson_review.service import EducationalReviewService
from app.services.lesson_review.validator import EducationalReviewValidator
from app.services.semantic_segmentation.exporter import SemanticSegmentationExporter
from app.services.semantic_segmentation.service import SemanticSegmentationService
from app.services.semantic_segmentation.validator import SemanticSegmentationValidator


class StructuraPipeline:
    """
    End-to-end pipeline orchestrator. Runs all 10 modules in order, with
    optional persistence of intermediate outputs and validation gates at
    each stage.

    Every module can be swapped out independently - all services are
    injected at init time.
    """

    def __init__(
        self,
        output_dir: str,
        llm_client: LLMClient | None = None,
        skip_validation: bool = False,
        save_intermediates: bool = True,
    ):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.llm = llm_client or LLMClient()
        self.skip_validation = skip_validation
        self.save_intermediates = save_intermediates

        # Initialize all service instances
        self.extraction = DocumentExtractionService()
        self.normalization = DocumentNormalizationService()
        self.understanding = DocumentUnderstandingService(llm_client=self.llm)
        self.structure = DocumentStructureService()
        self.knowledge = KnowledgeExtractionService(llm_client=self.llm)
        self.segmentation = SemanticSegmentationService()
        self.planner = EducationalPlanningService(llm_client=self.llm)
        self.authoring = LessonAuthoringService(llm_client=self.llm)
        self.reviewer = EducationalReviewService(llm_client=self.llm)
        self.assembly = CourseAssemblyService()

    def run(self, pdf_path: str, course_title: str) -> any:
        """
        Run the full pipeline. Returns the final FinalCourse object and
        saves all artifacts to self.output_dir.
        """
        print(f"[Structura] Starting pipeline for {pdf_path}")
        print(f"[Structura] Output directory: {self.output_dir}")

        # Module 1: Extraction
        print("\n[Module 1] Document Extraction...")
        extracted = self.extraction.extract(pdf_path)
        if not self.skip_validation:
            DocumentExtractionValidator().validate(extracted)
        if self.save_intermediates:
            DocumentExtractionExporter().export(extracted, str(self.output_dir))

        # Module 2: Normalization
        print("[Module 2] Document Normalization...")
        normalized = self.normalization.normalize(extracted)
        if not self.skip_validation:
            DocumentNormalizationValidator().validate(normalized)
        if self.save_intermediates:
            DocumentNormalizationExporter().export(normalized, str(self.output_dir))

        # Module 3: Understanding
        print("[Module 3] Document Understanding...")
        profile = self.understanding.understand(normalized)
        if not self.skip_validation:
            DocumentUnderstandingValidator().validate(profile)
        if self.save_intermediates:
            DocumentUnderstandingExporter().export(profile, str(self.output_dir))

        # Module 4: Structure
        print("[Module 4] Document Structure...")
        structure = self.structure.build(normalized, title=course_title)
        if not self.skip_validation:
            DocumentStructureValidator().validate(structure)
        if self.save_intermediates:
            DocumentStructureExporter().export(structure, str(self.output_dir))

        # Module 5: Knowledge Extraction
        print("[Module 5] Knowledge Extraction...")
        knowledge = self.knowledge.extract(structure)
        if not self.skip_validation:
            KnowledgeExtractionValidator().validate(knowledge)
        if self.save_intermediates:
            KnowledgeExtractionExporter().export(knowledge, str(self.output_dir))

        print("=" * 80)
        print("LEARNING UNITS / KNOWLEDGE EXTRACTION OUTPUT")
        print("=" * 80)
        print(f"Total Concepts Extracted: {len(knowledge.concepts)}")
        for concept in knowledge.concepts:
            print("-", concept.name)

        # Module 6: Semantic Segmentation
        print("\n[Module 6] Semantic Segmentation...")
        learning_units = self.segmentation.segment(structure, knowledge)
        if not self.skip_validation:
            SemanticSegmentationValidator().validate(learning_units)
        if self.save_intermediates:
            SemanticSegmentationExporter().export(learning_units, str(self.output_dir))

        print("=" * 80)
        print("SEGMENTS / SEMANTIC SEGMENTATION OUTPUT")
        print("=" * 80)
        print(f"Total Learning Unit Segments: {len(learning_units.units)}")
        for unit in learning_units.units:
            print("-", unit.topic)

        # Module 7: Educational Planning
        print("\n[Module 7] Educational Planning...")
        print("=" * 80)
        print("PLANNER INPUT")
        print("=" * 80)
        print("Units:", len(learning_units.units))
        for u in learning_units.units:
            print("-", u.topic)

        plan = self.planner.plan(knowledge, learning_units, course_title)
        if not self.skip_validation:
            EducationalPlanningValidator().validate(plan)
        if self.save_intermediates:
            EducationalPlanningExporter().export(plan, str(self.output_dir))

        print("=" * 80)
        print("CURRICULUM / PLANNER OUTPUT")
        print("=" * 80)
        print(f"Total Modules: {len(plan.modules)}")
        for module in plan.modules:
            print(f"Module: {module.title}")
            for chapter in module.chapters:
                print(f"  Chapter: {chapter.title}")
                for lesson in chapter.lessons:
                    print(f"     Lesson: {lesson.title}")

        # Modules 8 & 9: Lesson Authoring & Educational Review (with Repair Loop)
        print("\n[Modules 8 & 9] Lesson Authoring & Educational Review (with Repair Loop)...")
        from app.pipeline.repair_loop import LessonRepairLoop
        repair_loop = LessonRepairLoop(self.authoring, self.reviewer)

        lesson_titles_by_id = {
            lesson.lesson_id: lesson.title
            for module in plan.modules for chapter in module.chapters for lesson in chapter.lessons
        }

        reviewed_lessons = {}
        author_exporter = LessonAuthoringExporter()
        review_exporter = EducationalReviewExporter()

        for module in plan.modules:
            for chapter in module.chapters:
                for planned in chapter.lessons:
                    prereq_titles = [lesson_titles_by_id[p] for p in planned.prerequisites if p in lesson_titles_by_id]
                    print(f"  Processing lesson: {planned.title}...")
                    reviewed = repair_loop.author_and_review(planned, learning_units, prereq_titles)

                    if not self.skip_validation:
                        try:
                            EducationalReviewValidator().validate(reviewed)
                            reviewed_lessons[reviewed.lesson.lesson_id] = reviewed
                            print(f"    [Approved] (score: {reviewed.quality_score})")
                        except Exception as e:
                            print(f"    [Rejected] : {e}")
                    else:
                        reviewed_lessons[reviewed.lesson.lesson_id] = reviewed
                        status = "Approved" if reviewed.approved else "Rejected"
                        print(f"    [{status}] (score: {reviewed.quality_score})")

                    if self.save_intermediates:
                        author_exporter.export(reviewed.lesson, str(self.output_dir))
                        review_exporter.export(reviewed, str(self.output_dir))

        if not reviewed_lessons:
            raise Exception("No lessons passed review - cannot assemble course.")

        # Module 10: Course Assembly
        print(f"\n[Module 10] Course Assembly ({len(reviewed_lessons)} approved lessons)...")
        final_course = self.assembly.assemble(plan, reviewed_lessons)
        if not self.skip_validation:
            CourseAssemblyValidator().validate(final_course)
        if self.save_intermediates:
            CourseAssemblyExporter().export(final_course, str(self.output_dir))

        print(f"\n[Structura] Pipeline complete!")
        print(f"  Course: {final_course.course_title}")
        print(f"  Lessons: {final_course.statistics.total_lessons}")
        print(f"  Words: {final_course.statistics.total_word_count}")
        print(f"  Reading time: {final_course.statistics.total_reading_time_minutes} minutes")
        print(f"  Avg quality: {final_course.statistics.average_quality_score:.1f}/100")

        return final_course
