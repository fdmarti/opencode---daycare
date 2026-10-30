// Mock data for the "nueva publicación" modal, in the feed domain.
// Repo rule: code in English, visible copy (strings) in Spanish.

export interface PostRecipient {
  id: string;
  name: string; // "Mateo"
  initial: string; // "M"
  avatarBackground: string; // "#A9D9E8"
  avatarText: string; // "#1F7A93"
}

export const mockRecipients: PostRecipient[] = [
  {
    id: "recipient-mateo",
    name: "Mateo",
    initial: "M",
    avatarBackground: "#A9D9E8",
    avatarText: "#1F7A93",
  },
  {
    id: "recipient-sofia",
    name: "Sofía",
    initial: "S",
    avatarBackground: "#F4B8CC",
    avatarText: "#C44A7A",
  },
  {
    id: "recipient-benjamin",
    name: "Benjamín",
    initial: "B",
    avatarBackground: "#B9DEC4",
    avatarText: "#3E8B62",
  },
];
