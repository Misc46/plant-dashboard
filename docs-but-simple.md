# Build Web Pages with React
## From Zero - Simplified Technical English (ASD-STE100)

This document explains how to build web pages with React.

The user does not need previous knowledge of web development.

This document uses Simplified Technical English (STE).

The rules of STE are:

- One idea per sentence.
- Short sentences.
- One meaning per word.
- No metaphors.
- The word "must" states a requirement.
- The word "may" states permission.
- The word "can" states possibility.
- The word "will" states a future event.

The user must read the parts in order.

Each part is small and has one main idea.

The first parts teach the basics of React and Next.js.

The last parts explain how to contribute to this project.

The final part lists the word meanings.

---

## Part 1 - The three parts of a web page

A web page has three parts:

1. Content.
2. Appearance.
3. Behavior.

**Content** is the text and the images on the page.

**Appearance** is the color, the size, and the position of the content.

**Behavior** is what the page does when the user presses a button or types in a field.

Three languages define these three parts:

| Part | Language | Technical name |
| --- | --- | --- |
| Content | HTML | HyperText Markup Language |
| Appearance | CSS | Cascading Style Sheets |
| Behavior | JavaScript | JavaScript |

The browser reads the three languages.

The browser shows the web page to the user.

The user does not write all three languages as separate files in this project.

The user writes them together, inside one file.

Part 2 explains how.

---

## Part 2 - What React is

React is a tool set.

React helps the user build web pages with functions.

A **component** is a function that returns HTML.

The word "component" is a technical name in this document.

The component is the basic building block of a React page.

The user writes many small components.

The components form a page.

Example - a simple component:

```tsx
function Welcome() {
  return <h1>Hello</h1>;
}
```

Note these rules:

- The function name starts with a capital letter. This is a requirement.
- The function returns HTML.
- The HTML inside the function is **JSX**.

JSX is a technical name.

JSX means "HTML inside JavaScript code".

The user writes JSX exactly like HTML, with two differences:

1. The user writes `className` instead of `class`.
2. The user writes JavaScript expressions inside curly braces: `{ }`.

Example:

```tsx
function Welcome() {
  const name = "Ada";
  return <h1>Hello {name}</h1>;
}
```

The page shows: `Hello Ada`.

---

## Part 3 - How a file becomes a page (Next.js)

This project uses Next.js.

Next.js is a tool set that uses React.

In Next.js, the folder structure defines the URL structure.

| File in the project | URL of the page |
| --- | --- |
| `src/app/login/page.tsx` | `/login` |
| `src/app/dashboard/page.tsx` | `/dashboard` |
| `src/app/dashboard/plants/page.tsx` | `/dashboard/plants` |

The user does not create a URL list.

The user creates a file.

Next.js creates the URL from the file position.

A folder name in brackets is a **wildcard**.

The word "wildcard" is a technical name in this document.

The wildcard accepts any text in the URL.

Example:

| Folder | URL example | Text that the wildcard catches |
| --- | --- | --- |
| `src/app/dashboard/plants/[id]/page.tsx` | `/dashboard/plants/abc123` | `abc123` |
| `src/app/dashboard/plants/[id]/page.tsx` | `/dashboard/plants/xyz789` | `xyz789` |

One file serves all plants.

The file is a template.

The template does not contain plant data.

The URL supplies the value.

The page receives the value and finds the correct plant in the database.

This is why the plant page has only one file.

---

## Part 4 - How the page changes (the render)

React runs the component function many times.

One run of the function makes one version of the page.

One run is one **render**.

The word "render" is a technical name in this document.

The render cycle has three steps:

1. React runs the component function.
2. The function returns JSX.
3. React updates the page to match the JSX.

When data changes, React runs the function again.

The function makes a fresh version of the page.

React compares the new version with the old version.

React changes only the parts that differ.

The user never tells React which part to change.

The user only changes the data.

React does the rest.

---

## Part 5 - Why the component needs state

A normal variable lives only inside one function run.

Example - this component does not work:

```tsx
function Counter() {
  let count = 0;                 // A normal variable.
  const addOne = () => { count = count + 1; };
  return <button onClick={addOne}>Count: {count}</button>;
}
```

Follow what happens:

1. React runs `Counter`.
2. The function creates a new `count` with the value `0`.
3. The function returns the button.
4. The function ends.
5. The variable `count` is gone.
6. The user presses the button.
7. The code changes `count` to `1`.
8. No one can see the new value. The page shows nothing new.
9. If React runs the function again, the function creates `count` with the value `0` again.

The problem: the value has no place to live between runs.

The component needs a place where the value stays alive.

React gives this place.

The name of this place is **state**.

The word "state" is a technical name in this document.

---

## Part 6 - useState

`useState` is a React function.

The user calls `useState` to ask React for state.

The word "hook" is a technical name for these React functions.

`useState` is a hook.

Other hooks are `useEffect`, `useRef`, and `useCallback`.

A hook is a function that React remembers between runs.

`useState` returns two values:

1. The current value.
2. A function that changes the value.

Example:

```tsx
const [count, setCount] = useState(0);
```

Read this line like this:

- `useState(0)` asks React for state. The start value is `0`.
- `count` is the current value.
- `setCount` is the change function.
- The pair `[count, setCount]` is a pattern. It takes the two returned values and gives them names. The technical name is **destructuring**.

The user does not change the value directly.

The user calls the change function:

```tsx
setCount(count + 1);
```

Follow what happens:

1. The user calls `setCount`.
2. React stores the new value.
3. React runs the component again.
4. The component calls `useState(0)` again.
5. React ignores the `0`.
6. React gives back the stored value.
7. The page shows the new value.

The start value matters only on the first run.

---

## Part 7 - useEffect

Some work must happen after the page is ready.

Examples of this work:

- A timer that runs every two seconds.
- A listener that waits for new data.
- A request to a server.

The technical name for this work is a **side effect**.

The component does not do side effects during the render.

The render must stay clean and fast.

The component gives the side effect to `useEffect`.

`useEffect` has two parts:

1. The work function.
2. The dependency array.

The work function contains the side effect.

The **dependency array** is a list of values.

The word "dependency array" is a technical name in this document.

The dependency array tells React when to run the work.

| Dependency array | When React runs the work |
| --- | --- |
| No array | After every render. |
| `[]` | One time, after the first render. |
| `[id]` | When the value `id` changes. |

Follow what happens with `[id]`:

1. Render one. React sees `id` with the value `abc123`. React runs the work.
2. Render two. The component runs again. `id` still has the value `abc123`. React compares the values. The values are the same. React does not run the work.
3. Render three. `id` now has the value `xyz789`. The values are different. React runs the work.

The dependency array is a comparison list.

React compares each value in the array with the value from the previous run.

### The cleanup function

The work function can return a second function.

The second function is the **cleanup**.

The word "cleanup" is a technical name in this document.

React runs the cleanup in two cases:

1. Before React runs the work again.
2. When the component ends.

The cleanup stops the side effect.

Example - a listener:

```tsx
useEffect(() => {
  const stopListening = listenForData();   // Start the listener.
  return stopListening;                    // The cleanup stops the listener.
}, [id]);
```

Without the cleanup, every new run adds a second listener.

The page would run many listeners.

The cleanup prevents this.

---

## Part 8 - The rules of hooks

Three rules apply to all hooks:

1. Call hooks at the top of the component.
2. Do not call hooks inside conditions or loops.
3. Call hooks in the same order on every render.

Why these rules exist:

React remembers hooks by their position in the function.

React does not remember hooks by name.

The first `useState` call is position one.

The second `useState` call is position two.

Example of an error - a hook inside a condition:

```tsx
if (isAdmin) {
  const [x] = useState(1);   // Error.
}
```

Follow what happens:

1. Render one. `isAdmin` is `true`. React stores state at position one.
2. Render two. `isAdmin` is `false`. The component does not call the hook.
3. Every hook after this position moves to the wrong position.
4. React gives the wrong values to the hooks.

The data becomes corrupt.

The user does not see an error message.

The page shows wrong values.

This is why the rules of hooks are strict.

---

## Part 9 - Props

A component receives values from the parent component.

These values are **props**.

The word "prop" is a technical name in this document.

Props are function arguments.

Example from this project:

```tsx
<TelemetryChart data={telemetry} />
```

Read this line like this:

- `TelemetryChart` is the component.
- `data` is a prop.
- `{telemetry}` is the value of the prop.

The component `TelemetryChart` receives the prop:

```tsx
function TelemetryChart({ data }: { data: TelemetryReading[] }) {
  // The component uses the prop here.
}
```

The rules of data flow:

- Data flows down, from parent to child.
- Data does not flow up.
- A child cannot change the prop.
- A child can change its own state.

If the parent state changes, the parent renders again.

The parent gives a new prop value to the child.

The child renders again.

This is how the page stays in sync.

---

## Part 10 - useRef and useCallback

### useRef

`useRef` is a hook.

`useRef` keeps a value alive between renders.

`useRef` does not start a new render when the value changes.

This is the difference from `useState`:

| Hook | Starts a new render on change | Use for |
| --- | --- | --- |
| `useState` | Yes | Values that the page shows. |
| `useRef` | No | Values that the code uses but the page does not show. |

Example from this project - the chart object:

```tsx
const chartRef = useRef<uPlot | null>(null);
```

The chart object stays alive between renders.

React does not create the chart again on every render.

### useCallback

`useCallback` is a hook.

`useCallback` keeps the same function between renders.

A normal function is new on every render.

A new function makes a dependency array change.

A changed dependency array runs the work again.

The user can use `useCallback` to stop this.

`useCallback` creates a new function only when a dependency changes.

Example:

```tsx
const fetchMetrics = useCallback(() => {
  // Request the metrics from the server.
}, [id]);
```

The function stays the same while `id` stays the same.

The effect does not run again without a reason.

---

## Part 11 - Two common errors

### Error one - the old value

The work function uses a value.

The value is not in the dependency array.

The work function always sees the old value.

Example:

```tsx
useEffect(() => {
  sendRequest(plant.setpoint);   // Uses setpoint.
}, [id]);                        // But the array does not list setpoint.
```

Fix: add the value to the array.

```tsx
useEffect(() => {
  sendRequest(plant.setpoint);
}, [id, plant.setpoint]);
```

### Error two - the endless loop

The work function changes a value.

The value is in its own dependency array.

Follow what happens:

1. React runs the work.
2. The work changes the value.
3. The value is in the array.
4. The array is different now.
5. React runs the work again.
6. The work never ends.

Fix: remove the value from the array.

Or change the design, so the work does not change the array values.

---

## Part 12 - Build a small page from zero

The user builds a counter page.

The user does these steps in order:

**Step 1.** Create a folder: `src/app/counter`.

**Step 2.** Create a file: `src/app/counter/page.tsx`.

**Step 3.** Write this line at the top of the file:

```tsx
"use client";
```

This line tells Next.js that the page runs in the browser.

The page needs the browser because it uses a button.

The technical name for this page is a **client component**.

A file without this line is a **server component**.

A server component runs on the server.

A server component cannot use buttons, timers, or listeners.

**Step 4.** Import the hook:

```tsx
import { useState } from "react";
```

**Step 5.** Write the component:

```tsx
export default function CounterPage() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

**Step 6.** Save the file.

**Step 7.** Start the development server:

```
npm run dev
```

**Step 8.** Open this URL in the browser:

```
http://localhost:3000/counter
```

The user presses the button.

The number changes by one.

Follow what happens in the background:

1. The user presses the button.
2. The code calls `setCount`.
3. React stores the new value.
4. React runs the component again.
5. The component receives the new value from `useState`.
6. React updates the button text.

This is the complete cycle.

Every interactive page in this project uses this cycle.

---

## Part 13 - How this project uses the rules

The plant page is `src/app/dashboard/plants/[id]/page.tsx`.

The page uses the parts of this document:

| Concept from this document | Where the plant page uses it |
| --- | --- |
| The wildcard | `[id]` in the folder name. |
| State | `useState` for the plant, the telemetry, and the form values. |
| Side effects | Two `useEffect` calls for the two listeners. |
| The dependency array | `[id]` in both listeners. The listeners run once per plant. |
| The cleanup | `return () => unsub()` stops the listeners. |
| Props | `<TelemetryChart data={telemetry} />` passes data to the chart. |
| `useCallback` | `fetchMetrics` stays the same while the plant stays the same. |
| Client component | `"use client"` at the top of the file. |

The page does not have a refresh button for the data.

The listeners update the data.

The data updates the state.

The state updates the page.

---

## Part 14 - Tailwind: the styling system

Tailwind is a tool set for styling.

The project styles the elements with Tailwind.

The user does not write CSS files for the pages.

Tailwind gives the user a large set of class names.

Each class name applies one style rule.

The technical name for these class names is **utility class**.

The word "utility class" is a technical name in this document.

The user writes the utility classes in the `className` attribute.

The user must write `className` instead of `class`. Part 2 states this rule.

### How to read a class name

Example:

```tsx
<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
```

Read the string like this:

| Class name | Style rule |
| --- | --- |
| `rounded-xl` | The corner radius. |
| `border` | The border width. |
| `border-slate-200` | The border color. |
| `bg-white` | The background color. |
| `p-4` | The padding. |
| `shadow-sm` | The shadow size. |

A class name has two parts:

1. The property.
2. The value.

Examples:

| Class name | Property | Value |
| --- | --- | --- |
| `p-4` | Padding | Size four. |
| `bg-white` | Background color | White. |
| `text-sm` | Font size | Small. |
| `text-slate-900` | Text color | Dark slate. |
| `w-full` | Width | Full. |
| `flex` | Display | Flex. |

### The size scale

Tailwind has a fixed scale of sizes.

The scale has the values: `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`.

Examples: `p-1`, `p-2`, `p-4`, `p-8`, `gap-6`.

The user does not invent sizes. The user uses the scale.

### The colors of this project

The project uses a fixed set of colors.

The technical name for this set is **palette**.

The word "palette" is a technical name in this document.

| Color name | Use in this project |
| --- | --- |
| `blue` | The main accent. |
| `emerald` | Success and running states. |
| `red` | Errors and danger. |
| `amber` | Warnings. |
| `purple` | The secondary accent. |
| `slate` | The neutral grays. |
| `white` | The card background. |

The palette is fixed.

The user does not add colors to it.

### The layout classes

The project uses these classes for layout:

| Class name | Use |
| --- | --- |
| `flex` | A row of items. |
| `flex-col` | A column of items. |
| `grid` | A grid of items. |
| `items-center` | Center the items. |
| `justify-between` | Put space between the items. |
| `gap-4` | The space between the items. |
| `space-y-4` | The space between stacked items. |
| `w-full` | Full width. |
| `min-h-screen` | Full screen height. |

### The responsive prefixes

A prefix before the property states the screen width.

The technical name is **responsive prefix**.

The word "responsive prefix" is a technical name in this document.

| Prefix | Screen width |
| --- | --- |
| `md:` | Medium screens and above. |
| `lg:` | Large screens and above. |
| `xl:` | Extra large screens and above. |

The class applies from that width.

Example:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

- One column on small screens.
- Two columns on large screens.

### The state prefixes

A state prefix applies the class when the element is in a state.

The technical name is **state prefix**.

The word "state prefix" is a technical name in this document.

| Prefix | State |
| --- | --- |
| `hover:` | The mouse is over the element. |
| `focus:` | The element has the keyboard focus. |

Example:

```tsx
<button className="bg-blue-600 hover:bg-blue-700">
```

- The normal color is blue six hundred.
- The hover color is blue seven hundred.

### Where the styles live

The styles live in three places:

| Place | Content |
| --- | --- |
| `src/app/globals.css` | The Tailwind setup and the theme. |
| `src/components/ui.tsx` | The styles of the shared components. |
| The page files | The styles of the page layout. |

The user rarely changes `globals.css`.

The user does not create new CSS files for pages.

This project has no dark mode. The pages use the light colors.

---

## Part 15 - How to read an import

An import is a line at the top of a file.

The line brings code from another file into the current file.

The user must know three rules:

1. An import line has three parts: the word `import`, the names, and the source.
2. The source is a package or a file path.
3. The names are the items that the current file receives.

The user imports from packages with the package name:

```tsx
import { useState } from "react";
```

- `react` is a package.
- `useState` is a named import.

The user imports from project files with the path:

```tsx
import { db, rtdb } from "@/lib/firebase/client";
```

- `@/` means the `src` folder.
- `@/lib/firebase/client` means the file `src/lib/firebase/client.ts`.
- The user does not write the extension `.ts` or `.tsx`.

The project does not use relative paths for project files. The project uses the `@/` form.

Two kinds of import:

| Kind | Form | Use |
| --- | --- | --- |
| Named | `import { A, B } from "source";` | Several items from one file. |
| Default | `import A from "source";` | The main item of a file. |

A page file has one default export.

Example: `export default function PlantDetailPage()`.

Next.js requires the default export.

A library file has named exports.

Examples: `export function Card(...)`, `export const db = ...`.

The user can import a type with the same form:

```tsx
import { PlantData, TelemetryReading } from "@/lib/simulator";
```

Types compile away to nothing.

Types exist for the user and the tools. They do not exist in the browser.

The import order in this project:

1. The packages first.
2. The `@/` project files second.

The user follows this order.

### The sources of imports

| Source | What it gives | Examples |
| --- | --- | --- |
| `react` | The hooks and the types | `useState`, `useEffect`, `useRef`, `useCallback`, `use` |
| `firebase/firestore` | The Firestore functions | `doc`, `collection`, `onSnapshot`, `updateDoc`, `serverTimestamp` |
| `firebase/database` | The Realtime Database functions | `ref`, `onValue`, `query`, `limitToLast` |
| `firebase/auth` | The login functions | `signOut`, `onAuthStateChanged`, `User` |
| `axios` | The HTTP client | `axios.get`, `axios.post` |
| `next/navigation` | The page navigation | `redirect`, `useRouter`, `usePathname` |
| `next/link` | The link component | `Link` |
| `next/server` | The server response | `NextResponse` |
| `@/components/ui` | The shared UI components | `Card`, `Button`, `Badge`, `StatCard`, `Input`, `Field` |
| `@/components/TelemetryChart` | The live chart | `TelemetryChart` |
| `@/lib/firebase/client` | The browser Firebase connections | `auth`, `db`, `rtdb` |
| `@/lib/firebase/admin` | The server Firebase connections | `adminAuth`, `adminDb`, `adminRtdb` |
| `@/lib/auth/AuthProvider` | The login state | `useAuth`, `AuthProvider` |
| `@/lib/simulator` | The plant types and the simulation | `PlantData`, `TelemetryReading`, `PlantSimulator` |
| `@/lib/metrics/performance` | The metrics calculation | `calculatePerformanceMetrics`, `PerformanceMetrics` |

---

## Part 16 - TypeScript: the types in this project

The project uses TypeScript.

TypeScript is JavaScript with types.

A type states the kind of a value.

The main types in this project:

| Type | Meaning | Example |
| --- | --- | --- |
| `string` | Text | `"abc123"` |
| `number` | A number | `1200` |
| `boolean` | `true` or `false` | `isAdmin` |
| `string[]` | An array of text values | A list of ids |
| `null` | No value | `stepStartAt: null` |
| `undefined` | The value is absent | A field that does not exist |

### The union

A union states one of several values:

```tsx
type PlantStatus = "STOPPED" | "RUNNING" | "FAULT";
```

The value must be one of the three texts.

TypeScript checks this.

### The interface

An interface describes the shape of an object:

```tsx
interface PlantData {
  id: string;
  name: string;
  status: "STOPPED" | "RUNNING" | "FAULT";
}
```

The project defines a shape once in `src/lib/simulator/index.ts`.

Every file imports the shape.

This keeps the shapes consistent.

### The optional field

The question mark makes a field optional:

```tsx
stepStartAt?: number | null;
```

The field may be absent.

The field may be a number.

The field may be null.

### The optional chaining

The user reads `plant?.stepStartAt` like this:

- If `plant` exists, read `stepStartAt`.
- If `plant` is null, the result is `undefined`.
- The code does not crash.

Example from the code:

```tsx
if (plant?.stepStartAt) {
  fetchMetrics();
}
```

### The cast

The user writes `as` to state the shape:

```tsx
const data = { id: snap.id, ...snap.data() } as PlantData;
```

- `snap.data()` returns the fields as a generic object.
- The user adds the id.
- The user tells TypeScript the shape with `as PlantData`.

The user must use `as` only for real shapes.

The user must not use `as any`.

The user must not use `@ts-ignore`.

### The promise

A promise is a value that arrives later.

The route params are promises in this version of Next.js.

The hook `use` waits for the promise:

```tsx
const { id } = use(params);
```

### The generic type

The user reads `axios.get<PerformanceMetrics>(...)` like this:

- The angle brackets state the shape of the response.
- Axios checks the response against the shape.

### The error messages

TypeScript finds errors before the user runs the code.

The user must read the error message.

The error message states the file and the line.

If TypeScript reports an error, the user must fix the type.

The user must not ignore the error.

---

## Part 17 - The project map for contributors

The project has five work areas:

| Area | Folder | Job |
| --- | --- | --- |
| Pages | `src/app/.../page.tsx` | One page per URL. |
| Layouts | `src/app/layout.tsx`, `src/app/dashboard/layout.tsx` | The shared shell around pages. |
| API routes | `src/app/api/.../route.ts` | The backend endpoints. |
| Components | `src/components/` | The reusable UI. |
| Library | `src/lib/` | The non-UI logic. |

The rules for where the user puts code:

- A page shows data. The page file is in `src/app`.
- A component is reusable. The component file is in `src/components`.
- The database connections are in `src/lib/firebase`.
- The simulation logic is in `src/lib/simulator`.
- The metrics logic is in `src/lib/metrics`.
- The server-side work is in `src/app/api`.
- The setup data is in `scripts/seed.ts`. The user runs it with `npx tsx scripts/seed.ts`.

The user must not change these folders:

| Folder | Reason |
| --- | --- |
| `node_modules` | The installed packages. The computer creates it. |
| `.next` | The build output. The computer creates it. |
| `package-lock.json` | The exact package versions. `npm` creates it. |
| `.env.local` | The secrets. The user must not commit it. |

---

## Part 18 - The design patterns of this project

The project uses the same patterns in every page.

The user must follow them.

### Pattern one - the component tree

- One page is one component tree.
- The page is the root.
- The page uses small components below it.
- One component has one job.

Example from the plant list page:

```tsx
Page
├── PageHeader (the title and the action)
├── Card (one plant)
│   ├── StatusBadge (the status)
│   └── Button (the action)
```

### Pattern two - data down, events up

- State lives in the page.
- The page passes values down to children as props.
- The page passes functions down to children as props.
- The child calls the function when the user acts.
- The child does not write to the database itself.

### Pattern three - the early return

- If the data is not ready, the page shows a loader and stops.
- The early return must come after all hooks. Part 8 states why.

Example:

```tsx
if (!plant) {
  return <PageLoader text="Loading plant details..." />;
}
```

### Pattern four - the conditional render

- `{isAdmin && <Button>...}` shows the element only when `isAdmin` is true.
- The ternary shows one of two elements.

Example:

```tsx
{plant.status !== "RUNNING" ? (
  <Button onClick={...}>Start Simulation</Button>
) : (
  <Button onClick={...}>Stop</Button>
)}
```

### Pattern five - the controlled input

- The input value comes from state.
- The `onChange` function writes back to state.
- The user types one character.
- The state changes.
- The page renders again.
- The input shows the new state.

Example:

```tsx
<Input
  value={kp}
  onChange={(e) => setKp(Number(e.target.value))}
/>
```

### Pattern six - the listener

- The page subscribes to data in an effect.
- The callback puts the data into state.
- The effect returns the cleanup.
- The dependency array has the stable values.

Example:

```tsx
useEffect(() => {
  const unsub = onSnapshot(doc(db, "plants", id), (snap) => {
    setPlant({ id: snap.id, ...snap.data() } as PlantData);
  });
  return () => unsub();
}, [id]);
```

### Pattern seven - the handler

- A handler is a function that starts with the word `handle`.
- The handler changes state or writes data.
- The handler is a callback. The user gives it to a component. The component calls it when the user acts.

The handlers in this project:

| Handler | Action | What it does |
| --- | --- | --- |
| `handleStatusChange` | Start or Stop | Writes the status to Firestore. |
| `handleReset` | Reset | Calls the reset API route. |
| `handleSaveConfig` | Save the form | Writes the PID values to Firestore. |
| `handleLogout` | Logout | Signs out and goes to the login page. |

### Pattern eight - the pure logic in lib

- The files in `src/lib` do not contain JSX.
- The files in `src/lib` do not touch the page.
- The simulator and the metrics receive values and return values.
- The user can test them without a browser.

### Pattern nine - the server for secrets

- The browser can read the public config.
- The browser must not read secrets.
- The server does the work that needs secrets.
- The browser calls an API route for this work.
- The tick route and the reset route follow this pattern.

### Pattern ten - the layers of security

- The UI hides the controls.
- The Firebase rules reject the writes.
- The API routes verify the token and the role.

The user must not remove a layer.

The user must apply a new action to all layers.

---

## Part 19 - The shared UI components

The file `src/components/ui.tsx` defines the shared UI.

The components have no logic.

The components show style and receive props.

The user imports them from `@/components/ui`.

### The component table

| Component | What it shows | Common props |
| --- | --- | --- |
| `Card` | A white box with a border | `className`, `children` |
| `StatCard` | A number with a label | `label`, `value`, `tone` |
| `Badge` | A small colored label | `tone`, `pulse`, `children` |
| `StatusBadge` | The plant status | `status` |
| `Button` | A button | `variant`, `size`, `loading`, `disabled`, `onClick`, `type` |
| `Input` | A text or number field | `value`, `onChange`, `disabled`, `type`, `step` |
| `Select` | A select box | `value`, `onChange`, `disabled` |
| `Field` | A label around an input | `label`, `hint`, `children` |
| `Alert` | A message box | `tone`, `children` |
| `Spinner` | A loading circle | `size` |
| `PageLoader` | A full loading state | `text` |
| `EmptyState` | A message when there is no data | `title`, `description`, `action` |
| `PageHeader` | The page title and the actions | `title`, `subtitle`, `actions` |

### The tone values

| Tone | Color |
| --- | --- |
| `green` | Emerald |
| `red` | Red |
| `blue` | Blue |
| `purple` | Purple |
| `yellow` | Amber |
| `gray` | Slate |

### The button variants

| Variant | Use |
| --- | --- |
| `primary` | The main action |
| `secondary` | A normal action |
| `success` | Start a process |
| `warning` | Stop a process |
| `danger` | Delete or reset |
| `ghost` | A quiet action |

### The rules

- The user must give the `key` prop to the items in a list. Example: `key={plant.id}`.
- The user must use `children` for the inner content.
- The `loading` prop shows a small circle and disables the button.
- The user must use the shared components for repeated elements.
- The user must not repeat the classes of the shared components.

Example:

```tsx
<Button variant="success" loading={saving} onClick={handleStart}>
  Start Simulation
</Button>
```

---

## Part 20 - The databases

The project uses two databases.

| Database | Job | Browser import | Server import |
| --- | --- | --- | --- |
| Firestore | The plant settings, the users, the roles | `db` | `adminDb` |
| Realtime Database | The telemetry stream | `rtdb` | `adminRtdb` |

The general rule:

- Structured data goes to Firestore.
- Fast streaming data goes to the Realtime Database.

The rule for the user:

- A page or a component imports from `@/lib/firebase/client`.
- An API route imports from `@/lib/firebase/admin`.
- The browser code must not import from `@/lib/firebase/admin`.

The admin file reads the private key.

The private key is a secret.

The browser must not receive the private key.

### The Firestore functions

| Function | What it does |
| --- | --- |
| `doc(db, "plants", id)` | Makes a reference to one document. |
| `collection(db, "plants")` | Makes a reference to a collection. |
| `onSnapshot(...)` | Listens for changes. The callback runs on every change. |
| `updateDoc(...)` | Changes some fields of a document. |
| `getDoc(...)` | Reads a document one time. |
| `serverTimestamp()` | The server time. The user must use it for time fields. |

### The Realtime Database functions

| Function | What it does |
| --- | --- |
| `ref(rtdb, "telemetry/abc123")` | Makes a reference to a path. |
| `onValue(ref, callback)` | Listens for changes. The callback runs on every change. |
| `push(ref, value)` | Adds a new item with an auto id. |
| `once("value")` | Reads one time. |
| `query(ref, limitToLast(50))` | Limits the data to the last 50 items. |
| `remove()` | Deletes the data at the path. |

### The security rules

- The files `firestore.rules` and `database.rules.json` state who may read and write.
- Firebase checks every read and write against the rules.
- The user must not depend on hidden buttons. The rules are the real protection.
- The user must update the rules when the user adds a new write path.

### The procedure - write a change to a plant

1. Make a reference with `doc`.
2. Call `updateDoc`.
3. Pass the new fields.
4. Use `serverTimestamp()` for the time.

Example:

```tsx
await updateDoc(doc(db, "plants", id), {
  status: "RUNNING",
  stepStartAt: Date.now(),
  updatedAt: serverTimestamp(),
});
```

---

## Part 21 - Authentication

The project uses Firebase Authentication.

The users sign in with email and password.

### The login state

- The file `src/lib/auth/AuthProvider.tsx` keeps the login state.
- The component `AuthProvider` wraps the whole application in `src/app/layout.tsx`.
- The component listens to the auth state with `onAuthStateChanged`.
- The user reads the state with the hook `useAuth`.

`useAuth()` returns three values:

| Value | Meaning |
| --- | --- |
| `user` | The signed-in identity, or `null`. |
| `profile` | The role record, or `null`. |
| `loading` | `true` while the state loads. |

The profile has three fields:

| Field | Meaning |
| --- | --- |
| `uid` | The id of the user. |
| `email` | The email of the user. |
| `role` | `ADMIN` or `VIEWER`. |

### The roles

- `ADMIN` may change the data: start, stop, reset, tune, create plants.
- `VIEWER` may only read.

The page computes the guard:

```tsx
const isAdmin = profile?.role === "ADMIN";
```

### The layers of protection

The project protects the actions in three layers:

1. The UI hides the controls from viewers.
2. The Firebase rules reject the writes of viewers.
3. The API routes verify the token and the role.

The user must apply all three layers to a new action.

### The token

- The token proves the identity of the user to the server.
- The browser obtains the token with `user.getIdToken()`.
- The browser sends the token in the header `Authorization`.
- The server verifies the token with `adminAuth.verifyIdToken`.

The header has this form:

```
Authorization: Bearer <token>
```

The word `Bearer` is fixed.

The server accepts only this form.

Example from the reset route:

```tsx
const authHeader = req.headers.get("authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return NextResponse.json({ error: "Unauthorized caller" }, { status: 401 });
}
const idToken = authHeader.split("Bearer ")[1];
const decoded = await adminAuth.verifyIdToken(idToken);
```

### The seed accounts

The file `scripts/seed.ts` creates the default accounts:

| Account | Role |
| --- | --- |
| `admin@plant.local` | ADMIN |
| `viewer@plant.local` | VIEWER |

The API route `/api/auth/signup` creates more accounts.

### The procedure - add a protected action

1. In the page: hide the control with `{isAdmin && ...}`.
2. In the page: add `if (!isAdmin) return;` at the start of the handler.
3. In the rules: allow only the ADMIN role for the write path.
4. If the action uses an API route: verify the token and check the role in the route.

---

## Part 22 - The API routes

An API route is a backend endpoint.

An endpoint is a URL that the server accepts.

The route files live in `src/app/api`.

One folder is one endpoint.

The file `route.ts` exports the handler functions.

The function name is the HTTP method.

| Method | Use |
| --- | --- |
| `GET` | Read data. |
| `POST` | Create data or run an action. |

The wildcard folders work in the API routes too:

| Folder | Endpoint example |
| --- | --- |
| `src/app/api/plants/[id]/reset/route.ts` | `/api/plants/abc123/reset` |

The routes in this project:

| Route | Method | What it does |
| --- | --- | --- |
| `/api/tick` | POST | Runs the simulation for the running plants. |
| `/api/auth/signup` | POST | Creates a user. |
| `/api/plants/[id]/reset` | POST | Resets a plant. |
| `/api/plants/[id]/performance` | GET | Calculates the metrics. |
| `/api/dashboard/summary` | GET | Returns the summary for the overview page. |

### The structure of a route

1. Read the request.
2. Verify the identity.
3. Validate the input.
4. Do the work.
5. Return the response.

### The request

The route reads the header:

```tsx
const authHeader = req.headers.get("authorization");
```

The route reads the body:

```tsx
const body = await req.json();
```

The route receives the wildcard value:

```tsx
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
}
```

### The validation

The project uses the package `zod` for validation.

A schema describes the valid input:

```tsx
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "VIEWER"]),
});
```

The route checks the input against the schema:

```tsx
const parsed = signupSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid input", details: parsed.error.format() },
    { status: 400 }
  );
}
```

The route must check the input.

The route must not assume that the input is valid.

### The response

The route returns JSON:

```tsx
return NextResponse.json({ message: "Plant reset successfully" });
```

The status codes:

| Code | Meaning |
| --- | --- |
| `200` | The work is complete. This is the default. |
| `201` | The item is created. |
| `400` | The input is invalid. |
| `401` | The identity is not verified. |
| `403` | The identity is verified, but the role is not allowed. |
| `404` | The item does not exist. |
| `500` | The server failed. |

### When the user must use an API route

The user must use an API route when:

- The work needs a secret.
- The work must run on the server.
- The browser must not do the work directly.

The user may write directly to Firestore from the browser for simple changes.

The plant page does this for the status and the PID values.

---

## Part 23 - The environment variables

The environment variables are the configuration values.

The file `.env.local` holds the values.

The project reads the values from `process.env`.

Two kinds of variable:

| Kind | Where the value goes | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_...` | The browser and the server | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| Other names | The server only | `FIREBASE_ADMIN_PRIVATE_KEY` |

The rules:

- A name with `NEXT_PUBLIC_` goes into the browser code.
- The user must not put secrets in these names.
- A name without the prefix stays on the server.
- The user must use this kind for secrets.
- The user must not commit `.env.local`.
- The user must not write a private key in a source file.
- The file `.env.example` lists the required names. The user copies the names into `.env.local`.

The required variables:

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | The web app key. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | The auth domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | The project id. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | The storage bucket. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | The sender id. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | The app id. |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | The Realtime Database url. |
| `FIREBASE_ADMIN_PROJECT_ID` | The admin project id. |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | The admin service account email. |
| `FIREBASE_ADMIN_PRIVATE_KEY` | The admin private key. |

Where the variables are used:

- `client.ts` reads the `NEXT_PUBLIC_` variables.
- `admin.ts` reads the `FIREBASE_ADMIN_` variables.

The private key is the most important secret.

The browser must not receive it.

---

## Part 24 - Tailwind in this project

This part explains how the project uses Tailwind.

The user must make new code look like the existing code.

### The page shell

The dashboard has a fixed shell:

| Element | Classes |
| --- | --- |
| The sidebar | `bg-slate-900 text-white` |
| The content area | `bg-slate-50` |
| The header | `bg-white/90 backdrop-blur` |

The sidebar is dark. The content area is light.

### The shared components

The shared components hide the styles.

The user must not repeat the classes of the shared components.

The user builds the page with the shared components:

```tsx
<Card className="space-y-4">
  <StatCard label="Rise Time" value="800 ms" tone="blue" />
</Card>
```

The user styles the composition with utility classes.

The user styles the grid, the spacing, and the layout.

The user does not restyle the components.

### The repeated style patterns

The project uses these patterns:

| Pattern | Classes |
| --- | --- |
| The card | `rounded-xl border border-slate-200 bg-white p-4 shadow-sm` |
| The page title | `text-2xl font-bold text-slate-900` |
| The small label | `text-xs font-medium uppercase tracking-wider text-slate-500` |
| The numbers | `font-mono text-xs tabular-nums` |
| The live dot | `animate-pulse rounded-full` |
| The spinner | `animate-spin rounded-full` |

The numbers use the mono font.

The mono font keeps the digits the same width.

The chart and the plant values use this pattern.

### The status colors

The status has fixed colors:

| Status | Color |
| --- | --- |
| `RUNNING` | Emerald |
| `FAULT` | Red |
| `STOPPED` | Gray |

The component `StatusBadge` applies these colors.

The user must not use other colors for the status.

### The tone props

The shared components take a `tone` or `variant` prop:

| Prop | Values |
| --- | --- |
| `tone` (Badge, StatCard) | `green`, `red`, `gray`, `blue`, `purple`, `yellow` |
| `variant` (Button) | `primary`, `secondary`, `success`, `warning`, `danger`, `ghost` |

The user selects the prop value.

The user does not write new color classes for these elements.

### The responsive patterns

The project uses these patterns:

| Pattern | Classes |
| --- | --- |
| The plant grid | `grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3` |
| The two-column layout | `grid grid-cols-1 lg:grid-cols-2 gap-6` |
| The header row | `flex flex-col gap-4 md:flex-row md:items-center` |

### The rules for the user

- The user must use the palette of the project.
- The user must use the size scale of Tailwind.
- The user must use the shared components for repeated elements.
- The user must use the existing class patterns.
- The user must not add a new color to the theme without a reason.
- The user must not create a new CSS file for a page.
- If the user repeats a group of classes three times, the user moves the group into `ui.tsx`.

---

## Part 25 - The procedures for common tasks

### Procedure one - add a new page

1. Create a folder in `src/app`. The folder name is the URL.
2. Create the file `page.tsx` in the folder.
3. Add `"use client"` when the page uses buttons, timers, or listeners.
4. Import the needed items.
5. Add the state.
6. Add the listeners or the data fetch.
7. Return the JSX.
8. Link the page from another page with `Link`.
9. Run `npm run dev` and open the URL.

### Procedure two - add a new component

1. Create a file in `src/components`.
2. Export the function.
3. Define the props.
4. Return the JSX.
5. Import the component where the user uses it.
6. Give the component one job. If the component does two jobs, split it.

### Procedure three - add an API route

1. Create a folder in `src/app/api`. The folder name is the endpoint.
2. Create the file `route.ts`.
3. Export the method functions (`GET`, `POST`).
4. Verify the identity.
5. Validate the input with zod.
6. Do the work.
7. Return the response.
8. Test the route.

### Procedure four - add a live listener

1. Add the state for the data.
2. Add an effect with a stable dependency array.
3. Subscribe in the effect.
4. Put the received data into the state.
5. Return the cleanup.
6. Check that the array does not change on every render.

### Procedure five - add an admin-only action

1. Hide the control with `{isAdmin && ...}`.
2. Guard the handler with `if (!isAdmin || !plant) return;`.
3. Update the rules for the write path.
4. If the action uses an API route, verify the token and the role in the route.

---

## Part 26 - The checklist before the user submits changes

The user must run these checks:

1. Run `npm run lint`. The style check must pass.
2. Run `npm run build`. The compile check must pass.
3. Open the changed pages in the browser.
4. Test with the admin account.
5. Test with the viewer account.
6. Check the console for error messages.

The user must not:

- Use `as any` or `@ts-ignore`.
- Put a secret in a source file.
- Change `node_modules` or `.next`.
- Remove the cleanup of a listener.
- Remove a security layer.

The user must read the error messages.

The error messages state the file and the line.

---

## Part 27 - Word meanings

This document gives one meaning to each word.

The user must read these meanings as fixed.

| Word | Meaning in this document |
| --- | --- |
| The user | The person who reads this document. |
| The browser | The program that shows web pages. |
| The page | The web page in the browser. |
| The project | The `plant-dashboard` files. |
| Value | A number or a text that data contains. |
| Run | Execute the function one time. |
| Render | One run of the component function. |
| Change | Make different. |
| Store | Keep for later use. |
| Return | Give back as the result. |
| Receive | Get from the caller. |
| Component | A function that returns HTML. |
| Hook | A React function that React remembers between runs. |
| State | A value that React keeps alive between renders. |
| Prop | A value that a parent gives to a child component. |
| Side effect | Work that must happen after the page is ready. |
| Dependency array | A list that tells React when to run the work. |
| Cleanup | A function that stops the side effect. |
| Wildcard | A folder name in brackets that accepts any URL text. |
| JSX | HTML inside JavaScript code. |
| Client component | A page that runs in the browser. |
| Server component | A page that runs on the server. |
| Destructuring | The pattern that takes two returned values and names them. |
| React | The tool set that builds pages with components. |
| Next.js | The tool set that turns files into URLs. |
| Import | A line that brings code from another file into the current file. |
| Export | A line that makes code available to other files. |
| Named import | An import that receives one or more named items. |
| Default import | An import that receives the main item of a file. |
| Package | A set of code that the user installs. |
| Type | The kind of a value. |
| Interface | A set of named fields that describe one object. |
| Union | A type that states one of several possible values. |
| Handler | A function that runs when the user performs an action. |
| Callback | A function that the user gives to another function. |
| Guard | A check that stops the code when a condition is false. |
| Collection | A group of documents in Firestore. |
| Document | One item in a Firestore collection. |
| Listener | A function that waits for a change and then runs. |
| Subscribe | Start a listener. |
| Query | A request that finds specific data. |
| Token | A text that proves the identity of the user. |
| Role | The permission level of the user. |
| API route | A file that forms a backend endpoint. |
| Endpoint | A URL that the server accepts. |
| Server | The computer that runs the project code. |
| Client | The browser on the computer of the user. |
| Secret | A value that only the server must know. |
| Environment variable | A value that the project reads from the environment. |
| Schema | A description of the shape of valid input. |
| Lint | A check that finds style errors in the code. |
| Build | A check that compiles the project. |
| Status code | The number that states the result of a request. |
| Stream | A continuous flow of data. |
| Utility class | A Tailwind class name that applies one style rule. |
| Palette | The set of colors that the project uses. |
| Prefix | The first part of a class name. |
| Responsive prefix | A prefix that states the screen width. |
| State prefix | A prefix that states the state of the element. |
| Mono font | A font where all digits have the same width. |
