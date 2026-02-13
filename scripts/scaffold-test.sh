#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/scaffold-test.sh --ticket <TICKET-ID> --type <java|web|mobile> --name <TestClassName>

Description:
  Generates a test boilerplate file with TID-XXX identifiers
  mapped from the ticket's acceptance criteria.
USAGE
}

ticket_id=""
type=""
name=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ticket) ticket_id="${2:-}"; shift 2 ;;
    --type)   type="${2:-}"; shift 2 ;;
    --name)   name="${2:-}"; shift 2 ;;
    *) usage; exit 2 ;;
  esac
done

if [[ -z "${ticket_id}" || -z "${type}" || -z "${name}" ]]; then
  usage
  exit 2
fi

ticket_spec="tickets/${ticket_id}.json"
if [[ ! -f "${ticket_spec}" ]]; then
  echo "Ticket spec not found: ${ticket_spec}" >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "${repo_root}"

case "${type}" in
  java)
    out_file="src/test/java/mn/tasky/${name}.java"
    mkdir -p "$(dirname "${out_file}")"
    cat > "${out_file}" <<EOF
package mn.tasky;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ${name} {

EOF
    jq -c '.acceptance_criteria[]' "${ticket_spec}" | while read -r ac; do
      ac_id=$(echo "${ac}" | jq -r '.id')
      test_ids=$(echo "${ac}" | jq -r '.test_ids[]')
      for tid in ${test_ids}; do
        cat >> "${out_file}" <<EOF
    @Test
    void ${tid//-/_}() {
        // AC: ${ac_id}
        // TODO: Implement test logic
    }

EOF
      done
    done
    echo "}" >> "${out_file}"
    ;;

  web|mobile)
    if [[ "${type}" == "web" ]]; then
      out_file="apps/web/src/${name}.test.tsx"
    else
      out_file="apps/mobile/__tests__/${name}.test.tsx"
    fi
    mkdir -p "$(dirname "${out_file}")"
    cat > "${out_file}" <<EOF
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("${name}", () => {
EOF
    jq -c '.acceptance_criteria[]' "${ticket_spec}" | while read -r ac; do
      ac_id=$(echo "${ac}" | jq -r '.id')
      statement=$(echo "${ac}" | jq -r '.statement')
      test_ids=$(echo "${ac}" | jq -r '.test_ids[]')
      for tid in ${test_ids}; do
        cat >> "${out_file}" <<EOF
  it("${tid} should ${statement}", () => {
    // AC: ${ac_id}
    // TODO: Implement test logic
  });

EOF
      done
    done
    echo "});" >> "${out_file}"
    ;;

  *)
    echo "Invalid type: ${type}" >&2
    exit 2
    ;;
esac

echo "Scaffolded test file: ${out_file}"
