## 2025-04-02 - List Rendering Optimization
**Learning:** Using `<ScrollView>` coupled with `.map()` to render lists in React Native is a major performance and memory bottleneck for potentially unbounded datasets (like an admin user list). It causes all items to render simultaneously, resulting in an O(n) memory footprint.
**Action:** Always prefer `<FlatList>` (or `<SectionList>`) over `<ScrollView>` for list rendering to benefit from its built-in lazy rendering, view recycling, and better memory management.
