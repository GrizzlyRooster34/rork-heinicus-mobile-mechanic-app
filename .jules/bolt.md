## 2024-05-15 - React Native ScrollView vs FlatList
**Learning:** Using `ScrollView` to render an array of complex React Native components (via `.map`) creates significant performance and memory overhead by rendering the entire list simultaneously.
**Action:** Always prefer `FlatList` over `ScrollView` with `.map` for any dynamic or potentially long list of items, as `FlatList` provides built-in virtualization and lazy rendering.
