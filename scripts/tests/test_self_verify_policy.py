import json
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
VALIDATE_AC_COVERAGE = REPO_ROOT / "scripts" / "validate-ac-coverage.py"
VALIDATE_TOUCHED_COVERAGE = REPO_ROOT / "scripts" / "validate-touched-coverage.py"
SELF_VERIFY = REPO_ROOT / "scripts" / "self-verify.sh"
RISK_CHECKS = REPO_ROOT / "docs" / "quality" / "risk-checks.json"


class SelfVerifyPolicyTests(unittest.TestCase):
    def _init_temp_git_repo(self, repo_root: Path) -> None:
        subprocess.run(["git", "init"], cwd=repo_root, check=True, capture_output=True, text=True)
        subprocess.run(["git", "config", "user.email", "codex@example.com"], cwd=repo_root, check=True)
        subprocess.run(["git", "config", "user.name", "Codex"], cwd=repo_root, check=True)

    def _write_touched_coverage_fixture(self, repo_root: Path) -> tuple[Path, Path, Path]:
        source_path = repo_root / "src" / "main" / "java" / "mn" / "tasky" / "booking" / "api" / "BookingController.java"
        source_path.parent.mkdir(parents=True)
        source_path.write_text(
            textwrap.dedent(
                """\
                package mn.tasky.booking.api;

                class BookingController {
                    int untouched() {
                        int first = 1;
                        int second = 2;
                        return first + second;
                    }

                    int touched() {
                        return 1;
                    }
                }
                """
            ),
            encoding="utf-8",
        )
        subprocess.run(["git", "add", "."], cwd=repo_root, check=True)
        subprocess.run(["git", "commit", "-m", "base"], cwd=repo_root, check=True, capture_output=True, text=True)
        source_path.write_text(
            textwrap.dedent(
                """\
                package mn.tasky.booking.api;

                class BookingController {
                    int untouched() {
                        int first = 1;
                        int second = 2;
                        return first + second;
                    }

                    int touched() {
                        return 2;
                    }
                }
                """
            ),
            encoding="utf-8",
        )

        changed_files_path = repo_root / "artifacts" / "checks" / "changed-files.txt"
        changed_files_path.parent.mkdir(parents=True)
        changed_files_path.write_text(
            "src/main/java/mn/tasky/booking/api/BookingController.java\n",
            encoding="utf-8",
        )

        jacoco_xml_path = repo_root / "build" / "reports" / "jacoco" / "test" / "jacocoTestReport.xml"
        jacoco_xml_path.parent.mkdir(parents=True)
        out_path = repo_root / "artifacts" / "checks" / "touched-coverage.json"
        return source_path, changed_files_path, jacoco_xml_path

    def test_ac_coverage_gate_is_not_a_fast_check(self) -> None:
        risk_checks = json.loads(RISK_CHECKS.read_text(encoding="utf-8"))
        self.assertNotIn("ac_coverage_gate", risk_checks["fast_checks"])

    def test_validate_ac_coverage_accepts_junit_xml_results(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            repo_root = Path(tmp_dir)
            logs_dir = repo_root / "artifacts" / "checks"
            build_results_dir = repo_root / "build" / "test-results" / "test"
            tests_dir = repo_root / "src" / "test" / "java" / "mn" / "tasky" / "booking"
            logs_dir.mkdir(parents=True)
            build_results_dir.mkdir(parents=True)
            tests_dir.mkdir(parents=True)

            normalized_path = logs_dir / "ticket-spec.normalized.json"
            normalized_path.write_text(
                json.dumps(
                    {
                        "ticket": "TASK-030",
                        "risk_level": "high",
                        "acceptance_criteria": [
                            {
                                "id": "AC-TASK-030-03",
                                "type": "functional",
                                "statement": "Booking completion transitions booking to COMPLETED and task to COMPLETED.",
                                "test_ids": ["TID-TASK-030-API-BOOKING-COMPLETE"],
                                "negative_test_ids": [],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            (logs_dir / "changed_module_tests.log").write_text(
                "Gradle test run finished successfully.\n",
                encoding="utf-8",
            )
            (build_results_dir / "TEST-mn.tasky.booking.BookingIntegrationTests.xml").write_text(
                textwrap.dedent(
                    """\
                    <?xml version="1.0" encoding="UTF-8"?>
                    <testsuite name="mn.tasky.booking.BookingIntegrationTests" tests="1" failures="0" errors="0">
                      <testcase
                        name="TID-TASK-030-API-BOOKING-COMPLETE completion transitions booking and task to completed"
                        classname="mn.tasky.booking.BookingIntegrationTests"
                        time="0.123" />
                    </testsuite>
                    """
                ),
                encoding="utf-8",
            )
            changed_test_file = tests_dir / "BookingIntegrationTests.java"
            changed_test_file.write_text(
                "@DisplayName(\"TID-TASK-030-API-BOOKING-COMPLETE completion transitions booking and task to completed\")\n",
                encoding="utf-8",
            )
            changed_files_path = logs_dir / "changed-files.txt"
            changed_files_path.write_text(
                "src/test/java/mn/tasky/booking/BookingIntegrationTests.java\n",
                encoding="utf-8",
            )

            out_path = logs_dir / "ac-coverage.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(VALIDATE_AC_COVERAGE),
                    "--normalized",
                    str(normalized_path),
                    "--ticket",
                    "TASK-030",
                    "--risk",
                    "high",
                    "--logs-dir",
                    str(logs_dir),
                    "--changed-files",
                    str(changed_files_path),
                    "--out",
                    str(out_path),
                ],
                cwd=repo_root,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(0, result.returncode, msg=result.stderr or result.stdout)

    def test_validate_ac_coverage_accepts_generic_java_test_filenames(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            repo_root = Path(tmp_dir)
            logs_dir = repo_root / "artifacts" / "checks"
            build_results_dir = repo_root / "build" / "test-results" / "test"
            tests_dir = repo_root / "src" / "test" / "java" / "mn" / "tasky" / "booking"
            logs_dir.mkdir(parents=True)
            build_results_dir.mkdir(parents=True)
            tests_dir.mkdir(parents=True)

            normalized_path = logs_dir / "ticket-spec.normalized.json"
            normalized_path.write_text(
                json.dumps(
                    {
                        "ticket": "TASK-030",
                        "risk_level": "high",
                        "acceptance_criteria": [
                            {
                                "id": "AC-TASK-030-01",
                                "type": "functional",
                                "statement": "Booking entity enforces allowed transitions only.",
                                "test_ids": ["TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE"],
                                "negative_test_ids": [],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            (logs_dir / "changed_module_tests.log").write_text(
                "Gradle test run finished successfully.\n",
                encoding="utf-8",
            )
            (build_results_dir / "TEST-mn.tasky.booking.BookingServiceTests.xml").write_text(
                textwrap.dedent(
                    """\
                    <?xml version="1.0" encoding="UTF-8"?>
                    <testsuite name="mn.tasky.booking.BookingServiceTests" tests="1" failures="0" errors="0">
                      <testcase
                        name="TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE valid transitions"
                        classname="mn.tasky.booking.BookingServiceTests"
                        time="0.123" />
                    </testsuite>
                    """
                ),
                encoding="utf-8",
            )
            changed_test_file = tests_dir / "BookingServiceTests.java"
            changed_test_file.write_text(
                "@DisplayName(\"TID-TASK-030-DOMAIN-BOOKING-STATE-MACHINE valid transitions\")\n",
                encoding="utf-8",
            )
            changed_files_path = logs_dir / "changed-files.txt"
            changed_files_path.write_text(
                "src/test/java/mn/tasky/booking/BookingServiceTests.java\n",
                encoding="utf-8",
            )

            out_path = logs_dir / "ac-coverage.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(VALIDATE_AC_COVERAGE),
                    "--normalized",
                    str(normalized_path),
                    "--ticket",
                    "TASK-030",
                    "--risk",
                    "high",
                    "--logs-dir",
                    str(logs_dir),
                    "--changed-files",
                    str(changed_files_path),
                    "--out",
                    str(out_path),
                ],
                cwd=repo_root,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(0, result.returncode, msg=result.stderr or result.stdout)

    def test_self_verify_passes_changed_files_to_ac_coverage_gate(self) -> None:
        self_verify = SELF_VERIFY.read_text(encoding="utf-8")
        self.assertIn("--changed-files artifacts/checks/changed-files.txt", self_verify)

    def test_self_verify_clears_backend_test_result_store_before_checks(self) -> None:
        self_verify = SELF_VERIFY.read_text(encoding="utf-8")
        self.assertIn("rm -rf build/test-results/test build/reports/tests/test", self_verify)

    def test_validate_touched_coverage_ignores_unchanged_uncovered_lines(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            repo_root = Path(tmp_dir)
            self._init_temp_git_repo(repo_root)
            _, changed_files_path, jacoco_xml_path = self._write_touched_coverage_fixture(repo_root)
            jacoco_xml_path.write_text(
                textwrap.dedent(
                    """\
                    <?xml version="1.0" encoding="UTF-8"?>
                    <report name="fixture">
                      <package name="mn/tasky/booking/api">
                        <sourcefile name="BookingController.java">
                          <line nr="4" mi="1" ci="0" mb="0" cb="0"/>
                          <line nr="5" mi="1" ci="0" mb="0" cb="0"/>
                          <line nr="6" mi="1" ci="0" mb="0" cb="0"/>
                          <line nr="11" mi="0" ci="1" mb="0" cb="0"/>
                        </sourcefile>
                      </package>
                    </report>
                    """
                ),
                encoding="utf-8",
            )

            out_path = repo_root / "artifacts" / "checks" / "touched-coverage.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(VALIDATE_TOUCHED_COVERAGE),
                    "--changed-files",
                    str(changed_files_path),
                    "--jacoco-xml",
                    str(jacoco_xml_path),
                    "--out",
                    str(out_path),
                ],
                cwd=repo_root,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(0, result.returncode, msg=result.stderr or result.stdout)

    def test_validate_touched_coverage_fails_when_changed_line_is_uncovered(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            repo_root = Path(tmp_dir)
            self._init_temp_git_repo(repo_root)
            _, changed_files_path, jacoco_xml_path = self._write_touched_coverage_fixture(repo_root)
            jacoco_xml_path.write_text(
                textwrap.dedent(
                    """\
                    <?xml version="1.0" encoding="UTF-8"?>
                    <report name="fixture">
                      <package name="mn/tasky/booking/api">
                        <sourcefile name="BookingController.java">
                          <line nr="11" mi="1" ci="0" mb="0" cb="0"/>
                        </sourcefile>
                      </package>
                    </report>
                    """
                ),
                encoding="utf-8",
            )

            out_path = repo_root / "artifacts" / "checks" / "touched-coverage.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(VALIDATE_TOUCHED_COVERAGE),
                    "--changed-files",
                    str(changed_files_path),
                    "--jacoco-xml",
                    str(jacoco_xml_path),
                    "--out",
                    str(out_path),
                ],
                cwd=repo_root,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(1, result.returncode, msg=result.stdout)
            payload = json.loads(out_path.read_text(encoding="utf-8"))
            self.assertEqual("FAIL", payload["overall_status"])
            self.assertEqual(
                "src/main/java/mn/tasky/booking/api/BookingController.java",
                payload["files"][0]["path"],
            )

    def test_self_verify_uses_touched_coverage_validator(self) -> None:
        self_verify = SELF_VERIFY.read_text(encoding="utf-8")
        self.assertIn("python3 scripts/validate-touched-coverage.py", self_verify)
        self.assertNotIn("./gradlew --no-daemon jacocoTestCoverageVerification", self_verify)

    def test_full_test_suite_skips_global_gradle_coverage_gate(self) -> None:
        self_verify = SELF_VERIFY.read_text(encoding="utf-8")
        self.assertIn("./gradlew --no-daemon check -x jacocoTestCoverageVerification", self_verify)

    def test_self_verify_scopes_semgrep_to_changed_files(self) -> None:
        self_verify = SELF_VERIFY.read_text(encoding="utf-8")
        self.assertIn("semgrep_targets=()", self_verify)
        self.assertIn("artifacts/checks/changed-files.txt", self_verify)
        self.assertIn("semgrep --error --config auto \"${semgrep_targets[@]}\"", self_verify)

    def test_touched_coverage_validator_uses_defusedxml(self) -> None:
        validator = VALIDATE_TOUCHED_COVERAGE.read_text(encoding="utf-8")
        self.assertIn("from defusedxml import ElementTree as ET", validator)

    def test_validate_self_verify_accepts_authorship_metadata_fields(self) -> None:
        validator = (REPO_ROOT / "scripts" / "validate-self-verify.py").read_text(encoding="utf-8")
        self.assertIn('"not_run_test_ids"', validator)
        self.assertIn('"not_written_test_ids"', validator)
        self.assertIn('"changed_test_files"', validator)
        self.assertIn('"authorship_check_enabled"', validator)


if __name__ == "__main__":
    unittest.main()
