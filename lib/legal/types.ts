export type PolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  listItems?: string[];
};

export type PolicyDocument = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: PolicySection[];
};
