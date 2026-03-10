/**
 * Use Case: Analyze Chapter Checklist
 * 
 * Enforces SRP by isolating the logic for identifying implementation 
 * checklist items within chapter markdown.
 */

export class AnalyzeChapterChecklist {
  /**
   * Extracts checklist items (formatted as - [ ] task) from raw content.
   */
  execute(content: string): string[] {
    const items = [...content.matchAll(/^- \[ \]\s+(.*)/gm)].map((m) =>
      m[1].trim(),
    );
    
    // De-duplicate items
    return Array.from(new Set(items));
  }
}
