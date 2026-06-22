# Brand Guidelines — Fluent 2 Web Design System
### For Anti Gravity UI Enhancement Team

---

> **Design System:** Microsoft Fluent 2 Web  
> **Reference Source:** Fluent 2 Web Component Library  
> **Purpose:** UI enhancement and consistency guidelines for project implementation

---

## 1. Overview & Design Philosophy

This project follows the **Fluent 2 Web** design system — Microsoft's evolution of its design language for web applications. The system prioritises:

- **Clarity** — clean, uncluttered layouts with consistent visual hierarchy
- **Accessibility** — all interactive components must support hover, pressed, focus, disabled, and selected states
- **Cognitive efficiency** — reduce user effort through predictable patterns and well-placed information
- **Contextual hierarchy** — use spacing, text weight, and colour to guide attention, not decoration

---

## 2. Component Library

The following components are part of the approved component set. Each must be implemented according to the variant specifications below.

---

### 2.1 Accordion

An accordion groups sections of related content that can be opened and closed.

**Usage rules:**
- Use to decrease cognitive load by letting users choose which sections to see (e.g. FAQs)
- **Do not** put information required for the current task inside an accordion — give that content more prominence
- Default expand/collapse indicator: **chevron** (before or after the label)

**Variants:**
- Chevron position: before or after text
- Sizes: Small, Medium (default), Large
- States: Rest, Hover, Pressed, Focused, Disabled

---

### 2.2 Avatar

An avatar represents a person or group with an image, icon, or initials. It can also convey presence (availability status) and activity.

**Usage rules:**
- Use an **Avatar Group** when displaying multiple avatars simultaneously
- Square shape is **not currently supported** — use circular or rounded only
- Presence indicators (activity rings) should be used to show live status

**Variants:**
- Types: Image, Icon, Initials
- Sizes: 16px, 20px, 24px, 28px, 32px, 36px, 40px, 48px, 56px, 64px, 72px, 96px, 120px
- Colour sets: Neutral, Brand, Shared colours (full palette of ~30 colours)
- Presence states: Available, Away, Blocked, Busy, DND, Offline, Unknown, OOF (out of office)
- In-office vs Out-of-office ring styling

---

### 2.3 Avatar Group

Displays a collection of avatars together.

**Layout modes:**
- **Spread** — avatars displayed side by side with spacing
- **Stack** — avatars overlap one another
- **Pie** — 2–3 avatars shown in a split circular format (for small counts)

**Sizes:** All avatar sizes supported (16px–120px)

---

### 2.4 Badge

A badge is a visual indicator communicating status or a description of an associated component. Uses short text, colour, and icons for quick recognition. Placed near the relevant content.

**Variants by intent:**
| Variant | Colour |
|---|---|
| Brand | Blue |
| Danger | Red |
| Warning | Orange/Amber |
| Success | Green |
| Important | Dark/Black |
| Informative | Neutral grey |
| Subtle | Light grey (dark-mode aware) |

**Display styles:** Filled, Tint, Outline, Subtle  
**Sizes:** Small (Extra Small), Medium, Large, Extra Large  
**Presence badge sizes:** Tiny, Extra Small, Small, Medium, Large, Extra Large

---

### 2.5 Breadcrumb

Helps users understand their location within a hierarchy and navigate back quickly.

**Usage rules:**
- Use for large, complex site or app hierarchies
- The **last item** in the trail is always bolded (current page)
- Overflow items collapse to `···` with a chevron when the trail is too long
- States: Rest, Hover, Pressed, Focused, Disabled, Current

**Sizes:** Small, Medium (default), Large  
**Item variants:** Text only, Text + Icon, Overflow

---

### 2.6 Button & Toggle Button

Buttons trigger actions or events. Toggle buttons switch between two states (on/off).

**Usage rules:**
- Use buttons for important actions (submitting, committing a change)
- **Do not use a button** for navigation — use a Link instead
- Toggle button: rest state = "off"; selected state = "on"

**Button appearances:**
| Appearance | Use case |
|---|---|
| **Primary** | Single high-emphasis action per surface |
| **Secondary (default)** | Standard actions |
| **Outline** | De-emphasised or secondary context |
| **Subtle** | Low-priority actions, within dense UIs |
| **Transparent** | Minimal visual footprint |

**Shapes:** Circular, Rounded (default), Square  
**Sizes:** Small, Medium (default), Large  
**States:** Rest, Hover, Pressed, Selected, Focus, Disabled  
**Content types:** Text only, Text + Icon, Icon only (toggle)

---

### 2.7 Menu Button

Toggles a dropdown menu of options. Unlike a split button, it does **not** surface a primary action — it is purely a menu trigger.

**Appearances:** Primary, Secondary, Outline, Subtle, Transparent  
**Shapes:** Circular, Rounded, Square  
**Sizes:** Small, Medium, Large

---

### 2.8 Split Button

Lets users take one of several related actions. The dominant action is on the main button label; additional actions are tucked in a dropdown menu.

**Appearances:** Primary, Secondary, Outline, Subtle, Transparent  
**Shapes:** Circular, Rounded, Square  
**Sizes:** Small, Medium, Large  
**States:** Rest, Hover, Pressed, Selected, Focus, Disabled

---

### 2.9 Compound Button

Includes a main title **and** an additional secondary description below it. Use when helpful context makes the action clearer.

**Appearances:** Primary, Secondary, Outline, Subtle, Transparent  
**Content types:** Text only, Text + Image  
**States:** Rest, Hover, Pressed, Selected, Focus, Disabled

---

### 2.10 Card

A container that holds related information and actions for a single concept or object (e.g. a document, a contact).

**Usage rules:**
- Cards are flexible — use them consistently for the same use-case patterns across the project
- Never put information that requires immediate attention inside a card without prominence treatment

**Styles:** Filled, Flat  
**Sizes:** Small, Medium, Large  
**States:** Rest, Hover, Pressed, Selected, Focused, Disabled, Draggable

---

### 2.11 Carousel

A dynamic UI component that cycles through content linearly and cyclically. Useful for featured articles, products, or services.

**Layout options:**
- Over content (overlay)
- Outside content (chevrons outside the card area)

**Navigation types:**
- Steps (dot indicators)
- Image preview strip

**Pause button placement:** In-view or on content click  
**Chevron placement:** Flexible to align, snapped to steps, or compact to content

---

### 2.12 Checkbox

Lets users select multiple options from a group, or switch a single option on/off.

**Usage rules:**
- For single-selection, use a **radio group** or **dropdown** instead
- Checkboxes do **not** trigger immediate changes — they require a submission step (e.g. pressing a button)
- For immediate-effect toggles, use a **Switch**

**Styles:** Standard (square), Circular  
**States:** Rest, Hover, Pressed, Focus, Disabled  
**Status types:** Unchecked, Checked, Indeterminate

---

### 2.13 DataGrid

Organises data in columns and rows, optimised for selection, comparison, and arrow-key cell navigation.

**Usage rules:**
- Use a **List** if only one column is needed
- Use a **Table** if rows are purely visual and not selectable

**Sizes:** Smaller, Small, Medium (default), Large  
**Header cell types:** Regular, Semibold, Sorted  
**Row cell types:** Text (primary/secondary hierarchy), Link, Call actions, Multi-select, Single select, Swappable  
**States:** Rest, Hover, Selected, Selected Hover, Brand Selected, Brand Selected Hover

---

### 2.14 Dialog

A supplemental surface requiring user interaction before they continue their task (e.g. confirmations, deletions).

**Usage rules:**
- Use for **important** interruptions only
- For non-blocking updates, use a **Toast**
- For supplemental context that doesn't block workflow, use a **Popover**
- Blocking dialogs use a **40% opacity overlay** behind the component (`NeutralBackgroundOverlay` token)

**Sizes:** 600px (desktop default), narrow (mobile/compact)  
**Variants:** Standard, With additional confirmation (checkbox inside dialog)  
**Actions:** Primary action button + secondary text link/button

---

### 2.15 Divider

Groups sections of content to create visual rhythm and hierarchy. Use alongside spacing and text hierarchy.

**Orientations:** Horizontal (full), Horizontal (inset), Vertical (full), Vertical (inset)  
**Styles:** Default, Subtle, Strong, Brand

---

### 2.16 Drawer

A secondary content surface that slides in from one edge of the layout. Used for supplemental info, forms, and actions related to the main content.

**Usage rules:**
- Use **overlay drawer** when content needs to take focus without fully replacing the main view
- Use **inline drawer** when the main content and drawer should coexist side by side
- For short info, use a **Popover**; for confirmations, use a **Dialog**

**Types:** Overlay, Inline  
**Sizes:** Small, Medium, Large  
**Actions:** Primary button + Secondary button

---

### 2.17 Field

A combination of a label and a form input component (input text, text area, or dropdown). Can optionally include info buttons, helper text, and validation states.

**Usage rules:**
- Always pair form inputs with a Field wrapper to maintain label + validation consistency
- Required fields are marked with `*`
- Validation error text appears below the input in red with an error icon

**Sizes:** Small, Medium (default), Large  
**Input types:** Text Input, Text Area, Dropdown  
**States:** Default, Error (red border + error message), Info (ⓘ tooltip)

---

### 2.18 List

A vertical stack of like items or information. Items are independent of one another.

**Usage rules:**
- Use a **DataGrid** for column-based, relational data
- Use a **Tree** for nested hierarchy
- Use a **Table** for visual-only rows

**Item types:**
- Single line list item
- Two line list item (primary + secondary text)

**Selection types:** None, Checkmark, Checkbox, Radio  
**States:** Rest (Regular), Rest (Active), Hover, Pressed, Focus, Disabled

---

### 2.19 Menu

A hidden list of options revealed when a trigger (button, avatar, icon) is interacted with. Options execute an immediate action or navigate to a new context.

**Usage rules:**
- Use a **Select/Dropdown/Combobox** if collecting information rather than executing an action
- Section headers are used to group related items
- Shortcut keys can appear on the right side of each item

**Item types:** Menu Item (standard), Menu Split Item  
**States per item:** Rest, Rest (checked), Hover, Pressed, Selected, Focus, Disabled, Disabled (checked)

---

### 2.20 Nav

The primary wayfinding component. Always visible, providing links to the main sections of an app or site.

**Usage rules:**
- Nav supports **one level of nesting only**
- For deeper hierarchy, use a **Tree** component
- Can be minimised to save space

**Item types:**
- NavItem (leaf-level link)
- NavCategoryItem (expandable group with chevron)
- NavSubItem (child item within a category)
- Section Header (non-interactive label)
- Divider
- Flex Space
- App Item (medium size — top-level branding node)

**States:** Rest, Hover, Pressed, Focus, Selected, Selected Hover, Selected Pressed

---

### 2.21 Popover

A small surface that appears when a user interacts with a trigger component. Used for non-essential, contextual information that doesn't block the user.

**Usage rules:**
- Use a **Dialog** for blocking interactions
- Use a **Tooltip** for unstructured plain text
- Popovers can contain interactive components and structured content

**Placement options:** Top (left/middle/right), Bottom (left/middle/right), Left (top/middle/bottom), Right (top/middle/bottom), None (centred)  
**Colour modes:** Default (white), Inverted (dark), Brand (blue)

---

### 2.22 Progress Bar

Communicates system or task progress information (e.g. upload percentage, storage usage).

**Usage rules:**
- Only use for tasks taking **longer than one second**
- For loading new content with a known structure that doesn't block the UI, use a **Skeleton**

**Sizes:** Medium (default), Large  
**Variants:** Static (known progress %), Indeterminate (unknown duration)  
**Status colours:**
- Default: Brand blue
- Success: Green
- Warning: Amber/Orange
- Error: Red

---

### 2.23 SearchBox

Provides access to information with input flexibility, including clear and filter controls.

**Appearances:**
| Appearance | Description |
|---|---|
| Outline (default) | Bordered input with visible edge at rest |
| Filled Darker | Filled background, slightly darker than surface |
| Filled Lighter | Filled background, slightly lighter than surface |
| Transparent | No border, blends into surface |

**Sizes:** Small, Medium (default), Large  
**States:** Rest, Hover, Focus (blue underline indicator)  
**Controls:** Search icon (left), Clear (×) button (right), Filter icon

---

### 2.24 Status Indicator

Represents the status of an object, action, or process. Consists of an icon and text that reinforce each other's meaning.

**Sizes:** Small, Medium (default), Large

**Categories:**
| Category | Examples |
|---|---|
| Active | New, In Progress, Syncing |
| Error | Failed, Cancelled |
| Informational | Archived, Draft, Generic Information, Not Started, Pause, Pending, Scheduled, Unknown |
| Success | Success, Synced |
| Warning | Warning |

---

### 2.25 Toast

A temporary notification that communicates action status or background activity. Not for critical messages.

**Usage rules:**
- Use for **non-critical**, relevant information
- For critical messages, use a **Dialog**, **Field error**, or **Message Bar**
- Toasts are **temporary and self-dismissing** — do not use for information users must act on

**Status types:** Informational, Success, Warning, Error, Icon, Upload, Download, Spinner, Avatar  
**Content tiers:** Primary message, Secondary information, Tertiary information, Progress bar, Quick actions (action link)

---

## 3. Interactive States — Universal Rules

All interactive components must implement the following states consistently:

| State | Visual Treatment |
|---|---|
| **Rest** | Default appearance, no elevation |
| **Hover** | Subtle background tint (brand dot or grey fill) |
| **Pressed** | Slightly darker/filled background, no shadow |
| **Selected** | Brand blue fill or left border accent |
| **Focus** | Visible keyboard focus ring (1–2px outline, square or rounded to match shape) |
| **Disabled** | Reduced opacity (~40%), no pointer events, no hover treatment |

---

## 4. Sizing Scale

Most components share a consistent size scale. Unless a component specifies otherwise, default to **Medium**.

| Size label | Use case |
|---|---|
| Small / Smaller | Compact or dense layouts, data grids, inline elements |
| **Medium (default)** | Standard UI — use unless there is a specific reason not to |
| Large | Prominent actions, prominent form elements, wide-canvas surfaces |

---

## 5. Shape Variants

Button-like components support three shapes. Stick to one shape consistently per surface:

| Shape | Corner radius | Use case |
|---|---|---|
| **Rounded** | Medium radius | Default — general use |
| **Circular** | Full radius (pill) | Floating actions, icon-only compact buttons |
| **Square** | No radius (sharp) | Dense toolbars, data-heavy surfaces |

---

## 6. Colour & Semantic Intent

Use intent-based colours, not raw hex values. All colours must map to Fluent 2 tokens.

| Intent | Colour | Usage |
|---|---|---|
| **Brand** | Blue | Primary CTA, active/selected states, links |
| **Danger / Error** | Red | Destructive actions, validation errors |
| **Warning** | Orange / Amber | Cautionary states, non-blocking alerts |
| **Success** | Green | Confirmation, completion, positive status |
| **Important** | Dark grey / Near-black | High-contrast badges, critical labels |
| **Informational** | Neutral grey | Supplemental info, archived states |
| **Subtle** | Light grey | Low-emphasis labels, secondary info |

---

## 7. Component Decision Guide

Use this quick guide when deciding which component to reach for:

| Need | Use |
|---|---|
| User must confirm before continuing | **Dialog** |
| Show non-blocking status update | **Toast** |
| Show supplemental contextual info | **Popover** |
| Show plain hover text | **Tooltip** |
| Let user pick one option from a list (collect data) | **Dropdown / Select / Combobox** |
| Let user execute one of several actions | **Menu / Menu Button** |
| Let user navigate between app sections | **Nav** |
| Show location within hierarchy | **Breadcrumb** |
| Load structured content (known layout) | **Skeleton** |
| Show task/upload progress > 1 second | **Progress Bar** |
| Toggle between on/off | **Toggle Button** or **Switch** |
| Select multiple items | **Checkbox** |
| Select one item from a group | **Radio** |
| Scan a vertical list of items | **List** |
| Compare structured data in rows/columns | **DataGrid** |
| Show relational data visually | **Table** |

---

## 8. Documentation & Engineering Assets

Each component in this spec has corresponding documentation and engineering assets available. For implementation, always reference:

- **View documentation** — design spec, usage rules, and accessibility notes
- **Engineering assets** — React/Figma component tokens and code

Official Fluent 2 documentation: [https://fluent2.microsoft.design/](https://fluent2.microsoft.design/)

---

*Document prepared for Anti Gravity — UI enhancement handoff. All component rules are drawn directly from the Fluent 2 Web design system specification.*
