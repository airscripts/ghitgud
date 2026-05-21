interface Label {
  name: string;
  color: string;
  newName?: string;
  description: string;
}

interface Profile {
  repo?: string;
  token?: string;
}

interface CredentialsFile {
  repo?: string;
  token?: string;
  activeProfile?: string;
  profiles?: Record<string, Profile>;
}

interface ProfileRcFile {
  profile?: string;
}

const normalizeLabel = (label: Label) => ({
  name: label.name,
  color: label.color,
  description: label.description,
});

export type { Label };
export type { Profile };
export type { CredentialsFile };
export type { ProfileRcFile };
export { normalizeLabel };
