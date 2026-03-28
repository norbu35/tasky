import json
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip(), encoding="utf-8")


class WorkflowIntegrityValidationTests(unittest.TestCase):
    def _copy_script(self, repo_root: Path, relative_path: str) -> Path:
        source = REPO_ROOT / relative_path
        destination = repo_root / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        return destination

    def _run_script(self, repo_root: Path, relative_path: str, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(repo_root / relative_path), *args],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=False,
        )

    def _write_ticket_fixture(self, repo_root: Path) -> None:
        write_text(
            repo_root / "docs" / "PRD.md",
            """
            # PRD

            Launch requirements: REQ-AUTH-01, NFR-SEC-01, NFR-OBS-01.
            """,
        )
        write_text(
            repo_root / "docs" / "quality" / "ticket.spec.schema.json",
            "{}",
        )
        write_text(
            repo_root / "tickets" / "STATUS.json",
            """
            {
              "schema_version": "1.0.0",
              "description": "coordination",
              "updated_at": "2026-03-28T10:30:00Z",
              "tickets": {
                "TASK-117": {
                  "status": "in_progress",
                  "agent": "Codex",
                  "branch": "agent/TASK-117-release-gate-integrity",
                  "claimed_at": "2026-03-28T10:30:00Z"
                }
              }
            }
            """,
        )
        write_text(
            repo_root / "tickets" / "TASK-117.json",
            """
            {
              "schema_version": "1.0.0",
              "ticket": "TASK-117",
              "risk_level": "medium",
              "req_ids": ["REQ-AUTH-01", "NFR-SEC-01", "NFR-OBS-01"],
              "depends_on": [],
              "acceptance_criteria": [
                {
                  "id": "AC-TASK-117-01",
                  "type": "functional",
                  "statement": "Workflow integrity uses canonical ticket sources.",
                  "test_ids": ["TID-TASK-117-WORKFLOW-TICKET-CANON"]
                }
              ]
            }
            """,
        )

    def test_ticket_based_validators_pass_without_legacy_backlog_docs(self) -> None:
        print("TID-TASK-117-WORKFLOW-TICKET-CANON")
        with tempfile.TemporaryDirectory() as tmp_dir:
            repo_root = Path(tmp_dir)
            self._copy_script(repo_root, "scripts/validate-backlog.py")
            self._copy_script(repo_root, "scripts/validate-traceability.py")
            self._copy_script(repo_root, "scripts/validate-ticket-spec.py")
            self._copy_script(repo_root, "scripts/validate-ticket-specs.py")
            self._write_ticket_fixture(repo_root)

            backlog_result = self._run_script(repo_root, "scripts/validate-backlog.py")
            trace_result = self._run_script(repo_root, "scripts/validate-traceability.py")
            spec_result = self._run_script(repo_root, "scripts/validate-ticket-specs.py")

            self.assertEqual(0, backlog_result.returncode, msg=backlog_result.stderr or backlog_result.stdout)
            self.assertEqual(0, trace_result.returncode, msg=trace_result.stderr or trace_result.stdout)
            self.assertEqual(0, spec_result.returncode, msg=spec_result.stderr or spec_result.stdout)

    def test_validate_compat_docs_accepts_marker_and_authoritative_refs(self) -> None:
        print("TID-TASK-117-WORKFLOW-COMPAT-DOC")
        with tempfile.TemporaryDirectory() as tmp_dir:
            repo_root = Path(tmp_dir)
            self._copy_script(repo_root, "scripts/validate-compat-docs.py")
            write_text(
                repo_root / "CLAUDE.md",
                """
                # CLAUDE.md

                <!-- COMPATIBILITY_ONLY -->

                Read AGENTS.md and docs/agent/RUNBOOK.md for authoritative workflow and quality-gate guidance.
                """,
            )

            result = self._run_script(repo_root, "scripts/validate-compat-docs.py")
            self.assertEqual(0, result.returncode, msg=result.stderr or result.stdout)

    def test_validate_self_verify_rejects_branch_and_head_provenance_mismatch(self) -> None:
        print("TID-TASK-117-WORKFLOW-SELF-VERIFY-PROVENANCE")
        with tempfile.TemporaryDirectory() as tmp_dir:
            repo_root = Path(tmp_dir)
            self._copy_script(repo_root, "scripts/validate-self-verify.py")
            write_text(
                repo_root / "docs" / "quality" / "risk-checks.json",
                """
                {
                  "check_ids": [
                    "format_lint",
                    "commit_message_lint",
                    "secret_scan",
                    "ticket_spec_validation",
                    "changed_module_tests",
                    "openapi_validation",
                    "integration_tests_touched",
                    "coverage_gate_touched",
                    "full_test_suite",
                    "sast_dependency_scan",
                    "migration_safety",
                    "performance_smoke",
                    "ac_coverage_gate"
                  ],
                  "required_by_risk": {
                    "low": [
                      "format_lint",
                      "commit_message_lint",
                      "secret_scan",
                      "ticket_spec_validation",
                      "changed_module_tests",
                      "ac_coverage_gate"
                    ],
                    "medium": [
                      "format_lint",
                      "commit_message_lint",
                      "secret_scan",
                      "ticket_spec_validation",
                      "changed_module_tests",
                      "openapi_validation",
                      "integration_tests_touched",
                      "coverage_gate_touched",
                      "ac_coverage_gate"
                    ],
                    "high": [
                      "format_lint",
                      "commit_message_lint",
                      "secret_scan",
                      "ticket_spec_validation",
                      "changed_module_tests",
                      "openapi_validation",
                      "integration_tests_touched",
                      "coverage_gate_touched",
                      "full_test_suite",
                      "sast_dependency_scan",
                      "migration_safety",
                      "performance_smoke",
                      "ac_coverage_gate"
                    ]
                  }
                }
                """,
            )
            write_text(repo_root / "docs" / "quality" / "self-verify.schema.json", "{}")
            write_text(
                repo_root / "tickets" / "TASK-117.json",
                """
                {
                  "schema_version": "1.0.0",
                  "ticket": "TASK-117",
                  "risk_level": "medium",
                  "req_ids": ["NFR-SEC-01"],
                  "depends_on": [],
                  "acceptance_criteria": [
                    {
                      "id": "AC-TASK-117-01",
                      "type": "functional",
                      "statement": "Artifact provenance is enforced.",
                      "test_ids": ["TID-TASK-117-WORKFLOW-SELF-VERIFY-PROVENANCE"]
                    }
                  ]
                }
                """,
            )

            subprocess.run(["git", "init"], cwd=repo_root, check=True, capture_output=True, text=True)
            subprocess.run(["git", "config", "user.email", "codex@example.com"], cwd=repo_root, check=True)
            subprocess.run(["git", "config", "user.name", "Codex"], cwd=repo_root, check=True)
            subprocess.run(
                ["git", "checkout", "-b", "agent/TASK-117-release-gate-integrity"],
                cwd=repo_root,
                check=True,
                capture_output=True,
                text=True,
            )
            write_text(repo_root / "README.md", "# fixture\n")
            subprocess.run(["git", "add", "."], cwd=repo_root, check=True)
            subprocess.run(["git", "commit", "-m", "fixture"], cwd=repo_root, check=True, capture_output=True, text=True)
            head_sha = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=repo_root,
                check=True,
                capture_output=True,
                text=True,
            ).stdout.strip()

            valid_artifact = {
                "schema_version": "1.0.0",
                "generated_at": "2026-03-28T10:30:00Z",
                "ticket": "TASK-117",
                "risk_level": "medium",
                "ticket_spec_path": "tickets/TASK-117.json",
                "req_ids": ["NFR-SEC-01"],
                "files_changed": ["scripts/validate-self-verify.py"],
                "required_check_ids": [
                    "format_lint",
                    "commit_message_lint",
                    "secret_scan",
                    "ticket_spec_validation",
                    "changed_module_tests",
                    "openapi_validation",
                    "integration_tests_touched",
                    "coverage_gate_touched",
                    "ac_coverage_gate"
                ],
                "checks": [
                    {
                        "id": "format_lint",
                        "title": "Format and lint checks",
                        "required": True,
                        "status": "PASS",
                        "command": "true",
                        "exit_code": 0,
                        "duration_ms": 1,
                        "started_at": "2026-03-28T10:30:00Z",
                        "finished_at": "2026-03-28T10:30:01Z",
                        "evidence": {"summary": "ok", "artifact_paths": []}
                    },
                    {
                        "id": "commit_message_lint",
                        "title": "Commit message lint",
                        "required": True,
                        "status": "PASS",
                        "command": "true",
                        "exit_code": 0,
                        "duration_ms": 1,
                        "started_at": "2026-03-28T10:30:00Z",
                        "finished_at": "2026-03-28T10:30:01Z",
                        "evidence": {"summary": "ok", "artifact_paths": []}
                    },
                    {
                        "id": "secret_scan",
                        "title": "Secret scan",
                        "required": True,
                        "status": "PASS",
                        "command": "true",
                        "exit_code": 0,
                        "duration_ms": 1,
                        "started_at": "2026-03-28T10:30:00Z",
                        "finished_at": "2026-03-28T10:30:01Z",
                        "evidence": {"summary": "ok", "artifact_paths": []}
                    },
                    {
                        "id": "ticket_spec_validation",
                        "title": "Ticket spec validation",
                        "required": True,
                        "status": "PASS",
                        "command": "true",
                        "exit_code": 0,
                        "duration_ms": 1,
                        "started_at": "2026-03-28T10:30:00Z",
                        "finished_at": "2026-03-28T10:30:01Z",
                        "evidence": {"summary": "ok", "artifact_paths": []}
                    },
                    {
                        "id": "changed_module_tests",
                        "title": "Changed module tests",
                        "required": True,
                        "status": "PASS",
                        "command": "true",
                        "exit_code": 0,
                        "duration_ms": 1,
                        "started_at": "2026-03-28T10:30:00Z",
                        "finished_at": "2026-03-28T10:30:01Z",
                        "evidence": {"summary": "ok", "artifact_paths": []}
                    },
                    {
                        "id": "openapi_validation",
                        "title": "OpenAPI validation",
                        "required": True,
                        "status": "PASS",
                        "command": "true",
                        "exit_code": 0,
                        "duration_ms": 1,
                        "started_at": "2026-03-28T10:30:00Z",
                        "finished_at": "2026-03-28T10:30:01Z",
                        "evidence": {"summary": "ok", "artifact_paths": []}
                    },
                    {
                        "id": "integration_tests_touched",
                        "title": "Integration tests",
                        "required": True,
                        "status": "PASS",
                        "command": "true",
                        "exit_code": 0,
                        "duration_ms": 1,
                        "started_at": "2026-03-28T10:30:00Z",
                        "finished_at": "2026-03-28T10:30:01Z",
                        "evidence": {"summary": "ok", "artifact_paths": []}
                    },
                    {
                        "id": "coverage_gate_touched",
                        "title": "Touched coverage",
                        "required": True,
                        "status": "PASS",
                        "command": "true",
                        "exit_code": 0,
                        "duration_ms": 1,
                        "started_at": "2026-03-28T10:30:00Z",
                        "finished_at": "2026-03-28T10:30:01Z",
                        "evidence": {"summary": "ok", "artifact_paths": []}
                    },
                    {
                        "id": "ac_coverage_gate",
                        "title": "Acceptance criteria coverage gate",
                        "required": True,
                        "status": "PASS",
                        "command": "true",
                        "exit_code": 0,
                        "duration_ms": 1,
                        "started_at": "2026-03-28T10:30:00Z",
                        "finished_at": "2026-03-28T10:30:01Z",
                        "evidence": {"summary": "ok", "artifact_paths": []}
                    }
                ],
                "acceptance_criteria": [
                    {
                        "id": "AC-TASK-117-01",
                        "type": "functional",
                        "statement": "Artifact provenance is enforced.",
                        "test_ids": ["TID-TASK-117-WORKFLOW-SELF-VERIFY-PROVENANCE"],
                        "negative_test_ids": []
                    }
                ],
                "ac_test_mapping": [
                    {
                        "ac_id": "AC-TASK-117-01",
                        "test_ids": ["TID-TASK-117-WORKFLOW-SELF-VERIFY-PROVENANCE"],
                        "covered_test_ids": ["TID-TASK-117-WORKFLOW-SELF-VERIFY-PROVENANCE"],
                        "uncovered_test_ids": [],
                        "not_run_test_ids": [],
                        "not_written_test_ids": [],
                        "status": "PASS"
                    }
                ],
                "ac_coverage_summary": {
                    "total_ac": 1,
                    "mapped_ac": 1,
                    "fully_covered_ac": 1,
                    "total_test_ids": 1,
                    "covered_test_ids": 1,
                    "changed_test_files": [],
                    "authorship_check_enabled": True,
                    "pass": True,
                    "failures": []
                },
                "overall_status": "PASS",
                "known_risks": [],
                "assumptions": [],
                "self_critique": {
                    "requirement_most_likely_to_break": "NFR-SEC-01",
                    "security_or_abuse_path_impacted": "CI provenance",
                    "proof_test": "ac_coverage_gate"
                },
                "ci_parity": {
                    "local_required_check_ids": [
                        "format_lint",
                        "commit_message_lint",
                        "secret_scan",
                        "ticket_spec_validation",
                        "changed_module_tests",
                        "openapi_validation",
                        "integration_tests_touched",
                        "coverage_gate_touched",
                        "ac_coverage_gate"
                    ],
                    "ci_required_check_ids": [
                        "format_lint",
                        "commit_message_lint",
                        "secret_scan",
                        "ticket_spec_validation",
                        "changed_module_tests",
                        "openapi_validation",
                        "integration_tests_touched",
                        "coverage_gate_touched",
                        "ac_coverage_gate"
                    ],
                    "matches": True
                },
                "git_context": {
                    "branch": "agent/TASK-117-release-gate-integrity",
                    "base_ref": "main",
                    "head_sha": head_sha
                },
                "agent": {
                    "name": "Codex",
                    "version": "test"
                }
            }

            artifact_path = repo_root / "artifacts" / "self-verify.json"
            artifact_path.parent.mkdir(parents=True, exist_ok=True)
            artifact_path.write_text(json.dumps(valid_artifact), encoding="utf-8")

            mismatch = dict(valid_artifact)
            mismatch["git_context"] = dict(valid_artifact["git_context"])
            mismatch["git_context"]["branch"] = "agent/TASK-111-web-container-overlay"
            artifact_path.write_text(json.dumps(mismatch), encoding="utf-8")
            mismatch_result = self._run_script(
                repo_root,
                "scripts/validate-self-verify.py",
                "artifacts/self-verify.json",
                "docs/quality/self-verify.schema.json",
            )
            self.assertNotEqual(0, mismatch_result.returncode)

            artifact_path.write_text(json.dumps(valid_artifact), encoding="utf-8")
            match_result = self._run_script(
                repo_root,
                "scripts/validate-self-verify.py",
                "artifacts/self-verify.json",
                "docs/quality/self-verify.schema.json",
            )
            self.assertEqual(0, match_result.returncode, msg=match_result.stderr or match_result.stdout)


if __name__ == "__main__":
    unittest.main()
