export type PolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  listItems?: string[];
  /** Paragraphs rendered after listItems (e.g. a note that follows a bulleted list). */
  closingParagraphs?: string[];
};

export type PolicyDocument = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: PolicySection[];
};
