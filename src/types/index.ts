interface Label {
  name: string;
  color: string;
  newName?: string;
  description: string;
}

const normalizeLabel = (label: Label) => ({
  name: label.name,
  color: label.color,
  description: label.description,
});

export type { Label };
export { normalizeLabel };