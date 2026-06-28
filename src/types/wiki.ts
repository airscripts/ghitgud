interface WikiPage {
  path: string;
  title: string;
  format: string;
  filename: string;
}

interface WikiPageContent extends WikiPage {
  content: string;
}

export type { WikiPage, WikiPageContent };
