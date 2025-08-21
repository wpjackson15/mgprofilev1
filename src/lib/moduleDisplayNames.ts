// Display names for the schema elements
export const moduleDisplayNames: Record<string, string> = {
  interestAwareness: "Interest Awareness",
  canDoAttitude: "Can Do Attitude", 
  multiculturalNavigation: "Multicultural Navigation",
  selectiveTrust: "Selective Trust",
  socialJustice: "Social Justice",
  racialPride: "Racial Pride"
};

// Reverse mapping for lookups
export const displayNameToSchema: Record<string, string> = {
  "Interest Awareness": "interestAwareness",
  "Can Do Attitude": "canDoAttitude",
  "Multicultural Navigation": "multiculturalNavigation", 
  "Selective Trust": "selectiveTrust",
  "Social Justice": "socialJustice",
  "Racial Pride": "racialPride"
};

// Get display name from schema element
export function getDisplayName(schemaElement: string): string {
  return moduleDisplayNames[schemaElement] || schemaElement;
}

// Get schema element from display name
export function getSchemaElement(displayName: string): string {
  return displayNameToSchema[displayName] || displayName;
}
