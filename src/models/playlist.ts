import type { MediaType } from "./media";

export interface Playlist {
  id: string;
  name: string;
  mediaType: MediaType;
  dateCreated: number;
  dateUpdated: number;
}
