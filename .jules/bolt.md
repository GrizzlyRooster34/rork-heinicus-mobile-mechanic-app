## 2024-05-18 - Avoid ScrollView for Long Lists
**Learning:** In React Native UI components, avoid rendering potentially long or unbounded lists using `ScrollView` combined with `.map()`, as it causes O(n) memory footprint overhead by rendering all items simultaneously.
**Action:** Instead, use `FlatList` to benefit from lazy rendering and better memory management.
