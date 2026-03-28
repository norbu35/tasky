import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
AUDIT_DOC = REPO_ROOT / "docs" / "superpowers" / "specs" / "2026-03-28-production-readiness-audit-design.md"
PLAN_DOC = REPO_ROOT / "docs" / "superpowers" / "plans" / "2026-03-28-production-readiness-program.md"


class ProductionReadinessDocTests(unittest.TestCase):
    def test_audit_doc_covers_scope_and_findings(self) -> None:
        print("TID-TASK-116-DOC-AUDIT-SCOPE")
        text = AUDIT_DOC.read_text(encoding="utf-8")
        self.assertIn("# Production Readiness Audit and Remediation Design", text)
        self.assertIn("## Audit Method", text)
        self.assertIn("## Current-State Assessment", text)
        self.assertIn("#### A. Security and Privacy", text)

    def test_audit_doc_defines_target_state_and_release_gates(self) -> None:
        print("TID-TASK-116-DOC-REMEDIATION-SPEC")
        text = AUDIT_DOC.read_text(encoding="utf-8")
        self.assertIn("## Target State", text)
        self.assertIn("## Remediation Strategy", text)
        self.assertIn("## Release Gates for the Launch Baseline", text)

    def test_plan_doc_sequences_the_program(self) -> None:
        print("TID-TASK-116-DOC-IMPLEMENTATION-PLAN")
        text = PLAN_DOC.read_text(encoding="utf-8")
        self.assertIn("# Production Readiness Program Implementation Plan", text)
        self.assertIn("## Recommended Execution Order", text)
        self.assertIn("## Task 1: Repair Release-Gate Integrity", text)
        self.assertIn("## Final Launch-Baseline Verification", text)


if __name__ == "__main__":
    unittest.main()
