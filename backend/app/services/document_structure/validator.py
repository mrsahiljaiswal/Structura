from .exceptions import StructureError
from .schema import DocumentStructure, StructureNode


def _count_leaves(node: StructureNode) -> int:
    if node.level == "paragraph":
        return 1
    return sum(_count_leaves(c) for c in node.children)


class DocumentStructureValidator:
    def validate(self, structure: DocumentStructure) -> None:
        if not structure.tree.children:
            raise StructureError("Structure tree has no content under the book root.")
        if _count_leaves(structure.tree) == 0:
            raise StructureError("Structure tree has zero paragraph leaves.")
