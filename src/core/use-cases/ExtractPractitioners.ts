/**
 * Use Case: Extract Practitioners from Chapter Content
 * 
 * Enforces SRP by isolating the business logic for identifying 
 * practitioners within book content.
 */

export class ExtractPractitioners {
  /**
   * Extracts practitioners (formatted as @PascalCaseName) from raw markdown content.
   */
  execute(content: string): string[] {
    const practitioners: string[] = [];
    const practMatch = [...content.matchAll(/@([A-Z][a-z]+[A-Z][a-z]+)/g)];
    
    for (const match of practMatch) {
      if (!practitioners.includes(match[1])) {
        practitioners.push(match[1]);
      }
    }
    
    return practitioners;
  }
}
