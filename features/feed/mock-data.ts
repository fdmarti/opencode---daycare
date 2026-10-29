// Screaming architecture: this mock data belongs to the feed domain.
// Repo rule: code in English, visible copy (strings) in Spanish.

export type PostType = "achievement" | "activity" | "announcement";

export interface Post {
  id: string;
  type: PostType;
  /** Child name for the initial avatar; announcements use a megaphone icon. */
  childName: string;
  time: string;
  /** Visible copy, e.g. "publicado por vos". */
  publishedBy: string;
  /** Visible copy, e.g. "familia de Mateo" | "toda la sala". */
  recipient: string;
  /** Post body, verbatim copy from the mockup. */
  text: string;
  /** Only for type "activity". */
  photoCaption?: string;
  hearts: number;
  comments: number;
}

export const mockPosts: Post[] = [
  {
    id: "post-logro-mateo",
    type: "achievement",
    childName: "Mateo",
    time: "14:20",
    publishedBy: "publicado por vos",
    recipient: "familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    hearts: 3,
    comments: 1,
  },
  {
    id: "post-actividad-mateo",
    type: "activity",
    childName: "Mateo",
    time: "09:40",
    publishedBy: "publicado por vos",
    recipient: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoCaption: "Foto · pintando con témperas",
    hearts: 5,
    comments: 2,
  },
  {
    id: "post-anuncio-sala",
    type: "announcement",
    childName: "Anuncio general",
    time: "07:50",
    publishedBy: "publicado por vos",
    recipient: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    hearts: 8,
    comments: 0,
  },
];
