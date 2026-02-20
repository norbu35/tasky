# Tasky Design System Guidelines (For AI Agents)

**Goal:** Ensure consistency and strict adherence to Atomic Design principles when building Tasky's UI on Web (React + Vite) and Mobile (React Native + Expo). 

## 1. Single Source of Truth
Never invent new colors, spacing, typography, or radius values. 
All design tokens must come from `@tasky/design-tokens`.

## 2. Web UI Rules (`apps/web`)

* **Framework:** React + Vite + Tailwind CSS.
* **Primitive Components (Atoms):** ALWAYS use `shadcn/ui`. Do not introduce Material UI, Chakra, or custom un-styled primitives if a `shadcn/ui` component exists.
* **Styling Pipeline:** `shadcn/ui` components should use the utility classes configured in `tailwind.config.ts`, which pull values directly from `@tasky/design-tokens`.
* **State Management:** Use standard React hooks (`useState`, `useEffect`) and prioritize Tailwind's built-in state variants (`hover:`, `focus:`, `disabled:`).
* **Parity & A11y:** Ensure that focus states are visible for keyboard navigation and text has minimum AA contrast against backgrounds.

## 3. Mobile UI Rules (`apps/mobile`)

* **Framework:** React Native + Expo.
* **Primitive Components (Atoms):** ALWAYS build native component equivalents. NEVER import `shadcn/ui` directly into the mobile app.
* **Styling Pipeline:** Use React Native's `StyleSheet.create` or inline styles utilizing the constants imported from `@tasky/design-tokens`.
* **Component Equivalency:** If a component exists in `apps/web/src/components/ui/` (e.g., `Button`), a functionally and visually parallel component MUST be created in `apps/mobile/src/components/ui/`.
* **State Management:** Handled locally within components. Map states like "pressed" or "disabled" to the corresponding visual changes defined by the design tokens (e.g., changing opacity or background color on press).

## 4. Building Composite Components (Molecules & Organisms)

When asked to build a complex component (like a "Task Card" or "Booking Form"):
1. First, check if the required primitive Atoms (Button, Badge, Input, Label, Card) exist in `components/ui/`.
2. If they do not exist, create them FIRST according to the platform's rules defined above.
3. Assemble the Molecule/Organism exclusively using these Atoms and the spacing/layout variables from `@tasky/design-tokens`.

## 5. File Structure Enforcement

* `apps/web/src/components/ui/*.tsx`: Strictly for `shadcn/ui` primitive components.
* `apps/web/src/components/feature/*.tsx`: Domain-specific components composed of UI primitives.
* `apps/mobile/src/components/ui/*.tsx`: Strictly for Native atomic components matching Web primitives.
* `apps/mobile/src/components/feature/*.tsx`: Domain-specific mobile components.

## 6. Implementation Roadmap (Vertical Slices)

To maximize code reuse and parity, frontend features must be developed as **vertical slices** where business logic is written once in `packages/core` alongside the corresponding Web and Mobile UI components, mapped to existing backlog tickets:

### Phase 1: Shared Data & Infrastructure (`TASK-000`, `TASK-070`, `TASK-071`)
* Build generic `packages/core` for API clients, Zod schemas, and shared React Hooks (e.g., Zustand state, Tanstack Query). Ensure strict Web & Mobile setup.

### Phase 2: Auth & Identity (`TASK-080`, `TASK-082`)
* *Primitives*: Inputs, Labels, Buttons, Forms.
* *Logic*: `useAuth` hook, OTP validation via backend.
* *Flow*: SMS login, Profile setup, Avatar Upload, and "Tasker" role toggles.

### Phase 3: Task Discovery & Creation (`TASK-080`, `TASK-082`)
* *Primitives*: Cards, Maps, Image Uploaders.
* *Logic*: `useTasks` queries with Cursor pagination support.
* *Flow*: Open Task Feed (filtered + private view), Create Task form (max 3 photos, pin drop).

### Phase 4: Matching & Booking (`TASK-081`, `TASK-083`)
* *Primitives*: Badges, Confirm Modals, Status Indicators.
* *Logic*: `useBooking` mutations, state guardrails.
* *Flow*: Tasker application, Customer explicitly accepting the Liability Disclaimer (CRITICAL), Booking status transitions.

### Phase 5: Communication & Trust (`TASK-081`, `TASK-083`)
* *Primitives*: Chat bubbles, Star Ratings, Toast Notifications.
* *Logic*: WebSockets/STOMP logic, internal API tracking.
* *Flow*: Real-time chat, Reviews (1-5 star) upon completion, Dispute resolution UI.

## 7. Testing & Quality Gates

To pass the `scripts/self-verify.sh` contract, **agents MUST ensure their tests demonstrate logical correctness and coverage** mapped to the Acceptance Criteria (AC).

### Writing Tests
1. **Test Location:**
    * Web Unit: `apps/web/src/**/*.test.tsx` or `apps/web/tests/**/*.test.tsx` (Vitest — both paths are included)
    * Web E2E: `apps/web/e2e/**/*.test.ts` (Playwright)
    * Mobile Unit: `apps/mobile/__tests__/**/*.test.tsx` (Jest)
2. **Behavioral Testing (Not Implementation Testing):** Tests should render the component, perform a user interaction (like clicking a button or filling an input), and verify the resulting DOM state or mocked hook call. Do not test internal component state directly.
3. **Mocks:** When testing UI components that rely on API calls, use `buildApiClientMock()` from `apps/web/tests/setup/mockApiClient.ts` (web) or `jest.mock(...)` the feature hooks from `src/features/*/hooks/` (mobile). Do not mock inner `shadcn/ui` or React Native primitives directly.

### Passing the AC Coverage Gate
For an agent to mark a Ticket as "done", the verification script must see proof that the required `Test IDs` passed in the test runner output. 

* **CRITICAL RULE:** When writing a test block, you MUST include the `TID-XYZ` identifier defined in the ticket spec directly in the `it()` or `test()` description string. Write the TID bare — no brackets or decorators around it.
* *Example (Vitest/Jest):*
  ```typescript
  it('TID-TASK-080-WEB-AUTH-OTP-FLOW should allow user to submit OTP and redirect to feed', async () => {
      // test logic...
  });
  ```
This string mapping is how the autonomous `self-verify.sh` script knows an Acceptance Criterion has been satisfied. Without this exact TID string in the test name, the gate will fail.
