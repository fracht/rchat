# @rchat/react

## 0.11.1

## 0.11.0

### Minor Changes

-   d3d5c88: Removed `initiallyScrollToBottom` prop in EndlessList.
-   d3d5c88: Added initial messages state and initial search in MessageList component.
-   d3d5c88: Removed jump on initial render in useEndlessList.

## 0.10.1

## 0.10.0

### Minor Changes

-   09ae2fa: Added initiallyScrollToBottom prop to EndlessList
-   7894d3c: Added initial items in EndlessList

## 0.9.0

### Minor Changes

-   b8e8aad: Refactored CustomEventMap

## 0.8.5

## 0.8.4

### Patch Changes

-   e2c1ae2: Fixed scrolling to bottom

## 0.8.3

### Patch Changes

-   6e00866: Fix issues with scroll to focus item

## 0.8.2

### Patch Changes

-   2facfb7: Fixed scroll to bottom

## 0.8.1

### Patch Changes

-   d2aff00: Fixed scrolling to bottom algorithm

## 0.8.0

### Minor Changes

-   44c9457: Added more customization for jump animation

## 0.7.9

### Patch Changes

-   0418e28: Excluded placeholders from jump item context

## 0.7.8

### Patch Changes

-   f23ac07: Include more context for items during jump

## 0.7.7

### Patch Changes

-   97403cc: Resolved conflict between stickToBottom scrolling and jump scroll animation
-   1aa4e18: Pass reference into placeholder component

## 0.7.6

### Patch Changes

-   9216bf1: Changed IntersectionObserver threshold to 0, in order to prevent issues with jumps

## 0.7.5

### Patch Changes

-   60f0208: Fixed useVisibleItems hook for EndlessList component

## 0.7.4

### Patch Changes

-   473aa14: Fixed issues with scrolling during long jumps

## 0.7.3

### Patch Changes

-   bbaf921: Fixed issue with multiple focus references
-   25e44e7: Fixed performance issues related to visible items handling algorithm

## 0.7.2

### Patch Changes

-   538ef32: Schedule scrolling on next render in EndlessList

## 0.7.1

### Patch Changes

-   925d2bc: Fixed scrolling algorithm in EndlessList

## 0.7.0

### Minor Changes

-   2858ace: Reimplemented EndlessList jumps - proper handling of concurrent jumps

## 0.6.3

### Patch Changes

-   3df3b4c: Replaced animation speed with animation duration

## 0.6.2

### Patch Changes

-   6bf8110: Added jumpAnimationDuration prop on MessageList
-   905a9ad: Fix search result iteration - max index set to results.length-1
-   0b7c173: Stopping scrolling when new focus item appear. Changed jumpAnimationDuration to jumpAnimationSpeed

## 0.6.1

### Patch Changes

-   56f2ab7: Fixed jump direction in EndlessList

## 0.6.0

### Minor Changes

-   50d9c73: Implemented search functionality for MessageList

## 0.5.18

### Patch Changes

-   c4e79fa: Exposed useEndlessList and useVisibleFrame hooks
    -   @rchat/client@0.5.18

## 0.5.17

### Patch Changes

-   @rchat/client@0.5.17

## 0.5.16

### Patch Changes

-   @rchat/client@0.5.16

## 0.5.15

### Patch Changes

-   @rchat/client@0.5.15

## 0.5.14

### Patch Changes

-   @rchat/client@0.5.14

## 0.5.13

### Patch Changes

-   @rchat/client@0.5.13

## 0.5.12

### Patch Changes

-   @rchat/client@0.5.12

## 0.5.11

### Patch Changes

-   @rchat/client@0.5.11

## 0.5.10

### Patch Changes

-   Updated dependencies [4c44f08]
    -   @rchat/client@0.5.10

## 0.5.9

### Patch Changes

-   @rchat/client@0.5.9

## 0.5.8

### Patch Changes

-   @rchat/client@0.5.8

## 0.5.7

### Patch Changes

-   2df9478: Fixed scrolling to bottom after initial message load
    -   @rchat/client@0.5.7

## 0.5.6

### Patch Changes

-   @rchat/client@0.5.6

## 0.5.5

### Patch Changes

-   @rchat/client@0.5.5

## 0.5.4

### Patch Changes

-   @rchat/client@0.5.4

## 0.5.3

### Patch Changes

-   @rchat/client@0.5.3

## 0.5.2

### Patch Changes

-   ce354b9: Fixed type mismatches
    -   @rchat/client@0.5.2

## 0.5.1

### Patch Changes

-   c0fdf6a: Fix clean-publish configuration
-   Updated dependencies [c0fdf6a]
    -   @rchat/client@0.5.1

## 0.5.0

### Minor Changes

-   b947a46: Migrated to tsc

### Patch Changes

-   @rchat/client@0.5.0

## 0.4.4

### Patch Changes

-   @rchat/client@0.4.4

## 0.4.3

### Patch Changes

-   @rchat/client@0.4.3

## 0.4.2

### Patch Changes

-   @rchat/client@0.4.2

## 0.4.1

### Patch Changes

-   @rchat/client@0.4.1

## 0.4.0

### Patch Changes

-   @rchat/client@0.4.0

## 0.3.0

### Minor Changes

-   dcfd53a: Removed innerRef property from EndlessList's container component

### Patch Changes

-   @rchat/client@0.3.0

## 0.2.5

### Patch Changes

-   @rchat/client@0.2.5

## 0.2.4

### Patch Changes

-   @rchat/client@0.2.4

## 0.2.3

### Patch Changes

-   Rebuild

## 0.2.2

### Patch Changes

-   d712295: Fix react transform (for the second time ;)

## 0.2.1

### Patch Changes

-   cc2d168: Fix React transforms

## 0.2.0

### Minor Changes

-   1b7d0f9: Initial version

### Patch Changes

-   Updated dependencies [1b7d0f9]
    -   @rchat/client@0.1.0
