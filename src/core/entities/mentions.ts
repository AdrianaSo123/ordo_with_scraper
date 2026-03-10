export type MentionCategory = "practitioner" | "chapter" | "framework";

export interface MentionItem {
  id: string;
  name: string;
  category: MentionCategory;
  description?: string;
}

export const PRACTITIONERS: MentionItem[] = [
  {
    id: "fred-brooks",
    name: "Fred Brooks",
    category: "practitioner",
    description: "The Mythical Man-Month, No Silver Bullet",
  },
  {
    id: "ward-cunningham",
    name: "Ward Cunningham",
    category: "practitioner",
    description: "Inventor of Wiki, Technical Debt metaphor",
  },
  {
    id: "edsger-dijkstra",
    name: "Edsger Dijkstra",
    category: "practitioner",
    description: "Structured Programming, GOTO considered harmful",
  },
  {
    id: "jakob-nielsen",
    name: "Jakob Nielsen",
    category: "practitioner",
    description: "Discount Usability, 10 Usability Heuristics",
  },
  {
    id: "erika-hall",
    name: "Erika Hall",
    category: "practitioner",
    description: "Just Enough Research, Mule Design",
  },
  {
    id: "dieter-rams",
    name: "Dieter Rams",
    category: "practitioner",
    description: "10 Principles for Good Design, Braun",
  },
  {
    id: "april-greiman",
    name: "April Greiman",
    category: "practitioner",
    description: "Postmodern Design, New Wave pioneer",
  },
  {
    id: "kent-beck",
    name: "Kent Beck",
    category: "practitioner",
    description: "Extreme Programming, TDD, Agile Manifesto",
  },
  {
    id: "martin-fowler",
    name: "Martin Fowler",
    category: "practitioner",
    description: "Refactoring, Patterns of Enterprise Architecture",
  },
  {
    id: "barbara-liskov",
    name: "Barbara Liskov",
    category: "practitioner",
    description: "Liskov Substitution Principle, CLU",
  },
  {
    id: "don-norman",
    name: "Don Norman",
    category: "practitioner",
    description: "The Design of Everyday Things, User-Centered Design",
  },
  {
    id: "steve-krug",
    name: "Steve Krug",
    category: "practitioner",
    description: "Don't Make Me Think, Common Sense Usability",
  },
];

export const CHAPTERS: MentionItem[] = [
  {
    id: "bauhaus-machine",
    name: "Bauhaus and the Machine",
    category: "chapter",
  },
  { id: "swiss-grid", name: "The Swiss Grid", category: "chapter" },
  {
    id: "postmodernism-rebellion",
    name: "Postmodernism and Rebellion",
    category: "chapter",
  },
  {
    id: "skeuomorphism-flat",
    name: "Skeuomorphism to Flat Design",
    category: "chapter",
  },
  { id: "fluid-era", name: "The Motion and Fluid Era", category: "chapter" },
  {
    id: "cognitive-foundations",
    name: "Cognitive Foundations",
    category: "chapter",
  },
  { id: "research-methods", name: "Research Methods", category: "chapter" },
  { id: "audit-to-sprint", name: "Audit-to-Sprint Loop", category: "chapter" },
  {
    id: "twelve-factor-llm",
    name: "12-Factor in the LLM Era",
    category: "chapter",
  },
  {
    id: "mcp-architecture",
    name: "MCP Next.js Architecture",
    category: "chapter",
  },
];

export const FRAMEWORKS: MentionItem[] = [
  { id: "twelve-factor", name: "12-Factor App", category: "framework" },
  { id: "solid", name: "SOLID Principles", category: "framework" },
  { id: "gof-patterns", name: "GoF Design Patterns", category: "framework" },
  {
    id: "nielsen-heuristics",
    name: "Nielsen's 10 Heuristics",
    category: "framework",
  },
  { id: "double-diamond", name: "Double Diamond", category: "framework" },
  {
    id: "lean-startup",
    name: "Lean Startup Methodology",
    category: "framework",
  },
  { id: "technical-debt", name: "Technical Debt", category: "framework" },
  { id: "observability", name: "O11y (Observability)", category: "framework" },
];

export const ALL_MENTIONS = [...PRACTITIONERS, ...CHAPTERS, ...FRAMEWORKS];
