## 2024-03-31 - [React Native List Rendering Performance]
**Learning:** Using `ScrollView` and `.map` for lists in React Native can cause severe performance issues (O(n) memory footprint) since all children are rendered simultaneously regardless of visibility.
**Action:** Replace `ScrollView` + `.map` with `FlatList` when rendering potentially long or dynamic lists. `FlatList` offers lazy rendering, only drawing what is on or near the screen, significantly reducing memory overhead.
