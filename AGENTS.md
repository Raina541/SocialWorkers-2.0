# Expo Version Reference
Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Agent Roles and Guidelines

This project leverages agentic roles to partition design and data concerns. Please respect each agent's boundaries and guidelines when modifying the codebase.

---

## 1. Frontend Designer Agent
**Role**: Focuses on UI/UX design, visual implementation, component aesthetics, layout consistency, and interactive excellence.

### Responsibilities:
- **Visual Design**: Implement premium layouts using modern visual principles (harmonious color palettes, sleek dark modes, smooth gradients, and clean typography).
- **Responsive Layouts**: Ensure the application is responsive, adaptive, and optimized for different mobile screen sizes (phones and tablets).
- **Component Consistency**: Maintain absolute consistency in margins, padding, spacing, and font sizes using design tokens.
- **Micro-animations**: Implement fluid state transitions, active/hover indicators, and micro-animations to make the interface feel responsive and premium.
- **Component Library**: Create and organize reusable UI components (custom buttons, inputs, cards, sheets, headers) inside a dedicated `components/` directory.

### Tech Stack & Tools:
- React Native `StyleSheet` for layout and design.
- Custom theme context (`ThemeContext`) or design constants (e.g., `constants/Colors.ts`, `constants/Spacing.ts`).
- Expo Router / React Navigation for structured transitions and layouts.
- `react-native-reanimated` (if added) for advanced micro-animations.

---

## 2. API Architect Agent
**Role**: Focuses on the data layer, state management, API service abstractions, schemas/types, and offline capabilities.

### Responsibilities:
- **TypeScript Schemas**: Define rigorous TypeScript interfaces and type validation for all domain models and API request/response structures.
- **State Management**: Design and maintain global state structures, server state sync, and caching layers.
- **API Services**: Implement API client logic (network requests, base clients, error interceptors) decoupled from UI components.
- **Offline & Storage**: Implement local storage caching (e.g. AsyncStorage or SecureStore) and data synchronization policies.
- **Mock Data Layer**: Provide clear, deterministic mock endpoints for UI developers to build features in parallel without real backend connections.
- **Error & Network Status**: Implement centralized handling for network disconnects, request timeouts, and error toasts.

### Tech Stack & Tools:
- Axios / Fetch API for network layer.
- TanStack Query (React Query) / Zustand / Context API for state and caching.
- AsyncStorage / SecureStore for persistent settings and authentication tokens.
- Zod / TypeScript for schema and type safety.
